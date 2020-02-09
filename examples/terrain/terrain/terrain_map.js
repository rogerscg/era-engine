import TerrainTile from './terrain_tile.js';
import { Models } from '../../../src/era.js';

/**
 * Handles loading a terrain map from a 3D model and parsing it into digestible
 * tiles.
 */
class TerrainMap {
  /**
   * @param {number} tileSize The size of a tile. Must be a power of two.
   */
  constructor(tileSize) {
    this.tileSize = tileSize;
    this.tiles = null;
  }

  /**
   * Loads the terrain map from a 3D model.
   * @param {string} modelUrl
   * @async
   */
  async loadFromFile(modelUrl) {
    const model = await Models.get().loadModelWithoutStorage(modelUrl);
    const heightmap = model.getObjectByName('Grid');
    const bufferGeometry = heightmap.geometry;
    const geometry = new THREE.Geometry().fromBufferGeometry(bufferGeometry);
    geometry.mergeVertices();
    this.tiles = this.breakIntoTiles_(geometry);
    return heightmap;
  }

  /**
   * Breaks the given geometry into tiles.
   * @param {THREE.Geometry} geometry
   * @private
   */
  breakIntoTiles_(geometry) {
    const vertices = geometry.vertices;
    // We track tile size by the number of quads in a tile, not by the number
    // of vertices, so add one vertex count.
    const tileVertWidth = this.tileSize + 1;
    // Get how many vertices are in a row on the loaded geometry.
    const geometryVertWidth = Math.sqrt(vertices.length);
    // Determine how many tiles we need in a row on the given map.
    const tilesInMapRow = (geometryVertWidth - 1) / (tileVertWidth - 1);
    // We can throw all tiles into an array, as they each keep their own
    // coordinates relative to the map.
    const tiles = new Array();
    // Iterate to create tiles. One tile will be filled at a time.
    for (let i = 0; i < tilesInMapRow; i++) {
      for (let j = 0; j < tilesInMapRow; j++) {
        const tile = new TerrainTile().setCoordinates(i, j);
        this.loadVerticesIntoTile_(vertices, tile);
        tiles.push(tile);
      }
    }
    return tiles;
  }

  /**
   * Loads vertices into a tile from a larger geometry. This is difficult due to
   * the vertices being in a one-dimensional array, while the tile consumes a
   * matrix.
   * @param {Array<THREE.Vector3>} vertices
   * @param {TerrainTile} tile
   * @private
   */
  loadVerticesIntoTile_(vertices, tile) {
    const geometryVertWidth = Math.sqrt(vertices.length);
    const coordinates = tile.getCoordinates();
    // Compute the number of vertices we can skip based on the y coordinate.
    const yOffset = geometryVertWidth * coordinates.y * this.tileSize;
    // Compute the x offset.
    const xOffset = coordinates.x * this.tileSize;
    // Now that we have our starting point, we can consume chunks of size
    // `tileSize` at a time, skipping to the next row until we have consumed
    // `tileSize` rows.
    const matrix = new Array();
    for (let i = 0; i < this.tileSize + 1; i++) {
      const startIndex = i * geometryVertWidth + yOffset + xOffset;
      let row = vertices.slice(startIndex, startIndex + this.tileSize + 1);
      // TODO: Fix this scale.
      row = row.map((x) => x.y * 35);
      matrix.push(row);
    }
    tile.fromMatrix(matrix);
  }
}

export default TerrainMap;
