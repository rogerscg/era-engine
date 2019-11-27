import EraEvent from './era_event.js';

/**
 * Settings changed event. Fired when settings are applied.
 */
class SettingsEvent extends EraEvent {
  
  /**
   * Takes in the new settings object.
   * TODO: Don't actually propagate the settings object. Rely on Settings
   * instance.
   */
  constructor(settings) {
    const label = 'settings';
    const data = {
      settings: settings
    };
    super(label, data);
  }
  
  /** @override */
  static listen(callback) {
    EraEvent.listen('settings', callback);
  }
}

export default SettingsEvent;