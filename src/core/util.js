/**
 * @author rogerscg / https://github.com/rogerscg
 */

/**
 * Generates a RFC4122 version 4 compliant UUID.
 */
function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Disables all shadows for an object and its children.
 */
function disableShadows(object, name, force = false) {
  if (!name || object.name.toLowerCase().indexOf(name) > -1 || force) {
    object.castShadow = false;
    force = true;
  }
  object.children.forEach((child) => {
    disableShadows(child, name, force);
  });
}

/**
 * Disposes all geometries and materials for an object and its children.
 */
function dispose(object) {
  if (object.material) {
    object.material.dispose();
  }
  if (object.geometry) {
    object.geometry.dispose();
  }
  object.children.forEach((child) => dispose(child));
}

/**
 * Extracts an array of meshes present in an object hierarchy.
 * @param {Object3D} object The root object from which to search.
 * @param {string} materialFilter The name of a material we want to search for.
 * @param {boolean} filterOut True if the set of meshes should exclude the
 *                  matching material name.
 */
function extractMeshes(object, materialFilter, filterOut = true) {
  let meshes = [];
  if (object.type == 'Mesh') {
    if (
      materialFilter &&
      ((filterOut && object.material.name.indexOf(materialFilter) < 0) ||
        (!filterOut && object.material.name.indexOf(materialFilter) > -1))
    ) {
      meshes.push(object);
    } else if (!materialFilter) {
      meshes.push(object);
    }
  }
  object.children.forEach((child) => {
    const childrenMeshes = extractMeshes(child, materialFilter, filterOut);
    meshes = meshes.concat(childrenMeshes);
  });
  return meshes;
}

/**
 * Extracts an array of meshes with a certain name within an object hierarchy.
 * The provided name can be a substring of the mesh name.
 * @param {THREE.Object3D} object
 * @param {string} meshName
 * @returns {Array<THREE.Mesh>}
 */
function extractMeshesByName(object, meshName = '') {
  let meshes = new Array();
  if (object.type == 'Mesh') {
    if (object.name.indexOf(meshName) >= 0) {
      meshes.push(object);
    }
  }
  object.children.forEach((child) => {
    const childrenMeshes = extractMeshesByName(child, meshName);
    meshes = meshes.concat(childrenMeshes);
  });
  return meshes;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function toDegrees(angle) {
  return angle * (180 / Math.PI);
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}

/**
 * Computes the angle in radians with respect to the positive x-axis
 * @param {Number} x
 * @param {Number} y
 */
function vectorToAngle(x, y) {
  let angle = Math.atan2(y, x);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
}

/*
 * Get the hex color ratio between two colors
 * Ratio 0 = Col1
 * Ratio 1 = Col2
 */
function getHexColorRatio(col1, col2, ratio) {
  var r = Math.ceil(
    parseInt(col1.substring(0, 2), 16) * ratio +
      parseInt(col2.substring(0, 2), 16) * (1 - ratio)
  );
  var g = Math.ceil(
    parseInt(col1.substring(2, 4), 16) * ratio +
      parseInt(col2.substring(2, 4), 16) * (1 - ratio)
  );
  var b = Math.ceil(
    parseInt(col1.substring(4, 6), 16) * ratio +
      parseInt(col2.substring(4, 6), 16) * (1 - ratio)
  );
  return hex(r) + hex(g) + hex(b);
}

/**
 * Used in getHexColorRatio
 */
function hex(x) {
  x = x.toString(16);
  return x.length == 1 ? '0' + x : x;
}

/**
 * Interpolates between two numbers.
 * @param {number} a
 * @param {number} b
 * @param {number} factor
 * @return {number}
 */
function lerp(a, b, factor) {
  return a + (b - a) * factor;
}

/**
 * Loads a JSON from the given file path.
 * @param {string} path
 * @return {Promise<Object>} Parsed JSON object.
 * @async
 */
async function loadJsonFromFile(path) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.FileLoader();
    loader.load(
      path,
      (data) => {
        resolve(JSON.parse(data));
      },
      () => {},
      (err) => {
        reject(err);
      }
    );
  });
}

/**
 * Traverses the provided object's ancestors to get the root scene in the ERA
 * world.
 * @param {THREE.Object3D} object
 */
function getRootScene(object) {
  let rootScene = null;
  object.traverseAncestors((ancestor) => {
    if (ancestor.isRootScene) {
      rootScene = ancestor;
    }
  });
  return rootScene;
}

export {
  createUUID,
  disableShadows,
  dispose,
  extractMeshes,
  extractMeshesByName,
  getHexColorRatio,
  getRootScene,
  lerp,
  loadJsonFromFile,
  shuffleArray,
  toDegrees,
  toRadians,
  vectorToAngle
};
