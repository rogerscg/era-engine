import {
  Camera,
  CannonPhysics,
  Controls,
  Environment,
  FreeRoamEntity,
  GameMode,
  QualityAdjuster,
  TerrainMap,
  World,
  defaultEraRenderer
} from '../../src/era.js';

/**
 * Game mode for walking around terrain. It's not very exciting.
 */
class LodGameMode extends GameMode {
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
      .addCameraForRenderer(Camera.get().buildPerspectiveCamera(), renderer)
      .withQualityAdjustment(new QualityAdjuster());

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
    const terrainMap = new TerrainMap(/* tileSize= */ 64);
    const terrainGeometry = new THREE.PlaneGeometry(100, 100, 256, 256);
    terrainGeometry.rotateX(-Math.PI / 2);
    await terrainMap.loadFromGeometry(terrainGeometry);
    terrainMap.tiles.forEach((tile) => this.world.add(tile));
  }
}

export default LodGameMode;
