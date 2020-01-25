/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Animation from './animation.js';
import Controls from './controls.js';
import Engine from './engine.js';
import Models from './models.js';
import Physics from './physics.js';
import {Bindings} from './bindings.js';
import {Object3DEventTarget} from '../events/event_target.js';
import {createUUID} from './util.js';

const ENTITY_BINDINGS = {
  BACKWARD: {
    keys: {
      keyboard: 83,
      controller: '+axes1',
    }
  },
  FORWARD: {
    keys: {
      keyboard: 87,
      controller: '-axes1',
    }
  },
  LEFT: {
    keys: {
      keyboard: 65,
      controller: '-axes0',
    }
  },
  RIGHT: {
    keys: {
      keyboard: 68,
      controller: '+axes0',
    }
  },
};

const CONTROLS_ID = 'Entity';

/**
 * Super class for all entities within the game, mostly those
 * that are updated by the physics engine.
 */
class Entity extends Object3DEventTarget {
  static GetBindings() {
    return new Bindings(CONTROLS_ID).load(ENTITY_BINDINGS);
  }

  constructor() {
    super();
    this.uuid = createUUID();
    this.modelName = null;
    this.mesh = null;
    this.cameraArm;
    this.registeredCameras = new Set();

    // Physics properties.
    this.physicsBody = null;
    this.physicsEnabled = false;
    this.physicsWorld = null;
    this.autogeneratePhysics = false;

    // Animation properties.
    this.animationMixer = null;
    this.animationClips = null;
    this.currentAction = null;

    // Controls properties.
    this.actions = new Map(); // Map of action -> value (0 - 1)
    this.bindings = Controls.get().getBindings(this.getControlsId());
    this.inputDevice = 'keyboard';
    this.playerNumber = null;
    this.lastMouseMovement = new THREE.Vector2();
    this.mouseMovement = new THREE.Vector2();
  }

  /**
   * Enables physics generation with the given physics instance.
   * @param {Physics=} physics
   */
  withPhysics(physics) {
    this.physicsWorld = physics;
    this.physicsEnabled = true;
    return this;
  }

  /**
   * Sets the entity to be attached to a certain local player, used explicitly
   * for split-screen/local co-op experiences.
   * @param {number} playerNumber
   */
  setPlayerNumber(playerNumber) {
    this.playerNumber = playerNumber;
    return this;
  }

  getPlayerNumber() {
    return this.playerNumber;
  }

  /**
   * Returns the static controls ID for the entity. Needs to be defined for
   * each entity with unique controls.
   */
  getControlsId() {
    return CONTROLS_ID;
  }

  /**
   * Returns the default set of bindings for the entity.
   * @returns {Bindings}
   */
  getDefaultBindings() {
    return this.constructor.GetBindings();
  }

  /**
   * Creates the mesh and physics object.
   */
  build() {
    this.mesh = this.generateMesh();
    if (this.mesh) {
      this.add(this.mesh);
      this.animationMixer =
        Animation.get().createAnimationMixer(this.modelName, this);
      this.animationClips = Animation.get().getClips(this.modelName);
    }
    this.cameraArm = this.createCameraArm();
    if (this.physicsEnabled) {
      this.physicsBody = this.generatePhysicsBody();
    }
    Engine.get().registerEntity(this);
    return this;
  }

  /**
   * Destroys the entity by unregistering from all core components and disposing
   * of all objects in memory.
   */
  destroy() {
    if (this.parent) {
      this.parent.remove(this);
    }
    if (this.physicsWorld) {
      this.physicsWorld.unregisterEntity(this);
    }
    Engine.get().unregisterEntity(this);
  }

  /**
   * Registers a physics instance to the entity. This is used for communicating
   * with the physics engine.
   * @param {Physics} physics
   */
  registerPhysicsWorld(physics) {
    this.physicsWorld = physics;
  }

  /**
   * Unregisters a physics instance from the entity.
   * @param {Physics} physics
   */
  unregisterPhysicsWorld(physics) {
    if (this.physicsWorld && this.physicsWorld.uuid == physics.uuid) {
      this.physicsWorld = null;
    }
  }

  /**
   * Creates the mesh for the entity, using the entity name provided.
   */
  generateMesh() {
    if (!this.modelName) {
      return console.warn('Model name not provided');
    }
    const scene = Models.get().createModel(this.modelName);
    return scene;
  }

  /**
   * Creates a camera arm for the entity. All cameras will be automatically
   * added to this arm by default.
   */
  createCameraArm() {
    const obj = new THREE.Object3D();
    this.add(obj);
    return obj;
  }

  /**
   * Attaches a camera to the entity. It can be assumed that the camera has been
   * properly detached from other entities and is ready for spatial mutations.
   * @param {THREE.Camera} camera
   */
  attachCamera(camera) {
    if (this.registeredCameras.has(camera)) {
      return console.warn('Camera already registered on entity');
    }
    this.registeredCameras.add(camera);
    this.positionCamera(camera);
  }

  /**
   * Positions the camera when attaching. This should be overriden by custom
   * entities, not the attachCamera function.
   * @param {THREE.Camera} camera 
   */
  positionCamera(camera) {
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
    this.cameraArm.add(camera);
  }

