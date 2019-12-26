import { Entity } from '/src/era.js';

const GEOMETRY = new THREE.SphereGeometry(2, 32, 32);
const MATERIAL = new THREE.MeshLambertMaterial({color: 0xff6600});

class Ball extends Entity {
  constructor() {
    super();
  }

  /** @override */
  generateMesh() {
    return new THREE.Mesh(GEOMETRY, MATERIAL);
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.z = 35;
  }
}

export default Ball;
