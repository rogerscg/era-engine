import Light from './light.js';
import Skybox from './skybox.js';
import {loadJsonFromFile} from './util.js';

/**
 * Provides a way of dynamically creating light, skyboxes, ambient sounds, etc
 * that are unique to an environment. Extends THREE.Object3D to act as a root
 * that can be added to a scene.
 */
class Environment extends THREE.Object3D {
  constructor() {
    super();
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
      lightsData.ambient.forEach((data) => {
        const color = data.color !== undefined ?
                      parseInt(data.color, 16) :
                      0xffffff;
        this.add(Light.get().createAmbientLight({
          color: color,
          intensity: data.intensity ? data.intensity : 1.0,
        }));
      })
    }
    if (lightsData.directional) {
      lightsData.directional.forEach((data) => {
        const color = data.color === undefined ?
                      parseInt(data.color, 16) :
                      0xffffff;
        const x = data.x ? data.x : 0;
        const y = data.y ? data.y : 0;
        const z = data.z ? data.z : 0;
        const intensity = data.intensity ? data.intensity : 1.0;
        this.add(Light.get().createDirectionalLight(x, y, z, color, intensity));
      });
    }
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