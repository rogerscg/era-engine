import Camera from '../core/camera';
import Settings from '../core/settings.js';
import SettingsEvent from '../events/settings_event.js';
import { defaultEraRenderer } from '../core/util';
import * as THREE from 'three';

const CANVAS_HEIGHT = 100;
const CANVAS_WIDTH = 100;
const AXES = ['x', 'y', 'z'];

const CENTER_COMPASS_CSS = `
  height: ${CANVAS_HEIGHT}px;
  width: ${CANVAS_WIDTH}px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  pointer-events: none;
`;

const COORDINATE_CONTAINER_CSS = `
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  font-family: monospace;
  padding: 15px;
  background: rgba(0, 0, 0, .4);
  color: rgb(0, 255, 255);
  display: none;
`;

const COORDINATE_HTML = `
  <div>Camera Coordinates</div>
  <div>
    <div class='era-coord-value era-coord-x'></div>
    <div class='era-coord-value era-coord-y'></div>
    <div class='era-coord-value era-coord-z'></div>
  </div>
`;

/**
 * Provides a direction and position helpers for debugging purposes. Must build
 * its own UI and renderer to update properly.
 */
class DebugCompass {
  constructor(targetRenderer) {
    this.enabled = Settings.get('debug');
    this.targetRenderer = targetRenderer;
    this.createAxisHelper();
    this.createCoordinateHelper();
    SettingsEvent.listen(this.handleSettingsChange.bind(this));
    // TODO: Add parent position coordinates (for precise entity positions).
  }

  /**
   * Creates an axis helper at the center of the target renderer.
   */
  createAxisHelper() {
    // Create debug compass renderer.
    this.container = document.createElement('div');
    this.container.style.cssText = CENTER_COMPASS_CSS;
    // Create renderer.
    this.scene = new THREE.Scene();
    this.debugRenderer = defaultEraRenderer();
    this.debugRenderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    this.container.appendChild(this.debugRenderer.domElement);
    this.targetRenderer.domElement.parentElement.appendChild(this.container);
    this.camera = Camera.get().buildIsometricCamera();
    this.camera.zoom = 500;
    this.camera.updateProjectionMatrix();
    // Add axes helper.
    this.axesHelper = new THREE.AxesHelper();
    this.scene.add(this.axesHelper);
    this.scene.add(this.camera);
  }

  /**
   * Creates a coordinates window at the top left of the renderer.
   */
  createCoordinateHelper() {
    // Create coordinate helper container.
    this.coordinateContainer = document.createElement('div');
    this.coordinateContainer.innerHTML = COORDINATE_HTML;
    this.coordinateContainer.style.cssText = COORDINATE_CONTAINER_CSS;
    this.targetRenderer.domElement.parentElement.appendChild(
      this.coordinateContainer
    );
    this.coordinateDivs = new Map();
    AXES.forEach((axis) => {
      const valueDiv = this.coordinateContainer.getElementsByClassName(
        `era-coord-${axis}`
      )[0];
      this.coordinateDivs.set(axis, valueDiv);
    });

    this.worldPositionDummy = new THREE.Vector3();
  }

  /**
   * Enables renderer stats.
   */
  enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this.coordinateContainer.style.display = 'block';
    this.targetRenderer.domElement.parentElement.appendChild(this.container);
    this.targetRenderer.domElement.parentElement.appendChild(
      this.coordinateContainer
    );
  }

  /**
   * Disables renderer stats.
   */
  disable() {
    if (!this.enabled) {
      return;
    }
    this.enabled = false;
    this.coordinateContainer.style.display = '';
    if (this.targetRenderer.domElement.parentElement) {
      this.targetRenderer.domElement.parentElement.removeChild(this.container);
      this.targetRenderer.domElement.parentElement.removeChild(
        this.coordinateContainer
      );
    }
  }

  /**
   * Updates the debug compass. Called from world updates directly, rather than
   * implicitly from engine updates.
   * @param {THREE.Camera} targetCamera
   */
  update(targetCamera) {
    if (!this.enabled) {
      return;
    }
    // Update axes helper.
    targetCamera.getWorldDirection(this.camera.position);
    this.camera.position.multiplyScalar(-2);
    this.camera.lookAt(this.axesHelper.position);
    this.debugRenderer.render(this.scene, this.camera);

    // Update coordinates.
    targetCamera.getWorldPosition(this.worldPositionDummy);

    AXES.forEach((axis) => {
      const valDiv = this.coordinateDivs.get(axis);
      const value = this.worldPositionDummy[axis];
      valDiv.textContent = `${axis.toUpperCase()}: ${value.toFixed(2)}`;
    });
  }

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

export default DebugCompass;
