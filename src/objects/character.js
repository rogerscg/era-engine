import CharacterState from './character_state.js';
import Controls from '../core/controls.js';
import Entity from './entity.js';
import MaterialManager from '../physics/material_manager.js';
import Settings from '../core/settings.js';
import { Bindings } from '../core/bindings.js';
import { lerp, vectorToAngle } from '../core/util.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const CHARACTER_BINDINGS = {
  SPRINT: {
    keys: {
      keyboard: 16,
      controller: 'button10',
    },
  },
  JUMP: {
    keys: {
      keyboard: 32,
      controller: 'button0',
    },
  },
  LOOK_X: {
    keys: {
      controller: 'axes2',
    },
  },
  LOOK_Y: {
    keys: {
      controller: 'axes3',
    },
  },
};

const RAYCAST_GEO = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const RAYCAST_MATERIAL = new THREE.MeshLambertMaterial({ color: 0xff0000 });
const RAYCAST_BLUE_MATERIAL = new THREE.MeshLambertMaterial({
  color: 0x0000ff,
});

const CONTROLS_ID = 'Character';

// Default character properties.
const DEFAULT_CAPSULE_OFFSET = 0.2;
const DEFAULT_CAPSULE_RADIUS = 0.25;
const DEFAULT_HEIGHT = 1.8;
const DEFAULT_LERP_FACTOR = 0.5;
const DEFAULT_MASS = 1;
const DEFAULT_FALL_THRESHOLD = 300;
const DEFAULT_JUMP_MIN = 500;
const DEFAULT_LAND_MIX_THRESHOLD = 150;
const DEFAULT_LAND_SPEED_THRESHOLD = 5;
const DEFAULT_LAND_TIME_THRESHOLD = 500;
const DEFAULT_VELO_LERP_FACTOR = 0.15;
const DEFAULT_SPEED = 2.5;
const DEFAULT_SPRINT_MULTIPLIER = 2.5;

/**
 * A special entity used for controlling an organic character, such as a human.
 * This is different from a standard entity in its physics and animation
 * behavior. Note: This is designed exclusively for Cannon.js.
 */
class Character extends Entity {
  constructor() {
    super();
    this.physicsQualityAdjustEnabled = false;
    // The walking speed of the character.
    this.speed = DEFAULT_SPEED;
    // The factor to multiply walking speed by to sprint.
    this.sprintMultiplier = DEFAULT_SPRINT_MULTIPLIER;
    // Make all defaults overrideable by subclasses.
    // Height of the character.
    this.height = DEFAULT_HEIGHT;
    // Offset used for smoother movement. Increase for larger vertical motion.
    this.capsuleOffset = DEFAULT_CAPSULE_OFFSET;
    // Radius of the character's physics capsule.
    this.capsuleRadius = DEFAULT_CAPSULE_RADIUS;
    // Amount of time in ms that the fall animation requires to trigger.
    this.fallThreshold = DEFAULT_FALL_THRESHOLD;
    // The interpolation factor for character raycasting adjustments.
    this.lerpFactor = DEFAULT_LERP_FACTOR;
    // The interpolation factor for character movement.
    this.velocityLerpFactor = DEFAULT_VELO_LERP_FACTOR;
    // The mass of the character.
    this.mass = DEFAULT_MASS;
    // Amount of time in ms required to cancel a jump animation.
    this.jumpMin = DEFAULT_JUMP_MIN;
    // Time in ms before the end of the landing animation that the next
    // animation can start.
    this.landMixThreshold = DEFAULT_LAND_MIX_THRESHOLD;
    // The speed at which a landing animation will be cancelled.
    this.landSpeedThreshold = DEFAULT_LAND_SPEED_THRESHOLD;
    // The amount of time falling in ms that a character needs to endure before
    // triggering a landing action.
    this.landTimeThreshold = DEFAULT_LAND_TIME_THRESHOLD;

    this.animations = new Map();
    this.transitions = new Map();
    this.states = new Map();
    this.registerStates();
    this.jumpAction = null;
    this.landAction = null;

    this.grounded = false;
    this.frozen = false;
    this.lastGroundedTime = 0;
    this.jumpTime = 0;
    this.wasFalling = false;
    this.previouslyGrounded = true;
    this.unfreezeTimeout = null;
    this.landingDummy = new THREE.Vector2();
    this.scale = 1.0;

    // Raycasting properties.
    this.startVec = new CANNON.Vec3();
    this.endVec = new CANNON.Vec3();
    this.ray = new CANNON.Ray(this.startVec, this.endVec);
    this.ray.skipBackfaces = true;
    this.ray.mode = CANNON.Ray.CLOSEST;
    this.ray.collisionFilterMask = ~2;
    this.rayStartBox = new THREE.Mesh(RAYCAST_GEO, RAYCAST_BLUE_MATERIAL);
    this.rayEndBox = new THREE.Mesh(RAYCAST_GEO, RAYCAST_MATERIAL);

    // Input properties.
    this.targetQuaternion = new CANNON.Quaternion();
    this.lerpedVelocity = new THREE.Vector3();
    this.targetVelocity = new THREE.Vector3();
  }

