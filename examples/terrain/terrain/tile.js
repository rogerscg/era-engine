import { Entity } from '../../../src/era.js';

const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x555555 });

/**
 * An individual tile of terrain.
 */
class Tile extends Entity {
  /**
   * @param {number} elementSize
   */
  constructor(elementSize = 1) {
    super();
    // The size of each data tile.
    this.elementSize = elementSize;
    // A matrix of data that creates the terrain tile.
    this.data = null;
  }

  /** @override */
  generateMesh() {
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
    geometry.rotateZ(Math.PI / 2);
    geometry.translate(totalWidth / 2, totalHeight / 2, 0);
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, MATERIAL);
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body();
    const heightfieldShape = new CANNON.Heightfield(this.data, {
      elementSize: this.elementSize
    });
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0, 'XYZ');
    body.addShape(heightfieldShape);
    body.material = this.physicsWorld.createPhysicalMaterial('ground');
    return body;
  }

  /**
   * Builds the tile from a given matrix of data.
   * @param {Array<Array<number>>} matrix
   */
  fromMatrix(matrix) {
    this.data = matrix;
    return this;
  }
}

export default Tile;
