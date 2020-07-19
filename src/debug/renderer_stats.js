/**
 * @author mrdoob / http://mrdoob.com/
 * @author jetienne / http://jetienne.com/
 * @author rogerscg / https://github.com/rogerscg
 */
import EngineTimer from './engine_timer.js';
import Plugin from '../core/plugin.js';
import Settings from '../core/settings.js';

const STATS_CONTAINER_CSS = `
  bottom: 0;
  position: absolute;
  left: 0;
`;

const WEBGL_CONTAINER_CSS = `
  background-color: #002;
  color: #0ff;
  cursor: pointer;
  font-family: Helvetica,Arial,sans-serif;
  font-size: 9px;
  font-weight: bold;
  line-height: 15px;
  opacity: 0.9;
  padding: 0 0 3px 3px;
  text-align: left;
  width: 80px;
`;

const FPS_CONTAINER_CSS = `
  cursor: pointer;
  opacity: 0.9;
`;

/**
 * A plugin wrapper for WebGL renderer stats and FPS in Three.js.
 */
class RendererStats extends Plugin {
  /**
   * @param {THREE.WebGLRenderer} renderer
   */
  constructor(renderer) {
    super();
    this.renderer = renderer;
    this.enabled = Settings.get('debug');
    this.webGLStats = new WebGLStats(renderer);
    this.fpsStats = new FpsStats();
    this.dom = this.createDom();
    this.dom.appendChild(this.webGLStats.dom);
    this.dom.appendChild(this.fpsStats.dom);
    if (this.enabled) {
      renderer.domElement.parentElement.appendChild(this.dom);
    }
  }

  /**
   * Creates the container DOM.
   */
  createDom() {
    const container = document.createElement('div');
    container.style.cssText = STATS_CONTAINER_CSS;
    return container;
  }

  /**
   * Enables renderer stats.
   */
  enable() {
    this.enabled = true;
    this.renderer.domElement.parentElement.appendChild(this.dom);
  }

  /**
   * Disables renderer stats.
   */
  disable() {
    this.enabled = false;
    if (this.dom.parentElement) {
      this.dom.parentElement.removeChild(this.dom);
    }
  }

  /** @override */
  update() {
    if (!this.enabled) {
      return;
    }
    this.fpsStats.update();
    this.webGLStats.update();
  }

  /** @override */
  reset() {
    this.disable();
  }

  /** @override */
  handleSettingsChange() {
    const currEnabled = Settings.get('debug');
    if (currEnabled && !this.enabled) {
      return this.enable();
    }
    if (!currEnabled && this.enabled) {
      return this.disable();
    }
  }
}

export default RendererStats;

/**
 * Interface for a stats component.
 */
class Stats {
  constructor() {
    this.dom = this.createDom();
  }

  /**
   * Updates the stats DOM.
   */
  update() {
    return console.warn('Stats update function not defined');
  }

  /**
   * Enables the stats DOM.
   */
  enable() {
    return console.warn('Stats enable function not defined');
  }

  /**
   * Disables the stats DOM.
   */
  disable() {
    return console.warn('Stats disable function not defined');
  }
}

class WebGLStats extends Stats {
  constructor(renderer) {
    super();
    this.renderer = renderer;
  }

  /** @override */
  createDom() {
    const container = document.createElement('div');
    container.setAttribute('class', 'render-stats');
    container.style.cssText = WEBGL_CONTAINER_CSS;

    const msText = document.createElement('div');
    msText.innerHTML = 'WebGLRenderer';
    container.appendChild(msText);

    const msTexts = [];
    const nLines = 9;
    for (let i = 0; i < nLines; i++) {
      msTexts[i] = document.createElement('div');
      msTexts[i].style.backgroundColor = '#001632';
      container.appendChild(msTexts[i]);
    }
    this.msTexts = msTexts;
    return container;
  }

  /** @override */
  update() {
    if (!this.msTexts) {
      return;
    }
    const msTexts = this.msTexts;
    let i = 0;
    msTexts[i++].textContent = '=== Memory ===';
    msTexts[i++].textContent =
      'Programs: ' + this.renderer.info.programs.length;
    msTexts[i++].textContent =
      'Geometries: ' + this.renderer.info.memory.geometries;
    msTexts[i++].textContent =
      'Textures: ' + this.renderer.info.memory.textures;

    msTexts[i++].textContent = '=== Render ===';
    msTexts[i++].textContent = 'Calls: ' + this.renderer.info.render.calls;
    msTexts[i++].textContent =
      'Triangles: ' + this.renderer.info.render.triangles;
    msTexts[i++].textContent = 'Lines: ' + this.renderer.info.render.lines;
    msTexts[i++].textContent = 'Points: ' + this.renderer.info.render.points;
  }
}