  /** @override */
  static GetBindings() {
    return new Bindings(CONTROLS_ID)
      .load(CHARACTER_BINDINGS)
      .merge(Entity.GetBindings());
  }

  /** @override */
  getControlsId() {
    return CONTROLS_ID;
  }

  /** @override */
  generatePhysicsBody() {
    const capsule = new CANNON.Body({ mass: this.mass });
    // TODO: Remove this collison filter group and make it more explicit to the
    // user.
    capsule.collisionFilterGroup = 2;

    // Create center portion of capsule.
    const height =
      (this.height - this.capsuleRadius * 2 - this.capsuleOffset) * this.scale;
    const cylinderShape = new CANNON.Cylinder(
      this.capsuleRadius * this.scale,
      this.capsuleRadius * this.scale,
      height,
      20
    );
    const quat = new CANNON.Quaternion();
    const cylinderPos =
      height / 2 +
      this.capsuleRadius * this.scale +
      this.capsuleOffset * this.scale;
    capsule.addShape(cylinderShape, new CANNON.Vec3(0, cylinderPos, 0), quat);

    // Create round ends of capsule.
    const sphereShape = new CANNON.Sphere(this.capsuleRadius * this.scale);
    const topPos = new CANNON.Vec3(
      0,
      height +
        this.capsuleRadius * this.scale +
        this.capsuleOffset * this.scale,
      0
    );
    const bottomPos = new CANNON.Vec3(
      0,
      this.capsuleRadius + this.capsuleOffset,
      0
    );
    bottomPos.scale(this.scale, bottomPos);
    capsule.addShape(sphereShape, topPos);
    capsule.addShape(sphereShape, bottomPos);

    // Prevent capsule from tipping over.
    capsule.fixedRotation = true;
    capsule.updateMassProperties();

    capsule.material = MaterialManager.get().createPhysicalMaterial(
      'character',
      {
        friction: 0,
      }
    );
    MaterialManager.get().createContactMaterial('character', 'ground', {
      friction: 0,
      contactEquationStiffness: 1e8,
    });

    // Raycast debug.
    this.toggleRaycastDebug();
    return capsule;
  }

  /** @override */
  async build() {
    await super.build();
    this.visualRoot.scale.setScalar(this.scale);
    this.playAnimation(this.animations.get(this.state));
    return this;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 5;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = Math.PI / 2;
    camera.lookAt(this.visualRoot.position);
    // TODO: Fix this junk.
    Promise.resolve().then(() => (camera.position.y = 1.2));
  }

  /** @override */
  update() {
    super.update();
    this.updateRaycast();
    this.updateState();
    // Update bits.
    if (!this.grounded) {
      this.previouslyGrounded = false;
    } else {
      this.wasFalling = false;
      this.lastGroundedTime = performance.now();
      this.previouslyGrounded = true;
    }
    this.updatePhysics();
  }

  /** @override */
  handleSettingsChange() {
    this.toggleRaycastDebug();
  }

  /**
   * Sets the scale of the character.
   * @param {number} scale
   * @returns {Character}
   */
  setScale(scale) {
    this.scale = scale;
    this.rayEndBox.scale.setScalar(this.scale);
    this.rayStartBox.scale.setScalar(this.scale);
    return this;
  }

  /**
   * Registers states for the character.
   * @returns {Map<string, CharacterState}
   */
  registerStates() {
    const idleState = new CharacterState('idle').withStartFunction(() => {
      this.idle();
    });
    this.addState(idleState);
    const walkingState = new CharacterState('walking')
      .withStartFunction(() => {
        this.walk();
      })
      .withEligibilityFunction(() => {
        return this.isMovementEnabled();
      });
    this.addState(walkingState);
    const runningState = new CharacterState('running')
      .withStartFunction(() => {
        this.run();
      })
      .withEligibilityFunction(() => {
        return this.isMovementEnabled();
      });
    this.addState(runningState);
    const jumpingState = new CharacterState('jumping')
      .withStartFunction(() => {
        this.jump();
      })
      .withEndFunction(() => {
        return !this.isJumpCooldown();
      });
    this.addState(jumpingState);
    const fallingState = new CharacterState('falling')
      .withStartFunction(() => {
        this.fall();
      })
      .withEligibilityFunction(() => {
        return this.shouldFall();
      });
    this.addState(fallingState);
    const landingState = new CharacterState('landing')
      .withStartFunction(() => {
        this.land();
      })
      .withEligibilityFunction(() => {
        return this.shouldLand();
      })
      .withEndFunction(() => {
        return !this.isLandPlaying();
      })
      .withTransition('falling', 'idle');
    this.addState(landingState);
    // TODO: Add rolling state for falling -> running/walking.
  }

