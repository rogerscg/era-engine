/**
 * @author rogerscg / https://github.com/rogerscg
 */

import Engine from './engine.js';
import Plugin from './plugin.js';
import Settings from './settings.js';

let instance = null;

/**
 * Light core for the game engine. Creates and manages light
 * sources in-game. Should be used as a singleton.
 */
class Light extends Plugin {
  /**
   * Enforces singleton light instance.
   */
  static get() {
    if (!instance) {
      instance = new Light();
    }
    return instance;
  }

  constructor() {
    super();
    this.ambientLight = null;
    this.directionalLights = [];
  }
  
  /** @override */
  reset() {
    instance = null;
    // TODO: Dispose of lighting objects correctly.
  }

  /** @override */
  update() {}

  /**
   * Creates the ambient lighting. Use this for easing/darkening shadows.
   */
  createAmbientLight(ambientConfig) {
    const ambientLight =
          new THREE.AmbientLight(parseInt(ambientConfig.color, 16));
    ambientLight.intensity = ambientConfig.intensity;
    Engine.get().getScene().add(ambientLight);
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
    if (Settings.get('shaders')) {
      this.shadersEnabled = true;
      this.createShaders(directionalLight);
    }
    Engine.get().getScene().add(directionalLight);
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
    if (Settings.get('shaders') && shaders) {
      this.shadersEnabled = true;
      this.createShaders(spotLight);
    }
    Engine.get().getScene().add(spotLight);
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
  
  /** @override */
  handleSettingsChange() {
    if (!!Settings.get('shaders') == !!this.shadersEnabled) {
      return;
    }
    if (Settings.get('shaders')) {
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
