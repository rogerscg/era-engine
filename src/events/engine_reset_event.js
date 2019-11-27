import EraEvent from './era_event.js';

const label = 'reset';

/**
 * Engine reset event. Fired when a game has ended and matchmaking should begin.
 */
class EngineResetEvent extends EraEvent {
  constructor() {
    super(label, {});
  }
  
  /** @override */
  static listen(callback) {
    EraEvent.listen(label, callback);
  }
}

export default EngineResetEvent;