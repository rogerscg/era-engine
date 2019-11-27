import Events from './events.js';
import Settings from './settings.js';

/**
 * Light core for the game engine. Creates and manages light
 * sources in-game. Should be used as a singleton.
 */

let lightInstance = null;

class Light {

  /**
   * Enforces singleton light instance.
   */
  static get() {
    if (!lightInstance) {
      lightInstance = new Light();
    }
    return lightInstance;
  }

  constructor() {
    this.ambientLight = null;
    this.directionalLights = [];
    this.settingsListener = Events.get().addListener(
      'settings', this.handleSettingsChange.bind(this)
    );
  }
  
  /**
   * Resets the lighting.
   */
  reset() {
    lightInstance = null;
  }
  
  /**
   * Sets the lighting based on arena lighting config.
   */
  setArenaLighting(lightingConfig) {
    this.ambientLight = this.createAmbientLight(lightingConfig.ambient);
    this.directionalLights =
      this.createDirectionalLights(lightingConfig.directional);
    this.spotLights =
      this.createSpotLights(lightingConfig.spotlight);
  }

  /**
   * Creates the ambient lighting. Use this for easing/darkening shadows.
   */
  createAmbientLight(ambientConfig) {
    const ambientLight =
          new THREE.AmbientLight(parseInt(ambientConfig.color, 16));
    ambientLight.intensity = ambientConfig.intensity;
    engine.getScene().add(ambientLight);
    return ambientLight;
  }

  /**
   * Creates the entire set of directional lights.
   */
  createDirectionalLights(directionalConfig) {
    const directionalLights = [];
    if (!directionalConfig || !directionalConfig.length) {
      return directionalLights;
    }
    for (let i = 0; i < directionalConfig.length; i++) {
      const light = directionalConfig[i];
      const x = light.x;
      const y = light.y;
      const z = light.z;
      const color = parseInt(light.color, 16);
      const intensity = light.intensity;
      directionalLights.push(
        this.createDirectionalLight(x, y, z, color, intensity));
    }
    return directionalLights;
  }

  /**
   * Creates the directional lighting. Use this for generating shadows.
   */
  createDirectionalLight(x, y, z, color, intensity) {
    const directionalLight = new THREE.DirectionalLight(color);
    directionalLight.position.set(x, y, z);
    directionalLight.intensity = intensity;
    if (Settings.get().settingsObject.shaders) {
      this.shadersEnabled = true;
      this.createShaders(directionalLight);
    }
    engine.getScene().add(directionalLight);
    return directionalLight;
  }
  
  /**
   * Creates the entire set of directional lights.
   */
  createSpotLights(spotConfig) {
    const spotLights = new Array();
    if (!spotConfig || !spotConfig.length) {
      return spotLights;
    }
    for (let i = 0; i < spotConfig.length; i++) {
      const light = spotConfig[i];
      const x = light.x;
      const y = light.y;
      const z = light.z;
      const color = parseInt(light.color, 16);
      const intensity = light.intensity;
      const angle = light.angle;
      const penumbra = light.penumbra;
      const shaders = light.shaders;
      spotLights.push(this.createSpotLight(
        x, y, z, color, intensity, angle, penumbra, shaders));
    }
    return spotLights;
  }
  
  /**
   * Creates a spot light. Use this for generating shadows.
   */
  createSpotLight(x, y, z, color, intensity, angle, penumbra, shaders) {
    const spotLight = new THREE.SpotLight(color);
    spotLight.position.set(x, y, z);
    spotLight.intensity = intensity;
    spotLight.angle = angle;
    spotLight.penumbra = penumbra;
    if (Settings.get().settingsObject.shaders && shaders) {
      this.shadersEnabled = true;
      this.createShaders(spotLight);
    }
    window.spotLight = spotLight;
    engine.getScene().add(spotLight);
    return spotLight;
  }

  /**
   * Creates the shaders for a directional light.
   */
  createShaders(light) {
    const cameraRange = 120;
    light.castShadow = true;
    light.shadow.camera.bottom = -cameraRange;
    light.shadow.camera.left = -cameraRange;
    light.shadow.camera.right = cameraRange;
    light.shadow.camera.top = cameraRange;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 500;
    light.shadow.bias = .0001;
    light.shadow.radius = 4;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
  }
  
  /**
   * Handles the settings change event.
   */
  handleSettingsChange(e) {
    const settings = e.settings;
    if (!!settings.shaders == !!this.shadersEnabled) {
      return;
    }
    if (settings.shaders) {
      this.enableShaders();
    } else {
      this.disableShaders();
    }
  }
  
  /**
   * Enables shaders.
   */
  enableShaders() {
    this.shadersEnabled = true;
    this.directionalLights.forEach((light) => {
      this.createShaders(light);
    });
    this.spotLights.forEach((light) => {
      this.createShaders(light);
    });
  }
  
  /**
   * Disables shaders.
   */
  disableShaders() {
    this.shadersEnabled = false;
    this.directionalLights.forEach((light) => {
      light.castShadow = false;
    });
    this.spotLights.forEach((light) => {
      light.castShadow = false;
    });
  }

}

export default Light;
