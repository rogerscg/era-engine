import Engine from './engine.js';
import Entity from './entity.js';
import Light from './light.js';
import Skybox from './skybox.js';
import { loadJsonFromFile } from './util.js';

/**
 * Provides a way of dynamically creating light, skyboxes, ambient sounds, etc
 * that are unique to an environment. Extends THREE.Object3D to act as a root
 * that can be added to a scene.
 */
class Environment extends Entity {
  constructor() {
    super();
    this.meshEnabled = false;
  }

  /**
   * Loads the environment from a JSON file.
   * @param {string} filePath
   * @async
   */
  async loadFromFile(filePath) {
    if (!filePath) {
      return;
    }
    // Load JSON file with environment and options.
    const environmentData = await loadJsonFromFile(filePath);
    this.loadLights(environmentData.lights);
    //this.loadBackground(environmentData.background);
    await this.loadSkybox(environmentData.skybox);
    return this;
  }

  /**
   * Loads lights from the environment file.
   * @param {Object} lightsData
   */
  loadLights(lightsData) {
    if (!lightsData) {
      return;
    }
    if (lightsData.ambient) {
      lightsData.ambient.forEach((data) =>
        this.add(Light.get().createAmbientLight(data))
      );
    }
    if (lightsData.directional) {
      lightsData.directional.forEach((data) =>
        this.add(Light.get().createDirectionalLight(data))
      );
    }
  }

  /**
   * Sets the renderer background color.
   * @param {string} background
   */
  loadBackground(background) {
    const renderer = Engine.get().getRenderer();
    if (!renderer || !background) {
      return;
    }
    renderer.setClearColor(parseInt(background, 16));
  }

  /**
   * Loads the skybox for the environment.
   * @param {Object} skyboxData
   * @async
   */
  async loadSkybox(skyboxData) {
    if (!skyboxData) {
      return;
    }
    // Create skybox.
    const skybox = new Skybox();
    const directory = skyboxData.directory;
    const file = skyboxData.file;
    const extension = skyboxData.extension;
    await skybox.load(directory, file, extension);
    this.add(skybox);
  }
}

export default Environment;
