/**
 * @author rogerscg / https://github.com/rogerscg
 */

import { Audio } from "../../src/era.js";

// Needed due to weird model.
const SCALE = 100;
const X_SHIFT = .4 * SCALE;
const Y_SHIFT = -4.85 * SCALE;

const GEOMETRY = new THREE.CylinderGeometry(.25 * SCALE, .25 * SCALE, 20, 32);
const MATERIAL = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: .9,
});
const BALL_GEOMETRY = new THREE.SphereGeometry(.8 * SCALE, 64, 64);
const BALL_MATERIAL = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  opacity: .1,
  transparent: true,
});

// Light constants.
const DEFAULT_INTENSITY = 10;
const MAX_INTENSITY = 25;
const DEFAULT_DIST = 3;
const MAX_DIST = 3.5;

/**
 * Engines of the X-Wing.
 */
class Engines extends THREE.Object3D {
  /**
   * Takes in two coordinates on which to place the 'cannons'.
   * @param {number} x
   * @param {number} y 
   * @param {number} z 
   */
  constructor(x, y, z) {
    super();
    // Get engine positions from X-Wing mesh.
    this.x = x;
    this.y = y;
    this.z = z;
    this.boosting = false;
    this.engines = new Array();
    this.engineSound = null;
    this.soundAnim = null;
    this.cores = new Array();
    this.lights = new Array();
    window.lights = this.lights;
    this.balls = new Array();
    this.coreAnim = null;
  }

  /**
   * Builds all four cannons.
   */
  build() {
    const xs = [this.x, -this.x];
    const ys = [this.y, -this.y];
    xs.forEach((x) => {
      ys.forEach((y) => {
        const engine = this.buildEngine(x + X_SHIFT, y + Y_SHIFT, this.z);
        this.add(engine);
        this.engines.push(engine);
      });
    });
    return this;
  }

  /**
   * Builds an individual engine.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  buildEngine(x, y, z) {
    const engine = new THREE.Object3D();
    engine.rotation.x += Math.PI / 2;
    const mesh = new THREE.Mesh(GEOMETRY, MATERIAL);
    engine.add(mesh);
    this.cores.push(mesh);
    const ballMesh = new THREE.Mesh(BALL_GEOMETRY, BALL_MATERIAL);
    engine.add(ballMesh);
    this.balls.push(ballMesh);
    const light =
      new THREE.PointLight(0xff0000, DEFAULT_INTENSITY, DEFAULT_DIST, 2);
    engine.add(light);
    this.lights.push(light);
    engine.position.set(x, y, z);
    return engine;
  }

  /**
   * Starts the engines.
   */
  start() {
    this.engineSound = Audio.get().playSoundOnLoop('xwing_engine', 0.4);
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
    this.adjustEngineCore();
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

  /**
   * Adjusts the size of the white core of the engine.
   */
  adjustEngineCore() {
    if (this.coreAnim) {
      this.coreAnim.stop();
    }
    const current = {
      scale: this.cores[0].scale.x,
      intensity: this.lights[0].intensity,
      distance: this.lights[0].distance,
    }
    const target = {
      scale: this.boosting ? 1.4 : 1,
      intensity: this.boosting ? MAX_INTENSITY : DEFAULT_INTENSITY,
      distance: this.boosting ? MAX_DIST : DEFAULT_DIST,
    }
    this.coreAnim = new TWEEN.Tween(current)
      .to(target, 2000)
      .onUpdate(() => {
        this.cores.forEach((core) => core.scale.setScalar(current.scale));
        this.balls.forEach((ball) => ball.scale.setScalar(current.scale));
        this.lights.forEach((light) => {
          light.intensity = current.intensity;
          light.distance = current.distance;
        });
      })
      .start();
  }
}

export default Engines;