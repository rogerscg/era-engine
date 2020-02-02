/**
 * @author rogerscg / https://github.com/rogerscg
 */

import EngineResetEvent from '../events/engine_reset_event.js';

/**
 * A pool of singleton, lazy-loaded WebGL renderers for specific uses.
 */
class RendererPool {
  constructor() {
    this.map = new Map();
  }

  get(name) {
    if (!this.map.has(name)) {
      return this.createRenderer(name);
    }
    return this.map.get(name);
  }

  /**
   * Creates the main renderer for the game.
   */
  createRenderer() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setClearColor(0x111111);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    return renderer;
  }
}

const rendererPool = new RendererPool();

export { rendererPool };
