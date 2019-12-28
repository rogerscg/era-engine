import { Bindings, Camera, Controls, Entity, toDegrees } from '/src/era.js';

const DISABLE_DEACTIVATION = 4;
const FORCE_STRENGTH = 5;
const RADIUS = 2;

const GEOMETRY = new THREE.SphereGeometry(RADIUS, 32, 32);
const MATERIAL = new THREE.MeshLambertMaterial({color: 0xff0000});

const CONTROLS_ID = 'Ball';

const COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xff9900];

const BALL_BINDINGS = {
  BACKWARD: {
    keys: {
      keyboard: [83, 71, 75, 40],
      controller: 'axes1',
    },
    split_screen: true,
  },
  FORWARD: {
    keys: {
      keyboard: [87, 84, 73, 38],
      controller: 'axes1',
    },
    split_screen: true,
  },
  LEFT: {
    keys: {
      keyboard: [65, 70, 74, 37],
      controller: 'axes0',
    },
    split_screen: true,
  },
  RIGHT: {
    keys: {
      keyboard: [68, 72, 76, 39],
      controller: 'axes0',
    },
    split_screen: true,
  },
};

class Ball extends Entity {
  static GetBindings() {
    return new Bindings(CONTROLS_ID).load(BALL_BINDINGS);
  }
  
  /**
   * @param {number} playerNumber 
   */
  constructor(playerNumber) {
    super();
    this.playerNumber = playerNumber;
    this.forceVector = new Ammo.btVector3(0, 0, 0)
    this.rotationEuler = new THREE.Euler();
    this.rotationEuler.order = 'YXZ';
    this.rotationQuat = new THREE.Quaternion();
  }

  /** @override */
  getControlsId() {
    return CONTROLS_ID;
  }

  /** @override */
  generateMesh() {
    const material = MATERIAL.clone();
    material.color.setHex(COLORS[this.playerNumber]);
    return new THREE.Mesh(GEOMETRY, material);
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
    body.setActivationState(DISABLE_DEACTIVATION);
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
