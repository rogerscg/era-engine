/**
 * @author rogerscg / https://github.com/rogerscg
 */
import SettingsEvent from '../events/settings_event.js';

// The default settings for the ERA engine. These can be overwriten with custom
// settings. See /data/settings.json as an example to define your own settings.
const DEFAULT_SETTINGS = {
  debug: true,
  movement_deadzone: 0.15,
  mouse_sensitivity: 50,
  shaders: true,
  volume: 50,
};

const SETTINGS_KEY = 'era_settings';

/**
 * Controls the client settings in a singleton model in local storage.
 */
class Settings extends Map {

  constructor() {
    super();
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
    if (!this.get(key)) {
      return;
    }
    super.set(key, value);
    this.apply(); 
  }

  /**
   * Loads the settings from engine defaults, provided defaults, and user-set
   * values from local storage.
   * @param {string} settingsPath
   * @async
   */
  async load(settingsPath) {
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
   * @param {string} settingsPath
   * @async
   */
  async loadFromFile(settingsPath) {
    // TODO: Load from file.
  }

  /**
   * Loads existing settings from local storage.
   */
  loadExistingSettings() {

  }

  /**
   * Fires the applySettings event to the event core, then saves to local
   * storage.
   */
  apply() {
    // TODO: Better export function.
    //localStorage.setItem(
    //  SETTINGS_KEY, JSON.stringify(this.settingsObject));
    const event = new SettingsEvent();
    event.fire();
  }
}

export default new Settings();

/**
 * An individual setting for tracking defaults, types, and other properties
 * of the field.
 */
class Setting {
  /**
   * Loads a setting from an object.
   * @param {?} value
   */
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  getName() {
    return this.name;
  }

  getValue() {
    return this.value;
  }
}
