import Controls from './controls.js';
import Settings from './settings.js';
import SettingsEvent from '../events/settings_event.js';

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
    this.vectorDummy = new THREE.Vector3();
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
    const entities = this.world.entities;
    Controls.get().registeredEntities.forEach((attachedEntity) => {
      this.rootBox.setFromCenterAndSize(attachedEntity.position, QUALITY_RANGE);
      entities.forEach((entity) => {
        if (entity == attachedEntity) {
          return;
        }
        if (!entity.qualityAdjustEnabled) {
          return;
        }
        this.entityBox.setFromObject(entity);
        if (this.rootBox.intersectsBox(this.entityBox)) {
          this.world.enableEntityPhysics(entity);
        } else {
          this.world.disableEntityPhysics(entity);
        }
      });
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
