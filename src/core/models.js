/**
 * @author rogerscg / https://github.com/rogerscg
 */
import Animation from './animation.js';
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
    // Defaults to GLTF.
    const extension = options.extension ? options.extension : 'gltf';
    const path = `${directory}${name}.${extension}`;
    let root;
    switch (extension) {
      case 'gltf':
        const gltf = await this.loadGltfModel(path);
        root = gltf.scene;
        Animation.get().setAnimations(name, gltf.animations);
        break;
      case 'obj':
        root = await this.loadObjModel(path);
        break;
    }
    // Scale the model based on options.
    if (options.scale) {
      root.scale.setScalar(options.scale);
    }
    // Set the model in storage.
    this.storage.set(name, root);
    return root;
  }

  /**
   * Loads a GLTF model.
   * @param {string} path 
   * @async
   */
  async loadGltfModel(path) {
    return new Promise((resolve) => {
      const loader = new THREE.GLTFLoader();
      loader.load(path, (gltf) => {
        resolve(gltf);
      }, () => {}, (err) => {
        throw new Error(err);
      });
    });
  }

  /**
   * Loads a Obj model.
   * @param {string} path 
   * @async
   */
  async loadObjModel(path) {
    let materials = null;
    try {
      materials = await this.loadObjMaterials(path);
    } catch (e) {}
    const root = await this.loadObjGeometry(path, materials);
    return root;
  }

  /**
   * 
   * @param {string} path 
   * @param {?} materials 
   */
  loadObjGeometry(path, materials) {
    return new Promise((resolve) => {
      const objLoader = new THREE.OBJLoader();
      if (materials) {
        objLoader.setMaterials(materials);
      }
      objLoader.load(path, resolve);
    });
  }

  /**
   * Loads an obj files respective materials.
   * @param {string} path
   * @async
   */
  loadObjMaterials(path) {
    const mtlLoader = new THREE.MTLLoader();
    // Modify .obj path to look for .mtl.
    path = path.slice(0, path.lastIndexOf('.')) + '.mtl';
    return new Promise((resolve, reject) => {
      mtlLoader.load(path, (materials) => {
        materials.preload();
        resolve(materials);
      }, () => {}, () => reject());
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
