/**
 * @author rogerscg / https://github.com/rogerscg
 */
import DebugRenderer from './debug_renderer.js';
import MaterialManager from './material_manager.js';
import Plugin from '../core/plugin.js';
import Settings from '../core/settings.js';

const MAX_DELTA = 1;
const MAX_SUBSTEPS = 10;

let instance = null;
/**
 * API implementation for Cannon.js, a pure JavaScript physics engine.
 * https://github.com/schteppe/cannon.js
 */
class PhysicsPlugin extends Plugin {
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
    this.debugRenderer = null;
  }

  /** @override */
  reset() {
    this.terminate();
    MaterialManager.get().unregisterWorld(this.world);
    // TODO: Clean up physics bodies.
  }

  /** @override */
  update(delta) {
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
    delta /= 1000;
    delta = Math.min(MAX_DELTA, delta);
    this.world.step(1 / 60, delta, MAX_SUBSTEPS);
  }

  /**
   * Instantiates the physics world.
   */
  createWorld() {
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    MaterialManager.get().registerWorld(world);
    return world;
  }

  /**
   * Iterates through all registered entities and updates them.
   */
  updateEntities(delta) {
    this.registeredEntities.forEach((entity) => entity.updateInternal(delta));
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
    this.world.addBody(entity.physicsBody);
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
    this.world.remove(entity.physicsBody);
    return true;
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
   * @returns {CANNON.Vec3}
   */
  getPosition(entity) {
    return entity.physicsBody.position;
  }

  /**
   * Gets the rotation of the given entity. Must be implemented by
   * engine-specific implementations.
   * @param {Entity} entity
   * @returns {Object}
   */
  getRotation(entity) {
    return entity.physicsBody.quaternion;
  }

  /**
   * Sets a debug renderer on the physics instance. This should be overriden by
   * each engine-specific implementation for ease of use.
   */
  enableDebugRenderer() {
    const scene = this.getEraWorld() ? this.getEraWorld().getScene() : null;
    const world = this.getWorld();
    if (!scene || !world) {
      return console.warn('Debug renderer missing scene or world.');
    }
    this.debugRenderer = new DebugRenderer(scene, world);
    return this.debugRenderer;
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
    entity.physicsBody.addEventListener('collide', (e) => {
      entity.handleCollision(e);
    });
  }
}

export default PhysicsPlugin;
