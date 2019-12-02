import EraEvent from './era_event.js';

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

export default SettingsEvent;