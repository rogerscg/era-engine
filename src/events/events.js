/**
 * @author rogerscg / https://github.com/rogerscg
 */

import { createUUID } from '../core/util.js';

/**
 * Core implementation for managing events and listeners. This
 * exists out of necessity for a simple event and message system
 * for both the client and the server.
 */

let eventsInstance = null;

class Events {
  /**
   * Enforces singleton instance.
   */
  static get() {
    if (!eventsInstance) {
      eventsInstance = new Events();
    }
    return eventsInstance;
  }

  constructor() {
    // All registered listeners. Key is the event label, value is another
    // map with the listener UUID as the key, the callback function as the
    // value.
    this.registeredListeners = new Map();

    // Tracks which labels a listener is listening to. Used for ease of
    // removal. Key is the listener UUID, value is the event label.
    this.registeredUUIDs = new Map();
  }

  /**
   * Fires all event listener callbacks registered for the label
   * with the event data.
   */
  fireEvent(label, data) {
    const callbacks = this.registeredListeners.get(label);
    if (!callbacks) {
      return false;
    }
    callbacks.forEach((callback) => callback(data));
  }

  /**
   * Adds an event listener for a certain label. When the event is fired,
   * the callback is called with data from the event. Returns the UUID
   * of the listener.
   */
  addListener(label, callback) {
    if (!label || (!callback && typeof callback !== 'function')) {
      return false;
    }
    // If the label has not yet been registered, do so by creating a new map
    // of listener UUIDs and callbacks.
    let listeners = this.registeredListeners.get(label);
    if (!listeners) {
      listeners = new Map();
      this.registeredListeners.set(label, listeners);
    }
    const listenerUUID = createUUID();
    listeners.set(listenerUUID, callback);
    this.registeredUUIDs.set(listenerUUID, label);
    return listenerUUID;
  }

  /**
   * Removes an event listener from registered listeners by its UUID.
   * Returns true if the listener is successfully deleted.
   */
  removeListener(uuid) {
    const label = this.registeredUUIDs.get(uuid);
    if (!label) {
      return false;
    }
    const listeners = this.registeredListeners.get(label);
    if (!listeners) {
      return false;
    }
    return listeners.delete(uuid);
  }
}

export default Events;
