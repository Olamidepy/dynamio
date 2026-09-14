import * as THREE from 'three';

export class Environment {
  public group: THREE.Group;
  private floatingMotes!: THREE.Points;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'environmentGroup';

    this.createFloatingIsland();
    this.createFloatingMotes();
    this.createDioramaAccents();
  }

  private createFloatingIsland() {
    // 1. Primary Playable Playground Surface (#FFCA1A)
    const topGeo = new THREE.CylinderGeometry(18, 17.6, 1.2, 48);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0xffca1a, // #FFCA1A Primary Playground Surface
      roughness: 0.4,
      metalness: 0.1,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = -0.6;
    topMesh.receiveShadow = true;
    this.group.add(topMesh);

    // Dark architectural framing rim
    const rimGeo = new THREE.TorusGeometry(18.05, 0.14, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.9,
    });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.02;
    this.group.add(rimMesh);

    // 2. Floating Under-Island Rock Base (dark slate titanium taper for maximum contrast)
    const baseGeo = new THREE.ConeGeometry(17.6, 12, 12);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.2,
      flatShading: true,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.rotation.x = Math.PI;
    baseMesh.position.y = -6.6;
    this.group.add(baseMesh);

    // 3. Soft Contact Shadow Plane beneath floating island on the white floor
    const shadowGeo = new THREE.PlaneGeometry(36, 36);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,0.22)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -7.2;
    this.group.add(shadowMesh);
  }

  private createDioramaAccents() {
    // Floating crystalline obelisks around the arena perimeter (putt.day vibe)
    const obeliskGeo = new THREE.ConeGeometry(0.8, 4.5, 4);
    const obeliskMat = new THREE.MeshStandardMaterial({
      color: 0x1f2b42,
      roughness: 0.3,
      metalness: 0.7,
      flatShading: true,
    });

    const angles = [0.3, 1.8, 3.4, 4.9];
    angles.forEach((rad, i) => {
      const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
      const radius = 16.5;
      obelisk.position.set(
        Math.cos(rad) * radius,
        1.5 + (i % 2) * 0.8,
        Math.sin(rad) * radius
      );
      obelisk.rotation.y = rad;
      obelisk.castShadow = true;
      this.group.add(obelisk);

      // Glowing tip
      const tipGeo = new THREE.SphereGeometry(0.22, 12, 12);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0xe9b213 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(obelisk.position.x, obelisk.position.y + 2.3, obelisk.position.z);
      this.group.add(tip);
    });
  }

  private createFloatingMotes() {
    const count = 70;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 1] = 1 + Math.random() * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xe9b213,
      size: 0.22,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    this.floatingMotes = new THREE.Points(geometry, material);
    this.group.add(this.floatingMotes);
  }

  public update(dt: number) {
    // Slowly orbit floating dust motes
    if (this.floatingMotes) {
      this.floatingMotes.rotation.y += dt * 0.04;
    }
  }
}
