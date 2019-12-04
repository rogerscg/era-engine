import EngineResetEvent from '../events/engine_reset_event.js';
import Settings from './settings.js';
import SettingsEvent from '../events/settings_event.js';
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
    this.fpsEnabled = Settings.get('fps');
    this.started = false;
    this.rendering = false;
    this.plugins = new Set();
    this.entities = new Set();
    // A map of cameras to the entities on which they are attached.
    this.cameras = new Map();
    SettingsEvent.listen(this.handleSettingsChange.bind(this));
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  /**
   * Starts the engine. This is separate from the constructor as it
   * is asynchronous.
   */
  async start() {
    if (this.started) {
      this.reset();
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
    if (this.fpsEnabled) {
      this.enableFpsCounter();
    }
    // Reset all plugins.
    this.plugins.forEach((plugin) => plugin.update(timeStamp));
    new EngineResetEvent().fire();
    this.resetRender = true;
    this.clearScene();
    // TODO: Clean up reset rendering.
    if (!this.rendering) {
      this.rendering = true;
      return this.render();
    } else {
      // If still rendering, prevent the reset and use the old loop.
      this.resetRender = false;
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
    if (this.rendererStats) {
      this.rendererStats.update(this.renderer);
    }
    // Update all plugins.
    this.plugins.forEach((plugin) => plugin.update(timeStamp));
    // Update all entities.
    this.entities.forEach((entity) => entity.update());

    // Check if the render loop should be halted.
    if (this.resetRender) {
      this.resetRender = false;
      this.rendering = false;
      return;
    }
    // Continue the loop.
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
   * Loads settings relevant to the engine.
   */
  handleSettingsChange() {
    if (this.fpsEnabled != Settings.get('fps')) {
      if (Settings.get('fps')) {
        this.fpsEnabled = true;
        this.enableFpsCounter();
      } else {
        this.fpsEnabled = false;
        this.disableFpsCounter();
      }
    }
  }
  
  /**
   * Installs a plugin to receive updates on each engine loop as well as 
   * resets.
   * @param {Plugin} plugin
   */
  installPlugin(plugin) {
    this.plugins.add(plugin);
  }

  /**
   * Registers an entity for engine updates.
   * @param {Entity} entity 
   */
  registerEntity(entity) {
    this.entities.add(entity);
  }

  /**
   * Unregisters an entity for engine updates.
   * @param {Entity} entity 
   */
  unregisterEntity(entity) {
    this.entities.delete(entity);
  }

  /**
   * Attaches the main camera to the given entity.
   * @param {Entity} entity
   */
  attachCamera(entity) {
    if (!entity) {
      return console.warn('No entity provided to attachCamera');
    }
    const camera = this.getCamera();
    const prevEntity = this.cameras.get(camera);
    if (prevEntity) {
      prevEntity.detachCamera(camera);
    }
    entity.attachCamera(camera);
    this.cameras.set(camera, entity);
  }

}

export default Engine;
