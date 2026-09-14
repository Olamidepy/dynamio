import * as THREE from 'three';
import { Ball } from './Ball';
import { SplinePath } from '../path/SplinePath';
import { SphereColor } from '../types';

export class ChainSegment {
  public balls: Ball[] = []; // Ordered tail (0) to head (length - 1)
  public headDistance: number = 0; // Distance of the head ball (balls[balls.length - 1])
  public isMagnetPulling: boolean = false;

  constructor(headDistance: number = 0) {
    this.headDistance = headDistance;
  }

  public get headBall(): Ball | null {
    if (this.balls.length === 0) return null;
    return this.balls[this.balls.length - 1];
  }

  public get tailBall(): Ball | null {
    if (this.balls.length === 0) return null;
    return this.balls[0];
  }

  public get tailDistance(): number {
    if (this.balls.length === 0) return this.headDistance;
    return this.headDistance - (this.balls.length - 1) * 1.1;
  }

  /**
   * Recalculates exact pathDistance for all balls in this segment.
   * Distance is strictly path-locked: distance[k] = headDistance - (len - 1 - k) * diameter.
   * ZERO drifting, ZERO overlapping!
   */
  public updateBallDistances(diameter: number = 1.1) {
    const len = this.balls.length;
    for (let k = 0; k < len; k++) {
      this.balls[k].pathDistance = this.headDistance - (len - 1 - k) * diameter;
    }
  }
}

export interface InsertionResult {
  insertedIndex: number;
  ball: Ball;
  matched: boolean;
}

export class BallChain {
  public segments: ChainSegment[] = []; // Ordered from tail (segment 0) to head (segment N-1)
  public balls: Ball[] = []; // Flattened view for rendering and external systems
  public splinePath: SplinePath;
  public ballRadius: number = 0.55;
  public ballDiameter: number = 1.1;
  public totalSpawned: number = 0;
  public maxBallsToSpawn: number = 30;
  public isSpawningFinished: boolean = false;
  public sceneGroup: THREE.Group;

  // Magnetic attraction speed when gap boundary colors match
  public magneticPullSpeed: number = 16.0;

  // Knockback velocity for physical recoil when a ball hits the chain
  public knockbackVelocity: number = 0;

  // Ball object pool for performance
  private pool: Ball[] = [];
  private nextBallId: number = 1;

  // Callback for when a cascade match occurs after gap collapse
  public onCascadeMatch: ((matchingBalls: Ball[]) => void) | null = null;

  public applyHitKnockback(strength: number = 6.5) {
    this.knockbackVelocity = -strength; // Negative = roll backward along the track
  }

  constructor(splinePath: SplinePath) {
    this.splinePath = splinePath;
    this.sceneGroup = new THREE.Group();
    this.sceneGroup.name = 'ballChainGroup';
  }

  public getHead(): Ball | null {
    if (this.balls.length === 0) return null;
    return this.balls[this.balls.length - 1];
  }

  public getTail(): Ball | null {
    if (this.balls.length === 0) return null;
    return this.balls[0];
  }

  public acquireBall(color: SphereColor, distance: number): Ball {
    const id = `ball_${this.nextBallId++}`;
    let ball: Ball;
    if (this.pool.length > 0) {
      ball = this.pool.pop()!;
      ball.reset(id, color, distance);
    } else {
      ball = new Ball(id, color, distance);
    }
    this.sceneGroup.add(ball.mesh);
    return ball;
  }

  public releaseBall(ball: Ball) {
    this.sceneGroup.remove(ball.mesh);
    ball.state = 'DEAD';
    this.pool.push(ball);
  }

