/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Events from '../core/events.js';

/**
 * Superclass for all custom events within the engine. Utilizes the
 * engine-specific event handling system used for both client and
 * server.
 */
class EraEvent {
  
  constructor(label, data, context) {
    this.label = label;
    this.data = data;
    // TODO: Remove "context" and provide an actual target.
    this.context = context;
  }
  
  /**
   * Fires the event to the events core.
   */
  fire() {
    Events.get().fireEvent(this.label, this.data, this.context);
  }
  
  /**
   * Creates an event listener for the given type.
   */
  static listen(label, callback) {
    Events.get().addListener(label, callback);
  }
  
}

export default EraEvent;