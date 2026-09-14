import * as THREE from 'three';
import { BallData, BallState, SphereColor } from '../types';
import { MaterialManager } from '../rendering/Materials';

export class Ball implements BallData {
  public id: string;
  public color: SphereColor;
  public pathDistance: number;
  public radius: number = 0.55;
  public state: BallState = 'SPAWNING';
  public velocity: number = 0;
  public mesh: THREE.Mesh;
  public insertProgress: number = 1.0;
  public targetDistance: number = 0;
  public destroyProgress: number = 0;

  // Static shared geometry for optimal memory & draw performance
  private static sharedGeometry = new THREE.SphereGeometry(0.55, 24, 20);

  constructor(id: string, color: SphereColor, initialDistance: number = 0) {
    this.id = id;
    this.color = color;
    this.pathDistance = initialDistance;

    const material = MaterialManager.getInstance().getSphereMaterial(color);
    this.mesh = new THREE.Mesh(Ball.sharedGeometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.userData = { ballId: this.id };
  }

  public reset(id: string, color: SphereColor, distance: number = 0) {
    this.id = id;
    this.color = color;
    this.pathDistance = distance;
    this.state = 'SPAWNING';
    this.velocity = 0;
    this.insertProgress = 1.0;
    this.destroyProgress = 0;

    const material = MaterialManager.getInstance().getSphereMaterial(color);
    this.mesh.material = material;
    this.mesh.scale.set(1, 1, 1);
    this.mesh.visible = true;
    this.mesh.userData = { ballId: this.id };
  }

  public setColor(color: SphereColor) {
    this.color = color;
    this.mesh.material = MaterialManager.getInstance().getSphereMaterial(color);
  }

  public setPosition(pos: THREE.Vector3) {
    this.mesh.position.copy(pos);
  }

  public getPosition(): THREE.Vector3 {
    return this.mesh.position;
  }
}
