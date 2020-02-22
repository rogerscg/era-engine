/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Ball from './ball.js';
import Stage from './stage.js';
import {
  Camera,
  Controls,
  Engine,
  Environment,
  World,
  defaultEraRenderer
} from '../../src/era.js';

async function start() {
  // Create engine.
  const engine = Engine.get();

  // Create world and renderer.
  const world = new World().withPhysics();
  const renderer = defaultEraRenderer();
  world.addRenderer(renderer);
  world.addCameraForRenderer(Camera.get().buildIsometricCamera(), renderer);

  // Create environment.
  const environment = await new Environment().loadFromFile('environment.json');
  world.setEnvironment(environment);

  // Create stage.
  const stage = new Stage();
  world.add(stage).attachCameraToEntity(stage);

  // Create characters.
  for (let i = 0; i < 4; i++) {
    const ball = new Ball().setPlayerNumber(i);
    world.add(ball);
    ball.setPosition(new CANNON.Vec3((i - 2) * 5, 3, 0));
    Controls.get().registerEntity(ball);
  }

  engine.start();
}

document.addEventListener('DOMContentLoaded', start);