class FpsStats extends Stats {
  constructor() {
    super();
    this.mode = 0;
    this.fps = 0;
    this.beginTime = (performance || Date).now();
    this.prevTime = this.beginTime;
    this.frames = 0;
  }

  /** @override */
  createDom() {
    // Create root.
    const container = document.createElement('div');
    this.dom = container;
    container.classList.add('render-stats');
    container.style.cssText = FPS_CONTAINER_CSS;

    // Switch panels on click.
    container.addEventListener(
      'click',
      (event) => {
        event.preventDefault();
        this.showPanel(++this.mode % container.children.length);
      },
      false
    );

    this.fpsPanel = this.addPanel(new Panel('FPS', '#0ff', '#002', true));
    this.msPanel = this.addPanel(new Panel('MS', '#0f0', '#020', false));
    this.timerPanel = this.addPanel(
      new Panel('Render', '#ff3800', '#210', false)
    );
    if (window.performance && window.performance.memory) {
      this.memPanel = this.addPanel(new Panel('MB', '#f08', '#201', true));
    }
    this.showPanel(0);
    return container;
  }

  addPanel(panel) {
    this.dom.appendChild(panel.dom);
    return panel;
  }

  showPanel(id) {
    for (let i = 0; i < this.dom.children.length; i++) {
      this.dom.children[i].style.display = i === id ? 'block' : 'none';
    }
    this.mode = id;
  }

  begin() {
    this.beginTime = (performance || Date).now();
  }

  getFPS() {
    return this.fps;
  }

  end() {
    this.frames++;
    const time = (performance || Date).now();
    this.msPanel.update(time - this.beginTime, 30);
    const engStats = EngineTimer.export();
    if (engStats) {
      this.timerPanel.update(engStats.avg, 30);
    }
    if (time >= this.prevTime + 1000) {
      this.fps = (this.frames * 1000) / (time - this.prevTime);
      this.fpsPanel.update(this.fps, 100);
      this.prevTime = time;
      this.frames = 0;
      if (this.memPanel) {
        const memory = performance.memory;
        this.memPanel.update(
          memory.usedJSHeapSize / 1048576,
          memory.jsHeapSizeLimit / 1048576
        );
      }
    }
    return time;
  }

  update() {
    this.beginTime = this.end();
  }
}

// Panel constants.
const PR = Math.round(window.devicePixelRatio || 1);
const WIDTH = 83 * PR;
const HEIGHT = 48 * PR;
const TEXT_X = 3 * PR;
const TEXT_Y = 2 * PR;
const GRAPH_X = 3 * PR;
const GRAPH_Y = 15 * PR;
const GRAPH_WIDTH = 74 * PR;
const GRAPH_HEIGHT = 30 * PR;

/**
 * An individual panel on the FPS stats component.
 */
class Panel {
  constructor(name, fg, bg, shouldRound) {
    this.name = name;
    this.fg = fg;
    this.bg = bg;
    this.min = Infinity;
    this.max = 0;
    this.shouldRound = shouldRound;
    this.createDom();
  }

  createDom() {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.cssText = 'width:83px;height:48px';

    const context = canvas.getContext('2d');
    context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif';
    context.textBaseline = 'top';

    context.fillStyle = this.bg;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = this.fg;
    context.fillText(this.name, TEXT_X, TEXT_Y);
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    context.fillStyle = this.bg;
    context.globalAlpha = 0.9;
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
    this.dom = canvas;
    this.canvas = canvas;
    this.context = context;
  }

  update(value, maxValue) {
    const canvas = this.canvas;
    const context = this.context;
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
    const roundedValue = this.shouldRound
      ? Math.round(value)
      : value.toFixed(2);

    context.fillStyle = this.bg;
    context.globalAlpha = 1;
    context.fillRect(0, 0, WIDTH, GRAPH_Y);
    context.fillStyle = this.fg;
    context.fillText(
      `${roundedValue} ${this.name} (${Math.round(this.min)}-${Math.round(
        this.max
      )})`,
      TEXT_X,
      TEXT_Y
    );

    context.drawImage(
      canvas,
      GRAPH_X + PR,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT,
      GRAPH_X,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT
    );

    context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);

    context.fillStyle = this.bg;
    context.globalAlpha = 0.9;
    context.fillRect(
      GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      Math.round((1 - value / maxValue) * GRAPH_HEIGHT)
    );
  }
}
