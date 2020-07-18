import * as CANNON from 'cannon-es';
import * as THREE from 'three';

/**
 * Creates a physics body based on extra data provided from the model, such as
 * userData. This only works for a select number of objects, so please use
 * this carefully.
 */
class Autogenerator {
  /**
   * @param {THREE.Object3D} subject
   * @returns {CANNON.Body}
   */
  static generatePhysicsBody(subject) {
    // Root body.
    const body = new CANNON.Body({ mass: 0 });
    subject.traverse((child) => {
      const physicsType = child.userData.physics;
      if (!physicsType) {
        return;
      }
      switch (physicsType) {
        case 'BOX':
          this.autogenerateBox(body, child);
          break;
      }
    });
    return body;
  }

  /**
   * Generates a box shape and attaches it to the root body.
   * @param {CANNON.Body} body
   * @param {THREE.Object3D} subject
   */
  static autogenerateBox(body, subject) {
    const boundingBox = subject.geometry.boundingBox;
    let size = new THREE.Vector3();
    boundingBox.getSize(size);
    size.divideScalar(2);
    size = size.multiplyVectors(size, subject.scale);
    const shape = new CANNON.Box(new CANNON.Vec3().copy(size));
    const position = new CANNON.Vec3().copy(subject.position);
    const quaternion = new CANNON.Quaternion().copy(subject.quaternion);
    body.addShape(shape, position, quaternion);
  }
}

export default Autogenerator;
