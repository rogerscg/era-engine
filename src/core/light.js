/**
 * @author rogerscg / https://github.com/rogerscg
 */
import Plugin from './plugin.js';
import Settings from './settings.js';
import { getRootScene } from './util.js';
import * as THREE from 'three';

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
    this.lights = new Array();
    this.debugEnabled = false;
    this.shadowsEnabled = false;
    this.handleSettingsChange();
  }

  /** @override */
  reset() {
    this.ambientLight = null;
    this.lights.forEach((light) => {
      this.removeHelpers(light);
      if (light.parent) {
        light.parent.remove(light);
      }
    });
    this.lights = new Array();
  }

  /** @override */
  update() {
    this.updateHelpers();
  }

  /**
   * Updates all helpers attached to lights.
   */
  updateHelpers() {
    // If debug settings are enabled, check for lights and their debug helpers.
    if (this.debugEnabled) {
      this.lights.forEach((light) => this.addHelpers(light));
    } else {
      this.lights.forEach((light) => this.removeHelpers(light));
    }
  }

  /**
   * Creates the ambient lighting. Use this for easing/darkening shadows.
   * @param {Object|LightOptions} options
   */
  createAmbientLight(options) {
    options = new LightOptions(options);
    const light = new THREE.AmbientLight(options.color);
    light.intensity = options.intensity;
    this.ambientLight = light;
    return light;
  }

  /**
   * Creates a directional light.
   * @param {Object|LightOptions} options
   */

  createDirectionalLight(options) {
    options = new LightOptions(options);
    const light = new THREE.DirectionalLight(options.color);
    light.userData.options = options;
    light.position.copy(options.position);
    light.intensity = options.intensity;
    this.createShadows(light, options.shadow);
    light.helper = new THREE.DirectionalLightHelper(light, 10);
    this.lights.push(light);
    return light;
  }

  /**
   * Creates a spot light.
   * @param {Object|LightOptions} options
   */
  createSpotLight(options) {
    options = new LightOptions(options);
    const light = new THREE.SpotLight(options.color);
    light.userData.options = options;
    light.position.copy(options.position);
    light.intensity = options.intensity;
    if (options.angle) {
      light.angle = options.angle;
    }
    if (options.penumbra) {
      light.penumbra = options.penumbra;
    }
    this.createShadows(light, options.shadow);
    light.helper = new THREE.SpotLightHelper(light);
    this.lights.push(light);
    return light;
  }

  /**
   * Creates the shadows for a light.
   * @param {THREE.Light} light
   * @param {ShadowOptions} options
   */
  createShadows(light, options) {
    if (!options) {
      return;
    }
    const cameraRange = options.frustum;
    light.shadow.camera.bottom = -cameraRange;
    light.shadow.camera.left = -cameraRange;
    light.shadow.camera.right = cameraRange;
    light.shadow.camera.top = cameraRange;
    light.shadow.camera.near = options.near;
    light.shadow.camera.far = options.far;
    if (options.radius) {
      light.shadow.radius = options.radius;
    }
    if (options.bias) {
      light.shadow.bias = options.bias;
    }
    light.shadow.mapSize.width = options.mapSize;
    light.shadow.mapSize.height = options.mapSize;
    light.shadow.helper = new THREE.CameraHelper(light.shadow.camera);
    if (Settings.get('shadows')) {
      light.castShadow = true;
    }
  }

  /** @override */
  handleSettingsChange() {
    Settings.get('shadows') ? this.enableShadows() : this.disableShadows();
    Settings.get('debug') ? this.enableDebug() : this.disableDebug();
  }

  /**
   * Enables shadows.
   */
  enableShadows() {
    if (this.shadowsEnabled) {
      return;
    }
    this.shadowsEnabled = true;
    this.lights.forEach((light) => {
      const options = light.userData.options;
      if (!options) {
        return;
      }
      if (options.shadow) {
        light.castShadow = true;
      }
    });
  }

  /**
   * Disables shadows.
   */
  disableShadows() {
    if (!this.shadowsEnabled) {
      return;
    }
    this.shadowsEnabled = false;
    this.lights.forEach((light) => (light.castShadow = false));
  }

  /**
   * Enables debug renderering.
   */
  enableDebug() {
    if (this.debugEnabled) {
      return;
    }
    this.debugEnabled = true;
    this.lights.forEach((light) => this.addHelpers(light));
  }

  /**
   * Disables debug rendering.
   */
  disableDebug() {
    if (!this.debugEnabled) {
      return;
    }
    this.debugEnabled = false;
    this.lights.forEach((light) => this.removeHelpers(light));
  }

  /**
   * Adds the provided light's helpers to the root scene.
   * @param {THREE.Light} light
   */
  addHelpers(light) {
    // Handle base light helper first.
    let rootScene = getRootScene(light);
    if (light.helper && !light.helper.parent) {
      rootScene = getRootScene(light);
      if (rootScene) {
        rootScene.add(light.helper);
      }
    }
    if (
      Settings.get('shadows') &&
      light.shadow &&
      light.shadow.helper &&
      !light.shadow.helper.parent
    ) {
      if (!rootScene) {
        rootScene = getRootScene(light);
      }
      if (rootScene) {
        rootScene.add(light.shadow.helper);
      }
    }
  }

  /**
   * Removes a light's helpers from their scene.
   * @param {THREE.Light} light
   */
  removeHelpers(light) {
    if (light.helper && light.helper.parent) {
      light.helper.parent.remove(light.helper);
    }
    if (light.shadow && light.shadow.helper && light.shadow.helper.parent) {
      light.shadow.helper.parent.remove(light.shadow.helper);
    }
    light.userData.addedToScene = false;
  }
}

/**
 * Light options created from a light config passed in by the user.
 * @record
 */
class LightOptions {
  /**
   * @param {Object} options
   */
  constructor(options) {
    this.angle = options.angle;
    this.color = options.color ? parseInt(options.color, 16) : 0xffffff;
    this.decay = options.decay;
    this.distance = options.distance;
    this.groundColor = options.groundColor
      ? parseInt(options.groundColor, 16)
      : 0xffffff;
    this.intensity = options.intensity || 1.0;
    this.penumbra = options.penumbra;
    this.position = new THREE.Vector3(
      options.x || 0,
      options.y || 0,
      options.z || 0
    );
    this.power = options.power;
    this.shadow = options.shadow ? new ShadowOptions(options.shadow) : null;
  }
}

/**
 * Shadow options attached to a light config.
 * @record
 */
class ShadowOptions {
  /**
   * @param {Object} options
   */
  constructor(options) {
    this.frustum = options.frustum || 10;
    this.mapSize = options.mapSize || 1024;
    this.near = options.near || 1;
    this.far = options.far || 100;
    this.radius = options.radius || null;
    this.bias = options.bias || null;
  }
}

export default Light;
