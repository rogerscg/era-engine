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
}

export default DebugRenderer;