import {Bindings, Entity} from '/src/era.js';

const CAMERA_DIST = 35;

/**
 * Entity representing an X-Wing fighter.
 */
class XWing extends Entity {
  constructor() {
    super();
    this.modelName = 'X-Wing';
    this.rotateTarget = 0;
    this.rotateAnim = null;
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
    if (this.isKeyPressed(Bindings.LEFT)) {
      this.rotate(-.2);
    } else if (this.isKeyPressed(Bindings.RIGHT)) {
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

export default XWing;