import { Character as EraCharacter } from '../../src/era.js';

/**
 * A maze character.
 */
class Character extends EraCharacter {
  constructor() {
    super();
    this.modelName = 'robot';
    this.idleAnimationName = 'Character|Idling';
    this.walkingAnimationName = 'Character|Walking';
    this.sprintingAnimationName = 'Character|Running';
  }

  /** @override */
  jump() {
    // Jump disabled for this level.
  }
}

export default Character;
