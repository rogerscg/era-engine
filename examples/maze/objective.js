import {Entity} from '../../src/era.js';

const WIDTH = 1;
const HEIGHT = 1.5;
const DEPTH = .2;
const GEOMETRY = new THREE.BoxGeometry(WIDTH, HEIGHT, DEPTH);
const MATERIAL = new THREE.MeshLambertMaterial({ color: 0xFFD700 });

/**
 * A maze objective. The level completes when the character collides with it.
 */
class Objective extends Entity {
  constructor() {
    super();
    this.cumulativeTime = 0;
    this.completed = false;
  }

  /** @override */
  generateMesh() {
    return new THREE.Mesh(GEOMETRY, MATERIAL);
  }

  /** @override */
  generatePhysicsBody() {
    const body = new CANNON.Body({mass: 0});
    const shape =
      new CANNON.Box(new CANNON.Vec3(WIDTH / 2, WIDTH / 2, WIDTH / 2));
    body.addShape(shape);
    body.collisionResponse = 0;
    return body;
  }

  /** @override */
  update(delta) {
    // Small animation for the objective.
    this.cumulativeTime += delta;
    super.update();
    const amp = .25;
    this.mesh.position.y = amp * (Math.sin(this.cumulativeTime / 500) - .5);
    this.mesh.rotation.y = this.cumulativeTime / 1000;
  }

  /** @override */
  handleCollision(e) {
    if (this.completed) {
      return;
    }
    this.completed = true;
    console.log('mission complete');
  }
}

export default Objective;