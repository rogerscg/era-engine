import {Entity} from '../../src/era.js';

const SIDE = 50;
const GEOMETRY = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
const MATERIAL = new THREE.MeshLambertMaterial({color: 0x999999});

/**
 * The stage for ball arena.
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
    const compoundShape = new Ammo.btCompoundShape();
    const shape = new Ammo.btBoxShape(
                    new Ammo.btVector3(SIDE / 2, SIDE / 2, SIDE / 2));
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(0, -SIDE / 2, 0));
    compoundShape.addChildShape(transform, shape);
    const motionState = new Ammo.btDefaultMotionState(transform);
    const mass = 0;
    const bodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, compoundShape, null);
    const body = new Ammo.btRigidBody(bodyInfo);
    return body;
  }
}

export default Stage;
