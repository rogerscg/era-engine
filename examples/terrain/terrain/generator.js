import Tile from './terrain_tile.js';

/**
 * Generates terrain procedurally. Outputs terrain tiles that will later be
 * rendered.
 */
class Generator {
  /**
   * Creates a generator with width and height, in number of tiles. The size of
   * each tile is also defined. If tileSize is 5, there will be 6 data points
   * generated for that axis.
   * @param {number} width
   * @param {number} height
   * @param {number} tileSize
   */
  constructor(width, height, tileSize) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
  }

  /**
   * Creates a rows x cols matrix.
   * @param {number} rows
   * @param {number} cols
   * @return {Array<Array<number>>}
   */
  static createMatrix(rows, cols) {
    const matrix = new Array();
    for (let i = 0; i < rows; i++) {
      const row = new Array();
      for (let j = 0; j < cols; j++) {
        row.push(null);
      }
      matrix.push(row);
    }
    return matrix;
  }

  /**
   * Generates the data needed, occasionally exporting and loading terrain tiles
   * as needed.
   * TODO: Actually make this infinitely scalable by loading/unloading needed
   * tiles for context.
   * @return {Tile}
   */
  generate() {
    const dataPointsWidth = this.tileSize * this.width + 1;
    const dataPointsHeight = this.tileSize * this.height + 1;
    const matrix = Generator.createMatrix(dataPointsHeight, dataPointsWidth);
    for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
      for (let colIndex = 0; colIndex < matrix[rowIndex].length; colIndex++) {
        const val = Math.random() + Math.sin(colIndex);
        matrix[rowIndex][colIndex] = val;
      }
    }
    return new Tile().withPhysics().fromMatrix(matrix);
  }
}

export default Generator;
