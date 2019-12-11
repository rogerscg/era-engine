/**
 * @author rogerscg / https://github.com/rogerscg
 */

import EraContactListener from './era_contact_listener.js';
import Plugin from './plugin.js';

const ALL_MASK = 1 | 2 | 4 | 8;

const velocityIterations = 8;
const positionIterations = 3;

let instance = null;

/**
 * Core implementation for managing the game's physics. The
 * actual physics engine is provided by box2d.
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
    this.physicalMaterials = new Map();
    this.contactMaterials = new Map();
    this.stepsPerSecond = 120;

    // A registry of shape and body contact callbacks.
    this.pairCallbacks = new Map();
  }

  /** @override */
  reset() {
    this.terminate();
    // TODO: Clean up physics bodies.
  }

  /** @override */
  update(forcedTime) {
    const currTime = performance.now();
    let delta = (currTime - this.lastTime) / 1000;
    this.lastTime = currTime;
    if (delta <= 0) {
      return;
    }
    this.world.Step(delta, velocityIterations, positionIterations);
    this.updateEntities(delta);
  }

  getWorld() {
    return this.world;
  }

  /**
   * Instantiates the physics world.
   */
  createWorld() {
    const world = new box2d.b2World(new box2d.b2Vec2(0.0, 0.0));
    this.contactListener = new EraContactListener();
    world.SetContactListener(this.contactListener);
    return world;
  }

  /**
   * Iterates through all registered entities and updates them.
   */
  updateEntities(delta) {
    this.registeredEntities.forEach((entity) => {
      entity.update(delta);
    });
  }

  /**
   * Registers a fixture for contact event handling.
   */
  registerContactHandler(fixture, handler) {
    if (!this.contactListener) {
      console.warn('No contact listener installed!');
      return;
    }
    this.contactListener.registerHandler(fixture, handler);
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
    if (!entity || !entity.actions) {
      console.error('Must pass in an entity');
    }
    this.registeredEntities.delete(entity.uuid);
    this.world.DestroyBody(entity.physicsObject);
  }

  /**
   * Registers a component to partake in physics simulations. This
   * differs from an entity in that it is a single body unattached
   * to a mesh.
   */
  registerComponent(body) {
    // Does nothing at the moment.
  }

  /**
   * Unregisters a component to partake in physics simulations.
   */
  unregisterComponent(body) {
    this.world.DestroyBody(body);
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
