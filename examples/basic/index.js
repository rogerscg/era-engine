import XWing from './xwing.js';
import {Engine, Light, Models} from '/src/era.js';

async function start() {
  const engine = Engine.get();
  await Models.get().loadAllFromFile('/examples/basic/models/models.json');
  engine.start();
  engine.enableDebug();

  const light = Light.get();
  light.createAmbientLight({
    color: 0xcccccc,
    intensity: 0.5
  });

  light.createDirectionalLight(500, 1500, 500, 0xffffff, 0.9);
  const scene = engine.getScene();
  const xwing = new XWing().build();
  scene.add(xwing);
  engine.getCamera().position.set(5, 10, 20);
  engine.getCamera().lookAt(xwing.position);
}

document.addEventListener('DOMContentLoaded', start);
