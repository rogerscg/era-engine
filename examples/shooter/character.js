import {Entity} from '../../src/era.js';

class Character extends Entity {
  constructor() {
    super();
    this.modelName = 'robot';
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 10;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = Math.PI / 2;
    camera.lookAt(this.position);
    camera.position.y = 4;
  }
}

export default Character;