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
    this.cameraArm.rotation.y = Math.PI / 2;
    camera.lookAt(this.position);
  }

  /**
   * Loads the objects necessary for the level.
   * @async
   */
  async load() {
    await Models.get().loadModel('', this.modelName);
    // TODO: Load spawn and objective.
  }

  /**
   * Gets the spawn point for the level.
   * @returns {THREE.Object3D}
   */
  getSpawnPoint() {
    return this.getObjectByName('Spawn');
  }
}

export default Level;