import { Entity, MaterialManager } from '../../src/era.js';

const SIDE = 15;
const GEOMETRY = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x555555 });

/**
 * The stage for arena.
 */
class Stage extends Entity {
  /** @override */
  generateMesh() {
    const ground = new THREE.Mesh(GEOMETRY, MATERIAL);
    return ground;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 25;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = -Math.PI / 4;
    camera.lookAt(this.position);
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(SIDE / 2, SIDE / 2, SIDE / 2)),
      position: new CANNON.Vec3(0, -SIDE / 2, 0)
    });
    body.material = MaterialManager.get().createPhysicalMaterial('ground');
    return body;
  }
}

export default Stage;
