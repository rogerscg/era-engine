import { Object3D, Raycaster, Vector3 } from 'three';

/**
 * A spring arm used for attaching cameras to entities.
 */
class SpringArm extends Object3D {
  constructor() {
    super();
    this.camera = null;
    this.entity = null;
    this.distance = 1.0;
    this.raycaster = new Raycaster(new Vector3(), new Vector3(), 0.25, 1);
    this.cameraPosition = new Vector3();
    this.cameraGhost = new Object3D();
    this.cameraGhost.position.x = this.distance;
    this.targetPosition = new Vector3();
    this.lerpFactor = 0.15;
    this.cameraPadding = 1;
    this.add(this.cameraGhost);
  }

  setDistance(distance) {
    this.distance = distance;
    this.cameraGhost.position.x = this.distance;
    if (this.camera && this.camera.parent == this) {
      this.camera.position.x = distance;
    }
  }

  setCamera(camera) {
    this.camera = camera;
    this.add(camera);
    return this;
  }

  setEntity(entity) {
    this.entity = entity;
    this.entity.visualRoot.add(this);
    return this;
  }

  update() {
    if (!this.entity?.visualRoot || !this.camera) {
      return;
    }
    // Update the ray.
    this.getWorldPosition(this.raycaster.ray.origin);
    const objects = this.entity.getWorld()?.getRaycastObjects();
    let minDistance = this.distance;
    for (let y = 0; y < 2; y++) {
      for (let z = 0; z < 2; z++) {
        this.cameraGhost.position.y =
          y == 0 ? -this.cameraPadding : this.cameraPadding;
        this.cameraGhost.position.z =
          z == 0 ? -this.cameraPadding : this.cameraPadding;
        this.cameraGhost.getWorldPosition(this.cameraPosition);
        this.cameraPosition.sub(this.raycaster.ray.origin);
        const length = this.cameraPosition.length();
        this.raycaster.ray.direction.copy(this.cameraPosition.normalize());
        this.raycaster.far = length;
        // Cast against all objects.
        const intersections = this.raycaster.intersectObjects(
          objects,
          /*recurisve=*/ true
        );
        if (intersections.length > 0) {
          const intersection = intersections[0];
          if (intersection.distance < minDistance) {
            minDistance = intersection.distance;
          }
        }
      }
    }
    this.targetPosition.x = minDistance;
    this.cameraGhost.position.y = 0;
    this.cameraGhost.position.z = 0;
    this.camera.position.lerp(this.targetPosition, this.lerpFactor);
  }
}

export default SpringArm;
