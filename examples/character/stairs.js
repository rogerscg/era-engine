import { Entity, MaterialManager } from '../../build/era.js';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

const MATERIAL = new THREE.MeshLambertMaterial({ color: 0x555555 });

/**
 * Stairs to be placed on the stage.
 */
class Stairs extends Entity {
  constructor(rise, run, steps, width) {
    super();
    this.rise = rise;
    this.run = run;
    this.steps = steps;
    this.width = width;
  }

  /** @override */
  generateMesh() {
    const root = new THREE.Object3D();
    const geometry = new THREE.BoxGeometry(this.run, this.rise, this.width);
    for (let i = 0; i < this.steps; i++) {
      const step = new THREE.Mesh(geometry, MATERIAL);
      const x = i * this.run;
      const y = i * this.rise;
      root.add(step);
      step.position.set(x, y, 0);
    }
    return root;
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body({
      mass: 0,
    });
    for (let i = 0; i < this.steps; i++) {
      const step = new CANNON.Box(
        new CANNON.Vec3(this.run / 2, this.rise / 2, this.width / 2)
      );
      const x = i * this.run;
      const y = i * this.rise;
      body.addShape(step, new CANNON.Vec3(x, y, 0));
    }
    body.material = MaterialManager.get().createPhysicalMaterial('ground');
    return body;
  }
}

export default Stairs;
