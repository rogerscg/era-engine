/**
 * @author rogerscg / https://github.com/rogerscg
 */

import LodGameMode from './lod_game_mode.js';
import { Engine } from '../../build/era.js';

async function start() {
  // Create engine.
  const engine = Engine.get();

  // Create game mode.
  const game = new LodGameMode();
  await engine.startGameMode(game);
  hideLoadingScreen();
}

function hideLoadingScreen() {
  const el = document.getElementById('loading');
  el.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', start);
