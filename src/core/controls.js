/**
 * @author rogerscg / https://github.com/rogerscg
 * @author erveon / https://github.com/erveon
 */

import Camera from './camera.js';
import Engine from './engine.js';
import Plugin from './plugin.js';
import Settings from './settings.js';
import SettingsEvent from '../events/settings_event.js';
import { Action, Bindings } from './bindings.js';

const CONTROLS_KEY = 'era_bindings';

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

    // Registered bindings for a given entity.
    this.registeredBindings = new Map();
    // Map of controls IDs to entity classes.
    this.controlIds = new Map();

    document.addEventListener('keydown', (e) => this.setActions(e.keyCode, 1));
    document.addEventListener('keyup', (e) => this.setActions(e.keyCode, 0));
    document.addEventListener('mousedown', (e) => this.setActions(e.button, 1));
    document.addEventListener('mouseup', (e) => this.setActions(e.button, 0));

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('click', this.onMouseClick.bind(this));

    window.addEventListener(
      'gamepadconnected',
      this.startPollingController.bind(this)
    );
    window.addEventListener(
      'gamepaddisconnected',
      this.stopPollingController.bind(this)
    );

    this.loadSettings();
    this.registerCustomBindings();

    this.pointerLockEnabled = false;

    SettingsEvent.listen(this.loadSettings.bind(this));
  }

  /** @override */
  reset() {
    this.registeredEntities = new Map();
    this.exitPointerLock();
  }

  /** @override */
  update() {
    this.controllerTick();
  }

  /**
   * Loads custom controls bindings from local storage.
   * @returns {Map<string, Bindings}
   */
  loadCustomBindingsFromStorage() {
    // Load bindings from localStorage.
    if (!localStorage.getItem(CONTROLS_KEY)) {
      return new Map();
    }
    let customObj;
    try {
      customObj = JSON.parse(localStorage.getItem(CONTROLS_KEY));
    } catch (e) {
      console.error(e);
      return new Map();
    }
    const bindingsMap = new Map();
    // Iterate over all controls IDs.
    for (let controlsId of Object.keys(customObj)) {
      // Create bindings from the given object.
      const bindings = new Bindings(controlsId).load(customObj[controlsId]);
      bindingsMap.set(controlsId, bindings);
    }
    return bindingsMap;
  }

  /**
   * Registers custom bindings defined by the user.
   */
  registerCustomBindings() {
    const customBindings = this.loadCustomBindingsFromStorage();
    if (!customBindings) {
      return;
    }
    customBindings.forEach((bindings) => {
      this.registerCustomBindingsForId(bindings);
    });
  }

  /**
   * Sets a custom binding for a given controls ID, action, and input type.
   * @param {string} controlsId
   * @param {string} action
   * @param {string} inputType
   * @param {?} key
   */
  setCustomBinding(controlsId, action, inputType, key) {
    // Load custom bindings from storage.
    const allCustomBindings = this.loadCustomBindingsFromStorage();

    // Attach custom bindings for this ID if they don't exist.
    let idBindings = allCustomBindings.get(controlsId);
    if (!idBindings) {
      idBindings = new Bindings(controlsId);
      allCustomBindings.set(controlsId, idBindings);
    }
    // Check if the action exists for the given ID.
    let idAction = idBindings.getActions().get(action);
    if (!idAction) {
      idAction = new Action(action);
      idBindings.addAction(idAction);
    }
    idAction.addKey(inputType, key);

    // Export.
    this.writeBindingsToStorage(allCustomBindings);
    // Reload bindings.
    this.registerCustomBindings();
  }

  /**
   * Clears all custom bindings. Use this with caution, as there is not way to
   * restore them.
   * @param
   */
  clearAllCustomBindings() {
    // Export an empty map.
    this.writeBindingsToStorage(new Map());
    // Reload bindings.
    this.reloadDefaultBindings();
    this.registerCustomBindings();
  }

  /**
   * Clears all custom bindings for a given entity.
   * @param {string} controlsId
   */
  clearCustomBindingsForEntity(controlsId) {
    // Load custom bindings from storage.
    const allCustomBindings = this.loadCustomBindingsFromStorage();
    // Clear entity.
    allCustomBindings.delete(controlsId);
    // Export.
    this.writeBindingsToStorage(allCustomBindings);
    // Reload bindings.
    this.reloadDefaultBindings();
    this.registerCustomBindings();
  }

  /**
   * Clears all custom bindings for a given entity. If no input type is given,
   * all input types will be cleared.
   * @param {string} controlsId
   * @param {string} actionName
   * @param {string} inputType
   */
  clearCustomBindingsForAction(controlsId, actionName, inputType) {
    // Load custom bindings from storage.
    const allCustomBindings = this.loadCustomBindingsFromStorage();
    const entityBindings = allCustomBindings.get(controlsId);
    const action = entityBindings.getAction(actionName);
    if (!action) {
      return;
    }
    // Modify the action for the given input type.
    if (inputType) {
      action.clearInputType(inputType);
    }
    // Check if the action is empty or if no input type is provided. If so,
    // remove.
    if (action.isEmpty() || inputType === undefined) {
      entityBindings.removeAction(action);
    }
    // Check if entity bindings are empty. If so, remove from storage.
    if (entityBindings.isEmpty()) {
      allCustomBindings.delete(controlsId);
    }
    // Export.
    this.writeBindingsToStorage(allCustomBindings);
    // Reload bindings.
    this.reloadDefaultBindings();
    this.registerCustomBindings();
  }

  /**
   * Reloads all default bindings for registered bindings.
   */
  reloadDefaultBindings() {
    this.controlIds.forEach((staticEntity, id) => {
      const defaultBindings = staticEntity.GetBindings();
      this.registeredBindings.set(id, defaultBindings);
    });
  }

  /**
   * Writes a map of bindings to local storage.
   * @param {Map<string, Bindings} bindingsMap
   */
  writeBindingsToStorage(bindingsMap) {
    const exportObj = {};
    bindingsMap.forEach((bindings) => {
      exportObj[bindings.getId()] = bindings.toObject();
    });
    localStorage.setItem(CONTROLS_KEY, JSON.stringify(exportObj));
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
    if (!this.hasController) {
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
    if (this.hasController) {
      // Iterate over all gamepads.
      for (let i = 0; i < navigator.getGamepads().length; i++) {
        const controller = navigator.getGamepads()[i];
        if (!controller) {
          continue;
        }
        const rawControllerInput = this.getRawControllerInput(controller);
        // Fires an event with key and value
        // Key -> button1, axes2,..
        // Value -> Range from 0 to 1
        for (let key of Object.keys(rawControllerInput)) {
          this.setActions(key, rawControllerInput[key], 'controller', i);
        }
      }
    }
  }

  /**
   * Name of the controller.
   * Usually contains an identifying part such as 'Xbox'
   */
  getControllerName() {
    if (this.hasController) {
      return navigator.getGamepads()[0].id;
    }
    return '';
  }

  /**
   * Checks raw input (no keybind overrides)
   * @param {Gamepad} controller
   * @returns {Object}
   */
  getRawControllerInput(controller) {
    let input = {};
    if (this.hasController) {
      for (let i = 0; i < controller.axes.length; i++) {
        let val = controller.axes[i];
        val = Math.abs(val) < this.movementDeadzone ? 0 : val;
        input[`axes${i}`] = val;
      }

      for (let i = 0; i < controller.buttons.length; i++) {
        let val = controller.buttons[i].value;
        val = Math.abs(val) > this.movementDeadzone ? val : 0;
        input[`button${i}`] = val;
      }

      if (!this.previousInput[controller.index]) {
        this.previousInput[controller.index] = {};
      }
      for (let key of Object.keys(input)) {
        // Only send 0 if the one before that wasn't 0
        const previouslyHadValue =
          this.previousInput[controller.index][key] &&
          this.previousInput[controller.index][key] !== 0;
        if (input[key] === 0 && !previouslyHadValue) {
          delete input[key];
        }
      }
    }
    this.previousInput[controller.index] = input;
    return input;
  }

  /**
   * Handles the mouse click event. Separate from mouse down and up.
   */
  onMouseClick(e) {
    // TODO: Use correct element.
    if (this.pointerLockEnabled) {
      this.requestPointerLock();
    }
  }

  /**
   * Requests pointer lock on the renderer canvas.
   */
  requestPointerLock() {
    // TODO: Use correct element.
    document.body.requestPointerLock();
  }

  /**
   * Exits pointer lock.
   */
  exitPointerLock() {
    document.exitPointerLock();
  }

  /**
   * Set the actions values controlled by the specified key.
   * @param {String | Number} key
   * @param {Number} value
   * @param {String=} inputDevice defaults to keyboard
   * @param {Number=} gamepadNumber used to ensure the gamepad is associated
   *                    with the player.
   */
  setActions(key, value, inputDevice = 'keyboard', gamepadNumber = null) {
    if (!this.controlsEnabled) {
      return;
    }
    const isController = inputDevice === 'controller';
    // Check if we should also set the direction-specific axes actions.
    if (
      isController &&
      key.indexOf('axes') >= 0 &&
      !key.startsWith('+') &&
      !key.startsWith('-')
    ) {
      const absValue = Math.abs(value);
      if (value > 0) {
        this.setActions('+' + key, absValue, inputDevice, gamepadNumber);
        this.setActions('-' + key, 0, inputDevice, gamepadNumber);
      } else if (value < 0) {
        this.setActions('-' + key, absValue, inputDevice, gamepadNumber);
        this.setActions('+' + key, 0, inputDevice, gamepadNumber);
      } else {
        this.setActions('+' + key, absValue, inputDevice, gamepadNumber);
        this.setActions('-' + key, absValue, inputDevice, gamepadNumber);
      }
    }
    // Broadcast actions to all entities.
    this.registeredEntities.forEach((entity) => {
      let playerNumber = entity.getPlayerNumber();
      // Check gamepad association.
      if (
        isController &&
        entity.getPlayerNumber() != null &&
        gamepadNumber != entity.getPlayerNumber()
      ) {
        return;
      }
      if (isController) {
        // No longer need to check for player number.
        playerNumber = null;
      }
      // Get the bindings for the entity.
      const bindings = this.registeredBindings.get(entity.getControlsId());
      if (!bindings) {
        console.warn('Bindings not defined for registered entity', entity);
        return;
      }
      const actions = bindings.getActionsForKey(key, playerNumber);
      if (!actions) {
        return;
      }
      actions.forEach((action) => entity.setAction(action, value));
      entity.inputDevice = inputDevice;
    });
  }

  /**
   * Handles and delegates mouse movement events.
   */
  onMouseMove(e) {
    if (!this.controlsEnabled) {
      return;
    }
    const ratio = this.mouseSensitivity / 50;
    this.registeredEntities.forEach((entity) => {
      entity.setMouseMovement(e.movementX * ratio, e.movementY * ratio);
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
    this.mouseSensitivity = Settings.get('mouse_sensitivity');
  }

  /**
   * Creates orbit controls on the camera, if they exist.
   */
  useOrbitControls() {
    // TODO: Use proper camera and element.
    new THREE.OrbitControls(
      Camera.get().getActiveCamera(),
      Engine.get().getRenderer().domElement
    );
  }

  /**
   * Creates pointer lock controls on the renderer.
   */
  usePointerLockControls() {
    this.pointerLockEnabled = true;
    this.requestPointerLock();
  }

  /**
   * Registers a bindings set to the controls for a given entity. The provided
   * entity should be the static class, not an instance.
   * @param {Entity} entity
   * @returns {Bindings}
   */
  registerBindings(entity) {
    const bindings = entity.GetBindings();
    // Register the entity controls for later use when reloading defaults.
    this.controlIds.set(bindings.getId(), entity);
    // Check if custom bindings have already been set.
    const customBindings = this.registeredBindings.get(bindings.getId());
    if (customBindings) {
      return customBindings.merge(bindings);
    }
    this.registeredBindings.set(bindings.getId(), bindings);
    return bindings;
  }

  /**
   * Registers bindings for a provided ID. This should only be used internally.
   * @param {string} controlsId
   * @param {Bindings} bindings
   */
  registerCustomBindingsForId(bindings) {
    const defaultBindings = this.registeredBindings.get(bindings.getId());
    if (defaultBindings) {
      bindings.merge(defaultBindings);
    }
    this.registeredBindings.set(bindings.getId(), bindings);
  }

  /**
   * Retrieves the bindings for a given ID.
   * @param {string} controlsId
   * @returns {Bindings}
   */
  getBindings(controlsId) {
    const bindings = this.registeredBindings.get(controlsId);
    if (!bindings) {
      return;
    }
    return bindings;
  }
}

export default Controls;