  /**
   * Adds a state to the character as well as the animation for the given state.
   * @param {CharacterState} state
   * @returns {Character}
   */
  addState(state) {
    this.states.set(state.name, state);
    state.transitions.forEach((toState, fromState) => {
      if (!this.transitions.has(fromState)) {
        this.transitions.set(fromState, new Map());
      }
      this.transitions.get(fromState).set(toState, state);
    });
    return this;
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
    this.ray.from.y +=
      this.capsuleOffset * this.scale + (this.height * this.scale) / 2;
    this.rayStartBox.position.copy(this.ray.from);
    this.rayEndBox.position.copy(this.ray.to);
    // Intersect against the world.
    this.ray.result.reset();
    this.ray.intersectBodies(
      this.physicsWorld.getWorld().bodies,
      this.ray.result
    );
    if (this.ray.result.hasHit) {
      this.grounded = true;
      const hitDistance = this.ray.result.distance;
      const diff =
        this.capsuleOffset * this.scale +
        (this.height * this.scale) / 2 -
        hitDistance;
      this.rayEndBox.position.y = this.rayStartBox.position.y - hitDistance;
      this.rayEndBox.material.color.setHex(0xff8800);
      // Lerp new position.
      if (this.shouldUseRaycastPosition()) {
        const newY = this.physicsBody.position.y + diff;
        const lerpedY = lerp(
          this.physicsBody.position.y,
          newY,
          this.lerpFactor
        );
        this.physicsBody.position.y = lerpedY;
        this.physicsBody.interpolatedPosition.y = lerpedY;
        this.physicsBody.velocity.y = 0;
      }
    } else {
      this.grounded = false;
      this.rayEndBox.material.color.setHex(0xff0000);
    }
  }

  /**
   * Updates the animation state of the character.
   */
  updateState() {
    // Handle the base case.
    if (this.frozen || !this.state) {
      if (this.states.has('idle')) {
        return this.transitionToState(this.states.get('idle'));
      }
    }
    // Handle grounded/landing state.
    if (!this.grounded) {
      if (this.states.has('falling')) {
        return this.transitionToState(this.states.get('falling'));
      }
    }
    // Handle jump input.
    if (
      this.getActionValue(this.bindings.JUMP) &&
      this.state.name !== 'jumping' &&
      this.grounded
    ) {
      if (this.states.has('jumping')) {
        return this.transitionToState(this.states.get('jumping'));
      }
    }
    if (
      this.getActionValue(this.bindings.FORWARD) ||
      this.getActionValue(this.bindings.BACKWARD) ||
      this.getActionValue(this.bindings.LEFT) ||
      this.getActionValue(this.bindings.RIGHT)
    ) {
      if (this.getActionValue(this.bindings.SPRINT)) {
        if (this.states.has('running')) {
          this.transitionToState(this.states.get('running'));
        }
      } else {
        if (this.states.has('walking')) {
          this.transitionToState(this.states.get('walking'));
        }
      }
    } else {
      if (this.states.has('idle')) {
        this.transitionToState(this.states.get('idle'));
      }
    }
  }

  /**
   * Transitions to the given state, waiting for any mediary states.
   * Returns true if the transition occurred.
   * @param {CharacterState} state
   * @returns {boolean}
   */
  transitionToState(state) {
    if (!state) {
      return false;
    }
    if (this.state === state) {
      return false;
    }
    if (!state.isEligible()) {
      return false;
    }
    // Check for transition states.
    if (this.state) {
      const transitionState = this.transitions
        .get(this.state.name)
        ?.get(state.name);
      if (transitionState && this.states.has(transitionState.name)) {
        if (this.transitionToState(transitionState)) {
          return false;
        }
      }
    }
    // End current state.
    const endSuccess = this.state?.end();
    if (this.state && !endSuccess) {
      return false;
    }
    // Update the current state.
    this.state = state;
    // Start the next state.
    state.start();
    // TODO: Maybe have a "hard interrupt" in case of "falling during slide" or similar
    return true;
  }

