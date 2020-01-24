import {Entity, Models} from '../../src/era.js';

/**
 * A maze level.
 */
class Level extends Entity {
  /**
   * @param {string} levelName
   */
  constructor(levelName) {
    super();
    this.modelName = levelName;
    this.autogeneratePhysics = true;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 20;
    this.cameraArm.rotation.z = Math.PI / 4;
    camera.lookAt(this.position);
  }

  /**
   * Loads the objects necessary for the level.
   * @async
   */
  async load() {
    await Models.get().loadModel('', this.modelName);
  }
}

export default Level;