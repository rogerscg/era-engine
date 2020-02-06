/**
 * @author rogerscg / https://github.com/rogerscg
 */
import Plugin from './plugin.js';
import Settings from './settings.js';

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
    this.eraWorld = null;
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
    let delta = currTime - this.lastTime;
    this.lastTime = currTime;
    if (delta <= 0) {
      return;
    }
    this.step(delta);
    this.updateEntities(delta);
    if (this.debugRenderer) {
      this.debugRenderer.update();
    }
  }

  /** @override */
  handleSettingsChange() {
    if (Settings.get('physics_debug') && this.debugRenderer) {
      return;
    }
    Settings.get('physics_debug')
      ? this.enableDebugRenderer()
      : this.disableDebugRenderer();
  }

  getWorld() {
    return this.world;
  }

  setEraWorld(eraWorld) {
    this.eraWorld = eraWorld;
    this.handleSettingsChange();
    return this;
  }

  getEraWorld() {
    return this.eraWorld;
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
   * @param {Entity} entity
   */
  registerEntity(entity) {
    if (!entity || !entity.physicsBody) {
      console.error('Must pass in an entity');
      return false;
    }
    this.registeredEntities.set(entity.uuid, entity);
    entity.registerPhysicsWorld(this);
    this.registerContactHandler(entity);
    return true;
  }

  /**
   * Unregisters an entity from partaking in physics simulations.
   * @param {Entity} entity
   */
  unregisterEntity(entity) {
    if (!entity || !entity.physicsBody) {
      console.error('Must pass in an entity');
      return false;
    }
    this.registeredEntities.delete(entity.uuid);
    entity.unregisterPhysicsWorld(this);
    return true;
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

  /**
   * Gets the position of the given entity. Must be implemented by
   * engine-specific implementations.
   * @param {Entity} entity
   * @returns {Object}
   */
  getPosition(entity) {
    console.warn('getPosition(entity) not implemented');
  }

  /**
   * Gets the rotation of the given entity. Must be implemented by
   * engine-specific implementations.
   * @param {Entity} entity
   * @returns {Object}
   */
  getRotation(entity) {
    console.warn('getRotation(entity) not implemented');
  }

  /**
   * Sets a debug renderer on the physics instance. This should be overriden by
   * each engine-specific implementation for ease of use.
   */
  enableDebugRenderer() {
    console.warn('Debug renderer not implemented');
  }

  /**
   * Disables the debug renderer on the physics instance.
   */
  disableDebugRenderer() {
    if (!this.debugRenderer) {
      return;
    }
    this.debugRenderer.destroy();
    this.debugRenderer = null;
  }

  /**
   * Autogenerates a physics body based on the given mesh.
   * @param {THREE.Object3D} mesh
   * @returns {?} The physics body.
   */
  autogeneratePhysicsBody(mesh) {
    console.warn('Autogenerating physics bodies not supported.');
  }

  /**
   * Registers an entity to receive contact events.
   * @param {Entity} entity
   */
  registerContactHandler(entity) {
    console.warn('Contact handler not supported');
  }
}

export default Physics;
