/**
 * @author rogerscg / https://github.com/rogerscg
 */
import CannonDebugRenderer from './cannon_debug_renderer.js';
import Engine from '../core/engine.js';
import Physics from '../core/physics.js';

const MAX_DELTA = 1;
const MAX_SUBSTEPS = 10;

/**
 * API implementation for Cannon.js, a pure JavaScript physics engine.
 * https://github.com/schteppe/cannon.js
 */
class CannonPhysics extends Physics {
  constructor() {
    super();
    this.physicalMaterials = new Map();
    this.contactMaterials = new Map();
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
    delta = Math.min(MAX_DELTA, delta);
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
    this.world.remove(entity.physicsBody);
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
      w: rotation.w
    };
  }

  /** @override */
  enableDebugRenderer() {
    return;
    // TODO: Get parent ERA world (or make debug rendering part of world).
    const scene = Engine.get().getScene();
    const world = this.getWorld();
    if (!scene || !world) {
      return console.warn('Debug renderer missing scene or world.');
    }
    this.debugRenderer = new CannonDebugRenderer(scene, world);
    return this.debugRenderer;
  }

  /** @override */
  autogeneratePhysicsBody(mesh) {
    // Root body.
    const body = new CANNON.Body({ mass: 0 });
    mesh.traverse((child) => {
      const physicsType = child.userData.physics;
      if (!physicsType) {
        return;
      }
      switch (physicsType) {
        case 'BOX':
          this.autogenerateBox(body, child);
          break;
      }
    });
    return body;
  }

  /** @override */
  registerContactHandler(entity) {
    entity.physicsBody.addEventListener('collide', (e) => {
      entity.handleCollision(e);
    });
  }

  /**
   * Generates a box shape and attaches it to the root body.
   * @param {CANNON.Body} body
   * @param {THREE.Mesh} mesh
   */
  autogenerateBox(body, mesh) {
    const boundingBox = mesh.geometry.boundingBox;
    let size = new THREE.Vector3();
    boundingBox.getSize(size);
    size.divideScalar(2);
    size = size.multiplyVectors(size, mesh.scale);
    const shape = new CANNON.Box(new CANNON.Vec3().copy(size));
    const position = new CANNON.Vec3().copy(mesh.position);
    const quaternion = new CANNON.Quaternion().copy(mesh.quaternion);
    body.addShape(shape, position, quaternion);
  }

  /**
   * Creates a new physical material for the given name and options. If the
   * physical material already exists, return the existing one.
   */
  createPhysicalMaterial(name, options) {
    if (!this.physicalMaterials.has(name)) {
      const material = new CANNON.Material(options);
      this.physicalMaterials.set(name, material);
    }
    return this.physicalMaterials.get(name);
  }

  /**
   * Creates a new contact material between two given names. If the contact
   * material already exists, return the existing one.
   */
  createContactMaterial(name1, name2, options) {
    // TODO: Allow for "pending" contact material if one of the materials has
    // not been created yet.
    const key = this.createContactKey(name1, name2);
    if (!this.contactMaterials.has(key)) {
      const mat1 = this.createPhysicalMaterial(name1);
      const mat2 = this.createPhysicalMaterial(name2);
      const contactMat = new CANNON.ContactMaterial(mat1, mat2, options);
      this.contactMaterials.set(key, contactMat);
      this.world.addContactMaterial(contactMat);
    }
    return this.contactMaterials.get(key);
  }

  /**
   * Creates a combined string to use as a key for contact materials.
   */
  createContactKey(name1, name2) {
    // Alphabetize, then concatenate.
    if (name1 < name2) {
      return `${name1},${name2}`;
    }
    return `${name2},${name1}`;
  }
}

export default CannonPhysics;
