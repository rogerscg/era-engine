import Character from './character.js';
import Level from './level.js';
import {
  Camera,
  CannonPhysics,
  Controls,
  Engine,
  Environment,
  GameMode,
  Models
} from '../../src/era.js';

const LEVELS = [
  'level_1',
  'level_2',
  'level_3',
];

/**
 * Game mode for solving mazes.
 */
class MazeGameMode extends GameMode {
  constructor() {
    super();
    this.scene = null;
    this.physics = null;
    this.character = null;
    this.levels = null;
    this.levelIndex = 0;
    this.currentLevel = null;
  }

  /** @override */
  async load() {
    // Load models.
    await Models.get().loadAllFromFile('models.json');
    
    // Build camera and scene.
    Engine.get().setCamera(Camera.get().buildPerspectiveCamera());
    this.scene = Engine.get().getScene();

    // Create physics.
    this.physics = new CannonPhysics().withDebugRenderer();
    
    // Create environment.
    const environment =
      await new Environment().loadFromFile('environment.json');
    this.scene.add(environment);

    // Create character.
    this.character = new Character().withPhysics(this.physics).build();
    this.character.freeze();
    this.scene.add(this.character);
    this.physics.registerEntity(this.character);
    Controls.get().registerEntity(this.character);
    Controls.get().useOrbitControls();

    // Load levels.
    await this.loadLevel(this.levelIndex);
  }

  /** @override */
  async start() {
    const spawnPoint = this.currentLevel.getSpawnPoint();
    if (spawnPoint) {
      this.character.physicsBody.position.copy(spawnPoint.position);
      this.character.physicsBody.quaternion.copy(spawnPoint.quaternion);
    }
    this.character.unfreeze();
  }

  /**
   * Loads an individual level.
   * @param {number} levelIndex
   * @async
   */
  async loadLevel(levelIndex) {
    const levelName = LEVELS[levelIndex];
    // If the level does not exist, the player has completed the game.
    if (!levelName) {
      console.log('game over');
      return;
    }
    const level = new Level(levelName).withPhysics(this.physics);
    this.currentLevel = level;
    await level.load();
    level.build();
    this.scene.add(level);
    this.physics.registerEntity(level);
    Engine.get().attachCamera(level);
  }
}

export default MazeGameMode;