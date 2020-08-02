import Entity from '../objects/entity.js';
import MaterialManager from '../physics/material_manager.js';
import Settings from '../core/settings.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const DEBUG_MATERIAL = new THREE.MeshLambertMaterial({
  color: 0xff0000,
  wireframe: true,
});

/**
 * An individual tile of terrain.
 */
class TerrainTile extends Entity {
  /**
   * @param {number} size
   * @param {number} scale
   * @param {number} elementSize
   */
  constructor(size, scale = 1.0, elementSize = 1.0) {
    super();
    this.size = size;
    this.tileScale = scale;
    // Lock mesh rotation due to discrepancies with Three and Cannon planes.
    this.meshRotationLocked = true;
    // The size of each data tile.
    this.elementSize = elementSize;
    // A matrix of data that creates the terrain tile.
    this.data = null;
    // Map tile coordinates.
    this.tileCoordinates = new THREE.Vector2();
    // Debug planes to help find boundaries of tiles.
    this.debugWalls = null;
  }

  /** @override */
  handleSettingsChange() {
    this.toggleDebug();
  }

  /** @override */
  async generateMesh() {
    if (!this.data) {
      return console.error('Attempting to create a terrain tile with no data');
    }
    const dataHeight = this.data.length;
    const dataWidth = this.data[0].length;
    const totalWidth = (dataWidth - 1) * this.elementSize;
    const totalHeight = (dataHeight - 1) * this.elementSize;
    const geometry = new THREE.PlaneGeometry(
      totalWidth,
      totalHeight,
      dataWidth - 1,
      dataHeight - 1
    );
    this.data.forEach((row, rowIndex) => {
      row.forEach((value, valueIndex) => {
        const vertexIndex = rowIndex * dataWidth + valueIndex;
        geometry.vertices[vertexIndex].z = value;
      });
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.computeBoundingBox();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // Debug init.
    this.generateDebugWalls(mesh);
    this.toggleDebug();
    await this.generateTexture(mesh);
    return mesh;
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body();
    const heightfieldShape = new CANNON.Heightfield(this.data, {
      elementSize: this.elementSize,
    });
    const dataHeight = this.data.length;
    const dataWidth = this.data[0].length;
    const totalWidth = (dataWidth - 1) * this.elementSize;
    const totalHeight = (dataHeight - 1) * this.elementSize;
    const shapeQuaternion = new CANNON.Quaternion().setFromEuler(
      -Math.PI / 2,
      0,
      -Math.PI / 2,
      'XYZ'
    );
    const shapeOffset = new CANNON.Vec3(-totalWidth / 2, 0, -totalHeight / 2);
    body.addShape(heightfieldShape, shapeOffset, shapeQuaternion);
    body.material = MaterialManager.get().createPhysicalMaterial('ground');
    return body;
  }

  /**
   * Generates a texture given the generated mesh. Takes vertex height and slope
   * into account.
   * @param {THREE.Mesh} mesh
   * @async
   */
  async generateTexture(mesh) {
    console.warn('No generateTexture implementation for terrain tile.');
  }

  /**
   * Toggles debug meshes for the tile.
   */
  toggleDebug() {
    if (Settings.get('terrain_debug')) {
      this.add(this.debugWalls);
    } else {
      this.remove(this.debugWalls);
    }
  }

  /**
   * Creates debug walls to aid finding the boundaries of a tile.
   * @param {THREE.Mesh} mesh Tile mesh to get bounding box.
   */
  generateDebugWalls(mesh) {
    if (!this.data || !mesh) {
      return;
    }
    // Create walls.
    const dataHeight = this.data.length;
    const dataWidth = this.data[0].length;
    const totalWidth = (dataWidth - 1) * this.elementSize;
    const totalHeight = (dataHeight - 1) * this.elementSize;
    const geometry = new THREE.PlaneGeometry(totalWidth, totalHeight, 10, 10);
    this.debugWalls = new THREE.Object3D();
    // Calculate min/max.
    const y =
      (mesh.geometry.boundingBox.min.y + mesh.geometry.boundingBox.max.y) / 2;
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(geometry, DEBUG_MATERIAL);
      this.mesh;
      switch (i) {
        case 0:
          mesh.position.set(0, y, totalWidth / 2);
          break;
        case 1:
          mesh.position.set(totalWidth / 2, y, 0);
          break;
        case 2:
          mesh.position.set(0, y, -totalWidth / 2);
          break;
        case 3:
          mesh.position.set(-totalWidth / 2, y, 0);
          break;
      }
      mesh.rotation.y = i % 2 == 0 ? 0 : Math.PI / 2;
      this.debugWalls.add(mesh);
    }
    // Create root mesh.
    const tileRoot = new THREE.Mesh(
      new THREE.BoxGeometry(totalWidth / 20, totalWidth / 2, totalWidth / 20),
      new THREE.MeshLambertMaterial({ color: 0xffff00 })
    );
    tileRoot.position.y = y;
    this.debugWalls.add(tileRoot);
  }

  /**
   * Builds the tile from a given matrix of data.
   * @param {Array<Array<number>>} matrix
   */
  fromMatrix(matrix) {
    this.data = matrix;
    return this;
  }

  /**
   * Extracts the relevant data from a parent matrix.
   * @param {Array<Array<number>>} parentMatrix
   */
  fromParentMatrix(parentMatrix) {
    const coordinates = this.getCoordinates();
    // Compute the number of rows we can skip based on the y coordinate.
    const yOffset = coordinates.y * this.size;
    // Compute the number of columns we can skip based on the x coordinate.
    const xOffset = coordinates.x * this.size;
    // Now that we have our starting point, we can consume chunks of `size` at a
    // time, skipping to the next row until we have consumed `size` rows.
    const matrix = new Array();
    for (let i = 0; i < this.size + 1; i++) {
      const rowIndex = yOffset + i;
      let row = parentMatrix[rowIndex].slice(xOffset, xOffset + this.size + 1);
      row = row.map((x) => x * this.tileScale);
      matrix.splice(0, 0, row);
    }
    // Fill tile out with data.
    return this.fromMatrix(matrix);
  }

  /**
   * Sets the coordinates of the tile relative to other tiles in the map.
   * @param {number} x
   * @param {number} y
   * @return {TerrainTile}
   */
  setCoordinates(x, y) {
    this.tileCoordinates.set(x, y);
    return this;
  }

  /**
   * @return {THREE.Vector2}
   */
  getCoordinates() {
    return this.tileCoordinates;
  }
}

export default TerrainTile;
