import * as THREE from 'three';

export class Lighting {
  public group: THREE.Group;
  public keyLight: THREE.DirectionalLight;
  public rimLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'lightingGroup';

    // 1. Clean Daylight Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    this.group.add(this.ambientLight);

    // 2. Key Sun/Spot Light (Soft Shadows)
    this.keyLight = new THREE.DirectionalLight(0xfff6e5, 2.4);
    this.keyLight.position.set(16, 28, 14);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 60;
    this.keyLight.shadow.camera.left = -22;
    this.keyLight.shadow.camera.right = 22;
    this.keyLight.shadow.camera.top = 22;
    this.keyLight.shadow.camera.bottom = -22;
    this.keyLight.shadow.bias = -0.0005;
    this.group.add(this.keyLight);

    // 3. Cool Rim Accent Light
    this.rimLight = new THREE.DirectionalLight(0x0582ca, 1.1);
    this.rimLight.position.set(-18, 14, -16);
    this.group.add(this.rimLight);

    // 4. Subtle Golden Turret Accent Light
    const centerAccent = new THREE.PointLight(0xe9b213, 1.5, 8);
    centerAccent.position.set(0, 2.5, 0);
    this.group.add(centerAccent);
  }
}
