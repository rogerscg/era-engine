import { createUUID } from '../core/util.js';

/**
 * An event target mimicks the behavior of the native browser object EventTarget
 * in an effort to make a simple, traceable event handling system in ERA.
 */
class EventTarget {
  constructor() {
    this.listeners = new Map();
    this.uuidToLabels = new Map();
  }

  /**
   * Adds an event listener to the EventTarget.
   * @param {string} label
   * @param {function} handler
   * @return {string} The UUID for the listener, useful for removing
   */
  addEventListener(label, handler) {
    if (!this.listeners.has(label)) {
      this.listeners.set(label, new Map());
    }
    const uuid = createUUID();
    this.listeners.get(label).set(uuid, handler);
    this.uuidToLabels.set(uuid, label);
    return uuid;
  }

  /**
   * Adds an event listener to the EventTarget that should only be used once
   * and disposed.
   * @param {string} label
   * @param {function} handle
   * @return {string} The UUID for the listener, useful for removing
   */
  addOneShotEventListener(label, handler) {
    const listener = this.addEventListener(label, (data) => {
      this.removeEventListener(listener);
      handler(data);
    });
  }

  /**
   * Removes an event listener from the EventTarget.
   * @param {string} uuid
   */
  removeEventListener(uuid) {
    const label = this.uuidToLabels.get(uuid);
    if (!label) {
      return false;
    }
    this.uuidToLabels.delete(uuid);
    const labelListeners = this.listeners.get(label);
    if (!labelListeners) {
      return false;
    }
    return labelListeners.delete(uuid);
  }

  /**
   * Fires the event on all listeners with given data.
   * @param {string} label
   * @param {Object} data
   */
  dispatchEvent(label, data) {
    const labelListeners = this.listeners.get(label);
    if (!labelListeners) {
      return;
    }
    labelListeners.forEach((handler) => handler(data));
  }
}

export default EventTarget;
