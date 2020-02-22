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
  QualityAdjuster,
  World,
  defaultEraRenderer
} from '../../src/era.js';

async function start() {
  // Load models.
  await Models.get().loadAllFromFile('models.json');

  // Create engine.
  const engine = Engine.get();
  engine.start();

  // Create renderer.
  const renderer = defaultEraRenderer();

  // Build world.
  const world = new World()
    .withPhysics(new CannonPhysics())
    .addRenderer(renderer)
    .addCameraForRenderer(Camera.get().buildPerspectiveCamera())
    .withQualityAdjustment(new QualityAdjuster());

  // Create environment.
  const environment = await new Environment().loadFromFile('environment.json');
  world.setEnvironment(environment);

  // Create arena.
  const stage = new Stage().withPhysics();
  world.add(stage);

  // Create stairs.
  const stairs = new Stairs(0.2, 0.4, 10, 2).withPhysics();
  world.add(stairs);
  stairs.physicsBody.position.set(-5, 0, 6);

  const stairs2 = new Stairs(0.5, 0.8, 5, 2).withPhysics();
  world.add(stairs2);
  stairs2.physicsBody.position.set(-5, 0, 4);

  // Create ramp.
  const ramp = new Ramp().withPhysics();
  world.add(ramp);
  ramp.physicsBody.position.set(3, -1, -3);

  // Create sphere.
  const sphere = new Sphere().withPhysics();
  world.add(sphere);
  sphere.physicsBody.position.set(2, -1, 2);

  // Create some basic terrain.
  const terrain = new Terrain().withPhysics();
  world.add(terrain);
  terrain.physicsBody.position.set(7.5, -0.125, 5);

  // Create character.
  const character = new Character().withPhysics();
  world.add(character).attachCameraToEntity(character);
  Controls.get().registerEntity(character);
  Controls.get().usePointerLockControls();
}

document.addEventListener('DOMContentLoaded', start);
