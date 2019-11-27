import MODEL_DATA from '../data/models.js';
import {extractMeshes} from './util.js';

/**
 * Core implementation for loading 3D models for use in-game.
 */

let modelsInstance = null;

class Models {

  /**
   * Enforces a singleton instance of Models.
   */
  static get() {
    if (!modelsInstance) {
      modelsInstance = new Models();
    }
    return modelsInstance;
  }

  constructor() {
    // Stores all models. Key is the model name, value is the
    // model mesh.
    this.storage = new Map();
  }

  /**
   * Loads all necessary models for the engine start. Returns
   * a promise so the engine can wait until ready.
   */
  loadInitial() {
    let promises = [];
    for (let name in MODEL_DATA) {
      const modelData = MODEL_DATA[name];
      promises.push(this.loadModel(modelData));
    }
    return Promise.all(promises);
  }

  /**
   * Load the model from file. Uses the glTF file format and loader.
   */
  loadModel(modelData) {
    return new Promise((resolve, reject) => {
      const name = modelData.name;
      const loader = new THREE.GLTFLoader();
      loader.load(`assets/models/${name}/scene.gltf`, (gltf) => {
        if (modelData.scale.x) {
          gltf.scene.scale.copy(modelData.scale);
        } else {
          gltf.scene.scale.setScalar(modelData.scale);
        }
        if (modelData.double) {
          extractMeshes(gltf.scene)
            .forEach((mesh) => mesh.material.side = THREE.DoubleSide);
        }
        this.storage.set(name, gltf.scene);
        resolve();
      }, (progress) => {

      }, (err) => {
        reject(console.error(err));
      });
    });
  }
}

export default Models;
