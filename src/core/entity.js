import Models from './models.js';
import Physics from './physics.js';
import Settings from './settings.js';
import {createUUID} from './util.js';
import SettingsEvent from '../events/settings_event.js';
import Engine from './engine.js';

/**
 * Super class for all entities within the game, mostly those
 * that are updated by the physics engine.
 */
class Entity extends THREE.Object3D {

  constructor(parentGame) {
    super();
    this.uuid = createUUID();
    this.parentGame = parentGame;
    this.mesh = null;
    this.cameraArm;
    this.modelName = null;
    this.physicsBody = null;
    this.physicsEnabled = false;
    this.actions = {}; // Map of action -> value (0 - 1)
    this.inputDevice = 'keyboard';
    this.registeredCameras = new Set();
    this.mouseMovement = {
      x: 0,
      y: 0
    };
    this.mouseSensitivity = 50;
    SettingsEvent.listen(this.loadSettings.bind(this));
  }

  withPhysics() {
    this.physicsEnabled = true;
    return this;
  }

  /**
   * Creates the mesh and physics object.
   */
  build() {
    if (this.modelName) {
      this.generateMesh();
    }
    if (this.physicsEnabled) {
      this.generatePhysicsBody();
    }
    return this;
  }

  /**
   * Creates the mesh for the entity, using the entity name provided.
   */
  generateMesh() {
    if (!this.modelName) {
      return console.warn('Model name not provided');
    }
    const scene = Models.get().storage.get(this.modelName).clone();
    this.mesh = scene;
    this.add(this.mesh);
    this.cameraArm = this.createCameraArm();
    return this.mesh;
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
    add(camera);
    this.registeredCameras.delete(camera);
  }

  /**
   * Creates the physics object for the entity. This should be defined by each
   * entity.
   */
  generatePhysicsBody() {
    if (this.physicsEnabled) {
      return console.warn('generatePhysicsBody not implemented for entity');
    }
  }

  /**
   * Serializes the physics aspect of the entity.
   */
  serializePhysics() {
    const body = this.physicsBody;
    if (!body)
      return null;
    const precision = 4;
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
    this.actions = {};
    this.mouseMovement = {
      x: 0,
      y: 0
    };
    this.parentGame.sendInput(this);
  }

  /**
   * Sets an action to the specified value for the entity
   */
  setAction(action, value) {
    if (this.actions[action] && this.actions[action] === value) {
      return;
    }
    if (value !== 0) {
      this.actions[action] = value;
    } else {
      delete this.actions[action];
    }
    this.parentGame.sendInput(this);
  }

  /**
   * Returns if input bound to a specific function is present.
   */
  isKeyPressed(binding) {
    return this.actions && this.actions[binding.binding_id];
  }

  /**
   * Check the force a key is pressed with
   * @param {String} binding 
   */
  getForce(binding) {
    return this.actions[binding.binding_id] || 0;
  }

  /**
   * Sets the mouse movement vector for the entity.
   */
  setMouseMovement(x, y) {
    const ratio = this.mouseSensitivity / 50;
    if (this.enableMouseY) {
      this.mouseMovement.y = x * ratio;
      this.mouseMovement.x = y * ratio;
    } else {
      this.mouseMovement.x = x * ratio;
      this.mouseMovement.y = y * ratio;
    }
    this.parentGame.sendInput(this);
    if (!this.parentGame.isOffline) {
      this.mouseMovement.x = 0;
      this.mouseMovement.y = 0;
    }
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
    if (!this.mesh || !this.physicsBody) {
      return;
    }
    this.mesh.position.x = this.physicsBody.interpolatedPosition[0];
    this.mesh.position.z = this.physicsBody.interpolatedPosition[1];
    this.mesh.rotation.y = -this.physicsBody.interpolatedAngle;
  }

  /** 
   * Updates the entity based on data sent from the server.
   */
  consumeUpdate(physics) {
    if (!physics)
      return;
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
    let physics;
    if (this.parentGame && this.parentGame.physics) {
      physics = this.parentGame.physics;
    } else {
      physics = Physics.get();
    }
    physics.registerComponent(body);
  }

  /**
   * Loads entity settings.
   */
  loadSettings() {
    this.enableMouseY = Settings.get('mouse_y');
    this.mouseSensitivity = Settings.get('mouse_sensitivity');
  }
}

export default Entity;