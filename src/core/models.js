/**
 * @author rogerscg / https://github.com/rogerscg
 */

import {extractMeshes, loadJsonFromFile} from './util.js';

let instance = null;

/**
 * Core implementation for loading 3D models for use in-game.
 */
class Models {

  /**
   * Enforces a singleton instance of Models.
   * @returns {Models}
   */
  static get() {
    if (!instance) {
      instance = new Models();
    }
    return instance;
  }

  constructor() {
    // Stores all models. Key is the model name, value is the
    // model mesh.
    this.storage = new Map();
  }

  /**
   * Loads all models described from the provided file path. The file should
   * be a JSON file. Follow the example at /src/data/models.json.
   * @param {string} filePath
   * @async
   */
  async loadAllFromFile(filePath) {
    if (!filePath) {
      return;
    }
    // Load JSON file with all models and options.
    let allModelData;
    try {
      allModelData = await loadJsonFromFile(filePath);
    } catch (e) {
      throw new Error(e);
    }
    // Extract the directory from the file path, use for loading models.
    const directory = filePath.substr(0, filePath.lastIndexOf('/') + 1);
    const promises = new Array();
    for (let name in allModelData) {
      const options = allModelData[name];
      promises.push(this.loadModel(directory, name, options));
    }
    return Promise.all(promises);
  }

  /**
   * Load the model from file and places it into model storage. Uses the glTF
   * file format and loader.
   * @param {string} path
   * @param {Object} options
   * @async
   */
  async loadModel(directory, name, options) {
    // TODO: Handle different model file types.
    const path = `${directory}${name}.gltf`;
    return new Promise((resolve) => {
      const loader = new THREE.GLTFLoader();
      loader.load(path, (gltf) => {
        if (options.scale) {
          gltf.scene.scale.setScalar(options.scale);
        }
        if (options.side == 2) {
          extractMeshes(gltf.scene)
            .forEach((mesh) => mesh.material.side = THREE.DoubleSide);
        }
        this.storage.set(name, gltf.scene);
        resolve();
      }, () => {}, (err) => {
        throw new Error(err);
      });
    });
  }

  /**
   * Creates a clone of a model from storage.
   * @param {string} name
   * @return {THREE.Object3D}
   */
  createModel(name) {
    if (!this.storage.has(name)) {
      return null;
    }
    return this.storage.get(name).clone();
  }
}

export default Models;
