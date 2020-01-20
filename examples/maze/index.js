/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Character from './character.js';
import {
  CannonPhysics,
  Camera,
  Controls,
  Engine,
  Environment,
  Models,
  RendererStats
} from '../../src/era.js';

async function start() {
  // Create engine and load models.
  const engine = Engine.get().setCamera(Camera.get().buildPerspectiveCamera());

  // Load models.
  await Models.get().loadAllFromFile('models.json');

  engine.start();
  const scene = engine.getScene();

  // Enable debug.
  new RendererStats(engine.getRenderer());

  // Create physics.
  const physics = new CannonPhysics().withDebugRenderer();

  // Create environment.
  const environment =
    await new Environment().loadFromFile('environment.json');
  scene.add(environment);

  // Create character.
  const character = new Character().withPhysics(physics).build();
  scene.add(character);
  physics.registerEntity(character);
  engine.attachCamera(character);
  Controls.get().registerEntity(character);
  Controls.get().usePointerLockControls();
}

document.addEventListener('DOMContentLoaded', start);
