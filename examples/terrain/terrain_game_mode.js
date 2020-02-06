import Terrain from './terrain.js';
import {
  Camera,
  CannonPhysics,
  Controls,
  Environment,
  FreeRoamEntity,
  GameMode,
  Models,
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
    // Load models.
    await Models.get().loadAllFromFile('models.json');

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
    const terrain = new Terrain().withPhysics();
    this.world.add(terrain);
  }

  /** @override */
  async start() {}
}

export default TerrainGameMode;
