import EventTarget from '../events/event_target.js';

/**
 * Represents a game that will be run on the engine. The purpose of a game
 * mode is to better control the state of a game as well as assist conditions to
 * start and end a game. Developers should extend GameMode to create their own
 * games.
 */
class GameMode extends EventTarget {
  /**
   * Loads a game mode for the first time. This should include loading necessary
   * models, environment, stages, etc.
   * @async
   */
  async load() {}

  /**
   * Starts the game mode. At this point, all necessary components of the game
   * mode should be readily available.
   * @async
   */
  async start() {}

  /**
   * Ends the game mode. The end function should perform any clean up necessary
   * for the objects created during the game, **not** the items loaded in the
   * load method. This is to prevent any issues with restarting the game mode.
   * @async
   */
  async end() {
    this.dispatchEvent('end');
  }

  /**
   * Restarts the game mode by calling the `end` function, then `start`.
   * @async
   */
  async restart() {
    await this.end();
    await this.start();
  }

  /**
   * Macro fro adding an event listener to the end event.
   * @param {function} handler
   * @return {string} The uuid of the handler.
   */
  onEnd(handler) {
    return this.addEventListener('end', handler);
  }
}

export default GameMode;
