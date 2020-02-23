/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Engine from './engine.js';
import SettingsEvent from '../events/settings_event.js';
import { createUUID } from './util.js';

/**
 * Base class for plugins to the engine such as audio, light, etc that can be
 * updated on each engine tick and reset gracefully.
 */
class Plugin {
  constructor() {
    this.uuid = createUUID();
    this.lastUpdate = performance.now();
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
   * An internal update called by the engine. Used for calculating delta and
   * propagating. WARNING: This should not be overriden! For custom logic,
   * override the update function.
   */
  updateInternal() {
    const currTime = performance.now();
    const delta = currTime - this.lastUpdate;
    this.lastUpdate = currTime;
    if (delta <= 0) {
      return;
    }
    this.update(delta);
  }

  /**
   * Updates the plugin at each engine tick.
   * @param {number} delta
   */
  update(delta) {
    console.warn('Plugin update function not implemented');
  }

  /**
   * Handles a settings change event.
   */
  handleSettingsChange() {}
}

export default Plugin;
