import Character from './character.js';
import {
  Camera,
  CannonPhysics,
  Controls,
  Engine,
  Environment,
  GameMode,
  Models
} from '../../src/era.js';
import Stage from './stage.js';

/**
 * Game mode for solving mazes.
 */
class MazeGameMode extends GameMode {
  constructor() {
    super();
    this.scene = null;
    this.physics = null;
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

    // Create stage.
    // TODO: Load levels.
    const stage = new Stage().withPhysics(this.physics).build();
    this.scene.add(stage);
    this.physics.registerEntity(stage);

    // Create character.
    const character = new Character().withPhysics(this.physics).build();
    this.scene.add(character);
    this.physics.registerEntity(character);
    Engine.get().attachCamera(character);
    Controls.get().registerEntity(character);
    Controls.get().usePointerLockControls();
  }
}

export default MazeGameMode;