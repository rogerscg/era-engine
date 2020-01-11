/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Character from './character.js';
import Stage from './stage.js';
import {
  CannonPhysics,
  Camera,
  Engine,
  Environment,
  Models,
  RendererStats,
  Controls
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
  new CannonPhysics();

  // Create environment.
  const environment =
    await new Environment().loadFromFile('environment.json');
  scene.add(environment);

  // Create arena.
  const stage = new Stage().withPhysics().build();
  scene.add(stage);

  // Create character.
  const character = new Character().build();
  scene.add(character);
  window.character = character;

  engine.attachCamera(character);

  Controls.get().useOrbitControls();
}

document.addEventListener('DOMContentLoaded', start);
