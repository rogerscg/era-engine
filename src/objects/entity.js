/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Animation from '../core/animation.js';
import Autogenerator from '../physics/autogenerator.js';
import Controls from '../core/controls.js';
import EventTarget from '../events/event_target.js';
import Models from '../core/models.js';
import Physics from '../physics/physics_plugin.js';
import Settings from '../core/settings.js';
import SettingsEvent from '../events/settings_event.js';
import { Bindings } from '../core/bindings.js';
import { createUUID } from '../core/util.js';

const ENTITY_BINDINGS = {
  BACKWARD: {
    keys: {
      keyboard: 83,
      controller: '+axes1'
    }
  },
  FORWARD: {
    keys: {
      keyboard: 87,
      controller: '-axes1'
    }
  },
  LEFT: {
    keys: {
      keyboard: 65,
      controller: '-axes0'
    }
  },
  RIGHT: {
    keys: {
      keyboard: 68,
      controller: '+axes0'
    }
  }
};

const CONTROLS_ID = 'Entity';

/**
 * Super class for all entities within the game, mostly those
 * that are updated by the physics engine.
 */
class Entity extends EventTarget {
  static GetBindings() {
    return new Bindings(CONTROLS_ID).load(ENTITY_BINDINGS);
  }

  constructor() {
    super();
    // ERA Engine Properties.
    this.uuid = createUUID();
    this.world = null;
    this.built = false;
    this.parent = null;
    this.children = new Set();
    this.positionValue = new THREE.Vector3();
    this.rotationValue = new THREE.Quaternion();
    this.oldShapeOffset = new THREE.Vector3();

    // Rendering properties.
    this.visualRoot = new THREE.Object3D();
    this.modelName = null;
    this.mesh = null;
    this.cameraArm = null;
    this.registeredCameras = new Set();
    this.meshEnabled = true;
    this.qualityAdjustEnabled = true;

    // Physics properties.
    this.physicsBody = null;
    this.physicsShapes = new Set();
    this.physicsEnabled = true;
    this.physicsWorld = null;
    this.autogeneratePhysics = false;
    this.meshRotationLocked = false;

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
    this.inputVector = new THREE.Vector3();
    this.cameraQuaternion = new THREE.Quaternion();
    this.cameraEuler = new THREE.Euler();
    this.cameraEuler.order = 'YXZ';

    SettingsEvent.listen(this.handleSettingsChange.bind(this));
  }

  /**
   * Enables physics generation.
   */
  withPhysics() {
    this.physicsEnabled = true;
    return this;
  }

  /**
   * Provides the Entity with the ERA world to which it belongs.
   * @param {World} world
   */
  setWorld(world) {
    this.world = world;
  }

  /**
   * Returns the ERA world to which the Entity belongs.
   * @return {World}
   */
  getWorld() {
    return this.world;
  }

  /**
   * Setter for position.
   * @param {THREE.Vector3} value
   */
  set position(value) {
    this.setPosition(value);
  }

  /**
   * @param {THREE.Vector3|CANNON.Vec3} position
   * @return {Entity}
   */
  setPosition(position) {
    this.positionValue.copy(position);
    if (this.physicsEnabled) {
      // If this is the root physics body, simple move it by its position.
      if (this.physicsBody) {
        this.physicsBody.position.copy(position);
        return;
      }
      // If the entity is a set of shapes attached to a higher-level root,
      // change the offset of each shape.
      if (this.physicsShapes.size) {
        this.physicsShapes.forEach((shape) => {
          shape.offset.vsub(this.oldShapeOffset, shape.offset);
          shape.offset.vadd(this.positionValue, shape.offset);
        });
        this.oldShapeOffset.copy(this.positionValue);
      }
    } else {
      this.visualRoot.position.copy(position);
    }
  }

  /**
   * Gets the position of the entity within the ERA world.
   * @return {THREE.Vector3|CANNON.Vec3}
   */
  getPosition() {
    if (this.physicsEnabled) {
      if (this.physicsBody) {
        this.positionValue.copy(this.physicsBody.position);
        return this.positionValue;
      }
      if (this.physicsShapes.size) {
        this.positionValue.copy(this.oldShapeOffset);
        return this.positionValue;
      }
    }
    this.positionValue.copy(this.visualRoot.position);
    return this.positionValue;
  }

  /**
   * Refreshes the position of the entity. Used for building/adding/removing
   * entities.
   */
  refreshPosition() {
    this.setPosition(this.positionValue);
  }

  /**
   * Setter for rotation.
   * @param {THREE.Quaternion} value
   */
  set rotation(value) {
    this.setRotation(value);
  }

