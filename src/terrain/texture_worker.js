import Noise from 'noisejs';
import * as Comlink from 'comlink';
import { Box2, Color, Vector3 } from 'three';

// Perlin equation constants.
const PERLIN_RANGE = 1;

const noise = new Noise(0xbada55);

/**
 * Generates a texture for a terrain tile. This is meant to be run in a
 * WebWorker with Comlink.
 */
class TextureGenerator {
  /**
   * @param {number} size The width and height of the texture
   * @param {THREE.Vector2} coordinates The tile coordinates
   */
  constructor(size, coordinates) {
    // The width and height of the texture.
    this.size = size;
    // Create the image data.
    this.imageData = new ImageData(size, size);
    // Single instances for better memory usage.
    this.canvasBox2 = new Box2();
    this.planeVector = new Vector3();
    this.coordinates = coordinates;
  }

  /**
   * Generates the texture, returning the image data.
   * @param {Array<THREE.Face>} faces
   * @param {Array<THREE.Vector3>} vertices
   * @param {THREE.Box3} boundingBox
   * @return {ImageData}
   */
  generate(faces, vertices, boundingBox) {
    // Detect any changes necessary due to height.
    this.modifyTextureForHeight_(faces, vertices, boundingBox);

    // Detect any slope differences.
    this.modifyTextureForSlope_(faces, vertices, boundingBox);

    return this.imageData;
  }

  /**
   * Modifies the terrain texture for height differences.
   * @param {Array<THREE.Face>} faces
   * @param {Array<THREE.Vector3>} vertices
   * @param {THREE.Box3} boundingBox
   * @private
   */
  modifyTextureForHeight_(faces, vertices, boundingBox) {
    // Detect any height differences.
    // TODO: Set these dynamically.
    const heightTextures = [
      // River Bed
      {
        min: -999999999,
        max: 5,
        solid: -999999999,
        perlinFactor: 2.0,
        color: new Color(0x3d2612),
      },
      // Low Grass
      {
        min: 0,
        max: 10,
        solid: 5,
        perlinFactor: 0.3,
        color: new Color(0x2a471e),
      },
      // High Grass
      {
        min: 3,
        max: 21,
        solid: 9,
        perlinFactor: 2.0,
        color: new Color(0x567d46),
      },
      // Rock
      {
        min: 12,
        max: 36,
        solid: 20,
        perlinFactor: 5.0,
        color: new Color('rgb(50, 50, 50)'),
      },
      // Ice
      {
        min: 28,
        max: Infinity,
        solid: 35,
        perlinFactor: 3.0,
        color: new Color('rgb(150, 150, 150)'),
      },
    ];
    // Iterate over each height material.
    for (let texIndex = 0; texIndex < heightTextures.length; texIndex++) {
      const heightTexture = heightTextures[texIndex];
      faces.forEach((face) => {
        const faceVertices = [
          vertices[face.a],
          vertices[face.b],
          vertices[face.c],
        ];
        // Detect if any of the vertices are within the height range for the
        // given texture.
        let withinHeightThreshold = false;
        let runningTotal = 0;
        faceVertices.forEach((vertex) => {
          if (vertex.y >= heightTexture.min && vertex.y <= heightTexture.max) {
            withinHeightThreshold = true;
          }
          runningTotal += vertex.y;
        });
        if (!withinHeightThreshold) {
          return;
        }

        // We'll use the height average from all of the vertices.
        const heightAvg = runningTotal / faceVertices.length;

        // Get the section of the canvas texture that is relevant to the face.
        const canvasBox = this.getFaceSegmentOnCanvas_(
          faceVertices,
          boundingBox
        );

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
          const xOffset = this.coordinates.x * this.size;
          const yOffset = this.coordinates.y * this.size;
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
                // TODO: get color from texture
                this.fillImageDataPixel_(i, j, heightTexture.color);
              }
            }
          }
        } else {
          this.fillImageDataSection_(canvasBox, heightTexture.color);
        }
      });
    }
  }

  /**
   * Modifies the terrain texture for face slopes.\
   * @param {Array<THREE.Face>} faces
   * @param {Array<THREE.Vector3>} vertices
   * @param {THREE.Box3} boundingBox
   * @private
   */
  modifyTextureForSlope_(faces, vertices, boundingBox) {
    const slopeModifier = {
      min: Math.PI / 4,
      max: Math.PI / 2,
      solid: Math.PI / 2,
      perlinFactor: 3.0,
      color: new Color('rgb(50, 50, 50)'),
    };
    const planeVector = this.planeVector;
    // Iterate over each face.
    faces.forEach((face) => {
      planeVector.set(face.normal.x, 0, face.normal.z);
      face.normal = new Vector3().copy(face.normal);
      const angle = Math.PI / 2 - face.normal.angleTo(planeVector);
      // Get "perlin range". If it covers all of face, do a batch paint and skip
      // the perlin noise gen.
      const perlinPercent =
        (angle - slopeModifier.min) / (slopeModifier.solid - slopeModifier.min);
      if (perlinPercent <= 0.0) {
        return;
      }

      // Get the section of the canvas texture that is relevant to the face.
      const faceVertices = [
        vertices[face.a],
        vertices[face.b],
        vertices[face.c],
      ];
      const canvasBox = this.getFaceSegmentOnCanvas_(faceVertices, boundingBox);

      // If the "perlin percent" is less than 1.0, we need to blend the
      // texture to a certain value. Otherwise, do a batch paint.
      if (perlinPercent < 1.0) {
        // Get the face position.
        // TODO: Actually use the rock texture.
        // Get the x and y offset in the perlin space.
        const xOffset = this.coordinates.x * this.size;
        const yOffset = this.coordinates.y * this.size;
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
              this.fillImageDataPixel_(i, j, slopeModifier.color);
            }
          }
        }
      } else {
        this.fillImageDataSection_(canvasBox, slopeModifier.color);
      }
    });
  }

  /**
   * Gets the section of the image data that the given face affects.
   * @param {Array<THREE.Vector3>} vertices
   * @param {THREE.Box3} boundingBox
   * @return {THREE.Box2}
   * @private
   */
  getFaceSegmentOnCanvas_(vertices, boundingBox) {
    const size = this.size;
    const minX = Math.min(...vertices.map((x) => x.x));
    const maxX = Math.max(...vertices.map((x) => x.x));
    const minZ = Math.min(...vertices.map((x) => x.z));
    const maxZ = Math.max(...vertices.map((x) => x.z));
    // Map the face min/max to the geometry min/max.
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
   * Fills an individual pixel into the tile's image data.
   * @param {number} x
   * @param {number} y
   * @param {THREE.Color} color
   */
  fillImageDataPixel_(x, y, color) {
    // Get the pixel's index in the image data array.
    const index = (this.imageData.width * y + x) * 4;
    this.imageData.data[index] = Math.floor(color.r * 255);
    this.imageData.data[index + 1] = Math.floor(color.g * 255);
    this.imageData.data[index + 2] = Math.floor(color.b * 255);
    this.imageData.data[index + 3] = 255;
  }

  /**
   * Fills an entire section of image data given a Box2.
   * @param {THREE.Box2} canvasBox
   * @param {string} fill
   * @private
   */
  fillImageDataSection_(canvasBox, fill) {
    for (let i = canvasBox.min.x; i < canvasBox.max.x; i++) {
      for (let j = canvasBox.min.y; j < canvasBox.max.y; j++) {
        this.fillImageDataPixel_(i, j, fill);
      }
    }
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

Comlink.expose(TextureGenerator);
