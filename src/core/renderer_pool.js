/**
 * @author rogerscg / https://github.com/rogerscg
 */

import EngineResetEvent from '../events/engine_reset_event.js';

const Types = {
  GAME: 'game',
};

/**
 * A pool of singleton, lazy-loaded WebGL renderers for specific uses.
 */
class RendererPool {
  constructor() {
    this.map = new Map();
    EngineResetEvent.listen(this.handleEngineReset.bind(this));
  }
  
  get(name) {
    if (!this.map.has(name)) {
      return this.createRenderer(name);
    }
    return this.map.get(name);
  }

  /**
   * Creates a new renderer based on the name of the renderer.
   */
  createRenderer(name) {
    let renderer = null;
    switch (name) {
      case Types.GAME:
        renderer = this.createGameRenderer();
        break;
      default:
        renderer = this.createGameRenderer();
    }
    this.map.set(name, renderer);
    return renderer;
  }
  
  /**
   * Creates the main renderer for the game.
   */
  createGameRenderer() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setClearColor(0x111111);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    return renderer;
  }
  
  /**
   * Creates the renderer used for face tiles.
   */
  createGenericRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    return renderer;
  }
  
  /**
   * Handles an engine reset by marking all renderers as not in use.
   */
  handleEngineReset() {}
}

const rendererPool = new RendererPool();
const RendererTypes = Types;

export {
  rendererPool,
  RendererTypes
};
