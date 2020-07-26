import Camera from '../core/camera';
import { defaultEraRenderer } from '../core/util';
import * as THREE from 'three';

const CANVAS_HEIGHT = 100;
const CANVAS_WIDTH = 100;

const CENTER_COMPASS_CSS = `
  height: ${CANVAS_HEIGHT}px;
  width: ${CANVAS_WIDTH}px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  pointer-events: none;
`;

/**
 * Provides a direction and position helpers for debugging purposes. Must build
 * its own UI and renderer to update properly.
 */
class DebugCompass {
  constructor(targetRenderer) {
    this.targetRenderer = targetRenderer;
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
    this.vec3 = new THREE.Vector3();
    // TODO: Add position coordinates.
    // TODO: Add parent position coordinates (for precise entity positions).
  }

  /**
   * Updates the debug compass. Called from world updates directly, rather than
   * implicitly from engine updates.
   * @param {THREE.Camera} targetCamera
   */
  update(targetCamera) {
    targetCamera.getWorldDirection(this.camera.position);
    this.camera.position.multiplyScalar(-2);
    this.camera.lookAt(this.axesHelper.position);
    this.debugRenderer.render(this.scene, this.camera);
  }

  /**
   * Repositions the compass to match the renderer.
   */
  resize() {
    console.warn('Debug compass resize not implemented');
  }
}

export default DebugCompass;
