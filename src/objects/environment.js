import Entity from '../objects/entity.js';
import Light from '../core/light.js';
import Skybox from '../objects/skybox.js';
import { loadJsonFromFile } from '../core/util.js';
import * as THREE from 'three';

/**
 * Provides a way of dynamically creating light, skyboxes, ambient sounds, etc
 * that are unique to an environment. Extends THREE.Object3D to act as a root
 * that can be added to a scene.
 */
class Environment extends Entity {
  constructor() {
    super();
    this.clearColor = 0xffffff;
    this.fog = null;
    this.physicsQualityAdjustEnabled = false;
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
    await this.build();
    const environmentData = await loadJsonFromFile(filePath);
    this.loadLights(environmentData.lights);
    this.loadBackground(environmentData.background);
    this.loadFog(environmentData.fog);
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
        this.visualRoot.add(Light.get().createAmbientLight(data))
      );
    }
    if (lightsData.directional) {
      lightsData.directional.forEach((data) =>
        this.visualRoot.add(Light.get().createDirectionalLight(data))
      );
    }
  }

  /**
   * Sets the renderer background color.
   * @param {string} background
   */
  loadBackground(background) {
    if (!background) {
      return;
    }
    this.clearColor = parseInt(background, 16);
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
    const skybox = new Skybox(skyboxData.width);
    const directory = skyboxData.directory;
    const file = skyboxData.file;
    const extension = skyboxData.extension;
    await skybox.load(directory, file, extension);
    this.visualRoot.add(skybox);
  }

  /**
   * Loads fog into the scene.
   * @param {Object} fogData
   */
  loadFog(fogData) {
    if (!fogData) {
      return;
    }
    const color =
      fogData.color != null ? parseInt(fogData.color, 16) : 0xffffff;
    const near = fogData.near;
    const far = fogData.far;
    const density = fogData.density;
    this.fog =
      fogData.type == 'exp2'
        ? new THREE.FogExp2(color, density)
        : new THREE.Fog(color, near, far);
  }

  /**
   * Returns the clear color a renderer should set based on the environment.
   * @return {number}
   */
  getClearColor() {
    return this.clearColor;
  }

  /**
   * Returns the fog to be added to the scene.
   * @return {THREE.Fog}
   */
  getFog() {
    return this.fog;
  }
}

export default Environment;
