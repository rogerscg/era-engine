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
  RendererStats
} from '../../src/era.js';

async function start() {
  // Create engine and load models.
  const engine = Engine.get();
  Camera.get().setActiveCamera(Camera.get().buildIsometricCamera());
  engine.start();
  const scene = engine.getScene();

  // Enable debug.
  new RendererStats(engine.getRenderer());

  // Create physics.
  const physics = new AmmoPhysics();

  // Create environment.
  const environment = await new Environment().loadFromFile('environment.json');
  scene.add(environment);

  // Create stage.
  const stage = new Stage().withPhysics().build();
  scene.add(stage);
  physics.registerEntity(stage);

  // Create characters.
  for (let i = 0; i < 4; i++) {
    const ball = new Ball()
      .withPhysics()
      .setPlayerNumber(i)
      .build();
    scene.add(ball);
    physics.registerEntity(ball);
    Controls.get().registerEntity(ball);
  }

  Camera.get().attachCamera(stage);
}

document.addEventListener('DOMContentLoaded', start);
