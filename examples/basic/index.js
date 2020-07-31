/**
 * @author rogerscg / https://github.com/rogerscg
 */

import XWing from './xwing.js';
import * as ERA from '../../build/era.js';

async function start() {
  // Load settings.
  await ERA.Settings.load();

  // Load models.
  await ERA.Models.get().loadAllFromFile('models/models.json');

  // Load sounds.
  await ERA.Audio.get().loadAllFromFile('sounds/sounds.json');

  // Create engine.
  const engine = ERA.Engine.get();

  // Install TWEEN plugin.
  ERA.TweenPlugin.get();

  // Create world.
  const world = new ERA.World();

  // Build renderer.
  const renderer = ERA.defaultEraRenderer();
  world.addRenderer(renderer);
  world.addCameraForRenderer(
    ERA.Camera.get().buildPerspectiveCamera(),
    renderer
  );

  engine.start();

  // Create environment.
  const environment = await new ERA.Environment().loadFromFile(
    'environments/space.json'
  );
  world.setEnvironment(environment);

  // Create X-Wing.
  const xwing = new XWing();
  await world.add(xwing);
  world.attachCameraToEntity(xwing);
  ERA.Controls.get().registerEntity(xwing);
  ERA.Controls.get().useOrbitControls(world.getCamera(), world.getRenderer());
}

document.addEventListener('DOMContentLoaded', start);
