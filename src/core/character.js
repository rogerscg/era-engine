import Entity from "./entity.js";
import {Bindings} from "./bindings.js";

const CHARACTER_BINDINGS = {
  SPRINT: {
    keys: {
      keyboard: 16,
      controller: '-axes3',
    }
  },
  JUMP: {
    keys: {
      keyboard: 32,
      controller: 'button0',
    }
  },
};

const CONTROLS_ID = 'Character';
const FALL_THRESHOLD = 700;
const JUMP_MIN = 500;
const LAND_MIX_THRESHOLD = 150;
const LAND_SPEED_THRESHOLD = 5;
const LAND_TIME_THRESHOLD = 1500;

/**
 * A special entity used for controlling an organic character, such as a human.
 * This is different from a standard entity in its physics and animation
 * behavior.
 */
class Character extends Entity {
  constructor() {
    super();
    // TODO: Bundle animation names with states.
    this.idleAnimationName = null;
    this.walkingAnimationName = null;
    this.sprintingAnimationName = null;
    this.jumpingAnimationName = null;
    this.fallingAnimationName = null;
    this.landingAnimationName = null;
    this.jumpAction = null;
    this.landAction = null;
    // TODO: Make state a common practice in ERA.
    this.state = 'idle';
    this.grounded = false;
    this.frozen = false;
    this.lastGroundedTime = 0;
    this.jumpTime = 0;
    this.wasFalling = false;
    this.previouslyGrounded = true;
    this.unfreezeTimeout = null;
    this.landingDummy = new THREE.Vector2();
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

  /** @override */
  update() {
    super.update();
    if (this.frozen) {
      this.idle();
      return;
    }
    // Handle grounded/landing state.
    if (!this.grounded) {
      this.previouslyGrounded = false;
      return this.fall();
    } else {
      if (!this.previouslyGrounded && this.wasFalling) {
        this.land();
      }
      this.wasFalling = false;
      this.lastGroundedTime = performance.now();
      this.previouslyGrounded = true;
    }
    if (this.getActionValue(this.bindings.JUMP)) {
      return this.jump();
    }
    if (this.getActionValue(this.bindings.FORWARD) ||
        this.getActionValue(this.bindings.BACKWARD) ||
        this.getActionValue(this.bindings.LEFT) ||
        this.getActionValue(this.bindings.RIGHT)) {
      if (this.getActionValue(this.bindings.SPRINT)) {
        this.sprint();
      } else {
        this.walk();
      }
    } else {
      this.idle();
    }
  }

  /**
   * Freezes the character, preventing it from updating.
   */
  freeze() {
    clearTimeout(this.unfreezeTimeout);
    this.frozen = true;
  }

  /** 
   * Unfreezes the character, allowing updates.
   */
  unfreeze() {
    this.frozen = false;
  }

  /**
   * Sets the character in the idle state.
   */
  idle() {
    if (this.state == 'idle') {
      return;
    }
    if ((performance.now() - this.jumpTime) < JUMP_MIN) {
      return;
    }
    if (this.isLandPlaying()) {
      return;
    }
    this.state = 'idle';
    this.playAnimation(this.idleAnimationName);
  }

  /**
   * Marks the character in a walking state.
   */
  walk() {
    if (this.state == 'walking') {
      return;
    }
    if ((performance.now() - this.jumpTime) < JUMP_MIN) {
      return;
    }
    if (this.isLandPlaying()) {
      return;
    }
    this.state = 'walking';
    this.playAnimation(this.walkingAnimationName);
  }

  /**
   * Marks the character in a sprint state.
   */
  sprint() {
    if (this.state == 'sprinting') {
      return;
    }
    if ((performance.now() - this.jumpTime) < JUMP_MIN) {
      return;
    }
    if (this.isLandPlaying()) {
      return;
    }
    this.state = 'sprinting';
    this.playAnimation(this.sprintingAnimationName);
  }

  /**
   * Marks the character in a jump state.
   */
  jump() {
    if (this.state == 'jumping') {
      return;
    }
    this.state = 'jumping';
    this.jumpTime = performance.now();
    this.jumpAction = this.playAnimation(this.jumpingAnimationName);
    if (!this.jumpAction) {
      return;
    }
    this.jumpAction.loop = THREE.LoopOnce;
    this.jumpAction.clampWhenFinished = true;
    return true;
  }

  /**
   * Marks the character in a falling state.
   */
  fall() {
    if (this.state == 'falling') {
      return;
    }
    if ((performance.now() - this.lastGroundedTime) < FALL_THRESHOLD) {
      return;
    }
    if (this.jumpAction && this.jumpAction.isRunning()) {
      return;
    }
    this.wasFalling = true;
    this.state = 'falling';
    this.playAnimation(this.fallingAnimationName);
  }

  /**
   * Plays landing animation.
   */
  land() {
    const diff = performance.now() - this.lastGroundedTime;
    if (diff < LAND_TIME_THRESHOLD) {
      return;
    }
    this.landingDummy.set(
      this.physicsBody.velocity.x,
      this.physicsBody.velocity.z
    );
    // TODO: We should have a cooler running landing animation like a roll or
    //       stumble.
    if (this.landingDummy.length() > LAND_SPEED_THRESHOLD) {
      return;
    }
    this.landAction = this.playAnimation(this.landingAnimationName);
    if (!this.landAction) {
      return;
    }
    this.landAction.loop = THREE.LoopOnce;
    this.physicsBody.velocity.x = 0;
    this.physicsBody.velocity.z = 0;
    this.tempFreeze(
      1000 * this.landAction.getClip().duration - LAND_MIX_THRESHOLD);
  }

  /**
   * Checks if the landing animation is still playing.
   */
  isLandPlaying() {
    if (!this.landAction) {
      return false;
    }
    const landDiff = this.landAction.getClip().duration - this.landAction.time;
    return landDiff * 1000 > LAND_MIX_THRESHOLD;
  }

  /**
   * Temporarily freezes the character.
   * @param {number} time
   */
  tempFreeze(time) {
    this.freeze();
    this.unfreezeTimeout = setTimeout(() => this.unfreeze(), time);
  }
}

export default Character;