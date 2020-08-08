import { Character as EraCharacter } from '../../build/era.js';

/**
 * A maze character.
 */
class Character extends EraCharacter {
  constructor() {
    super();
    this.modelName = 'robot';
    this.animations.set('idle', 'Character|Idling');
    this.animations.set('walking', 'Character|Walking');
    this.animations.set('running', 'Character|Running');
    this.states.delete('jumping');
  }
}

export default Character;
