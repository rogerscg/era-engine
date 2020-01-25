import {createUUID} from '../core/util.js';

/**
 * An event target mimicks the behavior of the native browser object EventTarget
 * in an effort to make a simple, traceable event handling system in ERA. An
 * interface is needed in order to support multiple inheritance between Object3D
 * and EventTarget, specifically for Entities.
 * @interface
 */
class EventTargetInterface {
  constructor() {}
  
  /**
   * Adds an event listener to the EventTarget.
   * @param {string} label
   * @param {function} handler
   * @return {string} The UUID for the listener, useful for removing
   */
  addEventListener(label, handler) {}

  /**
   * Removes an event listener from the EventTarget.
   * @param {string} uuid
   */
  removeEventListener(uuid) {}


  /**
   * Fires the event on all listeners with given data.
   * @param {string} label
   * @param {Object} data
   */
  dispatchEvent(label, data) {}
}

/**
 * A standard event target.
 * @implements {EventTargetInterface}
 */
class EventTarget  {
  constructor() {
    this.listeners = new Map();
    this.uuidToLabels = new Map();
  }

  /** @override */
  addEventListener(label, handler) {
    if (!this.listeners.has(label)) {
      this.listeners.set(label, new Map());
    }
    const uuid = createUUID();
    this.listeners.get(label).set(uuid, handler);
    this.uuidToLabels.set(uuid, label);
    return uuid;
  }

  /** @override */
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

  /** @override */
  dispatchEvent(label, data) {
    const labelListeners = this.listeners.get(label);
    if (!labelListeners) {
      return;
    }
    labelListeners.forEach((handler) => handler(data));
  }
}

/**
 * An EventTarget that extends THREE.Object3D for use by Entities.
 * TODO: Try and reduce duplicate code between these two due to lack of
 *       multiple inheritance in JS.
 * @implements {EventTargetInterface}
 */
class Object3DEventTarget extends THREE.Object3D {
  constructor() {
    super();
    this.listeners = new Map();
    this.uuidToLabels = new Map();
  }

  /** @override */
  addEventListener(label, handler) {
    if (!this.listeners.has(label)) {
      this.listeners.set(label, new Map());
    }
    const uuid = createUUID();
    this.listeners.get(label).set(uuid, handler);
    this.uuidToLabels.set(uuid, label);
    return uuid;
  }

  /** @override */
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

  /** @override */
  dispatchEvent(label, data) {
    const labelListeners = this.listeners.get(label);
    if (!labelListeners) {
      return;
    }
    labelListeners.forEach((handler) => handler(data));
  }
}

export {
  EventTarget,
  Object3DEventTarget,
};
