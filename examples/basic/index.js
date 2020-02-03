/**
 * @author rogerscg / https://github.com/rogerscg
 */

import XWing from './xwing.js';
import {
  Audio,
  Camera,
  Controls,
  Engine,
  Environment,
  Models,
  Settings,
  World
} from '../../src/era.js';

async function start() {
  // Load settings.
  await Settings.load();

  // Load models.
  await Models.get().loadAllFromFile('models/models.json');

  // Load sounds.
  await Audio.get().loadAllFromFile('sounds/sounds.json');

  // Create engine.
  const engine = Engine.get();

  // Create world.
  const world = new World();

  // Build renderer.
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.powerPreference = 'high-performance';
  renderer.setPixelRatio(window.devicePixelRatio);
  world.addRenderer(renderer);
  world.addCameraForRenderer(Camera.get().buildPerspectiveCamera(), renderer);

  engine.start();

  // Create environment.
  const environment = await new Environment().loadFromFile(
    'environments/space.json'
  );
  world.setEnvironment(environment);

  // Create X-Wing.
  const xwing = new XWing();
  world.add(xwing).attachCameraToEntity(xwing);
  Controls.get().registerEntity(xwing);
  Controls.get().useOrbitControls(world.getCamera(), world.getRenderer());
}

document.addEventListener('DOMContentLoaded', start);
