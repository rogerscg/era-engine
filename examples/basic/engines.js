/**
 * @author rogerscg / https://github.com/rogerscg
 */

import TWEEN from '../../dependencies/tween.js';
import { ERA } from '../../build/era.module.js';

/**
 * Engines of the X-Wing.
 */
class Engines {
  constructor() {
    this.boosting = false;
    this.engineSound = null;
    this.soundAnim = null;
  }

  /**
   * Starts the engines.
   */
  start() {
    this.engineSound = ERA.Audio.get().playSoundOnLoop('xwing_engine', 0.4);
  }

  /**
   * Boost engines.
   */
  boost(enabled) {
    if (this.boosting == enabled) {
      return;
    }
    this.boosting = enabled;
    this.adjustEngineSound();
  }

  /**
   * Adjusts the engine sound to match boosts.
   */
  adjustEngineSound() {
    if (this.soundAnim) {
      this.soundAnim.stop();
    }
    const rate = this.boosting ? 1.3 : 1;
    this.soundAnim = new TWEEN.Tween(this.engineSound.source.playbackRate)
      .to({ value: rate }, 2000)
      .start();
  }
}

export default Engines;
