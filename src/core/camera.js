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
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  /**
   * Iterates over all cameras and resizes them.
   */
  onWindowResize() {
    this.cameras.forEach((camera) => camera.userData.resize());
  }

  /**
   * Returns the active camera.
   * @returns {THREE.Camera}
   */
  getActiveCamera() {
    const cameras = [...this.cameras.values()];
    return cameras.filter((camera) => camera.userData.active)[0];
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
    camera.userData.resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    this.cameras.set(camera.uuid, camera);
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
    camera.userData.resize = () => {
      camera.left = window.innerWidth / -2;
      camera.right = window.innerWidth / 2;
      camera.top = window.innerHeight / 2;
      camera.bottom = window.innerHeight / -2;
      camera.updateProjectionMatrix();
    };
    this.cameras.set(camera.uuid, camera);
    return camera;
  }
}

export default Camera;