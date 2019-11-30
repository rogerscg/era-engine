import Audio from './audio.js';
import Controls from './controls.js';
import EngineResetEvent from '../events/engine_reset_event.js';
import Events from './events.js';
import Light from './light.js';
import Models from './models.js';
import Network from './network.js';
import Physics from './physics.js';
import Settings from './settings.js';
import UI from './ui.js';
import {RendererTypes, rendererPool} from './renderer_pool.js';

const ENABLE_DEBUG = false;

let instance = null;

/**
 * Engine core for the game.
 */
class Engine {
  /**
   * Enforces singleton engine instance.
   */
  static get() {
    if (!instance) {
      instance = new Engine();
    }
    return instance;
  }

  constructor() {
    this.ui = UI.get();
    this.network = Network.get();
    this.fpsEnabled = Settings.get().settingsObject.fps;
    this.pingEnabled = Settings.get().settingsObject.ping;
    this.started = false;
    this.rendering = false;
    if (ENABLE_DEBUG) {
      this.rendererStats = new THREEx.RendererStats();
      this.rendererStats.domElement.style.position = 'absolute';
      this.rendererStats.domElement.style.left = '0px';
      this.rendererStats.domElement.style.bottom = '48px';
      document.body.appendChild(this.rendererStats.domElement);
    }
    this.registeredUpdates = new Map();
    this.settingsListener = Events.get().addListener(
      'settings', this.handleSettingsChange.bind(this)
    );
  }

  getScene() {
    return this.scene;
  }

  /**
   * Starts the engine. This is separate from the constructor as it
   * is asynchronous.
   */
  async start() {
    if (this.started) {
      this.reset();
      return;
    }
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    if (!this.renderer) {
      this.renderer = this.createRenderer();
    }
    if (this.fpsEnabled) {
      this.enableFpsCounter();
    }
    this.camera = this.createCamera();

    this.audio = Audio.get();
    this.light = Light.get();
    this.controls = Controls.get();
    this.physics = Physics.get();
    this.models = Models.get();

    await this.models.loadInitial();
    this.started = true;
    this.rendering = true;
    requestAnimationFrame(() => {
      this.render();
    });
  }

  /**
   * Resets the game engine to its initial state.
   */
  reset() {
    this.light = Light.get();
    this.physics = Physics.get();
    this.camera = this.createCamera();
    if (this.fpsEnabled) {
      this.enableFpsCounter();
    }
    this.started = true;
    if (!this.rendering) {
      this.rendering = true;
      return this.render();
    } else {
      // If still rendering, prevent the reset and use the old loop.
      this.resetRender = false;
    }
  }

  /**
   * Clears the engine to prepare for a reset.
   */
  clear(fromLeave = true) {
    if (!this.scene) {
      return;
    }
    this.clearScene();
    if (this.game) {
      this.game.clear();
      this.game = null;
    }
    new EngineResetEvent().fire();
    this.light.reset();
    this.controls.reset();
    this.physics.terminate();
    if (this.rendering) {
      this.resetRender = true;
    }
  }

  /**
   * Clears the scene.
   */
  clearScene() {
    const scene = this.scene;
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }

  /**
   * The root for all tick updates in the game.
   */
  render(timeStamp) {
    this.renderer.render(this.scene, this.camera);
    TWEEN.update(timeStamp);
    this.physics.update();
    if (this.rendererStats) {
      console.log('render');
      this.rendererStats.update(this.renderer);
    }
    this.registeredUpdates.forEach((object) => object.update(timeStamp));
    if (this.resetRender) {
      this.resetRender = false;
      this.rendering = false;
      return;
    }
    requestAnimationFrame((time) => {
      this.render(time);
    });
  }

  /**
   * Creates the three.js renderer and sets options.
   */
  createRenderer() {
    const renderer = rendererPool.get(RendererTypes.GAME);
    const container = document.getElementById('container');
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    return renderer;
  }

  /**
   * Adjusts the game container and camera for the new window size.
   */
  onWindowResize(e) {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Creates the scene camera.
   */
  createCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const viewAngle = 70;
    const aspect = width / height;
    const near = 1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
    camera.rotation.order = 'YXZ';
    return camera;
  }

  /**
   * FPS stats for development.
   */
  enableFpsCounter() {
    if (this.stats) {
      return;
    }
    this.fpsEnabled = true;
    let stats = new Stats();
    this.stats = stats;
    document.body.appendChild(stats.dom);
    let loop = () => {
      stats.update();
      if (this.fpsEnabled)
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  disableFpsCounter() {
    this.fpsEnabled = false;
    const parent = this.stats.dom.parentElement;
    if (!parent) {
      return;
    }
    parent.removeChild(this.stats.dom);
    this.stats = null;
  }

  enablePingCounter() {
    const element = document.getElementById('ping-text');
    element.style.display = 'inherit';
    const val = document.getElementById('ping-value');
    const loop = () => {
      PingService.get().ping().then((ping) => {
        if (this.pingEnabled) {
          val.innerHTML = ping;
          setTimeout(() => loop(), 1000);
        }
      });
    };
    loop();
  }

  disablePingCounter() {
    const element = document.getElementById('ping-text');
    element.style.display = '';
  }

  /**
   * Handles the settings change event.
   */
  handleSettingsChange(e) {
    const settings = e.settings;
    if (this.fpsEnabled != settings.fps) {
      if (settings.fps) {
        this.fpsEnabled = true;
        this.enableFpsCounter();
      } else {
        this.fpsEnabled = false;
        this.disableFpsCounter();
      }
    }
  }
  
  /**
   * Registers an object for updates on each engine loop.
   */
  registerUpdate(object) {
    this.registeredUpdates.set(object.uuid, object);
  }
}

export default Engine;
