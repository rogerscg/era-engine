import Engine from './engine.js';

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
    this.entityCameras = new Map();
    this.activeCamera = null;
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
    return this.activeCamera;
  }

  /**
   * Sets the active camera in the engine.
   * @param {THREE.Camera} camera
   */
  setActiveCamera(camera) {
    if (!camera) {
      return;
    }
    this.activeCamera = camera;
    Engine.get().setCamera(camera);
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
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      near,
      far
    );
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

  /**
   * Attaches the main camera to the given entity.
   * @param {Entity} entity
   */
  attachCamera(entity) {
    if (!entity) {
      return console.warn('No entity provided to attachCamera');
    }
    const camera = this.getActiveCamera();
    const prevEntity = this.entityCameras.get(camera);
    if (prevEntity) {
      prevEntity.detachCamera(camera);
    }
    entity.attachCamera(camera);
    this.entityCameras.set(camera, entity);
  }
}

export default Camera;
