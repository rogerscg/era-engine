/**
 * @author rogerscg / https://github.com/rogerscg
 */

import XWing from './xwing.js';
import {
  Audio,
  Controls,
  Engine,
  Light,
  Models,
  RendererStats,
  Skybox
} from '/src/era.js';

async function start() {
  // Load models.
  await Models.get().loadAllFromFile('/examples/basic/models/models.json');

  // Load sounds.
  await Audio.get().loadAllFromFile('/examples/basic/sounds/sounds.json');

  // Create engine and load models.
  const engine = Engine.get();
  engine.start();
  const scene = engine.getScene();

  // Enable debug.
  new RendererStats(engine.getRenderer());

  // Create lighting.
  const light = Light.get();
  light.createAmbientLight({
    color: 0xcccccc,
    intensity: 0.7
  });
  light.createDirectionalLight(500, 1500, 500, 0xeeeeee, 0.5);

  // Create skybox.
  const skybox = new Skybox();
  await skybox.load('/examples/basic/textures/skybox', 'starfield', 'tga');
  scene.add(skybox);

  // Create X-Wing.
  const xwing = new XWing().build();
  scene.add(xwing);

  // Attach camera to XWing.
  engine.attachCamera(xwing);
  Controls.get().registerEntity(xwing);
  Controls.get().useOrbitControls();
}

document.addEventListener('DOMContentLoaded', start);
