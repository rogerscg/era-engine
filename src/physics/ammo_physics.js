/**
 * @author rogerscg / https://github.com/rogerscg
 */
import Physics from "../core/physics.js";

const MAX_SUBSTEPS = 10;

// Initialize Ammo.
window.Ammo ? Ammo() : null;

/**
 * API implementation for Ammo.js, a Bullet port to JavaScript.
 * https://github.com/kripken/ammo.js
 */
class AmmoPhysics extends Physics {
  constructor() {
    super();
    this.posTrans = new Ammo.btTransform();
    this.rotTrans = new Ammo.btTransform();
  }

  /** @override */
  createWorld() {
    const config = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(config);
    const broadphase = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const world =
      new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, config);
    world.setGravity(new Ammo.btVector3(0, -20, 0));
    return world;
  }

  /** @override */
  step(delta) {
    delta /= 1000;
    this.world.stepSimulation(delta, MAX_SUBSTEPS);
  }

  /** @override */
  registerEntity(entity) {
    if (!super.registerEntity(entity)) {
      return;
    }
    this.world.addRigidBody(entity.physicsBody);
  }

  /** @override */
  unregisterEntity(entity) {
    if (!super.unregisterEntity(entity)) {
      return;
    }
    this.world.removeRigidBody(entity.physicsBody);
  }

  /** @override */
  registerComponent(body) {
    console.warn('Unregister entity not defined');
  }

  /** @override */
  unregisterComponent(body) {
    this.world.removeRigidBody(body);
  }

  /** @override */
  getPosition(entity) {
    entity.physicsBody.getMotionState().getWorldTransform(this.posTrans);
    return {
      x: this.posTrans.getOrigin().x(),
      y: this.posTrans.getOrigin().y(),
      z: this.posTrans.getOrigin().z()
    };
  }

  /** @override */
  getRotation(entity) {
    entity.physicsBody.getMotionState().getWorldTransform(this.rotTrans);
    return {
      x: this.rotTrans.getRotation().x(),
      y: this.rotTrans.getRotation().y(),
      z: this.rotTrans.getRotation().z(),
      w: this.rotTrans.getRotation().w(),
    }
  }
}

export default AmmoPhysics;
