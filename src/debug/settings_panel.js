import Settings from '../core/settings.js';
import SettingsEvent from '../events/settings_event.js';
import dat from 'dat.gui';

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
      this.gui = new dat.GUI();
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
    Settings.forEach((setting, name) => {
      let controller = this.datControllers.get(name);
      if (!controller) {
        this.dummySettings[name] = setting.getValue();
        controller = this.gui.add(
          this.dummySettings,
          name,
          setting.getMin(),
          setting.getMax()
        );
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
    Settings.set(name, value);
  }
}

export default new SettingsPanel();
