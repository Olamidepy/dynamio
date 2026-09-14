import * as THREE from 'three';
import { CameraManager } from './CameraManager';
import { Lighting } from './Lighting';
import { Environment } from './Environment';

export class SceneManager {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public cameraManager: CameraManager;
  public lighting: Lighting;
  public environment: Environment;

  private raycaster = new THREE.Raycaster();
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.4); // y = 0.4
  private targetIntersection = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent scene background allowing image copy.png backdrop

    const width = canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.parentElement?.clientHeight || window.innerHeight;

    // Camera
    this.cameraManager = new CameraManager(width, height);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Lighting
    this.lighting = new Lighting();
    this.scene.add(this.lighting.group);

    // Environment
    this.environment = new Environment();
    this.scene.add(this.environment.group);
  }

  public resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.cameraManager.resize(width, height);
  }

  /**
   * Raycasts from screen coordinates to find aiming point on game plane
   */
  public getAimIntersection(normalizedX: number, normalizedY: number): THREE.Vector3 {
    this.raycaster.setFromCamera(
      new THREE.Vector2(normalizedX, normalizedY),
      this.cameraManager.camera
    );
    this.raycaster.ray.intersectPlane(this.groundPlane, this.targetIntersection);
    return this.targetIntersection;
  }

  public render(dt: number) {
    this.cameraManager.update(dt);
    this.environment.update(dt);
    this.renderer.render(this.scene, this.cameraManager.camera);
  }

  public dispose() {
    this.renderer.dispose();
  }
}
