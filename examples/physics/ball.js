import { Entity } from '/src/era.js';

const RADIUS = 2;

const GEOMETRY = new THREE.SphereGeometry(RADIUS, 32, 32);
const MATERIAL = new THREE.MeshLambertMaterial({color: 0xff6600});

class Ball extends Entity {
  constructor() {
    super();
  }

  /** @override */
  generateMesh() {
    return new THREE.Mesh(GEOMETRY, MATERIAL);
  }

  /** @override */
  generatePhysicsBody() {
    const shape = new Ammo.btSphereShape(RADIUS);
    const mass = 10;
    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);
    const transform = new Ammo.btTransform();
    transform.setOrigin(new Ammo.btVector3(0, 5, 0));
    const motionState = new Ammo.btDefaultMotionState(transform);
    const bodyInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(bodyInfo);
    return body;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.z = 35;
    camera.position.y = 10;
    camera.lookAt(this.position);
  }
}

export default Ball;
