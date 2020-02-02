(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.ERA = {}));
}(this, (function (exports) { 'use strict';

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var SPLIT_SCREEN_REG = RegExp('[a-zA-Z]+-[0-9]*');

  /**
   * A bindings object, used for better control of custom bindings.
   */
  class Bindings {
    constructor(id) {
      this.id = id;
      this.actions = new Map();
      this.keysToActions = new Map();
      this.staticProperties = new Set();
    }

    getId() {
      return this.id;
    }

    getActions() {
      return this.actions;
    }

    /**
     * Returns all actions associated with a given key.
     * @param {?} key
     * @param {number} playerNumber
     * @returns {Array<Action>}
     */
    getActionsForKey(key, playerNumber) {
      // If the input is for a given player number, mutate the key to include it.
      var actions = new Array();
      // Try for player-number-specific actions first.
      if (playerNumber != null) {
        var playerNumKey = key + "-" + playerNumber;
        var playerNumActions = this.keysToActions.get(playerNumKey);
        if (playerNumActions) {
          actions = actions.concat(playerNumActions);
        }
      }
      var regularActions = this.keysToActions.get(key);
      if (regularActions) {
        actions = actions.concat(regularActions);
      }
      return actions;
    }

    /**
     * Adds an action to the bindings.
     * @param {Action} action
     */
    addAction(action) {
      this.actions.set(action.getName(), action);
      this.loadKeysToActions();
      this.loadStaticProperties();
      return this;
    }

    /**
     * Removes an action from the bindings.
     * @param {Action} action
     */
    removeAction(action) {
      this.actions.delete(action.getName());
      this.loadKeysToActions();
      this.loadStaticProperties();
      return this;
    }

    /**
     * Gets the action for a given name.
     * @param {string} actionName
     */
    getAction(actionName) {
      return this.actions.get(actionName);
    }

    /**
     * Loads an object into the bindings, considering custom bindings.
     * @param {Object} bindingsObj
     */
    load(bindingsObj) {
      for (var actionName in bindingsObj) {
        var actionObj = bindingsObj[actionName];
        var action = new Action(actionName).load(actionObj);
        this.actions.set(actionName, action);
      }
      this.loadKeysToActions();
      this.loadStaticProperties();
      return this;
    }

    /**
     * Loads all keys into a map to their respective actions for fast lookups in
     * controls updates.
     */
    loadKeysToActions() {
      // Clear beforehand in case we're reloading.
      this.keysToActions.clear();
      this.actions.forEach((action) => {
        var keys = action.getKeys();
        // TODO: For local co-op/split screen, set player-specific bindings.
        keys.forEach((key, inputType) => {
          // Get if this key is for a specific player, denoted by a "-[0-9]".
          if (SPLIT_SCREEN_REG.test(inputType)) {
            // This is a split-screen binding, add the player number to the key.
            var playerNumber = inputType.split('-').pop();
            key = key + "-" + playerNumber;
          }
          if (!this.keysToActions.has(key)) {
            this.keysToActions.set(key, new Array());
          }
          this.keysToActions.get(key).push(action);
        });
      });
    }

    /**
     * Takes all action names and sets their names as "static" fields of the
     * bindings instance. This is to ease development for the user, so they can
     * call `entity.getActionValue(bindings.SPRINT)` as opposed to passing in a
     * string literal `entity.getActionValue('SPRINT')`.
     */
    loadStaticProperties() {
      // Clear old static properties, based on a set created from earlier.
      this.staticProperties.forEach((propName) => {
        delete this[propName];
      });
      this.staticProperties.clear();
      // Set new static properties based on actions.
      this.actions.forEach((ignore, actionName) => {
        this[actionName] = actionName;
        this.staticProperties.add(actionName);
      });
    }

    /**
     * Merges the given bindings into the existing bindings.
     * @param {Bindings} other
     */
    merge(other) {
      other.getActions().forEach((action) => {
        if (!this.actions.has(action.getName())) {
          this.actions.set(action.getName(), action);
        } else {
          this.actions.get(action.getName()).merge(action);
        }
      });
      this.loadKeysToActions();
      this.loadStaticProperties();
      return this;
    }

    /**
     * Converts the bindings instance to an object.
     * @returns {Object}
     */
    toObject() {
      var exportObj = {};
      this.actions.forEach((action) => {
        exportObj[action.getName()] = action.toObject();
      });
      return exportObj;
    }

    /**
     * Returns if there are no actions associated with the bindings.
     * @returns {boolean}
     */
    isEmpty() {
      // Get all non-empty actions.
      var nonEmptyActions = [].concat( this.actions.values() ).filter((action) => {
        return !action.isEmpty();
      });
      return nonEmptyActions.length == 0;
    }
  }

  /**
   * Represents an action an entity can take as well as the inputs that are used
   * to trigger this action.
   */
  class Action {
    constructor(name) {
      this.name = name;
      this.id = null;
      this.keys = new Map();
    }

    getName() {
      return this.name;
    }

    getKeys() {
      return this.keys;
    }

    /**
     * Adds a key that can trigger the action.
     * @param {string} inputType
     * @param {?} key
     */
    addKey(inputType, key) {
      this.keys.set(inputType, key);
      return this;
    }

    /**
     * Clears the key for the given input type.
     * @param {string} inputType
     */
    clearInputType(inputType) {
      this.keys.delete(inputType);
    }

    /**
     * Loads the action from an arbitrary object.
     */
    load(actionObj) {
      for (var inputType in actionObj.keys) {
        var inputs = actionObj.keys[inputType];
        // Check if there are multiple inputs for the given input type.
        if (Array.isArray(inputs)) {
          this.loadMultipleKeys(inputType, inputs, actionObj.split_screen);
        } else {
          this.keys.set(inputType, actionObj.keys[inputType]);
        }
      }
      return this;
    }

    /**
     * Loads multiple inputs for the given input type.
     * @param {string} inputType
     * @param {Array} inputs
     * @param {boolean} isSplitScreen
     */
    loadMultipleKeys(inputType, inputs, isSplitScreen) {
      if ( isSplitScreen === void 0 ) isSplitScreen = false;

      if (isSplitScreen) {
        inputs.forEach((input, player) => {
          var inputKey = inputType + "-" + player;
          this.keys.set(inputKey, input);
        });
      } else {
        // TODO: Allow for multiple inputs.
        console.warn('Loading multiple inputs for same player not implemented');
      }
    }

    /**
     * Merges an existing action with this action.
     * @param {Action} other
     */
    merge(other) {
      other.getKeys().forEach((key, inputType) => {
        if (!this.keys.has(inputType)) {
          this.keys.set(inputType, key);
        }
      });
      return this;
    }

    /**
     * Converts the action instance to an object.
     * @returns {Object}
     */
    toObject() {
      var exportObj = {};
      exportObj.keys = {};
      // TODO: For local co-op/split screen, export player-specific bindings.
      this.keys.forEach((key, inputType) => (exportObj.keys[inputType] = key));
      return exportObj;
    }

    /**
     * Detects if the action is empty.
     * @returns {boolean}
     */
    isEmpty() {
      return this.keys.size == 0;
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   * @author erveon / https://github.com/erveon
   */

  /**
   * Generates a RFC4122 version 4 compliant UUID.
   */
  function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Disables all shadows for an object and its children.
   */
  function disableShadows(object, name, force) {
    if ( force === void 0 ) force = false;

    if (!name || object.name.toLowerCase().indexOf(name) > -1 || force) {
      object.castShadow = false;
      force = true;
    }
    object.children.forEach((child) => {
      disableShadows(child, name, force);
    });
  }

  /**
   * Disposes all geometries and materials for an object and its children.
   */
  function dispose(object) {
    if (object.material) {
      object.material.dispose();
    }
    if (object.geometry) {
      object.geometry.dispose();
    }
    object.children.forEach((child) => dispose(child));
  }

  /**
   * Extracts an array of meshes present in an object hierarchy.
   * @param {Object3D} object The root object from which to search.
   * @param {string} materialFilter The name of a material we want to search for.
   * @param {boolean} filterOut True if the set of meshes should exclude the
   *                  matching material name.
   */
  function extractMeshes(object, materialFilter, filterOut) {
    if ( filterOut === void 0 ) filterOut = true;

    var meshes = [];
    if (object.type == 'Mesh') {
      if (
        materialFilter &&
        ((filterOut && object.material.name.indexOf(materialFilter) < 0) ||
          (!filterOut && object.material.name.indexOf(materialFilter) > -1))
      ) {
        meshes.push(object);
      } else if (!materialFilter) {
        meshes.push(object);
      }
    }
    object.children.forEach((child) => {
      var childrenMeshes = extractMeshes(child, materialFilter, filterOut);
      meshes = meshes.concat(childrenMeshes);
    });
    return meshes;
  }

  /**
   * Extracts an array of meshes with a certain name within an object hierarchy.
   * The provided name can be a substring of the mesh name.
   * @param {THREE.Object3D} object
   * @param {string} meshName
   * @returns {Array<THREE.Mesh>}
   */
  function extractMeshesByName(object, meshName) {
    if ( meshName === void 0 ) meshName = '';

    var meshes = new Array();
    if (object.type == 'Mesh') {
      if (object.name.indexOf(meshName) >= 0) {
        meshes.push(object);
      }
    }
    object.children.forEach((child) => {
      var childrenMeshes = extractMeshesByName(child, meshName);
      meshes = meshes.concat(childrenMeshes);
    });
    return meshes;
  }

  function shuffleArray(array) {
    var assign;

    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      (assign = [array[j], array[i]], array[i] = assign[0], array[j] = assign[1]);
    }
  }

  function toDegrees(angle) {
    return angle * (180 / Math.PI);
  }

  function toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  /**
   * Computes the angle in radians with respect to the positive x-axis
   * @param {Number} x
   * @param {Number} y
   */
  function vectorToAngle(x, y) {
    var angle = Math.atan2(y, x);
    if (angle < 0) { angle += 2 * Math.PI; }
    return angle;
  }

  /*
   * Get the hex color ratio between two colors
   * Ratio 0 = Col1
   * Ratio 1 = Col2
   */
  function getHexColorRatio(col1, col2, ratio) {
    var r = Math.ceil(
      parseInt(col1.substring(0, 2), 16) * ratio +
        parseInt(col2.substring(0, 2), 16) * (1 - ratio)
    );
    var g = Math.ceil(
      parseInt(col1.substring(2, 4), 16) * ratio +
        parseInt(col2.substring(2, 4), 16) * (1 - ratio)
    );
    var b = Math.ceil(
      parseInt(col1.substring(4, 6), 16) * ratio +
        parseInt(col2.substring(4, 6), 16) * (1 - ratio)
    );
    return hex(r) + hex(g) + hex(b);
  }

  /**
   * Used in getHexColorRatio
   */
  function hex(x) {
    x = x.toString(16);
    return x.length == 1 ? '0' + x : x;
  }

  /**
   * Interpolates between two numbers.
   * @param {number} a
   * @param {number} b
   * @param {number} factor
   * @return {number}
   */
  function lerp(a, b, factor) {
    return a + (b - a) * factor;
  }

  /**
   * Loads a JSON from the given file path.
   * @param {string} path
   * @return {Promise<Object>} Parsed JSON object.
   * @async
   */
  async function loadJsonFromFile$1(path) {
    return new Promise((resolve, reject) => {
      var loader = new THREE.FileLoader();
      loader.load(
        path,
        (data) => {
          resolve(JSON.parse(data));
        },
        () => {},
        (err) => {
          reject(err);
        }
      );
    });
  }

  /**
   * Traverses the provided object's ancestors to get the root scene in the ERA
   * world.
   * @param {THREE.Object3D} object
   * @return {THREE.Scene}
   */
  function getRootScene(object) {
    var rootScene = null;
    object.traverseAncestors((ancestor) => {
      if (ancestor.isRootScene) {
        rootScene = ancestor;
      }
    });
    return rootScene;
  }

  /**
   * Traverses the provided object's ancestors to get the root scene, which has a
   * property with the parent ERA world.
   * @param {THREE.Object3D} object
   * @return {World}
   */
  function getRootWorld(object) {
    var rootScene = getRootScene(object);
    return rootScene && rootScene.parentWorld ? rootScene.parentWorld : null;
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  /**
   * Core implementation for managing events and listeners. This
   * exists out of necessity for a simple event and message system
   * for both the client and the server.
   */

  var eventsInstance = null;

  class Events {
    /**
     * Enforces singleton instance.
     */
    static get() {
      if (!eventsInstance) {
        eventsInstance = new Events();
      }
      return eventsInstance;
    }

    constructor() {
      // All registered listeners. Key is the event label, value is another
      // map with the listener UUID as the key, the callback function as the
      // value.
      this.registeredListeners = new Map();

      // Tracks which labels a listener is listening to. Used for ease of
      // removal. Key is the listener UUID, value is the event label.
      this.registeredUUIDs = new Map();
    }

    /**
     * Fires all event listener callbacks registered for the label
     * with the event data.
     */
    fireEvent(label, data) {
      var callbacks = this.registeredListeners.get(label);
      if (!callbacks) {
        return false;
      }
      callbacks.forEach((callback) => callback(data));
    }

    /**
     * Adds an event listener for a certain label. When the event is fired,
     * the callback is called with data from the event. Returns the UUID
     * of the listener.
     */
    addListener(label, callback) {
      if (!label || (!callback && typeof callback !== 'function')) {
        return false;
      }
      // If the label has not yet been registered, do so by creating a new map
      // of listener UUIDs and callbacks.
      var listeners = this.registeredListeners.get(label);
      if (!listeners) {
        listeners = new Map();
        this.registeredListeners.set(label, listeners);
      }
      var listenerUUID = createUUID();
      listeners.set(listenerUUID, callback);
      this.registeredUUIDs.set(listenerUUID, label);
      return listenerUUID;
    }

    /**
     * Removes an event listener from registered listeners by its UUID.
     * Returns true if the listener is successfully deleted.
     */
    removeListener(uuid) {
      var label = this.registeredUUIDs.get(uuid);
      if (!label) {
        return false;
      }
      var listeners = this.registeredListeners.get(label);
      if (!listeners) {
        return false;
      }
      return listeners.delete(uuid);
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  /**
   * Superclass for all custom events within the engine. Utilizes the
   * engine-specific event handling system used for both client and
   * server.
   */
  class EraEvent {
    constructor(label, data) {
      this.label = label;
      this.data = data;
    }

    /**
     * Fires the event to the events core.
     */
    fire() {
      Events.get().fireEvent(this.label, this.data);
    }

    /**
     * Creates an event listener for the given type.
     */
    static listen(label, callback) {
      Events.get().addListener(label, callback);
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var LABEL = 'reset';

  /**
   * Engine reset event.
   */
  class EngineResetEvent extends EraEvent {
    constructor() {
      super(LABEL, {});
    }
    
    /** @override */
    static listen(callback) {
      EraEvent.listen(LABEL, callback);
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  /**
   * Settings changed event. Fired when settings are applied.
   */
  class SettingsEvent extends EraEvent {
    
    /**
     * Takes in the new settings object.
     */
    constructor() {
      var label = 'settings';
      var data = {};
      super(label, data);
    }
    
    /** @override */
    static listen(callback) {
      EraEvent.listen('settings', callback);
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  // The default settings for the ERA engine. These can be overwriten with custom
  // settings. See /data/settings.json as an example to define your own settings.
  // TODO: Allow for an enum of options for a setting.
  var DEFAULT_SETTINGS = {
    debug: {
      value: true,
    },
    movement_deadzone: {
      value: 0.15,
      min: 0.00,
      max: 1.00,
    },
    mouse_sensitivity: {
      value: 50,
      min: 0,
      max: 200,
    },
    shadows: {
      value: true,
    },
    volume: {
      value: 50,
      min: 0, 
      max: 100,
    },
  };

  var SETTINGS_KEY = 'era_settings';

  /**
   * Controls the client settings in a singleton model in local storage.
   */
  class Settings extends Map {

    constructor() {
      super();
      this.loaded = false;
    }

    /**
     * Gets the value of a key in the settings object.
     */
    get(key) {
      var setting = super.get(key);
      if (!setting) {
        return null;
      }
      return setting.getValue();
    }

    /**
     * Sets a specific setting to the given value.
     * @param {string} key
     * @param {?} value
     */
    set(key, value) {
      var setting = super.get(key);
      if (!setting) {
        return;
      }
      setting.setValue(value);
      this.apply(); 
    }

    /**
     * Loads the settings from engine defaults, provided defaults, and user-set
     * values from local storage.
     * @param {string} settingsPath
     * @async
     */
    async load(settingsPath) {
      if (this.loaded) {
        return;
      }
      this.loadEngineDefaults();
      if (settingsPath) {
        await this.loadFromFile(settingsPath);
      }
      this.loadExistingSettings();
      this.apply();
      this.loaded = true;
      return this;
    }

    /**
     * Loads the default values for the engine. This is necessary for core plugins
     * that are dependent on settings.
     */
    loadEngineDefaults() {
      if (this.loaded) {
        return;
      }
      for (var key in DEFAULT_SETTINGS) {
        var setting = new Setting(key, DEFAULT_SETTINGS[key]);
        super.set(setting.getName(), setting);
      }
      new SettingsEvent().fire();
    }

    /**
     * Loads a default settings file at the give path. This is user-provided.
     * This will also overwrite the default engine settings with the
     * user-provided settings.
     * @param {string} settingsPath
     * @async
     */
    async loadFromFile(settingsPath) {
      if (!settingsPath) {
        return;
      }
      // Load JSON file with all settings.
      var allSettingsData;
      try {
        allSettingsData = await loadJsonFromFile(settingsPath);
      } catch (e) {
        throw new Error(e);
      }
      for (var key in allSettingsData) {
        var setting = new Setting(key, allSettingsData[key]);
        super.set(setting.getName(), setting);
      }
    }

    /**
     * Loads existing settings from local storage. Merges the settings previously
     * saved into the existing defaults.
     */
    loadExistingSettings() {
      // Load from local storage.
      var savedSettings;
      try {
        savedSettings = localStorage.getItem(SETTINGS_KEY);
        if (!savedSettings) {
          return;
        }
        savedSettings = JSON.parse(savedSettings);
      } catch (e) {
        return;
      }
      // Iterate over saved settings and merge into defaults.
      for (var key in savedSettings) {
        var setting = new Setting(key, savedSettings[key]);
        var defaultSetting = super.get(setting.getName());
        if (!defaultSetting) {
          continue;
        }
        // Merge saved setting into default.
        defaultSetting.merge(setting);
      }
    }

    /**
     * Fires the applySettings event to the event core, then saves to local
     * storage.
     */
    apply() {
      localStorage.setItem(SETTINGS_KEY, this.export());
      new SettingsEvent().fire();
    }

    /**
     * Exports all settings into a string for use in local storage.
     * @returns {string}
     */
    export() {
      var expObj = {};
      this.forEach((setting, name) => {
        expObj[name] = setting.export();
      });
      return JSON.stringify(expObj);
    }
  }

  var Settings$1 = new Settings();

  /**
   * An individual setting for tracking defaults, types, and other properties
   * of the field.
   */
  class Setting {
    /**
     * Loads a setting from an object.
     * @param {Object} settingsData
     */
    constructor(name, settingsData) {
      this.name = name;
      this.value = settingsData.value;
      this.min = settingsData.min;
      this.max = settingsData.max;
      this.wasModified = !!settingsData.modified;
    }

    // TODO: Add getPrettyName() for cleaner settings panel.
    getName() {
      return this.name;
    }

    getValue() {
      return this.value;
    }

    getMin() {
      return this.min;
    }
    
    getMax() {
      return this.max;
    }

    /**
     * Sets the value of the individual setting, flipping the "modified" bit to
     * true.
     * @param {?} newValue
     */
    setValue(newValue) {
      this.value = newValue;
      this.wasModified = true;
    }

    /**
     * Returns if the setting was modified at any point from the default.
     * @returns {boolean}
     */
    wasModifiedFromDefault() {
      return this.wasModified;
    }

    /**
     * Merges another setting into this setting. This will only occur if the
     * other setting has been mutated from the default. This check is useful in
     * the event developers want to change a default setting, as otherwise, the
     * new default setting would not be applied to returning users.
     * @param {Setting} other
     * @returns {Setting}
     */
    merge(other) {
      // Sanity check for comparability.
      if (!other || other.getName() != this.getName()) {
        return;
      }
      // If the other setting was not modified from default, ignore.
      if (!other.wasModifiedFromDefault()) {
        return;
      }
      this.value = other.getValue();
      this.wasModified = true;
      // TODO: Check for min/max, type, or other options for validation.
    }
    
    /**
     * Exports the individual setting to an object.
     * @returns {Object}
     */
    export() {
      return {
        value: this.value,
        modified: this.wasModified,
      };
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var MEASUREMENT_MIN = 10;
  var MAX_LENGTH = 100;

  /**
   * A timer for monitoring render loop execution time. Installed on the engine
   * core, then read by renderer stats. Only enabled when debug is enabled.
   */
  class EngineTimer {
    constructor() {
      this.measurements = new Array();
      this.min = Infinity;
      this.max = 0;
      this.currIndex = 0;
      this.enabled = !Settings$1.loaded || Settings$1.get('debug');
      SettingsEvent.listen(this.handleSettings.bind(this));
    }

    /**
     * Starts a measurement.
     */
    start() {
      if (!this.enabled) {
        return;
      }
      this.startTime = performance.now();
    }

    /**
     * Completes a measurement, recording it if enabled.
     */
    end() {
      if (!this.enabled || !this.startTime) {
        return;
      }
      var time = performance.now() - this.startTime;
      this.measurements[this.currIndex] = time;
      this.currIndex++;
      if (this.currIndex >= MAX_LENGTH) {
        this.currIndex = 0;
      }
      if (time > this.max) {
        this.max = time;
      }
      if (time < this.min) {
        this.min = time;
      }
    }

    /**
     * Resets the timer cache.
     */
    reset() {
      this.max = 0;
      this.min = Infinity;
      this.currIndex = 0;
      // Clear the array.
      this.measurements.length = 0;
    }

    /**
     * Exports the meaurements average for reading in the stats panel. Clears the
     * measurements array for memory usage.
     * @returns {Object}
     */
    export() {
      if (!this.enabled) {
        return null;
      }
      if (this.measurements.length < MEASUREMENT_MIN) {
        return null;
      }
      var total = this.measurements.reduce((agg, x) => agg + x, 0);
      var avg = total / this.measurements.length;
      var exportObj = {
        max: this.max,
        min: this.min,
        avg: avg,
      };
      this.reset();
      return exportObj;
    }

    /**
     * Handles a settings change.
     */
    handleSettings() {
      var currEnabled = this.enabled;
      if (currEnabled == Settings$1.get('debug')) {
        return;
      }
      this.enabled = Settings$1.get('debug');
      this.reset();
    }
  }

  var EngineTimer$1 = new EngineTimer();

  /**
   * dat-gui JavaScript Controller Library
   * http://code.google.com/p/dat-gui
   *
   * Copyright 2011 Data Arts Team, Google Creative Lab
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   * http://www.apache.org/licenses/LICENSE-2.0
   */

  function ___$insertStyle(css) {
    if (!css) {
      return;
    }
    if (typeof window === 'undefined') {
      return;
    }

    var style = document.createElement('style');

    style.setAttribute('type', 'text/css');
    style.innerHTML = css;
    document.head.appendChild(style);

    return css;
  }

  function colorToString (color, forceCSSHex) {
    var colorFormat = color.__state.conversionName.toString();
    var r = Math.round(color.r);
    var g = Math.round(color.g);
    var b = Math.round(color.b);
    var a = color.a;
    var h = Math.round(color.h);
    var s = color.s.toFixed(1);
    var v = color.v.toFixed(1);
    if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
      var str = color.hex.toString(16);
      while (str.length < 6) {
        str = '0' + str;
      }
      return '#' + str;
    } else if (colorFormat === 'CSS_RGB') {
      return 'rgb(' + r + ',' + g + ',' + b + ')';
    } else if (colorFormat === 'CSS_RGBA') {
      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    } else if (colorFormat === 'HEX') {
      return '0x' + color.hex.toString(16);
    } else if (colorFormat === 'RGB_ARRAY') {
      return '[' + r + ',' + g + ',' + b + ']';
    } else if (colorFormat === 'RGBA_ARRAY') {
      return '[' + r + ',' + g + ',' + b + ',' + a + ']';
    } else if (colorFormat === 'RGB_OBJ') {
      return '{r:' + r + ',g:' + g + ',b:' + b + '}';
    } else if (colorFormat === 'RGBA_OBJ') {
      return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
    } else if (colorFormat === 'HSV_OBJ') {
      return '{h:' + h + ',s:' + s + ',v:' + v + '}';
    } else if (colorFormat === 'HSVA_OBJ') {
      return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
    }
    return 'unknown format';
  }

  var ARR_EACH = Array.prototype.forEach;
  var ARR_SLICE = Array.prototype.slice;
  var Common = {
    BREAK: {},
    extend: function extend(target) {
      this.each(ARR_SLICE.call(arguments, 1), function (obj) {
        var keys = this.isObject(obj) ? Object.keys(obj) : [];
        keys.forEach(function (key) {
          if (!this.isUndefined(obj[key])) {
            target[key] = obj[key];
          }
        }.bind(this));
      }, this);
      return target;
    },
    defaults: function defaults(target) {
      this.each(ARR_SLICE.call(arguments, 1), function (obj) {
        var keys = this.isObject(obj) ? Object.keys(obj) : [];
        keys.forEach(function (key) {
          if (this.isUndefined(target[key])) {
            target[key] = obj[key];
          }
        }.bind(this));
      }, this);
      return target;
    },
    compose: function compose() {
      var toCall = ARR_SLICE.call(arguments);
      return function () {
        var args = ARR_SLICE.call(arguments);
        for (var i = toCall.length - 1; i >= 0; i--) {
          args = [toCall[i].apply(this, args)];
        }
        return args[0];
      };
    },
    each: function each(obj, itr, scope) {
      if (!obj) {
        return;
      }
      if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
        obj.forEach(itr, scope);
      } else if (obj.length === obj.length + 0) {
        var key = void 0;
        var l = void 0;
        for (key = 0, l = obj.length; key < l; key++) {
          if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
            return;
          }
        }
      } else {
        for (var _key in obj) {
          if (itr.call(scope, obj[_key], _key) === this.BREAK) {
            return;
          }
        }
      }
    },
    defer: function defer(fnc) {
      setTimeout(fnc, 0);
    },
    debounce: function debounce(func, threshold, callImmediately) {
      var timeout = void 0;
      return function () {
        var obj = this;
        var args = arguments;
        function delayed() {
          timeout = null;
          if (!callImmediately) { func.apply(obj, args); }
        }
        var callNow = callImmediately || !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(delayed, threshold);
        if (callNow) {
          func.apply(obj, args);
        }
      };
    },
    toArray: function toArray(obj) {
      if (obj.toArray) { return obj.toArray(); }
      return ARR_SLICE.call(obj);
    },
    isUndefined: function isUndefined(obj) {
      return obj === undefined;
    },
    isNull: function isNull(obj) {
      return obj === null;
    },
    isNaN: function (_isNaN) {
      function isNaN(_x) {
        return _isNaN.apply(this, arguments);
      }
      isNaN.toString = function () {
        return _isNaN.toString();
      };
      return isNaN;
    }(function (obj) {
      return isNaN(obj);
    }),
    isArray: Array.isArray || function (obj) {
      return obj.constructor === Array;
    },
    isObject: function isObject(obj) {
      return obj === Object(obj);
    },
    isNumber: function isNumber(obj) {
      return obj === obj + 0;
    },
    isString: function isString(obj) {
      return obj === obj + '';
    },
    isBoolean: function isBoolean(obj) {
      return obj === false || obj === true;
    },
    isFunction: function isFunction(obj) {
      return Object.prototype.toString.call(obj) === '[object Function]';
    }
  };

  var INTERPRETATIONS = [
  {
    litmus: Common.isString,
    conversions: {
      THREE_CHAR_HEX: {
        read: function read(original) {
          var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);
          if (test === null) {
            return false;
          }
          return {
            space: 'HEX',
            hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
          };
        },
        write: colorToString
      },
      SIX_CHAR_HEX: {
        read: function read(original) {
          var test = original.match(/^#([A-F0-9]{6})$/i);
          if (test === null) {
            return false;
          }
          return {
            space: 'HEX',
            hex: parseInt('0x' + test[1].toString(), 0)
          };
        },
        write: colorToString
      },
      CSS_RGB: {
        read: function read(original) {
          var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
          if (test === null) {
            return false;
          }
          return {
            space: 'RGB',
            r: parseFloat(test[1]),
            g: parseFloat(test[2]),
            b: parseFloat(test[3])
          };
        },
        write: colorToString
      },
      CSS_RGBA: {
        read: function read(original) {
          var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);
          if (test === null) {
            return false;
          }
          return {
            space: 'RGB',
            r: parseFloat(test[1]),
            g: parseFloat(test[2]),
            b: parseFloat(test[3]),
            a: parseFloat(test[4])
          };
        },
        write: colorToString
      }
    }
  },
  {
    litmus: Common.isNumber,
    conversions: {
      HEX: {
        read: function read(original) {
          return {
            space: 'HEX',
            hex: original,
            conversionName: 'HEX'
          };
        },
        write: function write(color) {
          return color.hex;
        }
      }
    }
  },
  {
    litmus: Common.isArray,
    conversions: {
      RGB_ARRAY: {
        read: function read(original) {
          if (original.length !== 3) {
            return false;
          }
          return {
            space: 'RGB',
            r: original[0],
            g: original[1],
            b: original[2]
          };
        },
        write: function write(color) {
          return [color.r, color.g, color.b];
        }
      },
      RGBA_ARRAY: {
        read: function read(original) {
          if (original.length !== 4) { return false; }
          return {
            space: 'RGB',
            r: original[0],
            g: original[1],
            b: original[2],
            a: original[3]
          };
        },
        write: function write(color) {
          return [color.r, color.g, color.b, color.a];
        }
      }
    }
  },
  {
    litmus: Common.isObject,
    conversions: {
      RGBA_OBJ: {
        read: function read(original) {
          if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
            return {
              space: 'RGB',
              r: original.r,
              g: original.g,
              b: original.b,
              a: original.a
            };
          }
          return false;
        },
        write: function write(color) {
          return {
            r: color.r,
            g: color.g,
            b: color.b,
            a: color.a
          };
        }
      },
      RGB_OBJ: {
        read: function read(original) {
          if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
            return {
              space: 'RGB',
              r: original.r,
              g: original.g,
              b: original.b
            };
          }
          return false;
        },
        write: function write(color) {
          return {
            r: color.r,
            g: color.g,
            b: color.b
          };
        }
      },
      HSVA_OBJ: {
        read: function read(original) {
          if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
            return {
              space: 'HSV',
              h: original.h,
              s: original.s,
              v: original.v,
              a: original.a
            };
          }
          return false;
        },
        write: function write(color) {
          return {
            h: color.h,
            s: color.s,
            v: color.v,
            a: color.a
          };
        }
      },
      HSV_OBJ: {
        read: function read(original) {
          if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
            return {
              space: 'HSV',
              h: original.h,
              s: original.s,
              v: original.v
            };
          }
          return false;
        },
        write: function write(color) {
          return {
            h: color.h,
            s: color.s,
            v: color.v
          };
        }
      }
    }
  }];
  var result = void 0;
  var toReturn = void 0;
  var interpret = function interpret() {
    toReturn = false;
    var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
    Common.each(INTERPRETATIONS, function (family) {
      if (family.litmus(original)) {
        Common.each(family.conversions, function (conversion, conversionName) {
          result = conversion.read(original);
          if (toReturn === false && result !== false) {
            toReturn = result;
            result.conversionName = conversionName;
            result.conversion = conversion;
            return Common.BREAK;
          }
        });
        return Common.BREAK;
      }
    });
    return toReturn;
  };

  var tmpComponent = void 0;
  var ColorMath = {
    hsv_to_rgb: function hsv_to_rgb(h, s, v) {
      var hi = Math.floor(h / 60) % 6;
      var f = h / 60 - Math.floor(h / 60);
      var p = v * (1.0 - s);
      var q = v * (1.0 - f * s);
      var t = v * (1.0 - (1.0 - f) * s);
      var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
      return {
        r: c[0] * 255,
        g: c[1] * 255,
        b: c[2] * 255
      };
    },
    rgb_to_hsv: function rgb_to_hsv(r, g, b) {
      var min = Math.min(r, g, b);
      var max = Math.max(r, g, b);
      var delta = max - min;
      var h = void 0;
      var s = void 0;
      if (max !== 0) {
        s = delta / max;
      } else {
        return {
          h: NaN,
          s: 0,
          v: 0
        };
      }
      if (r === max) {
        h = (g - b) / delta;
      } else if (g === max) {
        h = 2 + (b - r) / delta;
      } else {
        h = 4 + (r - g) / delta;
      }
      h /= 6;
      if (h < 0) {
        h += 1;
      }
      return {
        h: h * 360,
        s: s,
        v: max / 255
      };
    },
    rgb_to_hex: function rgb_to_hex(r, g, b) {
      var hex = this.hex_with_component(0, 2, r);
      hex = this.hex_with_component(hex, 1, g);
      hex = this.hex_with_component(hex, 0, b);
      return hex;
    },
    component_from_hex: function component_from_hex(hex, componentIndex) {
      return hex >> componentIndex * 8 & 0xFF;
    },
    hex_with_component: function hex_with_component(hex, componentIndex, value) {
      return value << (tmpComponent = componentIndex * 8) | hex & ~(0xFF << tmpComponent);
    }
  };

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };











  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) { descriptor.writable = true; }
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) { defineProperties(Constructor.prototype, protoProps); }
      if (staticProps) { defineProperties(Constructor, staticProps); }
      return Constructor;
    };
  }();







  var get = function get(object, property, receiver) {
    if (object === null) { object = Function.prototype; }
    var desc = Object.getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        return get(parent, property, receiver);
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;

      if (getter === undefined) {
        return undefined;
      }

      return getter.call(receiver);
    }
  };

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) { Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
  };











  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  var Color = function () {
    function Color() {
      classCallCheck(this, Color);
      this.__state = interpret.apply(this, arguments);
      if (this.__state === false) {
        throw new Error('Failed to interpret color arguments');
      }
      this.__state.a = this.__state.a || 1;
    }
    createClass(Color, [{
      key: 'toString',
      value: function toString() {
        return colorToString(this);
      }
    }, {
      key: 'toHexString',
      value: function toHexString() {
        return colorToString(this, true);
      }
    }, {
      key: 'toOriginal',
      value: function toOriginal() {
        return this.__state.conversion.write(this);
      }
    }]);
    return Color;
  }();
  function defineRGBComponent(target, component, componentHexIndex) {
    Object.defineProperty(target, component, {
      get: function get$$1() {
        if (this.__state.space === 'RGB') {
          return this.__state[component];
        }
        Color.recalculateRGB(this, component, componentHexIndex);
        return this.__state[component];
      },
      set: function set$$1(v) {
        if (this.__state.space !== 'RGB') {
          Color.recalculateRGB(this, component, componentHexIndex);
          this.__state.space = 'RGB';
        }
        this.__state[component] = v;
      }
    });
  }
  function defineHSVComponent(target, component) {
    Object.defineProperty(target, component, {
      get: function get$$1() {
        if (this.__state.space === 'HSV') {
          return this.__state[component];
        }
        Color.recalculateHSV(this);
        return this.__state[component];
      },
      set: function set$$1(v) {
        if (this.__state.space !== 'HSV') {
          Color.recalculateHSV(this);
          this.__state.space = 'HSV';
        }
        this.__state[component] = v;
      }
    });
  }
  Color.recalculateRGB = function (color, component, componentHexIndex) {
    if (color.__state.space === 'HEX') {
      color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
    } else if (color.__state.space === 'HSV') {
      Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
    } else {
      throw new Error('Corrupted color state');
    }
  };
  Color.recalculateHSV = function (color) {
    var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
    Common.extend(color.__state, {
      s: result.s,
      v: result.v
    });
    if (!Common.isNaN(result.h)) {
      color.__state.h = result.h;
    } else if (Common.isUndefined(color.__state.h)) {
      color.__state.h = 0;
    }
  };
  Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
  defineRGBComponent(Color.prototype, 'r', 2);
  defineRGBComponent(Color.prototype, 'g', 1);
  defineRGBComponent(Color.prototype, 'b', 0);
  defineHSVComponent(Color.prototype, 'h');
  defineHSVComponent(Color.prototype, 's');
  defineHSVComponent(Color.prototype, 'v');
  Object.defineProperty(Color.prototype, 'a', {
    get: function get$$1() {
      return this.__state.a;
    },
    set: function set$$1(v) {
      this.__state.a = v;
    }
  });
  Object.defineProperty(Color.prototype, 'hex', {
    get: function get$$1() {
      if (!this.__state.space !== 'HEX') {
        this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
      }
      return this.__state.hex;
    },
    set: function set$$1(v) {
      this.__state.space = 'HEX';
      this.__state.hex = v;
    }
  });

  var Controller = function () {
    function Controller(object, property) {
      classCallCheck(this, Controller);
      this.initialValue = object[property];
      this.domElement = document.createElement('div');
      this.object = object;
      this.property = property;
      this.__onChange = undefined;
      this.__onFinishChange = undefined;
    }
    createClass(Controller, [{
      key: 'onChange',
      value: function onChange(fnc) {
        this.__onChange = fnc;
        return this;
      }
    }, {
      key: 'onFinishChange',
      value: function onFinishChange(fnc) {
        this.__onFinishChange = fnc;
        return this;
      }
    }, {
      key: 'setValue',
      value: function setValue(newValue) {
        this.object[this.property] = newValue;
        if (this.__onChange) {
          this.__onChange.call(this, newValue);
        }
        this.updateDisplay();
        return this;
      }
    }, {
      key: 'getValue',
      value: function getValue() {
        return this.object[this.property];
      }
    }, {
      key: 'updateDisplay',
      value: function updateDisplay() {
        return this;
      }
    }, {
      key: 'isModified',
      value: function isModified() {
        return this.initialValue !== this.getValue();
      }
    }]);
    return Controller;
  }();

  var EVENT_MAP = {
    HTMLEvents: ['change'],
    MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
    KeyboardEvents: ['keydown']
  };
  var EVENT_MAP_INV = {};
  Common.each(EVENT_MAP, function (v, k) {
    Common.each(v, function (e) {
      EVENT_MAP_INV[e] = k;
    });
  });
  var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;
  function cssValueToPixels(val) {
    if (val === '0' || Common.isUndefined(val)) {
      return 0;
    }
    var match = val.match(CSS_VALUE_PIXELS);
    if (!Common.isNull(match)) {
      return parseFloat(match[1]);
    }
    return 0;
  }
  var dom = {
    makeSelectable: function makeSelectable(elem, selectable) {
      if (elem === undefined || elem.style === undefined) { return; }
      elem.onselectstart = selectable ? function () {
        return false;
      } : function () {};
      elem.style.MozUserSelect = selectable ? 'auto' : 'none';
      elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
      elem.unselectable = selectable ? 'on' : 'off';
    },
    makeFullscreen: function makeFullscreen(elem, hor, vert) {
      var vertical = vert;
      var horizontal = hor;
      if (Common.isUndefined(horizontal)) {
        horizontal = true;
      }
      if (Common.isUndefined(vertical)) {
        vertical = true;
      }
      elem.style.position = 'absolute';
      if (horizontal) {
        elem.style.left = 0;
        elem.style.right = 0;
      }
      if (vertical) {
        elem.style.top = 0;
        elem.style.bottom = 0;
      }
    },
    fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
      var params = pars || {};
      var className = EVENT_MAP_INV[eventType];
      if (!className) {
        throw new Error('Event type ' + eventType + ' not supported.');
      }
      var evt = document.createEvent(className);
      switch (className) {
        case 'MouseEvents':
          {
            var clientX = params.x || params.clientX || 0;
            var clientY = params.y || params.clientY || 0;
            evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0,
            0,
            clientX,
            clientY,
            false, false, false, false, 0, null);
            break;
          }
        case 'KeyboardEvents':
          {
            var init = evt.initKeyboardEvent || evt.initKeyEvent;
            Common.defaults(params, {
              cancelable: true,
              ctrlKey: false,
              altKey: false,
              shiftKey: false,
              metaKey: false,
              keyCode: undefined,
              charCode: undefined
            });
            init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
            break;
          }
        default:
          {
            evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
            break;
          }
      }
      Common.defaults(evt, aux);
      elem.dispatchEvent(evt);
    },
    bind: function bind(elem, event, func, newBool) {
      var bool = newBool || false;
      if (elem.addEventListener) {
        elem.addEventListener(event, func, bool);
      } else if (elem.attachEvent) {
        elem.attachEvent('on' + event, func);
      }
      return dom;
    },
    unbind: function unbind(elem, event, func, newBool) {
      var bool = newBool || false;
      if (elem.removeEventListener) {
        elem.removeEventListener(event, func, bool);
      } else if (elem.detachEvent) {
        elem.detachEvent('on' + event, func);
      }
      return dom;
    },
    addClass: function addClass(elem, className) {
      if (elem.className === undefined) {
        elem.className = className;
      } else if (elem.className !== className) {
        var classes = elem.className.split(/ +/);
        if (classes.indexOf(className) === -1) {
          classes.push(className);
          elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
        }
      }
      return dom;
    },
    removeClass: function removeClass(elem, className) {
      if (className) {
        if (elem.className === className) {
          elem.removeAttribute('class');
        } else {
          var classes = elem.className.split(/ +/);
          var index = classes.indexOf(className);
          if (index !== -1) {
            classes.splice(index, 1);
            elem.className = classes.join(' ');
          }
        }
      } else {
        elem.className = undefined;
      }
      return dom;
    },
    hasClass: function hasClass(elem, className) {
      return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
    },
    getWidth: function getWidth(elem) {
      var style = getComputedStyle(elem);
      return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
    },
    getHeight: function getHeight(elem) {
      var style = getComputedStyle(elem);
      return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
    },
    getOffset: function getOffset(el) {
      var elem = el;
      var offset = { left: 0, top: 0 };
      if (elem.offsetParent) {
        do {
          offset.left += elem.offsetLeft;
          offset.top += elem.offsetTop;
          elem = elem.offsetParent;
        } while (elem);
      }
      return offset;
    },
    isActive: function isActive(elem) {
      return elem === document.activeElement && (elem.type || elem.href);
    }
  };

  var BooleanController = function (_Controller) {
    inherits(BooleanController, _Controller);
    function BooleanController(object, property) {
      classCallCheck(this, BooleanController);
      var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));
      var _this = _this2;
      _this2.__prev = _this2.getValue();
      _this2.__checkbox = document.createElement('input');
      _this2.__checkbox.setAttribute('type', 'checkbox');
      function onChange() {
        _this.setValue(!_this.__prev);
      }
      dom.bind(_this2.__checkbox, 'change', onChange, false);
      _this2.domElement.appendChild(_this2.__checkbox);
      _this2.updateDisplay();
      return _this2;
    }
    createClass(BooleanController, [{
      key: 'setValue',
      value: function setValue(v) {
        var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);
        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }
        this.__prev = this.getValue();
        return toReturn;
      }
    }, {
      key: 'updateDisplay',
      value: function updateDisplay() {
        if (this.getValue() === true) {
          this.__checkbox.setAttribute('checked', 'checked');
          this.__checkbox.checked = true;
          this.__prev = true;
        } else {
          this.__checkbox.checked = false;
          this.__prev = false;
        }
        return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return BooleanController;
  }(Controller);

  var OptionController = function (_Controller) {
    inherits(OptionController, _Controller);
    function OptionController(object, property, opts) {
      classCallCheck(this, OptionController);
      var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));
      var options = opts;
      var _this = _this2;
      _this2.__select = document.createElement('select');
      if (Common.isArray(options)) {
        var map = {};
        Common.each(options, function (element) {
          map[element] = element;
        });
        options = map;
      }
      Common.each(options, function (value, key) {
        var opt = document.createElement('option');
        opt.innerHTML = key;
        opt.setAttribute('value', value);
        _this.__select.appendChild(opt);
      });
      _this2.updateDisplay();
      dom.bind(_this2.__select, 'change', function () {
        var desiredValue = this.options[this.selectedIndex].value;
        _this.setValue(desiredValue);
      });
      _this2.domElement.appendChild(_this2.__select);
      return _this2;
    }
    createClass(OptionController, [{
      key: 'setValue',
      value: function setValue(v) {
        var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);
        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }
        return toReturn;
      }
    }, {
      key: 'updateDisplay',
      value: function updateDisplay() {
        if (dom.isActive(this.__select)) { return this; }
        this.__select.value = this.getValue();
        return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return OptionController;
  }(Controller);

  var StringController = function (_Controller) {
    inherits(StringController, _Controller);
    function StringController(object, property) {
      classCallCheck(this, StringController);
      var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));
      var _this = _this2;
      function onChange() {
        _this.setValue(_this.__input.value);
      }
      function onBlur() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }
      _this2.__input = document.createElement('input');
      _this2.__input.setAttribute('type', 'text');
      dom.bind(_this2.__input, 'keyup', onChange);
      dom.bind(_this2.__input, 'change', onChange);
      dom.bind(_this2.__input, 'blur', onBlur);
      dom.bind(_this2.__input, 'keydown', function (e) {
        if (e.keyCode === 13) {
          this.blur();
        }
      });
      _this2.updateDisplay();
      _this2.domElement.appendChild(_this2.__input);
      return _this2;
    }
    createClass(StringController, [{
      key: 'updateDisplay',
      value: function updateDisplay() {
        if (!dom.isActive(this.__input)) {
          this.__input.value = this.getValue();
        }
        return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return StringController;
  }(Controller);

  function numDecimals(x) {
    var _x = x.toString();
    if (_x.indexOf('.') > -1) {
      return _x.length - _x.indexOf('.') - 1;
    }
    return 0;
  }
  var NumberController = function (_Controller) {
    inherits(NumberController, _Controller);
    function NumberController(object, property, params) {
      classCallCheck(this, NumberController);
      var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));
      var _params = params || {};
      _this.__min = _params.min;
      _this.__max = _params.max;
      _this.__step = _params.step;
      if (Common.isUndefined(_this.__step)) {
        if (_this.initialValue === 0) {
          _this.__impliedStep = 1;
        } else {
          _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
        }
      } else {
        _this.__impliedStep = _this.__step;
      }
      _this.__precision = numDecimals(_this.__impliedStep);
      return _this;
    }
    createClass(NumberController, [{
      key: 'setValue',
      value: function setValue(v) {
        var _v = v;
        if (this.__min !== undefined && _v < this.__min) {
          _v = this.__min;
        } else if (this.__max !== undefined && _v > this.__max) {
          _v = this.__max;
        }
        if (this.__step !== undefined && _v % this.__step !== 0) {
          _v = Math.round(_v / this.__step) * this.__step;
        }
        return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
      }
    }, {
      key: 'min',
      value: function min(minValue) {
        this.__min = minValue;
        return this;
      }
    }, {
      key: 'max',
      value: function max(maxValue) {
        this.__max = maxValue;
        return this;
      }
    }, {
      key: 'step',
      value: function step(stepValue) {
        this.__step = stepValue;
        this.__impliedStep = stepValue;
        this.__precision = numDecimals(stepValue);
        return this;
      }
    }]);
    return NumberController;
  }(Controller);

  function roundToDecimal(value, decimals) {
    var tenTo = Math.pow(10, decimals);
    return Math.round(value * tenTo) / tenTo;
  }
  var NumberControllerBox = function (_NumberController) {
    inherits(NumberControllerBox, _NumberController);
    function NumberControllerBox(object, property, params) {
      classCallCheck(this, NumberControllerBox);
      var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));
      _this2.__truncationSuspended = false;
      var _this = _this2;
      var prevY = void 0;
      function onChange() {
        var attempted = parseFloat(_this.__input.value);
        if (!Common.isNaN(attempted)) {
          _this.setValue(attempted);
        }
      }
      function onFinish() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }
      function onBlur() {
        onFinish();
      }
      function onMouseDrag(e) {
        var diff = prevY - e.clientY;
        _this.setValue(_this.getValue() + diff * _this.__impliedStep);
        prevY = e.clientY;
      }
      function onMouseUp() {
        dom.unbind(window, 'mousemove', onMouseDrag);
        dom.unbind(window, 'mouseup', onMouseUp);
        onFinish();
      }
      function onMouseDown(e) {
        dom.bind(window, 'mousemove', onMouseDrag);
        dom.bind(window, 'mouseup', onMouseUp);
        prevY = e.clientY;
      }
      _this2.__input = document.createElement('input');
      _this2.__input.setAttribute('type', 'text');
      dom.bind(_this2.__input, 'change', onChange);
      dom.bind(_this2.__input, 'blur', onBlur);
      dom.bind(_this2.__input, 'mousedown', onMouseDown);
      dom.bind(_this2.__input, 'keydown', function (e) {
        if (e.keyCode === 13) {
          _this.__truncationSuspended = true;
          this.blur();
          _this.__truncationSuspended = false;
          onFinish();
        }
      });
      _this2.updateDisplay();
      _this2.domElement.appendChild(_this2.__input);
      return _this2;
    }
    createClass(NumberControllerBox, [{
      key: 'updateDisplay',
      value: function updateDisplay() {
        this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
        return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return NumberControllerBox;
  }(NumberController);

  function map(v, i1, i2, o1, o2) {
    return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
  }
  var NumberControllerSlider = function (_NumberController) {
    inherits(NumberControllerSlider, _NumberController);
    function NumberControllerSlider(object, property, min, max, step) {
      classCallCheck(this, NumberControllerSlider);
      var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, { min: min, max: max, step: step }));
      var _this = _this2;
      _this2.__background = document.createElement('div');
      _this2.__foreground = document.createElement('div');
      dom.bind(_this2.__background, 'mousedown', onMouseDown);
      dom.bind(_this2.__background, 'touchstart', onTouchStart);
      dom.addClass(_this2.__background, 'slider');
      dom.addClass(_this2.__foreground, 'slider-fg');
      function onMouseDown(e) {
        document.activeElement.blur();
        dom.bind(window, 'mousemove', onMouseDrag);
        dom.bind(window, 'mouseup', onMouseUp);
        onMouseDrag(e);
      }
      function onMouseDrag(e) {
        e.preventDefault();
        var bgRect = _this.__background.getBoundingClientRect();
        _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
        return false;
      }
      function onMouseUp() {
        dom.unbind(window, 'mousemove', onMouseDrag);
        dom.unbind(window, 'mouseup', onMouseUp);
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }
      function onTouchStart(e) {
        if (e.touches.length !== 1) {
          return;
        }
        dom.bind(window, 'touchmove', onTouchMove);
        dom.bind(window, 'touchend', onTouchEnd);
        onTouchMove(e);
      }
      function onTouchMove(e) {
        var clientX = e.touches[0].clientX;
        var bgRect = _this.__background.getBoundingClientRect();
        _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
      }
      function onTouchEnd() {
        dom.unbind(window, 'touchmove', onTouchMove);
        dom.unbind(window, 'touchend', onTouchEnd);
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.getValue());
        }
      }
      _this2.updateDisplay();
      _this2.__background.appendChild(_this2.__foreground);
      _this2.domElement.appendChild(_this2.__background);
      return _this2;
    }
    createClass(NumberControllerSlider, [{
      key: 'updateDisplay',
      value: function updateDisplay() {
        var pct = (this.getValue() - this.__min) / (this.__max - this.__min);
        this.__foreground.style.width = pct * 100 + '%';
        return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
      }
    }]);
    return NumberControllerSlider;
  }(NumberController);

  var FunctionController = function (_Controller) {
    inherits(FunctionController, _Controller);
    function FunctionController(object, property, text) {
      classCallCheck(this, FunctionController);
      var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));
      var _this = _this2;
      _this2.__button = document.createElement('div');
      _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
      dom.bind(_this2.__button, 'click', function (e) {
        e.preventDefault();
        _this.fire();
        return false;
      });
      dom.addClass(_this2.__button, 'button');
      _this2.domElement.appendChild(_this2.__button);
      return _this2;
    }
    createClass(FunctionController, [{
      key: 'fire',
      value: function fire() {
        if (this.__onChange) {
          this.__onChange.call(this);
        }
        this.getValue().call(this.object);
        if (this.__onFinishChange) {
          this.__onFinishChange.call(this, this.getValue());
        }
      }
    }]);
    return FunctionController;
  }(Controller);

  var ColorController = function (_Controller) {
    inherits(ColorController, _Controller);
    function ColorController(object, property) {
      classCallCheck(this, ColorController);
      var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));
      _this2.__color = new Color(_this2.getValue());
      _this2.__temp = new Color(0);
      var _this = _this2;
      _this2.domElement = document.createElement('div');
      dom.makeSelectable(_this2.domElement, false);
      _this2.__selector = document.createElement('div');
      _this2.__selector.className = 'selector';
      _this2.__saturation_field = document.createElement('div');
      _this2.__saturation_field.className = 'saturation-field';
      _this2.__field_knob = document.createElement('div');
      _this2.__field_knob.className = 'field-knob';
      _this2.__field_knob_border = '2px solid ';
      _this2.__hue_knob = document.createElement('div');
      _this2.__hue_knob.className = 'hue-knob';
      _this2.__hue_field = document.createElement('div');
      _this2.__hue_field.className = 'hue-field';
      _this2.__input = document.createElement('input');
      _this2.__input.type = 'text';
      _this2.__input_textShadow = '0 1px 1px ';
      dom.bind(_this2.__input, 'keydown', function (e) {
        if (e.keyCode === 13) {
          onBlur.call(this);
        }
      });
      dom.bind(_this2.__input, 'blur', onBlur);
      dom.bind(_this2.__selector, 'mousedown', function ()        {
        dom.addClass(this, 'drag').bind(window, 'mouseup', function ()        {
          dom.removeClass(_this.__selector, 'drag');
        });
      });
      dom.bind(_this2.__selector, 'touchstart', function ()        {
        dom.addClass(this, 'drag').bind(window, 'touchend', function ()        {
          dom.removeClass(_this.__selector, 'drag');
        });
      });
      var valueField = document.createElement('div');
      Common.extend(_this2.__selector.style, {
        width: '122px',
        height: '102px',
        padding: '3px',
        backgroundColor: '#222',
        boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
      });
      Common.extend(_this2.__field_knob.style, {
        position: 'absolute',
        width: '12px',
        height: '12px',
        border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
        boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
        borderRadius: '12px',
        zIndex: 1
      });
      Common.extend(_this2.__hue_knob.style, {
        position: 'absolute',
        width: '15px',
        height: '2px',
        borderRight: '4px solid #fff',
        zIndex: 1
      });
      Common.extend(_this2.__saturation_field.style, {
        width: '100px',
        height: '100px',
        border: '1px solid #555',
        marginRight: '3px',
        display: 'inline-block',
        cursor: 'pointer'
      });
      Common.extend(valueField.style, {
        width: '100%',
        height: '100%',
        background: 'none'
      });
      linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
      Common.extend(_this2.__hue_field.style, {
        width: '15px',
        height: '100px',
        border: '1px solid #555',
        cursor: 'ns-resize',
        position: 'absolute',
        top: '3px',
        right: '3px'
      });
      hueGradient(_this2.__hue_field);
      Common.extend(_this2.__input.style, {
        outline: 'none',
        textAlign: 'center',
        color: '#fff',
        border: 0,
        fontWeight: 'bold',
        textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
      });
      dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
      dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
      dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
      dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
      dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
      dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);
      function fieldDown(e) {
        setSV(e);
        dom.bind(window, 'mousemove', setSV);
        dom.bind(window, 'touchmove', setSV);
        dom.bind(window, 'mouseup', fieldUpSV);
        dom.bind(window, 'touchend', fieldUpSV);
      }
      function fieldDownH(e) {
        setH(e);
        dom.bind(window, 'mousemove', setH);
        dom.bind(window, 'touchmove', setH);
        dom.bind(window, 'mouseup', fieldUpH);
        dom.bind(window, 'touchend', fieldUpH);
      }
      function fieldUpSV() {
        dom.unbind(window, 'mousemove', setSV);
        dom.unbind(window, 'touchmove', setSV);
        dom.unbind(window, 'mouseup', fieldUpSV);
        dom.unbind(window, 'touchend', fieldUpSV);
        onFinish();
      }
      function fieldUpH() {
        dom.unbind(window, 'mousemove', setH);
        dom.unbind(window, 'touchmove', setH);
        dom.unbind(window, 'mouseup', fieldUpH);
        dom.unbind(window, 'touchend', fieldUpH);
        onFinish();
      }
      function onBlur() {
        var i = interpret(this.value);
        if (i !== false) {
          _this.__color.__state = i;
          _this.setValue(_this.__color.toOriginal());
        } else {
          this.value = _this.__color.toString();
        }
      }
      function onFinish() {
        if (_this.__onFinishChange) {
          _this.__onFinishChange.call(_this, _this.__color.toOriginal());
        }
      }
      _this2.__saturation_field.appendChild(valueField);
      _this2.__selector.appendChild(_this2.__field_knob);
      _this2.__selector.appendChild(_this2.__saturation_field);
      _this2.__selector.appendChild(_this2.__hue_field);
      _this2.__hue_field.appendChild(_this2.__hue_knob);
      _this2.domElement.appendChild(_this2.__input);
      _this2.domElement.appendChild(_this2.__selector);
      _this2.updateDisplay();
      function setSV(e) {
        if (e.type.indexOf('touch') === -1) {
          e.preventDefault();
        }
        var fieldRect = _this.__saturation_field.getBoundingClientRect();
        var _ref = e.touches && e.touches[0] || e,
            clientX = _ref.clientX,
            clientY = _ref.clientY;
        var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
        var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
        if (v > 1) {
          v = 1;
        } else if (v < 0) {
          v = 0;
        }
        if (s > 1) {
          s = 1;
        } else if (s < 0) {
          s = 0;
        }
        _this.__color.v = v;
        _this.__color.s = s;
        _this.setValue(_this.__color.toOriginal());
        return false;
      }
      function setH(e) {
        if (e.type.indexOf('touch') === -1) {
          e.preventDefault();
        }
        var fieldRect = _this.__hue_field.getBoundingClientRect();
        var _ref2 = e.touches && e.touches[0] || e,
            clientY = _ref2.clientY;
        var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);
        if (h > 1) {
          h = 1;
        } else if (h < 0) {
          h = 0;
        }
        _this.__color.h = h * 360;
        _this.setValue(_this.__color.toOriginal());
        return false;
      }
      return _this2;
    }
    createClass(ColorController, [{
      key: 'updateDisplay',
      value: function updateDisplay() {
        var i = interpret(this.getValue());
        if (i !== false) {
          var mismatch = false;
          Common.each(Color.COMPONENTS, function (component) {
            if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
              mismatch = true;
              return {};
            }
          }, this);
          if (mismatch) {
            Common.extend(this.__color.__state, i);
          }
        }
        Common.extend(this.__temp.__state, this.__color.__state);
        this.__temp.a = 1;
        var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;
        var _flip = 255 - flip;
        Common.extend(this.__field_knob.style, {
          marginLeft: 100 * this.__color.s - 7 + 'px',
          marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
          backgroundColor: this.__temp.toHexString(),
          border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
        });
        this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
        this.__temp.s = 1;
        this.__temp.v = 1;
        linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
        this.__input.value = this.__color.toString();
        Common.extend(this.__input.style, {
          backgroundColor: this.__color.toHexString(),
          color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
          textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
        });
      }
    }]);
    return ColorController;
  }(Controller);
  var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];
  function linearGradient(elem, x, a, b) {
    elem.style.background = '';
    Common.each(vendors, function (vendor) {
      elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
    });
  }
  function hueGradient(elem) {
    elem.style.background = '';
    elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
    elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
    elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
    elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
    elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  }

  var css = {
    load: function load(url, indoc) {
      var doc = indoc || document;
      var link = doc.createElement('link');
      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.href = url;
      doc.getElementsByTagName('head')[0].appendChild(link);
    },
    inject: function inject(cssContent, indoc) {
      var doc = indoc || document;
      var injected = document.createElement('style');
      injected.type = 'text/css';
      injected.innerHTML = cssContent;
      var head = doc.getElementsByTagName('head')[0];
      try {
        head.appendChild(injected);
      } catch (e) {
      }
    }
  };

  var saveDialogContents = "<div id=\"dg-save\" class=\"dg dialogue\">\n\n  Here's the new load parameter for your <code>GUI</code>'s constructor:\n\n  <textarea id=\"dg-new-constructor\"></textarea>\n\n  <div id=\"dg-save-locally\">\n\n    <input id=\"dg-local-storage\" type=\"checkbox\"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id=\"dg-local-explain\">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>";

  var ControllerFactory = function ControllerFactory(object, property) {
    var initialValue = object[property];
    if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
      return new OptionController(object, property, arguments[2]);
    }
    if (Common.isNumber(initialValue)) {
      if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
        if (Common.isNumber(arguments[4])) {
          return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
        }
        return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
      }
      if (Common.isNumber(arguments[4])) {
        return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3], step: arguments[4] });
      }
      return new NumberControllerBox(object, property, { min: arguments[2], max: arguments[3] });
    }
    if (Common.isString(initialValue)) {
      return new StringController(object, property);
    }
    if (Common.isFunction(initialValue)) {
      return new FunctionController(object, property, '');
    }
    if (Common.isBoolean(initialValue)) {
      return new BooleanController(object, property);
    }
    return null;
  };

  function requestAnimationFrame$1(callback) {
    setTimeout(callback, 1000 / 60);
  }
  var requestAnimationFrame$1$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame$1;

  var CenteredDiv = function () {
    function CenteredDiv() {
      classCallCheck(this, CenteredDiv);
      this.backgroundElement = document.createElement('div');
      Common.extend(this.backgroundElement.style, {
        backgroundColor: 'rgba(0,0,0,0.8)',
        top: 0,
        left: 0,
        display: 'none',
        zIndex: '1000',
        opacity: 0,
        WebkitTransition: 'opacity 0.2s linear',
        transition: 'opacity 0.2s linear'
      });
      dom.makeFullscreen(this.backgroundElement);
      this.backgroundElement.style.position = 'fixed';
      this.domElement = document.createElement('div');
      Common.extend(this.domElement.style, {
        position: 'fixed',
        display: 'none',
        zIndex: '1001',
        opacity: 0,
        WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
        transition: 'transform 0.2s ease-out, opacity 0.2s linear'
      });
      document.body.appendChild(this.backgroundElement);
      document.body.appendChild(this.domElement);
      var _this = this;
      dom.bind(this.backgroundElement, 'click', function () {
        _this.hide();
      });
    }
    createClass(CenteredDiv, [{
      key: 'show',
      value: function show() {
        var _this = this;
        this.backgroundElement.style.display = 'block';
        this.domElement.style.display = 'block';
        this.domElement.style.opacity = 0;
        this.domElement.style.webkitTransform = 'scale(1.1)';
        this.layout();
        Common.defer(function () {
          _this.backgroundElement.style.opacity = 1;
          _this.domElement.style.opacity = 1;
          _this.domElement.style.webkitTransform = 'scale(1)';
        });
      }
    }, {
      key: 'hide',
      value: function hide() {
        var _this = this;
        var hide = function hide() {
          _this.domElement.style.display = 'none';
          _this.backgroundElement.style.display = 'none';
          dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
          dom.unbind(_this.domElement, 'transitionend', hide);
          dom.unbind(_this.domElement, 'oTransitionEnd', hide);
        };
        dom.bind(this.domElement, 'webkitTransitionEnd', hide);
        dom.bind(this.domElement, 'transitionend', hide);
        dom.bind(this.domElement, 'oTransitionEnd', hide);
        this.backgroundElement.style.opacity = 0;
        this.domElement.style.opacity = 0;
        this.domElement.style.webkitTransform = 'scale(1.1)';
      }
    }, {
      key: 'layout',
      value: function layout() {
        this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
        this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
      }
    }]);
    return CenteredDiv;
  }();

  var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

  css.inject(styleSheet);
  var CSS_NAMESPACE = 'dg';
  var HIDE_KEY_CODE = 72;
  var CLOSE_BUTTON_HEIGHT = 20;
  var DEFAULT_DEFAULT_PRESET_NAME = 'Default';
  var SUPPORTS_LOCAL_STORAGE = function () {
    try {
      return !!window.localStorage;
    } catch (e) {
      return false;
    }
  }();
  var SAVE_DIALOGUE = void 0;
  var autoPlaceVirgin = true;
  var autoPlaceContainer = void 0;
  var hide = false;
  var hideableGuis = [];
  var GUI = function GUI(pars) {
    var _this = this;
    var params = pars || {};
    this.domElement = document.createElement('div');
    this.__ul = document.createElement('ul');
    this.domElement.appendChild(this.__ul);
    dom.addClass(this.domElement, CSS_NAMESPACE);
    this.__folders = {};
    this.__controllers = [];
    this.__rememberedObjects = [];
    this.__rememberedObjectIndecesToControllers = [];
    this.__listening = [];
    params = Common.defaults(params, {
      closeOnTop: false,
      autoPlace: true,
      width: GUI.DEFAULT_WIDTH
    });
    params = Common.defaults(params, {
      resizable: params.autoPlace,
      hideable: params.autoPlace
    });
    if (!Common.isUndefined(params.load)) {
      if (params.preset) {
        params.load.preset = params.preset;
      }
    } else {
      params.load = { preset: DEFAULT_DEFAULT_PRESET_NAME };
    }
    if (Common.isUndefined(params.parent) && params.hideable) {
      hideableGuis.push(this);
    }
    params.resizable = Common.isUndefined(params.parent) && params.resizable;
    if (params.autoPlace && Common.isUndefined(params.scrollable)) {
      params.scrollable = true;
    }
    var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
    var saveToLocalStorage = void 0;
    var titleRow = void 0;
    Object.defineProperties(this,
    {
      parent: {
        get: function get$$1() {
          return params.parent;
        }
      },
      scrollable: {
        get: function get$$1() {
          return params.scrollable;
        }
      },
      autoPlace: {
        get: function get$$1() {
          return params.autoPlace;
        }
      },
      closeOnTop: {
        get: function get$$1() {
          return params.closeOnTop;
        }
      },
      preset: {
        get: function get$$1() {
          if (_this.parent) {
            return _this.getRoot().preset;
          }
          return params.load.preset;
        },
        set: function set$$1(v) {
          if (_this.parent) {
            _this.getRoot().preset = v;
          } else {
            params.load.preset = v;
          }
          setPresetSelectIndex(this);
          _this.revert();
        }
      },
      width: {
        get: function get$$1() {
          return params.width;
        },
        set: function set$$1(v) {
          params.width = v;
          setWidth(_this, v);
        }
      },
      name: {
        get: function get$$1() {
          return params.name;
        },
        set: function set$$1(v) {
          params.name = v;
          if (titleRow) {
            titleRow.innerHTML = params.name;
          }
        }
      },
      closed: {
        get: function get$$1() {
          return params.closed;
        },
        set: function set$$1(v) {
          params.closed = v;
          if (params.closed) {
            dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
          } else {
            dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
          }
          this.onResize();
          if (_this.__closeButton) {
            _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
          }
        }
      },
      load: {
        get: function get$$1() {
          return params.load;
        }
      },
      useLocalStorage: {
        get: function get$$1() {
          return useLocalStorage;
        },
        set: function set$$1(bool) {
          if (SUPPORTS_LOCAL_STORAGE) {
            useLocalStorage = bool;
            if (bool) {
              dom.bind(window, 'unload', saveToLocalStorage);
            } else {
              dom.unbind(window, 'unload', saveToLocalStorage);
            }
            localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
          }
        }
      }
    });
    if (Common.isUndefined(params.parent)) {
      this.closed = params.closed || false;
      dom.addClass(this.domElement, GUI.CLASS_MAIN);
      dom.makeSelectable(this.domElement, false);
      if (SUPPORTS_LOCAL_STORAGE) {
        if (useLocalStorage) {
          _this.useLocalStorage = true;
          var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));
          if (savedGui) {
            params.load = JSON.parse(savedGui);
          }
        }
      }
      this.__closeButton = document.createElement('div');
      this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);
      if (params.closeOnTop) {
        dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
        this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
      } else {
        dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
        this.domElement.appendChild(this.__closeButton);
      }
      dom.bind(this.__closeButton, 'click', function () {
        _this.closed = !_this.closed;
      });
    } else {
      if (params.closed === undefined) {
        params.closed = true;
      }
      var titleRowName = document.createTextNode(params.name);
      dom.addClass(titleRowName, 'controller-name');
      titleRow = addRow(_this, titleRowName);
      var onClickTitle = function onClickTitle(e) {
        e.preventDefault();
        _this.closed = !_this.closed;
        return false;
      };
      dom.addClass(this.__ul, GUI.CLASS_CLOSED);
      dom.addClass(titleRow, 'title');
      dom.bind(titleRow, 'click', onClickTitle);
      if (!params.closed) {
        this.closed = false;
      }
    }
    if (params.autoPlace) {
      if (Common.isUndefined(params.parent)) {
        if (autoPlaceVirgin) {
          autoPlaceContainer = document.createElement('div');
          dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
          dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
          document.body.appendChild(autoPlaceContainer);
          autoPlaceVirgin = false;
        }
        autoPlaceContainer.appendChild(this.domElement);
        dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
      }
      if (!this.parent) {
        setWidth(_this, params.width);
      }
    }
    this.__resizeHandler = function () {
      _this.onResizeDebounced();
    };
    dom.bind(window, 'resize', this.__resizeHandler);
    dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
    dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
    dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
    this.onResize();
    if (params.resizable) {
      addResizeHandle(this);
    }
    saveToLocalStorage = function saveToLocalStorage() {
      if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
        localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
      }
    };
    this.saveToLocalStorageIfPossible = saveToLocalStorage;
    function resetWidth() {
      var root = _this.getRoot();
      root.width += 1;
      Common.defer(function () {
        root.width -= 1;
      });
    }
    if (!params.parent) {
      resetWidth();
    }
  };
  GUI.toggleHide = function () {
    hide = !hide;
    Common.each(hideableGuis, function (gui) {
      gui.domElement.style.display = hide ? 'none' : '';
    });
  };
  GUI.CLASS_AUTO_PLACE = 'a';
  GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
  GUI.CLASS_MAIN = 'main';
  GUI.CLASS_CONTROLLER_ROW = 'cr';
  GUI.CLASS_TOO_TALL = 'taller-than-window';
  GUI.CLASS_CLOSED = 'closed';
  GUI.CLASS_CLOSE_BUTTON = 'close-button';
  GUI.CLASS_CLOSE_TOP = 'close-top';
  GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
  GUI.CLASS_DRAG = 'drag';
  GUI.DEFAULT_WIDTH = 245;
  GUI.TEXT_CLOSED = 'Close Controls';
  GUI.TEXT_OPEN = 'Open Controls';
  GUI._keydownHandler = function (e) {
    if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
      GUI.toggleHide();
    }
  };
  dom.bind(window, 'keydown', GUI._keydownHandler, false);
  Common.extend(GUI.prototype,
  {
    add: function add(object, property) {
      return _add(this, object, property, {
        factoryArgs: Array.prototype.slice.call(arguments, 2)
      });
    },
    addColor: function addColor(object, property) {
      return _add(this, object, property, {
        color: true
      });
    },
    remove: function remove(controller) {
      this.__ul.removeChild(controller.__li);
      this.__controllers.splice(this.__controllers.indexOf(controller), 1);
      var _this = this;
      Common.defer(function () {
        _this.onResize();
      });
    },
    destroy: function destroy() {
      if (this.parent) {
        throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
      }
      if (this.autoPlace) {
        autoPlaceContainer.removeChild(this.domElement);
      }
      var _this = this;
      Common.each(this.__folders, function (subfolder) {
        _this.removeFolder(subfolder);
      });
      dom.unbind(window, 'keydown', GUI._keydownHandler, false);
      removeListeners(this);
    },
    addFolder: function addFolder(name) {
      if (this.__folders[name] !== undefined) {
        throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
      }
      var newGuiParams = { name: name, parent: this };
      newGuiParams.autoPlace = this.autoPlace;
      if (this.load &&
      this.load.folders &&
      this.load.folders[name]) {
        newGuiParams.closed = this.load.folders[name].closed;
        newGuiParams.load = this.load.folders[name];
      }
      var gui = new GUI(newGuiParams);
      this.__folders[name] = gui;
      var li = addRow(this, gui.domElement);
      dom.addClass(li, 'folder');
      return gui;
    },
    removeFolder: function removeFolder(folder) {
      this.__ul.removeChild(folder.domElement.parentElement);
      delete this.__folders[folder.name];
      if (this.load &&
      this.load.folders &&
      this.load.folders[folder.name]) {
        delete this.load.folders[folder.name];
      }
      removeListeners(folder);
      var _this = this;
      Common.each(folder.__folders, function (subfolder) {
        folder.removeFolder(subfolder);
      });
      Common.defer(function () {
        _this.onResize();
      });
    },
    open: function open() {
      this.closed = false;
    },
    close: function close() {
      this.closed = true;
    },
    hide: function hide() {
      this.domElement.style.display = 'none';
    },
    show: function show() {
      this.domElement.style.display = '';
    },
    onResize: function onResize() {
      var root = this.getRoot();
      if (root.scrollable) {
        var top = dom.getOffset(root.__ul).top;
        var h = 0;
        Common.each(root.__ul.childNodes, function (node) {
          if (!(root.autoPlace && node === root.__save_row)) {
            h += dom.getHeight(node);
          }
        });
        if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
          dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
          root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
        } else {
          dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
          root.__ul.style.height = 'auto';
        }
      }
      if (root.__resize_handle) {
        Common.defer(function () {
          root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
        });
      }
      if (root.__closeButton) {
        root.__closeButton.style.width = root.width + 'px';
      }
    },
    onResizeDebounced: Common.debounce(function () {
      this.onResize();
    }, 50),
    remember: function remember() {
      if (Common.isUndefined(SAVE_DIALOGUE)) {
        SAVE_DIALOGUE = new CenteredDiv();
        SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
      }
      if (this.parent) {
        throw new Error('You can only call remember on a top level GUI.');
      }
      var _this = this;
      Common.each(Array.prototype.slice.call(arguments), function (object) {
        if (_this.__rememberedObjects.length === 0) {
          addSaveMenu(_this);
        }
        if (_this.__rememberedObjects.indexOf(object) === -1) {
          _this.__rememberedObjects.push(object);
        }
      });
      if (this.autoPlace) {
        setWidth(this, this.width);
      }
    },
    getRoot: function getRoot() {
      var gui = this;
      while (gui.parent) {
        gui = gui.parent;
      }
      return gui;
    },
    getSaveObject: function getSaveObject() {
      var toReturn = this.load;
      toReturn.closed = this.closed;
      if (this.__rememberedObjects.length > 0) {
        toReturn.preset = this.preset;
        if (!toReturn.remembered) {
          toReturn.remembered = {};
        }
        toReturn.remembered[this.preset] = getCurrentPreset(this);
      }
      toReturn.folders = {};
      Common.each(this.__folders, function (element, key) {
        toReturn.folders[key] = element.getSaveObject();
      });
      return toReturn;
    },
    save: function save() {
      if (!this.load.remembered) {
        this.load.remembered = {};
      }
      this.load.remembered[this.preset] = getCurrentPreset(this);
      markPresetModified(this, false);
      this.saveToLocalStorageIfPossible();
    },
    saveAs: function saveAs(presetName) {
      if (!this.load.remembered) {
        this.load.remembered = {};
        this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
      }
      this.load.remembered[presetName] = getCurrentPreset(this);
      this.preset = presetName;
      addPresetOption(this, presetName, true);
      this.saveToLocalStorageIfPossible();
    },
    revert: function revert(gui) {
      Common.each(this.__controllers, function (controller) {
        if (!this.getRoot().load.remembered) {
          controller.setValue(controller.initialValue);
        } else {
          recallSavedValue(gui || this.getRoot(), controller);
        }
        if (controller.__onFinishChange) {
          controller.__onFinishChange.call(controller, controller.getValue());
        }
      }, this);
      Common.each(this.__folders, function (folder) {
        folder.revert(folder);
      });
      if (!gui) {
        markPresetModified(this.getRoot(), false);
      }
    },
    listen: function listen(controller) {
      var init = this.__listening.length === 0;
      this.__listening.push(controller);
      if (init) {
        updateDisplays(this.__listening);
      }
    },
    updateDisplay: function updateDisplay() {
      Common.each(this.__controllers, function (controller) {
        controller.updateDisplay();
      });
      Common.each(this.__folders, function (folder) {
        folder.updateDisplay();
      });
    }
  });
  function addRow(gui, newDom, liBefore) {
    var li = document.createElement('li');
    if (newDom) {
      li.appendChild(newDom);
    }
    if (liBefore) {
      gui.__ul.insertBefore(li, liBefore);
    } else {
      gui.__ul.appendChild(li);
    }
    gui.onResize();
    return li;
  }
  function removeListeners(gui) {
    dom.unbind(window, 'resize', gui.__resizeHandler);
    if (gui.saveToLocalStorageIfPossible) {
      dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
    }
  }
  function markPresetModified(gui, modified) {
    var opt = gui.__preset_select[gui.__preset_select.selectedIndex];
    if (modified) {
      opt.innerHTML = opt.value + '*';
    } else {
      opt.innerHTML = opt.value;
    }
  }
  function augmentController(gui, li, controller) {
    controller.__li = li;
    controller.__gui = gui;
    Common.extend(controller,                                   {
      options: function options(_options) {
        if (arguments.length > 1) {
          var nextSibling = controller.__li.nextElementSibling;
          controller.remove();
          return _add(gui, controller.object, controller.property, {
            before: nextSibling,
            factoryArgs: [Common.toArray(arguments)]
          });
        }
        if (Common.isArray(_options) || Common.isObject(_options)) {
          var _nextSibling = controller.__li.nextElementSibling;
          controller.remove();
          return _add(gui, controller.object, controller.property, {
            before: _nextSibling,
            factoryArgs: [_options]
          });
        }
      },
      name: function name(_name) {
        controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
        return controller;
      },
      listen: function listen() {
        controller.__gui.listen(controller);
        return controller;
      },
      remove: function remove() {
        controller.__gui.remove(controller);
        return controller;
      }
    });
    if (controller instanceof NumberControllerSlider) {
      var box = new NumberControllerBox(controller.object, controller.property, { min: controller.__min, max: controller.__max, step: controller.__step });
      Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step', 'min', 'max'], function (method) {
        var pc = controller[method];
        var pb = box[method];
        controller[method] = box[method] = function () {
          var args = Array.prototype.slice.call(arguments);
          pb.apply(box, args);
          return pc.apply(controller, args);
        };
      });
      dom.addClass(li, 'has-slider');
      controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
    } else if (controller instanceof NumberControllerBox) {
      var r = function r(returned) {
        if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
          var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
          var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
          controller.remove();
          var newController = _add(gui, controller.object, controller.property, {
            before: controller.__li.nextElementSibling,
            factoryArgs: [controller.__min, controller.__max, controller.__step]
          });
          newController.name(oldName);
          if (wasListening) { newController.listen(); }
          return newController;
        }
        return returned;
      };
      controller.min = Common.compose(r, controller.min);
      controller.max = Common.compose(r, controller.max);
    } else if (controller instanceof BooleanController) {
      dom.bind(li, 'click', function () {
        dom.fakeEvent(controller.__checkbox, 'click');
      });
      dom.bind(controller.__checkbox, 'click', function (e) {
        e.stopPropagation();
      });
    } else if (controller instanceof FunctionController) {
      dom.bind(li, 'click', function () {
        dom.fakeEvent(controller.__button, 'click');
      });
      dom.bind(li, 'mouseover', function () {
        dom.addClass(controller.__button, 'hover');
      });
      dom.bind(li, 'mouseout', function () {
        dom.removeClass(controller.__button, 'hover');
      });
    } else if (controller instanceof ColorController) {
      dom.addClass(li, 'color');
      controller.updateDisplay = Common.compose(function (val) {
        li.style.borderLeftColor = controller.__color.toString();
        return val;
      }, controller.updateDisplay);
      controller.updateDisplay();
    }
    controller.setValue = Common.compose(function (val) {
      if (gui.getRoot().__preset_select && controller.isModified()) {
        markPresetModified(gui.getRoot(), true);
      }
      return val;
    }, controller.setValue);
  }
  function recallSavedValue(gui, controller) {
    var root = gui.getRoot();
    var matchedIndex = root.__rememberedObjects.indexOf(controller.object);
    if (matchedIndex !== -1) {
      var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];
      if (controllerMap === undefined) {
        controllerMap = {};
        root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
      }
      controllerMap[controller.property] = controller;
      if (root.load && root.load.remembered) {
        var presetMap = root.load.remembered;
        var preset = void 0;
        if (presetMap[gui.preset]) {
          preset = presetMap[gui.preset];
        } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
          preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
        } else {
          return;
        }
        if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
          var value = preset[matchedIndex][controller.property];
          controller.initialValue = value;
          controller.setValue(value);
        }
      }
    }
  }
  function _add(gui, object, property, params) {
    if (object[property] === undefined) {
      throw new Error('Object "' + object + '" has no property "' + property + '"');
    }
    var controller = void 0;
    if (params.color) {
      controller = new ColorController(object, property);
    } else {
      var factoryArgs = [object, property].concat(params.factoryArgs);
      controller = ControllerFactory.apply(gui, factoryArgs);
    }
    if (params.before instanceof Controller) {
      params.before = params.before.__li;
    }
    recallSavedValue(gui, controller);
    dom.addClass(controller.domElement, 'c');
    var name = document.createElement('span');
    dom.addClass(name, 'property-name');
    name.innerHTML = controller.property;
    var container = document.createElement('div');
    container.appendChild(name);
    container.appendChild(controller.domElement);
    var li = addRow(gui, container, params.before);
    dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);
    if (controller instanceof ColorController) {
      dom.addClass(li, 'color');
    } else {
      dom.addClass(li, _typeof(controller.getValue()));
    }
    augmentController(gui, li, controller);
    gui.__controllers.push(controller);
    return controller;
  }
  function getLocalStorageHash(gui, key) {
    return document.location.href + '.' + key;
  }
  function addPresetOption(gui, name, setSelected) {
    var opt = document.createElement('option');
    opt.innerHTML = name;
    opt.value = name;
    gui.__preset_select.appendChild(opt);
    if (setSelected) {
      gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
    }
  }
  function showHideExplain(gui, explain) {
    explain.style.display = gui.useLocalStorage ? 'block' : 'none';
  }
  function addSaveMenu(gui) {
    var div = gui.__save_row = document.createElement('li');
    dom.addClass(gui.domElement, 'has-save');
    gui.__ul.insertBefore(div, gui.__ul.firstChild);
    dom.addClass(div, 'save-row');
    var gears = document.createElement('span');
    gears.innerHTML = '&nbsp;';
    dom.addClass(gears, 'button gears');
    var button = document.createElement('span');
    button.innerHTML = 'Save';
    dom.addClass(button, 'button');
    dom.addClass(button, 'save');
    var button2 = document.createElement('span');
    button2.innerHTML = 'New';
    dom.addClass(button2, 'button');
    dom.addClass(button2, 'save-as');
    var button3 = document.createElement('span');
    button3.innerHTML = 'Revert';
    dom.addClass(button3, 'button');
    dom.addClass(button3, 'revert');
    var select = gui.__preset_select = document.createElement('select');
    if (gui.load && gui.load.remembered) {
      Common.each(gui.load.remembered, function (value, key) {
        addPresetOption(gui, key, key === gui.preset);
      });
    } else {
      addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
    }
    dom.bind(select, 'change', function () {
      for (var index = 0; index < gui.__preset_select.length; index++) {
        gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
      }
      gui.preset = this.value;
    });
    div.appendChild(select);
    div.appendChild(gears);
    div.appendChild(button);
    div.appendChild(button2);
    div.appendChild(button3);
    if (SUPPORTS_LOCAL_STORAGE) {
      var explain = document.getElementById('dg-local-explain');
      var localStorageCheckBox = document.getElementById('dg-local-storage');
      var saveLocally = document.getElementById('dg-save-locally');
      saveLocally.style.display = 'block';
      if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
        localStorageCheckBox.setAttribute('checked', 'checked');
      }
      showHideExplain(gui, explain);
      dom.bind(localStorageCheckBox, 'change', function () {
        gui.useLocalStorage = !gui.useLocalStorage;
        showHideExplain(gui, explain);
      });
    }
    var newConstructorTextArea = document.getElementById('dg-new-constructor');
    dom.bind(newConstructorTextArea, 'keydown', function (e) {
      if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
        SAVE_DIALOGUE.hide();
      }
    });
    dom.bind(gears, 'click', function () {
      newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
      SAVE_DIALOGUE.show();
      newConstructorTextArea.focus();
      newConstructorTextArea.select();
    });
    dom.bind(button, 'click', function () {
      gui.save();
    });
    dom.bind(button2, 'click', function () {
      var presetName = prompt('Enter a new preset name.');
      if (presetName) {
        gui.saveAs(presetName);
      }
    });
    dom.bind(button3, 'click', function () {
      gui.revert();
    });
  }
  function addResizeHandle(gui) {
    var pmouseX = void 0;
    gui.__resize_handle = document.createElement('div');
    Common.extend(gui.__resize_handle.style, {
      width: '6px',
      marginLeft: '-3px',
      height: '200px',
      cursor: 'ew-resize',
      position: 'absolute'
    });
    function drag(e) {
      e.preventDefault();
      gui.width += pmouseX - e.clientX;
      gui.onResize();
      pmouseX = e.clientX;
      return false;
    }
    function dragStop() {
      dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.unbind(window, 'mousemove', drag);
      dom.unbind(window, 'mouseup', dragStop);
    }
    function dragStart(e) {
      e.preventDefault();
      pmouseX = e.clientX;
      dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
      dom.bind(window, 'mousemove', drag);
      dom.bind(window, 'mouseup', dragStop);
      return false;
    }
    dom.bind(gui.__resize_handle, 'mousedown', dragStart);
    dom.bind(gui.__closeButton, 'mousedown', dragStart);
    gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
  }
  function setWidth(gui, w) {
    gui.domElement.style.width = w + 'px';
    if (gui.__save_row && gui.autoPlace) {
      gui.__save_row.style.width = w + 'px';
    }
    if (gui.__closeButton) {
      gui.__closeButton.style.width = w + 'px';
    }
  }
  function getCurrentPreset(gui, useInitialValues) {
    var toReturn = {};
    Common.each(gui.__rememberedObjects, function (val, index) {
      var savedValues = {};
      var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
      Common.each(controllerMap, function (controller, property) {
        savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
      });
      toReturn[index] = savedValues;
    });
    return toReturn;
  }
  function setPresetSelectIndex(gui) {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      if (gui.__preset_select[index].value === gui.preset) {
        gui.__preset_select.selectedIndex = index;
      }
    }
  }
  function updateDisplays(controllerArray) {
    if (controllerArray.length !== 0) {
      requestAnimationFrame$1$1.call(window, function () {
        updateDisplays(controllerArray);
      });
    }
    Common.each(controllerArray, function (c) {
      c.updateDisplay();
    });
  }
  var GUI$1 = GUI;

  /**
   * A dat.gui module for ERA settings. This is, of course, heavily tied to the
   * settings object loading and changing over time. It should also modify
   * and save settings within ERA.
   * TODO: Developer mode to enable/disable settings panel.
   */
  class SettingsPanel {
    constructor() {
      this.enabled = true;
      this.gui = null;
      this.datControllers = new Map();
      this.dummySettings = {};
      this.load();
      SettingsEvent.listen(this.load.bind(this));
    }

    /**
     * Loads new data into the panel.
     */
    load() {
      if (!this.enabled) {
        return;
      }
      if (!this.gui) {
        this.gui = new GUI$1();
      }
      // Update the loaded GUI with all settings.
      this.update();
    }

    /**
     * Destroys the GUI and unloaded the state of the panel.
     */
    destroy() {
      if (this.gui) {
        this.gui.destroy();
        this.gui = null;
      }
      this.datControllers.clear();
      this.dummySettings = {};
    }

    /**
     * Updates the settings panel with all settings available in the ERA settings
     * object.
     */
    update() {
      Settings$1.forEach((setting, name) => {
        var controller = this.datControllers.get(name);
        if (!controller) {
          this.dummySettings[name] = setting.getValue();
          controller = this.gui.add(this.dummySettings,
                                    name,
                                    setting.getMin(),
                                    setting.getMax());                          
          controller.onChange((value) => this.updateValue(name, value));
          controller.onFinishChange((value) => this.updateValue(name, value));
          this.datControllers.set(name, controller);
        }
        this.dummySettings[name] = setting.getValue();
        controller.updateDisplay();
      });
    }

    /**
     * Updates an individual value for a setting.
     * @param {string} name
     * @param {?} value
     */
    updateValue(name, value) {
      Settings$1.set(name, value);
    }
  }

  var SettingsPanel$1 = new SettingsPanel();

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var instance = null;
  /**
   * Engine core for the game.
   */
  class Engine {
    /**
     * Enforces singleton engine instance.
     */
    static get() {
      if (!instance) {
        instance = new Engine();
      }
      return instance;
    }

    constructor() {
      this.started = false;
      this.rendering = false;
      this.plugins = new Set();

      // Debug.
      this.timer = EngineTimer$1;
      this.settingsPanel = SettingsPanel$1;

      // The current game mode running.
      this.currentGameMode = null;

      // Load engine defaults.
      Settings$1.loadEngineDefaults();
    }

    /**
     * Starts the engine. This is separate from the constructor as it
     * is asynchronous.
     */
    async start() {
      if (this.started) {
        return;
      }
      this.started = true;
      this.rendering = true;
      requestAnimationFrame(() => this.render());
    }

    /**
     * Resets the game engine to its initial state.
     */
    reset() {
      // Reset all plugins.
      this.plugins.forEach((plugin) => plugin.reset());
      new EngineResetEvent().fire();
      // Clear the renderer.
      this.resetRender = true;
      this.started = false;
    }

    /**
     * The root for all tick updates in the game.
     */
    render(timeStamp) {
      this.timer.start();
      TWEEN.update(timeStamp);
      // Update all plugins.
      this.plugins.forEach((plugin) => plugin.update(timeStamp));

      // Check if the render loop should be halted.
      if (this.resetRender) {
        this.resetRender = false;
        this.rendering = false;
        return;
      }
      this.timer.end();
      // Continue the loop.
      requestAnimationFrame((time) => this.render(time));
    }

    /**
     * Installs a plugin to receive updates on each engine loop as well as
     * resets.
     * @param {Plugin} plugin
     */
    installPlugin(plugin) {
      this.plugins.add(plugin);
    }

    /**
     * Loads and starts a game mode.
     * @param {GameMode} gameMode
     * @async
     */
    async startGameMode(gameMode) {
      await gameMode.load();
      await gameMode.start();
      this.start();
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  /**
   * Base class for plugins to the engine such as audio, light, etc that can be
   * updated on each engine tick and reset gracefully.
   */
  class Plugin {
    constructor() {
      this.uuid = createUUID();
      this.install();
      SettingsEvent.listen(this.handleSettingsChange.bind(this));
    }

    /**
     * Installs the plugin into the engine. This method should be final.
     */
    install() {
      Engine.get().installPlugin(this);
      return this;
    }

    /**
     * Resets the plugin.
     */
    reset() {
      console.warn('Plugin reset function not implemented');
    }

    /**
     * Updates the plugin at each engine tick.
     * @param {number} timestamp
     */
    update(timestamp) {
      console.warn('Plugin update function not implemented');
    }

    /**
     * Handles a settings change event.
     */
    handleSettingsChange() {}
  }

  var instance$1 = null;

  /**
   * The animation library stores animation data for loaded models.
   */
  class Animation extends Plugin {
    static get() {
      if (!instance$1) {
        instance$1 = new Animation();
      }
      return instance$1;
    }

    constructor() {
      super();
      this.animations = new Map();
      this.mixers = new Map();
      this.lastUpdate = Date.now();
    }

    /** @override */
    update() {
      var currTime = Date.now();
      var diff = currTime - this.lastUpdate;
      this.mixers.forEach((mixer) => mixer.update(diff / 1000));
      this.lastUpdate = currTime;
    }

    /**
     * Stores animations for a given model name.
     * @param {string} name
     * @param {Array<THREE.AnimationClip>} animations
     */
    setAnimations(name, animations) {
      if (!name || !animations) {
        return;
      }
      this.animations.set(name, animations);
    }

    /**
     * Creates an animation mixer for a given name and mesh.
     * @param {string} name
     * @param {THREE.Mesh} mesh
     * @returns {THREE.AnimationMixer}
     */
    createAnimationMixer(name, mesh) {
      if (!name || !mesh || !this.animations.has(name)) {
        return null;
      }
      var mixer = new THREE.AnimationMixer(mesh);
      this.mixers.set(mesh.uuid, mixer);
      return mixer;
    }

    /**
     * Returns all animation clips for a given name.
     * @param {string} name
     */
    getClips(name) {
      return this.animations.get(name);
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var CROSSFADE_TIME = 500;

  var instance$2 = null;

  /**
   * Core implementation for all audio. Manages the loading, playback, and
   * other controls needed for in-game audio.
   */
  class Audio extends Plugin {
    static get() {
      if (!instance$2) {
        instance$2 = new Audio();
      }
      return instance$2;
    }

    constructor() {
      super();
      this.defaultVolume = 50;

      this.context = new AudioContext();

      // Map containing all sounds used in the engine. Key is the sound name,
      // value is the sound buffer.
      this.sounds = new Map();

      // The ambient sounds loaded.
      this.backgroundSounds = new Array();
      this.ambientEventSounds = new Array();

      // A map of playing sounds in order to allow stopping mid-play.
      this.playingSounds = new Map();

      this.handleSettingsChange();
    }

    /** @override */
    reset() {
      this.stopAmbientSound();
      this.playingSounds.forEach((node) => node.source.stop());
      this.playingSounds.clear();
    }

    /** @override */
    update() {}

    /** @override */
    handleSettingsChange() {
      if (Settings$1.get('volume') == this.masterVolume) {
        return;
      }
      this.masterVolume = Settings$1.get('volume');
      this.playingSounds.forEach((node) => {
        var volRatio = this.masterVolume / this.defaultVolume;
        var dataVolume = node.dataVolume ? node.dataVolume : 1.0;
        var adjustVolume = node.adjustVolume ? node.adjustVolume : 1.0;
        var volume = volRatio * dataVolume * adjustVolume;
        node.gain.gain.value = volume;
      });
    }

    /**
     * Loads all sounds described from the provided file path. The file should
     * be a JSON file. Follow the example at /src/data/sounds.json.
     * @param {string} filePath
     * @async
     */
    async loadAllFromFile(filePath) {
      if (!filePath) {
        return;
      }
      // Load JSON file with all sounds and options.
      var allSoundData;
      try {
        allSoundData = await loadJsonFromFile$1(filePath);
      } catch (e) {
        throw new Error(e);
      }
      // Extract the directory from the file path, use for loading sounds.
      var directory = filePath.substr(0, filePath.lastIndexOf('/') + 1);
      var promises = new Array();
      for (var name in allSoundData) {
        var options = allSoundData[name];
        promises.push(this.loadSound(directory, name, options));
      }
      return Promise.all(promises);
    }

    /**
     * Loads an individual sound and stores it.
     * @param {string} directory
     * @param {string} name
     * @param {Object} options
     */
    async loadSound(directory, name, options) {
      var extension = options.extension;
      // Insert a period if the extension doesn't have one.
      if (!extension.startsWith('.')) {
        extension = '.' + extension;
      }
      var path = "" + directory + name + extension;
      var event = await this.createSoundRequest(path);
      var buffer = await this.bufferSound(event);
      this.sounds.set(name, buffer);
      return;
    }

    /**
     * Creates and sends an HTTP GET request with type arraybuffer for sound.
     */
    createSoundRequest(path) {
      return new Promise((resolve, reject) => {
        var request = new XMLHttpRequest();
        request.open('GET', path, true);
        request.responseType = 'arraybuffer';
        request.addEventListener(
          'load',
          (event) => {
            resolve(event);
          },
          false
        );
        request.send();
      });
    }

    /**
     * Decodes audio data from the request response.
     */
    bufferSound(event) {
      return new Promise((resolve) => {
        var request = event.target;
        this.context.decodeAudioData(request.response, (buffer) => {
          resolve(buffer);
        });
      });
    }

    /**
     * Converts an audio buffer into a Web Audio API source node.
     */
    createSourceNode(buffer) {
      var source = this.context.createBufferSource();
      var gain = this.context.createGain();
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(this.context.destination);
      return {
        source: source,
        gain: gain
      };
    }

    /**
     * Plays a sound in-game.
     */
    playSound(name, adjustVolume) {
      if ( adjustVolume === void 0 ) adjustVolume = 1.0;

      var defaultSound = this.sounds.get(name);
      var buffer = defaultSound;
      if (!buffer) {
        return false;
      }
      var node = this.createSourceNode(buffer);
      var volRatio = this.masterVolume / this.defaultVolume;
      // TODO: Load sounds into actual sound objects.
      var dataVolume = 1.0; //soundData && soundData.volume ? soundData.volume : 1.0;
      var volume = volRatio * dataVolume * adjustVolume;
      node.gain.gain.value = volume;
      node.source.start(0);
      node.uuid = createUUID();
      node.dataVolume = dataVolume;
      node.adjustVolume = adjustVolume;
      this.playingSounds.set(node.uuid, node);
      setTimeout(() => {
        this.playingSounds.delete(node.uuid);
      }, Math.round(node.source.buffer.duration * 1000));
      return node;
    }

    /**
     * Plays a sound in-game on a loop.
     */
    playSoundOnLoop(name, adjustVolume) {
      if ( adjustVolume === void 0 ) adjustVolume = 1.0;

      var defaultSound = this.sounds.get(name);
      var buffer = defaultSound;
      if (!buffer) {
        return false;
      }
      var node = this.createSourceNode(buffer);
      var volRatio = this.masterVolume / this.defaultVolume;
      // TODO: Load sounds into actual sound objects.
      var dataVolume = 1.0; //soundData && soundData.volume ? soundData.volume : 1.0;
      var volume = volRatio * dataVolume * adjustVolume;
      node.gain.gain.value = volume;
      node.source.loop = true;
      node.source.start(0);
      node.uuid = createUUID();
      node.dataVolume = dataVolume;
      node.adjustVolume = adjustVolume;
      this.playingSounds.set(node.uuid, node);
      return node;
    }

    /**
     * Stops playing a sound.
     */
    stopSound(sourceNode) {
      if (sourceNode) {
        sourceNode.source.stop();
        if (sourceNode.uuid) {
          this.playingSounds.delete(sourceNode.uuid);
        }
      }
    }

    /**
     * Starts the loaded ambient sound track.
     */
    startAmbientSound() {
      if (!this.backgroundSounds.length) {
        return;
      }
      this.shouldPlayAmbientSound = true;
      this.addAmbientTrack(0, this.backgroundSounds, this.ambientVolume);
      setTimeout(() => {
        this.addAmbientTrack(1, this.backgroundSounds, this.ambientVolume);
      }, 2500);
      if (this.ambientEventSounds.length) {
        this.addAmbientTrack(2, this.ambientEventSounds, 0.2, 0.2);
      }
    }

    /**
     * Stops playing ambient sound track.
     */
    stopAmbientSound() {
      this.shouldPlayAmbientSound = false;
    }

    /**
     * Adds an ambient track to the specific channel. Called each time a new audio
     * clip needs to be played to continue the ambient noises.
     */
    addAmbientTrack(channel, sources, sourceVolume, randomness) {
      if ( randomness === void 0 ) randomness = 1.0;

      if (!this.shouldPlayAmbientSound) {
        return;
      }
      // Add a randomness play factor for varied background noises. This is
      // optional, as the default randomness of 1.0 will never trigger this.
      if (Math.random() > randomness) {
        setTimeout(() => {
          this.addAmbientTrack(channel, sources, sourceVolume, randomness);
        }, 3000);
        return;
      }
      var volRatio = this.masterVolume / this.defaultVolume;
      var volume = volRatio * sourceVolume;
      shuffleArray(sources);
      var selectedBuffer = null;
      for (var source of sources) {
        if (!source.inUse) {
          selectedBuffer = source;
          break;
        }
      }
      if (!selectedBuffer) {
        return;
      }
      selectedBuffer.inUse = true;
      var currTime = this.context.currentTime;
      var node = this.createSourceNode(selectedBuffer);
      node.source.start(0);
      node.gain.gain.linearRampToValueAtTime(0, currTime);
      node.gain.gain.linearRampToValueAtTime(
        volume,
        currTime + CROSSFADE_TIME / 1000
      );

      // When the audio track is drawing to a close, queue up new track, fade old.
      setTimeout(() => {
        this.addAmbientTrack(channel, sources, sourceVolume, randomness);
        currTime = this.context.currentTime;
        node.gain.gain.linearRampToValueAtTime(volume, currTime);
        node.gain.gain.linearRampToValueAtTime(
          0,
          currTime + CROSSFADE_TIME / 1000
        );
      }, Math.round(node.source.buffer.duration * 1000 - CROSSFADE_TIME));

      // When audio finishes playing, mark as not in use.
      var uuid = createUUID();
      this.playingSounds.set(uuid, node);
      setTimeout(() => {
        selectedBuffer.inUse = false;
        this.playingSounds.delete(uuid);
      }, Math.round(node.source.buffer.duration * 1000));
    }
  }

  var instance$3 = null;

  /**
   * Manages camera contruction.
   */
  class Camera {
    static get() {
      if (!instance$3) {
        instance$3 = new Camera();
      }
      return instance$3;
    }

    constructor() {
      this.cameras = new Map();
    }

    /**
     * Builds a default perspective camera.
     * @returns {THREE.PerspectiveCamera}
     */
    buildPerspectiveCamera() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      var viewAngle = 70;
      var aspect = width / height;
      var near = 1;
      var far = 1000;
      var camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
      camera.rotation.order = 'YXZ';
      camera.userData.resize = (width, height) => {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      return camera;
    }

    /**
     * Builds a default isometric camera.
     * @returns {THREE.OrthgraphicCamera}
     */
    buildIsometricCamera() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      var near = 1;
      var far = 1000;
      var camera = new THREE.OrthographicCamera(
        width / -2,
        width / 2,
        height / 2,
        height / -2,
        near,
        far
      );
      camera.zoom = 16;
      camera.updateProjectionMatrix();
      camera.userData.resize = (width, height) => {
        camera.left = width / -2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = height / -2;
        camera.updateProjectionMatrix();
      };
      this.cameras.set(camera.uuid, camera);
      return camera;
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   * @author erveon / https://github.com/erveon
   */

  var CONTROLS_KEY = 'era_bindings';

  var instance$4 = null;

  /**
   * The controls core for the game. Input handlers are created here. Once the
   * input is received, the response is delegated to the entity in control.
   */
  class Controls extends Plugin {
    /**
     * Enforces singleton controls instance.
     */
    static get() {
      if (!instance$4) {
        instance$4 = new Controls();
      }
      return instance$4;
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
      var customObj;
      try {
        customObj = JSON.parse(localStorage.getItem(CONTROLS_KEY));
      } catch (e) {
        console.error(e);
        return new Map();
      }
      var bindingsMap = new Map();
      // Iterate over all controls IDs.
      for (var controlsId of Object.keys(customObj)) {
        // Create bindings from the given object.
        var bindings = new Bindings(controlsId).load(customObj[controlsId]);
        bindingsMap.set(controlsId, bindings);
      }
      return bindingsMap;
    }

    /**
     * Registers custom bindings defined by the user.
     */
    registerCustomBindings() {
      var customBindings = this.loadCustomBindingsFromStorage();
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
      var allCustomBindings = this.loadCustomBindingsFromStorage();

      // Attach custom bindings for this ID if they don't exist.
      var idBindings = allCustomBindings.get(controlsId);
      if (!idBindings) {
        idBindings = new Bindings(controlsId);
        allCustomBindings.set(controlsId, idBindings);
      }
      // Check if the action exists for the given ID.
      var idAction = idBindings.getActions().get(action);
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
      var allCustomBindings = this.loadCustomBindingsFromStorage();
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
      var allCustomBindings = this.loadCustomBindingsFromStorage();
      var entityBindings = allCustomBindings.get(controlsId);
      var action = entityBindings.getAction(actionName);
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
        var defaultBindings = staticEntity.GetBindings();
        this.registeredBindings.set(id, defaultBindings);
      });
    }

    /**
     * Writes a map of bindings to local storage.
     * @param {Map<string, Bindings} bindingsMap
     */
    writeBindingsToStorage(bindingsMap) {
      var exportObj = {};
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
        for (var i = 0; i < navigator.getGamepads().length; i++) {
          var controller = navigator.getGamepads()[i];
          if (!controller) {
            continue;
          }
          var rawControllerInput = this.getRawControllerInput(controller);
          // Fires an event with key and value
          // Key -> button1, axes2,..
          // Value -> Range from 0 to 1
          for (var key of Object.keys(rawControllerInput)) {
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
      var input = {};
      if (this.hasController) {
        for (var i = 0; i < controller.axes.length; i++) {
          var val = controller.axes[i];
          val = Math.abs(val) < this.movementDeadzone ? 0 : val;
          input[("axes" + i)] = val;
        }

        for (var i$1 = 0; i$1 < controller.buttons.length; i$1++) {
          var val$1 = controller.buttons[i$1].value;
          val$1 = Math.abs(val$1) > this.movementDeadzone ? val$1 : 0;
          input[("button" + i$1)] = val$1;
        }

        if (!this.previousInput[controller.index]) {
          this.previousInput[controller.index] = {};
        }
        for (var key of Object.keys(input)) {
          // Only send 0 if the one before that wasn't 0
          var previouslyHadValue =
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
    setActions(key, value, inputDevice, gamepadNumber) {
      if ( inputDevice === void 0 ) inputDevice = 'keyboard';
      if ( gamepadNumber === void 0 ) gamepadNumber = null;

      if (!this.controlsEnabled) {
        return;
      }
      var isController = inputDevice === 'controller';
      // Check if we should also set the direction-specific axes actions.
      if (
        isController &&
        key.indexOf('axes') >= 0 &&
        !key.startsWith('+') &&
        !key.startsWith('-')
      ) {
        var absValue = Math.abs(value);
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
        var playerNumber = entity.getPlayerNumber();
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
        var bindings = this.registeredBindings.get(entity.getControlsId());
        if (!bindings) {
          console.warn('Bindings not defined for registered entity', entity);
          return;
        }
        var actions = bindings.getActionsForKey(key, playerNumber);
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
      var ratio = this.mouseSensitivity / 50;
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
      this.movementDeadzone = Settings$1.get('movement_deadzone');
      this.mouseSensitivity = Settings$1.get('mouse_sensitivity');
    }

    /**
     * Creates orbit controls on the camera, if they exist.
     * @param {THREE.Camera} camera
     * @param {THREE.Renderer} renderer
     */
    useOrbitControls(camera, renderer) {
      return new THREE.OrbitControls(camera, renderer.domElement);
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
      var bindings = entity.GetBindings();
      // Register the entity controls for later use when reloading defaults.
      this.controlIds.set(bindings.getId(), entity);
      // Check if custom bindings have already been set.
      var customBindings = this.registeredBindings.get(bindings.getId());
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
      var defaultBindings = this.registeredBindings.get(bindings.getId());
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
      var bindings = this.registeredBindings.get(controlsId);
      if (!bindings) {
        return;
      }
      return bindings;
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var instance$5 = null;

  /**
   * Core implementation for loading 3D models for use in-game.
   */
  class Models {

    /**
     * Enforces a singleton instance of Models.
     * @returns {Models}
     */
    static get() {
      if (!instance$5) {
        instance$5 = new Models();
      }
      return instance$5;
    }

    constructor() {
      // Stores all models. Key is the model name, value is the
      // model mesh.
      this.storage = new Map();
    }

    /**
     * Loads all models described from the provided file path. The file should
     * be a JSON file. Follow the example at /src/data/models.json.
     * @param {string} filePath
     * @async
     */
    async loadAllFromFile(filePath) {
      if (!filePath) {
        return;
      }
      // Load JSON file with all models and options.
      var allModelData;
      try {
        allModelData = await loadJsonFromFile$1(filePath);
      } catch (e) {
        throw new Error(e);
      }
      // Extract the directory from the file path, use for loading models.
      var directory = filePath.substr(0, filePath.lastIndexOf('/') + 1);
      var promises = new Array();
      for (var name in allModelData) {
        var options = allModelData[name];
        promises.push(this.loadModel(directory, name, options));
      }
      return Promise.all(promises);
    }

    /**
     * Load the model from file and places it into model storage. Uses the glTF
     * file format and loader.
     * @param {string} path
     * @param {Object} options
     * @async
     */
    async loadModel(directory, name, options) {
      if ( options === void 0 ) options = {};

      // Defaults to GLTF.
      var extension = options.extension ? options.extension : 'gltf';
      var path = "" + directory + name + "." + extension;
      var root;
      switch (extension) {
        case 'gltf':
          var gltf = await this.loadGltfModel(path);
          root = gltf.scene;
          Animation.get().setAnimations(name, gltf.animations);
          break;
        case 'obj':
          root = await this.loadObjModel(path);
          break;
        case 'fbx':
          root = await this.loadFbxModel(path);
          Animation.get().setAnimations(name, root.animations);
          break;
      }
      // Scale the model based on options.
      if (options.scale) {
        root.scale.setScalar(options.scale);
      }
      // Set the model in storage.
      this.storage.set(name, root);
      return root;
    }

    /**
     * Loads a GLTF model.
     * @param {string} path 
     * @async
     */
    async loadGltfModel(path) {
      return new Promise((resolve) => {
        var loader = new THREE.GLTFLoader();
        loader.load(path, (gltf) => {
          resolve(gltf);
        }, () => {}, (err) => {
          throw new Error(err);
        });
      });
    }

    /**
     * Loads a Obj model.
     * @param {string} path 
     * @async
     */
    async loadObjModel(path) {
      var materials = null;
      try {
        materials = await this.loadObjMaterials(path);
      } catch (e) {}
      var root = await this.loadObjGeometry(path, materials);
      return root;
    }

    /**
     * 
     * @param {string} path 
     * @param {?} materials 
     */
    loadObjGeometry(path, materials) {
      return new Promise((resolve) => {
        var objLoader = new THREE.OBJLoader();
        if (materials) {
          objLoader.setMaterials(materials);
        }
        objLoader.load(path, resolve);
      });
    }

    /**
     * Loads an obj files respective materials.
     * @param {string} path
     * @async
     */
    loadObjMaterials(path) {
      var mtlLoader = new THREE.MTLLoader();
      // Modify .obj path to look for .mtl.
      path = path.slice(0, path.lastIndexOf('.')) + '.mtl';
      return new Promise((resolve, reject) => {
        mtlLoader.load(path, (materials) => {
          materials.preload();
          resolve(materials);
        }, () => {}, () => reject());
      });
    }

    /**
     * Loads a FBX model.
     * @param {string} path 
     * @async
     */
    async loadFbxModel(path) {
      var loader = new THREE.FBXLoader();
      return new Promise((resolve) => {
  		  loader.load(path, (object) => {
          resolve(object);
        }, () => {}, (err) => console.error(err));
      }); 
    }

    /**
     * Creates a clone of a model from storage.
     * @param {string} name
     * @return {THREE.Object3D}
     */
    createModel(name) {
      if (!this.storage.has(name)) {
        return null;
      }
      var original = this.storage.get(name);
      var clone = THREE.SkeletonUtils.clone(original);
      return clone;
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var instance$6 = null;
  /**
   * Core implementation for managing the game's physics. The
   * actual physics engine is provided by the user.
   */
  class Physics extends Plugin {
    /**
     * Enforces singleton physics instance.
     */
    static get() {
      if (!instance$6) {
        instance$6 = new Physics();
      }
      return instance$6;
    }

    constructor() {
      super();
      this.registeredEntities = new Map();
      this.world = this.createWorld();
      this.eraWorld = null;
      this.lastTime = performance.now();
    }

    /** @override */
    reset() {
      this.terminate();
      // TODO: Clean up physics bodies.
    }

    /** @override */
    update() {
      var currTime = performance.now();
      var delta = currTime - this.lastTime;
      this.lastTime = currTime;
      if (delta <= 0) {
        return;
      }
      this.step(delta);
      this.updateEntities(delta);
      if (this.debugRenderer) {
        this.debugRenderer.update();
      }
    }

    /** @override */
    handleSettingsChange() {
      if (Settings$1.get('debug') && this.debugRenderer) {
        return;
      }
      Settings$1.get('debug')
        ? this.enableDebugRenderer()
        : this.disableDebugRenderer();
    }

    getWorld() {
      return this.world;
    }

    setEraWorld(eraWorld) {
      this.eraWorld = eraWorld;
      this.handleSettingsChange();
      return this;
    }

    getEraWorld() {
      return this.eraWorld;
    }

    /**
     * Steps the physics world.
     * @param {number} delta
     */
    step(delta) {
      console.warn('Step not defined');
    }

    /**
     * Instantiates the physics world.
     */
    createWorld() {
      console.warn('Create world not defined');
    }

    /**
     * Iterates through all registered entities and updates them.
     */
    updateEntities(delta) {
      this.registeredEntities.forEach((entity) => entity.update(delta));
    }

    /**
     * Registers an entity to partake in physics simulations.
     * @param {Entity} entity
     */
    registerEntity(entity) {
      if (!entity || !entity.physicsBody) {
        console.error('Must pass in an entity');
        return false;
      }
      this.registeredEntities.set(entity.uuid, entity);
      entity.registerPhysicsWorld(this);
      this.registerContactHandler(entity);
      return true;
    }

    /**
     * Unregisters an entity from partaking in physics simulations.
     * @param {Entity} entity
     */
    unregisterEntity(entity) {
      if (!entity || !entity.physicsBody) {
        console.error('Must pass in an entity');
        return false;
      }
      this.registeredEntities.delete(entity.uuid);
      entity.unregisterPhysicsWorld(this);
      return true;
    }

    /**
     * Registers a component to partake in physics simulations. This
     * differs from an entity in that it is a single body unattached
     * to a mesh.
     */
    registerComponent(body) {
      console.warn('Unregister entity not defined');
    }

    /**
     * Unregisters a component to partake in physics simulations.
     */
    unregisterComponent(body) {
      console.warn('Unregister component not defined');
    }

    /**
     * Ends the physics simulation. Is only called client-side.
     */
    terminate() {
      clearInterval(this.updateInterval);
      instance$6 = null;
    }

    /**
     * Gets the position of the given entity. Must be implemented by
     * engine-specific implementations.
     * @param {Entity} entity
     * @returns {Object}
     */
    getPosition(entity) {
      console.warn('getPosition(entity) not implemented');
    }

    /**
     * Gets the rotation of the given entity. Must be implemented by
     * engine-specific implementations.
     * @param {Entity} entity
     * @returns {Object}
     */
    getRotation(entity) {
      console.warn('getRotation(entity) not implemented');
    }

    /**
     * Sets a debug renderer on the physics instance. This should be overriden by
     * each engine-specific implementation for ease of use.
     */
    enableDebugRenderer() {
      console.warn('Debug renderer not implemented');
    }

    /**
     * Disables the debug renderer on the physics instance.
     */
    disableDebugRenderer() {
      if (!this.debugRenderer) {
        return;
      }
      this.debugRenderer.destroy();
      this.debugRenderer = null;
    }

    /**
     * Autogenerates a physics body based on the given mesh.
     * @param {THREE.Object3D} mesh
     * @returns {?} The physics body.
     */
    autogeneratePhysicsBody(mesh) {
      console.warn('Autogenerating physics bodies not supported.');
    }

    /**
     * Registers an entity to receive contact events.
     * @param {Entity} entity
     */
    registerContactHandler(entity) {
      console.warn('Contact handler not supported');
    }
  }

  /**
   * A standard event target.
   * @implements {EventTargetInterface}
   */
  class EventTarget {
    constructor() {
      this.listeners = new Map();
      this.uuidToLabels = new Map();
    }

    /** @override */
    addEventListener(label, handler) {
      if (!this.listeners.has(label)) {
        this.listeners.set(label, new Map());
      }
      var uuid = createUUID();
      this.listeners.get(label).set(uuid, handler);
      this.uuidToLabels.set(uuid, label);
      return uuid;
    }

    /** @override */
    removeEventListener(uuid) {
      var label = this.uuidToLabels.get(uuid);
      if (!label) {
        return false;
      }
      this.uuidToLabels.delete(uuid);
      var labelListeners = this.listeners.get(label);
      if (!labelListeners) {
        return false;
      }
      return labelListeners.delete(uuid);
    }

    /** @override */
    dispatchEvent(label, data) {
      var labelListeners = this.listeners.get(label);
      if (!labelListeners) {
        return;
      }
      labelListeners.forEach((handler) => handler(data));
    }
  }

  /**
   * An EventTarget that extends THREE.Object3D for use by Entities.
   * TODO: Try and reduce duplicate code between these two due to lack of
   *       multiple inheritance in JS.
   * @implements {EventTargetInterface}
   */
  class Object3DEventTarget extends THREE.Object3D {
    constructor() {
      super();
      this.listeners = new Map();
      this.uuidToLabels = new Map();
    }

    /** @override */
    addEventListener(label, handler) {
      if (!this.listeners.has(label)) {
        this.listeners.set(label, new Map());
      }
      var uuid = createUUID();
      this.listeners.get(label).set(uuid, handler);
      this.uuidToLabels.set(uuid, label);
      return uuid;
    }

    /** @override */
    addOneShotEventListener(label, handler) {
      var listener = this.addEventListener(label, (data) => {
        this.removeEventListener(listener);
        handler(data);
      });
    }

    /** @override */
    removeEventListener(uuid) {
      var label = this.uuidToLabels.get(uuid);
      if (!label) {
        return false;
      }
      this.uuidToLabels.delete(uuid);
      var labelListeners = this.listeners.get(label);
      if (!labelListeners) {
        return false;
      }
      return labelListeners.delete(uuid);
    }

    /** @override */
    dispatchEvent(label, data) {
      var labelListeners = this.listeners.get(label);
      if (!labelListeners) {
        return;
      }
      labelListeners.forEach((handler) => handler(data));
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var ENTITY_BINDINGS = {
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

  var CONTROLS_ID = 'Entity';

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
      this.world = null;
      this.built = false;
      this.modelName = null;
      this.mesh = null;
      this.cameraArm = null;
      this.registeredCameras = new Set();
      this.meshEnabled = true;

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
        return this;
      }
      this.mesh = this.generateMesh();
      if (this.mesh) {
        this.add(this.mesh);
        this.animationMixer = Animation.get().createAnimationMixer(
          this.modelName,
          this
        );
        this.animationClips = Animation.get().getClips(this.modelName);
        if (Settings$1.get('shadows')) {
          this.enableShadows();
        }
      }
      this.cameraArm = this.createCameraArm();
      if (this.physicsEnabled) {
        this.physicsBody = this.generatePhysicsBody();
      }
      this.built = true;
      return this;
    }

    /**
     * Destroys the entity by unregistering from all core components and disposing
     * of all objects in memory.
     */
    destroy() {
      var world = getRootWorld(this);
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
      var scene = Models.get().createModel(this.modelName);
      return scene;
    }

    /**
     * Creates a camera arm for the entity. All cameras will be automatically
     * added to this arm by default.
     */
    createCameraArm() {
      var obj = new THREE.Object3D();
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
      var body = this.physicsBody;
      if (!body) { return null; }
      var precision = 4;
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
     * Called every step of the physics engine to keep the mesh and physics object
     * synchronized.
     */
    update() {
      if (!this.mesh || !this.physicsBody || !this.physicsWorld) {
        return;
      }
      var position = this.physicsWorld.getPosition(this);
      var rotation = this.physicsWorld.getRotation(this);
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
      if (!physics) { return; }
      // TODO: make this engine-agnostic.
      var angVelo = physics[0];
      var pos = physics[1];
      var velo = physics[2];
      var rot = physics[3];
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
      var clip = this.getAnimationClip(name);
      if (!clip) {
        return null;
      }
      var action = this.animationMixer.clipAction(clip);
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
      this.traverse((child) => {
        child.castShadow = true;
        child.receiveShadow = true;
      });
    }

    /**
     * Disabled shadows from being cast and received by the entity.
     */
    disableShadows() {
      this.traverse((child) => {
        child.castShadow = false;
        child.receiveShadow = false;
      });
    }

    /**
     * Handles a settings change event.
     */
    handleSettingsChange() {}
  }

  var CHARACTER_BINDINGS = {
    SPRINT: {
      keys: {
        keyboard: 16,
        controller: 'button10'
      }
    },
    JUMP: {
      keys: {
        keyboard: 32,
        controller: 'button0'
      }
    },
    LOOK_X: {
      keys: {
        controller: 'axes2'
      }
    },
    LOOK_Y: {
      keys: {
        controller: 'axes3'
      }
    }
  };

  var RAYCAST_GEO = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  var RAYCAST_MATERIAL = new THREE.MeshLambertMaterial({ color: 0xff0000 });
  var RAYCAST_BLUE_MATERIAL = new THREE.MeshLambertMaterial({
    color: 0x0000ff
  });

  var CONTROLS_ID$1 = 'Character';

  // Default character properties.
  var DEFAULT_CAPSULE_OFFSET = 0.2;
  var DEFAULT_CAPSULE_RADIUS = 0.25;
  var DEFAULT_HEIGHT = 1.8;
  var DEFAULT_LERP_FACTOR = 0.5;
  var DEFAULT_MASS = 1;
  var DEFAULT_FALL_THRESHOLD = 700;
  var DEFAULT_JUMP_MIN = 500;
  var DEFAULT_LAND_MIX_THRESHOLD = 150;
  var DEFAULT_LAND_SPEED_THRESHOLD = 5;
  var DEFAULT_LAND_TIME_THRESHOLD = 1500;
  var DEFAULT_VELO_LERP_FACTOR = 0.15;

  /**
   * A special entity used for controlling an organic character, such as a human.
   * This is different from a standard entity in its physics and animation
   * behavior. Note: This is designed exclusively for Cannon.js.
   */
  class Character extends Entity {
    constructor() {
      super();
      // Make all defaults overrideable by subclasses.
      // Height of the character.
      this.height = DEFAULT_HEIGHT;
      // Offset used for smoother movement. Increase for larger vertical motion.
      this.capsuleOffset = DEFAULT_CAPSULE_OFFSET;
      // Radius of the character's physics capsule.
      this.capsuleRadius = DEFAULT_CAPSULE_RADIUS;
      // Amount of time in ms that the fall animation requires to trigger.
      this.fallThreshold = DEFAULT_FALL_THRESHOLD;
      // The interpolation factor for character raycasting adjustments.
      this.lerpFactor = DEFAULT_LERP_FACTOR;
      // The interpolation factor for character movement.
      this.velocityLerpFactor = DEFAULT_VELO_LERP_FACTOR;
      // The mass of the character.
      this.mass = DEFAULT_MASS;
      // Amount of time in ms required to cancel a jump animation.
      this.jumpMin = DEFAULT_JUMP_MIN;
      // Time in ms before the end of the landing animation that the next
      // animation can start.
      this.landMixThreshold = DEFAULT_LAND_MIX_THRESHOLD;
      // The speed at which a landing animation will be cancelled.
      this.landSpeedThreshold = DEFAULT_LAND_SPEED_THRESHOLD;
      // The amount of time falling in ms that a character needs to endure before
      // triggering a landing action.
      this.landTimeThreshold = DEFAULT_LAND_TIME_THRESHOLD;

      // TODO: Bundle animation names with states.
      this.idleAnimationName = null;
      this.walkingAnimationName = null;
      this.sprintingAnimationName = null;
      this.jumpingAnimationName = null;
      this.fallingAnimationName = null;
      this.landingAnimationName = null;
      this.jumpAction = null;
      this.landAction = null;
      // TODO: Make state a common practice in ERA.
      this.state = 'idle';
      this.grounded = false;
      this.frozen = false;
      this.lastGroundedTime = 0;
      this.jumpTime = 0;
      this.wasFalling = false;
      this.previouslyGrounded = true;
      this.unfreezeTimeout = null;
      this.landingDummy = new THREE.Vector2();

      // Raycasting properties.
      this.startVec = new CANNON.Vec3();
      this.endVec = new CANNON.Vec3();
      this.ray = new CANNON.Ray(this.startVec, this.endVec);
      this.ray.skipBackfaces = true;
      this.ray.mode = CANNON.Ray.CLOSEST;
      this.ray.collisionFilterMask = ~2;
      this.rayStartBox = new THREE.Mesh(RAYCAST_GEO, RAYCAST_BLUE_MATERIAL);
      this.rayEndBox = new THREE.Mesh(RAYCAST_GEO, RAYCAST_MATERIAL);

      // Input properties.
      this.inputVector = new THREE.Vector3();
      this.targetQuaternion = new CANNON.Quaternion();
      this.lerpedVelocity = new THREE.Vector3();
      this.targetVelocity = new THREE.Vector3();
      this.cameraQuaternion = new THREE.Quaternion();
      this.cameraEuler = new THREE.Euler();
      this.cameraEuler.order = 'YXZ';
      this.cameraDirection = new THREE.Vector3();
    }

    /** @override */
    static GetBindings() {
      return new Bindings(CONTROLS_ID$1)
        .load(CHARACTER_BINDINGS)
        .merge(Entity.GetBindings());
    }

    /** @override */
    getControlsId() {
      return CONTROLS_ID$1;
    }

    /** @override */
    generatePhysicsBody() {
      var capsule = new CANNON.Body({ mass: this.mass });
      // TODO: Remove this collison filter group and make it more explicit to the
      // user.
      capsule.collisionFilterGroup = 2;
      capsule.material = this.physicsWorld.createPhysicalMaterial('character', {
        friction: 0
      });
      this.physicsWorld.createContactMaterial('character', 'ground', {
        friction: 0,
        contactEquationStiffness: 1e8
      });

      // Create center portion of capsule.
      var height = this.height - this.capsuleRadius * 2 - this.capsuleOffset;
      var cylinderShape = new CANNON.Cylinder(
        this.capsuleRadius,
        this.capsuleRadius,
        height,
        20
      );
      var quat = new CANNON.Quaternion();
      quat.setFromAxisAngle(CANNON.Vec3.UNIT_X, Math.PI / 2);
      var cylinderPos = height / 2 + this.capsuleRadius + this.capsuleOffset;
      capsule.addShape(cylinderShape, new CANNON.Vec3(0, cylinderPos, 0), quat);

      // Create round ends of capsule.
      var sphereShape = new CANNON.Sphere(this.capsuleRadius);
      var topPos = new CANNON.Vec3(
        0,
        height + this.capsuleRadius + this.capsuleOffset,
        0
      );
      var bottomPos = new CANNON.Vec3(
        0,
        this.capsuleRadius + this.capsuleOffset,
        0
      );
      capsule.addShape(sphereShape, topPos);
      capsule.addShape(sphereShape, bottomPos);

      // Prevent capsule from tipping over.
      capsule.fixedRotation = true;
      capsule.updateMassProperties();

      // Raycast debug.
      this.toggleRaycastDebug();
      return capsule;
    }

    /** @override */
    build() {
      super.build();
      this.playAnimation(this.idleAnimationName);
      return this;
    }

    /** @override */
    positionCamera(camera) {
      this.cameraArm.add(camera);
      camera.position.x = 5;
      this.cameraArm.rotation.z = Math.PI / 6;
      this.cameraArm.rotation.y = Math.PI / 2;
      camera.lookAt(this.position);
      // TODO: Fix this junk.
      Promise.resolve().then(() => (camera.position.y = 1.2));
    }

    /** @override */
    update() {
      super.update();
      this.updateRaycast();
      this.updateAnimations();
      this.updatePhysics();
    }

    /** @override */
    handleSettingsChange() {
      this.toggleRaycastDebug();
    }

    /**
     * Raycast to the ground.
     */
    updateRaycast() {
      if (!this.physicsWorld) {
        return;
      }
      // Set up ray targets. Make the origin vector around mid-level.
      this.ray.from.copy(this.physicsBody.interpolatedPosition);
      this.ray.to.copy(this.ray.from);
      this.ray.from.y += this.capsuleOffset + this.height / 2;
      this.rayStartBox.position.copy(this.ray.from);
      this.rayEndBox.position.copy(this.ray.to);
      // Intersect against the world.
      this.ray.result.reset();
      this.ray.intersectBodies(
        this.physicsWorld.getWorld().bodies,
        this.ray.result
      );
      if (this.ray.result.hasHit) {
        var hitDistance = this.ray.result.distance;
        var diff = this.capsuleOffset + this.height / 2 - hitDistance;
        this.rayEndBox.position.y = this.rayStartBox.position.y - hitDistance;
        this.rayEndBox.material.color.setHex(0xff8800);
        // Lerp new position.
        var newY = this.physicsBody.position.y + diff;
        var lerpedY = lerp(this.physicsBody.position.y, newY, this.lerpFactor);
        this.physicsBody.position.y = lerpedY;
        this.physicsBody.interpolatedPosition.y = lerpedY;
        this.physicsBody.velocity.y = 0;
        this.grounded = true;
      } else {
        this.grounded = false;
        this.rayEndBox.material.color.setHex(0xff0000);
      }
    }

    /**
     * Updates the animation state of the character.
     */
    updateAnimations() {
      if (this.frozen) {
        this.idle();
        return;
      }
      // Handle grounded/landing state.
      if (!this.grounded) {
        this.previouslyGrounded = false;
        return this.fall();
      } else {
        if (!this.previouslyGrounded && this.wasFalling) {
          this.land();
        }
        this.wasFalling = false;
        this.lastGroundedTime = performance.now();
        this.previouslyGrounded = true;
      }
      if (this.getActionValue(this.bindings.JUMP)) {
        return this.jump();
      }
      if (
        this.getActionValue(this.bindings.FORWARD) ||
        this.getActionValue(this.bindings.BACKWARD) ||
        this.getActionValue(this.bindings.LEFT) ||
        this.getActionValue(this.bindings.RIGHT)
      ) {
        if (this.getActionValue(this.bindings.SPRINT)) {
          this.sprint();
        } else {
          this.walk();
        }
      } else {
        this.idle();
      }
    }

    /**
     * Updates the physics state of the character.
     */
    updatePhysics() {
      // Update physics.
      if (this.frozen) {
        return;
      }
      var inputVector = this.inputVector;
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
      var camera = this.getWorld()
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

      if (this.grounded) {
        this.targetVelocity.x = inputVector.x * 2.5;
        this.targetVelocity.z = inputVector.z * 2.5;
        if (this.getActionValue(this.bindings.SPRINT)) {
          this.targetVelocity.x *= 2.5;
          this.targetVelocity.z *= 2.5;
        }
        this.lerpedVelocity.copy(this.physicsBody.velocity);
        this.targetVelocity.y = this.physicsBody.velocity.y;
        this.lerpedVelocity.lerp(this.targetVelocity, this.velocityLerpFactor);
        this.physicsBody.velocity.copy(this.lerpedVelocity);
      }
      // Update body rotation.
      if (inputVector.x || inputVector.z) {
        var angle = vectorToAngle(inputVector.z, inputVector.x);
        this.targetQuaternion.setFromAxisAngle(CANNON.Vec3.UNIT_Y, angle);
        this.updateRotation();
      }
    }

    /**
     * Updates the rotation of the character.
     */
    updateRotation() {
      this.physicsBody.quaternion.slerp(
        this.targetQuaternion,
        0.1,
        this.physicsBody.quaternion
      );
    }

    /**
     * Checks settings to see if raycast debug should be used.
     */
    toggleRaycastDebug() {
      var world = this.getWorld();
      if (!world) {
        return console.warn('World not set on character');
      }
      if (Settings$1.get('debug')) {
        var scene = world.getScene();
        scene.add(this.rayStartBox);
        scene.add(this.rayEndBox);
      } else {
        var scene$1 = world.getScene();
        scene$1.remove(this.rayStartBox);
        scene$1.remove(this.rayEndBox);
      }
    }

    /**
     * Freezes the character, preventing it from updating.
     */
    freeze() {
      clearTimeout(this.unfreezeTimeout);
      this.frozen = true;
    }

    /**
     * Unfreezes the character, allowing updates.
     */
    unfreeze() {
      this.frozen = false;
    }

    /**
     * Sets the character in the idle state.
     */
    idle() {
      if (this.state == 'idle') {
        return;
      }
      if (this.isJumpCooldown()) {
        return;
      }
      if (this.isLandPlaying()) {
        return;
      }
      this.state = 'idle';
      this.playAnimation(this.idleAnimationName);
    }

    /**
     * Marks the character in a walking state.
     */
    walk() {
      if (this.state == 'walking') {
        return;
      }
      if (this.isJumpCooldown()) {
        return;
      }
      if (this.isLandPlaying()) {
        return;
      }
      this.state = 'walking';
      this.playAnimation(this.walkingAnimationName);
    }

    /**
     * Marks the character in a sprint state.
     */
    sprint() {
      if (this.state == 'sprinting') {
        return;
      }
      if (this.isJumpCooldown()) {
        return;
      }
      if (this.isLandPlaying()) {
        return;
      }
      this.state = 'sprinting';
      this.playAnimation(this.sprintingAnimationName);
    }

    /**
     * Marks the character in a jump state.
     */
    jump() {
      if (this.state == 'jumping') {
        return;
      }
      this.state = 'jumping';
      this.jumpTime = performance.now();
      this.jumpAction = this.playAnimation(this.jumpingAnimationName);
      if (!this.jumpAction) {
        return;
      }
      this.jumpAction.loop = THREE.LoopOnce;
      this.jumpAction.clampWhenFinished = true;
      return true;
    }

    /**
     * Marks the character in a falling state.
     */
    fall() {
      if (this.state == 'falling') {
        return;
      }
      if (performance.now() - this.lastGroundedTime < this.fallThreshold) {
        return;
      }
      if (this.jumpAction && this.jumpAction.isRunning()) {
        return;
      }
      this.wasFalling = true;
      this.state = 'falling';
      this.playAnimation(this.fallingAnimationName);
    }

    /**
     * Plays landing animation.
     */
    land() {
      var diff = performance.now() - this.lastGroundedTime;
      if (diff < this.landTimeThreshold) {
        return;
      }
      this.landingDummy.set(
        this.physicsBody.velocity.x,
        this.physicsBody.velocity.z
      );
      // TODO: We should have a cooler running landing animation like a roll or
      //       stumble.
      if (this.landingDummy.length() > this.landSpeedThreshold) {
        return;
      }
      this.landAction = this.playAnimation(this.landingAnimationName);
      if (!this.landAction) {
        return;
      }
      this.landAction.loop = THREE.LoopOnce;
      this.physicsBody.velocity.x = 0;
      this.physicsBody.velocity.z = 0;
      this.tempFreeze(
        1000 * this.landAction.getClip().duration - this.landMixThreshold
      );
    }

    /**
     * Checks if the landing animation is still playing.
     */
    isLandPlaying() {
      if (!this.landAction) {
        return false;
      }
      var landDiff = this.landAction.getClip().duration - this.landAction.time;
      return landDiff * 1000 > this.landMixThreshold;
    }

    /**
     * Returns if the jump animation cooldown is still in effect.
     * @return {boolean}
     */
    isJumpCooldown() {
      return performance.now() - this.jumpTime < this.jumpMin;
    }

    /**
     * Temporarily freezes the character.
     * @param {number} time
     */
    tempFreeze(time) {
      this.freeze();
      this.unfreezeTimeout = setTimeout(() => this.unfreeze(), time);
    }
  }

  Controls.get().registerBindings(Character);

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var instance$7 = null;
  /**
   * Light core for the game engine. Creates and manages light
   * sources in-game. Should be used as a singleton.
   */
  class Light extends Plugin {
    /**
     * Enforces singleton light instance.
     */
    static get() {
      if (!instance$7) {
        instance$7 = new Light();
      }
      return instance$7;
    }

    constructor() {
      super();
      this.ambientLight = null;
      this.lights = new Array();
      this.debugEnabled = false;
      this.shadowsEnabled = false;
      this.handleSettingsChange();
    }

    /** @override */
    reset() {
      this.ambientLight = null;
      this.lights.forEach((light) => {
        this.removeHelpers(light);
        if (light.parent) {
          light.parent.remove(light);
        }
      });
      this.lights = new Array();
    }

    /** @override */
    update() {
      this.updateHelpers();
    }

    /**
     * Updates all helpers attached to lights.
     */
    updateHelpers() {
      // If debug settings are enabled, check for lights and their debug helpers.
      if (this.debugEnabled) {
        this.lights.forEach((light) => this.addHelpers(light));
      } else {
        this.lights.forEach((light) => this.removeHelpers(light));
      }
    }

    /**
     * Creates the ambient lighting. Use this for easing/darkening shadows.
     * @param {Object|LightOptions} options
     */
    createAmbientLight(options) {
      options = new LightOptions(options);
      var light = new THREE.AmbientLight(options.color);
      light.intensity = options.intensity;
      this.ambientLight = light;
      return light;
    }

    /**
     * Creates a directional light.
     * @param {Object|LightOptions} options
     */

    createDirectionalLight(options) {
      options = new LightOptions(options);
      var light = new THREE.DirectionalLight(options.color);
      light.position.copy(options.position);
      light.intensity = options.intensity;
      this.createShadows(light, options.shadow);
      light.helper = new THREE.DirectionalLightHelper(light, 10);
      this.lights.push(light);
      return light;
    }

    /**
     * Creates a spot light.
     * @param {Object|LightOptions} options
     */
    createSpotLight(options) {
      options = new LightOptions(options);
      var light = new THREE.SpotLight(options.color);
      light.position.copy(options.position);
      light.intensity = options.intensity;
      if (options.angle) {
        light.angle = options.angle;
      }
      if (options.penumbra) {
        light.penumbra = options.penumbra;
      }
      this.createShadows(light, options.shadow);
      light.helper = new THREE.SpotLightHelper(light);
      this.lights.push(light);
      return light;
    }

    /**
     * Creates the shadows for a light.
     * @param {THREE.Light} light
     * @param {ShadowOptions} options
     */
    createShadows(light, options) {
      if (!options) {
        return;
      }
      var cameraRange = options.frustum;
      light.shadow.camera.bottom = -cameraRange;
      light.shadow.camera.left = -cameraRange;
      light.shadow.camera.right = cameraRange;
      light.shadow.camera.top = cameraRange;
      light.shadow.camera.near = options.near;
      light.shadow.camera.far = options.far;
      if (options.radius) {
        light.shadow.radius = options.radius;
      }
      if (options.bias) {
        light.shadow.bias = options.bias;
      }
      light.shadow.mapSize.width = options.mapSize;
      light.shadow.mapSize.height = options.mapSize;
      light.shadow.helper = new THREE.CameraHelper(light.shadow.camera);
      if (Settings$1.get('shadows')) {
        light.castShadow = true;
      }
    }

    /** @override */
    handleSettingsChange() {
      Settings$1.get('shadows') ? this.enableShadows() : this.disableShadows();
      Settings$1.get('debug') ? this.enableDebug() : this.disableDebug();
    }

    /**
     * Enables shadows.
     */
    enableShadows() {
      if (this.shadowsEnabled) {
        return;
      }
      this.shadowsEnabled = true;
      this.lights.forEach((light) => (light.castShadow = true));
    }

    /**
     * Disables shadows.
     */
    disableShadows() {
      if (!this.shadowsEnabled) {
        return;
      }
      this.shadowsEnabled = false;
      this.lights.forEach((light) => (light.castShadow = false));
    }

    /**
     * Enables debug renderering.
     */
    enableDebug() {
      if (this.debugEnabled) {
        return;
      }
      this.debugEnabled = true;
      this.lights.forEach((light) => this.addHelpers(light));
    }

    /**
     * Disables debug rendering.
     */
    disableDebug() {
      if (!this.debugEnabled) {
        return;
      }
      this.debugEnabled = false;
      this.lights.forEach((light) => this.removeHelpers(light));
    }

    /**
     * Adds the provided light's helpers to the root scene.
     * @param {THREE.Light} light
     */
    addHelpers(light) {
      // Handle base light helper first.
      var rootScene = getRootScene;
      if (light.helper && !light.helper.parent) {
        rootScene = getRootScene(light);
        if (rootScene) {
          rootScene.add(light.helper);
        }
      }
      if (light.shadow && light.shadow.helper && !light.shadow.helper.parent) {
        if (!rootScene) {
          rootScene = getRootScene(light);
        }
        if (rootScene) {
          rootScene.add(light.shadow.helper);
        }
      }
    }

    /**
     * Removes a light's helpers from their scene.
     * @param {THREE.Light} light
     */
    removeHelpers(light) {
      if (light.helper && light.helper.parent) {
        light.helper.parent.remove(light.helper);
      }
      if (light.shadow && light.shadow.helper && light.shadow.helper.parent) {
        light.shadow.helper.parent.remove(light.shadow.helper);
      }
      light.userData.addedToScene = false;
    }
  }

  /**
   * Light options created from a light config passed in by the user.
   * @record
   */
  class LightOptions {
    /**
     * @param {Object} options
     */
    constructor(options) {
      this.angle = options.angle;
      this.color = options.color ? parseInt(options.color, 16) : 0xffffff;
      this.decay = options.decay;
      this.distance = options.distance;
      this.groundColor = options.groundColor
        ? parseInt(options.groundColor, 16)
        : 0xffffff;
      this.intensity = options.intensity || 1.0;
      this.penumbra = options.penumbra;
      this.position = new THREE.Vector3(
        options.x || 0,
        options.y || 0,
        options.z || 0
      );
      this.power = options.power;
      this.shadow = options.shadow ? new ShadowOptions(options.shadow) : null;
    }
  }

  /**
   * Shadow options attached to a light config.
   * @record
   */
  class ShadowOptions {
    /**
     * @param {Object} options
     */
    constructor(options) {
      this.frustum = options.frustum || 10;
      this.mapSize = options.mapSize || 1024;
      this.near = options.near || 1;
      this.far = options.far || 100;
      this.radius = options.radius || null;
      this.bias = options.bias || null;
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var WIDTH = 500;

  var SUFFIXES = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];

  /**
   * Wrapper class for a cube geometry, representing a skybox.
   */
  class Skybox extends THREE.Object3D {
    constructor() {
      super();
      this.cube = null;
    }

    /**
     * Loads the skybox with a given texture. Requires that the 
     * @param {string} directory
     * @param {string} filename
     * @param {string} extension
     * @async
     */
    async load(directory, filename, extension) {
      if (!directory || !filename || !extension) {
        return console.warn('Not all params present for skybox load');
      }
      // Append a trailing slash to the directory if it doesn't exist.
      if (!directory.endsWith('/')) {
        directory += '/';
      }
      // Insert a period if the extension doesn't have one.
      if (!extension.startsWith('.')) {
        extension = '.' + extension;
      }
      // Load each texture for the cube.
      var cubeMaterials =
        await this.createCubeMaterials(directory, filename, extension);
      
      var geometry = new THREE.CubeGeometry(WIDTH, WIDTH, WIDTH);
      var cube = new THREE.Mesh(geometry, cubeMaterials);
      this.cube = cube;
      this.add(cube);
    }

    /**
     * Loads each cube face material.
     * @param {string} directory
     * @param {string} filename
     * @param {string} extension
     * @returns {Array<THREE.Material>}
     * @async
     */
    async createCubeMaterials(directory, filename, extension) {
      // Load all textures first.
      var loader = extension == '.tga' ?
        new THREE.TGALoader() :
        new THREE.TextureLoader();
      var texturePromises = new Array();
      for (var i = 0; i < SUFFIXES.length; ++i) {
        var suffix = SUFFIXES[i];
        var path = "" + directory + filename + "_" + suffix + extension;
        texturePromises.push(this.loadTexture(loader, path));
      }
      var textures = await Promise.all(texturePromises);
      // Create all materials from textures.
      var cubeMaterials = new Array();
      for (var i$1 = 0; i$1 < textures.length; ++i$1) {
        var mat = new THREE.MeshBasicMaterial({
          map: textures[i$1],
          side: THREE.DoubleSide,
        });
        cubeMaterials.push(mat);
      }
      return cubeMaterials;
    }

    /**
     * Wrapper for loading a texture.
     * @param {THREE.Loader} loader
     * @param {string} path
     * @returns {THREE.Texture}
     * @async
     */
    async loadTexture(loader, path) {
      return new Promise((resolve) => {
        loader.load(path, (texture) => {
          resolve(texture);
        });
      });
    }
  }

  /**
   * Provides a way of dynamically creating light, skyboxes, ambient sounds, etc
   * that are unique to an environment. Extends THREE.Object3D to act as a root
   * that can be added to a scene.
   */
  class Environment extends Entity {
    constructor() {
      super();
      this.meshEnabled = false;
      this.clearColor = 0xffffff;
    }

    /**
     * Loads the environment from a JSON file.
     * @param {string} filePath
     * @async
     */
    async loadFromFile(filePath) {
      if (!filePath) {
        return;
      }
      // Load JSON file with environment and options.
      var environmentData = await loadJsonFromFile$1(filePath);
      this.loadLights(environmentData.lights);
      this.loadBackground(environmentData.background);
      await this.loadSkybox(environmentData.skybox);
      return this;
    }

    /**
     * Loads lights from the environment file.
     * @param {Object} lightsData
     */
    loadLights(lightsData) {
      if (!lightsData) {
        return;
      }
      if (lightsData.ambient) {
        lightsData.ambient.forEach((data) =>
          this.add(Light.get().createAmbientLight(data))
        );
      }
      if (lightsData.directional) {
        lightsData.directional.forEach((data) =>
          this.add(Light.get().createDirectionalLight(data))
        );
      }
    }

    /**
     * Sets the renderer background color.
     * @param {string} background
     */
    loadBackground(background) {
      if (!background) {
        return;
      }
      this.clearColor = parseInt(background, 16);
    }

    /**
     * Loads the skybox for the environment.
     * @param {Object} skyboxData
     * @async
     */
    async loadSkybox(skyboxData) {
      if (!skyboxData) {
        return;
      }
      // Create skybox.
      var skybox = new Skybox();
      var directory = skyboxData.directory;
      var file = skyboxData.file;
      var extension = skyboxData.extension;
      await skybox.load(directory, file, extension);
      this.add(skybox);
    }

    /**
     * Returns the clear color a renderer should set based on the environment.
     * @return {number}
     */
    getClearColor() {
      return this.clearColor;
    }
  }

  /**
   * Represents a game that will be run on the engine. The purpose of a game
   * mode is to better control the state of a game as well as assist conditions to
   * start and end a game. Developers should extend GameMode to create their own
   * games.
   */
  class GameMode extends EventTarget {
    /**
     * Loads a game mode for the first time. This should include loading necessary
     * models, environment, stages, etc.
     * @async
     */
    async load() {}

    /**
     * Starts the game mode. At this point, all necessary components of the game
     * mode should be readily available.
     * @async
     */
    async start() {}

    /**
     * Ends the game mode. The end function should perform any clean up necessary
     * for the objects created during the game, **not** the items loaded in the
     * load method. This is to prevent any issues with restarting the game mode.
     * @async
     */
    async end() {
      this.dispatchEvent('end');
    }

    /**
     * Restarts the game mode by calling the `end` function, then `start`.
     * @async
     */
    async restart() {
      await this.end();
      await this.start();
    }

    /**
     * Macro fro adding an event listener to the end event.
     * @param {function} handler
     * @return {string} The uuid of the handler.
     */
    onEnd(handler) {
      return this.addEventListener('end', handler);
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  /**
   * Custom event fired when a soft error occurs.
   */
  class ErrorEvent extends EraEvent {
    constructor(message) {
      var label = 'error';
      var data = {
        message: message
      };
      super(label, data);
    }
    
    /** @override */
    static listen(callback) {
      EraEvent.listen('error', callback);
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  /**
   * Core functionality for network procedures in the engine. Can be extended
   * in the case of different servers.
   */
  class Network {
    constructor(protocol, host, port) {
      this.protocol = protocol;
      this.host = host;
      this.port = port;
      this.origin = this.createPath(protocol, host, port);
      this.pendingResponses = new Set();
      this.connectionResolve = null;
      this.socket = null;
      this.token = null;
      this.name = null;
    }

    /**
     * Give the server a name.
     * @param {string} name
     * @returns {Network}
     */
    withName(name) {
      this.name = name;
      return this;
    }

    /**
     * Disconnects the network instance.
     */
    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
      }
    }

    /**
     * Creates a path given the protocol, host, and port.
     */
    createPath(protocol, host, port) {
      return (protocol + "://" + host + ":" + port);
    }

    setAuthToken(token) {
      this.token = token;
    }

    /**
     * Creates and sends an HTTP POST request, awaiting for the response.
     * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
     * @param {Object} data
     * @returns {Object}
     * @async
     */
    async createPostRequest(path, data) {
      var url = this.origin + path;
      var req = this.buildRequest('POST', url);
      var response = await this.sendRequest(req, data);
      return response;
    }

    /** 
     * Creates and sends an HTTP GET request, awaiting for the response.
     * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
     * @returns {Object}
     * @async
     */
    async createGetRequest(path) {
      var url = this.origin + path;
      var req = this.buildRequest('GET', url);
      var response = await this.sendRequest(req);
      return response;
    }

    /**
     * Creates and sends an HTTP DELETE request, awaiting for the response.
     * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
     * @returns {Object}
     * @async
     */
    async createDeleteRequest(path, data) {
      var url = this.origin + path;
      var req = this.buildRequest('DELETE', url);
      var response = await this.sendRequest(req, data);
      return response;
    }

    /**
     * Creates an error for a failed or invalid HTTP request.
     */
    createError(req) {
      var message;
      try {
        message = JSON.parse(req.responseText).message;
      } catch (e) {
        message = req.responseText;
      }
      return new Error(message);
    }

    /**
     * Begins to establish a WebSockets connection to the server. The query
     * parameter is a map of query params used in the connection string.
     * Returns a promise with the resolver set in a field. Once the connection
     * is successful, it resolves.
     */
    async createSocketConnection(query, required) {
      if ( required === void 0 ) required = false;

      return new Promise((resolve) => {
        if (this.socket) {
          return resolve(this.socket);
        }
        this.connectionResolver = resolve;
        var params = {
          reconnection: false
        };
        if (!query) {
          query = new Map();
        }
        if (this.token) {
          query.set('token', this.token);
        }
        var queryString = '';
        for (var pair of query) {
          var pairString = pair[0] + '=' + pair[1];
          if (queryString) {
            pairString = '&' + pairString;
          }
          queryString += pairString;
        }
        if (queryString) {
          params.query = queryString;
        }
        this.socket = io.connect(this.origin, params);
        this.socket.on('connect', () => this.handleConnect(required));
      });
    }

    /**
     * Handles a successful connection to the WebSockets server.
     */
    handleConnect() {
      this.connectionResolver(this.socket);
      // TODO: Create base socket endpoints for easier registration of handlers.
      this.socket.on('error', (err) => {
        var message = 'Socket error:' + JSON.stringify(err);
        console.error(message);
        new ErrorEvent(message).fire();
      });
    }

    /**
     * Sends a WS message and waits for a specific reply indicating that the
     * message was received. The key is the socket endpoint, so only one call
     * to a certain endpoint can be awaited at once.
     * @param {string} endpoint The emitted endpoint name.
     * @param {*} sentData The data to emit, if any.
     * @param {string=} responseEndpoint Optional response endpoint name.
     */
    async emitAndAwaitResponse(endpoint, sentData, responseEndpoint) {
      if (!this.socket) {
        throw new Error('No socket installed.');
      }
      // Default the response endpoint to the emitted endpoint.
      if (!responseEndpoint) {
        responseEndpoint = endpoint;
      }
      // Don't install a listener for something twice.
      if (this.pendingResponses.has(endpoint) ||
          this.pendingResponses.has(responseEndpoint)) {
        throw new Error('Listener already installed.');
      }
      this.pendingResponses.add(endpoint);
      this.pendingResponses.add(responseEndpoint);
      this.socket.removeAllListeners(endpoint);
      this.socket.removeAllListeners(responseEndpoint);

      return new Promise((resolve, reject) => {
        this.socket.once(responseEndpoint, (data) => {
          resolve(data);
        });
        this.socket.emit(endpoint, sentData);
      });
    }

    /**
     * Waits for a message to be received, then resolves.
     * @param {string} endpoint
     */
    async waitForMessage(endpoint) {
      if (!this.socket) {
        throw new Error('No socket installed.');
      }
      if (this.pendingResponses.has(endpoint)) {
        throw new Error('Listener already installed.');
      }
      this.pendingResponses.add(endpoint);
      this.socket.removeAllListeners(endpoint);
      return new Promise((resolve) => {
        this.socket.once(endpoint, (data) => {
          return resolve(data);
        });
      });
    }

    /**
     * Builds a request object given a method and url.
     * @param {string} method
     * @param {string} url
     */
    buildRequest(method, url) {
      var req = new XMLHttpRequest();
      req.open(method, url, true);
      req.setRequestHeader('Content-type', 'application/json');
      if(this.token) {
        req.setRequestHeader('Authorization', this.token);
      }
      return req;
    }

    /**
     * Sends the request and awaits the response.
     * @param {XMLHttpRequest} req
     * @param {Object=} data
     * @async
     */
    sendRequest(req, data) {
      if ( data === void 0 ) data = null;

      return new Promise((resolve, reject) => {
        // Install load listener.
        req.addEventListener('load', () => {
          if (req.status == 200 || req.status == 304) {
            var responseStr = req.responseText;
            try {
              var response = JSON.parse(responseStr);
              resolve(response);
            } catch (e) {
              resolve(responseStr);
            }
          } else {
            reject(this.createError(req));
          }
        });
        // Install error listener.
        req.addEventListener('error', () => reject(this.createError(req)));
        // Send request.
        if (data) {
          req.send(JSON.stringify(data));
        } else {
          req.send();
        }
      });
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

   /**
    * A map of all network instances, keyed by their server name. This is useful
    * when a client has to track multiple servers with which it communicates.
    */
  class NetworkRegistry extends Map {
    /**
     * Creates a new network instance for a server.
     * @param {string} name
     * @param {string} protocol
     * @param {string} host
     * @param {number} port
     * @returns {Network}
     */
    registerNewServer(name, protocol, host, port) {
      if (this.has(name)) {
        console.warn(("Server with name " + name + " already registered."));
        return this.get(name);
      }
      var server = new Network(protocol, host, port).withName(name);
      this.set(name, server);
      return server;
    }
  }

  var network_registry = new NetworkRegistry();

  /**
   * @author mrdoob / http://mrdoob.com/
   * @author jetienne / http://jetienne.com/
   * @author rogerscg / https://github.com/rogerscg
   */

  var STATS_CONTAINER_CSS = "\n  bottom: 0;\n  position: absolute;\n  left: 0;\n";

  var WEBGL_CONTAINER_CSS = "\n  background-color: #002;\n  color: #0ff;\n  cursor: pointer;\n  font-family: Helvetica,Arial,sans-serif;\n  font-size: 9px;\n  font-weight: bold;\n  line-height: 15px;\n  opacity: 0.9;\n  padding: 0 0 3px 3px;\n  text-align: left;\n  width: 80px;\n";

  var FPS_CONTAINER_CSS = "\n  cursor: pointer;\n  opacity: 0.9;\n";

  /**
   * A plugin wrapper for WebGL renderer stats and FPS in Three.js.
   */
  class RendererStats extends Plugin {
    /**
     * @param {THREE.WebGLRenderer} renderer
     */
    constructor(renderer) {
      super();
      this.renderer = renderer;
      this.enabled = Settings$1.get('debug');
      this.webGLStats = new WebGLStats(renderer);
      this.fpsStats = new FpsStats();
      this.dom = this.createDom();
      this.dom.appendChild(this.webGLStats.dom);
      this.dom.appendChild(this.fpsStats.dom);
      if (this.enabled) {
        renderer.domElement.parentElement.appendChild(this.dom);
      }
    }

    /**
     * Creates the container DOM.
     */
    createDom() {
      var container = document.createElement('div');
      container.style.cssText = STATS_CONTAINER_CSS;
      return container;
    }

    /**
     * Enables renderer stats.
     */
    enable() {
      this.enabled = true;
      this.renderer.domElement.parentElement.appendChild(this.dom);
    }

    /**
     * Disables renderer stats.
     */
    disable() {
      this.enabled = false;
      if (this.dom.parentElement) {
        this.dom.parentElement.removeChild(this.dom);
      }
    }

    /** @override */
    update() {
      if (!this.enabled) {
        return;
      }
      this.fpsStats.update();
      this.webGLStats.update();
    }

    /** @override */
    reset() {
      this.disable();
    }

    /** @override */
    handleSettingsChange() {
      var currEnabled = Settings$1.get('debug');
      if (currEnabled && !this.enabled) {
        return this.enable();
      }
      if (!currEnabled && this.enabled) {
        return this.disable();
      }
    }
  }

  /**
   * Interface for a stats component.
   */
  class Stats {
    constructor() {
      this.dom = this.createDom();
    }

    /**
     * Updates the stats DOM.
     */
    update() {
      return console.warn('Stats update function not defined');
    }

    /**
     * Enables the stats DOM.
     */
    enable() {
      return console.warn('Stats enable function not defined');
    }

    /**
     * Disables the stats DOM.
     */
    disable() {
      return console.warn('Stats disable function not defined');
    }
  }

  class WebGLStats extends Stats {
    constructor(renderer) {
      super();
      this.renderer = renderer;
    }

    /** @override */
    createDom() {
      var container = document.createElement('div');
      container.setAttribute('class', 'render-stats');
      container.style.cssText = WEBGL_CONTAINER_CSS;

      var msText = document.createElement('div');
      msText.innerHTML = 'WebGLRenderer';
      container.appendChild(msText);

      var msTexts = [];
      var nLines = 9;
      for (var i = 0; i < nLines; i++) {
        msTexts[i] = document.createElement('div');
        msTexts[i].style.backgroundColor = '#001632';
        container.appendChild(msTexts[i]);
      }
      this.msTexts = msTexts;
      return container;
    }

    /** @override */
    update() {
      if (!this.msTexts) {
        return;
      }
      var msTexts = this.msTexts;
      var i = 0;
      msTexts[i++].textContent = '=== Memory ===';
      msTexts[i++].textContent =
        'Programs: ' + this.renderer.info.programs.length;
      msTexts[i++].textContent =
        'Geometries: ' + this.renderer.info.memory.geometries;
      msTexts[i++].textContent =
        'Textures: ' + this.renderer.info.memory.textures;

      msTexts[i++].textContent = '=== Render ===';
      msTexts[i++].textContent = 'Calls: ' + this.renderer.info.render.calls;
      msTexts[i++].textContent =
        'Triangles: ' + this.renderer.info.render.triangles;
      msTexts[i++].textContent = 'Lines: ' + this.renderer.info.render.lines;
      msTexts[i++].textContent = 'Points: ' + this.renderer.info.render.points;
    }
  }

  class FpsStats extends Stats {
    constructor() {
      super();
      this.mode = 0;
      this.fps = 0;
      this.beginTime = (performance || Date).now();
      this.prevTime = this.beginTime;
      this.frames = 0;
    }

    /** @override */
    createDom() {
      // Create root.
      var container = document.createElement('div');
      this.dom = container;
      container.classList.add('render-stats');
      container.style.cssText = FPS_CONTAINER_CSS;

      // Switch panels on click.
      container.addEventListener(
        'click',
        (event) => {
          event.preventDefault();
          this.showPanel(++this.mode % container.children.length);
        },
        false
      );

      this.fpsPanel = this.addPanel(new Panel('FPS', '#0ff', '#002', true));
      this.msPanel = this.addPanel(new Panel('MS', '#0f0', '#020', false));
      this.timerPanel = this.addPanel(
        new Panel('Render', '#ff3800', '#210', false)
      );
      if (self.performance && self.performance.memory) {
        this.memPanel = this.addPanel(new Panel('MB', '#f08', '#201', true));
      }
      this.showPanel(0);
      return container;
    }

    addPanel(panel) {
      this.dom.appendChild(panel.dom);
      return panel;
    }

    showPanel(id) {
      for (var i = 0; i < this.dom.children.length; i++) {
        this.dom.children[i].style.display = i === id ? 'block' : 'none';
      }
      this.mode = id;
    }

    begin() {
      this.beginTime = (performance || Date).now();
    }

    getFPS() {
      return this.fps;
    }

    end() {
      this.frames++;
      var time = (performance || Date).now();
      this.msPanel.update(time - this.beginTime, 30);
      var engStats = EngineTimer$1.export();
      if (engStats) {
        this.timerPanel.update(engStats.avg, 30);
      }
      if (time >= this.prevTime + 1000) {
        this.fps = (this.frames * 1000) / (time - this.prevTime);
        this.fpsPanel.update(this.fps, 100);
        this.prevTime = time;
        this.frames = 0;
        if (this.memPanel) {
          var memory = performance.memory;
          this.memPanel.update(
            memory.usedJSHeapSize / 1048576,
            memory.jsHeapSizeLimit / 1048576
          );
        }
      }
      return time;
    }

    update() {
      this.beginTime = this.end();
    }
  }

  // Panel constants.
  var PR = Math.round(window.devicePixelRatio || 1);
  var WIDTH$1 = 83 * PR;
  var HEIGHT = 48 * PR;
  var TEXT_X = 3 * PR;
  var TEXT_Y = 2 * PR;
  var GRAPH_X = 3 * PR;
  var GRAPH_Y = 15 * PR;
  var GRAPH_WIDTH = 74 * PR;
  var GRAPH_HEIGHT = 30 * PR;

  /**
   * An individual panel on the FPS stats component.
   */
  class Panel {
    constructor(name, fg, bg, shouldRound) {
      this.name = name;
      this.fg = fg;
      this.bg = bg;
      this.min = Infinity;
      this.max = 0;
      this.shouldRound = shouldRound;
      this.createDom();
    }

    createDom() {
      var canvas = document.createElement('canvas');
      canvas.width = WIDTH$1;
      canvas.height = HEIGHT;
      canvas.style.cssText = 'width:83px;height:48px';

      var context = canvas.getContext('2d');
      context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif';
      context.textBaseline = 'top';

      context.fillStyle = this.bg;
      context.fillRect(0, 0, WIDTH$1, HEIGHT);

      context.fillStyle = this.fg;
      context.fillText(name, TEXT_X, TEXT_Y);
      context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

      context.fillStyle = this.bg;
      context.globalAlpha = 0.9;
      context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
      this.dom = canvas;
      this.canvas = canvas;
      this.context = context;
    }

    update(value, maxValue) {
      var canvas = this.canvas;
      var context = this.context;
      this.min = Math.min(this.min, value);
      this.max = Math.max(this.max, value);
      var roundedValue = this.shouldRound
        ? Math.round(value)
        : value.toFixed(2);

      context.fillStyle = this.bg;
      context.globalAlpha = 1;
      context.fillRect(0, 0, WIDTH$1, GRAPH_Y);
      context.fillStyle = this.fg;
      context.fillText(
        (roundedValue + " " + (this.name) + " (" + (Math.round(this.min)) + "-" + (Math.round(
          this.max
        )) + ")"),
        TEXT_X,
        TEXT_Y
      );

      context.drawImage(
        canvas,
        GRAPH_X + PR,
        GRAPH_Y,
        GRAPH_WIDTH - PR,
        GRAPH_HEIGHT,
        GRAPH_X,
        GRAPH_Y,
        GRAPH_WIDTH - PR,
        GRAPH_HEIGHT
      );

      context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);

      context.fillStyle = this.bg;
      context.globalAlpha = 0.9;
      context.fillRect(
        GRAPH_X + GRAPH_WIDTH - PR,
        GRAPH_Y,
        PR,
        Math.round((1 - value / maxValue) * GRAPH_HEIGHT)
      );
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var DEFAULT_NAME = 'main';

  /**
   * Represents a world used to both manage rendering and physics simulations.
   */
  class World extends Plugin {
    constructor() {
      super();
      this.scene = new THREE.Scene();
      // Set an `isRootScene` bit for use by other parts of ERA.
      this.scene.isRootScene = true;
      this.scene.parentWorld = this;
      this.physics = null;
      this.renderers = new Map();
      this.cameras = new Map();
      this.camerasToRenderers = new Map();
      this.entities = new Set();
      this.entityCameras = new Map();
      this.entitiesToRenderers = new Map();
      window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    /** @override */
    update() {
      // Update all entities, if physics is not enabled. This is due to physics
      // handling updates on its own.
      // TODO: Separate physics updates from entity updates.
      if (!this.physics) {
        this.entities.forEach((entity) => entity.update());
      }

      // Update all renderers.
      this.camerasToRenderers.forEach((renderer, camera) =>
        renderer.render(this.scene, camera)
      );
    }

    /** @override */
    reset() {
      this.entities.forEach((entity) => entity.destroy());
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    }

    getScene() {
      return this.scene;
    }

    getPhysics() {
      return this.physics;
    }

    /**
     * Retrieves the camera with the given name.
     * @param {string} name
     */
    getCamera(name) {
      if ( name === void 0 ) name = DEFAULT_NAME;

      return this.cameras.get(name);
    }

    /**
     * Retrieves a renderer with the given name.
     * @param {string} name
     */
    getRenderer(name) {
      if ( name === void 0 ) name = DEFAULT_NAME;

      return this.renderers.get(name);
    }

    /**
     * Iterates over all cameras and resizes them.
     */
    onWindowResize() {
      // Set timeout in order to allow the renderer dom element to resize.
      setTimeout(() => {
        this.cameras.forEach((camera) => {
          var width = window.innerWidth;
          var height = window.innerHeight;
          var renderer = this.camerasToRenderers.get(camera);
          if (renderer) {
            var rect = renderer.domElement.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
          }
          camera.userData.resize(width, height);
        });
      });
    }

    /**
     * Adds a physics implementation instance to the world.
     * @param {Physics} physics
     * @return {World}
     */
    withPhysics(physics) {
      this.physics = physics;
      physics.setEraWorld(this);
      return this;
    }

    /**
     * Adds a renderer that is used to display the world as well as the name of
     * the renderer. This name is used for finding the element in the DOM to which
     * the renderer should be attached via the data-renderer attribute.
     * @param {THREE.WebGLRenderer} renderer
     * @param {string} name
     * @return {World}
     */
    addRenderer(renderer, name) {
      if ( name === void 0 ) name = DEFAULT_NAME;

      if (!renderer || !name) {
        return console.error('Need both renderer and name for world.');
      }
      var container = document.querySelector(("[data-renderer='" + name + "']"));
      if (!container) {
        return console.error(("Element with data-renderer " + name + " not found."));
      }
      var rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      container.appendChild(renderer.domElement);
      window.addEventListener(
        'resize',
        () => {
          var rect = container.getBoundingClientRect();
          renderer.setSize(rect.width, rect.height);
        },
        false
      );
      renderer.name = name;
      new RendererStats(renderer);
      this.renderers.set(name, renderer);
      return this;
    }

    /**
     * Adds a camera for a specific renderer. If a renderer isn't specified, add
     * for all renderers.
     * @param {THREE.Camera} camera
     * @param {THREE.WebGLRenderer} renderer
     * @return {World}
     */
    addCameraForRenderer(camera, renderer) {
      if (!camera) {
        return this;
      }
      if (!renderer) {
        this.renderers.forEach((renderer) =>
          this.addCameraForRenderer(camera, renderer)
        );
        return this;
      }
      if (!renderer.name || !this.renderers.has(renderer.name)) {
        console.error('Passed renderer not created in world');
        return this;
      }
      this.cameras.set(renderer.name, camera);
      this.camerasToRenderers.set(camera, renderer);
      // Fire a resize event to adjust camera to renderer.
      this.onWindowResize();
      return this;
    }

    /**
     * Sets the environment of the world.
     * @param {Environment} environment
     * @return {World}
     */
    setEnvironment(environment) {
      this.add(environment);
      this.renderers.forEach((renderer) =>
        renderer.setClearColor(environment.getClearColor())
      );
      return this;
    }

    /**
     * Adds an entity or other ERA object to the world.
     * @param {Entity} entity
     * @return {World}
     */
    add(entity) {
      if (this.entities.has(entity)) {
        console.warn('Entity already added to the world');
        return this;
      }
      if (entity.physicsEnabled) {
        entity.registerPhysicsWorld(this.physics);
      }
      entity.setWorld(this);
      entity.build();
      this.entities.add(entity);
      this.scene.add(entity);
      if (entity.physicsEnabled) {
        this.physics.registerEntity(entity);
      }
      return this;
    }

    /**
     * Removes an entity from the ERA world.
     * @param {Entity} entity
     * @return {World}
     */
    remove(entity) {
      if (this.physics && entity.physicsEnabled) {
        this.physics.unregisterEntity(entity);
      }
      this.scene.remove(entity);
      this.entities.delete(entity);
      if (entity.getWorld() == this) {
        entity.setWorld(null);
      }
      return this;
    }

    /**
     * Request to attach the camera with the given name to the provided entity.
     * @param {Entity} entity
     * @param {string} cameraName
     * @return {World}
     */
    attachCameraToEntity(entity, cameraName) {
      if ( cameraName === void 0 ) cameraName = DEFAULT_NAME;

      if (!entity || !this.cameras.has(cameraName)) {
        console.warn(("Camera with name " + cameraName + " does not exist"));
        return this;
      }
      var camera = this.cameras.get(cameraName);
      var prevEntity = this.entityCameras.get(camera);
      if (prevEntity) {
        prevEntity.detachCamera(camera);
      }
      entity.attachCamera(camera);
      this.entityCameras.set(camera, entity);
      return this;
    }

    /**
     * Associates an entity with a renderer for controls purposes, i.e. the
     * direction a camera is facing in a split-screen tile.
     * @param {Entity} entity
     * @param {string} name
     * @return {World}
     */
    associateEntityWithRenderer(entity, name) {
      if ( name === void 0 ) name = DEFAULT_NAME;

      if (!entity || !name) {
        console.error('Need to provide entity and name to associate');
        return this;
      }
      if (!this.entities.has(entity) || !this.renderers.has(name)) {
        console.error('Both entity and renderer need to be registered to world');
        return this;
      }
      this.entitiesToRenderers.set(entity, name);
      return this;
    }

    /**
     * Finds the associated camera, aka the camera used by the main "controlling"
     * renderer, for a given entity. Any value returned will be a result of
     * associating a renderer and camera with a given entity in the world.
     * @param {Entity} entity
     * @return {THREE.Camera}
     */
    getAssociatedCamera(entity) {
      var name = this.entitiesToRenderers.get(entity);
      if (!name) {
        name = DEFAULT_NAME;
      }
      return this.cameras.get(name);
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var MAX_SUBSTEPS = 10;

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
      var config = new Ammo.btDefaultCollisionConfiguration();
      var dispatcher = new Ammo.btCollisionDispatcher(config);
      var broadphase = new Ammo.btDbvtBroadphase();
      var solver = new Ammo.btSequentialImpulseConstraintSolver();
      var world =
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

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  /**
   * Class for creating contact listeners.
   */
  class EraContactListener {
    constructor() {
      // A registry of shape and body contact callbacks.
      this.contactCallbacks = new Map();
    }

    /** 
     * Registers a new callback.
     */
    registerHandler(fixture, handler) {
      this.contactCallbacks.set(fixture, handler);
    }

    /** @override */
    BeginContact(contact) {
      var event = {
        type: 'begin',
        contact: contact
      };
      this.determineCallbacks(contact, event);
      
    }

    /** @override */
    EndContact(contact) {
      var event = {
        type: 'end',
        contact: contact
      };
      this.determineCallbacks(contact, event);
    }

    /** @override */
    PreSolve(contact, oldManifold) {}

    /** @override */
    PostSolve(contact, contactImpulse) {
      var event = {
        type: 'postsolve',
        contact: contact,
        contactImpulse: contactImpulse
      };
      this.determineCallbacks(contact, event); 
    }

    /**
     * Determines if any callbacks should be made.
     */
    determineCallbacks(contact, event) {
      var callbackA = this.contactCallbacks.get(contact.GetFixtureA());
      if (callbackA) {
        callbackA(event);
      }
      var callbackB = this.contactCallbacks.get(contact.GetFixtureB());
      if (callbackB) {
        callbackB(event);
      }
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var VELOCITY_ITERATIONS = 8;
  var POSITION_ITERATIONS = 3;

  /**
   * API implementation for Box2D.
   */
  class Box2DPhysics extends Physics {
    /** @override */
    createWorld() {
      var world = new box2d.b2World(new box2d.b2Vec2(0.0, 0.0));
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

  /**
   * Interface for creating a debug renderer for a specific physics engine.
   * @interface
   */
  class DebugRenderer {
    /**
     * @param {THREE.Scene} scene
     * @param {*} world
     */
    constructor(scene, world) {
      this.scene = scene;
      this.world = world;
    }

    /**
     * Updates the debug renderer.
     */
    update() {}

    /**
     * Destroys the debug renderer by removing all bodies from the scene.
     */
    destroy() {
      console.warn('Destroy not implemented for debug renderer');
    }
  }

  /**
   * @author schteppe / https://github.com/schteppe
   * @author rogerscg / https://github.com/rogerscg
   */

  /**
   * Adds Three.js primitives into the scene where all the Cannon bodies and
   * shapes are.
   */
  class CannonDebugRenderer extends DebugRenderer {
    /**
     * @param {THREE.Scene} scene
     * @param {CANNON.World} world
     */
    constructor(scene, world) {
      super(scene, world);
      this._meshes = [];

      this._material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
      });
      this._sphereGeometry = new THREE.SphereGeometry(1);
      this._boxGeometry = new THREE.BoxGeometry(1, 1, 1);
      this._planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
      this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 10, 10);

      this.tmpVec0 = new CANNON.Vec3();
      this.tmpVec1 = new CANNON.Vec3();
      this.tmpVec2 = new CANNON.Vec3();
      this.tmpQuat0 = new CANNON.Vec3();
    }

    /** @override */
    update() {
      var bodies = this.world.bodies;
      var meshes = this._meshes;
      var shapeWorldPosition = this.tmpVec0;
      var shapeWorldQuaternion = this.tmpQuat0;

      var meshIndex = 0;

      bodies.forEach((body) => {
        body.shapes.forEach((shape, shapeIndex) => {
          this._updateMesh(meshIndex, body, shape);
          var mesh = meshes[meshIndex];
          if (mesh) {
            // Get world position
            body.quaternion.vmult(
              body.shapeOffsets[shapeIndex],
              shapeWorldPosition
            );
            body.position.vadd(shapeWorldPosition, shapeWorldPosition);

            // Get world quaternion
            body.quaternion.mult(
              body.shapeOrientations[shapeIndex],
              shapeWorldQuaternion
            );

            // Copy to meshes
            mesh.position.copy(shapeWorldPosition);
            mesh.quaternion.copy(shapeWorldQuaternion);
          }
          meshIndex++;
        });
      });

      for (var i = meshIndex; i < meshes.length; i++) {
        var mesh = meshes[i];
        if (mesh) {
          this.scene.remove(mesh);
        }
      }

      meshes.length = meshIndex;
    }

    /** @override */
    destroy() {
      this._meshes.forEach((mesh) => {
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
      });
    }

    _updateMesh(index, body, shape) {
      var mesh = this._meshes[index];
      if (!this._typeMatch(mesh, shape)) {
        if (mesh) {
          this.scene.remove(mesh);
        }
        mesh = this._meshes[index] = this._createMesh(shape);
      }
      this._scaleMesh(mesh, shape);
    }

    _typeMatch(mesh, shape) {
      if (!mesh) {
        return false;
      }
      var geo = mesh.geometry;
      return (
        (geo instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
        (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
        (geo instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
        (geo.id === shape.geometryId &&
          shape instanceof CANNON.ConvexPolyhedron) ||
        (geo.id === shape.geometryId && shape instanceof CANNON.Trimesh) ||
        (geo.id === shape.geometryId && shape instanceof CANNON.Heightfield)
      );
    }

    _createMesh(shape) {
      var mesh;
      var material = this._material;

      switch (shape.type) {
        case CANNON.Shape.types.SPHERE:
          mesh = new THREE.Mesh(this._sphereGeometry, material);
          break;

        case CANNON.Shape.types.BOX:
          mesh = new THREE.Mesh(this._boxGeometry, material);
          break;

        case CANNON.Shape.types.PLANE:
          mesh = new THREE.Mesh(this._planeGeometry, material);
          break;

        case CANNON.Shape.types.CONVEXPOLYHEDRON:
          // Create mesh
          var geo = new THREE.Geometry();

          // Add vertices
          for (var i = 0; i < shape.vertices.length; i++) {
            var v = shape.vertices[i];
            geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
          }

          for (var i = 0; i < shape.faces.length; i++) {
            var face = shape.faces[i];

            // add triangles
            var a = face[0];
            for (var j = 1; j < face.length - 1; j++) {
              var b = face[j];
              var c = face[j + 1];
              geo.faces.push(new THREE.Face3(a, b, c));
            }
          }
          geo.computeBoundingSphere();
          geo.computeFaceNormals();

          mesh = new THREE.Mesh(geo, material);
          shape.geometryId = geo.id;
          break;

        case CANNON.Shape.types.TRIMESH:
          var geometry = new THREE.Geometry();
          var v0 = this.tmpVec0;
          var v1 = this.tmpVec1;
          var v2 = this.tmpVec2;
          for (var i = 0; i < shape.indices.length / 3; i++) {
            shape.getTriangleVertices(i, v0, v1, v2);
            geometry.vertices.push(
              new THREE.Vector3(v0.x, v0.y, v0.z),
              new THREE.Vector3(v1.x, v1.y, v1.z),
              new THREE.Vector3(v2.x, v2.y, v2.z)
            );
            var j = geometry.vertices.length - 3;
            geometry.faces.push(new THREE.Face3(j, j + 1, j + 2));
          }
          geometry.computeBoundingSphere();
          geometry.computeFaceNormals();
          mesh = new THREE.Mesh(geometry, material);
          shape.geometryId = geometry.id;
          break;

        case CANNON.Shape.types.HEIGHTFIELD:
          var geometry = new THREE.Geometry();

          var v0 = this.tmpVec0;
          var v1 = this.tmpVec1;
          var v2 = this.tmpVec2;
          for (var xi = 0; xi < shape.data.length - 1; xi++) {
            for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
              for (var k = 0; k < 2; k++) {
                shape.getConvexTrianglePillar(xi, yi, k === 0);
                v0.copy(shape.pillarConvex.vertices[0]);
                v1.copy(shape.pillarConvex.vertices[1]);
                v2.copy(shape.pillarConvex.vertices[2]);
                v0.vadd(shape.pillarOffset, v0);
                v1.vadd(shape.pillarOffset, v1);
                v2.vadd(shape.pillarOffset, v2);
                geometry.vertices.push(
                  new THREE.Vector3(v0.x, v0.y, v0.z),
                  new THREE.Vector3(v1.x, v1.y, v1.z),
                  new THREE.Vector3(v2.x, v2.y, v2.z)
                );
                var i = geometry.vertices.length - 3;
                geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
              }
            }
          }
          geometry.computeBoundingSphere();
          geometry.computeFaceNormals();
          mesh = new THREE.Mesh(geometry, material);
          shape.geometryId = geometry.id;
          break;
      }

      if (mesh) {
        this.scene.add(mesh);
      }

      return mesh;
    }

    _scaleMesh(mesh, shape) {
      switch (shape.type) {
        case CANNON.Shape.types.SPHERE:
          var radius = shape.radius;
          mesh.scale.set(radius, radius, radius);
          break;

        case CANNON.Shape.types.BOX:
          mesh.scale.copy(shape.halfExtents);
          mesh.scale.multiplyScalar(2);
          break;

        case CANNON.Shape.types.CONVEXPOLYHEDRON:
          mesh.scale.set(1, 1, 1);
          break;

        case CANNON.Shape.types.TRIMESH:
          mesh.scale.copy(shape.scale);
          break;

        case CANNON.Shape.types.HEIGHTFIELD:
          mesh.scale.set(1, 1, 1);
          break;
      }
    }
  }

  /**
   * @author rogerscg / https://github.com/rogerscg
   */

  var MAX_DELTA = 1;
  var MAX_SUBSTEPS$1 = 10;

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
      var world = new CANNON.World();
      world.gravity.set(0, -9.82, 0);
      return world;
    }

    /** @override */
    step(delta) {
      delta /= 1000;
      delta = Math.min(MAX_DELTA, delta);
      this.world.step(1 / 60, delta, MAX_SUBSTEPS$1);
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
      var position = entity.physicsBody.position;
      return {
        x: position.x,
        y: position.y,
        z: position.z
      };
    }

    /** @override */
    getRotation(entity) {
      var rotation = entity.physicsBody.quaternion;
      return {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w
      };
    }

    /** @override */
    enableDebugRenderer() {
      var scene = this.getEraWorld() ? this.getEraWorld().getScene() : null;
      var world = this.getWorld();
      if (!scene || !world) {
        return console.warn('Debug renderer missing scene or world.');
      }
      this.debugRenderer = new CannonDebugRenderer(scene, world);
      return this.debugRenderer;
    }

    /** @override */
    autogeneratePhysicsBody(mesh) {
      // Root body.
      var body = new CANNON.Body({ mass: 0 });
      mesh.traverse((child) => {
        var physicsType = child.userData.physics;
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
      var boundingBox = mesh.geometry.boundingBox;
      var size = new THREE.Vector3();
      boundingBox.getSize(size);
      size.divideScalar(2);
      size = size.multiplyVectors(size, mesh.scale);
      var shape = new CANNON.Box(new CANNON.Vec3().copy(size));
      var position = new CANNON.Vec3().copy(mesh.position);
      var quaternion = new CANNON.Quaternion().copy(mesh.quaternion);
      body.addShape(shape, position, quaternion);
    }

    /**
     * Creates a new physical material for the given name and options. If the
     * physical material already exists, return the existing one.
     */
    createPhysicalMaterial(name, options) {
      if (!this.physicalMaterials.has(name)) {
        var material = new CANNON.Material(options);
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
      var key = this.createContactKey(name1, name2);
      if (!this.contactMaterials.has(key)) {
        var mat1 = this.createPhysicalMaterial(name1);
        var mat2 = this.createPhysicalMaterial(name2);
        var contactMat = new CANNON.ContactMaterial(mat1, mat2, options);
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
        return (name1 + "," + name2);
      }
      return (name2 + "," + name1);
    }
  }

  exports.Action = Action;
  exports.AmmoPhysics = AmmoPhysics;
  exports.Animation = Animation;
  exports.Audio = Audio;
  exports.Bindings = Bindings;
  exports.Box2DPhysics = Box2DPhysics;
  exports.Camera = Camera;
  exports.CannonPhysics = CannonPhysics;
  exports.Character = Character;
  exports.Controls = Controls;
  exports.Engine = Engine;
  exports.EngineResetEvent = EngineResetEvent;
  exports.Entity = Entity;
  exports.Environment = Environment;
  exports.EraEvent = EraEvent;
  exports.EventTarget = EventTarget;
  exports.Events = Events;
  exports.GameMode = GameMode;
  exports.Light = Light;
  exports.Models = Models;
  exports.Network = Network;
  exports.NetworkRegistry = network_registry;
  exports.Object3DEventTarget = Object3DEventTarget;
  exports.Physics = Physics;
  exports.Plugin = Plugin;
  exports.RendererStats = RendererStats;
  exports.Settings = Settings$1;
  exports.SettingsEvent = SettingsEvent;
  exports.SettingsPanel = SettingsPanel$1;
  exports.Skybox = Skybox;
  exports.World = World;
  exports.createUUID = createUUID;
  exports.disableShadows = disableShadows;
  exports.dispose = dispose;
  exports.extractMeshes = extractMeshes;
  exports.extractMeshesByName = extractMeshesByName;
  exports.getHexColorRatio = getHexColorRatio;
  exports.getRootScene = getRootScene;
  exports.getRootWorld = getRootWorld;
  exports.lerp = lerp;
  exports.loadJsonFromFile = loadJsonFromFile$1;
  exports.shuffleArray = shuffleArray;
  exports.toDegrees = toDegrees;
  exports.toRadians = toRadians;
  exports.vectorToAngle = vectorToAngle;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
