import Entity from "./entity.js";
import {Bindings} from "./bindings.js";

const CHARACTER_BINDINGS = {
  SPRINT: {
    keys: {
      keyboard: 16,
      controller: '-axes3',
    }
  },
};

const CONTROLS_ID = 'Character';

/**
 * A special entity used for controlling an organic character, such as a human.
 * This is different from a standard entity in its physics and animation
 * behavior.
 */
class Character extends Entity {
  constructor() {
    super();
    this.idleAnimationName = null;
    this.walkingAnimationName = null;
    this.sprintingAnimationName = null;
    // TODO: Make state a common practice in ERA.
    this.state = 'idle';
  }

  /** @override */
  static GetBindings() {
    return new Bindings(CONTROLS_ID)
            .load(CHARACTER_BINDINGS)
            .merge(Entity.GetBindings());
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
    if (this.state == 'idle') {
      return;
    }
    this.state = 'idle';
    this.stopAllAnimation();
    this.playAnimation(this.idleAnimationName);
  }

  /**
   * Marks the character in a walking state.
   */
  walk() {
    if (this.state == 'walking') {
      return;
    }
    this.state = 'walking';
    this.stopAllAnimation();
    this.playAnimation(this.walkingAnimationName);
  }

  /**
   * Marks the character in a sprint state.
   */
  sprint() {
    if (this.state == 'sprinting') {
      return;
    }
    this.state = 'sprinting';
    this.stopAllAnimation();
    this.playAnimation(this.sprintingAnimationName);
  }
}

export default Character;