  /**
   * Updates the physics state of the character.
   */
  updatePhysics() {
    // Update physics.
    if (this.frozen) {
      return;
    }
    if (this.grounded) {
      this.targetVelocity.x = this.inputVector.x * this.speed;
      this.targetVelocity.z = this.inputVector.z * this.speed;
      if (this.getActionValue(this.bindings.SPRINT)) {
        this.targetVelocity.x *= this.sprintMultiplier;
        this.targetVelocity.z *= this.sprintMultiplier;
      }
      this.targetVelocity.multiplyScalar(this.scale);
      this.lerpedVelocity.copy(this.physicsBody.velocity);
      this.targetVelocity.y = this.physicsBody.velocity.y;
      this.lerpedVelocity.lerp(this.targetVelocity, this.velocityLerpFactor);
      this.physicsBody.velocity.copy(this.lerpedVelocity);
    }
    // Update body rotation.
    if (this.inputVector.x || this.inputVector.z) {
      const angle = vectorToAngle(this.inputVector.z, this.inputVector.x);
      this.targetQuaternion.setFromAxisAngle(CANNON.Vec3.UNIT_Y, angle);
      this.updateRotation();
    }
  }

  /**
   * Updates the rotation of the character.
   */
  updateRotation() {
    this.physicsBody.quaternion.slerp(
      this.targetQuaternion,
      0.1,
      this.physicsBody.quaternion
    );
  }

  /**
   * Checks settings to see if raycast debug should be used.
   */
  toggleRaycastDebug() {
    const world = this.getWorld();
    if (!world) {
      return console.warn('World not set on character');
    }
    if (Settings.get('physics_debug')) {
      const scene = world.getScene();
      scene.add(this.rayStartBox);
      scene.add(this.rayEndBox);
    } else {
      const scene = world.getScene();
      scene.remove(this.rayStartBox);
      scene.remove(this.rayEndBox);
    }
  }

  /**
   * Returns if movement is enabled.
   * @param {boolean}
   */
  isMovementEnabled() {
    return this.grounded && !this.frozen;
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
    this.playAnimation(this.animations.get('idle'));
  }

  /**
   * Marks the character in a walking state.
   */
  walk() {
    this.playAnimation(this.animations.get('walking'));
  }

  /**
   * Marks the character in a running state.
   */
  run() {
    this.playAnimation(this.animations.get('running'));
  }

  /**
   * Marks the character in a jump state.
   */
  jump() {
    this.jumpTime = performance.now();
    this.jumpAction = this.playAnimation(this.animations.get('jumping'));
    if (!this.jumpAction) {
      return;
    }
    this.jumpAction.loop = THREE.LoopOnce;
    this.jumpAction.clampWhenFinished = true;
    return true;
  }

  /**
   * Determines if the jump has been long enough to end. Prevents awkward
   * 'bouncing' from idle to jump states.
   */

  /**
   * Determines eligibility for fall state.
   * @returns {boolean}
   */
  shouldFall() {
    if (performance.now() - this.lastGroundedTime < this.fallThreshold) {
      return false;
    }
    if (this.jumpAction && this.jumpAction.isRunning()) {
      return false;
    }
    return true;
  }

  /**
   * Marks the character in a falling state.
   */
  fall() {
    this.wasFalling = true;
    this.playAnimation(this.animations.get('falling'));
  }

  /**
   * Determines if the landing state is eligible.
   * @returns {boolean}
   */
  shouldLand() {
    const diff = performance.now() - this.lastGroundedTime;
    if (diff < this.landTimeThreshold) {
      return false;
    }
    this.landingDummy.set(
      this.physicsBody.velocity.x,
      this.physicsBody.velocity.z
    );
    if (this.landingDummy.length() > this.landSpeedThreshold) {
      return false;
    }
    return true;
  }

  /**
   * Plays landing animation.
   */
  land() {
    this.landAction = this.playAnimation(this.animations.get('landing'));
    if (this.landAction) {
      this.landAction.loop = THREE.LoopOnce;
      this.tempFreeze(
        1000 * this.landAction.getClip().duration - this.landMixThreshold
      );
    }
    this.physicsBody.velocity.x = 0;
    this.physicsBody.velocity.z = 0;
  }

  /**
   * Checks if the landing animation is still playing.
   */
  isLandPlaying() {
    if (!this.landAction) {
      return false;
    }
    const landDiff = this.landAction.getClip().duration - this.landAction.time;
    return landDiff * 1000 > this.landMixThreshold;
  }

  /**
   * Returns if the jump animation cooldown is still in effect.
   * @return {boolean}
   */
  isJumpCooldown() {
    const diff = performance.now() - this.jumpTime;
    return diff < this.jumpMin;
  }

  /**
   * Temporarily freezes the character.
   * @param {number} time
   */
  tempFreeze(time) {
    this.freeze();
    this.unfreezeTimeout = setTimeout(() => this.unfreeze(), time);
  }

  /**
   * Determines if the raycast position should be used. Useful for actions like
   * jumping.
   * @returns {boolean}
   */
  shouldUseRaycastPosition() {
    if (this.state?.name == 'jumping') {
      return false;
    }
    return true;
  }
}

Controls.get().registerBindings(Character);
export default Character;
