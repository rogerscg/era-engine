/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Stage from './stage.js';
import {
  CannonPhysics,
  Camera,
  Controls,
  Engine,
  Environment,
  RendererStats
} from '../../src/era.js';

async function start() {
  // Create engine and load models.
  const engine = Engine.get().setCamera(Camera.get().buildPerspectiveCamera());
  engine.start();
  const scene = engine.getScene();

  // Enable debug.
  new RendererStats(engine.getRenderer());

  // Create physics.
  new CannonPhysics();

  // Create environment.
  const environment =
    await new Environment().loadFromFile('environment.json');
  scene.add(environment);

  // Create arena.
  const stage = new Stage().withPhysics().build();
  scene.add(stage);
  engine.attachCamera(stage);
}

document.addEventListener('DOMContentLoaded', start);
