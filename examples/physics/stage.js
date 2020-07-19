import { Entity } from '../../build/era.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const SIDE = 50;
const GEOMETRY = new THREE.BoxGeometry(SIDE, SIDE, SIDE);
const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x999999 });

/**
 * The stage for ball arena.
 */
class Stage extends Entity {
  /** @override */
  generateMesh() {
    const ground = new THREE.Mesh(GEOMETRY, MATERIAL);
    return ground;
  }

  /** @override */
  positionCamera(camera) {
    this.cameraArm.add(camera);
    camera.position.x = 135;
    camera.position.y = 20;
    this.cameraArm.rotation.z = Math.PI / 6;
    this.cameraArm.rotation.y = -Math.PI / 4;
    const target = new THREE.Vector3().copy(this.position);
    target.y += 20;
    camera.lookAt(target);
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(SIDE / 2, SIDE / 2, SIDE / 2)),
      position: new CANNON.Vec3(0, -SIDE / 2, 0),
    });
    return body;
  }
}

export default Stage;
