import * as THREE from 'three';
import { SphereColor, SPHERE_COLORS } from '../types';
import { MaterialManager } from '../rendering/Materials';

export class Shooter {
  public group: THREE.Group;
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.4, 0);
  public currentBallColor: SphereColor = 'ruby';
  public nextBallColor: SphereColor = 'sapphire';
  public availableColors: SphereColor[] = ['ruby', 'sapphire', 'amber'];

  public aimAngle: number = 0; // Radians around Y axis
  public aimDirection: THREE.Vector3 = new THREE.Vector3(0, 0, 1);

  // 3D Parts
  private baseMesh: THREE.Mesh;
  private turretGroup: THREE.Group;
  private currentBallMesh: THREE.Mesh;
  private nextBallMesh: THREE.Mesh;
  private aimTrajectoryLine: THREE.Line;
  private aimTrajectoryPoints: THREE.Vector3[] = [];

  // Cooldown & Recoil
  public cooldownTimer: number = 0;
  public readonly cooldownDuration: number = 0.26; // seconds
  private recoilOffset: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'shooterGroup';
    this.group.position.copy(this.position);

    // 1. Fixed Turret Base (sleek dark metal pedestal with glowing gold rim)
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.35, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x141b2d,
      roughness: 0.3,
      metalness: 0.85,
    });
    this.baseMesh = new THREE.Mesh(baseGeo, baseMat);
    this.baseMesh.position.y = -0.15;
    this.baseMesh.receiveShadow = true;
    this.group.add(this.baseMesh);

    // Glowing base ring
    const ringGeo = new THREE.TorusGeometry(1.65, 0.05, 12, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xe9b213,
      emissive: 0xe9b213,
      emissiveIntensity: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = -0.05;
    this.group.add(ringMesh);

    // 2. Rotating Turret Body
    this.turretGroup = new THREE.Group();
    this.turretGroup.position.y = 0.1;
    this.group.add(this.turretGroup);

    // Nozzle / Cannon guide rails
    const nozzleGeo = new THREE.BoxGeometry(0.35, 0.25, 1.5);
    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x1f293d,
      roughness: 0.2,
      metalness: 0.9,
    });
    const nozzleLeft = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleLeft.position.set(-0.7, 0.15, 0.5);
    nozzleLeft.castShadow = true;
    this.turretGroup.add(nozzleLeft);

    const nozzleRight = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleRight.position.set(0.7, 0.15, 0.5);
    nozzleRight.castShadow = true;
    this.turretGroup.add(nozzleRight);

    // 3. Current Loaded Ball
    const sphereGeo = new THREE.SphereGeometry(0.66, 24, 20);
    const currentMat = MaterialManager.getInstance().getSphereMaterial(this.currentBallColor);
    this.currentBallMesh = new THREE.Mesh(sphereGeo, currentMat);
    this.currentBallMesh.position.set(0, 0.32, 0.2);
    this.currentBallMesh.castShadow = true;
    this.turretGroup.add(this.currentBallMesh);

    // 4. Next Ball (preview resting behind turret)
    const nextGeo = new THREE.SphereGeometry(0.42, 20, 16);
    const nextMat = MaterialManager.getInstance().getSphereMaterial(this.nextBallColor);
    this.nextBallMesh = new THREE.Mesh(nextGeo, nextMat);
    this.nextBallMesh.position.set(0, 0.22, -0.85);
    this.nextBallMesh.castShadow = true;
    this.turretGroup.add(this.nextBallMesh);

    // 5. Aim Trajectory Line (high contrast emerald green on white background)
    const trajectoryMat = new THREE.LineDashedMaterial({
      color: 0x00875a,
      dashSize: 0.45,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.9,
    });
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.3, 0),
      new THREE.Vector3(0, 0.3, 22),
    ]);
    this.aimTrajectoryLine = new THREE.Line(lineGeo, trajectoryMat);
    this.aimTrajectoryLine.computeLineDistances();
    this.turretGroup.add(this.aimTrajectoryLine);

    // 6. Aim Reticle Target Ring at trajectory tip
    const reticleGeo = new THREE.RingGeometry(0.5, 0.65, 24);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x00875a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    reticleMesh.rotation.x = Math.PI / 2;
    reticleMesh.position.set(0, 0.25, 18);
    this.turretGroup.add(reticleMesh);
  }

  public setAvailableColors(colors: SphereColor[]) {
    this.availableColors = colors;
    if (!colors.includes(this.currentBallColor)) {
      this.currentBallColor = this.getRandomColor();
      this.updateBallVisuals();
    }
    if (!colors.includes(this.nextBallColor)) {
      this.nextBallColor = this.getRandomColor();
      this.updateBallVisuals();
    }
  }

  private getRandomColor(): SphereColor {
    const idx = Math.floor(Math.random() * this.availableColors.length);
    return this.availableColors[idx];
  }

  public resetAmmo() {
    this.currentBallColor = this.getRandomColor();
    this.nextBallColor = this.getRandomColor();
    this.updateBallVisuals();
  }

  public swapBalls(): boolean {
    if (this.cooldownTimer > 0) return false;
    const temp = this.currentBallColor;
    this.currentBallColor = this.nextBallColor;
    this.nextBallColor = temp;
    this.updateBallVisuals();
    return true;
  }

  public consumeBall(): SphereColor {
    const fired = this.currentBallColor;
    this.currentBallColor = this.nextBallColor;
    this.nextBallColor = this.getRandomColor();
    this.updateBallVisuals();

    // Trigger recoil
    this.cooldownTimer = this.cooldownDuration;
    this.recoilOffset = 0.3;

    return fired;
  }

  public updateBallVisuals() {
    this.currentBallMesh.material = MaterialManager.getInstance().getSphereMaterial(this.currentBallColor);
    this.nextBallMesh.material = MaterialManager.getInstance().getSphereMaterial(this.nextBallColor);
  }

  /**
   * Updates aim angle to look at 3D target point on the game plane
   */
  public updateAim(targetWorldPoint: THREE.Vector3) {
    const dir = new THREE.Vector3().subVectors(targetWorldPoint, this.position);
    dir.y = 0; // stay on horizontal plane
    if (dir.lengthSq() > 0.001) {
      dir.normalize();
      this.aimDirection.copy(dir);
      this.aimAngle = Math.atan2(dir.x, dir.z);
      this.turretGroup.rotation.y = this.aimAngle;
    }
  }

  public update(dt: number) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
      if (this.cooldownTimer < 0) this.cooldownTimer = 0;
    }

    // Smoothly restore recoil
    if (this.recoilOffset > 0) {
      this.recoilOffset = Math.max(0, this.recoilOffset - dt * 2.0);
      this.turretGroup.position.z = -this.recoilOffset;
    }

    // Subtle gentle idle floating bob of preview ball
    const time = performance.now() * 0.003;
    this.nextBallMesh.position.y = 0.2 + Math.sin(time) * 0.03;
  }

  public getFireOrigin(): THREE.Vector3 {
    const origin = new THREE.Vector3(0, 0.3, 0.8);
    origin.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.aimAngle);
    origin.add(this.position);
    return origin;
  }

  public canShoot(): boolean {
    return this.cooldownTimer <= 0;
  }
}
