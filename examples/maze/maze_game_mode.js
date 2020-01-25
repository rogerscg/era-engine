import Character from './character.js';
import Level from './level.js';
import {
  Audio,
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

    // Load audio.
    await Audio.get().loadSound('', 'ding', {extension: 'mp3'});
    
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
    this.startLevel();
    this.character.unfreeze();
  }

  /** @override */
  async end() {
    console.log('game over');
  }

  /**
   * Loads an individual level.
   * @param {number} levelIndex
   * @async
   */
  async loadLevel(levelIndex) {
    const levelName = LEVELS[levelIndex];
    const level = new Level(levelName).withPhysics(this.physics);
    // TODO: Support one-shot event listeners.
    const levelEventListener = level.addEventListener('complete', () => {
      level.removeEventListener(levelEventListener);
      setTimeout(() => this.completeLevel(), 1000);
    });
    this.currentLevel = level;
    await level.load();
    level.build();
    this.scene.add(level);
    this.physics.registerEntity(level);
    Engine.get().attachCamera(level);
  }

  /**
   * Starts a level, placing the character at the spawn point.
   */
  startLevel() {
    const spawnPoint = this.currentLevel.getSpawnPoint();
    if (spawnPoint) {
      this.character.physicsBody.position.copy(spawnPoint.position);
      this.character.physicsBody.quaternion.copy(spawnPoint.quaternion);
    }
  }

  /**
   * Marks a level as complete, cleans it up, and loads the next one.
   */
  async completeLevel() {
    this.levelIndex++;
    if (this.levelIndex >= LEVELS.length) {
      return this.end();
    }
    this.currentLevel.destroy();
    await this.loadLevel(this.levelIndex);
    this.startLevel();
  }
}

export default MazeGameMode;