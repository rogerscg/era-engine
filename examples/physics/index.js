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
  RendererStats,
  Settings
} from '/src/era.js';

async function start() {
  // Load settings.
  await Settings.load();

  // Create engine and load models.
  const engine = Engine.get()
                  .setCamera(Camera.get().buildIsometricCamera());
  engine.start();
  const scene = engine.getScene();

  // Enable debug.
  new RendererStats(engine.getRenderer());

  // Create physics.
  const physics = new AmmoPhysics();

  // Create environment.
  const environment =
    await new Environment().loadFromFile('/examples/physics/environment.json');
  scene.add(environment);

  // Create stage.
  const stage = new Stage().withPhysics().build();
  scene.add(stage);
  physics.registerEntity(stage);

  // Create ball.
  const ball = new Ball().withPhysics().build();
  scene.add(ball);
  physics.registerEntity(ball);
  Controls.get().registerEntity(ball);

  engine.attachCamera(stage);
}

document.addEventListener('DOMContentLoaded', start);
