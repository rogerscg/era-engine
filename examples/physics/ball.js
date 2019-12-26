import { Camera, Controls, Entity, toDegrees } from '/src/era.js';

const FORCE_STRENGTH = 5;
const RADIUS = 2;

const GEOMETRY = new THREE.SphereGeometry(RADIUS, 32, 32);
const MATERIAL = new THREE.MeshLambertMaterial({color: 0xff0000});

class Ball extends Entity {
  constructor() {
    super();
    this.forceVector = new Ammo.btVector3(0, 0, 0)
    this.rotationEuler = new THREE.Euler();
    this.rotationEuler.order = 'YXZ';
    this.rotationQuat = new THREE.Quaternion();
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
    camera.position.x = 135;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = -Math.PI / 3;
    camera.lookAt(this.position);
  }

  /** @override */
  update() {
    super.update();
    // TODO: This seems like a useful utility, move to base entity.
    const inputVector = {x: 0, z: 0};
    if (this.getActionValue(this.bindings.FORWARD)) {
      inputVector.x -= 1;
    }
    if (this.getActionValue(this.bindings.BACKWARD)) {
      inputVector.x += 1;
    }
    if (this.getActionValue(this.bindings.RIGHT)) {
      inputVector.z += 1;
    }
    if (this.getActionValue(this.bindings.LEFT)) {
      inputVector.z -= 1;
    }
    const camera = Camera.get().getActiveCamera();
    let angle = 0;
    if (camera) {
      camera.getWorldQuaternion(this.rotationQuat);
      this.rotationEuler.setFromQuaternion(this.rotationQuat);
      angle = this.rotationEuler.y;
    }
    const leftRightAngle = angle + Math.PI / 2;
    this.forceVector.setX(inputVector.x * Math.sin(angle) + inputVector.z * Math.sin(leftRightAngle));
    this.forceVector.setZ(inputVector.x * Math.cos(angle) + inputVector.z * Math.cos(leftRightAngle));
    this.forceVector.op_mul(FORCE_STRENGTH);
    this.physicsBody.applyCentralImpulse(this.forceVector);
  }
}

Controls.get().registerBindings(Ball);
export default Ball;
