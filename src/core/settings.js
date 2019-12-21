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
      promises.push(this.loadSound(directory, name, options));
    }
    return Promise.all(promises);
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
    // TODO: Actually load modified bit.
    this.wasModified = false;
  }

  getName() {
    return this.name;
  }

  getValue() {
    return this.value;
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

}
