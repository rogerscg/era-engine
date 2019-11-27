import DEFAULT_SETTINGS from '../data/settings.js';
import SettingsEvent from '../events/settings_event.js';
import Bindings from '../data/bindings.js';

/**
 * Controls the client settings in a singleton model in local storage.
 */
let settingsInstance = null;

const SLAPSHOT_SETTINGS = 'slapshot_settings';

class Settings {

  /**
   * Enforces singleton light instance.
   */
  static get() {
    if (!settingsInstance) {
      settingsInstance = new Settings();
    }
    return settingsInstance;
  }

  constructor() {
    this.settingsObject = this.initSettings();
    this.migrate();
    this.verifySettings();
  }
  
  /**
   * Gets the value of a key in the settings object.
   */
  getValue(key) {
    return this.settingsObject[key];
  }

  /**
   * Retrieves the settings object from local storage. If none exists, create
   * the default.
   */
  initSettings() {
    if (!localStorage.getItem(SLAPSHOT_SETTINGS)) {
      this.createDefaults();
    }
    try {
      JSON.parse(localStorage.getItem(SLAPSHOT_SETTINGS));
    } catch (e) {
      this.createDefaults();
    }
    return JSON.parse(localStorage.getItem(SLAPSHOT_SETTINGS));
  }

  /**
   * Creates the default settings object in local storage.
   */
  createDefaults() {
    localStorage.setItem(SLAPSHOT_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }

  /**
   * Fires the applySettings event to the event core, then saves to local
   * storage.
   */
  apply() {
    localStorage.setItem(
      SLAPSHOT_SETTINGS, JSON.stringify(this.settingsObject));
    const event = new SettingsEvent(this.settingsObject);
    event.fire();
  }
  
  /**
   * Verifies that all fields in the settings are present. This is necessary
   * for updates to settings that are not present in localStorage, i.e. if a
   * new setting is added.
   */
  verifySettings() {
    let changed = false;
    for (let key in this.settingsObject) {
      // If the current key in settings no longer exists in default settings,
      // delete from local storage.
      if (DEFAULT_SETTINGS[key] === undefined) {
        delete this.settingsObject[key];
        changed = true;
      }
    }
    for (let key in DEFAULT_SETTINGS) {
      // If the current key is not in current settings, set it to the default.
      if (this.settingsObject[key] === undefined) {
        this.settingsObject[key] = DEFAULT_SETTINGS[key];
        changed = true;
      }
    }
    if(changed) {
      this.apply();
    }
  }

  /**
   * Migrate old settings to new ones
   * Should be executable every startup
   */
  migrate() {
    this.migrateKeybinds()
    this.apply();
  }

  /**
   * If user still has the old control scheme
   * Port it to the new one so they don't have to redo their keybinds
   */
  migrateKeybinds() {
    if(this.settingsObject.controls && this.settingsObject.overrides) {
      const oldOverrides = Object.assign({}, this.settingsObject.overrides);
      const newControls = {}
      for(let oldOverrideKey of Object.keys(oldOverrides)) {
        // Find the keybind that was set
        const belongsToBinding = Object.keys(Bindings).filter(binding => {
          return Bindings[binding].keys.keyboard == oldOverrideKey
        })
        // If we found which it belongs to, set to what they have it set as
        if(belongsToBinding.length === 1) {
          const binding = belongsToBinding[0]
          newControls[binding] = {
            binding_id: Bindings[binding].binding_id,
            keys: { 
              keyboard: oldOverrides[oldOverrideKey],
              controller: Bindings[binding].keys.controller
            }
          }
        }
      }
      this.settingsObject.controls = newControls;
      delete this.settingsObject.overrides;
    }
  }

}

export default Settings;
