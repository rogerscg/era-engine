import EraContactListener from './era_contact_listener.js';

const ALL_MASK = 1 | 2 | 4 | 8;

const velocityIterations = 8;
const positionIterations = 3;

/**
 * Core implementation for managing the game's physics. The
 * actual physics engine is provided by box2d.
 */
let physicsInstance = null;

class Physics {

  /**
   * Enforces singleton physics instance.
   */
  static get() {
    if (!physicsInstance) {
      physicsInstance = new Physics();
    }
    return physicsInstance;
  }

  constructor() {
    this.registeredEntities = new Map();
    this.world = this.createWorld();
    this.lastTime = performance.now();
    this.physicalMaterials = new Map();
    this.contactMaterials = new Map();
    this.stepsPerSecond = 120;

    // A registry of shape and body contact callbacks.
    this.pairCallbacks = new Map();
  }

  /**
   * Starts the physics world. Only used on the client.
   */
  start() {
    // No-op.
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
   * Updates the physics world and the entities within it every tick.
   */
  update(forcedTime) {
    const currTime = performance.now();
    let delta = (currTime - this.lastTime) / 1000;
    this.lastTime = currTime;

    if (this.loggingEnabled) {
      if (this.lastLogTime) {
        this.eventCounter.updates++;
        const diff = process.hrtime(this.lastLogTime);
        this.logArray.push(diff[1] / 1000000);
      }
      this.lastLogTime = process.hrtime();
    }
    
    if (delta <= 0) {
      if (this.loggingEnabled) {
        this.eventCounter.subzero++;
      }
      return;
    }

    const timePerStep = 1 / this.stepsPerSecond;
    if (this.loggingEnabled) {
      let worldt0 = process.hrtime();
      this.world.Step(delta, velocityIterations, positionIterations);
      let diff = process.hrtime(worldt0);
      if (this.loggingEnabled) {
        this.worldArray.push(diff[1] / 1000000);
      }
      worldt0 = process.hrtime();
      this.updateEntities(delta);
      diff = process.hrtime(worldt0);
      if (this.loggingEnabled) {
        this.updateArray.push(diff[1] / 1000000);
      }
    } else {
      this.world.Step(delta, velocityIterations, positionIterations);
      this.updateEntities(delta);
    }
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
    physicsInstance = null;
  }
}

export default Physics;
