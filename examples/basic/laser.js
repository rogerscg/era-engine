import {Entity} from '/src/era.js';

const GEOMETRY = new THREE.CubeGeometry(.2, .2, 8);
const MATERIAL = new THREE.MeshLambertMaterial({color: 0xff0000});
const LIFETIME = 1000;
const VELOCITY = 10;

/**
 * A laser beam shot by the cannons.
 */
class Laser extends Entity {
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

  /**
   * Destroy the laser, removing it from its parent and properly disposing
   * of meshes and textures.
   */
  destroy() {
    if (this.parent) {
      this.parent.remove(this);
    }
  }
}

export default Laser;