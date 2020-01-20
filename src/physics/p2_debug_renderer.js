import DebugRenderer from "./debug_renderer";

/**
 * Adds Three.js primitives into the scene where all the p2 bodies and shapes
 * are.
 */
class P2DebugRenderer extends DebugRenderer {
  constructor(scene, world) {
    super(scene, world);

    this._meshes = [];
    this._material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true
    });
    this._boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 10, 10);
    this.tmpVec = new Array(2).fill(0);
    this.tmpRot = new Array(2).fill(0);
  }

  /** @override */
  update() {
    var bodies = this.world.bodies;
    var meshes = this._meshes;
    var shapeWorldPosition = this.tmpVec;
    var shapeRot = this.tmpRot;

    var meshIndex = 0;

    bodies.forEach((body) => {
      body.shapes.forEach((shape) => {
        this._updateMesh(meshIndex, body, shape);
        var mesh = meshes[meshIndex];
        if (mesh) {
          // Get world position
          p2.vec2.copy(shapeWorldPosition, body.interpolatedPosition);
          p2.vec2.rotate(shapeRot, shape.position, body.interpolatedAngle);
          p2.vec2.add(shapeWorldPosition, shapeWorldPosition, shapeRot);

          // Copy to meshes
          mesh.position.set(shapeWorldPosition[0], 0, shapeWorldPosition[1]);
          mesh.rotation.y = -body.interpolatedAngle - shape.angle;
        }
        meshIndex++;
      });
    });

    for (var i = meshIndex; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh) {
        this.scene.remove(mesh);
      }
    }

    meshes.length = meshIndex;
  }

  _updateMesh(index, body, shape) {
    var mesh = this._meshes[index];
    if (!this._typeMatch(mesh, shape)) {
      if (mesh) {
        this.scene.remove(mesh);
      }
      mesh = this._meshes[index] = this._createMesh(shape);
    }
    this._scaleMesh(mesh, shape);
  }

  _typeMatch(mesh, shape) {
    if (!mesh) {
      return false;
    }
    var geo = mesh.geometry;
    return (
      (geo instanceof THREE.CylinderGeometry && shape instanceof p2.Circle) ||
      (geo instanceof THREE.BoxGeometry && shape instanceof p2.Convex) ||
      (geo instanceof THREE.BoxGeometry && shape instanceof p2.Line) ||
      (geo instanceof THREE.BoxGeometry && shape instanceof p2.Box)
    );
  }

  _createMesh(shape) {
    var mesh;
    var material = this._material;
    if (shape.debugColor) {
      material = material.clone();
      material.color.setHex(shape.debugColor);
    }

    switch (shape.type) {

      case p2.Shape.CIRCLE:
        mesh = new THREE.Mesh(this._cylinderGeometry, material);
        break;

      case p2.Shape.BOX:
      case p2.Shape.CONVEX:
      case p2.Shape.LINE:
        mesh = new THREE.Mesh(this._boxGeometry, material);
        break;
    }

    if (mesh) {
      this.scene.add(mesh);
    }

    return mesh;
  }

  _scaleMesh(mesh, shape) {
    if (!mesh) {
      return;
    }
    switch (shape.type) {

      case p2.Shape.CIRCLE:
        var radius = shape.radius;
        mesh.scale.set(radius, radius, radius);
        break;

      case p2.Shape.BOX:
      case p2.Shape.CONVEX:
        mesh.scale.set(shape.width, 5, shape.height);
        break;
      case p2.Shape.LINE:
        mesh.scale.set(shape.length, 5, .2);
        break;

    }
  }
}

export default P2DebugRenderer;