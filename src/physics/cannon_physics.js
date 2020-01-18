/**
 * @author rogerscg / https://github.com/rogerscg
 */
import CannonDebugRenderer from "./cannon_debug_renderer.js";
import Engine from '../core/engine.js';
import Physics from "../core/physics.js";

const MAX_SUBSTEPS = 10;

/**
 * API implementation for Cannon.js, a pure JavaScript physics engine.
 * https://github.com/schteppe/cannon.js
 */
class CannonPhysics extends Physics {
  constructor() {
    super();
  }

  /** @override */
  createWorld() {
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);
    return world;
  }

  /** @override */
  step(delta) {
    delta /= 1000;
    this.world.step(1 / 60, delta, MAX_SUBSTEPS);
  }

  /** @override */
  registerEntity(entity) {
    if (!super.registerEntity(entity)) {
      return;
    }
    this.world.addBody(entity.physicsBody);
  }

  /** @override */
  unregisterEntity(entity) {
    if (!super.unregisterEntity(entity)) {
      return;
    }
    this.world.removeBody(entity.physicsBody);
  }

  /** @override */
  registerComponent(body) {
    console.warn('Unregister entity not defined');
  }

  /** @override */
  unregisterComponent(body) {
    console.warn('Unregister component not defined');
  }

  /** @override */
  getPosition(entity) {
    const position = entity.physicsBody.position;
    return {
      x: position.x,
      y: position.y,
      z: position.z
    };
  }

  /** @override */
  getRotation(entity) {
    const rotation = entity.physicsBody.quaternion;
    return {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
      w: rotation.w,
    };
  }

  /** @override */
  withDebugRenderer() {
    const scene = Engine.get().getScene();
    const world = this.getWorld();
    if (!scene || !world) {
      return console.warn('Debug renderer missing scene or world.');
    }
    return super.withDebugRenderer(new CannonDebugRenderer(scene, world));
  }
}

export default CannonPhysics;
