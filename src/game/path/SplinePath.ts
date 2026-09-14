import * as THREE from 'three';

export class SplinePath {
  public curve: THREE.CatmullRomCurve3;
  public totalLength: number = 0;
  private sampleCount: number = 400;
  private samplePoints: THREE.Vector3[] = [];
  private sampleDistances: number[] = [];

  constructor(points: [number, number, number][]) {
    const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    this.curve = new THREE.CatmullRomCurve3(vectors, false, 'centripetal', 0.5);
    this.computeSamples();
  }

  private computeSamples() {
    this.samplePoints = [];
    this.sampleDistances = [0];
    let accumulated = 0;

    const firstPoint = this.curve.getPoint(0);
    this.samplePoints.push(firstPoint);

    for (let i = 1; i <= this.sampleCount; i++) {
      const t = i / this.sampleCount;
      const pt = this.curve.getPoint(t);
      const prev = this.samplePoints[i - 1];
      const dist = prev.distanceTo(pt);
      accumulated += dist;
      this.samplePoints.push(pt);
      this.sampleDistances.push(accumulated);
    }

    this.totalLength = accumulated;
  }

  public getLength(): number {
    return this.totalLength;
  }

  /**
   * Returns exact 3D world position given arc-length distance (0 to totalLength)
   */
  public getPointAtDistance(distance: number): THREE.Vector3 {
    if (this.totalLength <= 0 || this.samplePoints.length === 0) return new THREE.Vector3();
    const clampedDist = Math.max(0, Math.min(distance, this.totalLength));

    // Binary search in sampleDistances
    let low = 0;
    let high = this.sampleDistances.length - 1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (this.sampleDistances[mid] < clampedDist) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const idx = Math.max(0, Math.min(low - 1, this.samplePoints.length - 2));
    const d0 = this.sampleDistances[idx];
    const d1 = this.sampleDistances[idx + 1];
    const segLen = d1 - d0;
    const factor = segLen > 0.0001 ? (clampedDist - d0) / segLen : 0;

    return new THREE.Vector3().lerpVectors(this.samplePoints[idx], this.samplePoints[idx + 1], factor);
  }

  /**
   * Returns tangent vector at given arc-length distance
   */
  public getTangentAtDistance(distance: number): THREE.Vector3 {
    if (this.totalLength <= 0 || this.samplePoints.length === 0) return new THREE.Vector3(0, 0, 1);
    const clampedDist = Math.max(0, Math.min(distance, this.totalLength));
    const t = clampedDist / this.totalLength;
    return this.curve.getTangentAt(t).normalize();
  }

  /**
   * Finds the closest distance along the path for an arbitrary 3D position
   */
  public findClosestDistance(point: THREE.Vector3): { distance: number; point: THREE.Vector3; distToPath: number } {
    let bestDist = 0;
    let minD2 = Infinity;
    let bestPoint = this.samplePoints[0];

    for (let i = 0; i < this.samplePoints.length; i++) {
      const sample = this.samplePoints[i];
      const d2 = sample.distanceToSquared(point);
      if (d2 < minD2) {
        minD2 = d2;
        bestDist = this.sampleDistances[i];
        bestPoint = sample;
      }
    }

    return {
      distance: bestDist,
      point: bestPoint.clone(),
      distToPath: Math.sqrt(minD2),
    };
  }

