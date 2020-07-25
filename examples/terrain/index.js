/**
 * @author rogerscg / https://github.com/rogerscg
 */

import TerrainGameMode from './terrain_game_mode.js';
import { Engine } from '../../build/era.js';

async function start() {
  // Create engine.
  const engine = Engine.get();

  // Create game mode.
  const game = new TerrainGameMode();
  await engine.startGameMode(game);
  hideLoadingScreen();
}

function hideLoadingScreen() {
  const el = document.getElementById('loading');
  el.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', start);
