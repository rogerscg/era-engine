import Models from '../core/models.js';
import TerrainTile from './terrain_tile.js';
import * as THREE from 'three';

/**
 * Handles loading a terrain map from a 3D model and parsing it into digestible
 * tiles. All terrain maps should be square, with dimensions that are a power of
 * 2.
 */
class TerrainMap {
  /**
   * @param {number} tileSize The size of a tile. Must be a power of two.
   * @param {number} scale The scale based on the original heightmap size.
   */
  constructor(tileSize, scale = 1.0) {
    this.tileSize = tileSize;
    this.scale = scale;
    // Must be computed post-load.
    this.elementSize = 1 * this.scale;
    this.tiles = null;
    this.TerrainTileClass = TerrainTile;
  }

  /**
   * Sets a custom tile implementation for use within the terrain map.
   * @param {TerrainTile} terrainTileClass
   */
  setTerrainTileClass(terrainTileClass) {
    this.TerrainTileClass = terrainTileClass;
    return this;
  }

  /**
   * Loads the terrain map from a 3D model.
   * @param {string} modelUrl
   * @async
   */
  async loadFromFile(modelUrl) {
    const model = await Models.get().loadModelWithoutStorage(modelUrl);
    const heightmapObj = model.getObjectByName('Grid');
    const bufferGeometry = heightmapObj.geometry;
    const geometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);
    geometry.mergeVertices();
    this.elementSize = this.computeGeometryElementSize_(geometry);
    const heightmap = this.extractHeightmapFromGeometry(geometry);
    geometry.dispose();
    // Compute how large each element will be within a tile.
    this.tiles = this.breakIntoTiles_(heightmap);
    await this.buildTiles_();
    this.positionTiles_();
  }

  /**
   * Loads the terrain map from a geometry.
   * @param {THREE.Geometry} geometry
   * @async
   */
  async loadFromGeometry(geometry) {
    geometry.mergeVertices();
    this.elementSize = this.computeGeometryElementSize_(geometry);
    const heightmap = this.extractHeightmapFromGeometry(geometry);
    geometry.dispose();
    // Compute how large each element will be within a tile.
    this.tiles = this.breakIntoTiles_(heightmap);
    await this.buildTiles_();
    this.positionTiles_();
  }

  /**
   * Extracts elevation data from the given geometry and forms a generic matrix.
   * The y element of each vertex is meant to be the height.
   * @param {THREE.Geometry} geometry
   * @returns {Array<Array<number>}
   */
  extractHeightmapFromGeometry(geometry) {
    const vertices = geometry.vertices;
    // Preprocess vertices first.
    // TODO: This is inefficient, and also depends on stable sorting.
    vertices.sort((a, b) => a.x - b.x);
    vertices.sort((a, b) => b.z - a.z);
    // Extract values.
    const dimensions = Math.sqrt(vertices.length);
    if (parseInt(dimensions) != dimensions) {
      return console.error('Dimensions not an integer, geometry not square.');
    }
    const matrix = new Array();
    for (let i = 0; i < dimensions; i++) {
      const row = new Array();
      for (let j = 0; j < dimensions; j++) {
        const vIndex = i * dimensions + j;
        const value = vertices[vIndex].y;
        row.push(value);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Compute the size of each element within a tile, based on the original
   * geometry dimensions as well as how many tiles there will be.
   * @param {THREE.Geometry} geometry
   * @return {number}
   */
  computeGeometryElementSize_(geometry) {
    geometry.computeBoundingBox();
    const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    const numVertices = Math.sqrt(geometry.vertices.length);
    return (width / numVertices) * this.scale;
  }

  /**
   * Breaks the given heightmap into tiles.
   * @param {Array<Array<number>>} heightmap
   * @async
   * @protected
   */
  breakIntoTiles_(heightmap) {
    // Determine how many tiles we need in a row on the given map.
    const tilesInMapRow = (heightmap.length - 1) / this.tileSize;
    // We can throw all tiles into an array, as they each keep their own
    // coordinates relative to the map.
    const tiles = new Array();
    // Iterate to create tiles. One tile will be filled at a time.
    for (let i = 0; i < tilesInMapRow; i++) {
      for (let j = 0; j < tilesInMapRow; j++) {
        const tile = new this.TerrainTileClass(
          this.tileSize,
          this.scale,
          this.elementSize
        )
          .withPhysics()
          .setCoordinates(i, j)
          .fromParentMatrix(heightmap);
        tiles.push(tile);
      }
    }
    return tiles;
  }

  /**
   * Loads all tile textures before the terrain map is finished loading.
   * @async
   * @private
   */
  async buildTiles_() {
    const promises = new Array();
    this.tiles.forEach((tile) => promises.push(tile.build()));
    return Promise.all(promises);
  }

  /**
   * Positions all tiles in the world so that they align properly.
   * @private
   */
  positionTiles_() {
    this.tiles.forEach((tile) => {
      const coords = tile.getCoordinates();
      const tilesInMapRow = Math.sqrt(this.tiles.length);
      // We want the middle of the terrain map to be at the world origin, so we
      // create an offset based on half of the terrain map width.
      const tileOffset = tilesInMapRow / 2 - 0.5;
      const x = (coords.x - tileOffset) * this.tileSize * this.elementSize;
      const z = -(coords.y - tileOffset) * this.tileSize * this.elementSize;
      tile.setPosition(new THREE.Vector3(x, 0, z));
      console.log(tile);
    });
  }
}

export default TerrainMap;
