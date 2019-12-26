import {Entity} from '/src/era.js';

const SIDE = 20;
const GEOMETRY = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
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
    const shape = new Ammo.btBoxShape(
                    new Ammo.btVector3(SIDE / 2, SIDE / 2, SIDE / 2)
                  );
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(0, -SIDE / 2, 0));
    const motionState = new Ammo.btDefaultMotionState(transform);
    const mass = 0;
    const bodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, null);
    const body = new Ammo.btRigidBody(bodyInfo);
    return body;
  }
}

export default Stage;
