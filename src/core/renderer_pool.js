import EngineResetEvent from '../events/engine_reset_event.js';

const Types = {
  GAME: 'game',
  MINIMAP: 'minimap',
  BACKGROUND: 'background',
  STAGE: 'stage',
  TILE: 'tile',
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
    if (name == Types.TILE) {
      return this.getOrCreateTileRenderer();
    }
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
      case Types.STAGE:
      case Types.MINIMAP:
      case Types.BACKGROUND:
        renderer = this.createGenericRenderer();
        break;
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
    renderer.gammaOutput = true;
    renderer.gammaInput = true;
    renderer.setClearColor(0x111111);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
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
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    return renderer;
  }
  
  /**
   * Retrives a tile renderer from the pool if it exists. If not, creates a new
   * one.
   */
  getOrCreateTileRenderer() {
    if (!this.map.has(Types.TILE)) {
      this.map.set(Types.TILE, new Set());
    }
    const pool = this.map.get(Types.TILE);
    let found = null;
    pool.forEach((renderer) => {
      if (!renderer.inUse && !found) {
        found = renderer;
      }
    });
    if (!found) {
      found = this.createGenericRenderer();
      pool.add(found);
    }
    found.inUse = true;
    return found;
  }
  
  /**
   * Handles an engine reset by marking all renderers as not in use.
   */
  handleEngineReset() {
    const tilePool = this.map.get(Types.TILE);
    if (!tilePool) {
      return;
    }
    tilePool.forEach((renderer) => renderer.inUse = false);
  }
}

const rendererPool = new RendererPool();
const RendererTypes = Types;

export {
  rendererPool,
  RendererTypes
};
