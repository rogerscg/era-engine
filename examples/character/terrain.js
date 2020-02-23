import { Entity, MaterialManager } from '../../src/era.js';

const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x555555 });

/**
 * A terrain tile.
 */
class Terrain extends Entity {
  constructor() {
    super();
    this.data = this.generateData();
  }

  /** @override */
  generateMesh() {
    const geometry = new THREE.PlaneGeometry(9, 9, 9, 9);
    this.data.forEach((row, rowIndex) => {
      row.forEach((value, valueIndex) => {
        const vertexIndex = rowIndex * 10 + valueIndex;
        geometry.vertices[vertexIndex].z = value;
      });
    });
    geometry.rotateZ(Math.PI / 2);
    geometry.translate(4.5, 4.5, 0);
    return new THREE.Mesh(geometry, MATERIAL);
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body();
    const heightfieldShape = new CANNON.Heightfield(this.data, {
      elementSize: 1
    });
    body.quaternion.setFromEuler(-Math.PI / 2, 0, 0, 'XYZ');
    body.addShape(heightfieldShape);
    body.material = MaterialManager.get().createPhysicalMaterial('ground');
    return body;
  }

  /**
   * Generates the terrain data.
   * @returns {Array<Array<Number>>}
   */
  generateData() {
    const data = new Array();
    for (let i = 0; i < 10; i++) {
      const row = new Array();
      for (let j = 0; j < 10; j++) {
        const y = 0.001 * (i * 10 + j) * (i * 10 + j);
        row.push(y);
      }
      data.push(row);
    }
    return data;
  }
}

export default Terrain;
