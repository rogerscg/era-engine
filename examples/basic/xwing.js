import Cannons from './cannons.js';
import {Bindings, Controls, Entity} from '/src/era.js';

const XWING_BINDINGS = {
  SPRINT: {
    keys: {
      keyboard: 16,
      controller: 'button5',
    }
  },
  FIRE: {
    keys: {
      keyboard: 32,
    }
  },
};

const CAMERA_DIST = 35;

const CONTROLS_ID = 'X-Wing';

/**
 * Entity representing an X-Wing fighter.
 */
class XWing extends Entity {

  static GetBindings() {
    return new Bindings(CONTROLS_ID)
             .load(XWING_BINDINGS)
             .merge(Entity.GetBindings());
  }

  constructor() {
    super();
    this.modelName = 'X-Wing';
    this.rotateTarget = 0;
    this.rotateAnim = null;
    this.cannons = null;
  }

  /** @override */
  build() {
    super.build();
    // Build cannons based on offsets.
    this.cannons = new Cannons(970, 400, 220).build();
    this.mesh.add(this.cannons);
    return this;
  }

  /** @override */
  getControlsId() {
    return CONTROLS_ID;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    this.cameraArm.rotation.y += Math.PI;
    camera.position.z = CAMERA_DIST;
    camera.position.x = -.4;
  }

  /** @override */
  update() {
    this.updateRoll();
    if (this.getActionValue(this.bindings.FIRE)) {
      this.cannons.fire();
    }
  }

  /**
   * Updates the roll of the X-Wing.
   */
  updateRoll() {
    if (this.getActionValue(this.bindings.LEFT)) {
      this.rotate(-.2);
    } else if (this.getActionValue(this.bindings.RIGHT)) {
      this.rotate(.2);
    } else {
      this.rotate(0);
    }
  }

  /**
   * Rotates the X-Wing with a smoothing animation.
   * @param {number} angle
   */
  rotate(angle) {
    if (this.rotateTarget == angle) {
      return;
    }
    this.rotateTarget = angle;
    if (this.rotateAnim) {
      this.rotateAnim.stop();
    }
    const currRotation = {
      angle: this.mesh.rotation.z
    };
    const target = {
      angle: angle
    };
    this.rotateAnim = new TWEEN.Tween(currRotation)
      .to(target, 250)
      .easing(TWEEN.Easing.Quadratic.InOut)
      .onUpdate(() => {
        this.mesh.rotation.z = currRotation.angle;
      })
      .start();
  }
}

Controls.get().registerBindings(XWing);
export default XWing;