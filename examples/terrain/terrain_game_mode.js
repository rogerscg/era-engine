import CustomTerrainTile from './custom_terrain_tile.js';
import textureWorkerPool from './texture_worker_pool.js';
import {
  Camera,
  Controls,
  Environment,
  FreeRoamEntity,
  GameMode,
  QualityAdjuster,
  TerrainMap,
  World,
  defaultEraRenderer,
} from '../../build/era.js';

/**
 * Game mode for walking around terrain. It's not very exciting.
 */
class TerrainGameMode extends GameMode {
  constructor() {
    super();
    this.world = null;
    this.character = null;
  }

  /** @override */
  async load() {
    // Create world.
    const renderer = defaultEraRenderer();
    this.world = new World()
      .withPhysics()
      .addRenderer(renderer)
      .addCameraForRenderer(Camera.get().buildPerspectiveCamera(), renderer)
      .withQualityAdjustment(new QualityAdjuster());

    // Create environment.
    const environment = await new Environment().loadFromFile(
      'environment.json'
    );
    this.world.setEnvironment(environment);

    // Create character.
    this.character = new FreeRoamEntity();
    await this.world.add(this.character);
    this.world.attachCameraToEntity(this.character);
    Controls.get().registerEntity(this.character);
    Controls.get().usePointerLockControls();

    // Load terrain.
    await this.loadTerrain();
  }

  /** @override */
  async start() {}

  /**
   * Generates terrain.
   * @async
   */
  async loadTerrain() {
    console.time('load');
    textureWorkerPool.prewarm();
    const terrainMap = new TerrainMap(/* tileSize= */ 64, /* scale=*/ 40.0);
    terrainMap.setTerrainTileClass(CustomTerrainTile);
    await terrainMap.loadFromFile('heightmaps/simple.gltf');
    terrainMap.tiles.forEach((tile) => this.world.add(tile));
    textureWorkerPool.drain();
    console.timeEnd('load');
  }
}

export default TerrainGameMode;
