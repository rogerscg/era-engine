/**
 * @author rogerscg / https://github.com/rogerscg
 */

const WIDTH = 500;

const SUFFIXES = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];

/**
 * Wrapper class for a cube geometry, representing a skybox.
 */
class Skybox extends THREE.Object3D {
  constructor() {
    super();
    this.cube = null;
  }

  /**
   * Loads the skybox with a given texture. Requires that the 
   * @param {string} directory
   * @param {string} filename
   * @param {string} extension
   * @async
   */
  async load(directory, filename, extension) {
    if (!directory || !filename || !extension) {
      return console.warn('Not all params present for skybox load');
    }
    // Append a trailing slash to the directory if it doesn't exist.
    if (!directory.endsWith('/')) {
      directory += '/';
    }
    // Insert a period if the extension doesn't have one.
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    // Load each texture for the cube.
    const cubeMaterials =
      await this.createCubeMaterials(directory, filename, extension);
    
    const geometry = new THREE.CubeGeometry(WIDTH, WIDTH, WIDTH);
    const cube = new THREE.Mesh(geometry, cubeMaterials);
    this.cube = cube;
    this.add(cube);
  }

  /**
   * Loads each cube face material.
   * @param {string} directory
   * @param {string} filename
   * @param {string} extension
   * @returns {Array<THREE.Material>}
   * @async
   */
  async createCubeMaterials(directory, filename, extension) {
    // Load all textures first.
    const loader = extension == '.tga' ?
      new THREE.TGALoader() :
      new THREE.TextureLoader();
    const texturePromises = new Array();
    for (let i = 0; i < SUFFIXES.length; ++i) {
      const suffix = SUFFIXES[i];
      const path = `${directory}${filename}_${suffix}${extension}`;
      texturePromises.push(this.loadTexture(loader, path));
    }
    const textures = await Promise.all(texturePromises);
    // Create all materials from textures.
    const cubeMaterials = new Array();
    for (let i = 0; i < textures.length; ++i) {
      const mat = new THREE.MeshBasicMaterial({
        map: textures[i],
        side: THREE.DoubleSide,
      });
      cubeMaterials.push(mat);
    }
    return cubeMaterials;
  }

  /**
   * Wrapper for loading a texture.
   * @param {THREE.Loader} loader
   * @param {string} path
   * @returns {THREE.Texture}
   * @async
   */
  async loadTexture(loader, path) {
    return new Promise((resolve) => {
      loader.load(path, (texture) => {
        resolve(texture);
      });
    });
  }
}

export default Skybox;