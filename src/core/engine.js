import Audio from './audio.js';
import Controls from './controls.js';
import EngineResetEvent from '../events/engine_reset_event.js';
import Events from './events.js';
import Models from './models.js';
import Network from './network.js';
import Physics from './physics.js';
import Settings from './settings.js';
import UI from './ui.js';
import {RendererTypes, rendererPool} from './renderer_pool.js';

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
    // Lazy-load all important components.
    this.ui = UI.get();
    this.network = Network.get();
    this.audio = Audio.get();
    this.controls = Controls.get();
    this.physics = Physics.get();
    this.models = Models.get();
    this.fpsEnabled = Settings.get().settingsObject.fps;
    this.started = false;
    this.rendering = false;
    this.registeredUpdates = new Map();
    this.settingsListener = Events.get().addListener(
      'settings', this.handleSettingsChange.bind(this)
    );
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
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
   * Enables both FPS and renderer stats.
   */
  enableDebug() {
    this.enableFpsCounter();
    this.enableRenderStats();
  }

  disableDebug() {
    this.disableFpsCounter();
    this.disableRenderStats();
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

  enableRenderStats() {
    this.rendererStats = new THREEx.RendererStats();
    this.rendererStats.domElement.style.position = 'absolute';
    this.rendererStats.domElement.style.right = '0';
    this.rendererStats.domElement.style.bottom = '0';
    document.body.appendChild(this.rendererStats.domElement);
  }

  disableRenderStats() {
    document.body.removeChild(this.rendererStats.domElement);
    this.rendererStats = null;
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
