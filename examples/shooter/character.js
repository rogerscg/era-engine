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
  generatePhysicsBody() {
    const totalHeight = 1.8;
    const mass = 1;
    const radius = .3;
    const height = totalHeight - radius * 2;
    const capsule = new CANNON.Body({mass});
    const cylinderShape = new CANNON.Cylinder(radius, radius, height, 20);
    const axis = new CANNON.Vec3(1, 0, 0);
    const angle = Math.PI / 2;
    const quat = new CANNON.Quaternion();
    quat.setFromAxisAngle(axis, angle);
    capsule.addShape(cylinderShape, new CANNON.Vec3(0, height / 2 + radius, 0), quat);
    const sphereShape = new CANNON.Sphere(radius);
    capsule.addShape(sphereShape, new CANNON.Vec3(0, radius, 0));
    capsule.addShape(sphereShape, new CANNON.Vec3(0, height + radius, 0));
    capsule.fixedRotation = true;
    capsule.updateMassProperties();
    return capsule;
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
    super.update();
  }
}

Controls.get().registerBindings(Character);
export default Character;