  /**
   * Pre-populates the chain at level start with an initial continuous train of balls
   */
  public populateInitialChain(count: number, colorPool: SphereColor[]) {
    this.clear();
    const actualCount = Math.min(count, this.maxBallsToSpawn);
    if (actualCount <= 0) return;

    const segment = new ChainSegment();
    const startHeadDist = 0.5 + (actualCount - 1) * this.ballDiameter;
    segment.headDistance = startHeadDist;

    for (let i = 0; i < actualCount; i++) {
      const color = colorPool[Math.floor(Math.random() * colorPool.length)];
      const dist = 0.5 + i * this.ballDiameter;
      const ball = this.acquireBall(color, dist);
      ball.state = 'ROLLING';
      segment.balls.push(ball);
      this.totalSpawned++;
    }

    segment.updateBallDistances(this.ballDiameter);
    this.segments.push(segment);
    this.syncFlattenedBalls();

    if (this.totalSpawned >= this.maxBallsToSpawn) {
      this.isSpawningFinished = true;
    }

    // Position 3D meshes immediately
    this.updateMeshTransforms(0, 0);
  }

  /**
   * Synchronizes the flat this.balls array with all segments
   */
  public syncFlattenedBalls() {
    this.balls = [];
    for (const seg of this.segments) {
      for (const b of seg.balls) {
        this.balls.push(b);
      }
    }
  }

  /**
   * Feeds a new ball at the tail of the chain if the tail has moved forward
   */
  public feedTailBall(colorPool: SphereColor[]): Ball | null {
    if (this.totalSpawned >= this.maxBallsToSpawn) {
      this.isSpawningFinished = true;
      return null;
    }

    const color = colorPool[Math.floor(Math.random() * colorPool.length)];

    if (this.segments.length === 0) {
      const seg = new ChainSegment(0.5);
      const ball = this.acquireBall(color, 0.5);
      ball.state = 'ROLLING';
      seg.balls.push(ball);
      seg.updateBallDistances(this.ballDiameter);
      this.segments.push(seg);
      this.totalSpawned++;
      this.syncFlattenedBalls();
      return ball;
    }

    const rearSeg = this.segments[0];
    const tailDist = rearSeg.tailDistance;

    // Room needed for a new ball: at least ballDiameter from track start (0.5)
    if (tailDist >= 0.5 + this.ballDiameter) {
      const spawnDist = tailDist - this.ballDiameter;
      const ball = this.acquireBall(color, spawnDist);
      ball.state = 'ROLLING';
      rearSeg.balls.unshift(ball); // Prepend to tail of rear segment
      rearSeg.updateBallDistances(this.ballDiameter);
      this.totalSpawned++;
      this.syncFlattenedBalls();
      return ball;
    }

    return null;
  }

