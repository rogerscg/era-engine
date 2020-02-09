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
    const terrainMap = new TerrainMap(512);
    await terrainMap.loadFromFile('./terrain/heightmap_01.gltf');
    terrainMap.tiles.forEach((tile) => {
      this.world.add(tile);
      //tile.position.x = (tile.getCoordinates().x - 4) * 64;
      //tile.position.z = (tile.getCoordinates().y - 4) * 64;
    });
  }
}

export default TerrainGameMode;
