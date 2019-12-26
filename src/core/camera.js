let instance = null;
/**
 * Manages camera contruction.
 */
class Camera {
  static get() {
    if (!instance) {
      instance = new Camera();
    }
    return instance;
  }

  /**
   * Builds a default perspective camera.
   * @returns {THREE.PerspectiveCamera}
   */
  buildPerspectiveCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const viewAngle = 70;
    const aspect = width / height;
    const near = 1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
    camera.rotation.order = 'YXZ';
    return camera;
  }

  /**
   * Builds a default isometric camera.
   * @returns {THREE.OrthgraphicCamera}
   */
  buildIsometricCamera() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const near = 1;
    const far = 1000;
    const camera = new THREE.OrthographicCamera(
                    width / -2, width / 2, height / 2, height / -2, near, far);
    camera.zoom = 16;
    camera.updateProjectionMatrix();
    return camera;
  }
}

export default Camera;