  /**
   * Detaches a camera from the entity.
   * @param {THREE.Camera} camera
   */
  detachCamera(camera) {
    if (!this.registeredCameras.has(camera)) {
      return console.warn('Camera not registered on entity');
    }
    camera.parent.remove(camera);
    this.registeredCameras.delete(camera);
  }

  /**
   * Creates the physics object for the entity. This should be defined by each
   * entity.
   */
  generatePhysicsBody() {
    if (!this.physicsEnabled) {
      return;
    }
    if (this.autogeneratePhysics) {
      return this.autogeneratePhysicsBody();
    }
    console.warn('generatePhysicsBody not implemented for entity');
  }

  /**
   * Creates a physics body based on extra data provided from the model, such as
   * userData. This only works for a select number of objects, so please use
   * this carefully.
   */
  autogeneratePhysicsBody() {
    return this.physicsWorld.autogeneratePhysicsBody(this.mesh);
  }

  /**
   * Handles a collision for the entity.
   * @param {?} e
   */
  handleCollision(e) {}

  /**
   * Serializes the physics aspect of the entity.
   */
  serializePhysics() {
    const body = this.physicsBody;
    if (!body)
      return null;
    const precision = 4;
    // TODO: make this engine-agnostic.
    return [
      [body.angularVelocity.toFixed(precision)],
      body.interpolatedPosition.map((x) => x.toFixed(precision)),
      body.velocity.map((x) => x.toFixed(precision)),
      [body.angle.toFixed(precision)],
    ];
  }

  getMesh() {
    return this.mesh;
  }

  /**
   * Clears all input registered to the entity. This is used in
   * the case controller input is removed from the entity.
   */
  clearInput() {
    this.actions.clear();
    this.mouseMovement.set(0, 0);
    this.lastMouseMovement.set(0, 0);
  }

  /**
   * Sets an action to the specified value for the entity
   */
  setAction(action, value) {
    if (this.actions.has(action.getName()) &&
        this.actions.get(action.getName()) === value) {
      return;
    }
    if (value !== 0) {
      this.actions.set(action.getName(), value);
    } else {
      this.actions.delete(action.getName());
    }
  }

  /**
   * Check the force a registered action is pressed with.
   * @param {string} binding 
   * @returns {number}
   */
  getActionValue(actionName) {
    return this.actions.get(actionName) || 0;
  }

  /**
   * Gets the last mouse movement registered. Does not directly read from mouse
   * movement in order to better handle clearing.
   */
  getMouseMovement() {
    return this.lastMouseMovement;
  }

  /**
   * Sets the mouse movement vector for the entity.
   */
  setMouseMovement(x, y) {
    this.mouseMovement.x += x;
    this.mouseMovement.y += y;
  }

  /**
   * Takes in data passed from the client to the server as input.
   */
  setInputFromData(data) {
    this.mouseMovement = data.mouseMovement;
    this.cameraRotation = data.cameraRotation;
    this.actions = data.actions ? data.actions : {};
    this.inputDevice = data.inputDevice;
  }

  /**
   * Called every step of the physics engine to keep the mesh and physics object
   * synchronized.
   */
  update() {
    if (!this.mesh || !this.physicsBody || !this.physicsWorld) {
      return;
    }
    const position = this.physicsWorld.getPosition(this);
    const rotation = this.physicsWorld.getRotation(this);
    if (position.x != null) {
      this.position.x = position.x;
    }
    if (position.y != null) {
      this.position.y = position.y;
    }
    if (position.z != null) {
      this.position.z = position.z;
    }
    if (rotation.w != null) {
      this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
    this.lastMouseMovement.copy(this.mouseMovement);
    this.mouseMovement.set(0, 0);
  }

  /** 
   * Updates the entity based on data sent from the server.
   */
  consumeUpdate(physics) {
    if (!physics)
      return;
      // TODO: make this engine-agnostic.
    const [angVelo, pos, velo, rot] = physics;
    this.physicsBody.angularVelocity = angVelo;
    this.physicsBody.angle = rot;
    p2.vec2.copy(this.physicsBody.position, pos);
    p2.vec2.copy(this.physicsBody.velocity, velo);
  }

  /**
   * Registers the entity to the physics engine.
   */
  registerToPhysics() {
    Physics.get().registerEntity(this);
  }

  /**
   * Registers a component of an entity to the physics engine. This
   * is primarily used if there is a body separate from the entity's
   * main physics body.
   */
  registerComponent(body) {
    Physics.get().registerComponent(body);
  }

  /**
   * Finds an animation clip by name.
   * @param {string} name
   * @returns {THREE.AnimationClip}
   */
  getAnimationClip(name) {
    if (!name || !this.animationClips) {
      return null;
    }
    return THREE.AnimationClip.findByName(this.animationClips, name);
  }

  /**
   * Plays an animation given a name.
   * @param {string} name
   * @returns {THREE.AnimationAction}
   */
  playAnimation(name) {
    if (!name) {
      return null;
    }
    const clip = this.getAnimationClip(name);
    if (!clip) {
      return null;
    }
    const action = this.animationMixer.clipAction(clip);
    action.reset();
    if (this.currentAction) {
      action.crossFadeFrom(this.currentAction, .2, true);
    }
    action.play();
    this.currentAction = action;
    return action;
  }

  /**
   * Stops all animations on the entity.
   */
  stopAllAnimation() {
    this.animationMixer.stopAllAction();
    this.currentAction = null;
  }
}

export default Entity;