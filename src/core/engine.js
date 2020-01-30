/**
 * @author rogerscg / https://github.com/rogerscg
 */
import EngineResetEvent from '../events/engine_reset_event.js';
import EngineTimer from '../debug/engine_timer.js';
import Settings from './settings.js';
import SettingsPanel from '../debug/settings_panel.js';
import { RendererTypes, rendererPool } from './renderer_pool.js';

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
    this.started = false;
    this.rendering = false;
    this.plugins = new Set();
    this.entities = new Set();
    this.scene = new THREE.Scene();
    this.renderer = this.createRenderer();
    this.camera = null;

    // Debug.
    this.timer = EngineTimer;
    this.settingsPanel = SettingsPanel;

    // If a physics plugin is installed, don't update entities.
    this.physicsInstalled = false;

    // The current game mode running.
    this.currentGameMode = null;

    // Load engine defaults.
    Settings.loadEngineDefaults();
  }

  getScene() {
    return this.scene;
  }

  getRenderer() {
    return this.renderer;
  }

  /**
   * Sets the camera on the engine.
   * @param {THREE.Camera} camera
   * @returns {Engine}
   */
  setCamera(camera) {
    this.camera = camera;
    return this;
  }

  /**
   * Informs the engine that a physics plugin has been installed.
   * @param {boolean} installed
   */
  setUsingPhysics(installed) {
    this.physicsInstalled = installed;
  }

  /**
   * Starts the engine. This is separate from the constructor as it
   * is asynchronous.
   */
  async start() {
    if (this.started) {
      return;
    }
    this.started = true;
    if (!this.scene) {
      console.error('No scene provided');
    }
    if (!this.renderer) {
      console.error('No renderer provided');
    }
    if (!this.camera) {
      console.error('No camera provided');
    }
    this.rendering = true;
    requestAnimationFrame(() => this.render());
  }

  /**
   * Resets the game engine to its initial state.
   */
  reset() {
    // Reset all plugins.
    this.plugins.forEach((plugin) => plugin.reset());
    new EngineResetEvent().fire();
    // Destroy all registered entities.
    this.entities.forEach((entity) => entity.destroy());
    // Clear the renderer.
    this.resetRender = true;
    this.clearScene();
    this.started = false;
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
    this.timer.start();
    if (this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
    TWEEN.update(timeStamp);
    // Update all plugins.
    this.plugins.forEach((plugin) => plugin.update(timeStamp));
    // Update all entities, if physics is not enabled. This is due to physics
    // handling updates on its own.
    // TODO: Separate physics updates from entity updates.
    if (!this.physicsInstalled) {
      this.entities.forEach((entity) => entity.update());
    }

    // Check if the render loop should be halted.
    if (this.resetRender) {
      this.resetRender = false;
      this.rendering = false;
      return;
    }
    this.timer.end();
    // Continue the loop.
    requestAnimationFrame((time) => this.render(time));
  }

  /**
   * Creates the three.js renderer and sets options.
   * TODO: This is too restricting from a developer's point of view. Refactor
   *   this to give more flexibility.
   */
  createRenderer() {
    const renderer = rendererPool.get(RendererTypes.GAME);
    const container = document.getElementById('container');
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    return renderer;
  }

  /**
   * Adjusts the renderer for the new window size.
   */
  onWindowResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
   * Loads and starts a game mode.
   * @param {GameMode} gameMode
   * @async
   */
  async startGameMode(gameMode) {
    await gameMode.load();
    await gameMode.start();
    this.start();
  }
}

export default Engine;
