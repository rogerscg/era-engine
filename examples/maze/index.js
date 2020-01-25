/**
 * @author rogerscg / https://github.com/rogerscg
 */

import MazeGameMode from './maze_game_mode.js';
import {
  Engine,
  RendererStats
} from '../../src/era.js';

async function start() {
  // Create engine.
  const engine = Engine.get();
  
  // Enable debug.
  new RendererStats(engine.getRenderer());

  // Create maze game mode.
  const mazeGame = new MazeGameMode();
  engine.startGameMode(mazeGame);
  mazeGame.onEnd(() => showGameOverScreen());
}

function showGameOverScreen() {
  document.getElementById('game-over').style.display = 'inherit';
}

document.addEventListener('DOMContentLoaded', start);
