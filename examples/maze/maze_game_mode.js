import Character from './character.js';
import Level from './level.js';
import {
  Audio,
  Camera,
  CannonPhysics,
  Controls,
  Environment,
  GameMode,
  Models,
  World
} from '../../src/era.js';

const LEVELS = ['level_1', 'level_2', 'level_3'];

/**
 * Game mode for solving mazes.
 */
class MazeGameMode extends GameMode {
  constructor() {
    super();
    this.world = null;
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
    await Audio.get().loadSound('', 'ding', { extension: 'mp3' });

    // Create renderer.
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.powerPreference = 'high-performance';
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create world.
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
    this.character = new Character().withPhysics();
    this.character.freeze();
    this.world.add(this.character);
    Controls.get().registerEntity(this.character);

    // Load levels.
    await this.loadLevel(this.levelIndex);
  }

  /** @override */
  async start() {
    this.startLevel();
    this.character.unfreeze();
  }

  /**
   * Loads an individual level.
   * @param {number} levelIndex
   * @async
   */
  async loadLevel(levelIndex) {
    const levelName = LEVELS[levelIndex];
    const level = new Level(levelName).withPhysics(this.physics);
    level.addOneShotEventListener('complete', () => {
      setTimeout(() => this.completeLevel(), 1000);
    });
    this.currentLevel = level;
    await level.load();
    this.world.add(level).attachCameraToEntity(level);
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
      this.character.freeze();
      return this.end();
    }
    this.currentLevel.destroy();
    await this.loadLevel(this.levelIndex);
    this.startLevel();
  }
}

export default MazeGameMode;
