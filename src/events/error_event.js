import EraEvent from './era_event.js';

/**
 * Custom event fired when a soft error occurs.
 */
class ErrorEvent extends EraEvent {
  constructor(message) {
    const label = 'error';
    const data = {
      message
    };
    super(label, data);
  }
  
  /** @override */
  static listen(callback) {
    EraEvent.listen('error', callback);
  }
}

export default ErrorEvent;