import TerrainMap from './terrain/terrain_map.js';
import {
  Camera,
  CannonPhysics,
  Controls,
  Environment,
  FreeRoamEntity,
  GameMode,
  World,
  defaultEraRenderer
} from '../../src/era.js';

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
      .withPhysics(new CannonPhysics())
      .addRenderer(renderer)
      .addCameraForRenderer(Camera.get().buildPerspectiveCamera(), renderer);

    // Create environment.
    const environment = await new Environment().loadFromFile(
      'environment.json'
    );
    this.world.setEnvironment(environment);

    // Create character.
    this.character = new FreeRoamEntity();
    this.world.add(this.character).attachCameraToEntity(this.character);
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
    console.time('load-terrain');
    const terrainMap = new TerrainMap(/* tileSize= */ 64, /* scale=*/ 50.0);
    await terrainMap.loadFromFile('./terrain/heightmap_01.gltf');
    console.timeEnd('load-terrain');
    terrainMap.tiles.forEach((tile) => {
      if (tile.getCoordinates().x != 0 || tile.getCoordinates().y != 0) {
        //return;
      }
      this.world.add(tile);
    });
  }
}

export default TerrainGameMode;