  /**
   * Advances the chain forward along the spline, resolves gaps, merges segments,
   * and rotates ball meshes
   */
  public update(dt: number, baseSpeed: number): { reachedEnd: boolean } {
    let reachedEnd = false;
    const pathLength = this.splinePath.getLength();
    const endThreshold = pathLength - 0.4;

    // Clean up any empty segments
    this.segments = this.segments.filter((s) => s.balls.length > 0);

    if (this.segments.length === 0) {
      this.syncFlattenedBalls();
      return { reachedEnd: false };
    }

    // 1. Calculate effective speed with knockback recoil
    let effectiveSpeed = baseSpeed;
    if (this.knockbackVelocity < 0) {
      effectiveSpeed += this.knockbackVelocity;
      this.knockbackVelocity = Math.min(0, this.knockbackVelocity + dt * 16.0);
    }

    // 2. Advance the rearmost segment (pushed forward by spawner)
    const rearMost = this.segments[0];
    rearMost.headDistance += effectiveSpeed * dt;
    const minRearHead = 0.5 + (rearMost.balls.length - 1) * this.ballDiameter;
    if (rearMost.headDistance < minRearHead) {
      rearMost.headDistance = minRearHead;
    }
    rearMost.updateBallDistances(this.ballDiameter);

    // 3. Process gaps from back to front:
    // Any severed forward segment ("the cut") rolls backward down the track to meet the segment at the back!
    for (let i = 0; i < this.segments.length - 1; i++) {
      const rear = this.segments[i];
      const front = this.segments[i + 1];

      const rearHead = rear.headBall!;
      const frontTail = front.tailBall!;

      const gap = frontTail.pathDistance - rearHead.pathDistance - this.ballDiameter;

      if (gap <= 0.04) {
        // Gap closed! Snap and merge front into rear
        const mergeIdx = rear.balls.length - 1;
        rear.balls.push(...front.balls);
        rear.headDistance = front.headDistance;
        rear.updateBallDistances(this.ballDiameter);

        // Remove front segment
        this.segments.splice(i + 1, 1);
        this.syncFlattenedBalls();

        // Check cascade match across newly merged junction
        this.checkCascadeAtJunction(rear, mergeIdx);
        i--;
        continue;
      }

      // Gap exists: The cut rolls BACKWARD toward the rear segment
      front.isMagnetPulling = true;
      const pull = Math.min(gap, this.magneticPullSpeed * dt);
      front.headDistance -= pull;

      // Ensure front doesn't reverse past the rear segment's head
      const minFrontHead = rear.headBall!.pathDistance + this.ballDiameter + (front.balls.length - 1) * this.ballDiameter;
      if (front.headDistance < minFrontHead) {
        front.headDistance = minFrontHead;
      }
      front.updateBallDistances(this.ballDiameter);

      // Check if this pull step closed the gap
      const newGap = front.tailBall!.pathDistance - rear.headBall!.pathDistance - this.ballDiameter;
      if (newGap <= 0.04) {
        const mergeIdx = rear.balls.length - 1;
        rear.balls.push(...front.balls);
        rear.headDistance = front.headDistance;
        rear.updateBallDistances(this.ballDiameter);

        this.segments.splice(i + 1, 1);
        this.syncFlattenedBalls();

        this.checkCascadeAtJunction(rear, mergeIdx);
        i--;
        continue;
      }
    }

    // Check if the front-most segment of the chain reached the hole
    const frontMost = this.segments[this.segments.length - 1];
    if (frontMost && frontMost.headDistance >= endThreshold) {
      reachedEnd = true;
    }

    // 3. Synchronize flattened array & update 3D mesh transforms
    this.syncFlattenedBalls();
    this.updateMeshTransforms(dt, baseSpeed);

    return { reachedEnd };
  }

  /**
   * Updates 3D mesh positions from spline distances and applies realistic rolling rotation
   */
  private updateMeshTransforms(dt: number, speed: number) {
    for (let i = 0; i < this.balls.length; i++) {
      const b = this.balls[i];
      const pos = this.splinePath.getPointAtDistance(b.pathDistance);
      pos.y = 0.58; // Sits above the ribbon bed in full view
      b.setPosition(pos);

      if (dt > 0) {
        const tangent = this.splinePath.getTangentAtDistance(b.pathDistance);
        // Roll sphere around tangent vector
        b.mesh.rotation.x += tangent.z * speed * dt * 2.5;
        b.mesh.rotation.z -= tangent.x * speed * dt * 2.5;
      }
    }
  }

