import { Bindings, Controls, Entity } from '../../build/era.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const FORCE_STRENGTH = 15;
const RADIUS = 2;
const GEOMETRY = new THREE.SphereGeometry(RADIUS, 32, 32);
const MATERIAL = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const CONTROLS_ID = 'Ball';
const COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xff9900];

const BALL_BINDINGS = {
  BACKWARD: {
    keys: {
      keyboard: [83, 71, 75, 40],
      controller: '+axes1',
    },
    split_screen: true,
  },
  FORWARD: {
    keys: {
      keyboard: [87, 84, 73, 38],
      controller: '-axes1',
    },
    split_screen: true,
  },
  LEFT: {
    keys: {
      keyboard: [65, 70, 74, 37],
      controller: '-axes0',
    },
    split_screen: true,
  },
  RIGHT: {
    keys: {
      keyboard: [68, 72, 76, 39],
      controller: '+axes0',
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
    this.forceVector = new CANNON.Vec3(0, 0, 0);
    this.rotationEuler = new THREE.Euler();
    this.rotationEuler.order = 'YXZ';
    this.rotationQuat = new THREE.Quaternion();
  }

  /** @override */
  getControlsId() {
    return CONTROLS_ID;
  }

  /** @override */
  async generateMesh() {
    const material = MATERIAL.clone();
    material.color.setHex(COLORS[this.playerNumber]);
    return new THREE.Mesh(GEOMETRY, material);
  }

  /** @override */
  generatePhysicsBody() {
    return new CANNON.Body({
      mass: 10,
      shape: new CANNON.Sphere(RADIUS),
    });
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 135;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = -Math.PI / 3;
    camera.lookAt(this.getPosition());
  }

  /** @override */
  update() {
    super.update();
    this.forceVector.x = this.inputVector.x;
    this.forceVector.z = this.inputVector.z;
    this.forceVector.scale(FORCE_STRENGTH, this.forceVector);
    this.physicsBody.applyImpulse(this.forceVector, CANNON.Vec3.ZERO);
  }
}

Controls.get().registerBindings(Ball);
export default Ball;
