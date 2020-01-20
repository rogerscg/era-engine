import { Entity } from '../../src/era.js';

const RADIUS = 2;
const GEOMETRY = new THREE.SphereGeometry(RADIUS, 32, 32);
const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x555555 });

/**
 * A simple sphere.
 */
class Sphere extends Entity {
  /** @override */
  generateMesh() {
    return new THREE.Mesh(GEOMETRY, MATERIAL);
  }

  /** @override */
  generatePhysicsBody() {
    return new CANNON.Body({
      mass: 0,
      shape: new CANNON.Sphere(RADIUS),
    });
  }
}

export default Sphere;
