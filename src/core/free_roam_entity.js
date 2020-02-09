import Controls from './controls.js';
import Entity from './entity.js';
import { Bindings } from './bindings.js';

const FREE_ROAM_BINDINGS = {
  UP: {
    keys: {
      keyboard: 32,
      controller: 'button7'
    }
  },
  DOWN: {
    keys: {
      keyboard: 67,
      controller: 'button6'
    }
  },
  LOOK_X: {
    keys: {
      controller: 'axes2'
    }
  },
  LOOK_Y: {
    keys: {
      controller: 'axes3'
    }
  },
  SPRINT: {
    keys: {
      keyboard: 16,
      controller: 'button10'
    }
  }
};

const CONTROLS_ID = 'FreeRoam';

const MAX_CAMERA_Z = Math.PI / 2;
const MIN_CAMERA_Z = -Math.PI / 2;
const MOUSE_SENS = 0.002;
const SPRINT_COEFFICIENT = 5;
const VELOCITY_COEFFICIENT = 0.5;

/**
 * An entity that provides "free roam" controls, allowing it to fly through
 * space unaffected by physics.
 */
class FreeRoamEntity extends Entity {
  static GetBindings() {
    return new Bindings(CONTROLS_ID)
      .load(FREE_ROAM_BINDINGS)
      .merge(Entity.GetBindings());
  }

  /** @override */
  getControlsId() {
    return CONTROLS_ID;
  }

  constructor() {
    super();
    // Input properties.
    this.targetQuaternion = new CANNON.Quaternion();
    this.lerpedVelocity = new THREE.Vector3();
    this.targetVelocity = new THREE.Vector3();
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 0.5;
    camera.lookAt(this.position);
  }

  /** @override */
  update() {
    super.update();
    let inputY = 0;
    if (this.getActionValue(this.bindings.UP)) {
      inputY += this.getActionValue(this.bindings.UP);
    }
    if (this.getActionValue(this.bindings.DOWN)) {
      inputY -= this.getActionValue(this.bindings.DOWN);
    }
    this.targetVelocity.set(this.inputVector.x, inputY, this.inputVector.z);
    this.targetVelocity.multiplyScalar(VELOCITY_COEFFICIENT);
    if (this.getActionValue(this.bindings.SPRINT)) {
      this.targetVelocity.multiplyScalar(SPRINT_COEFFICIENT);
    }
    this.position.add(this.targetVelocity);
    this.updateRotation();
  }

  /**
   * Updates the camera rotation.
   */
  updateRotation() {
    // Update from controller.
    if (this.getActionValue(this.bindings.LOOK_X)) {
      this.cameraArm.rotation.y -=
        0.1 * this.getActionValue(this.bindings.LOOK_X);
    }
    if (this.getActionValue(this.bindings.LOOK_Y)) {
      this.cameraArm.rotation.z +=
        0.02 * this.getActionValue(this.bindings.LOOK_Y);
    }
    // Update from mouse movement.
    this.cameraArm.rotation.y -= MOUSE_SENS * this.getMouseMovement().x;
    this.cameraArm.rotation.z += MOUSE_SENS * this.getMouseMovement().y;

    // Clamp.
    this.cameraArm.rotation.z = Math.min(
      MAX_CAMERA_Z,
      Math.max(MIN_CAMERA_Z, this.cameraArm.rotation.z)
    );
  }
}

Controls.get().registerBindings(FreeRoamEntity);
export default FreeRoamEntity;
