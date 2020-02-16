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

  constructor() {
    this.cameras = new Map();
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
    const near = 0.1;
    const far = 2000;
    const camera = new THREE.PerspectiveCamera(viewAngle, aspect, near, far);
    camera.rotation.order = 'YXZ';
    camera.userData.resize = (width, height) => {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
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
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      near,
      far
    );
    camera.zoom = 16;
    camera.updateProjectionMatrix();
    camera.userData.resize = (width, height) => {
      camera.left = width / -2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = height / -2;
      camera.updateProjectionMatrix();
    };
    this.cameras.set(camera.uuid, camera);
    return camera;
  }
}

export default Camera;