  /**
   * Inserts a projectile ball into the chain at the closest physical location
   */
  public insertBall(
    projectileColor: SphereColor,
    hitPos: THREE.Vector3
  ): { insertedIndex: number; ball: Ball } {
    const hitQuery = this.splinePath.findClosestDistance(hitPos);
    const hitDist = hitQuery.distance;

    // If chain is empty, create first segment
    if (this.segments.length === 0) {
      const seg = new ChainSegment(hitDist);
      const newBall = this.acquireBall(projectileColor, hitDist);
      newBall.state = 'ROLLING';
      seg.balls.push(newBall);
      seg.updateBallDistances(this.ballDiameter);
      this.segments.push(seg);
      this.syncFlattenedBalls();
      return { insertedIndex: 0, ball: newBall };
    }

    // Find which segment and ball is closest to hitDist
    let targetSegIdx = 0;
    let minSegDiff = Infinity;
    for (let s = 0; s < this.segments.length; s++) {
      const seg = this.segments[s];
      const segMid = (seg.headDistance + seg.tailDistance) / 2;
      const diff = Math.abs(segMid - hitDist);
      if (diff < minSegDiff) {
        minSegDiff = diff;
        targetSegIdx = s;
      }
    }

    const seg = this.segments[targetSegIdx];

    // Find insertion index inside this segment
    let insertIdx = 0;
    while (insertIdx < seg.balls.length && seg.balls[insertIdx].pathDistance < hitDist) {
      insertIdx++;
    }

    // Create the new ball
    const newBall = this.acquireBall(projectileColor, hitDist);
    newBall.state = 'ROLLING';

    // Insert into segment
    seg.balls.splice(insertIdx, 0, newBall);

    // Balls behind move BACKWARD to open room for the inserted ball,
    // rather than advancing the front of the chain forward toward the endpoint!
    seg.updateBallDistances(this.ballDiameter);

    // Apply satisfying backward impact recoil to the chain
    this.applyHitKnockback(6.5);

    this.syncFlattenedBalls();

    // Calculate global index in this.balls
    let globalIdx = 0;
    for (let s = 0; s < targetSegIdx; s++) {
      globalIdx += this.segments[s].balls.length;
    }
    globalIdx += insertIdx;

    // Set 3D position
    const pos = this.splinePath.getPointAtDistance(newBall.pathDistance);
    pos.y = 0.58;
    newBall.setPosition(pos);

    return { insertedIndex: globalIdx, ball: newBall };
  }

  /**
   * Destroys matching balls, splits segments if necessary, and returns 3D centers for explosion
   */
  public removeBalls(ballsToRemove: Ball[]): THREE.Vector3[] {
    const explosionCenters: THREE.Vector3[] = [];
    const removeIds = new Set(ballsToRemove.map((b) => b.id));

    const newSegments: ChainSegment[] = [];

    for (const seg of this.segments) {
      let currentSubBalls: Ball[] = [];

      for (const b of seg.balls) {
        if (removeIds.has(b.id)) {
          explosionCenters.push(b.getPosition().clone());
          this.releaseBall(b);

          if (currentSubBalls.length > 0) {
            const subSeg = new ChainSegment();
            subSeg.balls = currentSubBalls;
            subSeg.headDistance = currentSubBalls[currentSubBalls.length - 1].pathDistance;
            subSeg.updateBallDistances(this.ballDiameter);
            newSegments.push(subSeg);
            currentSubBalls = [];
          }
        } else {
          currentSubBalls.push(b);
        }
      }

      if (currentSubBalls.length > 0) {
        const subSeg = new ChainSegment();
        subSeg.balls = currentSubBalls;
        subSeg.headDistance = currentSubBalls[currentSubBalls.length - 1].pathDistance;
        subSeg.updateBallDistances(this.ballDiameter);
        newSegments.push(subSeg);
      }
    }

    this.segments = newSegments;
    this.syncFlattenedBalls();

    return explosionCenters;
  }

  /**
   * Checks for a cascade match when a gap closes and two segments merge
   */
  private checkCascadeAtJunction(seg: ChainSegment, junctionIdx: number) {
    if (seg.balls.length < 3 || junctionIdx < 0 || junctionIdx >= seg.balls.length) return;

    const targetColor = seg.balls[junctionIdx].color;
    let start = junctionIdx;
    let end = junctionIdx;

    while (start > 0 && seg.balls[start - 1].color === targetColor) {
      start--;
    }
    while (end < seg.balls.length - 1 && seg.balls[end + 1].color === targetColor) {
      end++;
    }

    const count = end - start + 1;
    if (count >= 3 && this.onCascadeMatch) {
      const matching = seg.balls.slice(start, end + 1);
      this.onCascadeMatch(matching);
    }
  }

  public clear() {
    for (const b of this.balls) {
      this.releaseBall(b);
    }
    this.segments = [];
    this.balls = [];
    this.totalSpawned = 0;
    this.isSpawningFinished = false;
  }
}
