import { Character as EraCharacter } from '../../src/era.js';

/**
 * A shooter character.
 */
class Character extends EraCharacter {
  constructor() {
    super();
    this.modelName = 'robot';
    this.idleAnimationName = 'Character|Idling';
    this.walkingAnimationName = 'Character|Walking';
    this.sprintingAnimationName = 'Character|Running';
    this.fallingAnimationName = 'Character|Falling';
    this.landingAnimationName = 'Character|Landing';
  }

  /** @override */
  update() {
    super.update();
    this.updateCamera();
  }

  /** @override */
  jump() {
    // Disable jumping for this demo.
  }

  /**
   * Updates the camera rotation.
   */
  updateCamera() {
    this.cameraArm.rotation.y -= 0.01 * this.getMouseMovement().x;
  }
}

export default Character;