  /**
   * @param {THREE.Quaternion|CANNON.Quaternion} quaternion
   * @return {Entity}
   */
  setRotation(quaternion) {
    if (!this.rotationValue) {
      this.rotationValue = quaternion;
    }
    if (this.physicsEnabled && this.physicsBody) {
      this.physicsBody.quaternion.copy(quaternion);
      // TODO: Rotate individual shapes.
    } else {
      this.visualRoot.quaternion.copy(quaternion);
    }
  }

  /**
   * Adds an entity as a child of the current entity. This affects both visual
   * and physical properties of the entities, adding the visual root of the
   * provided entity to the current entity's visual root, delegating control to
   * Three.js. In order to assume physical components, the provided entity's
   * shapes must be added to the current entity's body (or fired upwards to the
   * root entity's body).
   * @param {Entity} entity
   */
  add(entity) {
    if (!entity) {
      return console.error('Added entity not provided');
    }
    // Remove provided entity from their existing parent, if it has one.
    if (entity.parent) {
      if (this.children.has(entity)) {
        return console.warn('Added entity already child');
      }
      entity.parent.remove(entity);
    }
    this.children.add(entity);
    entity.parent = this;
    // Build the entity if the current entity has been built and the provided
    // entity has not.
    if (this.built && !entity.built) {
      entity.build();
    }
    // Add visual root
    this.visualRoot.add(entity.visualRoot);
    // Handle physics addition. If the physics body is not yet defined,
    const rootBody = this.getRootPhysicsBody();
    if (rootBody) {
      // TODO: Add shapes to physics body.
      console.log(rootBody);
    }
  }

  /**
   * Removes the provided entity from the current entity. This also implicitly
   * forces the shapes of the provided entity to be placed into their own body.
   * @param {Entity} entity
   */
  remove(entity) {
    // TODO: Implement.
  }

  /**
   * Finds the root physics body for the entity by searching upwards towards the
   * parent.
   * @return {CANNON.Body}
   */
  getRootPhysicsBody() {
    if (this.physicsBody) {
      return this.physicsBody;
    }
    if (this.parent) {
      return this.parent.getRootPhysicsBody();
    }
    return null;
  }

  /**
   * Traverses the entity's ancestors to get the root scene in the ERA
   * world.
   * @return {THREE.Scene}
   */
  getRootScene() {
    if (
      this.visualRoot &&
      this.visualRoot.parent &&
      this.visualRoot.parent.isRootScene
    ) {
      return this.visualRoot.parent;
    }
    if (this.parent) {
      return this.parent.getRootScene();
    }
    return null;
  }

  /**
   * Traverses the provided object's ancestors to get the root scene, which has a
   * property with the parent ERA world.
   * @param {THREE.Object3D} object
   * @return {World}
   */
  getRootWorld(object) {
    const rootScene = this.getRootScene();
    return rootScene && rootScene.parentWorld ? rootScene.parentWorld : null;
  }

  /**
   * Callback that's fired when an entity is added to a world.
   */
  onAdd() {}

