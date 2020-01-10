/**
 * @author rogerscg / https://github.com/rogerscg
 */

import {
  CannonPhysics,
  Camera,
  Controls,
  Engine,
  Environment,
  RendererStats,
  Settings
} from '../../src/era.js';

async function start() {
  // Create engine and load models.
  const engine = Engine.get().setCamera(Camera.get().buildIsometricCamera());
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

}

document.addEventListener('DOMContentLoaded', start);
