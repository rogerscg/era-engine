import Engine from './engine.js';
import SettingsEvent from '../events/settings_event.js';

/**
 * Base class for plugins to the engine such as audio, light, etc that can be
 * updated on each engine tick and reset gracefully.
 */
class Plugin {
  constructor() {
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

export default Plugin;