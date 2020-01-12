import Entity from "./entity.js";

/**
 * A special entity used for controlling an organic character, such as a human.
 * This is different from a standard entity in its physics and animation
 * behavior.
 */
class Character extends Entity {
  constructor() {
    super();
    this.idleAnimationName = null;
  }

  /** @override */
  build() {
    super.build();
    this.playAnimation(this.idleAnimationName);
    return this;
  }

  /**
   * Sets the character in the idle state.
   */
  idle() {

  }

  /**
   * Marks the character in a walking state.
   */
  walk() {

  }

  /**
   * Marks the character in a sprint state.
   */

}

export default Character;