  /**
   * Creates a stylish 3D extruded track diorama mesh for the arena floor
   */
  public createTrackMesh(): THREE.Group {
    const group = new THREE.Group();

    // 1. Open Recessed Track Bed (Dark slate ribbon embedded on yellow arena floor)
    const ribbonPoints = 160;
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const trackHalfWidth = 0.85;

    for (let i = 0; i <= ribbonPoints; i++) {
      const t = i / ribbonPoints;
      const pt = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const left = pt.clone().addScaledVector(normal, trackHalfWidth);
      left.y = 0.02; // Flush on the playground surface
      const right = pt.clone().addScaledVector(normal, -trackHalfWidth);
      right.y = 0.02;

      positions.push(left.x, left.y, left.z);
      positions.push(right.x, right.y, right.z);

      uvs.push(0, t);
      uvs.push(1, t);

      if (i < ribbonPoints) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    const bedGeo = new THREE.BufferGeometry();
    bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    bedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    bedGeo.setIndex(indices);
    bedGeo.computeVertexNormals();

    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x141a29,
      roughness: 0.45,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    const trackMesh = new THREE.Mesh(bedGeo, trackMaterial);
    trackMesh.receiveShadow = true;
    group.add(trackMesh);

    // 2. Dual Glowing Rails along track borders
    const leftCurvePoints: THREE.Vector3[] = [];
    const rightCurvePoints: THREE.Vector3[] = [];

    const numPoints = 140;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const pt = this.curve.getPointAt(t);
      const tangent = this.curve.getTangentAt(t).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      const lPt = pt.clone().addScaledVector(normal, 0.84);
      lPt.y = 0.08;
      const rPt = pt.clone().addScaledVector(normal, -0.84);
      rPt.y = 0.08;

      leftCurvePoints.push(lPt);
      rightCurvePoints.push(rPt);
    }

    const leftCurve = new THREE.CatmullRomCurve3(leftCurvePoints);
    const rightCurve = new THREE.CatmullRomCurve3(rightCurvePoints);

    const railGeoLeft = new THREE.TubeGeometry(leftCurve, 140, 0.06, 6, false);
    const railGeoRight = new THREE.TubeGeometry(rightCurve, 140, 0.06, 6, false);

    const railMaterial = new THREE.MeshStandardMaterial({
      color: 0xe9b213, // Nimiq gold rail accent
      emissive: 0x7c5a08,
      roughness: 0.3,
      metalness: 0.9,
    });

    const leftRail = new THREE.Mesh(railGeoLeft, railMaterial);
    const rightRail = new THREE.Mesh(railGeoRight, railMaterial);
    leftRail.castShadow = true;
    rightRail.castShadow = true;

    group.add(leftRail);
    group.add(rightRail);

    // 3. Start Portal / Spawner Arch
    const startPoint = this.getPointAtDistance(0);
    const startTangent = this.getTangentAtDistance(0);
    const startArch = this.createPortalArch(startPoint, startTangent, 0x1e88e5);
    group.add(startArch);

    // 4. End Vortex / Gateway
    const endPoint = this.getPointAtDistance(this.totalLength);
    const endTangent = this.getTangentAtDistance(this.totalLength);
    const endVortex = this.createEndVortex(endPoint, endTangent);
    group.add(endVortex);

    return group;
  }

  private createPortalArch(pos: THREE.Vector3, dir: THREE.Vector3, color: number): THREE.Group {
    const arch = new THREE.Group();
    arch.position.copy(pos);

    const ringGeo = new THREE.TorusGeometry(1.2, 0.15, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x243048,
      roughness: 0.3,
      metalness: 0.8,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.y = Math.atan2(dir.x, dir.z);
    arch.add(ringMesh);

    // Subtle blue glow light inside spawn arch
    const pointLight = new THREE.PointLight(color, 2, 4);
    pointLight.position.set(0, 0.5, 0);
    arch.add(pointLight);

    return arch;
  }

  private createEndVortex(pos: THREE.Vector3, dir: THREE.Vector3): THREE.Group {
    const vortex = new THREE.Group();
    vortex.position.copy(pos);

    // Golden Nimiq energy core / danger endpoint
    const coreGeo = new THREE.SphereGeometry(0.9, 24, 24);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x050811,
      emissive: 0xe9b213,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.name = 'endVortexCore';
    vortex.add(coreMesh);

    // Outer rotating energy rings
    const ringGeo = new THREE.TorusGeometry(1.5, 0.08, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xff4d7d,
      emissive: 0xff2a5f,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.name = 'vortexRing1';
    vortex.add(ring1);

    // Danger light near endpoint
    const light = new THREE.PointLight(0xe9b213, 3, 6);
    light.position.set(0, 0.8, 0);
    vortex.add(light);

    return vortex;
  }
}
