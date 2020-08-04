import { TerrainTile } from '../../build/era.js';

/**
 * Terrain tile that adjusts quality.
 */
class CustomTerrainTile extends TerrainTile {
  /** @override */
  adjustQuality(distance) {
    if (!this.customMaterial) {
      this.customMaterial = this.mesh.material.clone();
      this.mesh.material = this.customMaterial;
    }
    if (distance > 15) {
      this.customMaterial.color.setHex(0x555555);
    } else {
      this.customMaterial.color.setHex(0xffffff);
    }
  }
}

export default CustomTerrainTile;
