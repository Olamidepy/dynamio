import * as THREE from 'three';

export class CameraManager {
  public camera: THREE.PerspectiveCamera;
  private defaultPosition = new THREE.Vector3(0, 23.5, 18.2);
  private defaultLookAt = new THREE.Vector3(0, 0, 1.2);
  private shakeIntensity: number = 0;
  private shakeDecay: number = 5.0;

  constructor(width: number, height: number) {
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    this.camera.position.copy(this.defaultPosition);
    this.camera.lookAt(this.defaultLookAt);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    // On portrait/mobile viewports, pull camera back slightly to keep full arena visible
    if (this.camera.aspect < 1.0) {
      const zoomFactor = 1.0 / this.camera.aspect;
      this.camera.position.set(
        0,
        this.defaultPosition.y * Math.min(zoomFactor, 1.35),
        this.defaultPosition.z * Math.min(zoomFactor, 1.35)
      );
    } else {
      this.camera.position.copy(this.defaultPosition);
    }
    this.camera.lookAt(this.defaultLookAt);
    this.camera.updateProjectionMatrix();
  }

  public triggerShake(intensity: number = 0.25) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 0.6);
  }

  public update(dt: number) {
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * this.shakeDecay);
      const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
      const offsetZ = (Math.random() - 0.5) * this.shakeIntensity;

      this.camera.position.set(
        this.defaultPosition.x + offsetX,
        this.defaultPosition.y + offsetY,
        this.defaultPosition.z + offsetZ
      );
    }
  }
}
