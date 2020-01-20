/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Character from './character.js';
import Ramp from './ramp.js';
import Sphere from './sphere.js';
import Stage from './stage.js';
import Stairs from './stairs.js';
import Terrain from './terrain.js';
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

  // Create arena.
  const stage = new Stage().withPhysics().build();
  scene.add(stage);
  physics.registerEntity(stage);

  // Create stairs.
  const stairs = new Stairs(.2, .4, 10, 2).withPhysics().build();
  stairs.physicsBody.position.set(-5, 0, 6);
  scene.add(stairs);
  physics.registerEntity(stairs);

  const stairs2 = new Stairs(.5, .8, 5, 2).withPhysics().build();
  stairs2.physicsBody.position.set(-5, 0, 4);
  scene.add(stairs2);
  physics.registerEntity(stairs2);

  // Create ramp.
  const ramp = new Ramp().withPhysics().build();
  ramp.physicsBody.position.set(3, -1, -3);
  scene.add(ramp);
  physics.registerEntity(ramp);

  // Create sphere.
  const sphere = new Sphere().withPhysics().build();
  sphere.physicsBody.position.set(2, -1, 2);
  scene.add(sphere);
  physics.registerEntity(sphere);

  // Create some basic terrain.
  const terrain = new Terrain().withPhysics().build();
  terrain.physicsBody.position.set(7.5, -.125, 5);
  scene.add(terrain);
  physics.registerEntity(terrain);

  // Create character.
  const character = new Character().withPhysics().build();
  scene.add(character);
  physics.registerEntity(character);
  engine.attachCamera(character);
  Controls.get().registerEntity(character);
  Controls.get().usePointerLockControls();
  window.character = character;
}

document.addEventListener('DOMContentLoaded', start);
