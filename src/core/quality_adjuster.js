import Controls from './controls.js';
import Settings from './settings.js';
import SettingsEvent from '../events/settings_event.js';
import * as THREE from 'three';

// Range for the quality adjustment.
// TODO: Make this dynamic, with multiple levels.
const QUALITY_RANGE = new THREE.Vector3().setScalar(2);

/**
 * A world plugin for adjusting the quality of entities given their proximity to
 * the camera or main entity. These adjustments include enabling/disabling
 * physics for entities, lowering geometry quality (redundant vertices), etc.
 */
class QualityAdjuster {
  constructor() {
    this.rootBox = new THREE.Box3();
    this.rootBoxHelper = new THREE.Box3Helper(this.rootBox, 0xffff00);
    this.cameraPosition = new THREE.Vector3();
    this.entityBox = new THREE.Box3();

    SettingsEvent.listen(this.handleSettingsChange.bind(this));
  }

  /**
   * @param {World} world Parent world that the adjuster operates on.
   * @return {QualityAdjuster}
   */
  setWorld(world) {
    this.world = world;
    this.handleSettingsChange();
    return this;
  }

  /**
   * Iterates through all of the worlds entities and adjusts their quality, if
   * necessary.
   */
  update() {
    this.updatePhysicsQuality_();
    this.updateEntitiesWithCustomQuality_();
  }

  /**
   * Updates the physics of a given entity, if necessary.
   */
  updatePhysicsQuality_() {
    this.world.entities.forEach((entity) => {
      if (!entity.physicsQualityAdjustEnabled) {
        return;
      }
      let intersected = false;
      this.entityBox.setFromObject(entity.visualRoot);
      Controls.get().registeredEntities.forEach((attachedEntity) => {
        if (attachedEntity == entity) {
          return;
        }
        this.rootBox.setFromCenterAndSize(
          attachedEntity.visualRoot.position,
          QUALITY_RANGE
        );
        if (this.rootBox.intersectsBox(this.entityBox)) {
          intersected = true;
        }
      });
      // If the entity intersected with any of the controlled entities, enable
      // physics.
      intersected
        ? this.world.enableEntityPhysics(entity)
        : this.world.disableEntityPhysics(entity);
    });
  }

  /**
   * Fires custom updates of entities.
   */
  updateEntitiesWithCustomQuality_() {
    this.world.entities.forEach((entity) => {
      if (!entity.hasCustomQualityAdjust || !entity.visualRoot) {
        return;
      }
      let minCameraDistance = Infinity;
      this.world.cameras.forEach((camera) => {
        camera.getWorldPosition(this.cameraPosition);
        this.entityBox.setFromObject(entity.visualRoot);
        const dist = this.entityBox.distanceToPoint(this.cameraPosition);
        if (dist < minCameraDistance) {
          minCameraDistance = dist;
        }
      });
      // Allow the entity to update its own quality.
      if (minCameraDistance != Infinity) {
        entity.adjustQuality(minCameraDistance);
      }
    });
  }

  handleSettingsChange() {
    if (!this.world) {
      return;
    }
    if (Settings.get('debug')) {
      this.world.getScene().add(this.rootBoxHelper);
    } else {
      this.world.getScene().remove(this.rootBoxHelper);
    }
  }
}

export default QualityAdjuster;
