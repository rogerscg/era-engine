import {Bindings, Character as EraCharacter, Controls} from '../../src/era.js';

const CONTROLS_ID = 'Character';

/**
 * A shooter character.
 */
class Character extends EraCharacter {
  constructor() {
    super();
    this.modelName = 'robot';
    this.idleAnimationName = 'MainCharacter|Idle';
    this.walkingAnimationName = 'MainCharacter|Walk';
    this.sprintingAnimationName = 'MainCharacter|Sprint';
  }

  /** @override */
  static GetBindings() {
    return new Bindings(CONTROLS_ID)
             .merge(EraCharacter.GetBindings());
  }

  /** @override */
  getControlsId() {
    return CONTROLS_ID;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 3;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = Math.PI / 2;
    camera.lookAt(this.position);
    Promise.resolve().then(() => camera.position.y = 1.2);
  }

  /** @override */
  update() {
    if (this.getActionValue(this.bindings.FORWARD)) {
      if (this.getActionValue(this.bindings.SPRINT)) {
        this.sprint();
      } else {
        this.walk();
      }
    } else {
      this.idle();
    }
  }
}

Controls.get().registerBindings(Character);
export default Character;