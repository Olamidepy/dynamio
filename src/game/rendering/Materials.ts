import * as THREE from 'three';
import { SPHERE_COLORS, SphereColor } from '../types';

export class MaterialManager {
  private static instance: MaterialManager;
  public sphereMaterials: Map<SphereColor, THREE.MeshPhysicalMaterial> = new Map();
  public ghostMaterial: THREE.MeshBasicMaterial;
  public trajectoryDotMaterial: THREE.MeshBasicMaterial;
  public reticleMaterial: THREE.MeshBasicMaterial;

  private constructor() {
    // High-saturation, deep-contrast physical materials for white background
    (Object.keys(SPHERE_COLORS) as SphereColor[]).forEach((colorKey) => {
      const def = SPHERE_COLORS[colorKey];
      const mat = new THREE.MeshPhysicalMaterial({
        color: def.hex,
        emissive: def.hex,
        emissiveIntensity: 0.18,
        roughness: 0.12,
        metalness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.95,
      });
      this.sphereMaterials.set(colorKey, mat);
    });

    this.ghostMaterial = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.35,
      wireframe: true,
    });

    this.trajectoryDotMaterial = new THREE.MeshBasicMaterial({
      color: 0x00875a, // high contrast emerald on white
      transparent: true,
      opacity: 0.85,
    });

    this.reticleMaterial = new THREE.MeshBasicMaterial({
      color: 0x00875a,
      transparent: true,
      opacity: 0.9,
    });
  }

  public static getInstance(): MaterialManager {
    if (!MaterialManager.instance) {
      MaterialManager.instance = new MaterialManager();
    }
    return MaterialManager.instance;
  }

  public getSphereMaterial(color: SphereColor): THREE.MeshPhysicalMaterial {
    return this.sphereMaterials.get(color) || this.sphereMaterials.get('amber')!;
  }
}
