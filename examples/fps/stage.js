import { Entity } from '../../src/era.js';

const SIDE = 50;
const GEOMETRY = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x999999 });

/**
 * The stage for arena.
 */
class Stage extends Entity {
  /** @override */
  generateMesh() {
    const ground = new THREE.Mesh(GEOMETRY, MATERIAL);
    ground.position.y -= SIDE / 2;
    return ground;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 135;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = -Math.PI / 4;
    camera.lookAt(this.position);
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(SIDE, SIDE, SIDE)),
    });
    return body;
  }
}

export default Stage;
