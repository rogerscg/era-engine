/**
 * @author rogerscg / https://github.com/rogerscg
 */
import Settings from './settings.js';
import SettingsEvent from '../events/settings_event.js';

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
    this.enabled = Settings.get('debug');
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
    }
    this.reset();
    return exportObj;
  }

  /**
   * Handles a settings change.
   */
  handleSettings() {
    const currEnabled = this.enabled;
    if (currEnabled == Settings.get('debug')) {
      return;
    }
    this.enabled = Settings.get('debug');
    this.reset();
  }
}

export default new EngineTimer();