/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Laser from './laser.js';
import * as ERA from '../../build/era.js';
import * as THREE from 'three';

const COOLDOWN_TIME = 150;
const WORLD_POS_VEC = new THREE.Vector3();

/**
 * Cannons attached to the X-Wing.
 */
class Cannons extends THREE.Object3D {
  /**
   * Takes in two coordinates on which to place the 'cannons'.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  constructor(x, y, z) {
    super();
    // Get cannon positions from X-Wing mesh.
    this.x = x;
    this.y = y;
    this.z = z;
    this.emitters = new Array();
    this.lastFire = Date.now();
  }

  /**
   * Builds all four cannons.
   */
  build() {
    const xs = [this.x, -this.x];
    const ys = [this.y, -this.y];
    xs.forEach((x) => {
      ys.forEach((y) => {
        const emitter = new THREE.Object3D();
        emitter.position.set(x, y, this.z);
        this.add(emitter);
        this.emitters.push(emitter);
      });
    });
    return this;
  }

  /**
   * Fires all four cannons, if they're cooled down.
   */
  fire() {
    if (Date.now() - this.lastFire < COOLDOWN_TIME) {
      return;
    }
    // Play sound.
    ERA.Audio.get().playSound('xwing_fire', 0.5);
    // Create laser at a certain point.
    this.emitters.forEach(async (emitter) => {
      const laser = new Laser();
      await laser.build();
      laser.position.copy(emitter.getWorldPosition(WORLD_POS_VEC));
      ERA.getRootWorld(this).add(laser);
    });
    this.lastFire = Date.now();
  }
}

export default Cannons;
