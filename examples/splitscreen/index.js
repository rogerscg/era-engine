/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Character from './character.js';
import Terrain from './terrain.js';
import {
  CannonPhysics,
  Camera,
  Controls,
  Engine,
  Environment,
  Models,
  World
} from '../../src/era.js';

const NUM_PLAYERS = 2;

async function start() {
  // Intialize engine.
  const engine = Engine.get();

  // Load models.
  await Models.get().loadAllFromFile('models.json');

  // Create world.
  const world = new World().withPhysics(new CannonPhysics());

  // Create renderers.
  for (let i = 0; i < NUM_PLAYERS; i++) {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setPixelRatio(window.devicePixelRatio);
    world.addRenderer(renderer, `player-${i + 1}`);
    world.addCameraForRenderer(Camera.get().buildPerspectiveCamera(), renderer);
  }

  engine.start();

  // Create environment.
  const environment = await new Environment().loadFromFile('environment.json');
  world.add(environment);

  // Create some basic terrain.
  const terrain = new Terrain().withPhysics();
  world.add(terrain);

  // Create character.
  const character = new Character().withPhysics();
  world
    .add(character)
    .attachCameraToEntity('player-1', character)
    .associateEntityWithRenderer(character, 'player-1');
  Controls.get().registerEntity(character);
  Controls.get().usePointerLockControls();
}

document.addEventListener('DOMContentLoaded', start);
