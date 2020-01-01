/**
 * @author rogerscg / https://github.com/rogerscg
 */

const SPLIT_SCREEN_REG = RegExp("[a-zA-Z]+-[0-9]*");

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
    if (playerNumber != null) {
      key = `${key}-${playerNumber}`;
    }
    return this.keysToActions.get(key);
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
    for (let actionName in bindingsObj) {
      const actionObj = bindingsObj[actionName];
      const action = new Action(actionName).load(actionObj);
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
      const keys = action.getKeys();
      // TODO: For local co-op/split screen, set player-specific bindings.
      keys.forEach((key, inputType) => {
        // Get if this key is for a specific player, denoted by a "-[0-9]".
        if (SPLIT_SCREEN_REG.test(inputType)) {
          // This is a split-screen binding, add the player number to the key.
          const playerNumber = inputType.split('-').pop();
          key = `${key}-${playerNumber}`;
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
    const exportObj = {};
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
    const nonEmptyActions = [...this.actions.values()].filter((action) => {
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
    for (let inputType in actionObj.keys) {
      const inputs = actionObj.keys[inputType];
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
  loadMultipleKeys(inputType, inputs, isSplitScreen = false) {
    if (isSplitScreen) {
      inputs.forEach((input, player) => {
        const inputKey = `${inputType}-${player}`;
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
    const exportObj = {};
    exportObj.keys = {};
    // TODO: For local co-op/split screen, export player-specific bindings.
    this.keys.forEach((key, inputType) => exportObj.keys[inputType] = key);
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
 */

/**
 * Generates a RFC4122 version 4 compliant UUID.
 */
function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/** 
 * Disables all shadows for an object and its children.
 */
function disableShadows(object, name, force = false) {
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
function extractMeshes(object, materialFilter, filterOut = true) {
  let meshes = [];
  if (object.type == 'Mesh') {
    if (materialFilter &&
      ((filterOut && object.material.name.indexOf(materialFilter) < 0) ||
        (!filterOut && object.material.name.indexOf(materialFilter) > -1))) {
      meshes.push(object);
    } else if (!materialFilter) {
      meshes.push(object);
    }
  }
  object.children.forEach((child) => {
    const childrenMeshes = extractMeshes(child, materialFilter, filterOut);
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
function extractMeshesByName(object, meshName = '') {
  let meshes = new Array();
  if (object.type == 'Mesh') {
    if (object.name.indexOf(meshName) >= 0) {
      meshes.push(object);
    }
  }
  object.children.forEach((child) => {
    const childrenMeshes = extractMeshesByName(child, meshName);
    meshes = meshes.concat(childrenMeshes);
  });
  return meshes;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

function toRadians (angle) {
  return angle * (Math.PI / 180);
}

/**
 * Computes the angle in radians with respect to the positive x-axis
 * @param {Number} x 
 * @param {Number} y 
 */
function vectorToAngle(x, y) {
		let angle = Math.atan2(y, x);
		if(angle < 0) angle += 2 * Math.PI;
    return angle;
}

/*
 * Get the hex color ratio between two colors
 * Ratio 0 = Col1
 * Ratio 1 = Col2
 */
function getHexColorRatio(col1, col2, ratio) {
	var r = Math.ceil(parseInt(col1.substring(0,2), 16) * ratio + parseInt(col2.substring(0,2), 16) * (1-ratio));
	var g = Math.ceil(parseInt(col1.substring(2,4), 16) * ratio + parseInt(col2.substring(2,4), 16) * (1-ratio));
	var b = Math.ceil(parseInt(col1.substring(4,6), 16) * ratio + parseInt(col2.substring(4,6), 16) * (1-ratio));
	return hex(r) + hex(g) + hex(b);
}

/**
 * Used in getHexColorRatio
 */
function hex(x) {
	x = x.toString(16);
  return (x.length == 1) ? '0' + x : x;
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
    const loader = new THREE.FileLoader();
    loader.load(path, (data) => {
      resolve(JSON.parse(data));
    }, () => {}, (err) => {
      reject(err);
    });
  });
}

/**
 * @author rogerscg / https://github.com/rogerscg
 */

/**
 * Core implementation for managing events and listeners. This
 * exists out of necessity for a simple event and message system
 * for both the client and the server.
 */

let eventsInstance = null;

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
  fireEvent(label, data, context) {
    const callbacks = this.registeredListeners.get(label);
    if (!callbacks)
      return false;
    callbacks.forEach((callback) => {
      if (!callback.context || callback.context == context)
        callback(data);
    });
  }
  
  /**
   * Adds an event listener for a certain label. When the event is fired,
   * the callback is called with data from the event. Returns the UUID
   * of the listener.
   */
  addListener(label, callback) {
    if (!label || !callback && typeof(callback) !== 'function') {
      return false;
    }
    // If the label has not yet been registered, do so by creating a new map
    // of listener UUIDs and callbacks.
    let listeners = this.registeredListeners.get(label);
    if (!listeners) {
      listeners = new Map();
      this.registeredListeners.set(label, listeners);
    }
    const listenerUUID = createUUID();
    listeners.set(listenerUUID, callback);
    this.registeredUUIDs.set(listenerUUID, label);
    return listenerUUID;
  }
  
  /**
   * Removes an event listener from registered listeners by its UUID.
   * Returns true if the listener is successfully deleted.
   */
  removeListener(uuid) {
    const label = this.registeredUUIDs.get(uuid);
    if (!label) {
      return false;
    }
    const listeners = this.registeredListeners.get(label);
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
  
  constructor(label, data, context) {
    this.label = label;
    this.data = data;
    // TODO: Remove "context" and provide an actual target.
    this.context = context;
  }
  
  /**
   * Fires the event to the events core.
   */
  fire() {
    Events.get().fireEvent(this.label, this.data, this.context);
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

const LABEL = 'reset';

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
    const label = 'settings';
    const data = {};
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
const DEFAULT_SETTINGS = {
  debug: {
    value: true,
  },
  movement_deadzone: {
    value: 0.15,
  },
  mouse_sensitivity: {
    value: 50,
  },
  shaders: {
    value: true,
  },
  volume: {
    value: 50,
  },
};

const SETTINGS_KEY = 'era_settings';

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
    const setting = super.get(key);
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
    const setting = super.get(key);
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
    this.loaded = true;
    this.loadEngineDefaults();
    if (settingsPath) {
      await this.loadFromFile(settingsPath);
    }
    this.loadExistingSettings();
    this.apply();
    return this;
  }

  /**
   * Loads the default values for the engine. This is necessary for core plugins
   * that are dependent on settings.
   */
  loadEngineDefaults() {
    for (let key in DEFAULT_SETTINGS) {
      const setting = new Setting(key, DEFAULT_SETTINGS[key]);
      super.set(setting.getName(), setting);
    }
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
    let allSettingsData;
    try {
      allSettingsData = await loadJsonFromFile(settingsPath);
    } catch (e) {
      throw new Error(e);
    }
    for (let key in allSettingsData) {
      const setting = new Setting(key, allSettingsData[key]);
      super.set(setting.getName(), setting);
    }
  }

  /**
   * Loads existing settings from local storage. Merges the settings previously
   * saved into the existing defaults.
   */
  loadExistingSettings() {
    // Load from local storage.
    let savedSettings;
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
    for (let key in savedSettings) {
      const setting = new Setting(key, savedSettings[key]);
      const defaultSetting = super.get(setting.getName());
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
    const event = new SettingsEvent();
    event.fire();
  }

  /**
   * Exports all settings into a string for use in local storage.
   * @returns {string}
   */
  export() {
    const expObj = {};
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
    this.wasModified = !!settingsData.modified;
  }

  getName() {
    return this.name;
  }

  getValue() {
    return this.value;
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

const MEASUREMENT_MIN = 10;
const MAX_LENGTH = 100;

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
    this.enabled = Settings$1.get('debug');
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
    const time = performance.now() - this.startTime;
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
    const total = this.measurements.reduce((agg, x) => agg + x, 0);
    const avg = total / this.measurements.length;
    const exportObj = {
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
    const currEnabled = this.enabled;
    if (currEnabled == Settings$1.get('debug')) {
      return;
    }
    this.enabled = Settings$1.get('debug');
    this.reset();
  }
}

var EngineTimer$1 = new EngineTimer();

/**
 * @author rogerscg / https://github.com/rogerscg
 */

const Types = {
  GAME: 'game',
  MINIMAP: 'minimap',
  BACKGROUND: 'background',
  STAGE: 'stage',
  TILE: 'tile',
};

/**
 * A pool of singleton, lazy-loaded WebGL renderers for specific uses.
 */
class RendererPool {
  constructor() {
    this.map = new Map();
    EngineResetEvent.listen(this.handleEngineReset.bind(this));
  }
  
  get(name) {
    if (name == Types.TILE) {
      return this.getOrCreateTileRenderer();
    }
    if (!this.map.has(name)) {
      return this.createRenderer(name);
    }
    return this.map.get(name);
  }

  /**
   * Creates a new renderer based on the name of the renderer.
   */
  createRenderer(name) {
    let renderer = null;
    switch (name) {
      case Types.GAME:
        renderer = this.createGameRenderer();
        break;
      case Types.STAGE:
      case Types.MINIMAP:
      case Types.BACKGROUND:
        renderer = this.createGenericRenderer();
        break;
    }
    this.map.set(name, renderer);
    return renderer;
  }
  
  /**
   * Creates the main renderer for the game.
   */
  createGameRenderer() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.gammaOutput = true;
    renderer.gammaInput = true;
    renderer.setClearColor(0x111111);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    return renderer;
  }
  
  /**
   * Creates the renderer used for face tiles.
   */
  createGenericRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    return renderer;
  }
  
  /**
   * Retrives a tile renderer from the pool if it exists. If not, creates a new
   * one.
   */
  getOrCreateTileRenderer() {
    if (!this.map.has(Types.TILE)) {
      this.map.set(Types.TILE, new Set());
    }
    const pool = this.map.get(Types.TILE);
    let found = null;
    pool.forEach((renderer) => {
      if (!renderer.inUse && !found) {
        found = renderer;
      }
    });
    if (!found) {
      found = this.createGenericRenderer();
      pool.add(found);
    }
    found.inUse = true;
    return found;
  }
  
  /**
   * Handles an engine reset by marking all renderers as not in use.
   */
  handleEngineReset() {
    const tilePool = this.map.get(Types.TILE);
    if (!tilePool) {
      return;
    }
    tilePool.forEach((renderer) => renderer.inUse = false);
  }
}

const rendererPool = new RendererPool();
const RendererTypes = Types;

/**
 * @author rogerscg / https://github.com/rogerscg
 */

let instance = null;
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
    this.entities = new Set();
    // A map of cameras to the entities on which they are attached.
    this.cameras = new Map();
    this.timer = EngineTimer$1;
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  /**
   * Sets the camera on the engine.
   * @param {THREE.Camera} camera
   * @returns {Engine}
   */
  setCamera(camera) {
    if (this.camera) {
      this.camera.userData.active = false;
    }
    this.camera = camera;
    camera.userData.active = true;
    return this;
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
    this.scene = new THREE.Scene();
    if (!this.renderer) {
      this.renderer = this.createRenderer();
    }
    if (!this.camera) {
      console.error('No camera provided');
    }
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
    // Destroy all registered entities.
    this.entities.forEach((entity) => entity.destroy());
    // Clear the renderer.
    this.resetRender = true;
    this.clearScene();
    this.started = false;
  }

  /**
   * Clears the scene.
   */
  clearScene() {
    const scene = this.scene;
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }

  /**
   * The root for all tick updates in the game.
   */
  render(timeStamp) {
    this.timer.start();
    this.renderer.render(this.scene, this.camera);
    TWEEN.update(timeStamp);
    // Update all plugins.
    this.plugins.forEach((plugin) => plugin.update(timeStamp));
    // Update all entities.
    this.entities.forEach((entity) => entity.update());

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
   * Creates the three.js renderer and sets options.
   */
  createRenderer() {
    const renderer = rendererPool.get(RendererTypes.GAME);
    const container = document.getElementById('container');
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    return renderer;
  }

  /**
   * Adjusts the game container and camera for the new window size.
   */
  onWindowResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
   * Registers an entity for engine updates.
   * @param {Entity} entity 
   */
  registerEntity(entity) {
    this.entities.add(entity);
  }

  /**
   * Unregisters an entity for engine updates.
   * @param {Entity} entity 
   */
  unregisterEntity(entity) {
    this.entities.delete(entity);
  }

  /**
   * Attaches the main camera to the given entity.
   * @param {Entity} entity
   */
  attachCamera(entity) {
    if (!entity) {
      return console.warn('No entity provided to attachCamera');
    }
    const camera = this.getCamera();
    const prevEntity = this.cameras.get(camera);
    if (prevEntity) {
      prevEntity.detachCamera(camera);
    }
    entity.attachCamera(camera);
    this.cameras.set(camera, entity);
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

/**
 * @author rogerscg / https://github.com/rogerscg
 */

const CROSSFADE_TIME = 500;

let instance$1 = null;

/** 
 * Core implementation for all audio. Manages the loading, playback, and
 * other controls needed for in-game audio.
 */
class Audio extends Plugin {
  static get() {
    if (!instance$1) {
      instance$1 = new Audio();
    }
    return instance$1;
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

    this.loadSettings();
    SettingsEvent.listen(this.loadSettings.bind(this));
  }

  /** @override */
  reset() {
    this.stopAmbientSound();
    this.playingSounds.forEach((node) => node.source.stop());
    this.playingSounds.clear();
  }

  /** @override */
  update() {}

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
    let allSoundData;
    try {
      allSoundData = await loadJsonFromFile$1(filePath);
    } catch (e) {
      throw new Error(e);
    }
    // Extract the directory from the file path, use for loading sounds.
    const directory = filePath.substr(0, filePath.lastIndexOf('/') + 1);
    const promises = new Array();
    for (let name in allSoundData) {
      const options = allSoundData[name];
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
    let extension = options.extension;
    // Append a trailing slash to the directory if it doesn't exist.
    if (!directory.endsWith('/')) {
      directory += '/';
    }
    // Insert a period if the extension doesn't have one.
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    const path = `${directory}${name}${extension}`;
    const event = await this.createSoundRequest(path);
    const buffer = await this.bufferSound(event);
    this.sounds.set(name, buffer);
    return;
  }
  
   /**
   * Creates and sends an HTTP GET request with type arraybuffer for sound.
   */
  createSoundRequest(path) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', path, true);
      request.responseType = 'arraybuffer';
      request.addEventListener('load', (event) => {
        resolve(event);
      }, false);
      request.send();
    });
  }

  /**
   * Decodes audio data from the request response.
   */
  bufferSound(event) {
    return new Promise((resolve) => {
      const request = event.target;
      this.context.decodeAudioData(request.response, (buffer) => {
        resolve(buffer);
      });
    });
  }

  /**
   * Converts an audio buffer into a Web Audio API source node.
   */
  createSourceNode(buffer) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
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
  playSound(name, adjustVolume = 1.0) {
    const defaultSound = this.sounds.get(name);
    let buffer = defaultSound;
    if (!buffer) {
      return false;
    }
    const node = this.createSourceNode(buffer);
    const volRatio = this.masterVolume / this.defaultVolume;
    // TODO: Load sounds into actual sound objects.
    const dataVolume = 1.0; //soundData && soundData.volume ? soundData.volume : 1.0;
    const volume = volRatio * dataVolume * adjustVolume;
    node.gain.gain.value = volume;
    node.source.start(0);
    node.uuid = createUUID();
    this.playingSounds.set(node.uuid, node);
    setTimeout(() => {
      this.playingSounds.delete(node.uuid);
    }, Math.round(node.source.buffer.duration * 1000));
    return node;
  }

  /**
   * Plays a sound in-game on a loop.
   */
  playSoundOnLoop(name, adjustVolume = 1.0) {
    const defaultSound = this.sounds.get(name);
    let buffer = defaultSound;
    if (!buffer) {
      return false;
    }
    const node = this.createSourceNode(buffer);
    const volRatio = this.masterVolume / this.defaultVolume;
    // TODO: Load sounds into actual sound objects.
    const dataVolume = 1.0; //soundData && soundData.volume ? soundData.volume : 1.0;
    const volume = volRatio * dataVolume * adjustVolume;
    node.gain.gain.value = volume;
    node.source.loop = true;
    node.source.start(0);
    node.uuid = createUUID();
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
   * Loads settings relevant to audio.
   */
  loadSettings() {
    this.masterVolume = Settings$1.get('volume');
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
      this.addAmbientTrack(2, this.ambientEventSounds, .2, .2);
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
  addAmbientTrack(channel, sources, sourceVolume, randomness = 1.0) {
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
    const volRatio = this.masterVolume / this.defaultVolume;
    const volume = volRatio * sourceVolume;
    shuffleArray(sources);
    let selectedBuffer = null;
    for (let source of sources) {
      if (!source.inUse) {
        selectedBuffer = source;
        break;
      }
    }
    if (!selectedBuffer) {
      return;
    }
    selectedBuffer.inUse = true;
    let currTime = this.context.currentTime;
    const node = this.createSourceNode(selectedBuffer);
    node.source.start(0);
    node.gain.gain.linearRampToValueAtTime(0, currTime);
    node.gain.gain.linearRampToValueAtTime(
      volume, currTime + CROSSFADE_TIME / 1000);

    // When the audio track is drawing to a close, queue up new track, fade old.
    setTimeout(() => {
      this.addAmbientTrack(channel, sources, sourceVolume, randomness);
      currTime = this.context.currentTime;
      node.gain.gain.linearRampToValueAtTime(volume, currTime);
      node.gain.gain.linearRampToValueAtTime(
        0, currTime + CROSSFADE_TIME / 1000);
    }, Math.round(node.source.buffer.duration * 1000 - CROSSFADE_TIME));

    // When audio finishes playing, mark as not in use.
    const uuid = createUUID();
    this.playingSounds.set(uuid, node);
    setTimeout(() => {
      selectedBuffer.inUse = false;
      this.playingSounds.delete(uuid);
    }, Math.round(node.source.buffer.duration * 1000));
  }
}

let instance$2 = null;
/**
 * Manages camera contruction.
 */
class Camera {
  static get() {
    if (!instance$2) {
      instance$2 = new Camera();
    }
    return instance$2;
  }

  constructor() {
    this.cameras = new Map();
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  /**
   * Iterates over all cameras and resizes them.
   */
  onWindowResize() {
    this.cameras.forEach((camera) => camera.userData.resize());
  }

  /**
   * Returns the active camera.
   * @returns {THREE.Camera}
   */
  getActiveCamera() {
    const cameras = [...this.cameras.values()];
    return cameras.filter((camera) => camera.userData.active)[0];
  }

  /**
   * Builds a default perspective camera.
   * @returns {THREE.PerspectiveCamera}
   */
  buildPerspectiveCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const viewAngle = 70;
    const aspect = width / height;
    const near = 1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
    camera.rotation.order = 'YXZ';
    camera.userData.resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    this.cameras.set(camera.uuid, camera);
    return camera;
  }

  /**
   * Builds a default isometric camera.
   * @returns {THREE.OrthgraphicCamera}
   */
  buildIsometricCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const near = 1;
    const far = 1000;
    const camera = new THREE.OrthographicCamera(
                    width / -2, width / 2, height / 2, height / -2, near, far);
    camera.zoom = 16;
    camera.updateProjectionMatrix();
    camera.userData.resize = () => {
      camera.left = window.innerWidth / -2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = window.innerHeight / -2;
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

const CONTROLS_KEY = 'era_bindings';

let instance$3 = null;

/**
 * The controls core for the game. Input handlers are created here. Once the
 * input is received, the response is delegated to the entity in control.
 */
class Controls extends Plugin {
  /**
   * Enforces singleton controls instance.
   */
  static get() {
    if (!instance$3) {
      instance$3 = new Controls();
    }
    return instance$3;
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

    document.addEventListener('keydown', e => this.setActions(e.keyCode, 1));
    document.addEventListener('keyup', e => this.setActions(e.keyCode, 0));
    document.addEventListener('mousedown', e => this.setActions(e.button, 1));
    document.addEventListener('mouseup', e => this.setActions(e.button, 0));

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('click', this.onMouseClick.bind(this));

    window.addEventListener("gamepadconnected", this.startPollingController.bind(this));
    window.addEventListener("gamepaddisconnected", this.stopPollingController.bind(this));

    this.loadSettings();
    this.registerCustomBindings();
    
    SettingsEvent.listen(this.loadSettings.bind(this));
  }

  /** @override */
  reset() {
    this.registeredEntities = new Map();
    this.forcePointerLockState(undefined);
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
    if(this.hasController) {
      return navigator.getGamepads()[0].id
    }
    return "";
  }

  /**
   * Checks raw input (no keybind overrides)
   * @param {Gamepad} controller
   * @returns {Object}
   */
  getRawControllerInput(controller) {
    let input = {};
    if (this.hasController) {
      // Check if the controller is in both deadzones.
      let isOutOfDeadzone = false;
      controller.axes.forEach((val, i) => {
        if (Math.abs(val) > this.movementDeadzone) {
          isOutOfDeadzone = true;
        }
      });

      for (let i = 0; i < controller.axes.length; i++) {
        let val = controller.axes[i];
        val = isOutOfDeadzone ? val : 0;
        input[`axes${i}`] = val;
      }

      for (let i = 0; i < controller.buttons.length; i++) {
        let val = controller.buttons[i].value;
        val = Math.abs(val) > this.movementDeadzone ? val : 0;
        input[`button${i}`] = val;
      }

      for (let key of Object.keys(input)) {
        // Only send 0 if the one before that wasn't 0
        const previousHadValue = this.previousInput[key] && this.previousInput[key] !== 0;
        if (input[key] === 0 && !previousHadValue) {
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
    }
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
    if (isController &&
        key.indexOf('axes') >= 0 &&
        !key.startsWith('+') &&
        !key.startsWith('-')) {
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
      if (isController &&
          entity.getPlayerNumber() != null &&
          gamepadNumber != entity.getPlayerNumber()) {
        return;
      }
      if (isController) {
        // No longer need to check for player number.
        playerNumber = null;
      }
      // Get the bindings for the entity.
      const bindings = this.registeredBindings.get(entity.getControlsId());
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
    this.movementDeadzone = Settings$1.get('movement_deadzone');
    this.mouseSensitivity = Settings$1.get('mouse_sensitivity');
  }

  /**
   * Creates orbit controls on the camera, if they exist.
   */
  useOrbitControls() {
    new THREE.OrbitControls(
      Engine.get().getCamera(), Engine.get().getRenderer().domElement);
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

/**
 * @author rogerscg / https://github.com/rogerscg
 */

let instance$4 = null;

/**
 * Core implementation for loading 3D models for use in-game.
 */
class Models {

  /**
   * Enforces a singleton instance of Models.
   * @returns {Models}
   */
  static get() {
    if (!instance$4) {
      instance$4 = new Models();
    }
    return instance$4;
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
    let allModelData;
    try {
      allModelData = await loadJsonFromFile$1(filePath);
    } catch (e) {
      throw new Error(e);
    }
    // Extract the directory from the file path, use for loading models.
    const directory = filePath.substr(0, filePath.lastIndexOf('/') + 1);
    const promises = new Array();
    for (let name in allModelData) {
      const options = allModelData[name];
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
    // Defaults to GLTF.
    const extension = options.extension ? options.extension : 'gltf';
    const path = `${directory}${name}.${extension}`;
    let root;
    switch (extension) {
      case 'gltf':
        root = await this.loadGltfModel(path);
        break;
      case 'obj':
        root = await this.loadObjModel(path);
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
      const loader = new THREE.GLTFLoader();
      loader.load(path, (gltf) => {
        resolve(gltf.scene);
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
    let materials = null;
    try {
      materials = await this.loadObjMaterials(path);
    } catch (e) {}
    const root = await this.loadObjGeometry(path, materials);
    return root;
  }

  /**
   * 
   * @param {string} path 
   * @param {?} materials 
   */
  loadObjGeometry(path, materials) {
    return new Promise((resolve) => {
      const objLoader = new THREE.OBJLoader();
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
    const mtlLoader = new THREE.MTLLoader();
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
   * Creates a clone of a model from storage.
   * @param {string} name
   * @return {THREE.Object3D}
   */
  createModel(name) {
    if (!this.storage.has(name)) {
      return null;
    }
    return this.storage.get(name).clone();
  }
}

/**
 * @author rogerscg / https://github.com/rogerscg
 */

let instance$5 = null;
/**
 * Core implementation for managing the game's physics. The
 * actual physics engine is provided by the user.
 */
class Physics extends Plugin {
  /**
   * Enforces singleton physics instance.
   */
  static get() {
    if (!instance$5) {
      instance$5 = new Physics();
    }
    return instance$5;
  }

  constructor() {
    super();
    this.registeredEntities = new Map();
    this.world = this.createWorld();
    this.lastTime = performance.now();
  }

  /** @override */
  reset() {
    this.terminate();
    // TODO: Clean up physics bodies.
  }

  /** @override */
  update() {
    const currTime = performance.now();
    let delta = (currTime - this.lastTime);
    this.lastTime = currTime;
    if (delta <= 0) {
      return;
    }
    this.step(delta);
    this.updateEntities(delta);
  }

  getWorld() {
    return this.world;
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
    instance$5 = null;
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
}

/**
 * @author rogerscg / https://github.com/rogerscg
 */

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
class Entity extends THREE.Object3D {
  static GetBindings() {
    return new Bindings(CONTROLS_ID).load(ENTITY_BINDINGS);
  }

  constructor() {
    super();
    this.uuid = createUUID();
    this.mesh = null;
    this.cameraArm;
    this.modelName = null;
    this.physicsBody = null;
    this.physicsEnabled = false;
    this.actions = new Map(); // Map of action -> value (0 - 1)
    this.bindings = Controls.get().getBindings(this.getControlsId());
    this.inputDevice = 'keyboard';
    this.registeredCameras = new Set();
    this.physicsWorld = null;
    this.playerNumber = null;
    this.mouseMovement = {
      x: 0,
      y: 0
    };
  }

  withPhysics() {
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
    const scene = Models.get().storage.get(this.modelName).clone();
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
    this.mouseMovement = {
      x: 0,
      y: 0
    };
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
   * Sets the mouse movement vector for the entity.
   */
  setMouseMovement(x, y) {
    this.mouseMovement.x = x;
    this.mouseMovement.y = y;
    // TODO: Clear somehow.
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
}

/**
 * @author rogerscg / https://github.com/rogerscg
 */

let instance$6 = null;

/**
 * Light core for the game engine. Creates and manages light
 * sources in-game. Should be used as a singleton.
 */
class Light extends Plugin {
  /**
   * Enforces singleton light instance.
   */
  static get() {
    if (!instance$6) {
      instance$6 = new Light();
    }
    return instance$6;
  }

  constructor() {
    super();
    this.ambientLight = null;
    this.directionalLights = [];
  }
  
  /** @override */
  reset() {
    // TODO: Dispose of lighting objects correctly.
  }

  /** @override */
  update() {}

  /**
   * Creates the ambient lighting. Use this for easing/darkening shadows.
   */
  createAmbientLight(ambientConfig) {
    const ambientLight = new THREE.AmbientLight(ambientConfig.color);
    ambientLight.intensity = ambientConfig.intensity;
    return ambientLight;
  }

  /**
   * Creates the entire set of directional lights.
   */
  createDirectionalLights(directionalConfig) {
    const directionalLights = [];
    if (!directionalConfig || !directionalConfig.length) {
      return directionalLights;
    }
    for (let i = 0; i < directionalConfig.length; i++) {
      const light = directionalConfig[i];
      const x = light.x;
      const y = light.y;
      const z = light.z;
      const color = parseInt(light.color, 16);
      const intensity = light.intensity;
      directionalLights.push(
        this.createDirectionalLight(x, y, z, color, intensity));
    }
    return directionalLights;
  }

  /**
   * Creates the directional lighting. Use this for generating shadows.
   */
  createDirectionalLight(x, y, z, color, intensity) {
    const directionalLight = new THREE.DirectionalLight(color);
    directionalLight.position.set(x, y, z);
    directionalLight.intensity = intensity;
    if (Settings$1.get('shaders')) {
      this.shadersEnabled = true;
      this.createShaders(directionalLight);
    }
    return directionalLight;
  }
  
  /**
   * Creates the entire set of directional lights.
   */
  createSpotLights(spotConfig) {
    const spotLights = new Array();
    if (!spotConfig || !spotConfig.length) {
      return spotLights;
    }
    for (let i = 0; i < spotConfig.length; i++) {
      const light = spotConfig[i];
      const x = light.x;
      const y = light.y;
      const z = light.z;
      const color = parseInt(light.color, 16);
      const intensity = light.intensity;
      const angle = light.angle;
      const penumbra = light.penumbra;
      const shaders = light.shaders;
      spotLights.push(this.createSpotLight(
        x, y, z, color, intensity, angle, penumbra, shaders));
    }
    return spotLights;
  }
  
  /**
   * Creates a spot light. Use this for generating shadows.
   */
  createSpotLight(x, y, z, color, intensity, angle, penumbra, shaders) {
    const spotLight = new THREE.SpotLight(color);
    spotLight.position.set(x, y, z);
    spotLight.intensity = intensity;
    spotLight.angle = angle;
    spotLight.penumbra = penumbra;
    if (Settings$1.get('shaders') && shaders) {
      this.shadersEnabled = true;
      this.createShaders(spotLight);
    }
    Engine.get().getScene().add(spotLight);
    return spotLight;
  }

  /**
   * Creates the shaders for a directional light.
   */
  createShaders(light) {
    const cameraRange = 120;
    light.castShadow = true;
    light.shadow.camera.bottom = -cameraRange;
    light.shadow.camera.left = -cameraRange;
    light.shadow.camera.right = cameraRange;
    light.shadow.camera.top = cameraRange;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 500;
    light.shadow.bias = .0001;
    light.shadow.radius = 4;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
  }
  
  /** @override */
  handleSettingsChange() {
    if (!!Settings$1.get('shaders') == !!this.shadersEnabled) {
      return;
    }
    if (Settings$1.get('shaders')) {
      this.enableShaders();
    } else {
      this.disableShaders();
    }
  }
  
  /**
   * Enables shaders.
   */
  enableShaders() {
    this.shadersEnabled = true;
    this.directionalLights.forEach((light) => {
      this.createShaders(light);
    });
    this.spotLights.forEach((light) => {
      this.createShaders(light);
    });
  }
  
  /**
   * Disables shaders.
   */
  disableShaders() {
    this.shadersEnabled = false;
    this.directionalLights.forEach((light) => {
      light.castShadow = false;
    });
    this.spotLights.forEach((light) => {
      light.castShadow = false;
    });
  }

}

/**
 * @author rogerscg / https://github.com/rogerscg
 */

const WIDTH = 500;

const SUFFIXES = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];

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
    const cubeMaterials =
      await this.createCubeMaterials(directory, filename, extension);
    
    const geometry = new THREE.CubeGeometry(WIDTH, WIDTH, WIDTH);
    const cube = new THREE.Mesh(geometry, cubeMaterials);
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
    const loader = extension == '.tga' ?
      new THREE.TGALoader() :
      new THREE.TextureLoader();
    const texturePromises = new Array();
    for (let i = 0; i < SUFFIXES.length; ++i) {
      const suffix = SUFFIXES[i];
      const path = `${directory}${filename}_${suffix}${extension}`;
      texturePromises.push(this.loadTexture(loader, path));
    }
    const textures = await Promise.all(texturePromises);
    // Create all materials from textures.
    const cubeMaterials = new Array();
    for (let i = 0; i < textures.length; ++i) {
      const mat = new THREE.MeshBasicMaterial({
        map: textures[i],
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
class Environment extends THREE.Object3D {
  constructor() {
    super();
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
    const environmentData = await loadJsonFromFile$1(filePath);
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
      lightsData.ambient.forEach((data) => {
        const color = data.color !== undefined ?
                      parseInt(data.color, 16) :
                      0xffffff;
        this.add(Light.get().createAmbientLight({
          color: color,
          intensity: data.intensity ? data.intensity : 1.0,
        }));
      });
    }
    if (lightsData.directional) {
      lightsData.directional.forEach((data) => {
        const color = data.color === undefined ?
                      parseInt(data.color, 16) :
                      0xffffff;
        const x = data.x ? data.x : 0;
        const y = data.y ? data.y : 0;
        const z = data.z ? data.z : 0;
        const intensity = data.intensity ? data.intensity : 1.0;
        this.add(Light.get().createDirectionalLight(x, y, z, color, intensity));
      });
    }
  }

  /**
   * Sets the renderer background color.
   * @param {string} background
   */
  loadBackground(background) {
    const renderer = Engine.get().getRenderer();
    if (!renderer || !background) {
      return;
    }
    renderer.setClearColor(parseInt(background, 16));
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
    const skybox = new Skybox();
    const directory = skyboxData.directory;
    const file = skyboxData.file;
    const extension = skyboxData.extension;
    await skybox.load(directory, file, extension);
    this.add(skybox);
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
    const label = 'error';
    const data = {
      message
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
    return `${protocol}://${host}:${port}`;
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
    const url = this.origin + path;
    const req = this.buildRequest('POST', url);
    const response = await this.sendRequest(req, data);
    return response;
  }

  /** 
   * Creates and sends an HTTP GET request, awaiting for the response.
   * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
   * @returns {Object}
   * @async
   */
  async createGetRequest(path) {
    const url = this.origin + path;
    const req = this.buildRequest('GET', url);
    const response = await this.sendRequest(req);
    return response;
  }

  /**
   * Creates and sends an HTTP DELETE request, awaiting for the response.
   * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
   * @returns {Object}
   * @async
   */
  async createDeleteRequest(path, data) {
    const url = this.origin + path;
    const req = this.buildRequest('DELETE', url);
    const response = await this.sendRequest(req, data);
    return response;
  }

  /**
   * Creates an error for a failed or invalid HTTP request.
   */
  createError(req) {
    let message;
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
  async createSocketConnection(query, required = false) {
    return new Promise((resolve) => {
      if (this.socket) {
        return resolve(this.socket);
      }
      this.connectionResolver = resolve;
      const params = {
        reconnection: false
      };
      if (!query) {
        query = new Map();
      }
      if (this.token) {
        query.set('token', this.token);
      }
      let queryString = '';
      for (let pair of query) {
        let pairString = pair[0] + '=' + pair[1];
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
      const message = 'Socket error:' + JSON.stringify(err);
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
    const req = new XMLHttpRequest();
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
  sendRequest(req, data = null) {
    return new Promise((resolve, reject) => {
      // Install load listener.
      req.addEventListener('load', () => {
        if (req.status == 200 || req.status == 304) {
          const responseStr = req.responseText;
          try {
            const response = JSON.parse(responseStr);
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
      console.warn(`Server with name ${name} already registered.`);
      return this.get(name);
    }
    const server = new Network(protocol, host, port).withName(name);
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

const STATS_CONTAINER_CSS = `
  bottom: 0;
  position: fixed;
  left: 0;
`;

const WEBGL_CONTAINER_CSS = `
  background-color: #002;
  color: #0ff;
  cursor: pointer;
  font-family: Helvetica,Arial,sans-serif;
  font-size: 9px;
  font-weight: bold;
  line-height: 15px;
  opacity: 0.9;
  padding: 0 0 3px 3px;
  text-align: left;
  width: 80px;
`;

const FPS_CONTAINER_CSS = `
  cursor: pointer;
  opacity: 0.9;
`;

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
    const container = document.createElement('div');
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
    const currEnabled = Settings$1.get('debug');
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
    const container	= document.createElement('div');
    container.setAttribute('class', 'render-stats');
	  container.style.cssText = WEBGL_CONTAINER_CSS;

	  const msText= document.createElement('div');
	  msText.innerHTML= 'WebGLRenderer';
	  container.appendChild(msText);
	
    const msTexts	= [];
    const nLines	= 9;
    for (let i = 0; i < nLines; i++){
      msTexts[i]	= document.createElement('div');
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
    const msTexts = this.msTexts;
    let i	= 0;
    msTexts[i++].textContent = '=== Memory ===';
    msTexts[i++].textContent = 'Programs: '	+ this.renderer.info.programs.length;
    msTexts[i++].textContent = 'Geometries: '+ this.renderer.info.memory.geometries;
    msTexts[i++].textContent = 'Textures: ' + this.renderer.info.memory.textures;

    msTexts[i++].textContent = '=== Render ===';
    msTexts[i++].textContent = 'Calls: ' + this.renderer.info.render.calls;
    msTexts[i++].textContent = 'Triangles: ' + this.renderer.info.render.triangles;
    msTexts[i++].textContent = 'Lines: ' + this.renderer.info.render.lines;
    msTexts[i++].textContent = 'Points: '	+ this.renderer.info.render.points;
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
    const container = document.createElement('div');
    this.dom = container;
    container.classList.add('render-stats');
    container.style.cssText = FPS_CONTAINER_CSS;

    // Switch panels on click.
    container.addEventListener('click', (event) => {
      event.preventDefault();
      this.showPanel(++ this.mode % container.children.length);
    }, false);
    

    this.fpsPanel = this.addPanel(new Panel('FPS', '#0ff', '#002', true));
    this.msPanel = this.addPanel(new Panel('MS', '#0f0', '#020', false));
    this.timerPanel = this.addPanel(new Panel('Render', '#ff3800', '#210', false));
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
		for (let i = 0; i < this.dom.children.length; i++) {
			this.dom.children[i].style.display = i === id ? 'block' : 'none';
		}
		this.mode = id;
  }
  
	begin() {
		this.beginTime = (performance || Date).now();
  }
    
  getFPS(){
    return this.fps;
  }

  end() {
    this.frames++;
    const time = (performance || Date).now();
    this.msPanel.update(time - this.beginTime, 30);
    const engStats = EngineTimer$1.export();
    if (engStats) {
      this.timerPanel.update(engStats.avg, 30);
    }
    if (time >= this.prevTime + 1000) {
      this.fps = (this.frames * 1000) / (time - this.prevTime);
      this.fpsPanel.update(this.fps, 100);
      this.prevTime = time;
      this.frames = 0;
      if (this.memPanel) {
        const memory = performance.memory;
        this.memPanel.update(memory.usedJSHeapSize / 1048576,
                             memory.jsHeapSizeLimit / 1048576);
      }
    }
    return time;
  }

  update() {
    this.beginTime = this.end();
  }
}

// Panel constants.
const PR = Math.round(window.devicePixelRatio || 1);
const WIDTH$1 = 83 * PR;
const HEIGHT = 48 * PR;
const TEXT_X = 3 * PR;
const TEXT_Y = 2 * PR;
const GRAPH_X = 3 * PR;
const GRAPH_Y = 15 * PR;
const GRAPH_WIDTH = 74 * PR;
const GRAPH_HEIGHT = 30 * PR;

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
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH$1;
    canvas.height = HEIGHT;
    canvas.style.cssText = 'width:83px;height:48px';
    
    const context = canvas.getContext('2d');
    context.font = 'bold ' + (9 * PR) + 'px Helvetica,Arial,sans-serif';
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
    const canvas = this.canvas;
    const context = this.context;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    const roundedValue = this.shouldRound ? Math.round(value) : value.toFixed(2);

    context.fillStyle = this.bg;
    context.globalAlpha = 1;
    context.fillRect(0, 0, WIDTH$1, GRAPH_Y);
    context.fillStyle = this.fg;
    context.fillText(`${roundedValue} ${this.name} (${Math.round(this.min)}-${Math.round(this.max)})`, TEXT_X, TEXT_Y);

    context.drawImage(canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT);

    context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);

    context.fillStyle = this.bg;
    context.globalAlpha = 0.9;
    context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, Math.round((1 - (value / maxValue)) * GRAPH_HEIGHT));
  }
}

/**
 * @author rogerscg / https://github.com/rogerscg
 */

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
    world.setGravity(new Ammo.btVector3(0, -10, 0));
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
    const event = {
      type: 'begin',
      contact
    };
    this.determineCallbacks(contact, event);
    
  }

  /** @override */
  EndContact(contact) {
    const event = {
      type: 'end',
      contact
    };
    this.determineCallbacks(contact, event);
  }

  /** @override */
  PreSolve(contact, oldManifold) {}

  /** @override */
  PostSolve(contact, contactImpulse) {
    const event = {
      type: 'postsolve',
      contact,
      contactImpulse
    };
    this.determineCallbacks(contact, event); 
  }

  /**
   * Determines if any callbacks should be made.
   */
  determineCallbacks(contact, event) {
    const callbackA = this.contactCallbacks.get(contact.GetFixtureA());
    if (callbackA) {
      callbackA(event);
    }
    const callbackB = this.contactCallbacks.get(contact.GetFixtureB());
    if (callbackB) {
      callbackB(event);
    }
  }
}

/**
 * @author rogerscg / https://github.com/rogerscg
 */

const VELOCITY_ITERATIONS = 8;
const POSITION_ITERATIONS = 3;

/**
 * API implementation for Box2D.
 */
class Box2DPhysics extends Physics {
  /** @override */
  createWorld() {
    const world = new box2d.b2World(new box2d.b2Vec2(0.0, 0.0));
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

export { Action, AmmoPhysics, Audio, Bindings, Box2DPhysics, Camera, Controls, Engine, EngineResetEvent, Entity, Environment, EraEvent, Events, Light, Models, Network, network_registry as NetworkRegistry, Physics, Plugin, RendererStats, Settings$1 as Settings, SettingsEvent, Skybox, createUUID, disableShadows, dispose, extractMeshes, extractMeshesByName, getHexColorRatio, lerp, loadJsonFromFile$1 as loadJsonFromFile, shuffleArray, toDegrees, toRadians, vectorToAngle };
