import Events from './events.js';
import Physics from './physics.js';
import Settings from './settings.js';
import { createUUID } from './util.js';

/**
 * Super class for all entities within the game, mostly those
 * that are updated by the physics engine.
 */
class Entity {

  constructor(parentGame) {
    this.uuid = createUUID();
    this.parentGame = parentGame;
    this.mesh = null;
    this.physicsObject = null;
    this.actions = {}; // Map of action -> value (0 - 1)
    this.inputDevice = 'keyboard';
    this.mouseMovement = {
      x: 0,
      y: 0
    };
    this.mouseSensitivity = 50;

    if (!forServer) {
      this.enableMouseY = Settings.get().settingsObject.mouse_y;
      this.mouseSensitivity = Settings.get().settingsObject.mouse_sensitivity;
      this.settingsListener = Events.get().addListener(
        'settings', this.handleSettingsChange.bind(this)
      );
    }
  }

  /**
   * Serializes the physics aspect of the entity.
   */
  serializePhysics() {
    const body = this.physicsObject;
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
    if (!this.mesh || !this.physicsObject) {
      return;
    }
    this.mesh.position.x = this.physicsObject.interpolatedPosition[0];
    this.mesh.position.z = this.physicsObject.interpolatedPosition[1];
    this.mesh.rotation.y = -this.physicsObject.interpolatedAngle;
  }

  /** 
   * Updates the entity based on data sent from the server.
   */
  consumeUpdate(physics) {
    if (!physics)
      return;
    const [angVelo, pos, velo, rot] = physics;
    this.physicsObject.angularVelocity = angVelo;
    this.physicsObject.angle = rot;
    p2.vec2.copy(this.physicsObject.position, pos);
    p2.vec2.copy(this.physicsObject.velocity, velo);
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
   * Handles the settings change event.
   */
  handleSettingsChange(e) {
    const settings = e.settings;
    this.enableMouseY = settings.mouse_y;
    this.mouseSensitivity = settings.mouse_sensitivity;
  }
}

export default Entity;