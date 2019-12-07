import XWing from './xwing.js';
import {Controls, Engine, Light, Models, Skybox} from '/src/era.js';

async function start() {
  // Create engine and load models.
  const engine = Engine.get();
  await Models.get().loadAllFromFile('/examples/basic/models/models.json');
  engine.start();
  engine.enableDebug();
  const scene = engine.getScene();

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
  window.xwing = xwing;
  Controls.get().registerEntity(xwing);
  Controls.get().useOrbitControls()
}

window.setControls = function() {
  Controls.get().setCustomBinding(xwing.getControlsId(), xwing.bindings.RIGHT, 'keyboard', 84);
}

window.clearControls = function () {
  Controls.get().clearCustomBindingsForAction(xwing.getControlsId(), xwing.bindings.RIGHT, 'keyboard');
}

document.addEventListener('DOMContentLoaded', start);
