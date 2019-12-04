import Bindings from '../data/bindings.js';
import Engine from './engine.js';
import Events from './events.js';
import Plugin from './plugin.js';
import Settings from './settings.js';
import SettingsEvent from '../events/settings_event.js';

let instance = null;

/**
 * The controls core for the game. Input handlers are created here. Once the
 * input is received, the response is delegated to the entity in control.
 */
class Controls extends Plugin {
  /**
   * Enforces singleton controls instance.
   */
  static get() {
    if (!instance) {
      instance = new Controls();
    }
    return instance;
  }

  constructor() {
    super();
    this.previousInput = {};

    this.registeredEntities = new Map();
    this.controlsEnabled = true;

    this.hasController = false;
    this.controllerListeners = [];

    document.addEventListener('keydown', e => this.setActions(e.keyCode, 1));
    document.addEventListener('keyup', e => this.setActions(e.keyCode, 0));
    document.addEventListener('mousedown', e => this.setActions(e.button, 1));
    document.addEventListener('mouseup', e => this.setActions(e.button, 0));

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('click', this.onMouseClick.bind(this));

    window.addEventListener("gamepadconnected", this.startPollingController.bind(this));
    window.addEventListener("gamepaddisconnected", this.stopPollingController.bind(this));

    this.loadSettings();
    
    SettingsEvent.listen(this.loadSettings.bind(this));
  }

  /** @override */
  reset() {
    this.registeredEntities = new Map();
    this.forcePointerLockState(undefined);
  }

  /** @override */
  update() {}

  registerBindings() {
    // Merge default bindings with custom controls
    // Stringify and parse so it's 100% certain a copy
    // Avoids editing the defaults
    this.bindings = JSON.parse(JSON.stringify(Bindings));
    for (let customBindingName of Object.keys(this.customControls)) {
      for (let device of Object.keys(this.customControls[customBindingName].keys)) {
        const customKey = this.customControls[customBindingName].keys[device]
        this.bindings[customBindingName].keys[device] = customKey
      }
    }

    // Generate a map of keys -> actions to trigger
    this.boundActions = this.generateBoundActions(this.bindings);
  }

  /**
   * Generate a map of key codes and the actions they trigger
   * Used to send the actions over the network when the key is pressed
   */
  generateBoundActions(bindings) {
    let boundActions = {}
    for(let bindingName of Object.keys(bindings)) {
      for(let key of Object.values(bindings[bindingName].keys)) {
        const actionList = boundActions[key] || [];
        actionList.push(Bindings[bindingName].binding_id)
        boundActions[key] = actionList;
      }
    }
    return boundActions;
  }

  /**
   * Get all valid keys for the binding
   * @param {Object} binding 
   */
  getKeys(bindingName) {
    return Object.values(this.bindings[bindingName].keys);
  }

  /**
   * Get the key specifically for device
   * @param {Object} binding 
   */
  getBinding(bindingName, device) {
    return this.bindings[bindingName].keys[device];
  }

  /**
   * Universally enables all controller input.
   */
  enable() {
    this.controlsEnabled = true;
  }

  /**
   * Universally disables all controller input.
   */
  disable() {
    if (!window.engine) {
      return;
    }
    this.controlsEnabled = false;
    if (engine.getMainPlayer()) {
      engine.getMainPlayer().clearInput();
    }
  }

  /**
   * When a controller is detected, poll it
   */
  startPollingController() {
    if(!this.hasController) {
      this.hasController = true;
      this.controllerTick();
    }
  }

  /**
   * When a controller is disconnect, stop polling
   */
  stopPollingController() {
    this.hasController = false;
  }

  /**
   * Check status, send to server
   * Loop through all axes and buttons, send those with a value to the server
   * If none have a value, don't send anything.
   */
  controllerTick() {
    if(this.hasController) {
      const rawControllerInput = this.getRawControllerInput();

      // Fires an event with key and value
      // Key -> button1, axes2,..
      // Value -> Range from 0 to 1

      for(let key of Object.keys(rawControllerInput)) {
        // Used for setting controls
        Events.get().fireEvent('raw-controller-input', { key: key, value: rawControllerInput[key] })
        this.setActions(key, rawControllerInput[key], 'controller')
      }

      setTimeout(() => {
        window.requestAnimationFrame(this.controllerTick.bind(this));
      }, 5)
    }
  }

