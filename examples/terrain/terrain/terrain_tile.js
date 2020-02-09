import { Entity, loadTexture, toDegrees } from '../../../src/era.js';

const DEBUG_MATERIAL = new THREE.MeshLambertMaterial({
  color: 0xff0000,
  wireframe: true
});

/**
 * An individual tile of terrain.
 */
class TerrainTile extends Entity {
  /**
   * @param {number} elementSize
   */
  constructor(elementSize = 1) {
    super();
    // The size of each data tile.
    this.elementSize = elementSize;
    // A matrix of data that creates the terrain tile.
    this.data = null;
    // Map tile coordinates.
    this.tileCoordinates = new THREE.Vector2();
    // Debug planes to help find boundaries of tiles.
    this.debugWalls = null;
    // Single Box2 instance for better memory usage.
    this.canvasBox2 = new THREE.Box2();
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
    geometry.rotateX(-Math.PI / 2);
    // TODO: Fix this with CANNON.
    //geometry.translate(totalWidth / 2, totalHeight / 2, 0);
    geometry.computeBoundingBox();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    this.generateDebugWalls();
    const material = new THREE.MeshLambertMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    this.generateTexture(mesh);
    return mesh;
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
   * Generates a texture given the generated mesh. Takes vertex height and slope
   * into account.
   * @param {THREE.Mesh} mesh
   * @async
   */
  async generateTexture(mesh) {
    console.time(
      `texture${this.getCoordinates().x},${this.getCoordinates().y}`
    );
    // Load in relevant textures.
    const grassTexture = await loadTexture('textures/grass.png');
    const rockTexture = await loadTexture('textures/rock.png');
    // Create a canvas for our generated texture.
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    // Fill out base texture.
    context.drawImage(grassTexture.image, 0, 0);

    // Detect any height differences.
    // TODO: Detect if entire mesh is within threshold.
    const rockHeightThreshold = 15;
    const iceHeightThreshold = 19;
    mesh.geometry.faces.forEach((face) => {
      const vertices = [
        mesh.geometry.vertices[face.a],
        mesh.geometry.vertices[face.b],
        mesh.geometry.vertices[face.c]
      ];
      // Detect if any of the vertices surpass the height thresholds.
      let heightColor = null;
      vertices.forEach((vertex) => {
        if (vertex.y > iceHeightThreshold) {
          heightColor = 'rgb(150, 150, 150)';
        } else if (vertex.y > rockHeightThreshold) {
          heightColor = 'rgb(50, 50, 50)';
        }
      });
      // If not change in color due to height, return early.
      if (!heightColor) {
        return;
      }
      const canvasBox = this.getFaceSegmentOnCanvas_(mesh, face, canvas);

      // Write to the canvas with the "height color".
      // TODO: Actually use perlin and height texture.
      context.fillStyle = heightColor;
      context.fillRect(
        canvasBox.min.x,
        canvasBox.min.y,
        canvasBox.max.x - canvasBox.min.x,
        canvasBox.max.y - canvasBox.min.y
      );
    });

    // Detect any slope differences.
    const rockSlopeThreshold = Math.PI / 4;
    const planeVector = new THREE.Vector3();
    mesh.geometry.faces.forEach((face) => {
      planeVector.set(face.normal.x, 0, face.normal.z);
      const angle = Math.PI / 2 - face.normal.angleTo(planeVector);
      // For each face that should be a rock, compute where in the texture it's
      // located.
      if (angle > rockSlopeThreshold) {
        // Get the face position.
        const canvasBox = this.getFaceSegmentOnCanvas_(mesh, face, canvas);
        // Write to the canvas with the "rock texture".
        // TODO: Actually use perlin and rock texture.
        context.fillStyle = 'rgb(50, 50, 50)';
        context.fillRect(
          canvasBox.min.x,
          canvasBox.min.y,
          canvasBox.max.x - canvasBox.min.x,
          canvasBox.max.y - canvasBox.min.y
        );
      }
    });

    // Generate perlin noise, update based on values.
    //console.time('noise');
    //noise.seed(0xbada55);
    //for (var x = 0; x < canvas.width; x++) {
    //  for (var y = 0; y < canvas.height; y++) {
    //    const perlinValue = noise.perlin2(x / 100, y / 100);
    //    // TODO: Interpolate between two (or more) other textures.
    //    context.fillStyle = `rgb(${perlinValue * 255}, 0, 0)`;
    //    context.fillRect(x, y, 1, 1);
    //  }
    //}
    //console.timeEnd('noise');

    // Set the material texture.
    const texture = new THREE.CanvasTexture(canvas);
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
    console.timeEnd(
      `texture${this.getCoordinates().x},${this.getCoordinates().y}`
    );
  }

  /**
   * Creates debug walls to aid finding the boundaries of a tile.
   * TODO: This needs to react to debug settings.
   */
  generateDebugWalls() {
    if (!this.data) {
      return;
    }
    const root = new THREE.Mesh(
      new THREE.BoxGeometry(5, 50, 5),
      new THREE.MeshLambertMaterial({ color: 0xffff00 })
    );
    //this.add(root);
    const dataHeight = this.data.length;
    const dataWidth = this.data[0].length;
    const totalWidth = (dataWidth - 1) * this.elementSize;
    const totalHeight = (dataHeight - 1) * this.elementSize;
    const geometry = new THREE.PlaneGeometry(totalWidth, totalHeight, 10, 10);
    this.debugWalls = new THREE.Object3D();
    for (let i = 0; i < 4; i++) {
      const mesh = new THREE.Mesh(geometry, DEBUG_MATERIAL);
      // TODO: Make this dynamic with terrain max/min.
      const y = 20;
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
    //this.add(this.debugWalls);
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

  /**
   * Gets the section of the provided canvas that the given face affects.
   * @param {THREE.Mesh} mesh
   * @param {THREE.Face3} face
   * @param {Canvas} canvas
   * @return {THREE.Box2}
   * @private
   */
  getFaceSegmentOnCanvas_(mesh, face, canvas) {
    const size = canvas.width;
    const vertices = [
      mesh.geometry.vertices[face.a],
      mesh.geometry.vertices[face.b],
      mesh.geometry.vertices[face.c]
    ];
    const minX = Math.min(...vertices.map((x) => x.x));
    const maxX = Math.max(...vertices.map((x) => x.x));
    const minZ = Math.min(...vertices.map((x) => x.z));
    const maxZ = Math.max(...vertices.map((x) => x.z));
    // Map the face min/max to the geometry min/max.
    const boundingBox = mesh.geometry.boundingBox;
    const minMappedX =
      ((minX - boundingBox.min.x) / (boundingBox.max.x - boundingBox.min.x)) *
      size;
    const maxMappedX =
      ((maxX - boundingBox.min.x) / (boundingBox.max.x - boundingBox.min.x)) *
      size;
    const minMappedZ =
      ((minZ - boundingBox.min.z) / (boundingBox.max.z - boundingBox.min.z)) *
      size;
    const maxMappedZ =
      ((maxZ - boundingBox.min.z) / (boundingBox.max.z - boundingBox.min.z)) *
      size;
    this.canvasBox2.min.set(minMappedX, minMappedZ);
    this.canvasBox2.max.set(maxMappedX, maxMappedZ);
    return this.canvasBox2;
  }
}

export default TerrainTile;
