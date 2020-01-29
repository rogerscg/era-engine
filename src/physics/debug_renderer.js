/**
 * Interface for creating a debug renderer for a specific physics engine.
 * @interface
 */
class DebugRenderer {
  /**
   * @param {THREE.Scene} scene
   * @param {*} world
   */
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
  }

  /**
   * Updates the debug renderer.
   */
  update() {}

  /**
   * Destroys the debug renderer by removing all bodies from the scene.
   */
  destroy() {
    console.warn('Destroy not implemented for debug renderer');
  }
}

export default DebugRenderer;
