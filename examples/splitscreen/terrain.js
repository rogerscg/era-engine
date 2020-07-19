import { Entity, MaterialManager } from '../../build/era.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x567d46 });

const WIDTH = 10;
const DATA_ROWS = 10;

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
    const geometry = new THREE.PlaneGeometry(
      WIDTH,
      WIDTH,
      DATA_ROWS,
      DATA_ROWS
    );
    this.data.forEach((row, rowIndex) => {
      row.forEach((value, valueIndex) => {
        const vertexIndex = rowIndex * DATA_ROWS + valueIndex;
        geometry.vertices[vertexIndex].z = value;
      });
    });
    geometry.rotateZ(Math.PI / 2);
    geometry.translate(WIDTH / 2, WIDTH / 2, 0);
    return new THREE.Mesh(geometry, MATERIAL);
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body();
    const heightfieldShape = new CANNON.Heightfield(this.data, {
      elementSize: WIDTH / DATA_ROWS,
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
    for (let i = 0; i <= DATA_ROWS; i++) {
      const row = new Array();
      for (let j = 0; j <= DATA_ROWS; j++) {
        const y = 0;
        row.push(y);
      }
      data.push(row);
    }
    return data;
  }

  /**
   * Places a character entity onto the terrain.
   * @param {Character} character
   */
  placeCharacter(character) {
    character.physicsBody.position.x = character.getPlayerNumber() * 3 + 2;
    character.physicsBody.position.z = character.getPlayerNumber() * -3 - 2;
  }
}

export default Terrain;
