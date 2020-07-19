/**
 * @author rogerscg / https://github.com/rogerscg
 */

import MazeGameMode from './maze_game_mode.js';
import { Engine } from '../../build/era.js';

async function start() {
  // Create engine.
  const engine = Engine.get();

  // Create maze game mode.
  const mazeGame = new MazeGameMode();
  engine.startGameMode(mazeGame);
  mazeGame.onEnd(() => showGameOverScreen());
}

function showGameOverScreen() {
  document.getElementById('game-over').style.display = 'inherit';
}

document.addEventListener('DOMContentLoaded', start);
