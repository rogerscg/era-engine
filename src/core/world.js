/**
 * @author rogerscg / https://github.com/rogerscg
 */
import DebugCompass from '../debug/debug_compass.js';
import Plugin from './plugin.js';
import QualityAdjuster from './quality_adjuster.js';
import RendererStats from '../debug/renderer_stats.js';
import PhysicsPlugin from '../physics/physics_plugin.js';
import * as THREE from 'three';

const DEFAULT_NAME = 'main';

/**
 * Represents a world used to both manage rendering and physics simulations.
 */
class World extends Plugin {
  constructor() {
    super();
    this.scene = new THREE.Scene();
    // Set an `isRootScene` bit for use by other parts of ERA.
    this.scene.isRootScene = true;
    this.scene.parentWorld = this;
    this.physics = null;
    this.renderers = new Map();
    this.cameras = new Map();
    this.camerasToRenderers = new Map();
    this.entities = new Set();
    this.entityCameras = new Map();
    this.entitiesToRenderers = new Map();
    this.debugCompassMap = new Map();
    window.addEventListener('resize', this.onWindowResize.bind(this), false);

    // A utility for adjusting quality on world entities.
    this.qualityAdjuster = null;
  }

  /**
   * Enables quality adjustment for the world.
   * @param {QualityAdjuster} qualityAdjuster
   * @return {World}
   */
  withQualityAdjustment(qualityAdjuster) {
    qualityAdjuster.setWorld(this);
    this.qualityAdjuster = qualityAdjuster;
    return this;
  }

  /** @override */
  update() {
    // Update all entities, if physics is not enabled. This is due to physics
    // handling updates on its own.
    // TODO: Separate physics updates from entity updates.
    this.entities.forEach((entity) => {
      if (!entity.physicsBody) {
        entity.update();
      }
    });

    // Update all renderers.
    this.camerasToRenderers.forEach((renderer, camera) => {
      renderer.render(this.scene, camera);
      const compass = this.debugCompassMap.get(renderer);
      compass.update(camera);
    });

    // Update quality.
    if (this.qualityAdjuster) {
      this.qualityAdjuster.update();
    }
  }

  /** @override */
  reset() {
    this.entities.forEach((entity) => entity.destroy());
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }

  getScene() {
    return this.scene;
  }

  getPhysics() {
    return this.physics;
  }

  /**
   * Retrieves the camera with the given name.
   * @param {string} name
   */
  getCamera(name = DEFAULT_NAME) {
    return this.cameras.get(name);
  }

  /**
   * Retrieves a renderer with the given name.
   * @param {string} name
   */
  getRenderer(name = DEFAULT_NAME) {
    return this.renderers.get(name);
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
   * @return {World}
   */
  withPhysics() {
    this.physics = new PhysicsPlugin();
    this.physics.setEraWorld(this);
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
  addRenderer(renderer, name = DEFAULT_NAME) {
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
    const debugCompass = new DebugCompass(renderer);
    this.debugCompassMap.set(renderer, debugCompass);
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
   * Sets the environment of the world.
   * @param {Environment} environment
   * @return {World}
   */
  setEnvironment(environment) {
    this.add(environment);
    this.renderers.forEach((renderer) =>
      renderer.setClearColor(environment.getClearColor())
    );
    if (environment.getFog()) {
      this.scene.fog = environment.getFog();
    }
    return this;
  }

  /**
   * Adds an entity or other ERA object to the world.
   * @param {Entity} entity
   * @return {World}
   * @async
   */
  async add(entity) {
    if (this.entities.has(entity)) {
      console.warn('Entity already added to the world');
      return this;
    }
    if (entity.physicsBody) {
      entity.registerPhysicsWorld(this.physics);
    }
    entity.setWorld(this);
    await entity.build();
    this.entities.add(entity);
    this.scene.add(entity);
    if (entity.physicsBody) {
      this.physics.registerEntity(entity);
    }
    entity.onAdd();
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
    entity.onRemove();
    return this;
  }

  /**
   * Enables entity physics within the world. Used for quality adjustment.
   * @param {Entity} entity
   */
  enableEntityPhysics(entity) {
    if (this.physics && entity.physicsEnabled && entity.physicsBody) {
      entity.registerPhysicsWorld(this.physics);
      this.physics.registerEntity(entity);
    }
  }

  /**
   * Disables entity physics within the world. Used for quality adjustment.
   * @param {Entity} entity
   */
  disableEntityPhysics(entity) {
    if (this.physics && entity.physicsEnabled && entity.physicsBody) {
      this.physics.unregisterEntity(entity);
    }
  }

  /**
   * Request to attach the camera with the given name to the provided entity.
   * @param {Entity} entity
   * @param {string} cameraName
   * @return {World}
   */
  attachCameraToEntity(entity, cameraName = DEFAULT_NAME) {
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
  associateEntityWithRenderer(entity, name = DEFAULT_NAME) {
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
    let name = this.entitiesToRenderers.get(entity);
    if (!name) {
      name = DEFAULT_NAME;
    }
    return this.cameras.get(name);
  }
}

export default World;
