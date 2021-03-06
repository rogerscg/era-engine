/**
 * @author rogerscg / https://github.com/rogerscg
 */
import Plugin from '../core/plugin.js';
import TWEEN from '@tweenjs/tween.js';

let instance = null;
/**
 * Plugin for TWEEN.
 * https://github.com/tweenjs/tween.js
 */
class TweenPlugin extends Plugin {
  /**
   * Enforces singleton instance.
   */
  static get() {
    if (!instance) {
      instance = new TweenPlugin();
    }
    return instance;
  }

  constructor() {
    super();
    this.lastTime = performance.now();
  }

  /** @override */
  reset() {
    // Nothing to reset.
  }

  /** @override */
  update(timestamp) {
    TWEEN.update(timestamp);
  }

  /**
   * Creates a Tween for the given args.
   * @param {?} args
   * @return {TWEEN.Tween}
   */
  createTween(...args) {
    return new TWEEN.Tween(args);
  }
}

export default TweenPlugin;
