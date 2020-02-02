import Plugin from './plugin.js';
import RendererStats from '../debug/renderer_stats.js';

/**
 * Represents a world used to both manage rendering and physics simulations.
 */
class World extends Plugin {
  constructor() {
    super();
    this.scene = new THREE.Scene();
    this.physics = null;
    this.renderers = new Map();
    this.cameras = new Map();
    this.camerasToRenderers = new Map();
    this.entities = new Set();
    this.entityCameras = new Map();
    this.entitiesToRenderers = new Map();
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  /** @override */
  update() {
    // Update all entities, if physics is not enabled. This is due to physics
    // handling updates on its own.
    // TODO: Separate physics updates from entity updates.
    if (!this.physics) {
      this.entities.forEach((entity) => entity.update());
    }

    // Update all renderers.
    this.camerasToRenderers.forEach((renderer, camera) =>
      renderer.render(this.scene, camera)
    );
  }

  /** @override */
  reset() {
    this.entities.forEach((entity) => entity.destroy());
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
  }

  getScene() {
    return this.scene;
  }

  getPhysics() {
    return this.physics;
  }

  /**
   * Iterates over all cameras and resizes them.
   */
  onWindowResize() {
    // Set timeout in order to allow the renderer dom element to resize.
    setTimeout(() => {
      this.cameras.forEach((camera) => {
        let width = window.innerWidth;
        let height = window.innerHeight;
        const renderer = this.camerasToRenderers.get(camera);
        if (renderer) {
          const rect = renderer.domElement.getBoundingClientRect();
          width = rect.width;
          height = rect.height;
        }
        camera.userData.resize(width, height);
      });
    });
  }

  /**
   * Adds a physics implementation instance to the world.
   * @param {Physics} physics
   * @return {World}
   */
  withPhysics(physics) {
    this.physics = physics;
    return this;
  }

  /**
   * Adds a renderer that is used to display the world as well as the name of
   * the renderer. This name is used for finding the element in the DOM to which
   * the renderer should be attached via the data-renderer attribute.
   * @param {THREE.WebGLRenderer} renderer
   * @param {string} name
   * @return {World}
   */
  addRenderer(renderer, name) {
    if (!renderer || !name) {
      return console.error('Need both renderer and name for world.');
    }
    const container = document.querySelector(`[data-renderer='${name}']`);
    if (!container) {
      return console.error(`Element with data-renderer ${name} not found.`);
    }
    const rect = container.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height);
    container.appendChild(renderer.domElement);
    window.addEventListener(
      'resize',
      () => {
        const rect = container.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height);
      },
      false
    );
    renderer.name = name;
    new RendererStats(renderer);
    this.renderers.set(name, renderer);
    return this;
  }

  /**
   * Adds a camera for a specific renderer. If a renderer isn't specified, add
   * for all renderers.
   * @param {THREE.Camera} camera
   * @param {THREE.WebGLRenderer} renderer
   * @return {World}
   */
  addCameraForRenderer(camera, renderer) {
    if (!camera) {
      return this;
    }
    if (!renderer) {
      this.renderers.forEach((renderer) =>
        this.addCameraForRenderer(camera, renderer)
      );
      return this;
    }
    if (!renderer.name || !this.renderers.has(renderer.name)) {
      console.error('Passed renderer not created in world');
      return this;
    }
    this.cameras.set(renderer.name, camera);
    this.camerasToRenderers.set(camera, renderer);
    // Fire a resize event to adjust camera to renderer.
    this.onWindowResize();
    return this;
  }

  /**
   * Adds an entity or other ERA object to the world.
   * @param {Entity} entity
   * @return {World}
   */
  add(entity) {
    if (this.entities.has(entity)) {
      console.warn('Entity already added to the world');
      return this;
    }
    if (entity.physicsEnabled) {
      entity.registerPhysicsWorld(this.physics);
    }
    entity.setWorld(this);
    entity.build();
    this.entities.add(entity);
    this.scene.add(entity);
    if (entity.physicsEnabled) {
      this.physics.registerEntity(entity);
    }
    return this;
  }

  /**
   * Removes an entity from the ERA world.
   * @param {Entity} entity
   * @return {World}
   */
  remove(entity) {
    if (this.physics && entity.physicsEnabled) {
      this.physics.unregisterEntity(entity);
    }
    this.scene.remove(entity);
    this.entities.delete(entity);
    if (entity.getWorld() == this) {
      entity.setWorld(null);
    }
    return this;
  }

  /**
   * Request to attach the camera with the given name to the provided entity.
   * @param {string} cameraName
   * @param {Entity} entity
   * @return {World}
   */
  attachCameraToEntity(cameraName, entity) {
    if (!entity || !this.cameras.has(cameraName)) {
      console.warn(`Camera with name ${cameraName} does not exist`);
      return this;
    }
    const camera = this.cameras.get(cameraName);
    const prevEntity = this.entityCameras.get(camera);
    if (prevEntity) {
      prevEntity.detachCamera(camera);
    }
    entity.attachCamera(camera);
    this.entityCameras.set(camera, entity);
    return this;
  }

  /**
   * Associates an entity with a renderer for controls purposes, i.e. the
   * direction a camera is facing in a split-screen tile.
   * @param {Entity} entity
   * @param {string} name
   * @return {World}
   */
  associateEntityWithRenderer(entity, name) {
    if (!entity || !name) {
      console.error('Need to provide entity and name to associate');
      return this;
    }
    if (!this.entities.has(entity) || !this.renderers.has(name)) {
      console.error('Both entity and renderer need to be registered to world');
      return this;
    }
    this.entitiesToRenderers.set(entity, name);
    return this;
  }

  /**
   * Finds the associated camera, aka the camera used by the main "controlling"
   * renderer, for a given entity. Any value returned will be a result of
   * associating a renderer and camera with a given entity in the world.
   * @param {Entity} entity
   * @return {THREE.Camera}
   */
  getAssociatedCamera(entity) {
    const name = this.entitiesToRenderers.get(entity);
    if (!name) {
      return null;
    }
    return this.cameras.get(name);
  }
}

export default World;
