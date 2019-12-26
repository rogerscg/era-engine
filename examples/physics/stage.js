import {Entity} from '/src/era.js';

const GEOMETRY = new THREE.BoxGeometry(20, 20, 20);
const MATERIAL = new THREE.MeshLambertMaterial({color: 0x999999});

/**
 * The stage for ball arena.
 */
class Stage extends Entity {
  /** @override */
  generateMesh() {
    return new THREE.Mesh(GEOMETRY, MATERIAL);
  }

  /** @override */
  generatePhysicsBody() {
    
  }
}

export default Stage;
