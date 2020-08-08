/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Character from './character.js';
import Terrain from './terrain.js';
import {
  Camera,
  Controls,
  Engine,
  Environment,
  Models,
  World,
  defaultEraRenderer,
} from '../../build/era.js';

const NUM_PLAYERS = 2;

async function start() {
  // Intialize engine.
  const engine = Engine.get();

  // Load models.
  await Models.get().loadAllFromFile('models.json');

  // Create world.
  const world = new World().withPhysics();

  // Create renderers.
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const renderer = defaultEraRenderer();
    world.addRenderer(renderer, `player-${i + 1}`);
    world.addCameraForRenderer(Camera.get().buildPerspectiveCamera(), renderer);
  }

  engine.start();

  // Create environment.
  const environment = await new Environment().loadFromFile('environment.json');
  world.setEnvironment(environment);

  // Create some basic terrain.
  const terrain = new Terrain().withPhysics();
  await world.add(terrain);

  // Create characters.
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const character = new Character()
      .withPhysics()
      .setPlayerNumber(i)
      .setScale(i == 0 ? 1.0 : 0.2);
    await world.add(character);
    world
      .attachCameraToEntity(character, `player-${i + 1}`)
      .associateEntityWithRenderer(character, `player-${i + 1}`);
    Controls.get().registerEntity(character);
    terrain.placeCharacter(character);
  }
  Controls.get().usePointerLockControls();
}

document.addEventListener('DOMContentLoaded', start);
