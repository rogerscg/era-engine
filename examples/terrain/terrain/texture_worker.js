import noise from '../../../dependencies/perlin.js';
import * as Comlink from '../../../dependencies/comlink.js';

/**
 * Generates a texture for a terrain tile. This is meant to be run in a
 * WebWorker with Comlink.
 */
class TextureGenerator {
  constructor() {
    // Set perlin noise seed.
    noise.seed(0xbada55);
  }
}

Comlink.expose(TextureGenerator);
