/**
 * @author rogerscg / https://github.com/rogerscg
 */

import EraEvent from './era_event.js';

const LABEL = 'reset';

/**
 * Engine reset event.
 */
class EngineResetEvent extends EraEvent {
  constructor() {
    super(LABEL, {});
  }
  
  /** @override */
  static listen(callback) {
    EraEvent.listen(LABEL, callback);
  }
}

export default EngineResetEvent;