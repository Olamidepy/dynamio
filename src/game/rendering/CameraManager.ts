import * as THREE from 'three';

export class CameraManager {
  public camera: THREE.PerspectiveCamera;
  private defaultLookAt = new THREE.Vector3(0, 0, 1.2);
  private currentBasePosition = new THREE.Vector3(0, 26.5, 20.5);
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5.0;

  // Normalized direction vector for the camera view angle (~55° elevation)
  private readonly dirY = 0.82;
  private readonly dirZ = 0.57;

  constructor(width: number, height: number) {
    const aspect = width / height || 1;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
    this.resize(width, height);
  }

  /**
   * Resizes the camera and mathematically computes the exact distance needed
   * to ensure all corners, curves, and endpoints of the 3D diorama arena
   * are 100% visible with safety margin on both mobile portrait and desktop widescreen.
   */
  public resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    const aspect = width / height;
    this.camera.aspect = aspect;

    // Arena track spheres reach maximum x = ±15.0 + 0.75 radius = ±15.75.
    // Setting fitRadius = 16.8 scales the arena up significantly so it fills the screen,
    // while guaranteeing balls never touch the end of the screen (~6% safe bezel margin).
    const fitRadius = 16.8;
    const vFovHalfRad = (45 * 0.5 * Math.PI) / 180; // tan(22.5°) ≈ 0.4142

    const distV = fitRadius / Math.tan(vFovHalfRad);
    const distH = fitRadius / (aspect * Math.tan(vFovHalfRad));

    // Distance required to guarantee both vertical and horizontal fit
    const requiredDistance = Math.max(distV, distH);

    this.currentBasePosition.set(
      0,
      this.defaultLookAt.y + requiredDistance * this.dirY,
      this.defaultLookAt.z + requiredDistance * this.dirZ
    );

    this.camera.position.copy(this.currentBasePosition);
    this.camera.lookAt(this.defaultLookAt);
    this.camera.updateProjectionMatrix();
  }

  public triggerShake(intensity: number = 0.2) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 0.5);
  }

  public update(dt: number) {
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * this.shakeDecay);
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetZ = (Math.random() - 0.5) * this.shakeIntensity;

      this.camera.position.set(
        this.currentBasePosition.x + offsetX,
        this.currentBasePosition.y + offsetY,
        this.currentBasePosition.z + offsetZ
      );
    }
  }
}
