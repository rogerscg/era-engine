import { Entity } from '../../../src/era.js';
import { Water as WebGLWater } from '../../../dependencies/water.js';

/**
 * Simple water entity for terrain.
 */
class Water extends Entity {
  /** @override */
  generateMesh() {
    const geometry = new THREE.PlaneGeometry(1000, 1000);
    const water = new WebGLWater(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        'textures/waternormals.jpg',
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      alpha: 1.0,
      size: 0.1,
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      fog: true,
      distortionScale: 3.7
    });
    water.position.y = 1;
    water.rotation.x = -Math.PI / 2;
    water.receiveShadow = false;
    water.castShadow = false;
    return water;
  }

  /** @override */
  update() {
    this.mesh.material.uniforms['time'].value += 1.0 / 160.0;
  }
}

export default Water;