  /**
   * Callback that's fired when an entity is removed from a world.
   */
  onRemove() {}

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
    if (this.built) {
      // Build children in case they haven't been built yet.
      this.children.forEach((child) => child.build());
      return this;
    }
    this.mesh = this.generateMesh();
    if (this.mesh) {
      this.visualRoot.add(this.mesh);
      this.animationMixer = Animation.get().createAnimationMixer(
        this.modelName,
        this.visualRoot
      );
      this.animationClips = Animation.get().getClips(this.modelName);
      if (Settings.get('shadows')) {
        this.enableShadows();
      }
    }
    this.cameraArm = this.createCameraArm();
    this.generatePhysicsInternal_();
    this.built = true;
    this.refreshPosition();
    this.children.forEach((child) => child.build());
    return this;
  }

  /**
   * Destroys the entity by unregistering from all core components and disposing
   * of all objects in memory.
   */
  destroy() {
    const world = this.getRootWorld(this);
    if (!world) {
      return console.warn('Destroyed entity has no root world');
    }
    world.remove(this);
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
    if (!this.meshEnabled) {
      return;
    }
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
    this.visualRoot.add(obj);
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
    this.cameraArm.add(camera);
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);
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
   * Internal entity function for settings physics properties based on the
   * entity's state within the entity hierarchy (root body, children shapes).
   * @private
   */
  generatePhysicsInternal_() {
    const body = this.generatePhysicsBody();
    // If no body is defined, physics is not enabled.
    if (!body) {
      return;
    }
    // If this is a root, set the physics body to be the generated body.
    if (!this.parent) {
      this.physicsBody = body;
      body.shapes.forEach((shape) => this.physicsShapes.add(shape));
      return;
    }
    // At this point, there is a parent that should have a physics body.
    // Otherwise, we are trying to add a physical entity to a non-physical
    // entity, which is an error.
    const root = this.getRootPhysicsBody();
    if (!root) {
      return console.error(
        'Entity has parent, but no root physics body found',
        this
      );
    }
    // Add the shapes of the generated body to the parent.
    body.shapes.forEach((shape, i) => {
      // TODO: Look for child positioning relative to parent as well. Will need
      // to be updated once positioning is changed anywhere in the hierarchy.
      root.addShape(shape);
      this.physicsShapes.add(shape);
    });
  }

  /**
   * Creates the physics object for the entity. This should be defined by each
   * entity.
   * @return {CANNON.Body}
   */
  generatePhysicsBody() {
    if (!this.physicsEnabled) {
      return null;
    }
    if (this.autogeneratePhysics) {
      return Autogenerator.generatePhysicsBody(this.mesh);
    }
    return null;
  }

  /**
   * Handles a collision internally, ensuring that all child entities are
   * alerted of a collision.
   * @param {?} e
   */
  handleCollisionInternal(e) {
    // If either of the contact shapes pertain to this entity, fire the handler.
    if (
      this.physicsShapes.has(e.contact.si) ||
      this.physicsShapes.has(e.contact.sj)
    ) {
      this.handleCollision(e);
    }
    this.children.forEach((child) => child.handleCollisionInternal(e));
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
    if (!body) return null;
    const precision = 4;
    // TODO: make this engine-agnostic.
    return [
      [body.angularVelocity.toFixed(precision)],
      body.interpolatedPosition.map((x) => x.toFixed(precision)),
      body.velocity.map((x) => x.toFixed(precision)),
      [body.angle.toFixed(precision)]
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
    if (
      this.actions.has(action.getName()) &&
      this.actions.get(action.getName()) === value
    ) {
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
   * An internal update used for key calculations. This is to ensure users of
   * this class do not need to remember to call the super method.
   * @param {number} delta
   * @protected
   */
  updateInternal(delta) {
    this.lastMouseMovement.copy(this.mouseMovement);
    this.mouseMovement.set(0, 0);
    if (this.bindings) {
      this.calculateInputVector();
    }
    const position = this.getPosition();
    const rotation = this.physicsWorld
      ? this.physicsWorld.getRotation(this)
      : null;
    this.visualRoot.position.copy(position);
    if (rotation != null && rotation.w != null && !this.meshRotationLocked) {
      this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
    // User updates and children updates.
    this.update(delta);
    this.children.forEach((child) => child.updateInternal(delta));
  }

  /**
   * Called every step of the physics engine to keep the mesh and physics object
   * synchronized. Should be implemented by the user.
   */
  update(delta) {}

  /**
   * Calculates the input vector of the entity.
   */
  calculateInputVector() {
    const inputVector = this.inputVector;
    inputVector.set(0, 0, 0);
    if (this.getActionValue(this.bindings.FORWARD)) {
      inputVector.z -= this.getActionValue(this.bindings.FORWARD);
    }
    if (this.getActionValue(this.bindings.BACKWARD)) {
      inputVector.z += this.getActionValue(this.bindings.BACKWARD);
    }
    if (this.getActionValue(this.bindings.LEFT)) {
      inputVector.x -= this.getActionValue(this.bindings.LEFT);
    }
    if (this.getActionValue(this.bindings.RIGHT)) {
      inputVector.x += this.getActionValue(this.bindings.RIGHT);
    }
    // Update input vector with camera direction.
    const camera = this.getWorld()
      ? this.getWorld().getAssociatedCamera(this)
      : null;
    if (camera) {
      camera.getWorldQuaternion(this.cameraQuaternion);
      this.cameraEuler.setFromQuaternion(this.cameraQuaternion);
      // We only care about the X and Z axis, so remove the angle looking down
      // on the character.
      this.cameraEuler.x = 0;
      this.cameraQuaternion.setFromEuler(this.cameraEuler);
    }
    inputVector.applyQuaternion(this.cameraQuaternion);
    inputVector.normalize();
  }

  /**
   * Updates the entity based on data sent from the server.
   */
  consumeUpdate(physics) {
    if (!physics) return;
    // TODO: Update this to use Cannon.
    const [angVelo, pos, velo, rot] = physics;
    this.physicsBody.angularVelocity = angVelo;
    this.physicsBody.angle = rot;
    p2.vec2.copy(this.physicsBody.position, pos);
    p2.vec2.copy(this.physicsBody.velocity, velo);
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
      action.crossFadeFrom(this.currentAction, 0.2, true);
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

  /**
   * Enables shadows to be cast and received by the entity.
   */
  enableShadows() {
    this.visualRoot.traverse((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
  }

  /**
   * Disabled shadows from being cast and received by the entity.
   */
  disableShadows() {
    this.visualRoot.traverse((child) => {
      child.castShadow = false;
      child.receiveShadow = false;
    });
  }

  /**
   * Handles a settings change event.
   */
  handleSettingsChange() {}
}

export default Entity;
