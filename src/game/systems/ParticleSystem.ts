import * as THREE from 'three';
import { SPHERE_COLORS, SphereColor } from '../types';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private pool: Particle[] = [];
  private maxParticles = 120;
  private sparkGeo = new THREE.OctahedronGeometry(0.14, 0);

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'particleSystemGroup';

    // Pre-allocate pool
    for (let i = 0; i < this.maxParticles; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.visible = false;
      this.group.add(mesh);

      const p: Particle = {
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
      };
      this.pool.push(p);
    }
  }

  public emitExplosion(center: THREE.Vector3, color: SphereColor, count: number = 16) {
    const colorHex = SPHERE_COLORS[color]?.hex || 0xffd700;

    for (let i = 0; i < count; i++) {
      if (this.pool.length === 0) break;
      const p = this.pool.pop()!;
      p.active = true;
      p.life = 0;
      p.maxLife = 0.5 + Math.random() * 0.4; // 0.5 to 0.9 sec

      // Position
      p.mesh.position.copy(center).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4
        )
      );

      // Spherical random velocity
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(Math.random() * 2 - 1);
      const speed = 4.0 + Math.random() * 7.0;

      p.velocity.set(
        Math.sin(theta) * Math.cos(phi) * speed,
        Math.sin(theta) * Math.sin(phi) * speed + 2.0, // slight upward bias
        Math.cos(theta) * speed
      );

      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
      p.mesh.scale.set(1, 1, 1);
      p.mesh.visible = true;

      this.particles.push(p);
    }
  }

  public update(dt: number) {
    const gravity = -9.8;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
        this.particles.splice(i, 1);
        this.pool.push(p);
        continue;
      }

      // Physics
      p.velocity.y += gravity * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Fade & shrink
      const progress = p.life / p.maxLife;
      const scale = 1.0 - progress * 0.8;
      p.mesh.scale.set(scale, scale, scale);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1.0 - progress;

      // Spin
      p.mesh.rotation.x += dt * 5;
      p.mesh.rotation.y += dt * 5;
    }
  }

  public clear() {
    for (const p of this.particles) {
      p.active = false;
      p.mesh.visible = false;
      this.pool.push(p);
    }
    this.particles = [];
  }
}
