import {Character as EraCharacter} from '../../src/era.js';

class Character extends EraCharacter {
  constructor() {
    super();
    this.modelName = 'robot';
    this.idleAnimationName = 'MainCharacter|Idle';
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
}

export default Character;