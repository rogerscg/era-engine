/**
 * @author rogerscg / https://github.com/rogerscg
 */
import EngineResetEvent from '../events/engine_reset_event.js';
import EngineTimer from '../debug/engine_timer.js';
import Settings from './settings.js';
import SettingsPanel from '../debug/settings_panel.js';

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

    // Debug.
    this.timer = EngineTimer;
    this.settingsPanel = SettingsPanel;

    // The current game mode running.
    this.currentGameMode = null;

    // Load engine defaults.
    Settings.loadEngineDefaults();
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
    // Clear the renderer.
    this.resetRender = true;
    this.started = false;
  }

  /**
   * The root for all tick updates in the game.
   */
  render(timeStamp) {
    this.timer.start();
    TWEEN.update(timeStamp);
    // Update all plugins.
    this.plugins.forEach((plugin) => plugin.update(timeStamp));

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
   * Installs a plugin to receive updates on each engine loop as well as
   * resets.
   * @param {Plugin} plugin
   */
  installPlugin(plugin) {
    this.plugins.add(plugin);
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
