/**
 * Class for creating contact listeners.
 */
class EraContactListener {
  constructor() {
    // A registry of shape and body contact callbacks.
    this.contactCallbacks = new Map();
  }

  /** 
   * Registers a new callback.
   */
  registerHandler(fixture, handler) {
    this.contactCallbacks.set(fixture, handler);
  }

  /** @override */
  BeginContact(contact) {
    const event = {
      type: 'begin',
      contact
    };
    this.determineCallbacks(contact, event);
    
  }

  /** @override */
  EndContact(contact) {
    const event = {
      type: 'end',
      contact
    };
    this.determineCallbacks(contact, event);
  }

  /** @override */
  PreSolve(contact, oldManifold) {}

  /** @override */
  PostSolve(contact, contactImpulse) {
    const event = {
      type: 'postsolve',
      contact,
      contactImpulse
    };
    this.determineCallbacks(contact, event); 
  }

  /**
   * Determines if any callbacks should be made.
   */
  determineCallbacks(contact, event) {
    const callbackA = this.contactCallbacks.get(contact.GetFixtureA());
    if (callbackA) {
      callbackA(event);
    }
    const callbackB = this.contactCallbacks.get(contact.GetFixtureB());
    if (callbackB) {
      callbackB(event);
    }
  }
}

export default EraContactListener;