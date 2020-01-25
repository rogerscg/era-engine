import Objective from './objective.js';
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
    this.objective = null;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 20;
    this.cameraArm.rotation.z = Math.PI / 4;
    this.cameraArm.rotation.y = Math.PI / 2;
    camera.lookAt(this.position);
  }

  /** @override */
  build() {
    super.build();
    this.loadObjective();
    return this;
  }

  /** @override */
  destroy() {
    super.destroy();
    this.objective.destroy();
  }

  /**
   * Loads the objects necessary for the level.
   * @async
   */
  async load() {
    // Load maze model.
    await Models.get().loadModel('', this.modelName);
  }

  /**
   * Loads the objective entity into the level.
   */
  loadObjective() {
    this.objective = new Objective().withPhysics(this.physicsWorld).build();
    // Register listener for when the objective has been reached.
    this.objective.addEventListener('completed', () => this.complete());
    const objectivePoint = this.getObjectByName('Objective');
    if (!objectivePoint) {
      return console.error('No objective point found.');
    }
    this.objective.physicsBody.position.copy(objectivePoint.position);
    this.physicsWorld.registerEntity(this.objective);
    this.add(this.objective);
  }

  /**
   * Gets the spawn point for the level.
   * @returns {THREE.Object3D}
   */
  getSpawnPoint() {
    return this.getObjectByName('Spawn');
  }

  /**
   * Marks the level as complete, firing an event upwards to notify observers.
   */
  complete() {
    this.dispatchEvent('complete');
  }
}

export default Level;