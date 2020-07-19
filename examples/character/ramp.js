import { Entity, MaterialManager } from '../../build/era.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const SIDE = 3;
const GEOMETRY = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x555555 });

/**
 * A simple ramp.
 */
class Ramp extends Entity {
  /** @override */
  generateMesh() {
    return new THREE.Mesh(GEOMETRY, MATERIAL);
  }

  /** @override */
  generatePhysicsBody() {
    const quaternion = new CANNON.Quaternion();
    quaternion.setFromEuler(Math.PI / 6, Math.PI / 3, Math.PI / 4, 'XYZ');
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(SIDE / 2, SIDE / 2, SIDE / 2)),
      quaternion: quaternion,
    });
    body.material = MaterialManager.get().createPhysicalMaterial('ground');
    return body;
  }
}

export default Ramp;
