/**
 * @author rogerscg / https://github.com/rogerscg
 */

import * as ERA from '../../build/era.js';
import * as THREE from 'three';

const GEOMETRY = new THREE.CubeGeometry(0.2, 0.2, 6);
const MATERIAL = new THREE.MeshLambertMaterial({ color: 0xff2222 });
const LIFETIME = 2000;
const VELOCITY = 10;

/**
 * A laser beam shot by the cannons.
 */
class Laser extends ERA.Entity {
  constructor() {
    super();
    this.fireTime = Date.now();
  }

  /** @override */
  generateMesh() {
    return new THREE.Mesh(GEOMETRY, MATERIAL);
  }

  /** @override */
  update() {
    this.position.z += VELOCITY;
    if (Date.now() - this.fireTime > LIFETIME) {
      this.destroy();
    }
  }
}

export default Laser;
