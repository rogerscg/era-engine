/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Ball from './ball.js';
import Stage from './stage.js';
import {
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
  const engine = Engine.get();
  engine.start();
  const scene = engine.getScene();

  // Enable debug.
  new RendererStats(engine.getRenderer());

  // Create environment.
  const environment =
    await new Environment().loadFromFile('/examples/physics/environment.json');
  scene.add(environment);

  // Create stage.
  const stage = new Stage().withPhysics().build();
  scene.add(stage);

  // Create ball.
  const ball = new Ball().build();
  scene.add(ball);

  engine.attachCamera(ball);
  Controls.get().useOrbitControls();
}

document.addEventListener('DOMContentLoaded', start);
