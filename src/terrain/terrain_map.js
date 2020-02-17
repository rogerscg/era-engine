import Models from '../core/models.js';
import TerrainTile from './terrain_tile.js';
import Water from './water.js';

/**
 * Handles loading a terrain map from a 3D model and parsing it into digestible
 * tiles.
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
    this.elementSize = null;
    this.tiles = null;
    this.water = null;
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
    // Compute how large each element will be within a tile.
    this.elementSize = this.computeElementSize_(geometry);
    this.tiles = this.breakIntoTiles_(geometry);
    await this.loadTileTextures_();
    this.positionTiles_();
    this.water = new Water();
    return heightmap;
  }

  /**
   * Loads the terrain map from a geometry.
   * @param {THREE.Geometry} geometry
   * @async
   */
  async loadFromGeometry(geometry) {
    geometry.mergeVertices();
    // Compute how large each element will be within a tile.
    this.elementSize = this.computeElementSize_(geometry);
    this.tiles = this.breakIntoTiles_(geometry);
    await this.loadTileTextures_();
    this.positionTiles_();
    this.water = new Water();
  }

  /**
   * Compute the size of each element within a tile, based on the original
   * geometry dimensions as well as how many tiles there will be.
   * @param {THREE.Geometry} geometry
   * @return {number}
   */
  computeElementSize_(geometry) {
    geometry.computeBoundingBox();
    const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    const numVertices = Math.sqrt(geometry.vertices.length);
    return (width / numVertices) * this.scale;
  }

  /**
   * Breaks the given geometry into tiles.
   * @param {THREE.Geometry} geometry
   * @async
   * @private
   */
  breakIntoTiles_(geometry) {
    const vertices = geometry.vertices;
    // Preprocess vertices first.
    // TODO: This is inefficient, and also depends on stable sorting.
    vertices.sort((a, b) => a.x - b.x);
    vertices.sort((a, b) => b.z - a.z);
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
        const tile = new TerrainTile(this.elementSize)
          .withPhysics()
          .setCoordinates(i, j);
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
      row = row.map((x) => x.y * this.scale);
      matrix.splice(0, 0, row);
    }
    // Fill tile out with data.
    tile.fromMatrix(matrix);
  }

  /**
   * Loads all tile textures before the terrain map is finished loading.
   * @async
   * @private
   */
  async loadTileTextures_() {
    const promises = new Array();
    this.tiles.forEach((tile) => {
      tile.build();
      promises.push(tile.generateTexture());
    });
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
    });
  }
}

export default TerrainMap;