  /**
   * Name of the controller. 
   * Usually contains an identifying part such as 'Xbox'
   */
  getControllerName() {
    if(this.hasController) {
      return navigator.getGamepads()[0].id
    }
    return "";
  }

  /**
   * Checks raw input (no keybind overrides)
   * @returns {Object}
   */
  getRawControllerInput() {
    let input = {};
    if(this.hasController) {
      const controller = navigator.getGamepads()[0];

      // Check if the controller is in both deadzones.
      let isOutOfDeadzone = false;
      controller.axes.forEach((val, i) => {
        if (Math.abs(val) > this.movementDeadzone) {
          isOutOfDeadzone = true;
        }
      });


      for(let i = 0; i < controller.axes.length; i++) {
        // REVERSE AXES (align force direction with buttons)
        let val = -controller.axes[i];
        val = isOutOfDeadzone ? val : 0;
        input[`axes${i}`] = val;
      }

      for(let i = 0; i < controller.buttons.length; i++) {
        let val = controller.buttons[i].value;
        val = Math.abs(val) > this.movementDeadzone ? val : 0;
        input[`button${i}`] = val;
      }

      for(let key of Object.keys(input)) {
        // Only send 0 if the one before that wasn't 0
        const previousHadValue = this.previousInput[key] && this.previousInput[key] !== 0
        if(input[key] === 0 && !previousHadValue) {
          delete input[key];
        }
      }
    }
    this.previousInput = input;
    return input;
  }

  /**
   * Handles the mouse click event. Separate from mouse down and up.
   */
  onMouseClick(e) {
    if (window.engine && engine.renderer &&
        e.target == engine.renderer.domElement)
      this.requestPointerLock();
  }

  /**
   * Requests pointer lock on the renderer canvas.
   */
  requestPointerLock() {
    if (this.pointerLockState === false) {
      return;
    }
    if (!window.engine || !window.engine.renderer) {
      return;
    }
    engine.renderer.domElement.requestPointerLock();
  }

  /**
   * Exits pointer lock.
   */
  exitPointerLock() {
    if (this.pointerLockState === true) {
      return;
    }
    document.exitPointerLock();
  }

  /**
   * Forces the pointer lock state. This is used for things like end-game
   * screens or other non-game screens.
   */
  forcePointerLockState(state) {
    this.pointerLockState = state;
    switch (state) {
      case true:
        this.requestPointerLock();
        break;
      case false:
        this.exitPointerLock();
        break;
      case undefined:
        break;
    }
  }

  /**
   * Get the actions that should be performed if the 
   * following key is pressed
   * @param {Number | String} key 
   */
  getActionList(key) {
    return this.boundActions[key] || []
  }

  /**
   * Set the actions values controlled by the specified key
   * @param {String | Number} key 
   * @param {Number} value
   * @param {String=} inputDevice defaults to keyboard
   */
  setActions(key, value, inputDevice = 'keyboard') {
    if (!this.controlsEnabled) {
      return;
    }
    // Set all actions for all registered entities
    const actionList = this.getActionList(key)
    for(let action of actionList) {
      this.registeredEntities.forEach((entity) => {
        entity.inputDevice = inputDevice;
        entity.setAction(action, value);
      });
    }
  }

  /**
   * Handles and delegates mouse movement events.
   */
  onMouseMove(e) {
    if (!this.controlsEnabled) {
      return;
    }
    this.registeredEntities.forEach((entity) => {
      entity.setMouseMovement(e.movementX, e.movementY);
    });
  }

  /**
   * Registers an entity to receive controller input.
   */
  registerEntity(entity) {
    if (!entity || !entity.actions) {
      console.error('Must pass in an entity');
    }
    this.registeredEntities.set(entity.uuid, entity);
  }

  /**
   * Unregisters an entity from receiving controller input.
   */
  unregisterEntity(entity) {
    if (!entity || !entity.actions) {
      console.error('Must pass in an entity');
    }
    this.registeredEntities.delete(entity.uuid);
    entity.clearInput();
  }

  /**
   * Loads settings.
   */
  loadSettings() {
    this.movementDeadzone = Settings.get('movement_deadzone');
    this.customControls = Settings.get('controls');
    this.overrideControls = Settings.get('overrides');
    this.registerBindings();
  }

  /**
   * Creates orbit controls on the camera, if they exist.
   */
  useOrbitControls() {
    new THREE.OrbitControls(
      Engine.get().getCamera(), Engine.get().getRenderer().domElement);
  }
}

export default Controls;
