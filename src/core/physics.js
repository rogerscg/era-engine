/**
 * @author rogerscg / https://github.com/rogerscg
 */
import Plugin from './plugin.js';

let instance = null;
/**
 * Core implementation for managing the game's physics. The
 * actual physics engine is provided by the user.
 */
class Physics extends Plugin {
  /**
   * Enforces singleton physics instance.
   */
  static get() {
    if (!instance) {
      instance = new Physics();
    }
    return instance;
  }

  constructor() {
    super();
    this.registeredEntities = new Map();
    this.world = this.createWorld();
    this.lastTime = performance.now();
  }

  /** @override */
  reset() {
    this.terminate();
    // TODO: Clean up physics bodies.
  }

  /** @override */
  update() {
    const currTime = performance.now();
    let delta = (currTime - this.lastTime) / 1000;
    this.lastTime = currTime;
    if (delta <= 0) {
      return;
    }
    this.step(delta);
    this.updateEntities(delta);
  }

  getWorld() {
    return this.world;
  }

  /**
   * Steps the physics world.
   * @param {number} delta
   */
  step(delta) {
    console.warn('Step not defined');
  }

  /**
   * Instantiates the physics world.
   */
  createWorld() {
    console.warn('Create world not defined');
  }

  /**
   * Iterates through all registered entities and updates them.
   */
  updateEntities(delta) {
    this.registeredEntities.forEach((entity) => entity.update(delta));
  }

  /**
   * Registers an entity to partake in physics simulations.
   */
  registerEntity(entity) {
    if (!entity || !entity.physicsObject) {
      console.error('Must pass in an entity');
    }
    this.registeredEntities.set(entity.uuid, entity);
  }

  /**
   * Unregisters an entity from partaking in physics simulations.
   */
  unregisterEntity(entity) {
    console.warn('Unregister entity not defined');
  }

  /**
   * Registers a component to partake in physics simulations. This
   * differs from an entity in that it is a single body unattached
   * to a mesh.
   */
  registerComponent(body) {
    console.warn('Unregister entity not defined');
  }

  /**
   * Unregisters a component to partake in physics simulations.
   */
  unregisterComponent(body) {
    console.warn('Unregister component not defined');
  }

  /**
   * Ends the physics simulation. Is only called client-side.
   */
  terminate() {
    clearInterval(this.updateInterval);
    instance = null;
  }
}

export default Physics;
