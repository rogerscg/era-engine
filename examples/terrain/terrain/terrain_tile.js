import { Entity, Settings, loadTexture, toDegrees } from '../../../src/era.js';

const DEBUG_MATERIAL = new THREE.MeshLambertMaterial({
  color: 0xff0000,
  wireframe: true
});

// Perlin equation constants.
const PERLIN_RANGE = 1;

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
  handleSettingsChange() {
    this.toggleDebug();
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

    const material = new THREE.MeshLambertMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.generateTexture(mesh);
    this.generateWater();
    // Debug init.
    this.generateDebugWalls(mesh);
    this.toggleDebug();
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
   * Adds simple water to the terrain.
   * TODO: Make this interesting.
   */
  generateWater() {
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
    geometry.rotateX(-Math.PI / 2);
    const material = new THREE.MeshPhongMaterial({
      color: 0x55707b
    });
    const mesh = new THREE.Mesh(geometry, material);
    this.add(mesh);
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
    // Set perlin noise seed.
    noise.seed(0xbada55);
    // Load in relevant textures.
    const grassTexture = await loadTexture('textures/grass.png');
    const rockTexture = await loadTexture('textures/rock.png');

    // Create a canvas for our generated texture.
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    // Detect any changes necessary due to height.
    this.modifyTextureForHeight_(canvas, mesh);

    // Detect any slope differences.
    this.modifyTextureForSlope_(canvas, mesh);

    // Set the material texture.
    const texture = new THREE.CanvasTexture(canvas);
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
    console.timeEnd(
      `texture${this.getCoordinates().x},${this.getCoordinates().y}`
    );
  }

  /**
   * Toggles debug meshes for the tile.
   */
  toggleDebug() {
    if (Settings.get('debug')) {
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
    this.canvasBox2.min.set(Math.round(minMappedX), Math.round(minMappedZ));
    this.canvasBox2.max.set(Math.round(maxMappedX), Math.round(maxMappedZ));
    return this.canvasBox2;
  }

  /**
   * Modifies the terrain texture for height differences.
   * @param {Canvas} canvas
   * @param {THREE.Mesh} mesh
   * @private
   */
  modifyTextureForHeight_(canvas, mesh) {
    const context = canvas.getContext('2d');
    // Detect any height differences.
    // TODO: Set these dynamically.
    const heightTextures = [
      // Low Grass
      {
        min: -999999999,
        max: 999999999,
        solid: -999999999,
        perlinFactor: 2.0,
        color: '#2a471e'
      },
      // High Grass
      {
        min: 3,
        max: 999999999,
        solid: 9,
        perlinFactor: 2.0,
        color: '#567d46'
      },
      // Rock
      {
        min: 12,
        max: 999999999,
        solid: 20,
        perlinFactor: 5.0,
        color: 'rgb(50, 50, 50)'
      },
      // Ice
      {
        min: 28,
        max: Infinity,
        solid: 35,
        perlinFactor: 3.0,
        color: 'rgb(150, 150, 150)'
      }
    ];
    // Iterate over each height material.
    for (let texIndex = 0; texIndex < heightTextures.length; texIndex++) {
      const heightTexture = heightTextures[texIndex];
      mesh.geometry.faces.forEach((face) => {
        const vertices = [
          mesh.geometry.vertices[face.a],
          mesh.geometry.vertices[face.b],
          mesh.geometry.vertices[face.c]
        ];
        // Detect if any of the vertices are within the height range for the
        // given texture.
        let withinHeightThreshold = false;
        let runningTotal = 0;
        vertices.forEach((vertex) => {
          if (vertex.y >= heightTexture.min && vertex.y <= heightTexture.max) {
            withinHeightThreshold = true;
          }
          runningTotal += vertex.y;
        });
        if (!withinHeightThreshold) {
          return;
        }

        // We'll use the height average from all of the vertices.
        const heightAvg = runningTotal / vertices.length;

        // Get the section of the canvas texture that is relevant to the face.
        const canvasBox = this.getFaceSegmentOnCanvas_(mesh, face, canvas);

        // Get "perlin range". If it covers all of face, do a batch paint and skip
        // the perlin noise gen.
        const perlinPercent =
          (heightAvg - heightTexture.min) /
          (heightTexture.solid - heightTexture.min);

        if (perlinPercent <= 0.0) {
          return;
        }

        // If the "perlin percent" is less than 1.0, we need to blend the
        // texture to a certain value. Otherwise, do a batch paint.
        if (perlinPercent < 1.0) {
          // Get the x and y offset in the perlin space.
          const xOffset = this.getCoordinates().x * canvas.width;
          const yOffset = this.getCoordinates().y * canvas.height;
          for (let i = canvasBox.min.x; i < canvasBox.max.x; i++) {
            for (let j = canvasBox.min.y; j < canvasBox.max.y; j++) {
              const x = i + xOffset;
              const y = j + yOffset;
              const perlinValue = noise.simplex2(
                x / heightTexture.perlinFactor,
                y / heightTexture.perlinFactor
              );
              const mappedValue = this.mapPerlinValue_(perlinValue);
              // TODO: Maybe set alpha.
              if (mappedValue <= perlinPercent) {
                context.fillStyle = heightTexture.color;
                context.fillRect(i, j, 1, 1);
              }
            }
          }
        } else {
          this.fillCanvasSection_(context, canvasBox, heightTexture.color);
        }
      });
    }
  }

  /**
   * Modifies the terrain texture for face slopes.\
   * @param {Canvas} canvas
   * @param {THREE.Mesh} mesh
   * @private
   */
  modifyTextureForSlope_(canvas, mesh) {
    const slopeModifier = {
      min: Math.PI / 4,
      max: Math.PI / 2,
      solid: Math.PI / 2,
      perlinFactor: 3.0,
      color: 'rgb(50, 50, 50)'
    };
    const context = canvas.getContext('2d');
    const planeVector = new THREE.Vector3();
    // Iterate over each face.
    mesh.geometry.faces.forEach((face) => {
      planeVector.set(face.normal.x, 0, face.normal.z);
      const angle = Math.PI / 2 - face.normal.angleTo(planeVector);
      // Get "perlin range". If it covers all of face, do a batch paint and skip
      // the perlin noise gen.
      const perlinPercent =
        (angle - slopeModifier.min) / (slopeModifier.solid - slopeModifier.min);
      if (perlinPercent <= 0.0) {
        return;
      }

      // Get the section of the canvas texture that is relevant to the face.
      const canvasBox = this.getFaceSegmentOnCanvas_(mesh, face, canvas);

      // If the "perlin percent" is less than 1.0, we need to blend the
      // texture to a certain value. Otherwise, do a batch paint.
      if (perlinPercent < 1.0) {
        // Get the face position.
        // TODO: Actually use the rock texture.
        // Get the x and y offset in the perlin space.
        const xOffset = this.getCoordinates().x * canvas.width;
        const yOffset = this.getCoordinates().y * canvas.height;
        for (let i = canvasBox.min.x; i < canvasBox.max.x; i++) {
          for (let j = canvasBox.min.y; j < canvasBox.max.y; j++) {
            const x = i + xOffset;
            const y = j + yOffset;
            const perlinValue = noise.simplex2(
              x / slopeModifier.perlinFactor,
              y / slopeModifier.perlinFactor
            );
            const mappedValue = this.mapPerlinValue_(perlinValue);
            // TODO: Maybe set alpha.
            if (mappedValue <= perlinPercent) {
              context.fillStyle = slopeModifier.color;
              context.fillRect(i, j, 1, 1);
            }
          }
        }
      } else {
        this.fillCanvasSection_(context, canvasBox, slopeModifier.color);
      }
    });
  }

  /**
   * Fills an entire section of canvas given a Box2.
   * @param {CanvasRenderingContext2D} context
   * @param {THREE.Box2} canvasBox
   * @param {string} fill
   * @private
   */
  fillCanvasSection_(context, canvasBox, fill) {
    context.globalAlpha = 1.0;
    context.fillStyle = fill;
    context.fillRect(
      canvasBox.min.x,
      canvasBox.min.y,
      canvasBox.max.x - canvasBox.min.x,
      canvasBox.max.y - canvasBox.min.y
    );
  }

  /**
   * Maps a perlin value to the range [0, 1].
   * @param {number} perlinValue
   * @return {number}
   * @private
   */
  mapPerlinValue_(perlinValue) {
    return (perlinValue + 1) / (PERLIN_RANGE + 1);
  }
}

export default TerrainTile;
