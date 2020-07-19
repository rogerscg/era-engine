import Plugin from './plugin.js';
import * as THREE from 'three';

let instance = null;

/**
 * The animation library stores animation data for loaded models.
 */
class Animation extends Plugin {
  static get() {
    if (!instance) {
      instance = new Animation();
    }
    return instance;
  }

  constructor() {
    super();
    this.animations = new Map();
    this.mixers = new Map();
    this.lastUpdate = Date.now();
  }

  /** @override */
  update() {
    const currTime = Date.now();
    const diff = currTime - this.lastUpdate;
    this.mixers.forEach((mixer) => mixer.update(diff / 1000));
    this.lastUpdate = currTime;
  }

  /**
   * Stores animations for a given model name.
   * @param {string} name
   * @param {Array<THREE.AnimationClip>} animations
   */
  setAnimations(name, animations) {
    if (!name || !animations) {
      return;
    }
    this.animations.set(name, animations);
  }

  /**
   * Creates an animation mixer for a given name and mesh.
   * @param {string} name
   * @param {THREE.Mesh} mesh
   * @returns {THREE.AnimationMixer}
   */
  createAnimationMixer(name, mesh) {
    if (!name || !mesh || !this.animations.has(name)) {
      return null;
    }
    const mixer = new THREE.AnimationMixer(mesh);
    this.mixers.set(mesh.uuid, mixer);
    return mixer;
  }

  /**
   * Returns all animation clips for a given name.
   * @param {string} name
   */
  getClips(name) {
    return this.animations.get(name);
  }
}

export default Animation;
