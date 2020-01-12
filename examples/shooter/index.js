/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Character from './character.js';
import Stage from './stage.js';
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
  engine.attachCamera(character);
  Controls.get().registerEntity(character);
  window.character = character;
}

document.addEventListener('DOMContentLoaded', start);
