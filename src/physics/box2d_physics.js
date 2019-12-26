/**
 * @author rogerscg / https://github.com/rogerscg
 */

import EraContactListener from './era_contact_listener.js';
import Physics from "../core/physics.js";

const VELOCITY_ITERATIONS = 8;
const POSITION_ITERATIONS = 3;

/**
 * API implementation for Box2D.
 */
class Box2DPhysics extends Physics {
  /** @override */
  createWorld() {
    const world = new box2d.b2World(new box2d.b2Vec2(0.0, 0.0));
    this.contactListener = new EraContactListener();
    world.SetContactListener(this.contactListener);
    return world;
  }

  /** @override */
  step(delta) {
    this.world.Step(delta, VELOCITY_ITERATIONS, POSITION_ITERATIONS);
  }

  /** @override */
  unregisterEntity(entity) {
    if (!entity || !entity.actions) {
      console.error('Must pass in an entity');
    }
    this.registeredEntities.delete(entity.uuid);
    this.world.DestroyBody(entity.physicsObject);
  }

  /** @override */
  registerComponent(body) {
    console.warn('Unregister entity not defined');
  }

  /** @override */
  unregisterComponent(body) {
    this.world.DestroyBody(body);
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
}

export default Box2DPhysics;
