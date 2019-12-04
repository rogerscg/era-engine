import {Entity} from '/src/era.js';

const CAMERA_DIST = 35;

/**
 * Entity representing an X-Wing fighter.
 */
class XWing extends Entity {
  constructor() {
    super();
    this.modelName = 'X-Wing';
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    this.cameraArm.rotation.y += Math.PI;
    camera.position.z = CAMERA_DIST;
    camera.position.x = -.4;
  }
}

export default XWing;