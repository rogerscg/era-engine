import {Bindings, Character as EraCharacter, Controls, vectorToAngle, Engine, Camera} from '../../src/era.js';

const CAPSULE_RADIUS = .2;
const CONTROLS_ID = 'Character';
const HEIGHT = 1.8;
const MASS = 1;
// Offset used for smoother movement. Increase for larger vertical motion.
const CAPSULE_OFFSET = .2;

const RAYCAST_GEO = new THREE.BoxGeometry(.2, .2, .2);
const RAYCAST_MATERIAL = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
const RAYCAST_BLUE_MATERIAL = new THREE.MeshLambertMaterial({ color: 0x0000FF });

/**
 * A shooter character.
 * TODO: Rip out mmost of this into a generic character.
 */
class Character extends EraCharacter {
  constructor() {
    super();
    this.modelName = 'robot';
    this.idleAnimationName = 'MainCharacter|Idle';
    this.walkingAnimationName = 'MainCharacter|Walk';
    this.sprintingAnimationName = 'MainCharacter|Sprint';
    this.targetQuaternion = new CANNON.Quaternion();
    this.cameraQuaternion = new THREE.Quaternion();
    this.cameraEuler = new THREE.Euler();
    this.cameraDirection = new THREE.Vector3();
    this.inputVector = new THREE.Vector3();
    this.startVec = new CANNON.Vec3();
    this.endVec = new CANNON.Vec3();
    this.ray = new CANNON.Ray(this.startVec, this.endVec);
    this.ray.skipBackfaces = true;
    this.ray.mode = CANNON.Ray.CLOSEST;
    this.ray.collisionFilterMask = ~2;
    this.rayStartBox = new THREE.Mesh(RAYCAST_GEO, RAYCAST_BLUE_MATERIAL);
    this.rayEndBox = new THREE.Mesh(RAYCAST_GEO, RAYCAST_MATERIAL);
    const scene = Engine.get().getScene();
    //scene.add(this.rayStartBox);
    //scene.add(this.rayEndBox);
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
    const capsule = new CANNON.Body({mass: MASS});
    capsule.collisionFilterGroup = 2;

    // Create center portion of capsule.
    const height = HEIGHT - CAPSULE_RADIUS * 2 - CAPSULE_OFFSET;
    const cylinderShape =
      new CANNON.Cylinder(CAPSULE_RADIUS, CAPSULE_RADIUS, height, 20);
    const quat = new CANNON.Quaternion();
    quat.setFromAxisAngle(CANNON.Vec3.UNIT_X, Math.PI / 2);
    const cylinderPos = height / 2 + CAPSULE_RADIUS + CAPSULE_OFFSET;
    capsule.addShape(cylinderShape, new CANNON.Vec3(0, cylinderPos, 0), quat);

    // Create round ends of capsule.
    const sphereShape = new CANNON.Sphere(CAPSULE_RADIUS);
    const topPos = new CANNON.Vec3(0, height + CAPSULE_RADIUS + CAPSULE_OFFSET, 0);
    const bottomPos = new CANNON.Vec3(0, CAPSULE_RADIUS + CAPSULE_OFFSET, 0);
    capsule.addShape(sphereShape, topPos);
    capsule.addShape(sphereShape, bottomPos);
    
    // Prevent capsule from tipping over.
    capsule.fixedRotation = true;
    capsule.updateMassProperties();
    return capsule;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 5;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = Math.PI / 2;
    camera.lookAt(this.position);
    // TODO: Fix this junk.
    Promise.resolve().then(() => camera.position.y = 1.2);
  }

  /** @override */
  update() {
    this.updateRaycast();
    super.update();
    this.updateCamera();
    // Update physics.
    const inputVector = this.inputVector;
    inputVector.set(0, 0, 0);
    if (this.getActionValue(this.bindings.FORWARD)) {
      inputVector.z -= this.getActionValue(this.bindings.FORWARD);
    }
    if (this.getActionValue(this.bindings.BACKWARD)) {
      inputVector.z += this.getActionValue(this.bindings.BACKWARD);
    }
    if (this.getActionValue(this.bindings.LEFT)) {
      inputVector.x -= this.getActionValue(this.bindings.LEFT);
    }
    if (this.getActionValue(this.bindings.RIGHT)) {
      inputVector.x += this.getActionValue(this.bindings.RIGHT);
    }
    // Update input vector with camera direction.
    const camera = Camera.get().getActiveCamera();
    if (camera) {
      camera.getWorldQuaternion(this.cameraQuaternion);
    }
    // TODO: This is incorrect due to Y-direction affecting camera quaternion.
    inputVector.applyQuaternion(this.cameraQuaternion);
    inputVector.normalize();

    this.physicsBody.velocity.x = inputVector.x * 2.5;
    this.physicsBody.velocity.z = inputVector.z * 2.5;
    if (this.getActionValue(this.bindings.SPRINT)) {
      this.physicsBody.velocity.x *= 2.5;
      this.physicsBody.velocity.z *= 2.5;
    }
    // Update body rotation.
    if (inputVector.x || inputVector.z) {
      const angle = vectorToAngle(inputVector.z, inputVector.x);
      this.targetQuaternion.setFromAxisAngle(CANNON.Vec3.UNIT_Y, angle);
      this.updateRotation();
    }
  }

  /**
   * Raycast to the ground.
   */
  updateRaycast() {
    if (!this.physicsWorld) {
      return;
    }
    // Set up ray targets. Make the origin vector around mid-level.
    this.ray.from.copy(this.physicsBody.interpolatedPosition);
    this.ray.to.copy(this.ray.from);
    this.ray.from.y += CAPSULE_OFFSET + HEIGHT / 2;
    this.rayStartBox.position.copy(this.ray.from);
    this.rayEndBox.position.copy(this.ray.to);
    // Intersect against the world.
    this.ray.result.reset();
    this.ray.intersectBodies(this.physicsWorld.getWorld().bodies, this.ray.result)
    if (this.ray.result.hasHit) {
      const hitDistance = this.ray.result.distance;
      const diff = CAPSULE_OFFSET + HEIGHT / 2 - hitDistance;
      this.rayEndBox.position.y = this.rayStartBox.position.y - hitDistance;
      this.rayEndBox.material.color.setHex(0xFF8800);
      // TODO: This should be lerped in order to provide smoother transitions.
      this.physicsBody.position.y += diff;
      this.physicsBody.interpolatedPosition.y += diff;
      this.physicsBody.velocity.y = 0;
    } else {
      this.rayEndBox.material.color.setHex(0xFF0000);
    }
  }

  /**
   * Updates the camera rotation.
   */
  updateCamera() {
    this.cameraArm.rotation.y -= .01 * this.getMouseMovement().x;
  }

  /**
   * Updates the rotation of the character.
   */
  updateRotation() {
    this.physicsBody.quaternion.slerp(
      this.targetQuaternion, .1, this.physicsBody.quaternion);
  }
}

Controls.get().registerBindings(Character);
export default Character;