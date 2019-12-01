import {Entity} from '/src/era.js';

/**
 * Entity representing an X-Wing fighter.
 */
class XWing extends Entity {
  constructor() {
    super();
    this.modelName = 'X-Wing';
  }
}

export default XWing;