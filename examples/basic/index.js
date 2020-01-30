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
  RendererStats,
  Settings
} from '../../src/era.js';

async function start() {
  // Load settings.
  await Settings.load();

  // Load models.
  await Models.get().loadAllFromFile('models/models.json');

  // Load sounds.
  await Audio.get().loadAllFromFile('sounds/sounds.json');

  // Create engine and load models.
  const engine = Engine.get();
  Camera.get().setActiveCamera(Camera.get().buildPerspectiveCamera());
  engine.start();
  const scene = engine.getScene();

  // Enable debug.
  new RendererStats(engine.getRenderer());

  // Create environment.
  const environment = await new Environment().loadFromFile(
    'environments/space.json'
  );
  scene.add(environment);

  // Create X-Wing.
  const xwing = new XWing().build();
  scene.add(xwing);

  // Attach camera to XWing.
  Camera.get().attachCamera(xwing);
  Controls.get().registerEntity(xwing);
  Controls.get().useOrbitControls();
}

document.addEventListener('DOMContentLoaded', start);
