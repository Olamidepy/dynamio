import * as THREE from 'three';
import { SphereColor } from '../types';
import { MaterialManager } from '../rendering/Materials';
import { BallChain } from '../entities/BallChain';
import { Ball } from '../entities/Ball';

export interface Projectile {
  id: string;
  color: SphereColor;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  radius: number;
  mesh: THREE.Mesh;
  alive: boolean;
}

export interface HitResult {
  projectile: Projectile;
  insertedIndex: number;
  insertedBall: Ball;
  hitPosition: THREE.Vector3;
}

export class ShootingSystem {
  public scene: THREE.Scene;
  public projectiles: Projectile[] = [];
  public speed: number = 36.0; // Fast and snappy!
  private static projectileGeo = new THREE.SphereGeometry(0.72, 20, 16);
  private pool: Projectile[] = [];
  private nextProjId: number = 1;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public fire(origin: THREE.Vector3, direction: THREE.Vector3, color: SphereColor): Projectile {
    let proj: Projectile;
    const dirNorm = direction.clone().normalize();
    dirNorm.y = 0; // maintain horizontal height plane
    origin.y = 0.72; // exact ball center plane

    if (this.pool.length > 0) {
      proj = this.pool.pop()!;
      proj.id = `proj_${this.nextProjId++}`;
      proj.color = color;
      proj.position.copy(origin);
      proj.velocity.copy(dirNorm).multiplyScalar(this.speed);
      proj.alive = true;
      proj.mesh.material = MaterialManager.getInstance().getSphereMaterial(color);
      proj.mesh.position.copy(origin);
      proj.mesh.visible = true;
    } else {
      const mesh = new THREE.Mesh(
        ShootingSystem.projectileGeo,
        MaterialManager.getInstance().getSphereMaterial(color)
      );
      mesh.castShadow = true;
      proj = {
        id: `proj_${this.nextProjId++}`,
        color,
        position: origin.clone(),
        velocity: dirNorm.multiplyScalar(this.speed),
        radius: 0.72,
        mesh,
        alive: true,
      };
      mesh.position.copy(origin);
      this.scene.add(mesh);
    }

    this.projectiles.push(proj);
    return proj;
  }

  public update(dt: number, ballChain: BallChain): HitResult | null {
    let hitResult: HitResult | null = null;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (!proj.alive) continue;

      // Move forward
      proj.position.addScaledVector(proj.velocity, dt);
      proj.mesh.position.copy(proj.position);

      // Check collision against all balls in the chain
      // Collision radius = proj.radius + ball.radius = 0.72 + 0.72 = 1.44
      const collisionThresholdSq = 2.0736; // (1.44)^2

      for (let bIdx = 0; bIdx < ballChain.balls.length; bIdx++) {
        const chainBall = ballChain.balls[bIdx];
        if (chainBall.state === 'EXPLODING' || chainBall.state === 'DEAD') continue;

        const ballPos = chainBall.getPosition();
        const distSq = proj.position.distanceToSquared(ballPos);

        if (distSq <= collisionThresholdSq) {
          // HIT!
          proj.alive = false;
          proj.mesh.visible = false;

          // Insert into ballChain
          const insertion = ballChain.insertBall(proj.color, proj.position);

          hitResult = {
            projectile: proj,
            insertedIndex: insertion.insertedIndex,
            insertedBall: insertion.ball,
            hitPosition: proj.position.clone(),
          };
          break;
        }
      }

      // Check boundary bounds (if traveled too far out of arena)
      if (proj.position.lengthSq() > 900) {
        // > 30 units distance
        proj.alive = false;
        proj.mesh.visible = false;
      }

      if (!proj.alive) {
        this.projectiles.splice(i, 1);
        this.pool.push(proj);
      }

      if (hitResult) {
        break; // Process one hit per frame for deterministic order
      }
    }

    return hitResult;
  }

  public clear() {
    for (const p of this.projectiles) {
      p.alive = false;
      p.mesh.visible = false;
      this.pool.push(p);
    }
    this.projectiles = [];
  }
}
