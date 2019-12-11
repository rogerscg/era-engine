/**
 * @author rogerscg / https://github.com/rogerscg
 */

import DEFAULT_SETTINGS from '../data/settings.js';
import SettingsEvent from '../events/settings_event.js';

const SETTINGS_KEY = 'era_settings';

/**
 * Controls the client settings in a singleton model in local storage.
 */
class Settings {

  constructor() {
    this.settingsObject = this.initSettings();
    this.verifySettings();
  }
  
  /**
   * Gets the value of a key in the settings object.
   */
  get(key) {
    return this.settingsObject[key];
  }

  /**
   * Retrieves the settings object from local storage. If none exists, create
   * the default.
   */
  initSettings() {
    if (!localStorage.getItem(SETTINGS_KEY)) {
      this.createDefaults();
    }
    try {
      JSON.parse(localStorage.getItem(SETTINGS_KEY));
    } catch (e) {
      this.createDefaults();
    }
    return JSON.parse(localStorage.getItem(SETTINGS_KEY));
  }

  /**
   * Creates the default settings object in local storage.
   */
  createDefaults() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
  }

  /**
   * Fires the applySettings event to the event core, then saves to local
   * storage.
   */
  apply() {
    localStorage.setItem(
      SETTINGS_KEY, JSON.stringify(this.settingsObject));
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
}

export default new Settings();
