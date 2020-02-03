/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Ball from './ball.js';
import Stage from './stage.js';
import {
  AmmoPhysics,
  Camera,
  Controls,
  Engine,
  Environment,
  World
} from '../../src/era.js';

async function start() {
  // Create engine.
  const engine = Engine.get();

  // Create world and renderer.
  const world = new World().withPhysics(new AmmoPhysics());
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.powerPreference = 'high-performance';
  world.addRenderer(renderer);
  world.addCameraForRenderer(Camera.get().buildIsometricCamera(), renderer);

  // Create environment.
  const environment = await new Environment().loadFromFile('environment.json');
  world.setEnvironment(environment);

  // Create stage.
  const stage = new Stage().withPhysics();
  world.add(stage).attachCameraToEntity(stage);

  // Create characters.
  for (let i = 0; i < 4; i++) {
    const ball = new Ball().withPhysics().setPlayerNumber(i);
    world.add(ball);
    Controls.get().registerEntity(ball);
  }

  engine.start();
}

document.addEventListener('DOMContentLoaded', start);
