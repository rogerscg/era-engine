import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _classCallCheck from '@babel/runtime/helpers/classCallCheck';
import _createClass from '@babel/runtime/helpers/createClass';
import _inherits from '@babel/runtime/helpers/inherits';
import _possibleConstructorReturn from '@babel/runtime/helpers/possibleConstructorReturn';
import _getPrototypeOf from '@babel/runtime/helpers/getPrototypeOf';
import _regeneratorRuntime from '@babel/runtime/regenerator';
import _asyncToGenerator from '@babel/runtime/helpers/asyncToGenerator';
import { FileLoader, TextureLoader, WebGLRenderer, PCFSoftShadowMap, sRGBEncoding, AnimationMixer, PerspectiveCamera, OrthographicCamera, Object3D, AmbientLight, DirectionalLight, DirectionalLightHelper, SpotLight, SpotLightHelper, CameraHelper, Vector3, LOD, Box3, Box3Helper, Scene, AxesHelper, SphereGeometry, BoxGeometry, PlaneGeometry, Geometry, Face3, Mesh, MeshBasicMaterial, CylinderGeometry, Vector2, Quaternion as Quaternion$1, Euler, AnimationClip, MeshLambertMaterial, LoopOnce, CubeGeometry, DoubleSide, FogExp2, Fog } from 'three';
import _get from '@babel/runtime/helpers/get';
import _wrapNativeSuper from '@babel/runtime/helpers/wrapNativeSuper';
import dat from 'dat.gui';
import _assertThisInitialized from '@babel/runtime/helpers/assertThisInitialized';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { SkeletonUtils } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Sphere, Box, Plane, ConvexPolyhedron, Trimesh, Heightfield, Shape, Vec3, Material, ContactMaterial, World as World$1, Body, Quaternion, Ray, Cylinder } from 'cannon-es';
import io from 'socket.io-client';
import _slicedToArray from '@babel/runtime/helpers/slicedToArray';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';
import TWEEN from '@tweenjs/tween.js';

/**
 * @author rogerscg / https://github.com/rogerscg
 */
var SPLIT_SCREEN_REG = RegExp('[a-zA-Z]+-[0-9]*');
/**
 * A bindings object, used for better control of custom bindings.
 */

var Bindings = /*#__PURE__*/function () {
  function Bindings(id) {
    _classCallCheck(this, Bindings);

    this.id = id;
    this.actions = new Map();
    this.keysToActions = new Map();
    this.staticProperties = new Set();
  }

  _createClass(Bindings, [{
    key: "getId",
    value: function getId() {
      return this.id;
    }
  }, {
    key: "getActions",
    value: function getActions() {
      return this.actions;
    }
    /**
     * Returns all actions associated with a given key.
     * @param {?} key
     * @param {number} playerNumber
     * @returns {Array<Action>}
     */

  }, {
    key: "getActionsForKey",
    value: function getActionsForKey(key, playerNumber) {
      // If the input is for a given player number, mutate the key to include it.
      var actions = new Array(); // Try for player-number-specific actions first.

      if (playerNumber != null) {
        var playerNumKey = "".concat(key, "-").concat(playerNumber);
        var playerNumActions = this.keysToActions.get(playerNumKey);

        if (playerNumActions) {
          actions = actions.concat(playerNumActions);
        }
      }

      var regularActions = this.keysToActions.get(key);

      if (regularActions) {
        actions = actions.concat(regularActions);
      }

      return actions;
    }
    /**
     * Adds an action to the bindings.
     * @param {Action} action
     */

  }, {
    key: "addAction",
    value: function addAction(action) {
      this.actions.set(action.getName(), action);
      this.loadKeysToActions();
      this.loadStaticProperties();
      return this;
    }
    /**
     * Removes an action from the bindings.
     * @param {Action} action
     */

  }, {
    key: "removeAction",
    value: function removeAction(action) {
      this.actions["delete"](action.getName());
      this.loadKeysToActions();
      this.loadStaticProperties();
      return this;
    }
    /**
     * Gets the action for a given name.
     * @param {string} actionName
     */

  }, {
    key: "getAction",
    value: function getAction(actionName) {
      return this.actions.get(actionName);
    }
    /**
     * Loads an object into the bindings, considering custom bindings.
     * @param {Object} bindingsObj
     */

  }, {
    key: "load",
    value: function load(bindingsObj) {
      for (var actionName in bindingsObj) {
        var actionObj = bindingsObj[actionName];
        var action = new Action(actionName).load(actionObj);
        this.actions.set(actionName, action);
      }

      this.loadKeysToActions();
      this.loadStaticProperties();
      return this;
    }
    /**
     * Loads all keys into a map to their respective actions for fast lookups in
     * controls updates.
     */

  }, {
    key: "loadKeysToActions",
    value: function loadKeysToActions() {
      var _this = this;

      // Clear beforehand in case we're reloading.
      this.keysToActions.clear();
      this.actions.forEach(function (action) {
        var keys = action.getKeys(); // TODO: For local co-op/split screen, set player-specific bindings.

        keys.forEach(function (key, inputType) {
          // Get if this key is for a specific player, denoted by a "-[0-9]".
          if (SPLIT_SCREEN_REG.test(inputType)) {
            // This is a split-screen binding, add the player number to the key.
            var playerNumber = inputType.split('-').pop();
            key = "".concat(key, "-").concat(playerNumber);
          }

          if (!_this.keysToActions.has(key)) {
            _this.keysToActions.set(key, new Array());
          }

          _this.keysToActions.get(key).push(action);
        });
      });
    }
    /**
     * Takes all action names and sets their names as "static" fields of the
     * bindings instance. This is to ease development for the user, so they can
     * call `entity.getActionValue(bindings.SPRINT)` as opposed to passing in a
     * string literal `entity.getActionValue('SPRINT')`.
     */

  }, {
    key: "loadStaticProperties",
    value: function loadStaticProperties() {
      var _this2 = this;

      // Clear old static properties, based on a set created from earlier.
      this.staticProperties.forEach(function (propName) {
        delete _this2[propName];
      });
      this.staticProperties.clear(); // Set new static properties based on actions.

      this.actions.forEach(function (ignore, actionName) {
        _this2[actionName] = actionName;

        _this2.staticProperties.add(actionName);
      });
    }
    /**
     * Merges the given bindings into the existing bindings.
     * @param {Bindings} other
     */

  }, {
    key: "merge",
    value: function merge(other) {
      var _this3 = this;

      other.getActions().forEach(function (action) {
        if (!_this3.actions.has(action.getName())) {
          _this3.actions.set(action.getName(), action);
        } else {
          _this3.actions.get(action.getName()).merge(action);
        }
      });
      this.loadKeysToActions();
      this.loadStaticProperties();
      return this;
    }
    /**
     * Converts the bindings instance to an object.
     * @returns {Object}
     */

  }, {
    key: "toObject",
    value: function toObject() {
      var exportObj = {};
      this.actions.forEach(function (action) {
        exportObj[action.getName()] = action.toObject();
      });
      return exportObj;
    }
    /**
     * Returns if there are no actions associated with the bindings.
     * @returns {boolean}
     */

  }, {
    key: "isEmpty",
    value: function isEmpty() {
      // Get all non-empty actions.
      var nonEmptyActions = _toConsumableArray(this.actions.values()).filter(function (action) {
        return !action.isEmpty();
      });

      return nonEmptyActions.length == 0;
    }
  }]);

  return Bindings;
}();
/**
 * Represents an action an entity can take as well as the inputs that are used
 * to trigger this action.
 */


var Action = /*#__PURE__*/function () {
  function Action(name) {
    _classCallCheck(this, Action);

    this.name = name;
    this.id = null;
    this.keys = new Map();
  }

  _createClass(Action, [{
    key: "getName",
    value: function getName() {
      return this.name;
    }
  }, {
    key: "getKeys",
    value: function getKeys() {
      return this.keys;
    }
    /**
     * Adds a key that can trigger the action.
     * @param {string} inputType
     * @param {?} key
     */

  }, {
    key: "addKey",
    value: function addKey(inputType, key) {
      this.keys.set(inputType, key);
      return this;
    }
    /**
     * Clears the key for the given input type.
     * @param {string} inputType
     */

  }, {
    key: "clearInputType",
    value: function clearInputType(inputType) {
      this.keys["delete"](inputType);
    }
    /**
     * Loads the action from an arbitrary object.
     */

  }, {
    key: "load",
    value: function load(actionObj) {
      for (var inputType in actionObj.keys) {
        var inputs = actionObj.keys[inputType]; // Check if there are multiple inputs for the given input type.

        if (Array.isArray(inputs)) {
          this.loadMultipleKeys(inputType, inputs, actionObj.split_screen);
        } else {
          this.keys.set(inputType, actionObj.keys[inputType]);
        }
      }

      return this;
    }
    /**
     * Loads multiple inputs for the given input type.
     * @param {string} inputType
     * @param {Array} inputs
     * @param {boolean} isSplitScreen
     */

  }, {
    key: "loadMultipleKeys",
    value: function loadMultipleKeys(inputType, inputs) {
      var _this4 = this;

      var isSplitScreen = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      if (isSplitScreen) {
        inputs.forEach(function (input, player) {
          var inputKey = "".concat(inputType, "-").concat(player);

          _this4.keys.set(inputKey, input);
        });
      } else {
        // TODO: Allow for multiple inputs.
        console.warn('Loading multiple inputs for same player not implemented');
      }
    }
    /**
     * Merges an existing action with this action.
     * @param {Action} other
     */

  }, {
    key: "merge",
    value: function merge(other) {
      var _this5 = this;

      other.getKeys().forEach(function (key, inputType) {
        if (!_this5.keys.has(inputType)) {
          _this5.keys.set(inputType, key);
        }
      });
      return this;
    }
    /**
     * Converts the action instance to an object.
     * @returns {Object}
     */

  }, {
    key: "toObject",
    value: function toObject() {
      var exportObj = {};
      exportObj.keys = {}; // TODO: For local co-op/split screen, export player-specific bindings.

      this.keys.forEach(function (key, inputType) {
        return exportObj.keys[inputType] = key;
      });
      return exportObj;
    }
    /**
     * Detects if the action is empty.
     * @returns {boolean}
     */

  }, {
    key: "isEmpty",
    value: function isEmpty() {
      return this.keys.size == 0;
    }
  }]);

  return Action;
}();

/**
 * Generates a RFC4122 version 4 compliant UUID.
 */

function createUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : r & 0x3 | 0x8;
    return v.toString(16);
  });
}
/**
 * Disables all shadows for an object and its children.
 */


function disableShadows(object, name) {
  var force = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

  if (!name || object.name.toLowerCase().indexOf(name) > -1 || force) {
    object.castShadow = false;
    force = true;
  }

  object.children.forEach(function (child) {
    disableShadows(child, name, force);
  });
}
/**
 * Disposes all geometries and materials for an object and its children.
 */


function dispose(object) {
  if (object.material) {
    object.material.dispose();
  }

  if (object.geometry) {
    object.geometry.dispose();
  }

  object.children.forEach(function (child) {
    return dispose(child);
  });
}
/**
 * Extracts an array of meshes present in an object hierarchy.
 * @param {Object3D} object The root object from which to search.
 * @param {string} materialFilter The name of a material we want to search for.
 * @param {boolean} filterOut True if the set of meshes should exclude the
 *                  matching material name.
 */


function extractMeshes(object, materialFilter) {
  var filterOut = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  var meshes = [];

  if (object.type == 'Mesh') {
    if (materialFilter && (filterOut && object.material.name.indexOf(materialFilter) < 0 || !filterOut && object.material.name.indexOf(materialFilter) > -1)) {
      meshes.push(object);
    } else if (!materialFilter) {
      meshes.push(object);
    }
  }

  object.children.forEach(function (child) {
    var childrenMeshes = extractMeshes(child, materialFilter, filterOut);
    meshes = meshes.concat(childrenMeshes);
  });
  return meshes;
}
/**
 * Extracts an array of meshes with a certain name within an object hierarchy.
 * The provided name can be a substring of the mesh name.
 * @param {THREE.Object3D} object
 * @param {string} meshName
 * @returns {Array<THREE.Mesh>}
 */


function extractMeshesByName(object) {
  var meshName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  var meshes = new Array();

  if (object.type == 'Mesh') {
    if (object.name.indexOf(meshName) >= 0) {
      meshes.push(object);
    }
  }

  object.children.forEach(function (child) {
    var childrenMeshes = extractMeshesByName(child, meshName);
    meshes = meshes.concat(childrenMeshes);
  });
  return meshes;
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var _ref = [array[j], array[i]];
    array[i] = _ref[0];
    array[j] = _ref[1];
  }
}

function toDegrees(angle) {
  return angle * (180 / Math.PI);
}

function toRadians(angle) {
  return angle * (Math.PI / 180);
}
/**
 * Computes the angle in radians with respect to the positive x-axis
 * @param {Number} x
 * @param {Number} y
 */


function vectorToAngle(x, y) {
  var angle = Math.atan2(y, x);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
}
/*
 * Get the hex color ratio between two colors
 * Ratio 0 = Col1
 * Ratio 1 = Col2
 */


function getHexColorRatio(col1, col2, ratio) {
  var r = Math.ceil(parseInt(col1.substring(0, 2), 16) * ratio + parseInt(col2.substring(0, 2), 16) * (1 - ratio));
  var g = Math.ceil(parseInt(col1.substring(2, 4), 16) * ratio + parseInt(col2.substring(2, 4), 16) * (1 - ratio));
  var b = Math.ceil(parseInt(col1.substring(4, 6), 16) * ratio + parseInt(col2.substring(4, 6), 16) * (1 - ratio));
  return hex(r) + hex(g) + hex(b);
}
/**
 * Used in getHexColorRatio
 */


function hex(x) {
  x = x.toString(16);
  return x.length == 1 ? '0' + x : x;
}
/**
 * Interpolates between two numbers.
 * @param {number} a
 * @param {number} b
 * @param {number} factor
 * @return {number}
 */


function lerp(a, b, factor) {
  return a + (b - a) * factor;
}
/**
 * Loads a JSON from the given file path.
 * @param {string} path
 * @return {Promise<Object>} Parsed JSON object.
 * @async
 */


function loadJsonFromFile(_x) {
  return _loadJsonFromFile.apply(this, arguments);
}
/**
 * Loads a texture from a file.
 * TODO: Move this to a Texture ERA lib for better disposal.
 * @param {string} url
 * @return {THREE.Texture}
 * @async
 */


function _loadJsonFromFile() {
  _loadJsonFromFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(path) {
    return _regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              var loader = new FileLoader();
              loader.load(path, function (data) {
                resolve(JSON.parse(data));
              }, function () {}, function (err) {
                reject(err);
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _loadJsonFromFile.apply(this, arguments);
}

function loadTexture(_x2) {
  return _loadTexture.apply(this, arguments);
}
/**
 * Traverses the provided object's ancestors to get the root scene in the ERA
 * world.
 * @param {THREE.Object3D} object
 * @return {THREE.Scene}
 */


function _loadTexture() {
  _loadTexture = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(url) {
    return _regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", new Promise(function (resolve, reject) {
              var loader = new TextureLoader();
              loader.load(url, function (texture) {
                return resolve(texture);
              }, undefined, function (err) {
                return reject(err);
              });
            }));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _loadTexture.apply(this, arguments);
}

function getRootScene(object) {
  var rootScene = null;
  object.traverseAncestors(function (ancestor) {
    if (ancestor.isRootScene) {
      rootScene = ancestor;
    }
  });
  return rootScene;
}
/**
 * Traverses the provided object's ancestors to get the root scene, which has a
 * property with the parent ERA world.
 * @param {THREE.Object3D} object
 * @return {World}
 */


function getRootWorld(object) {
  var rootScene = getRootScene(object);
  return rootScene && rootScene.parentWorld ? rootScene.parentWorld : null;
}
/**
 * Builds the default WebGL Renderer used by ERA.
 * @return {THREE.WebGLRenderer}
 */


function defaultEraRenderer() {
  var renderer = new WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.outputEncoding = sRGBEncoding;
  renderer.powerPreference = 'high-performance';
  renderer.setPixelRatio(window.devicePixelRatio);
  return renderer;
}

/**
 * Core implementation for managing events and listeners. This
 * exists out of necessity for a simple event and message system
 * for both the client and the server.
 */

var eventsInstance = null;

var Events = /*#__PURE__*/function () {
  _createClass(Events, null, [{
    key: "get",

    /**
     * Enforces singleton instance.
     */
    value: function get() {
      if (!eventsInstance) {
        eventsInstance = new Events();
      }

      return eventsInstance;
    }
  }]);

  function Events() {
    _classCallCheck(this, Events);

    // All registered listeners. Key is the event label, value is another
    // map with the listener UUID as the key, the callback function as the
    // value.
    this.registeredListeners = new Map(); // Tracks which labels a listener is listening to. Used for ease of
    // removal. Key is the listener UUID, value is the event label.

    this.registeredUUIDs = new Map();
  }
  /**
   * Fires all event listener callbacks registered for the label
   * with the event data.
   */


  _createClass(Events, [{
    key: "fireEvent",
    value: function fireEvent(label, data) {
      var callbacks = this.registeredListeners.get(label);

      if (!callbacks) {
        return false;
      }

      callbacks.forEach(function (callback) {
        return callback(data);
      });
    }
    /**
     * Adds an event listener for a certain label. When the event is fired,
     * the callback is called with data from the event. Returns the UUID
     * of the listener.
     */

  }, {
    key: "addListener",
    value: function addListener(label, callback) {
      if (!label || !callback && typeof callback !== 'function') {
        return false;
      } // If the label has not yet been registered, do so by creating a new map
      // of listener UUIDs and callbacks.


      var listeners = this.registeredListeners.get(label);

      if (!listeners) {
        listeners = new Map();
        this.registeredListeners.set(label, listeners);
      }

      var listenerUUID = createUUID();
      listeners.set(listenerUUID, callback);
      this.registeredUUIDs.set(listenerUUID, label);
      return listenerUUID;
    }
    /**
     * Removes an event listener from registered listeners by its UUID.
     * Returns true if the listener is successfully deleted.
     */

  }, {
    key: "removeListener",
    value: function removeListener(uuid) {
      var label = this.registeredUUIDs.get(uuid);

      if (!label) {
        return false;
      }

      var listeners = this.registeredListeners.get(label);

      if (!listeners) {
        return false;
      }

      return listeners["delete"](uuid);
    }
  }]);

  return Events;
}();

/**
 * Superclass for all custom events within the engine. Utilizes the
 * engine-specific event handling system used for both client and
 * server.
 */

var EraEvent = /*#__PURE__*/function () {
  function EraEvent(label, data) {
    _classCallCheck(this, EraEvent);

    this.label = label;
    this.data = data;
  }
  /**
   * Fires the event to the events core.
   */


  _createClass(EraEvent, [{
    key: "fire",
    value: function fire() {
      Events.get().fireEvent(this.label, this.data);
    }
    /**
     * Creates an event listener for the given type.
     */

  }], [{
    key: "listen",
    value: function listen(label, callback) {
      Events.get().addListener(label, callback);
    }
  }]);

  return EraEvent;
}();

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var LABEL = 'reset';
/**
 * Engine reset event.
 */

var EngineResetEvent = /*#__PURE__*/function (_EraEvent) {
  _inherits(EngineResetEvent, _EraEvent);

  var _super = _createSuper(EngineResetEvent);

  function EngineResetEvent() {
    _classCallCheck(this, EngineResetEvent);

    return _super.call(this, LABEL, {});
  }
  /** @override */


  _createClass(EngineResetEvent, null, [{
    key: "listen",
    value: function listen(callback) {
      EraEvent.listen(LABEL, callback);
    }
  }]);

  return EngineResetEvent;
}(EraEvent);

function _createSuper$1(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$1(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$1() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * Settings changed event. Fired when settings are applied.
 */

var SettingsEvent = /*#__PURE__*/function (_EraEvent) {
  _inherits(SettingsEvent, _EraEvent);

  var _super = _createSuper$1(SettingsEvent);

  /**
   * Takes in the new settings object.
   */
  function SettingsEvent() {
    _classCallCheck(this, SettingsEvent);

    var label = 'settings';
    var data = {};
    return _super.call(this, label, data);
  }
  /** @override */


  _createClass(SettingsEvent, null, [{
    key: "listen",
    value: function listen(callback) {
      EraEvent.listen('settings', callback);
    }
  }]);

  return SettingsEvent;
}(EraEvent);

function _createSuper$2(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$2(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$2() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
// settings. See /data/settings.json as an example to define your own settings.
// TODO: Allow for an enum of options for a setting.

var DEFAULT_SETTINGS = {
  debug: {
    value: true
  },
  physics_debug: {
    value: true
  },
  terrain_debug: {
    value: false
  },
  movement_deadzone: {
    value: 0.15,
    min: 0.0,
    max: 1.0
  },
  mouse_sensitivity: {
    value: 50,
    min: 0,
    max: 200
  },
  shadows: {
    value: true
  },
  volume: {
    value: 50,
    min: 0,
    max: 100
  }
};
var SETTINGS_KEY = 'era_settings';
/**
 * Controls the client settings in a singleton model in local storage.
 */

var Settings = /*#__PURE__*/function (_Map) {
  _inherits(Settings, _Map);

  var _super = _createSuper$2(Settings);

  function Settings() {
    var _this;

    _classCallCheck(this, Settings);

    _this = _super.call(this);
    _this.loaded = false;
    return _this;
  }
  /**
   * Gets the value of a key in the settings object.
   */


  _createClass(Settings, [{
    key: "get",
    value: function get(key) {
      var setting = _get(_getPrototypeOf(Settings.prototype), "get", this).call(this, key);

      if (!setting) {
        return null;
      }

      return setting.getValue();
    }
    /**
     * Sets a specific setting to the given value.
     * @param {string} key
     * @param {?} value
     */

  }, {
    key: "set",
    value: function set(key, value) {
      var setting = _get(_getPrototypeOf(Settings.prototype), "get", this).call(this, key);

      if (!setting) {
        return;
      }

      setting.setValue(value);
      this.apply();
    }
    /**
     * Loads the settings from engine defaults, provided defaults, and user-set
     * values from local storage.
     * @param {string} settingsPath
     * @async
     */

  }, {
    key: "load",
    value: function () {
      var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(settingsPath) {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.loaded) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                this.loadEngineDefaults();

                if (!settingsPath) {
                  _context.next = 6;
                  break;
                }

                _context.next = 6;
                return this.loadFromFile(settingsPath);

              case 6:
                this.loadExistingSettings();
                this.apply();
                this.loaded = true;
                return _context.abrupt("return", this);

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function load(_x) {
        return _load.apply(this, arguments);
      }

      return load;
    }()
    /**
     * Loads the default values for the engine. This is necessary for core plugins
     * that are dependent on settings.
     */

  }, {
    key: "loadEngineDefaults",
    value: function loadEngineDefaults() {
      if (this.loaded) {
        return;
      }

      for (var key in DEFAULT_SETTINGS) {
        var setting = new Setting(key, DEFAULT_SETTINGS[key]);

        _get(_getPrototypeOf(Settings.prototype), "set", this).call(this, setting.getName(), setting);
      }

      new SettingsEvent().fire();
    }
    /**
     * Loads a default settings file at the give path. This is user-provided.
     * This will also overwrite the default engine settings with the
     * user-provided settings.
     * @param {string} settingsPath
     * @async
     */

  }, {
    key: "loadFromFile",
    value: function () {
      var _loadFromFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(settingsPath) {
        var allSettingsData, key, setting;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (settingsPath) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                _context2.prev = 2;
                _context2.next = 5;
                return loadJsonFromFile(settingsPath);

              case 5:
                allSettingsData = _context2.sent;
                _context2.next = 11;
                break;

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2["catch"](2);
                throw new Error(_context2.t0);

              case 11:
                for (key in allSettingsData) {
                  setting = new Setting(key, allSettingsData[key]);

                  _get(_getPrototypeOf(Settings.prototype), "set", this).call(this, setting.getName(), setting);
                }

              case 12:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[2, 8]]);
      }));

      function loadFromFile(_x2) {
        return _loadFromFile.apply(this, arguments);
      }

      return loadFromFile;
    }()
    /**
     * Loads existing settings from local storage. Merges the settings previously
     * saved into the existing defaults.
     */

  }, {
    key: "loadExistingSettings",
    value: function loadExistingSettings() {
      // Load from local storage.
      var savedSettings;

      try {
        savedSettings = localStorage.getItem(SETTINGS_KEY);

        if (!savedSettings) {
          return;
        }

        savedSettings = JSON.parse(savedSettings);
      } catch (e) {
        return;
      } // Iterate over saved settings and merge into defaults.


      for (var key in savedSettings) {
        var setting = new Setting(key, savedSettings[key]);

        var defaultSetting = _get(_getPrototypeOf(Settings.prototype), "get", this).call(this, setting.getName());

        if (!defaultSetting) {
          continue;
        } // Merge saved setting into default.


        defaultSetting.merge(setting);
      }
    }
    /**
     * Fires the applySettings event to the event core, then saves to local
     * storage.
     */

  }, {
    key: "apply",
    value: function apply() {
      localStorage.setItem(SETTINGS_KEY, this["export"]());
      new SettingsEvent().fire();
    }
    /**
     * Exports all settings into a string for use in local storage.
     * @returns {string}
     */

  }, {
    key: "export",
    value: function _export() {
      var expObj = {};
      this.forEach(function (setting, name) {
        expObj[name] = setting["export"]();
      });
      return JSON.stringify(expObj);
    }
  }]);

  return Settings;
}( /*#__PURE__*/_wrapNativeSuper(Map));

var Settings$1 = new Settings();
/**
 * An individual setting for tracking defaults, types, and other properties
 * of the field.
 */

var Setting = /*#__PURE__*/function () {
  /**
   * Loads a setting from an object.
   * @param {Object} settingsData
   */
  function Setting(name, settingsData) {
    _classCallCheck(this, Setting);

    this.name = name;
    this.value = settingsData.value;
    this.min = settingsData.min;
    this.max = settingsData.max;
    this.wasModified = !!settingsData.modified;
  } // TODO: Add getPrettyName() for cleaner settings panel.


  _createClass(Setting, [{
    key: "getName",
    value: function getName() {
      return this.name;
    }
  }, {
    key: "getValue",
    value: function getValue() {
      return this.value;
    }
  }, {
    key: "getMin",
    value: function getMin() {
      return this.min;
    }
  }, {
    key: "getMax",
    value: function getMax() {
      return this.max;
    }
    /**
     * Sets the value of the individual setting, flipping the "modified" bit to
     * true.
     * @param {?} newValue
     */

  }, {
    key: "setValue",
    value: function setValue(newValue) {
      this.value = newValue;
      this.wasModified = true;
    }
    /**
     * Returns if the setting was modified at any point from the default.
     * @returns {boolean}
     */

  }, {
    key: "wasModifiedFromDefault",
    value: function wasModifiedFromDefault() {
      return this.wasModified;
    }
    /**
     * Merges another setting into this setting. This will only occur if the
     * other setting has been mutated from the default. This check is useful in
     * the event developers want to change a default setting, as otherwise, the
     * new default setting would not be applied to returning users.
     * @param {Setting} other
     * @returns {Setting}
     */

  }, {
    key: "merge",
    value: function merge(other) {
      // Sanity check for comparability.
      if (!other || other.getName() != this.getName()) {
        return;
      } // If the other setting was not modified from default, ignore.


      if (!other.wasModifiedFromDefault()) {
        return;
      }

      this.value = other.getValue();
      this.wasModified = true; // TODO: Check for min/max, type, or other options for validation.
    }
    /**
     * Exports the individual setting to an object.
     * @returns {Object}
     */

  }, {
    key: "export",
    value: function _export() {
      return {
        value: this.value,
        modified: this.wasModified
      };
    }
  }]);

  return Setting;
}();

var MEASUREMENT_MIN = 10;
var MAX_LENGTH = 100;
/**
 * A timer for monitoring render loop execution time. Installed on the engine
 * core, then read by renderer stats. Only enabled when debug is enabled.
 */

var EngineTimer = /*#__PURE__*/function () {
  function EngineTimer() {
    _classCallCheck(this, EngineTimer);

    this.measurements = new Array();
    this.min = Infinity;
    this.max = 0;
    this.currIndex = 0;
    this.enabled = !Settings$1.loaded || Settings$1.get('debug');
    SettingsEvent.listen(this.handleSettings.bind(this));
  }
  /**
   * Starts a measurement.
   */


  _createClass(EngineTimer, [{
    key: "start",
    value: function start() {
      if (!this.enabled) {
        return;
      }

      this.startTime = performance.now();
    }
    /**
     * Completes a measurement, recording it if enabled.
     */

  }, {
    key: "end",
    value: function end() {
      if (!this.enabled || !this.startTime) {
        return;
      }

      var time = performance.now() - this.startTime;
      this.measurements[this.currIndex] = time;
      this.currIndex++;

      if (this.currIndex >= MAX_LENGTH) {
        this.currIndex = 0;
      }

      if (time > this.max) {
        this.max = time;
      }

      if (time < this.min) {
        this.min = time;
      }
    }
    /**
     * Resets the timer cache.
     */

  }, {
    key: "reset",
    value: function reset() {
      this.max = 0;
      this.min = Infinity;
      this.currIndex = 0; // Clear the array.

      this.measurements.length = 0;
    }
    /**
     * Exports the meaurements average for reading in the stats panel. Clears the
     * measurements array for memory usage.
     * @returns {Object}
     */

  }, {
    key: "export",
    value: function _export() {
      if (!this.enabled) {
        return null;
      }

      if (this.measurements.length < MEASUREMENT_MIN) {
        return null;
      }

      var total = this.measurements.reduce(function (agg, x) {
        return agg + x;
      }, 0);
      var avg = total / this.measurements.length;
      var exportObj = {
        max: this.max,
        min: this.min,
        avg: avg
      };
      this.reset();
      return exportObj;
    }
    /**
     * Handles a settings change.
     */

  }, {
    key: "handleSettings",
    value: function handleSettings() {
      var currEnabled = this.enabled;

      if (currEnabled == Settings$1.get('debug')) {
        return;
      }

      this.enabled = Settings$1.get('debug');
      this.reset();
    }
  }]);

  return EngineTimer;
}();

var EngineTimer$1 = new EngineTimer();

/**
 * A dat.gui module for ERA settings. This is, of course, heavily tied to the
 * settings object loading and changing over time. It should also modify
 * and save settings within ERA.
 * TODO: Developer mode to enable/disable settings panel.
 */

var SettingsPanel = /*#__PURE__*/function () {
  function SettingsPanel() {
    _classCallCheck(this, SettingsPanel);

    this.enabled = true;
    this.gui = null;
    this.datControllers = new Map();
    this.dummySettings = {};
    this.load();
    SettingsEvent.listen(this.load.bind(this));
  }
  /**
   * Loads new data into the panel.
   */


  _createClass(SettingsPanel, [{
    key: "load",
    value: function load() {
      if (!this.enabled) {
        return;
      }

      if (!this.gui) {
        this.gui = new dat.GUI();
      } // Update the loaded GUI with all settings.


      this.update();
    }
    /**
     * Destroys the GUI and unloaded the state of the panel.
     */

  }, {
    key: "destroy",
    value: function destroy() {
      if (this.gui) {
        this.gui.destroy();
        this.gui = null;
      }

      this.datControllers.clear();
      this.dummySettings = {};
    }
    /**
     * Updates the settings panel with all settings available in the ERA settings
     * object.
     */

  }, {
    key: "update",
    value: function update() {
      var _this = this;

      Settings$1.forEach(function (setting, name) {
        var controller = _this.datControllers.get(name);

        if (!controller) {
          _this.dummySettings[name] = setting.getValue();
          controller = _this.gui.add(_this.dummySettings, name, setting.getMin(), setting.getMax());
          controller.onChange(function (value) {
            return _this.updateValue(name, value);
          });
          controller.onFinishChange(function (value) {
            return _this.updateValue(name, value);
          });

          _this.datControllers.set(name, controller);
        }

        _this.dummySettings[name] = setting.getValue();
        controller.updateDisplay();
      });
    }
    /**
     * Updates an individual value for a setting.
     * @param {string} name
     * @param {?} value
     */

  }, {
    key: "updateValue",
    value: function updateValue(name, value) {
      Settings$1.set(name, value);
    }
  }]);

  return SettingsPanel;
}();

var SettingsPanel$1 = new SettingsPanel();

var instance = null;
/**
 * Engine core for the game.
 */

var Engine = /*#__PURE__*/function () {
  _createClass(Engine, null, [{
    key: "get",

    /**
     * Enforces singleton engine instance.
     */
    value: function get() {
      if (!instance) {
        instance = new Engine();
      }

      return instance;
    }
  }]);

  function Engine() {
    _classCallCheck(this, Engine);

    this.started = false;
    this.rendering = false;
    this.plugins = new Set(); // Debug.

    this.timer = EngineTimer$1;
    this.settingsPanel = SettingsPanel$1; // The current game mode running.

    this.currentGameMode = null; // Load engine defaults.

    Settings$1.loadEngineDefaults();
  }
  /**
   * Starts the engine. This is separate from the constructor as it
   * is asynchronous.
   */


  _createClass(Engine, [{
    key: "start",
    value: function () {
      var _start = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var _this = this;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.started) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                this.started = true;
                this.rendering = true;
                requestAnimationFrame(function () {
                  return _this.render();
                });

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function start() {
        return _start.apply(this, arguments);
      }

      return start;
    }()
    /**
     * Resets the game engine to its initial state.
     */

  }, {
    key: "reset",
    value: function reset() {
      // Reset all plugins.
      this.plugins.forEach(function (plugin) {
        return plugin.reset();
      });
      new EngineResetEvent().fire(); // Clear the renderer.

      this.resetRender = true;
      this.started = false;
    }
    /**
     * The root for all tick updates in the game.
     */

  }, {
    key: "render",
    value: function render(timeStamp) {
      var _this2 = this;

      this.timer.start(); // Update all plugins.

      this.plugins.forEach(function (plugin) {
        return plugin.update(timeStamp);
      }); // Check if the render loop should be halted.

      if (this.resetRender) {
        this.resetRender = false;
        this.rendering = false;
        return;
      }

      this.timer.end(); // Continue the loop.

      requestAnimationFrame(function (time) {
        return _this2.render(time);
      });
    }
    /**
     * Installs a plugin to receive updates on each engine loop as well as
     * resets.
     * @param {Plugin} plugin
     */

  }, {
    key: "installPlugin",
    value: function installPlugin(plugin) {
      this.plugins.add(plugin);
    }
    /**
     * Loads and starts a game mode.
     * @param {GameMode} gameMode
     * @async
     */

  }, {
    key: "startGameMode",
    value: function () {
      var _startGameMode = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(gameMode) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return gameMode.load();

              case 2:
                _context2.next = 4;
                return gameMode.start();

              case 4:
                this.start();

              case 5:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function startGameMode(_x) {
        return _startGameMode.apply(this, arguments);
      }

      return startGameMode;
    }()
  }]);

  return Engine;
}();

/**
 * Base class for plugins to the engine such as audio, light, etc that can be
 * updated on each engine tick and reset gracefully.
 */

var Plugin = /*#__PURE__*/function () {
  function Plugin() {
    _classCallCheck(this, Plugin);

    this.uuid = createUUID();
    this.install();
    SettingsEvent.listen(this.handleSettingsChange.bind(this));
  }
  /**
   * Installs the plugin into the engine. This method should be final.
   */


  _createClass(Plugin, [{
    key: "install",
    value: function install() {
      Engine.get().installPlugin(this);
      return this;
    }
    /**
     * Resets the plugin.
     */

  }, {
    key: "reset",
    value: function reset() {
      console.warn('Plugin reset function not implemented');
    }
    /**
     * Updates the plugin at each engine tick.
     * @param {number} timestamp
     */

  }, {
    key: "update",
    value: function update(timestamp) {
      console.warn('Plugin update function not implemented');
    }
    /**
     * Handles a settings change event.
     */

  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {}
  }]);

  return Plugin;
}();

function _createSuper$3(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$3(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$3() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var instance$1 = null;
/**
 * The animation library stores animation data for loaded models.
 */

var Animation = /*#__PURE__*/function (_Plugin) {
  _inherits(Animation, _Plugin);

  var _super = _createSuper$3(Animation);

  _createClass(Animation, null, [{
    key: "get",
    value: function get() {
      if (!instance$1) {
        instance$1 = new Animation();
      }

      return instance$1;
    }
  }]);

  function Animation() {
    var _this;

    _classCallCheck(this, Animation);

    _this = _super.call(this);
    _this.animations = new Map();
    _this.mixers = new Map();
    _this.lastUpdate = Date.now();
    return _this;
  }
  /** @override */


  _createClass(Animation, [{
    key: "update",
    value: function update() {
      var currTime = Date.now();
      var diff = currTime - this.lastUpdate;
      this.mixers.forEach(function (mixer) {
        return mixer.update(diff / 1000);
      });
      this.lastUpdate = currTime;
    }
    /**
     * Stores animations for a given model name.
     * @param {string} name
     * @param {Array<THREE.AnimationClip>} animations
     */

  }, {
    key: "setAnimations",
    value: function setAnimations(name, animations) {
      if (!name || !animations) {
        return;
      }

      this.animations.set(name, animations);
    }
    /**
     * Creates an animation mixer for a given name and mesh.
     * @param {string} name
     * @param {THREE.Mesh} mesh
     * @returns {THREE.AnimationMixer}
     */

  }, {
    key: "createAnimationMixer",
    value: function createAnimationMixer(name, mesh) {
      if (!name || !mesh || !this.animations.has(name)) {
        return null;
      }

      var mixer = new AnimationMixer(mesh);
      this.mixers.set(mesh.uuid, mixer);
      return mixer;
    }
    /**
     * Returns all animation clips for a given name.
     * @param {string} name
     */

  }, {
    key: "getClips",
    value: function getClips(name) {
      return this.animations.get(name);
    }
  }]);

  return Animation;
}(Plugin);

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper$4(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$4(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$4() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var CROSSFADE_TIME = 500;
var instance$2 = null;
/**
 * Core implementation for all audio. Manages the loading, playback, and
 * other controls needed for in-game audio.
 */

var Audio = /*#__PURE__*/function (_Plugin) {
  _inherits(Audio, _Plugin);

  var _super = _createSuper$4(Audio);

  _createClass(Audio, null, [{
    key: "get",
    value: function get() {
      if (!instance$2) {
        instance$2 = new Audio();
      }

      return instance$2;
    }
  }]);

  function Audio() {
    var _this;

    _classCallCheck(this, Audio);

    _this = _super.call(this);
    _this.defaultVolume = 50;
    _this.context = new AudioContext(); // Map containing all sounds used in the engine. Key is the sound name,
    // value is the sound buffer.

    _this.sounds = new Map(); // The ambient sounds loaded.

    _this.backgroundSounds = new Array();
    _this.ambientEventSounds = new Array(); // A map of playing sounds in order to allow stopping mid-play.

    _this.playingSounds = new Map();

    _this.handleSettingsChange();

    return _this;
  }
  /** @override */


  _createClass(Audio, [{
    key: "reset",
    value: function reset() {
      this.stopAmbientSound();
      this.playingSounds.forEach(function (node) {
        return node.source.stop();
      });
      this.playingSounds.clear();
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {}
    /** @override */

  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {
      var _this2 = this;

      if (Settings$1.get('volume') == this.masterVolume) {
        return;
      }

      this.masterVolume = Settings$1.get('volume');
      this.playingSounds.forEach(function (node) {
        var volRatio = _this2.masterVolume / _this2.defaultVolume;
        var dataVolume = node.dataVolume ? node.dataVolume : 1.0;
        var adjustVolume = node.adjustVolume ? node.adjustVolume : 1.0;
        var volume = volRatio * dataVolume * adjustVolume;
        node.gain.gain.value = volume;
      });
    }
    /**
     * Loads all sounds described from the provided file path. The file should
     * be a JSON file. Follow the example at /src/data/sounds.json.
     * @param {string} filePath
     * @async
     */

  }, {
    key: "loadAllFromFile",
    value: function () {
      var _loadAllFromFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(filePath) {
        var allSoundData, directory, promises, name, options;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (filePath) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                _context.prev = 2;
                _context.next = 5;
                return loadJsonFromFile(filePath);

              case 5:
                allSoundData = _context.sent;
                _context.next = 11;
                break;

              case 8:
                _context.prev = 8;
                _context.t0 = _context["catch"](2);
                throw new Error(_context.t0);

              case 11:
                // Extract the directory from the file path, use for loading sounds.
                directory = filePath.substr(0, filePath.lastIndexOf('/') + 1);
                promises = new Array();

                for (name in allSoundData) {
                  options = allSoundData[name];
                  promises.push(this.loadSound(directory, name, options));
                }

                return _context.abrupt("return", Promise.all(promises));

              case 15:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[2, 8]]);
      }));

      function loadAllFromFile(_x) {
        return _loadAllFromFile.apply(this, arguments);
      }

      return loadAllFromFile;
    }()
    /**
     * Loads an individual sound and stores it.
     * @param {string} directory
     * @param {string} name
     * @param {Object} options
     */

  }, {
    key: "loadSound",
    value: function () {
      var _loadSound = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(directory, name, options) {
        var extension, path, event, buffer;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                extension = options.extension; // Insert a period if the extension doesn't have one.

                if (!extension.startsWith('.')) {
                  extension = '.' + extension;
                }

                path = "".concat(directory).concat(name).concat(extension);
                _context2.next = 5;
                return this.createSoundRequest(path);

              case 5:
                event = _context2.sent;
                _context2.next = 8;
                return this.bufferSound(event);

              case 8:
                buffer = _context2.sent;
                this.sounds.set(name, buffer);
                return _context2.abrupt("return");

              case 11:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loadSound(_x2, _x3, _x4) {
        return _loadSound.apply(this, arguments);
      }

      return loadSound;
    }()
    /**
     * Creates and sends an HTTP GET request with type arraybuffer for sound.
     */

  }, {
    key: "createSoundRequest",
    value: function createSoundRequest(path) {
      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', path, true);
        request.responseType = 'arraybuffer';
        request.addEventListener('load', function (event) {
          resolve(event);
        }, false);
        request.send();
      });
    }
    /**
     * Decodes audio data from the request response.
     */

  }, {
    key: "bufferSound",
    value: function bufferSound(event) {
      var _this3 = this;

      return new Promise(function (resolve) {
        var request = event.target;

        _this3.context.decodeAudioData(request.response, function (buffer) {
          resolve(buffer);
        });
      });
    }
    /**
     * Converts an audio buffer into a Web Audio API source node.
     */

  }, {
    key: "createSourceNode",
    value: function createSourceNode(buffer) {
      var source = this.context.createBufferSource();
      var gain = this.context.createGain();
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(this.context.destination);
      return {
        source: source,
        gain: gain
      };
    }
    /**
     * Plays a sound in-game.
     */

  }, {
    key: "playSound",
    value: function playSound(name) {
      var _this4 = this;

      var adjustVolume = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0;
      var defaultSound = this.sounds.get(name);
      var buffer = defaultSound;

      if (!buffer) {
        return false;
      }

      var node = this.createSourceNode(buffer);
      var volRatio = this.masterVolume / this.defaultVolume; // TODO: Load sounds into actual sound objects.

      var dataVolume = 1.0; //soundData && soundData.volume ? soundData.volume : 1.0;

      var volume = volRatio * dataVolume * adjustVolume;
      node.gain.gain.value = volume;
      node.source.start(0);
      node.uuid = createUUID();
      node.dataVolume = dataVolume;
      node.adjustVolume = adjustVolume;
      this.playingSounds.set(node.uuid, node);
      setTimeout(function () {
        _this4.playingSounds["delete"](node.uuid);
      }, Math.round(node.source.buffer.duration * 1000));
      return node;
    }
    /**
     * Plays a sound in-game on a loop.
     */

  }, {
    key: "playSoundOnLoop",
    value: function playSoundOnLoop(name) {
      var adjustVolume = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0;
      var defaultSound = this.sounds.get(name);
      var buffer = defaultSound;

      if (!buffer) {
        return false;
      }

      var node = this.createSourceNode(buffer);
      var volRatio = this.masterVolume / this.defaultVolume; // TODO: Load sounds into actual sound objects.

      var dataVolume = 1.0; //soundData && soundData.volume ? soundData.volume : 1.0;

      var volume = volRatio * dataVolume * adjustVolume;
      node.gain.gain.value = volume;
      node.source.loop = true;
      node.source.start(0);
      node.uuid = createUUID();
      node.dataVolume = dataVolume;
      node.adjustVolume = adjustVolume;
      this.playingSounds.set(node.uuid, node);
      return node;
    }
    /**
     * Stops playing a sound.
     */

  }, {
    key: "stopSound",
    value: function stopSound(sourceNode) {
      if (sourceNode) {
        sourceNode.source.stop();

        if (sourceNode.uuid) {
          this.playingSounds["delete"](sourceNode.uuid);
        }
      }
    }
    /**
     * Starts the loaded ambient sound track.
     */

  }, {
    key: "startAmbientSound",
    value: function startAmbientSound() {
      var _this5 = this;

      if (!this.backgroundSounds.length) {
        return;
      }

      this.shouldPlayAmbientSound = true;
      this.addAmbientTrack(0, this.backgroundSounds, this.ambientVolume);
      setTimeout(function () {
        _this5.addAmbientTrack(1, _this5.backgroundSounds, _this5.ambientVolume);
      }, 2500);

      if (this.ambientEventSounds.length) {
        this.addAmbientTrack(2, this.ambientEventSounds, 0.2, 0.2);
      }
    }
    /**
     * Stops playing ambient sound track.
     */

  }, {
    key: "stopAmbientSound",
    value: function stopAmbientSound() {
      this.shouldPlayAmbientSound = false;
    }
    /**
     * Adds an ambient track to the specific channel. Called each time a new audio
     * clip needs to be played to continue the ambient noises.
     */

  }, {
    key: "addAmbientTrack",
    value: function addAmbientTrack(channel, sources, sourceVolume) {
      var _this6 = this;

      var randomness = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1.0;

      if (!this.shouldPlayAmbientSound) {
        return;
      } // Add a randomness play factor for varied background noises. This is
      // optional, as the default randomness of 1.0 will never trigger this.


      if (Math.random() > randomness) {
        setTimeout(function () {
          _this6.addAmbientTrack(channel, sources, sourceVolume, randomness);
        }, 3000);
        return;
      }

      var volRatio = this.masterVolume / this.defaultVolume;
      var volume = volRatio * sourceVolume;
      shuffleArray(sources);
      var selectedBuffer = null;

      var _iterator = _createForOfIteratorHelper(sources),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var source = _step.value;

          if (!source.inUse) {
            selectedBuffer = source;
            break;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      if (!selectedBuffer) {
        return;
      }

      selectedBuffer.inUse = true;
      var currTime = this.context.currentTime;
      var node = this.createSourceNode(selectedBuffer);
      node.source.start(0);
      node.gain.gain.linearRampToValueAtTime(0, currTime);
      node.gain.gain.linearRampToValueAtTime(volume, currTime + CROSSFADE_TIME / 1000); // When the audio track is drawing to a close, queue up new track, fade old.

      setTimeout(function () {
        _this6.addAmbientTrack(channel, sources, sourceVolume, randomness);

        currTime = _this6.context.currentTime;
        node.gain.gain.linearRampToValueAtTime(volume, currTime);
        node.gain.gain.linearRampToValueAtTime(0, currTime + CROSSFADE_TIME / 1000);
      }, Math.round(node.source.buffer.duration * 1000 - CROSSFADE_TIME)); // When audio finishes playing, mark as not in use.

      var uuid = createUUID();
      this.playingSounds.set(uuid, node);
      setTimeout(function () {
        selectedBuffer.inUse = false;

        _this6.playingSounds["delete"](uuid);
      }, Math.round(node.source.buffer.duration * 1000));
    }
  }]);

  return Audio;
}(Plugin);

var instance$3 = null;
/**
 * Manages camera contruction.
 */

var Camera = /*#__PURE__*/function () {
  _createClass(Camera, null, [{
    key: "get",
    value: function get() {
      if (!instance$3) {
        instance$3 = new Camera();
      }

      return instance$3;
    }
  }]);

  function Camera() {
    _classCallCheck(this, Camera);

    this.cameras = new Map();
  }
  /**
   * Builds a default perspective camera.
   * @returns {THREE.PerspectiveCamera}
   */


  _createClass(Camera, [{
    key: "buildPerspectiveCamera",
    value: function buildPerspectiveCamera() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      var viewAngle = 70;
      var aspect = width / height;
      var near = 0.1;
      var far = 2000;
      var camera = new PerspectiveCamera(viewAngle, aspect, near, far);
      camera.rotation.order = 'YXZ';

      camera.userData.resize = function (width, height) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      return camera;
    }
    /**
     * Builds a default isometric camera.
     * @returns {THREE.OrthgraphicCamera}
     */

  }, {
    key: "buildIsometricCamera",
    value: function buildIsometricCamera() {
      var width = window.innerWidth;
      var height = window.innerHeight;
      var near = 1;
      var far = 1000;
      var camera = new OrthographicCamera(width / -2, width / 2, height / 2, height / -2, near, far);
      camera.zoom = 16;
      camera.updateProjectionMatrix();

      camera.userData.resize = function (width, height) {
        camera.left = width / -2;
        camera.right = width / 2;
        camera.top = height / 2;
        camera.bottom = height / -2;
        camera.updateProjectionMatrix();
      };

      this.cameras.set(camera.uuid, camera);
      return camera;
    }
  }]);

  return Camera;
}();

function _createSuper$5(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$5(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$5() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var CONTROLS_KEY = 'era_bindings';
var instance$4 = null;
/**
 * The controls core for the game. Input handlers are created here. Once the
 * input is received, the response is delegated to the entity in control.
 */

var Controls = /*#__PURE__*/function (_Plugin) {
  _inherits(Controls, _Plugin);

  var _super = _createSuper$5(Controls);

  _createClass(Controls, null, [{
    key: "get",

    /**
     * Enforces singleton controls instance.
     */
    value: function get() {
      if (!instance$4) {
        instance$4 = new Controls();
      }

      return instance$4;
    }
  }]);

  function Controls() {
    var _this;

    _classCallCheck(this, Controls);

    _this = _super.call(this);
    _this.previousInput = {};
    _this.registeredEntities = new Map();
    _this.controlsEnabled = true;
    _this.hasController = false;
    _this.controllerListeners = []; // Registered bindings for a given entity.

    _this.registeredBindings = new Map(); // Map of controls IDs to entity classes.

    _this.controlIds = new Map();
    document.addEventListener('keydown', function (e) {
      return _this.setActions(e.keyCode, 1);
    });
    document.addEventListener('keyup', function (e) {
      return _this.setActions(e.keyCode, 0);
    });
    document.addEventListener('mousedown', function (e) {
      return _this.setActions(e.button, 1);
    });
    document.addEventListener('mouseup', function (e) {
      return _this.setActions(e.button, 0);
    });
    document.addEventListener('mousemove', _this.onMouseMove.bind(_assertThisInitialized(_this)));
    document.addEventListener('click', _this.onMouseClick.bind(_assertThisInitialized(_this)));
    window.addEventListener('gamepadconnected', _this.startPollingController.bind(_assertThisInitialized(_this)));
    window.addEventListener('gamepaddisconnected', _this.stopPollingController.bind(_assertThisInitialized(_this)));

    _this.loadSettings();

    _this.registerCustomBindings();

    _this.pointerLockEnabled = false;
    SettingsEvent.listen(_this.loadSettings.bind(_assertThisInitialized(_this)));
    return _this;
  }
  /** @override */


  _createClass(Controls, [{
    key: "reset",
    value: function reset() {
      this.registeredEntities = new Map();
      this.exitPointerLock();
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {
      this.controllerTick();
    }
    /**
     * Loads custom controls bindings from local storage.
     * @returns {Map<string, Bindings}
     */

  }, {
    key: "loadCustomBindingsFromStorage",
    value: function loadCustomBindingsFromStorage() {
      // Load bindings from localStorage.
      if (!localStorage.getItem(CONTROLS_KEY)) {
        return new Map();
      }

      var customObj;

      try {
        customObj = JSON.parse(localStorage.getItem(CONTROLS_KEY));
      } catch (e) {
        console.error(e);
        return new Map();
      }

      var bindingsMap = new Map(); // Iterate over all controls IDs.

      for (var _i = 0, _Object$keys = Object.keys(customObj); _i < _Object$keys.length; _i++) {
        var controlsId = _Object$keys[_i];
        // Create bindings from the given object.
        var bindings = new Bindings(controlsId).load(customObj[controlsId]);
        bindingsMap.set(controlsId, bindings);
      }

      return bindingsMap;
    }
    /**
     * Registers custom bindings defined by the user.
     */

  }, {
    key: "registerCustomBindings",
    value: function registerCustomBindings() {
      var _this2 = this;

      var customBindings = this.loadCustomBindingsFromStorage();

      if (!customBindings) {
        return;
      }

      customBindings.forEach(function (bindings) {
        _this2.registerCustomBindingsForId(bindings);
      });
    }
    /**
     * Sets a custom binding for a given controls ID, action, and input type.
     * @param {string} controlsId
     * @param {string} action
     * @param {string} inputType
     * @param {?} key
     */

  }, {
    key: "setCustomBinding",
    value: function setCustomBinding(controlsId, action, inputType, key) {
      // Load custom bindings from storage.
      var allCustomBindings = this.loadCustomBindingsFromStorage(); // Attach custom bindings for this ID if they don't exist.

      var idBindings = allCustomBindings.get(controlsId);

      if (!idBindings) {
        idBindings = new Bindings(controlsId);
        allCustomBindings.set(controlsId, idBindings);
      } // Check if the action exists for the given ID.


      var idAction = idBindings.getActions().get(action);

      if (!idAction) {
        idAction = new Action(action);
        idBindings.addAction(idAction);
      }

      idAction.addKey(inputType, key); // Export.

      this.writeBindingsToStorage(allCustomBindings); // Reload bindings.

      this.registerCustomBindings();
    }
    /**
     * Clears all custom bindings. Use this with caution, as there is not way to
     * restore them.
     * @param
     */

  }, {
    key: "clearAllCustomBindings",
    value: function clearAllCustomBindings() {
      // Export an empty map.
      this.writeBindingsToStorage(new Map()); // Reload bindings.

      this.reloadDefaultBindings();
      this.registerCustomBindings();
    }
    /**
     * Clears all custom bindings for a given entity.
     * @param {string} controlsId
     */

  }, {
    key: "clearCustomBindingsForEntity",
    value: function clearCustomBindingsForEntity(controlsId) {
      // Load custom bindings from storage.
      var allCustomBindings = this.loadCustomBindingsFromStorage(); // Clear entity.

      allCustomBindings["delete"](controlsId); // Export.

      this.writeBindingsToStorage(allCustomBindings); // Reload bindings.

      this.reloadDefaultBindings();
      this.registerCustomBindings();
    }
    /**
     * Clears all custom bindings for a given entity. If no input type is given,
     * all input types will be cleared.
     * @param {string} controlsId
     * @param {string} actionName
     * @param {string} inputType
     */

  }, {
    key: "clearCustomBindingsForAction",
    value: function clearCustomBindingsForAction(controlsId, actionName, inputType) {
      // Load custom bindings from storage.
      var allCustomBindings = this.loadCustomBindingsFromStorage();
      var entityBindings = allCustomBindings.get(controlsId);
      var action = entityBindings.getAction(actionName);

      if (!action) {
        return;
      } // Modify the action for the given input type.


      if (inputType) {
        action.clearInputType(inputType);
      } // Check if the action is empty or if no input type is provided. If so,
      // remove.


      if (action.isEmpty() || inputType === undefined) {
        entityBindings.removeAction(action);
      } // Check if entity bindings are empty. If so, remove from storage.


      if (entityBindings.isEmpty()) {
        allCustomBindings["delete"](controlsId);
      } // Export.


      this.writeBindingsToStorage(allCustomBindings); // Reload bindings.

      this.reloadDefaultBindings();
      this.registerCustomBindings();
    }
    /**
     * Reloads all default bindings for registered bindings.
     */

  }, {
    key: "reloadDefaultBindings",
    value: function reloadDefaultBindings() {
      var _this3 = this;

      this.controlIds.forEach(function (staticEntity, id) {
        var defaultBindings = staticEntity.GetBindings();

        _this3.registeredBindings.set(id, defaultBindings);
      });
    }
    /**
     * Writes a map of bindings to local storage.
     * @param {Map<string, Bindings} bindingsMap
     */

  }, {
    key: "writeBindingsToStorage",
    value: function writeBindingsToStorage(bindingsMap) {
      var exportObj = {};
      bindingsMap.forEach(function (bindings) {
        exportObj[bindings.getId()] = bindings.toObject();
      });
      localStorage.setItem(CONTROLS_KEY, JSON.stringify(exportObj));
    }
    /**
     * Get all valid keys for the binding
     * @param {Object} binding
     */

  }, {
    key: "getKeys",
    value: function getKeys(bindingName) {
      return Object.values(this.bindings[bindingName].keys);
    }
    /**
     * Get the key specifically for device
     * @param {Object} binding
     */

  }, {
    key: "getBinding",
    value: function getBinding(bindingName, device) {
      return this.bindings[bindingName].keys[device];
    }
    /**
     * Universally enables all controller input.
     */

  }, {
    key: "enable",
    value: function enable() {
      this.controlsEnabled = true;
    }
    /**
     * Universally disables all controller input.
     */

  }, {
    key: "disable",
    value: function disable() {
      this.controlsEnabled = false;

      if (Engine.get().getMainPlayer()) {
        Engine.get().getMainPlayer().clearInput();
      }
    }
    /**
     * When a controller is detected, poll it
     */

  }, {
    key: "startPollingController",
    value: function startPollingController() {
      if (!this.hasController) {
        this.hasController = true;
        this.controllerTick();
      }
    }
    /**
     * When a controller is disconnect, stop polling
     */

  }, {
    key: "stopPollingController",
    value: function stopPollingController() {
      this.hasController = false;
    }
    /**
     * Check status, send to server
     * Loop through all axes and buttons, send those with a value to the server
     * If none have a value, don't send anything.
     */

  }, {
    key: "controllerTick",
    value: function controllerTick() {
      if (this.hasController) {
        // Iterate over all gamepads.
        for (var i = 0; i < navigator.getGamepads().length; i++) {
          var controller = navigator.getGamepads()[i];

          if (!controller) {
            continue;
          }

          var rawControllerInput = this.getRawControllerInput(controller); // Fires an event with key and value
          // Key -> button1, axes2,..
          // Value -> Range from 0 to 1

          for (var _i2 = 0, _Object$keys2 = Object.keys(rawControllerInput); _i2 < _Object$keys2.length; _i2++) {
            var key = _Object$keys2[_i2];
            this.setActions(key, rawControllerInput[key], 'controller', i);
          }
        }
      }
    }
    /**
     * Name of the controller.
     * Usually contains an identifying part such as 'Xbox'
     */

  }, {
    key: "getControllerName",
    value: function getControllerName() {
      if (this.hasController) {
        return navigator.getGamepads()[0].id;
      }

      return '';
    }
    /**
     * Checks raw input (no keybind overrides)
     * @param {Gamepad} controller
     * @returns {Object}
     */

  }, {
    key: "getRawControllerInput",
    value: function getRawControllerInput(controller) {
      var input = {};

      if (this.hasController) {
        for (var i = 0; i < controller.axes.length; i++) {
          var val = controller.axes[i];
          val = Math.abs(val) < this.movementDeadzone ? 0 : val;
          input["axes".concat(i)] = val;
        }

        for (var _i3 = 0; _i3 < controller.buttons.length; _i3++) {
          var _val = controller.buttons[_i3].value;
          _val = Math.abs(_val) > this.movementDeadzone ? _val : 0;
          input["button".concat(_i3)] = _val;
        }

        if (!this.previousInput[controller.index]) {
          this.previousInput[controller.index] = {};
        }

        for (var _i4 = 0, _Object$keys3 = Object.keys(input); _i4 < _Object$keys3.length; _i4++) {
          var key = _Object$keys3[_i4];
          // Only send 0 if the one before that wasn't 0
          var previouslyHadValue = this.previousInput[controller.index][key] && this.previousInput[controller.index][key] !== 0;

          if (input[key] === 0 && !previouslyHadValue) {
            delete input[key];
          }
        }
      }

      this.previousInput[controller.index] = input;
      return input;
    }
    /**
     * Handles the mouse click event. Separate from mouse down and up.
     */

  }, {
    key: "onMouseClick",
    value: function onMouseClick(e) {
      // TODO: Use correct element.
      if (this.pointerLockEnabled) {
        this.requestPointerLock();
      }
    }
    /**
     * Requests pointer lock on the renderer canvas.
     */

  }, {
    key: "requestPointerLock",
    value: function requestPointerLock() {
      // TODO: Use correct element.
      document.body.requestPointerLock();
    }
    /**
     * Exits pointer lock.
     */

  }, {
    key: "exitPointerLock",
    value: function exitPointerLock() {
      document.exitPointerLock();
    }
    /**
     * Set the actions values controlled by the specified key.
     * @param {String | Number} key
     * @param {Number} value
     * @param {String=} inputDevice defaults to keyboard
     * @param {Number=} gamepadNumber used to ensure the gamepad is associated
     *                    with the player.
     */

  }, {
    key: "setActions",
    value: function setActions(key, value) {
      var _this4 = this;

      var inputDevice = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'keyboard';
      var gamepadNumber = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

      if (!this.controlsEnabled) {
        return;
      }

      var isController = inputDevice === 'controller'; // Check if we should also set the direction-specific axes actions.

      if (isController && key.indexOf('axes') >= 0 && !key.startsWith('+') && !key.startsWith('-')) {
        var absValue = Math.abs(value);

        if (value > 0) {
          this.setActions('+' + key, absValue, inputDevice, gamepadNumber);
          this.setActions('-' + key, 0, inputDevice, gamepadNumber);
        } else if (value < 0) {
          this.setActions('-' + key, absValue, inputDevice, gamepadNumber);
          this.setActions('+' + key, 0, inputDevice, gamepadNumber);
        } else {
          this.setActions('+' + key, absValue, inputDevice, gamepadNumber);
          this.setActions('-' + key, absValue, inputDevice, gamepadNumber);
        }
      } // Broadcast actions to all entities.


      this.registeredEntities.forEach(function (entity) {
        var playerNumber = entity.getPlayerNumber(); // Check gamepad association.

        if (isController && entity.getPlayerNumber() != null && gamepadNumber != entity.getPlayerNumber()) {
          return;
        }

        if (isController) {
          // No longer need to check for player number.
          playerNumber = null;
        } // Get the bindings for the entity.


        var bindings = _this4.registeredBindings.get(entity.getControlsId());

        if (!bindings) {
          console.warn('Bindings not defined for registered entity', entity);
          return;
        }

        var actions = bindings.getActionsForKey(key, playerNumber);

        if (!actions) {
          return;
        }

        actions.forEach(function (action) {
          return entity.setAction(action, value);
        });
        entity.inputDevice = inputDevice;
      });
    }
    /**
     * Handles and delegates mouse movement events.
     */

  }, {
    key: "onMouseMove",
    value: function onMouseMove(e) {
      if (!this.controlsEnabled) {
        return;
      }

      var ratio = this.mouseSensitivity / 50;
      this.registeredEntities.forEach(function (entity) {
        entity.setMouseMovement(e.movementX * ratio, e.movementY * ratio);
      });
    }
    /**
     * Registers an entity to receive controller input.
     */

  }, {
    key: "registerEntity",
    value: function registerEntity(entity) {
      if (!entity || !entity.actions) {
        console.error('Must pass in an entity');
      }

      this.registeredEntities.set(entity.uuid, entity);
    }
    /**
     * Unregisters an entity from receiving controller input.
     */

  }, {
    key: "unregisterEntity",
    value: function unregisterEntity(entity) {
      if (!entity || !entity.actions) {
        console.error('Must pass in an entity');
      }

      this.registeredEntities["delete"](entity.uuid);
      entity.clearInput();
    }
    /**
     * Loads settings.
     */

  }, {
    key: "loadSettings",
    value: function loadSettings() {
      this.movementDeadzone = Settings$1.get('movement_deadzone');
      this.mouseSensitivity = Settings$1.get('mouse_sensitivity');
    }
    /**
     * Creates orbit controls on the camera, if they exist.
     * @param {THREE.Camera} camera
     * @param {THREE.Renderer} renderer
     */

  }, {
    key: "useOrbitControls",
    value: function useOrbitControls(camera, renderer) {
      return new OrbitControls(camera, renderer.domElement);
    }
    /**
     * Creates pointer lock controls on the renderer.
     */

  }, {
    key: "usePointerLockControls",
    value: function usePointerLockControls() {
      this.pointerLockEnabled = true;
      this.requestPointerLock();
    }
    /**
     * Registers a bindings set to the controls for a given entity. The provided
     * entity should be the static class, not an instance.
     * @param {Entity} entity
     * @returns {Bindings}
     */

  }, {
    key: "registerBindings",
    value: function registerBindings(entity) {
      var bindings = entity.GetBindings(); // Register the entity controls for later use when reloading defaults.

      this.controlIds.set(bindings.getId(), entity); // Check if custom bindings have already been set.

      var customBindings = this.registeredBindings.get(bindings.getId());

      if (customBindings) {
        return customBindings.merge(bindings);
      }

      this.registeredBindings.set(bindings.getId(), bindings);
      return bindings;
    }
    /**
     * Registers bindings for a provided ID. This should only be used internally.
     * @param {string} controlsId
     * @param {Bindings} bindings
     */

  }, {
    key: "registerCustomBindingsForId",
    value: function registerCustomBindingsForId(bindings) {
      var defaultBindings = this.registeredBindings.get(bindings.getId());

      if (defaultBindings) {
        bindings.merge(defaultBindings);
      }

      this.registeredBindings.set(bindings.getId(), bindings);
    }
    /**
     * Retrieves the bindings for a given ID.
     * @param {string} controlsId
     * @returns {Bindings}
     */

  }, {
    key: "getBindings",
    value: function getBindings(controlsId) {
      var bindings = this.registeredBindings.get(controlsId);

      if (!bindings) {
        return;
      }

      return bindings;
    }
  }]);

  return Controls;
}(Plugin);

function _createSuper$6(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$6(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$6() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * A standard event target.
 * @implements {EventTargetInterface}
 */


var EventTarget = /*#__PURE__*/function () {
  function EventTarget() {
    _classCallCheck(this, EventTarget);

    this.listeners = new Map();
    this.uuidToLabels = new Map();
  }
  /** @override */


  _createClass(EventTarget, [{
    key: "addEventListener",
    value: function addEventListener(label, handler) {
      if (!this.listeners.has(label)) {
        this.listeners.set(label, new Map());
      }

      var uuid = createUUID();
      this.listeners.get(label).set(uuid, handler);
      this.uuidToLabels.set(uuid, label);
      return uuid;
    }
    /** @override */

  }, {
    key: "removeEventListener",
    value: function removeEventListener(uuid) {
      var label = this.uuidToLabels.get(uuid);

      if (!label) {
        return false;
      }

      this.uuidToLabels["delete"](uuid);
      var labelListeners = this.listeners.get(label);

      if (!labelListeners) {
        return false;
      }

      return labelListeners["delete"](uuid);
    }
    /** @override */

  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(label, data) {
      var labelListeners = this.listeners.get(label);

      if (!labelListeners) {
        return;
      }

      labelListeners.forEach(function (handler) {
        return handler(data);
      });
    }
  }]);

  return EventTarget;
}();
/**
 * An EventTarget that extends THREE.Object3D for use by Entities.
 * TODO: Try and reduce duplicate code between these two due to lack of
 *       multiple inheritance in JS.
 * @implements {EventTargetInterface}
 */


var Object3DEventTarget = /*#__PURE__*/function (_THREE$Object3D) {
  _inherits(Object3DEventTarget, _THREE$Object3D);

  var _super = _createSuper$6(Object3DEventTarget);

  function Object3DEventTarget() {
    var _this;

    _classCallCheck(this, Object3DEventTarget);

    _this = _super.call(this);
    _this.listeners = new Map();
    _this.uuidToLabels = new Map();
    return _this;
  }
  /** @override */


  _createClass(Object3DEventTarget, [{
    key: "addEventListener",
    value: function addEventListener(label, handler) {
      if (!this.listeners.has(label)) {
        this.listeners.set(label, new Map());
      }

      var uuid = createUUID();
      this.listeners.get(label).set(uuid, handler);
      this.uuidToLabels.set(uuid, label);
      return uuid;
    }
    /** @override */

  }, {
    key: "addOneShotEventListener",
    value: function addOneShotEventListener(label, handler) {
      var _this2 = this;

      var listener = this.addEventListener(label, function (data) {
        _this2.removeEventListener(listener);

        handler(data);
      });
    }
    /** @override */

  }, {
    key: "removeEventListener",
    value: function removeEventListener(uuid) {
      var label = this.uuidToLabels.get(uuid);

      if (!label) {
        return false;
      }

      this.uuidToLabels["delete"](uuid);
      var labelListeners = this.listeners.get(label);

      if (!labelListeners) {
        return false;
      }

      return labelListeners["delete"](uuid);
    }
    /** @override */

  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(label, data) {
      var labelListeners = this.listeners.get(label);

      if (!labelListeners) {
        return;
      }

      labelListeners.forEach(function (handler) {
        return handler(data);
      });
    }
  }]);

  return Object3DEventTarget;
}(Object3D);

function _createSuper$7(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$7(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$7() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * Represents a game that will be run on the engine. The purpose of a game
 * mode is to better control the state of a game as well as assist conditions to
 * start and end a game. Developers should extend GameMode to create their own
 * games.
 */

var GameMode = /*#__PURE__*/function (_EventTarget) {
  _inherits(GameMode, _EventTarget);

  var _super = _createSuper$7(GameMode);

  function GameMode() {
    _classCallCheck(this, GameMode);

    return _super.apply(this, arguments);
  }

  _createClass(GameMode, [{
    key: "load",

    /**
     * Loads a game mode for the first time. This should include loading necessary
     * models, environment, stages, etc.
     * @async
     */
    value: function () {
      var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function load() {
        return _load.apply(this, arguments);
      }

      return load;
    }()
    /**
     * Starts the game mode. At this point, all necessary components of the game
     * mode should be readily available.
     * @async
     */

  }, {
    key: "start",
    value: function () {
      var _start = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function start() {
        return _start.apply(this, arguments);
      }

      return start;
    }()
    /**
     * Ends the game mode. The end function should perform any clean up necessary
     * for the objects created during the game, **not** the items loaded in the
     * load method. This is to prevent any issues with restarting the game mode.
     * @async
     */

  }, {
    key: "end",
    value: function () {
      var _end = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.dispatchEvent('end');

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function end() {
        return _end.apply(this, arguments);
      }

      return end;
    }()
    /**
     * Restarts the game mode by calling the `end` function, then `start`.
     * @async
     */

  }, {
    key: "restart",
    value: function () {
      var _restart = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4() {
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return this.end();

              case 2:
                _context4.next = 4;
                return this.start();

              case 4:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function restart() {
        return _restart.apply(this, arguments);
      }

      return restart;
    }()
    /**
     * Macro fro adding an event listener to the end event.
     * @param {function} handler
     * @return {string} The uuid of the handler.
     */

  }, {
    key: "onEnd",
    value: function onEnd(handler) {
      return this.addEventListener('end', handler);
    }
  }]);

  return GameMode;
}(EventTarget);

function _createSuper$8(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$8(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$8() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var instance$5 = null;
/**
 * Light core for the game engine. Creates and manages light
 * sources in-game. Should be used as a singleton.
 */

var Light = /*#__PURE__*/function (_Plugin) {
  _inherits(Light, _Plugin);

  var _super = _createSuper$8(Light);

  _createClass(Light, null, [{
    key: "get",

    /**
     * Enforces singleton light instance.
     */
    value: function get() {
      if (!instance$5) {
        instance$5 = new Light();
      }

      return instance$5;
    }
  }]);

  function Light() {
    var _this;

    _classCallCheck(this, Light);

    _this = _super.call(this);
    _this.ambientLight = null;
    _this.lights = new Array();
    _this.debugEnabled = false;
    _this.shadowsEnabled = false;

    _this.handleSettingsChange();

    return _this;
  }
  /** @override */


  _createClass(Light, [{
    key: "reset",
    value: function reset() {
      var _this2 = this;

      this.ambientLight = null;
      this.lights.forEach(function (light) {
        _this2.removeHelpers(light);

        if (light.parent) {
          light.parent.remove(light);
        }
      });
      this.lights = new Array();
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {
      this.updateHelpers();
    }
    /**
     * Updates all helpers attached to lights.
     */

  }, {
    key: "updateHelpers",
    value: function updateHelpers() {
      var _this3 = this;

      // If debug settings are enabled, check for lights and their debug helpers.
      if (this.debugEnabled) {
        this.lights.forEach(function (light) {
          return _this3.addHelpers(light);
        });
      } else {
        this.lights.forEach(function (light) {
          return _this3.removeHelpers(light);
        });
      }
    }
    /**
     * Creates the ambient lighting. Use this for easing/darkening shadows.
     * @param {Object|LightOptions} options
     */

  }, {
    key: "createAmbientLight",
    value: function createAmbientLight(options) {
      options = new LightOptions(options);
      var light = new AmbientLight(options.color);
      light.intensity = options.intensity;
      this.ambientLight = light;
      return light;
    }
    /**
     * Creates a directional light.
     * @param {Object|LightOptions} options
     */

  }, {
    key: "createDirectionalLight",
    value: function createDirectionalLight(options) {
      options = new LightOptions(options);
      var light = new DirectionalLight(options.color);
      light.userData.options = options;
      light.position.copy(options.position);
      light.intensity = options.intensity;
      this.createShadows(light, options.shadow);
      light.helper = new DirectionalLightHelper(light, 10);
      this.lights.push(light);
      return light;
    }
    /**
     * Creates a spot light.
     * @param {Object|LightOptions} options
     */

  }, {
    key: "createSpotLight",
    value: function createSpotLight(options) {
      options = new LightOptions(options);
      var light = new SpotLight(options.color);
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
      light.helper = new SpotLightHelper(light);
      this.lights.push(light);
      return light;
    }
    /**
     * Creates the shadows for a light.
     * @param {THREE.Light} light
     * @param {ShadowOptions} options
     */

  }, {
    key: "createShadows",
    value: function createShadows(light, options) {
      if (!options) {
        return;
      }

      var cameraRange = options.frustum;
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
      light.shadow.helper = new CameraHelper(light.shadow.camera);

      if (Settings$1.get('shadows')) {
        light.castShadow = true;
      }
    }
    /** @override */

  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {
      Settings$1.get('shadows') ? this.enableShadows() : this.disableShadows();
      Settings$1.get('debug') ? this.enableDebug() : this.disableDebug();
    }
    /**
     * Enables shadows.
     */

  }, {
    key: "enableShadows",
    value: function enableShadows() {
      if (this.shadowsEnabled) {
        return;
      }

      this.shadowsEnabled = true;
      this.lights.forEach(function (light) {
        var options = light.userData.options;

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

  }, {
    key: "disableShadows",
    value: function disableShadows() {
      if (!this.shadowsEnabled) {
        return;
      }

      this.shadowsEnabled = false;
      this.lights.forEach(function (light) {
        return light.castShadow = false;
      });
    }
    /**
     * Enables debug renderering.
     */

  }, {
    key: "enableDebug",
    value: function enableDebug() {
      var _this4 = this;

      if (this.debugEnabled) {
        return;
      }

      this.debugEnabled = true;
      this.lights.forEach(function (light) {
        return _this4.addHelpers(light);
      });
    }
    /**
     * Disables debug rendering.
     */

  }, {
    key: "disableDebug",
    value: function disableDebug() {
      var _this5 = this;

      if (!this.debugEnabled) {
        return;
      }

      this.debugEnabled = false;
      this.lights.forEach(function (light) {
        return _this5.removeHelpers(light);
      });
    }
    /**
     * Adds the provided light's helpers to the root scene.
     * @param {THREE.Light} light
     */

  }, {
    key: "addHelpers",
    value: function addHelpers(light) {
      // Handle base light helper first.
      var rootScene = getRootScene(light);

      if (light.helper && !light.helper.parent) {
        rootScene = getRootScene(light);

        if (rootScene) {
          rootScene.add(light.helper);
        }
      }

      if (Settings$1.get('shadows') && light.shadow && light.shadow.helper && !light.shadow.helper.parent) {
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

  }, {
    key: "removeHelpers",
    value: function removeHelpers(light) {
      if (light.helper && light.helper.parent) {
        light.helper.parent.remove(light.helper);
      }

      if (light.shadow && light.shadow.helper && light.shadow.helper.parent) {
        light.shadow.helper.parent.remove(light.shadow.helper);
      }

      light.userData.addedToScene = false;
    }
  }]);

  return Light;
}(Plugin);
/**
 * Light options created from a light config passed in by the user.
 * @record
 */


var LightOptions =
/**
 * @param {Object} options
 */
function LightOptions(options) {
  _classCallCheck(this, LightOptions);

  this.angle = options.angle;
  this.color = options.color ? parseInt(options.color, 16) : 0xffffff;
  this.decay = options.decay;
  this.distance = options.distance;
  this.groundColor = options.groundColor ? parseInt(options.groundColor, 16) : 0xffffff;
  this.intensity = options.intensity || 1.0;
  this.penumbra = options.penumbra;
  this.position = new Vector3(options.x || 0, options.y || 0, options.z || 0);
  this.power = options.power;
  this.shadow = options.shadow ? new ShadowOptions(options.shadow) : null;
};
/**
 * Shadow options attached to a light config.
 * @record
 */


var ShadowOptions =
/**
 * @param {Object} options
 */
function ShadowOptions(options) {
  _classCallCheck(this, ShadowOptions);

  this.frustum = options.frustum || 10;
  this.mapSize = options.mapSize || 1024;
  this.near = options.near || 1;
  this.far = options.far || 100;
  this.radius = options.radius || null;
  this.bias = options.bias || null;
};

var instance$6 = null;
/**
 * Core implementation for loading 3D models for use in-game.
 */

var Models = /*#__PURE__*/function () {
  _createClass(Models, null, [{
    key: "get",

    /**
     * Enforces a singleton instance of Models.
     * @returns {Models}
     */
    value: function get() {
      if (!instance$6) {
        instance$6 = new Models();
      }

      return instance$6;
    }
  }]);

  function Models() {
    _classCallCheck(this, Models);

    // Stores all models. Key is the model name, value is the
    // model mesh.
    this.storage = new Map();
  }
  /**
   * Loads all models described from the provided file path. The file should
   * be a JSON file. Follow the example at /src/data/models.json.
   * @param {string} filePath
   * @async
   */


  _createClass(Models, [{
    key: "loadAllFromFile",
    value: function () {
      var _loadAllFromFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(filePath) {
        var allModelData, directory, promises, name, options;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (filePath) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                _context.prev = 2;
                _context.next = 5;
                return loadJsonFromFile(filePath);

              case 5:
                allModelData = _context.sent;
                _context.next = 11;
                break;

              case 8:
                _context.prev = 8;
                _context.t0 = _context["catch"](2);
                throw new Error(_context.t0);

              case 11:
                // Extract the directory from the file path, use for loading models.
                directory = filePath.substr(0, filePath.lastIndexOf('/') + 1);
                promises = new Array();

                for (name in allModelData) {
                  options = allModelData[name];
                  promises.push(this.loadModel(directory, name, options));
                }

                return _context.abrupt("return", Promise.all(promises));

              case 15:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[2, 8]]);
      }));

      function loadAllFromFile(_x) {
        return _loadAllFromFile.apply(this, arguments);
      }

      return loadAllFromFile;
    }()
    /**
     * Load the model from file and places it into model storage. Uses the glTF
     * file format and loader.
     * @param {string} path
     * @param {Object} options
     * @async
     */

  }, {
    key: "loadModel",
    value: function () {
      var _loadModel = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(directory, name) {
        var options,
            extension,
            path,
            root,
            gltf,
            lod,
            _args2 = arguments;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                options = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : {};
                // Defaults to GLTF.
                extension = options.extension ? options.extension : 'gltf';
                path = "".concat(directory).concat(name, ".").concat(extension);
                _context2.t0 = extension;
                _context2.next = _context2.t0 === 'gltf' ? 6 : _context2.t0 === 'obj' ? 12 : _context2.t0 === 'fbx' ? 16 : 21;
                break;

              case 6:
                _context2.next = 8;
                return this.loadGltfModel(path);

              case 8:
                gltf = _context2.sent;
                root = gltf.scene;
                Animation.get().setAnimations(name, gltf.animations);
                return _context2.abrupt("break", 21);

              case 12:
                _context2.next = 14;
                return this.loadObjModel(path);

              case 14:
                root = _context2.sent;
                return _context2.abrupt("break", 21);

              case 16:
                _context2.next = 18;
                return this.loadFbxModel(path);

              case 18:
                root = _context2.sent;
                Animation.get().setAnimations(name, root.animations);
                return _context2.abrupt("break", 21);

              case 21:
                // Scale the model based on options.
                if (options.scale) {
                  root.scale.setScalar(options.scale);
                }

                if (!options.lod) {
                  _context2.next = 26;
                  break;
                }

                lod = this.loadLod_(root, options.lod);
                this.storage.set(name, lod);
                return _context2.abrupt("return", lod);

              case 26:
                // Set the model in storage.
                this.storage.set(name, root);
                return _context2.abrupt("return", root);

              case 28:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loadModel(_x2, _x3) {
        return _loadModel.apply(this, arguments);
      }

      return loadModel;
    }()
    /**
     * Loads a model from the given file path.
     * @param {string} path
     * @async
     */

  }, {
    key: "loadModelWithoutStorage",
    value: function () {
      var _loadModelWithoutStorage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(path) {
        var extension, root, gltf;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // Defaults to GLTF.
                extension = path.substr(path.lastIndexOf('.') + 1);
                _context3.t0 = extension;
                _context3.next = _context3.t0 === 'gltf' ? 4 : _context3.t0 === 'obj' ? 9 : _context3.t0 === 'fbx' ? 13 : 17;
                break;

              case 4:
                _context3.next = 6;
                return this.loadGltfModel(path);

              case 6:
                gltf = _context3.sent;
                root = gltf.scene;
                return _context3.abrupt("break", 17);

              case 9:
                _context3.next = 11;
                return this.loadObjModel(path);

              case 11:
                root = _context3.sent;
                return _context3.abrupt("break", 17);

              case 13:
                _context3.next = 15;
                return this.loadFbxModel(path);

              case 15:
                root = _context3.sent;
                return _context3.abrupt("break", 17);

              case 17:
                return _context3.abrupt("return", root);

              case 18:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function loadModelWithoutStorage(_x4) {
        return _loadModelWithoutStorage.apply(this, arguments);
      }

      return loadModelWithoutStorage;
    }()
    /**
     * Loads a GLTF model.
     * @param {string} path
     * @async
     */

  }, {
    key: "loadGltfModel",
    value: function () {
      var _loadGltfModel = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(path) {
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt("return", new Promise(function (resolve) {
                  var loader = new GLTFLoader();
                  loader.load(path, function (gltf) {
                    resolve(gltf);
                  }, function () {}, function (err) {
                    throw new Error(err);
                  });
                }));

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function loadGltfModel(_x5) {
        return _loadGltfModel.apply(this, arguments);
      }

      return loadGltfModel;
    }()
    /**
     * Loads a Obj model.
     * @param {string} path
     * @async
     */

  }, {
    key: "loadObjModel",
    value: function () {
      var _loadObjModel = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(path) {
        var materials, root;
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                materials = null;
                _context5.prev = 1;
                _context5.next = 4;
                return this.loadObjMaterials(path);

              case 4:
                materials = _context5.sent;
                _context5.next = 9;
                break;

              case 7:
                _context5.prev = 7;
                _context5.t0 = _context5["catch"](1);

              case 9:
                _context5.next = 11;
                return this.loadObjGeometry(path, materials);

              case 11:
                root = _context5.sent;
                return _context5.abrupt("return", root);

              case 13:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[1, 7]]);
      }));

      function loadObjModel(_x6) {
        return _loadObjModel.apply(this, arguments);
      }

      return loadObjModel;
    }()
    /**
     *
     * @param {string} path
     * @param {?} materials
     */

  }, {
    key: "loadObjGeometry",
    value: function loadObjGeometry(path, materials) {
      return new Promise(function (resolve) {
        var objLoader = new OBJLoader();

        if (materials) {
          objLoader.setMaterials(materials);
        }

        objLoader.load(path, resolve);
      });
    }
    /**
     * Loads an obj files respective materials.
     * @param {string} path
     * @async
     */

  }, {
    key: "loadObjMaterials",
    value: function loadObjMaterials(path) {
      var mtlLoader = new MTLLoader(); // Modify .obj path to look for .mtl.

      path = path.slice(0, path.lastIndexOf('.')) + '.mtl';
      return new Promise(function (resolve, reject) {
        mtlLoader.load(path, function (materials) {
          materials.preload();
          resolve(materials);
        }, function () {}, function () {
          return reject();
        });
      });
    }
    /**
     * Loads a FBX model.
     * @param {string} path
     * @async
     */

  }, {
    key: "loadFbxModel",
    value: function () {
      var _loadFbxModel = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(path) {
        var loader;
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                loader = new FBXLoader();
                return _context6.abrupt("return", new Promise(function (resolve) {
                  loader.load(path, function (object) {
                    resolve(object);
                  }, function () {}, function (err) {
                    return console.error(err);
                  });
                }));

              case 2:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function loadFbxModel(_x7) {
        return _loadFbxModel.apply(this, arguments);
      }

      return loadFbxModel;
    }()
    /**
     * Creates a clone of a model from storage.
     * @param {string} name
     * @return {THREE.Object3D}
     */

  }, {
    key: "createModel",
    value: function createModel(name) {
      if (!this.storage.has(name)) {
        return null;
      }

      var original = this.storage.get(name);
      var clone = SkeletonUtils.clone(original);
      return clone;
    }
    /**
     * Loads a Level of Detail wrapper object for the given model. This works
     * under the assumption that the user has provided groups of meshes, each with
     * a suffix "_LOD{n}".
     * @param {THREE.Object3D} root
     * @param {Array<number>} levels
     * @return {THREE.LOD}
     * @private
     */

  }, {
    key: "loadLod_",
    value: function loadLod_(root, levels) {
      // Ensure the root contains a list of children.
      if (!root || !root.children || root.children.length != levels.length) {
        console.error('Root children and levels do not match:', root.children, levels);
      }

      var lod = new LOD();
      levels.forEach(function (levelThreshold, index) {
        var lodObject = null;
        root.children.forEach(function (child) {
          if (new RegExp(".*LOD".concat(index)).test(child.name)) {
            lodObject = child;
          }
        });

        if (!lodObject) {
          return console.error('No LOD mesh for level', index);
        }

        lod.addLevel(lodObject, levelThreshold);
      });
      return lod;
    }
  }]);

  return Models;
}();

// TODO: Make this dynamic, with multiple levels.

var QUALITY_RANGE = new Vector3().setScalar(2);
/**
 * A world plugin for adjusting the quality of entities given their proximity to
 * the camera or main entity. These adjustments include enabling/disabling
 * physics for entities, lowering geometry quality (redundant vertices), etc.
 */

var QualityAdjuster = /*#__PURE__*/function () {
  function QualityAdjuster() {
    _classCallCheck(this, QualityAdjuster);

    this.rootBox = new Box3();
    this.rootBoxHelper = new Box3Helper(this.rootBox, 0xffff00);
    this.vectorDummy = new Vector3();
    this.entityBox = new Box3();
    SettingsEvent.listen(this.handleSettingsChange.bind(this));
  }
  /**
   * @param {World} world Parent world that the adjuster operates on.
   * @return {QualityAdjuster}
   */


  _createClass(QualityAdjuster, [{
    key: "setWorld",
    value: function setWorld(world) {
      this.world = world;
      this.handleSettingsChange();
      return this;
    }
    /**
     * Iterates through all of the worlds entities and adjusts their quality, if
     * necessary.
     */

  }, {
    key: "update",
    value: function update() {
      var _this = this;

      var entities = this.world.entities;
      Controls.get().registeredEntities.forEach(function (attachedEntity) {
        _this.rootBox.setFromCenterAndSize(attachedEntity.position, QUALITY_RANGE);

        entities.forEach(function (entity) {
          if (entity == attachedEntity) {
            return;
          }

          if (!entity.qualityAdjustEnabled) {
            return;
          }

          _this.entityBox.setFromObject(entity);

          if (_this.rootBox.intersectsBox(_this.entityBox)) {
            _this.world.enableEntityPhysics(entity);
          } else {
            _this.world.disableEntityPhysics(entity);
          }
        });
      });
    }
  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {
      if (!this.world) {
        return;
      }

      if (Settings$1.get('debug')) {
        this.world.getScene().add(this.rootBoxHelper);
      } else {
        this.world.getScene().remove(this.rootBoxHelper);
      }
    }
  }]);

  return QualityAdjuster;
}();

/**
 * @author rogerscg / https://github.com/rogerscg
 */

var instance$7 = null;
/**
 * A pool for maintaining WebWorkers in order to prevent creating too many
 * workers at once.
 */

var WorkerPool = /*#__PURE__*/function () {
  _createClass(WorkerPool, null, [{
    key: "get",
    value: function get() {
      if (!instance$7) {
        instance$7 = new WorkerPool();
      }

      return instance$7;
    }
  }]);

  function WorkerPool() {
    _classCallCheck(this, WorkerPool);

    this.capacity = 20; // Set of workers currently in use.

    this.workers = new Set(); // A queue of resolvers.

    this.queue = new Array();
  }
  /**
   * Checks if there is an available worker.
   * @returns {boolean}
   */


  _createClass(WorkerPool, [{
    key: "hasAvailability",
    value: function hasAvailability() {
      return this.workers.size < this.capacity;
    }
    /**
     * Waits for an open worker slot. Returns a reservation UUID in order to track
     * reservation release, once available.
     * @returns {string} UUID of the reservation.
     * @async
     */

  }, {
    key: "getWorkerReservation",
    value: function () {
      var _getWorkerReservation = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var uuid;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                uuid = createUUID();

                if (!this.hasAvailability()) {
                  _context.next = 4;
                  break;
                }

                this.workers.add(uuid);
                return _context.abrupt("return", uuid);

              case 4:
                _context.next = 6;
                return this.waitForOpening_();

              case 6:
                this.workers.add(uuid);
                return _context.abrupt("return", uuid);

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getWorkerReservation() {
        return _getWorkerReservation.apply(this, arguments);
      }

      return getWorkerReservation;
    }()
    /**
     * Adds a reservation to the queue, whose promise resolves when an opening is
     * available.
     * @private
     * @async
     */

  }, {
    key: "waitForOpening_",
    value: function () {
      var _waitForOpening_ = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var _this = this;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", new Promise(function (resolve) {
                  return _this.queue.push(resolve);
                }));

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function waitForOpening_() {
        return _waitForOpening_.apply(this, arguments);
      }

      return waitForOpening_;
    }()
    /**
     * Releases a worker from the pool.
     * @param {string} reservationUUID
     */

  }, {
    key: "releaseWorker",
    value: function releaseWorker(reservationUUID) {
      if (!this.workers.has(reservationUUID)) {
        return console.warn('Worker pool does not contain this reservation');
      }

      this.workers["delete"](reservationUUID);
      var resolver = this.queue.shift();

      if (resolver) {
        resolver();
      }
    }
  }]);

  return WorkerPool;
}();

var CANVAS_HEIGHT = 100;
var CANVAS_WIDTH = 100;
var AXES = ['x', 'y', 'z'];
var CENTER_COMPASS_CSS = "\n  height: ".concat(CANVAS_HEIGHT, "px;\n  width: ").concat(CANVAS_WIDTH, "px;\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  margin: auto;\n  pointer-events: none;\n");
var COORDINATE_CONTAINER_CSS = "\n  position: absolute;\n  top: 0;\n  left: 0;\n  pointer-events: none;\n  font-family: monospace;\n  padding: 15px;\n  background: rgba(0, 0, 0, .4);\n  color: rgb(0, 255, 255);\n";
var COORDINATE_HTML = "\n  <div>Camera Coordinates</div>\n  <div>\n    <div class='era-coord-value era-coord-x'></div>\n    <div class='era-coord-value era-coord-y'></div>\n    <div class='era-coord-value era-coord-z'></div>\n  </div>\n";
/**
 * Provides a direction and position helpers for debugging purposes. Must build
 * its own UI and renderer to update properly.
 */

var DebugCompass = /*#__PURE__*/function () {
  function DebugCompass(targetRenderer) {
    _classCallCheck(this, DebugCompass);

    this.enabled = Settings$1.get('debug');
    this.targetRenderer = targetRenderer;
    this.createAxisHelper();
    this.createCoordinateHelper();
    SettingsEvent.listen(this.handleSettingsChange.bind(this)); // TODO: Add parent position coordinates (for precise entity positions).
  }
  /**
   * Creates an axis helper at the center of the target renderer.
   */


  _createClass(DebugCompass, [{
    key: "createAxisHelper",
    value: function createAxisHelper() {
      // Create debug compass renderer.
      this.container = document.createElement('div');
      this.container.style.cssText = CENTER_COMPASS_CSS; // Create renderer.

      this.scene = new Scene();
      this.debugRenderer = defaultEraRenderer();
      this.debugRenderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
      this.container.appendChild(this.debugRenderer.domElement);
      this.targetRenderer.domElement.parentElement.appendChild(this.container);
      this.camera = Camera.get().buildIsometricCamera();
      this.camera.zoom = 500;
      this.camera.updateProjectionMatrix(); // Add axes helper.

      this.axesHelper = new AxesHelper();
      this.scene.add(this.axesHelper);
      this.scene.add(this.camera);
    }
    /**
     * Creates a coordinates window at the top left of the renderer.
     */

  }, {
    key: "createCoordinateHelper",
    value: function createCoordinateHelper() {
      var _this = this;

      // Create coordinate helper container.
      this.coordinateContainer = document.createElement('div');
      this.coordinateContainer.innerHTML = COORDINATE_HTML;
      this.coordinateContainer.style.cssText = COORDINATE_CONTAINER_CSS;
      this.targetRenderer.domElement.parentElement.appendChild(this.coordinateContainer);
      this.coordinateDivs = new Map();
      AXES.forEach(function (axis) {
        var valueDiv = _this.coordinateContainer.getElementsByClassName("era-coord-".concat(axis))[0];

        _this.coordinateDivs.set(axis, valueDiv);
      });
      this.worldPositionDummy = new Vector3();
    }
    /**
     * Enables renderer stats.
     */

  }, {
    key: "enable",
    value: function enable() {
      if (this.enabled) {
        return;
      }

      this.enabled = true;
      this.targetRenderer.domElement.parentElement.appendChild(this.container);
      this.targetRenderer.domElement.parentElement.appendChild(this.coordinateContainer);
    }
    /**
     * Disables renderer stats.
     */

  }, {
    key: "disable",
    value: function disable() {
      if (!this.enabled) {
        return;
      }

      this.enabled = false;

      if (this.targetRenderer.domElement.parentElement) {
        this.targetRenderer.domElement.parentElement.removeChild(this.container);
        this.targetRenderer.domElement.parentElement.removeChild(this.coordinateContainer);
      }
    }
    /**
     * Updates the debug compass. Called from world updates directly, rather than
     * implicitly from engine updates.
     * @param {THREE.Camera} targetCamera
     */

  }, {
    key: "update",
    value: function update(targetCamera) {
      var _this2 = this;

      if (!this.enabled) {
        return;
      } // Update axes helper.


      targetCamera.getWorldDirection(this.camera.position);
      this.camera.position.multiplyScalar(-2);
      this.camera.lookAt(this.axesHelper.position);
      this.debugRenderer.render(this.scene, this.camera); // Update coordinates.

      targetCamera.getWorldPosition(this.worldPositionDummy);
      AXES.forEach(function (axis) {
        var valDiv = _this2.coordinateDivs.get(axis);

        var value = _this2.worldPositionDummy[axis];
        valDiv.textContent = "".concat(axis.toUpperCase(), ": ").concat(value.toFixed(2));
      });
    }
  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {
      var currEnabled = Settings$1.get('debug');

      if (currEnabled && !this.enabled) {
        return this.enable();
      }

      if (!currEnabled && this.enabled) {
        return this.disable();
      }
    }
  }]);

  return DebugCompass;
}();

function _createSuper$9(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$9(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$9() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var STATS_CONTAINER_CSS = "\n  bottom: 0;\n  position: absolute;\n  left: 0;\n";
var WEBGL_CONTAINER_CSS = "\n  background-color: #002;\n  color: #0ff;\n  cursor: pointer;\n  font-family: Helvetica,Arial,sans-serif;\n  font-size: 9px;\n  font-weight: bold;\n  line-height: 15px;\n  opacity: 0.9;\n  padding: 0 0 3px 3px;\n  text-align: left;\n  width: 80px;\n";
var FPS_CONTAINER_CSS = "\n  cursor: pointer;\n  opacity: 0.9;\n";
/**
 * A plugin wrapper for WebGL renderer stats and FPS in Three.js.
 */

var RendererStats = /*#__PURE__*/function (_Plugin) {
  _inherits(RendererStats, _Plugin);

  var _super = _createSuper$9(RendererStats);

  /**
   * @param {THREE.WebGLRenderer} renderer
   */
  function RendererStats(renderer) {
    var _this;

    _classCallCheck(this, RendererStats);

    _this = _super.call(this);
    _this.renderer = renderer;
    _this.enabled = Settings$1.get('debug');
    _this.webGLStats = new WebGLStats(renderer);
    _this.fpsStats = new FpsStats();
    _this.dom = _this.createDom();

    _this.dom.appendChild(_this.webGLStats.dom);

    _this.dom.appendChild(_this.fpsStats.dom);

    if (_this.enabled) {
      renderer.domElement.parentElement.appendChild(_this.dom);
    }

    return _this;
  }
  /**
   * Creates the container DOM.
   */


  _createClass(RendererStats, [{
    key: "createDom",
    value: function createDom() {
      var container = document.createElement('div');
      container.style.cssText = STATS_CONTAINER_CSS;
      return container;
    }
    /**
     * Enables renderer stats.
     */

  }, {
    key: "enable",
    value: function enable() {
      this.enabled = true;
      this.renderer.domElement.parentElement.appendChild(this.dom);
    }
    /**
     * Disables renderer stats.
     */

  }, {
    key: "disable",
    value: function disable() {
      this.enabled = false;

      if (this.dom.parentElement) {
        this.dom.parentElement.removeChild(this.dom);
      }
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {
      if (!this.enabled) {
        return;
      }

      this.fpsStats.update();
      this.webGLStats.update();
    }
    /** @override */

  }, {
    key: "reset",
    value: function reset() {
      this.disable();
    }
    /** @override */

  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {
      var currEnabled = Settings$1.get('debug');

      if (currEnabled && !this.enabled) {
        return this.enable();
      }

      if (!currEnabled && this.enabled) {
        return this.disable();
      }
    }
  }]);

  return RendererStats;
}(Plugin);
/**
 * Interface for a stats component.
 */

var Stats = /*#__PURE__*/function () {
  function Stats() {
    _classCallCheck(this, Stats);

    this.dom = this.createDom();
  }
  /**
   * Updates the stats DOM.
   */


  _createClass(Stats, [{
    key: "update",
    value: function update() {
      return console.warn('Stats update function not defined');
    }
    /**
     * Enables the stats DOM.
     */

  }, {
    key: "enable",
    value: function enable() {
      return console.warn('Stats enable function not defined');
    }
    /**
     * Disables the stats DOM.
     */

  }, {
    key: "disable",
    value: function disable() {
      return console.warn('Stats disable function not defined');
    }
  }]);

  return Stats;
}();

var WebGLStats = /*#__PURE__*/function (_Stats) {
  _inherits(WebGLStats, _Stats);

  var _super2 = _createSuper$9(WebGLStats);

  function WebGLStats(renderer) {
    var _this2;

    _classCallCheck(this, WebGLStats);

    _this2 = _super2.call(this);
    _this2.renderer = renderer;
    return _this2;
  }
  /** @override */


  _createClass(WebGLStats, [{
    key: "createDom",
    value: function createDom() {
      var container = document.createElement('div');
      container.setAttribute('class', 'render-stats');
      container.style.cssText = WEBGL_CONTAINER_CSS;
      var msText = document.createElement('div');
      msText.innerHTML = 'WebGLRenderer';
      container.appendChild(msText);
      var msTexts = [];
      var nLines = 9;

      for (var i = 0; i < nLines; i++) {
        msTexts[i] = document.createElement('div');
        msTexts[i].style.backgroundColor = '#001632';
        container.appendChild(msTexts[i]);
      }

      this.msTexts = msTexts;
      return container;
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {
      if (!this.msTexts) {
        return;
      }

      var msTexts = this.msTexts;
      var i = 0;
      msTexts[i++].textContent = '=== Memory ===';
      msTexts[i++].textContent = 'Programs: ' + this.renderer.info.programs.length;
      msTexts[i++].textContent = 'Geometries: ' + this.renderer.info.memory.geometries;
      msTexts[i++].textContent = 'Textures: ' + this.renderer.info.memory.textures;
      msTexts[i++].textContent = '=== Render ===';
      msTexts[i++].textContent = 'Calls: ' + this.renderer.info.render.calls;
      msTexts[i++].textContent = 'Triangles: ' + this.renderer.info.render.triangles;
      msTexts[i++].textContent = 'Lines: ' + this.renderer.info.render.lines;
      msTexts[i++].textContent = 'Points: ' + this.renderer.info.render.points;
    }
  }]);

  return WebGLStats;
}(Stats);

var FpsStats = /*#__PURE__*/function (_Stats2) {
  _inherits(FpsStats, _Stats2);

  var _super3 = _createSuper$9(FpsStats);

  function FpsStats() {
    var _this3;

    _classCallCheck(this, FpsStats);

    _this3 = _super3.call(this);
    _this3.mode = 0;
    _this3.fps = 0;
    _this3.beginTime = (performance || Date).now();
    _this3.prevTime = _this3.beginTime;
    _this3.frames = 0;
    return _this3;
  }
  /** @override */


  _createClass(FpsStats, [{
    key: "createDom",
    value: function createDom() {
      var _this4 = this;

      // Create root.
      var container = document.createElement('div');
      this.dom = container;
      container.classList.add('render-stats');
      container.style.cssText = FPS_CONTAINER_CSS; // Switch panels on click.

      container.addEventListener('click', function (event) {
        event.preventDefault();

        _this4.showPanel(++_this4.mode % container.children.length);
      }, false);
      this.fpsPanel = this.addPanel(new Panel('FPS', '#0ff', '#002', true));
      this.msPanel = this.addPanel(new Panel('MS', '#0f0', '#020', false));
      this.timerPanel = this.addPanel(new Panel('Render', '#ff3800', '#210', false));

      if (window.performance && window.performance.memory) {
        this.memPanel = this.addPanel(new Panel('MB', '#f08', '#201', true));
      }

      this.showPanel(0);
      return container;
    }
  }, {
    key: "addPanel",
    value: function addPanel(panel) {
      this.dom.appendChild(panel.dom);
      return panel;
    }
  }, {
    key: "showPanel",
    value: function showPanel(id) {
      for (var i = 0; i < this.dom.children.length; i++) {
        this.dom.children[i].style.display = i === id ? 'block' : 'none';
      }

      this.mode = id;
    }
  }, {
    key: "begin",
    value: function begin() {
      this.beginTime = (performance || Date).now();
    }
  }, {
    key: "getFPS",
    value: function getFPS() {
      return this.fps;
    }
  }, {
    key: "end",
    value: function end() {
      this.frames++;
      var time = (performance || Date).now();
      this.msPanel.update(time - this.beginTime, 30);
      var engStats = EngineTimer$1["export"]();

      if (engStats) {
        this.timerPanel.update(engStats.avg, 30);
      }

      if (time >= this.prevTime + 1000) {
        this.fps = this.frames * 1000 / (time - this.prevTime);
        this.fpsPanel.update(this.fps, 100);
        this.prevTime = time;
        this.frames = 0;

        if (this.memPanel) {
          var memory = performance.memory;
          this.memPanel.update(memory.usedJSHeapSize / 1048576, memory.jsHeapSizeLimit / 1048576);
        }
      }

      return time;
    }
  }, {
    key: "update",
    value: function update() {
      this.beginTime = this.end();
    }
  }]);

  return FpsStats;
}(Stats); // Panel constants.


var PR = Math.round(window.devicePixelRatio || 1);
var WIDTH = 83 * PR;
var HEIGHT = 48 * PR;
var TEXT_X = 3 * PR;
var TEXT_Y = 2 * PR;
var GRAPH_X = 3 * PR;
var GRAPH_Y = 15 * PR;
var GRAPH_WIDTH = 74 * PR;
var GRAPH_HEIGHT = 30 * PR;
/**
 * An individual panel on the FPS stats component.
 */

var Panel = /*#__PURE__*/function () {
  function Panel(name, fg, bg, shouldRound) {
    _classCallCheck(this, Panel);

    this.name = name;
    this.fg = fg;
    this.bg = bg;
    this.min = Infinity;
    this.max = 0;
    this.shouldRound = shouldRound;
    this.createDom();
  }

  _createClass(Panel, [{
    key: "createDom",
    value: function createDom() {
      var canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      canvas.style.cssText = 'width:83px;height:48px';
      var context = canvas.getContext('2d');
      context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif';
      context.textBaseline = 'top';
      context.fillStyle = this.bg;
      context.fillRect(0, 0, WIDTH, HEIGHT);
      context.fillStyle = this.fg;
      context.fillText(this.name, TEXT_X, TEXT_Y);
      context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
      context.fillStyle = this.bg;
      context.globalAlpha = 0.9;
      context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);
      this.dom = canvas;
      this.canvas = canvas;
      this.context = context;
    }
  }, {
    key: "update",
    value: function update(value, maxValue) {
      var canvas = this.canvas;
      var context = this.context;
      this.min = Math.min(this.min, value);
      this.max = Math.max(this.max, value);
      var roundedValue = this.shouldRound ? Math.round(value) : value.toFixed(2);
      context.fillStyle = this.bg;
      context.globalAlpha = 1;
      context.fillRect(0, 0, WIDTH, GRAPH_Y);
      context.fillStyle = this.fg;
      context.fillText("".concat(roundedValue, " ").concat(this.name, " (").concat(Math.round(this.min), "-").concat(Math.round(this.max), ")"), TEXT_X, TEXT_Y);
      context.drawImage(canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT);
      context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT);
      context.fillStyle = this.bg;
      context.globalAlpha = 0.9;
      context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, Math.round((1 - value / maxValue) * GRAPH_HEIGHT));
    }
  }]);

  return Panel;
}();

/**
 * Adds Three.js primitives into the scene where all the Cannon bodies and
 * shapes are.
 */

var DebugRenderer = /*#__PURE__*/function () {
  /**
   * @param {THREE.Scene} scene
   * @param {CANNON.World} world
   */
  function DebugRenderer(scene, world) {
    _classCallCheck(this, DebugRenderer);

    this.scene = scene;
    this.world = world;
    this._meshes = [];
    this._material = new MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true
    });
    this._sleepMaterial = new MeshBasicMaterial({
      wireframe: true,
      color: 0x0000ff
    });
    this._sphereGeometry = new SphereGeometry(1);
    this._boxGeometry = new BoxGeometry(1, 1, 1);
    this._planeGeometry = new PlaneGeometry(10, 10, 10, 10);
    this._cylinderGeometry = new CylinderGeometry(1, 1, 10, 10);
    this.tmpVec0 = new Vec3();
    this.tmpVec1 = new Vec3();
    this.tmpVec2 = new Vec3();
    this.tmpQuat0 = new Vec3();
  }
  /** @override */


  _createClass(DebugRenderer, [{
    key: "update",
    value: function update() {
      var _this = this;

      var bodies = this.world.bodies;
      var meshes = this._meshes;
      var shapeWorldPosition = this.tmpVec0;
      var shapeWorldQuaternion = this.tmpQuat0;
      var meshIndex = 0;
      bodies.forEach(function (body) {
        body.shapes.forEach(function (shape, shapeIndex) {
          _this._updateMesh(meshIndex, body, shape);

          var mesh = meshes[meshIndex];

          if (mesh) {
            // Get world position
            body.quaternion.vmult(body.shapeOffsets[shapeIndex], shapeWorldPosition);
            body.position.vadd(shapeWorldPosition, shapeWorldPosition); // Get world quaternion

            body.quaternion.mult(body.shapeOrientations[shapeIndex], shapeWorldQuaternion); // Copy to meshes

            mesh.position.copy(shapeWorldPosition);
            mesh.quaternion.copy(shapeWorldQuaternion);
          }

          meshIndex++;
        });
      });

      for (var i = meshIndex; i < meshes.length; i++) {
        var mesh = meshes[i];

        if (mesh) {
          this.scene.remove(mesh);
        }
      }

      meshes.length = meshIndex;
    }
    /** @override */

  }, {
    key: "destroy",
    value: function destroy() {
      this._meshes.forEach(function (mesh) {
        if (mesh.parent) {
          mesh.parent.remove(mesh);
        }
      });
    }
  }, {
    key: "_updateMesh",
    value: function _updateMesh(index, body, shape) {
      var mesh = this._meshes[index];

      if (!this._typeMatch(mesh, shape)) {
        if (mesh) {
          this.scene.remove(mesh);
        }

        mesh = this._meshes[index] = this._createMesh(shape);
      }

      this._scaleMesh(mesh, shape);
    }
  }, {
    key: "_typeMatch",
    value: function _typeMatch(mesh, shape) {
      if (!mesh) {
        return false;
      }

      var geo = mesh.geometry;
      return geo instanceof SphereGeometry && shape instanceof Sphere || geo instanceof BoxGeometry && shape instanceof Box || geo instanceof PlaneGeometry && shape instanceof Plane || geo.id === shape.geometryId && shape instanceof ConvexPolyhedron || geo.id === shape.geometryId && shape instanceof Trimesh || geo.id === shape.geometryId && shape instanceof Heightfield;
    }
  }, {
    key: "_createMesh",
    value: function _createMesh(shape) {
      var mesh;
      var material = this._material;

      switch (shape.type) {
        case Shape.types.SPHERE:
          mesh = new Mesh(this._sphereGeometry, material);
          break;

        case Shape.types.BOX:
          mesh = new Mesh(this._boxGeometry, material);
          break;

        case Shape.types.PLANE:
          mesh = new Mesh(this._planeGeometry, material);
          break;

        case Shape.types.CONVEXPOLYHEDRON:
          // Create mesh
          var geo = new Geometry(); // Add vertices

          for (var i = 0; i < shape.vertices.length; i++) {
            var v = shape.vertices[i];
            geo.vertices.push(new Vector3(v.x, v.y, v.z));
          }

          for (var i = 0; i < shape.faces.length; i++) {
            var face = shape.faces[i]; // add triangles

            var a = face[0];

            for (var j = 1; j < face.length - 1; j++) {
              var b = face[j];
              var c = face[j + 1];
              geo.faces.push(new Face3(a, b, c));
            }
          }

          geo.computeBoundingSphere();
          geo.computeFaceNormals();
          mesh = new Mesh(geo, material);
          shape.geometryId = geo.id;
          break;

        case Shape.types.TRIMESH:
          var geometry = new Geometry();
          var v0 = this.tmpVec0;
          var v1 = this.tmpVec1;
          var v2 = this.tmpVec2;

          for (var i = 0; i < shape.indices.length / 3; i++) {
            shape.getTriangleVertices(i, v0, v1, v2);
            geometry.vertices.push(new Vector3(v0.x, v0.y, v0.z), new Vector3(v1.x, v1.y, v1.z), new Vector3(v2.x, v2.y, v2.z));
            var j = geometry.vertices.length - 3;
            geometry.faces.push(new Face3(j, j + 1, j + 2));
          }

          geometry.computeBoundingSphere();
          geometry.computeFaceNormals();
          mesh = new Mesh(geometry, material);
          shape.geometryId = geometry.id;
          break;

        case Shape.types.HEIGHTFIELD:
          var geometry = new Geometry();
          var v0 = this.tmpVec0;
          var v1 = this.tmpVec1;
          var v2 = this.tmpVec2;

          for (var xi = 0; xi < shape.data.length - 1; xi++) {
            for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
              for (var k = 0; k < 2; k++) {
                shape.getConvexTrianglePillar(xi, yi, k === 0);
                v0.copy(shape.pillarConvex.vertices[0]);
                v1.copy(shape.pillarConvex.vertices[1]);
                v2.copy(shape.pillarConvex.vertices[2]);
                v0.vadd(shape.pillarOffset, v0);
                v1.vadd(shape.pillarOffset, v1);
                v2.vadd(shape.pillarOffset, v2);
                geometry.vertices.push(new Vector3(v0.x, v0.y, v0.z), new Vector3(v1.x, v1.y, v1.z), new Vector3(v2.x, v2.y, v2.z));
                var i = geometry.vertices.length - 3;
                geometry.faces.push(new Face3(i, i + 1, i + 2));
              }
            }
          }

          geometry.computeBoundingSphere();
          geometry.computeFaceNormals();
          mesh = new Mesh(geometry, material);
          shape.geometryId = geometry.id;
          break;
      }

      if (mesh) {
        this.scene.add(mesh);
      }

      return mesh;
    }
  }, {
    key: "_scaleMesh",
    value: function _scaleMesh(mesh, shape) {
      switch (shape.type) {
        case Shape.types.SPHERE:
          var radius = shape.radius;
          mesh.scale.set(radius, radius, radius);
          break;

        case Shape.types.BOX:
          mesh.scale.copy(shape.halfExtents);
          mesh.scale.multiplyScalar(2);
          break;

        case Shape.types.CONVEXPOLYHEDRON:
          mesh.scale.set(1, 1, 1);
          break;

        case Shape.types.TRIMESH:
          mesh.scale.copy(shape.scale);
          break;

        case Shape.types.HEIGHTFIELD:
          mesh.scale.set(1, 1, 1);
          break;
      }
    }
  }]);

  return DebugRenderer;
}();

var instance$8 = null;
/**
 * Handles creation and installation of physical materials within the physics
 * engine.
 */

var MaterialManager = /*#__PURE__*/function () {
  _createClass(MaterialManager, null, [{
    key: "get",
    value: function get() {
      if (!instance$8) {
        instance$8 = new MaterialManager();
      }

      return instance$8;
    }
  }]);

  function MaterialManager() {
    _classCallCheck(this, MaterialManager);

    this.physicalMaterials = new Map();
    this.contactMaterials = new Map();
    this.worlds = new Set();
  }
  /**
   * Registers a physics world to receive updates to materials created by
   * objects within it.
   * @param {CANNON.World} world
   */


  _createClass(MaterialManager, [{
    key: "registerWorld",
    value: function registerWorld(world) {
      this.worlds.add(world);
      this.contactMaterials.forEach(function (material) {
        return world.addContactMaterial(material);
      });
    }
    /**
     * Unregisters a physics world from updates to materials.
     * @param {CANNON.World} world
     */

  }, {
    key: "unregisterWorld",
    value: function unregisterWorld(world) {
      this.worlds["delete"](world);
    }
    /**
     * Creates a new physical material for the given name and options. If the
     * physical material already exists, return the existing one.
     */

  }, {
    key: "createPhysicalMaterial",
    value: function createPhysicalMaterial(name, options) {
      if (!this.physicalMaterials.has(name)) {
        var material = new Material(options);
        this.physicalMaterials.set(name, material);
      }

      return this.physicalMaterials.get(name);
    }
    /**
     * Creates a new contact material between two given names. If the contact
     * material already exists, return the existing one.
     */

  }, {
    key: "createContactMaterial",
    value: function createContactMaterial(name1, name2, options) {
      // TODO: Allow for "pending" contact material if one of the materials has
      // not been created yet.
      var key = this.createContactKey(name1, name2);

      if (!this.contactMaterials.has(key)) {
        var mat1 = this.createPhysicalMaterial(name1);
        var mat2 = this.createPhysicalMaterial(name2);
        var contactMat = new ContactMaterial(mat1, mat2, options);
        this.contactMaterials.set(key, contactMat);
        this.worlds.forEach(function (world) {
          return world.addContactMaterial(contactMat);
        });
      }

      return this.contactMaterials.get(key);
    }
    /**
     * Creates a combined string to use as a key for contact materials.
     */

  }, {
    key: "createContactKey",
    value: function createContactKey(name1, name2) {
      // Alphabetize, then concatenate.
      if (name1 < name2) {
        return "".concat(name1, ",").concat(name2);
      }

      return "".concat(name2, ",").concat(name1);
    }
  }]);

  return MaterialManager;
}();

function _createSuper$a(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$a(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$a() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var MAX_DELTA = 1;
var MAX_SUBSTEPS = 10;
var instance$9 = null;
/**
 * API implementation for Cannon.js, a pure JavaScript physics engine.
 * https://github.com/schteppe/cannon.js
 */

var PhysicsPlugin = /*#__PURE__*/function (_Plugin) {
  _inherits(PhysicsPlugin, _Plugin);

  var _super = _createSuper$a(PhysicsPlugin);

  _createClass(PhysicsPlugin, null, [{
    key: "get",

    /**
     * Enforces singleton physics instance.
     */
    value: function get() {
      if (!instance$9) {
        instance$9 = new PhysicsPlugin();
      }

      return instance$9;
    }
  }]);

  function PhysicsPlugin() {
    var _this;

    _classCallCheck(this, PhysicsPlugin);

    _this = _super.call(this);
    _this.registeredEntities = new Map();
    _this.world = _this.createWorld();
    _this.eraWorld = null;
    _this.lastTime = performance.now();
    _this.debugRenderer = null;
    return _this;
  }
  /** @override */


  _createClass(PhysicsPlugin, [{
    key: "reset",
    value: function reset() {
      this.terminate();
      MaterialManager.get().unregisterWorld(this.world); // TODO: Clean up physics bodies.
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {
      var currTime = performance.now();
      var delta = currTime - this.lastTime;
      this.lastTime = currTime;

      if (delta <= 0) {
        return;
      }

      this.step(delta);
      this.updateEntities(delta);

      if (this.debugRenderer) {
        this.debugRenderer.update();
      }
    }
    /** @override */

  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {
      if (Settings$1.get('physics_debug') && this.debugRenderer) {
        return;
      }

      Settings$1.get('physics_debug') ? this.enableDebugRenderer() : this.disableDebugRenderer();
    }
  }, {
    key: "getWorld",
    value: function getWorld() {
      return this.world;
    }
  }, {
    key: "setEraWorld",
    value: function setEraWorld(eraWorld) {
      this.eraWorld = eraWorld;
      this.handleSettingsChange();
      return this;
    }
  }, {
    key: "getEraWorld",
    value: function getEraWorld() {
      return this.eraWorld;
    }
    /**
     * Steps the physics world.
     * @param {number} delta
     */

  }, {
    key: "step",
    value: function step(delta) {
      delta /= 1000;
      delta = Math.min(MAX_DELTA, delta);
      this.world.step(1 / 60, delta, MAX_SUBSTEPS);
    }
    /**
     * Instantiates the physics world.
     */

  }, {
    key: "createWorld",
    value: function createWorld() {
      var world = new World$1();
      world.gravity.set(0, -9.82, 0);
      MaterialManager.get().registerWorld(world);
      return world;
    }
    /**
     * Iterates through all registered entities and updates them.
     */

  }, {
    key: "updateEntities",
    value: function updateEntities(delta) {
      this.registeredEntities.forEach(function (entity) {
        return entity.update(delta);
      });
    }
    /**
     * Registers an entity to partake in physics simulations.
     * @param {Entity} entity
     */

  }, {
    key: "registerEntity",
    value: function registerEntity(entity) {
      if (!entity || !entity.physicsBody) {
        console.error('Must pass in an entity');
        return false;
      }

      this.registeredEntities.set(entity.uuid, entity);
      entity.registerPhysicsWorld(this);
      this.registerContactHandler(entity);
      this.world.addBody(entity.physicsBody);
      return true;
    }
    /**
     * Unregisters an entity from partaking in physics simulations.
     * @param {Entity} entity
     */

  }, {
    key: "unregisterEntity",
    value: function unregisterEntity(entity) {
      if (!entity || !entity.physicsBody) {
        console.error('Must pass in an entity');
        return false;
      }

      this.registeredEntities["delete"](entity.uuid);
      entity.unregisterPhysicsWorld(this);
      this.world.removeBody(entity.physicsBody);
      return true;
    }
    /**
     * Ends the physics simulation. Is only called client-side.
     */

  }, {
    key: "terminate",
    value: function terminate() {
      clearInterval(this.updateInterval);
      instance$9 = null;
    }
    /**
     * Gets the position of the given entity. Must be implemented by
     * engine-specific implementations.
     * @param {Entity} entity
     * @returns {CANNON.Vec3}
     */

  }, {
    key: "getPosition",
    value: function getPosition(entity) {
      return entity.physicsBody.position;
    }
    /**
     * Gets the rotation of the given entity. Must be implemented by
     * engine-specific implementations.
     * @param {Entity} entity
     * @returns {Object}
     */

  }, {
    key: "getRotation",
    value: function getRotation(entity) {
      return entity.physicsBody.quaternion;
    }
    /**
     * Sets a debug renderer on the physics instance. This should be overriden by
     * each engine-specific implementation for ease of use.
     */

  }, {
    key: "enableDebugRenderer",
    value: function enableDebugRenderer() {
      var scene = this.getEraWorld() ? this.getEraWorld().getScene() : null;
      var world = this.getWorld();

      if (!scene || !world) {
        return console.warn('Debug renderer missing scene or world.');
      }

      this.debugRenderer = new DebugRenderer(scene, world);
      return this.debugRenderer;
    }
    /**
     * Disables the debug renderer on the physics instance.
     */

  }, {
    key: "disableDebugRenderer",
    value: function disableDebugRenderer() {
      if (!this.debugRenderer) {
        return;
      }

      this.debugRenderer.destroy();
      this.debugRenderer = null;
    }
    /**
     * Autogenerates a physics body based on the given mesh.
     * @param {THREE.Object3D} mesh
     * @returns {?} The physics body.
     */

  }, {
    key: "autogeneratePhysicsBody",
    value: function autogeneratePhysicsBody(mesh) {
      console.warn('Autogenerating physics bodies not supported.');
    }
    /**
     * Registers an entity to receive contact events.
     * @param {Entity} entity
     */

  }, {
    key: "registerContactHandler",
    value: function registerContactHandler(entity) {
      entity.physicsBody.addEventListener('collide', function (e) {
        entity.handleCollision(e);
      });
    }
  }]);

  return PhysicsPlugin;
}(Plugin);

function _createSuper$b(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$b(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$b() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var DEFAULT_NAME = 'main';
/**
 * Represents a world used to both manage rendering and physics simulations.
 */

var World = /*#__PURE__*/function (_Plugin) {
  _inherits(World, _Plugin);

  var _super = _createSuper$b(World);

  function World() {
    var _this;

    _classCallCheck(this, World);

    _this = _super.call(this);
    _this.scene = new Scene(); // Set an `isRootScene` bit for use by other parts of ERA.

    _this.scene.isRootScene = true;
    _this.scene.parentWorld = _assertThisInitialized(_this);
    _this.physics = null;
    _this.renderers = new Map();
    _this.cameras = new Map();
    _this.camerasToRenderers = new Map();
    _this.entities = new Set();
    _this.entityCameras = new Map();
    _this.entitiesToRenderers = new Map();
    _this.debugCompassMap = new Map();
    window.addEventListener('resize', _this.onWindowResize.bind(_assertThisInitialized(_this)), false); // A utility for adjusting quality on world entities.

    _this.qualityAdjuster = null;
    return _this;
  }
  /**
   * Enables quality adjustment for the world.
   * @param {QualityAdjuster} qualityAdjuster
   * @return {World}
   */


  _createClass(World, [{
    key: "withQualityAdjustment",
    value: function withQualityAdjustment(qualityAdjuster) {
      qualityAdjuster.setWorld(this);
      this.qualityAdjuster = qualityAdjuster;
      return this;
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {
      var _this2 = this;

      // Update all entities, if physics is not enabled. This is due to physics
      // handling updates on its own.
      // TODO: Separate physics updates from entity updates.
      this.entities.forEach(function (entity) {
        if (!entity.physicsBody) {
          entity.update();
        }
      }); // Update all renderers.

      this.camerasToRenderers.forEach(function (renderer, camera) {
        renderer.render(_this2.scene, camera);

        var compass = _this2.debugCompassMap.get(renderer);

        compass.update(camera);
      }); // Update quality.

      if (this.qualityAdjuster) {
        this.qualityAdjuster.update();
      }
    }
    /** @override */

  }, {
    key: "reset",
    value: function reset() {
      this.entities.forEach(function (entity) {
        return entity.destroy();
      });

      while (this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[0]);
      }
    }
  }, {
    key: "getScene",
    value: function getScene() {
      return this.scene;
    }
  }, {
    key: "getPhysics",
    value: function getPhysics() {
      return this.physics;
    }
    /**
     * Retrieves the camera with the given name.
     * @param {string} name
     */

  }, {
    key: "getCamera",
    value: function getCamera() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_NAME;
      return this.cameras.get(name);
    }
    /**
     * Retrieves a renderer with the given name.
     * @param {string} name
     */

  }, {
    key: "getRenderer",
    value: function getRenderer() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_NAME;
      return this.renderers.get(name);
    }
    /**
     * Iterates over all cameras and resizes them.
     */

  }, {
    key: "onWindowResize",
    value: function onWindowResize() {
      var _this3 = this;

      // Set timeout in order to allow the renderer dom element to resize.
      setTimeout(function () {
        _this3.cameras.forEach(function (camera) {
          var width = window.innerWidth;
          var height = window.innerHeight;

          var renderer = _this3.camerasToRenderers.get(camera);

          if (renderer) {
            var rect = renderer.domElement.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
          }

          camera.userData.resize(width, height);
        });
      });
    }
    /**
     * Adds a physics implementation instance to the world.
     * @return {World}
     */

  }, {
    key: "withPhysics",
    value: function withPhysics() {
      this.physics = new PhysicsPlugin();
      this.physics.setEraWorld(this);
      return this;
    }
    /**
     * Adds a renderer that is used to display the world as well as the name of
     * the renderer. This name is used for finding the element in the DOM to which
     * the renderer should be attached via the data-renderer attribute.
     * @param {THREE.WebGLRenderer} renderer
     * @param {string} name
     * @return {World}
     */

  }, {
    key: "addRenderer",
    value: function addRenderer(renderer) {
      var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_NAME;

      if (!renderer || !name) {
        return console.error('Need both renderer and name for world.');
      }

      var container = document.querySelector("[data-renderer='".concat(name, "']"));

      if (!container) {
        return console.error("Element with data-renderer ".concat(name, " not found."));
      }

      var rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      container.appendChild(renderer.domElement);
      window.addEventListener('resize', function () {
        var rect = container.getBoundingClientRect();
        renderer.setSize(rect.width, rect.height);
      }, false);
      renderer.name = name;
      new RendererStats(renderer);
      var debugCompass = new DebugCompass(renderer);
      this.debugCompassMap.set(renderer, debugCompass);
      this.renderers.set(name, renderer);
      return this;
    }
    /**
     * Adds a camera for a specific renderer. If a renderer isn't specified, add
     * for all renderers.
     * @param {THREE.Camera} camera
     * @param {THREE.WebGLRenderer} renderer
     * @return {World}
     */

  }, {
    key: "addCameraForRenderer",
    value: function addCameraForRenderer(camera, renderer) {
      var _this4 = this;

      if (!camera) {
        return this;
      }

      if (!renderer) {
        this.renderers.forEach(function (renderer) {
          return _this4.addCameraForRenderer(camera, renderer);
        });
        return this;
      }

      if (!renderer.name || !this.renderers.has(renderer.name)) {
        console.error('Passed renderer not created in world');
        return this;
      }

      this.cameras.set(renderer.name, camera);
      this.camerasToRenderers.set(camera, renderer); // Fire a resize event to adjust camera to renderer.

      this.onWindowResize();
      return this;
    }
    /**
     * Sets the environment of the world.
     * @param {Environment} environment
     * @return {World}
     */

  }, {
    key: "setEnvironment",
    value: function setEnvironment(environment) {
      this.add(environment);
      this.renderers.forEach(function (renderer) {
        return renderer.setClearColor(environment.getClearColor());
      });

      if (environment.getFog()) {
        this.scene.fog = environment.getFog();
      }

      return this;
    }
    /**
     * Adds an entity or other ERA object to the world.
     * @param {Entity} entity
     * @return {World}
     * @async
     */

  }, {
    key: "add",
    value: function () {
      var _add = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(entity) {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.entities.has(entity)) {
                  _context.next = 3;
                  break;
                }

                console.warn('Entity already added to the world');
                return _context.abrupt("return", this);

              case 3:
                if (entity.physicsBody) {
                  entity.registerPhysicsWorld(this.physics);
                }

                entity.setWorld(this);
                _context.next = 7;
                return entity.build();

              case 7:
                this.entities.add(entity);
                this.scene.add(entity);

                if (entity.physicsBody) {
                  this.physics.registerEntity(entity);
                }

                entity.onAdd();
                return _context.abrupt("return", this);

              case 12:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function add(_x) {
        return _add.apply(this, arguments);
      }

      return add;
    }()
    /**
     * Removes an entity from the ERA world.
     * @param {Entity} entity
     * @return {World}
     */

  }, {
    key: "remove",
    value: function remove(entity) {
      if (this.physics && entity.physicsEnabled) {
        this.physics.unregisterEntity(entity);
      }

      this.scene.remove(entity);
      this.entities["delete"](entity);

      if (entity.getWorld() == this) {
        entity.setWorld(null);
      }

      entity.onRemove();
      return this;
    }
    /**
     * Enables entity physics within the world. Used for quality adjustment.
     * @param {Entity} entity
     */

  }, {
    key: "enableEntityPhysics",
    value: function enableEntityPhysics(entity) {
      if (this.physics && entity.physicsEnabled && entity.physicsBody) {
        entity.registerPhysicsWorld(this.physics);
        this.physics.registerEntity(entity);
      }
    }
    /**
     * Disables entity physics within the world. Used for quality adjustment.
     * @param {Entity} entity
     */

  }, {
    key: "disableEntityPhysics",
    value: function disableEntityPhysics(entity) {
      if (this.physics && entity.physicsEnabled && entity.physicsBody) {
        this.physics.unregisterEntity(entity);
      }
    }
    /**
     * Request to attach the camera with the given name to the provided entity.
     * @param {Entity} entity
     * @param {string} cameraName
     * @return {World}
     */

  }, {
    key: "attachCameraToEntity",
    value: function attachCameraToEntity(entity) {
      var cameraName = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_NAME;

      if (!entity || !this.cameras.has(cameraName)) {
        console.warn("Camera with name ".concat(cameraName, " does not exist"));
        return this;
      }

      var camera = this.cameras.get(cameraName);
      var prevEntity = this.entityCameras.get(camera);

      if (prevEntity) {
        prevEntity.detachCamera(camera);
      }

      entity.attachCamera(camera);
      this.entityCameras.set(camera, entity);
      return this;
    }
    /**
     * Associates an entity with a renderer for controls purposes, i.e. the
     * direction a camera is facing in a split-screen tile.
     * @param {Entity} entity
     * @param {string} name
     * @return {World}
     */

  }, {
    key: "associateEntityWithRenderer",
    value: function associateEntityWithRenderer(entity) {
      var name = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DEFAULT_NAME;

      if (!entity || !name) {
        console.error('Need to provide entity and name to associate');
        return this;
      }

      if (!this.entities.has(entity) || !this.renderers.has(name)) {
        console.error('Both entity and renderer need to be registered to world');
        return this;
      }

      this.entitiesToRenderers.set(entity, name);
      return this;
    }
    /**
     * Finds the associated camera, aka the camera used by the main "controlling"
     * renderer, for a given entity. Any value returned will be a result of
     * associating a renderer and camera with a given entity in the world.
     * @param {Entity} entity
     * @return {THREE.Camera}
     */

  }, {
    key: "getAssociatedCamera",
    value: function getAssociatedCamera(entity) {
      var name = this.entitiesToRenderers.get(entity);

      if (!name) {
        name = DEFAULT_NAME;
      }

      return this.cameras.get(name);
    }
  }]);

  return World;
}(Plugin);

function _createSuper$c(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$c(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$c() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * Custom event fired when a soft error occurs.
 */

var ErrorEvent = /*#__PURE__*/function (_EraEvent) {
  _inherits(ErrorEvent, _EraEvent);

  var _super = _createSuper$c(ErrorEvent);

  function ErrorEvent(message) {
    _classCallCheck(this, ErrorEvent);

    var label = 'error';
    var data = {
      message: message
    };
    return _super.call(this, label, data);
  }
  /** @override */


  _createClass(ErrorEvent, null, [{
    key: "listen",
    value: function listen(callback) {
      EraEvent.listen('error', callback);
    }
  }]);

  return ErrorEvent;
}(EraEvent);

function _createForOfIteratorHelper$1(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray$1(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$1(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen); }

function _arrayLikeToArray$1(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
/**
 * Core functionality for network procedures in the engine. Can be extended
 * in the case of different servers.
 */

var Network = /*#__PURE__*/function () {
  function Network(protocol, host, port) {
    _classCallCheck(this, Network);

    this.protocol = protocol;
    this.host = host;
    this.port = port;
    this.origin = this.createPath(protocol, host, port);
    this.pendingResponses = new Set();
    this.connectionResolve = null;
    this.socket = null;
    this.token = null;
    this.name = null;
  }
  /**
   * Give the server a name.
   * @param {string} name
   * @returns {Network}
   */


  _createClass(Network, [{
    key: "withName",
    value: function withName(name) {
      this.name = name;
      return this;
    }
    /**
     * Disconnects the network instance.
     */

  }, {
    key: "disconnect",
    value: function disconnect() {
      if (this.socket) {
        this.socket.disconnect();
      }
    }
    /**
     * Creates a path given the protocol, host, and port.
     */

  }, {
    key: "createPath",
    value: function createPath(protocol, host, port) {
      return "".concat(protocol, "://").concat(host, ":").concat(port);
    }
  }, {
    key: "setAuthToken",
    value: function setAuthToken(token) {
      this.token = token;
    }
    /**
     * Creates and sends an HTTP POST request, awaiting for the response.
     * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
     * @param {Object} data
     * @returns {Object}
     * @async
     */

  }, {
    key: "createPostRequest",
    value: function () {
      var _createPostRequest = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(path, data) {
        var url, req, response;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                url = this.origin + path;
                req = this.buildRequest('POST', url);
                _context.next = 4;
                return this.sendRequest(req, data);

              case 4:
                response = _context.sent;
                return _context.abrupt("return", response);

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function createPostRequest(_x, _x2) {
        return _createPostRequest.apply(this, arguments);
      }

      return createPostRequest;
    }()
    /**
     * Creates and sends an HTTP GET request, awaiting for the response.
     * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
     * @returns {Object}
     * @async
     */

  }, {
    key: "createGetRequest",
    value: function () {
      var _createGetRequest = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(path) {
        var url, req, response;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                url = this.origin + path;
                req = this.buildRequest('GET', url);
                _context2.next = 4;
                return this.sendRequest(req);

              case 4:
                response = _context2.sent;
                return _context2.abrupt("return", response);

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function createGetRequest(_x3) {
        return _createGetRequest.apply(this, arguments);
      }

      return createGetRequest;
    }()
    /**
     * Creates and sends an HTTP DELETE request, awaiting for the response.
     * @param {string} path Endpoint path on the server, i.e. /path/to/endpoint.
     * @returns {Object}
     * @async
     */

  }, {
    key: "createDeleteRequest",
    value: function () {
      var _createDeleteRequest = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(path, data) {
        var url, req, response;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                url = this.origin + path;
                req = this.buildRequest('DELETE', url);
                _context3.next = 4;
                return this.sendRequest(req, data);

              case 4:
                response = _context3.sent;
                return _context3.abrupt("return", response);

              case 6:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function createDeleteRequest(_x4, _x5) {
        return _createDeleteRequest.apply(this, arguments);
      }

      return createDeleteRequest;
    }()
    /**
     * Creates an error for a failed or invalid HTTP request.
     */

  }, {
    key: "createError",
    value: function createError(req) {
      var message;

      try {
        message = JSON.parse(req.responseText).message;
      } catch (e) {
        message = req.responseText;
      }

      return new Error(message);
    }
    /**
     * Begins to establish a WebSockets connection to the server. The query
     * parameter is a map of query params used in the connection string.
     * Returns a promise with the resolver set in a field. Once the connection
     * is successful, it resolves.
     */

  }, {
    key: "createSocketConnection",
    value: function () {
      var _createSocketConnection = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(query) {
        var _this = this;

        var required,
            _args4 = arguments;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                required = _args4.length > 1 && _args4[1] !== undefined ? _args4[1] : false;
                return _context4.abrupt("return", new Promise(function (resolve) {
                  if (_this.socket) {
                    return resolve(_this.socket);
                  }

                  _this.connectionResolver = resolve;
                  var params = {
                    reconnection: false
                  };

                  if (!query) {
                    query = new Map();
                  }

                  if (_this.token) {
                    query.set('token', _this.token);
                  }

                  var queryString = '';

                  var _iterator = _createForOfIteratorHelper$1(query),
                      _step;

                  try {
                    for (_iterator.s(); !(_step = _iterator.n()).done;) {
                      var pair = _step.value;
                      var pairString = pair[0] + '=' + pair[1];

                      if (queryString) {
                        pairString = '&' + pairString;
                      }

                      queryString += pairString;
                    }
                  } catch (err) {
                    _iterator.e(err);
                  } finally {
                    _iterator.f();
                  }

                  if (queryString) {
                    params.query = queryString;
                  }

                  _this.socket = io.connect(_this.origin, params);

                  _this.socket.on('connect', function () {
                    return _this.handleConnect(required);
                  });
                }));

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function createSocketConnection(_x6) {
        return _createSocketConnection.apply(this, arguments);
      }

      return createSocketConnection;
    }()
    /**
     * Handles a successful connection to the WebSockets server.
     */

  }, {
    key: "handleConnect",
    value: function handleConnect() {
      this.connectionResolver(this.socket); // TODO: Create base socket endpoints for easier registration of handlers.

      this.socket.on('error', function (err) {
        var message = 'Socket error:' + JSON.stringify(err);
        console.error(message);
        new ErrorEvent(message).fire();
      });
    }
    /**
     * Sends a WS message and waits for a specific reply indicating that the
     * message was received. The key is the socket endpoint, so only one call
     * to a certain endpoint can be awaited at once.
     * @param {string} endpoint The emitted endpoint name.
     * @param {*} sentData The data to emit, if any.
     * @param {string=} responseEndpoint Optional response endpoint name.
     */

  }, {
    key: "emitAndAwaitResponse",
    value: function () {
      var _emitAndAwaitResponse = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(endpoint, sentData, responseEndpoint) {
        var _this2 = this;

        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (this.socket) {
                  _context5.next = 2;
                  break;
                }

                throw new Error('No socket installed.');

              case 2:
                // Default the response endpoint to the emitted endpoint.
                if (!responseEndpoint) {
                  responseEndpoint = endpoint;
                } // Don't install a listener for something twice.


                if (!(this.pendingResponses.has(endpoint) || this.pendingResponses.has(responseEndpoint))) {
                  _context5.next = 5;
                  break;
                }

                throw new Error('Listener already installed.');

              case 5:
                this.pendingResponses.add(endpoint);
                this.pendingResponses.add(responseEndpoint);
                this.socket.removeAllListeners(endpoint);
                this.socket.removeAllListeners(responseEndpoint);
                return _context5.abrupt("return", new Promise(function (resolve, reject) {
                  _this2.socket.once(responseEndpoint, function (data) {
                    resolve(data);
                  });

                  _this2.socket.emit(endpoint, sentData);
                }));

              case 10:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function emitAndAwaitResponse(_x7, _x8, _x9) {
        return _emitAndAwaitResponse.apply(this, arguments);
      }

      return emitAndAwaitResponse;
    }()
    /**
     * Waits for a message to be received, then resolves.
     * @param {string} endpoint
     */

  }, {
    key: "waitForMessage",
    value: function () {
      var _waitForMessage = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee6(endpoint) {
        var _this3 = this;

        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (this.socket) {
                  _context6.next = 2;
                  break;
                }

                throw new Error('No socket installed.');

              case 2:
                if (!this.pendingResponses.has(endpoint)) {
                  _context6.next = 4;
                  break;
                }

                throw new Error('Listener already installed.');

              case 4:
                this.pendingResponses.add(endpoint);
                this.socket.removeAllListeners(endpoint);
                return _context6.abrupt("return", new Promise(function (resolve) {
                  _this3.socket.once(endpoint, function (data) {
                    return resolve(data);
                  });
                }));

              case 7:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function waitForMessage(_x10) {
        return _waitForMessage.apply(this, arguments);
      }

      return waitForMessage;
    }()
    /**
     * Builds a request object given a method and url.
     * @param {string} method
     * @param {string} url
     */

  }, {
    key: "buildRequest",
    value: function buildRequest(method, url) {
      var req = new XMLHttpRequest();
      req.open(method, url, true);
      req.setRequestHeader('Content-type', 'application/json');

      if (this.token) {
        req.setRequestHeader('Authorization', this.token);
      }

      return req;
    }
    /**
     * Sends the request and awaits the response.
     * @param {XMLHttpRequest} req
     * @param {Object=} data
     * @async
     */

  }, {
    key: "sendRequest",
    value: function sendRequest(req) {
      var _this4 = this;

      var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return new Promise(function (resolve, reject) {
        // Install load listener.
        req.addEventListener('load', function () {
          if (req.status == 200 || req.status == 304) {
            var responseStr = req.responseText;

            try {
              var response = JSON.parse(responseStr);
              resolve(response);
            } catch (e) {
              resolve(responseStr);
            }
          } else {
            reject(_this4.createError(req));
          }
        }); // Install error listener.

        req.addEventListener('error', function () {
          return reject(_this4.createError(req));
        }); // Send request.

        if (data) {
          req.send(JSON.stringify(data));
        } else {
          req.send();
        }
      });
    }
  }]);

  return Network;
}();

function _createSuper$d(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$d(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$d() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * A map of all network instances, keyed by their server name. This is useful
 * when a client has to track multiple servers with which it communicates.
 */

var NetworkRegistry = /*#__PURE__*/function (_Map) {
  _inherits(NetworkRegistry, _Map);

  var _super = _createSuper$d(NetworkRegistry);

  function NetworkRegistry() {
    _classCallCheck(this, NetworkRegistry);

    return _super.apply(this, arguments);
  }

  _createClass(NetworkRegistry, [{
    key: "registerNewServer",

    /**
     * Creates a new network instance for a server.
     * @param {string} name
     * @param {string} protocol
     * @param {string} host
     * @param {number} port
     * @returns {Network}
     */
    value: function registerNewServer(name, protocol, host, port) {
      if (this.has(name)) {
        console.warn("Server with name ".concat(name, " already registered."));
        return this.get(name);
      }

      var server = new Network(protocol, host, port).withName(name);
      this.set(name, server);
      return server;
    }
  }]);

  return NetworkRegistry;
}( /*#__PURE__*/_wrapNativeSuper(Map));

var network_registry = new NetworkRegistry();

/**
 * Creates a physics body based on extra data provided from the model, such as
 * userData. This only works for a select number of objects, so please use
 * this carefully.
 */

var Autogenerator = /*#__PURE__*/function () {
  function Autogenerator() {
    _classCallCheck(this, Autogenerator);
  }

  _createClass(Autogenerator, null, [{
    key: "generatePhysicsBody",

    /**
     * @param {THREE.Object3D} subject
     * @returns {CANNON.Body}
     */
    value: function generatePhysicsBody(subject) {
      var _this = this;

      // Root body.
      var body = new Body({
        mass: 0
      });
      subject.traverse(function (child) {
        var physicsType = child.userData.physics;

        if (!physicsType) {
          return;
        }

        switch (physicsType) {
          case 'BOX':
            _this.autogenerateBox(body, child);

            break;
        }
      });
      return body;
    }
    /**
     * Generates a box shape and attaches it to the root body.
     * @param {CANNON.Body} body
     * @param {THREE.Object3D} subject
     */

  }, {
    key: "autogenerateBox",
    value: function autogenerateBox(body, subject) {
      var boundingBox = subject.geometry.boundingBox;
      var size = new Vector3();
      boundingBox.getSize(size);
      size.divideScalar(2);
      size = size.multiplyVectors(size, subject.scale);
      var shape = new Box(new Vec3().copy(size));
      var position = new Vec3().copy(subject.position);
      var quaternion = new Quaternion().copy(subject.quaternion);
      body.addShape(shape, position, quaternion);
    }
  }]);

  return Autogenerator;
}();

function _createSuper$e(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$e(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$e() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var ENTITY_BINDINGS = {
  BACKWARD: {
    keys: {
      keyboard: 83,
      controller: '+axes1'
    }
  },
  FORWARD: {
    keys: {
      keyboard: 87,
      controller: '-axes1'
    }
  },
  LEFT: {
    keys: {
      keyboard: 65,
      controller: '-axes0'
    }
  },
  RIGHT: {
    keys: {
      keyboard: 68,
      controller: '+axes0'
    }
  }
};
var CONTROLS_ID = 'Entity';
/**
 * Super class for all entities within the game, mostly those
 * that are updated by the physics engine.
 */

var Entity = /*#__PURE__*/function (_Object3DEventTarget) {
  _inherits(Entity, _Object3DEventTarget);

  var _super = _createSuper$e(Entity);

  _createClass(Entity, null, [{
    key: "GetBindings",
    value: function GetBindings() {
      return new Bindings(CONTROLS_ID).load(ENTITY_BINDINGS);
    }
  }]);

  function Entity() {
    var _this;

    _classCallCheck(this, Entity);

    _this = _super.call(this);
    _this.uuid = createUUID();
    _this.world = null;
    _this.built = false;
    _this.modelName = null;
    _this.mesh = null;
    _this.cameraArm = null;
    _this.registeredCameras = new Set();
    _this.meshEnabled = true;
    _this.qualityAdjustEnabled = true; // Physics properties.

    _this.physicsBody = null;
    _this.physicsEnabled = true;
    _this.physicsWorld = null;
    _this.autogeneratePhysics = false;
    _this.meshRotationLocked = false; // Animation properties.

    _this.animationMixer = null;
    _this.animationClips = null;
    _this.currentAction = null; // Controls properties.

    _this.actions = new Map(); // Map of action -> value (0 - 1)

    _this.bindings = Controls.get().getBindings(_this.getControlsId());
    _this.inputDevice = 'keyboard';
    _this.playerNumber = null;
    _this.lastMouseMovement = new Vector2();
    _this.mouseMovement = new Vector2();
    _this.inputVector = new Vector3();
    _this.cameraQuaternion = new Quaternion$1();
    _this.cameraEuler = new Euler();
    _this.cameraEuler.order = 'YXZ';
    SettingsEvent.listen(_this.handleSettingsChange.bind(_assertThisInitialized(_this)));
    return _this;
  }
  /**
   * Enables physics generation.
   */


  _createClass(Entity, [{
    key: "withPhysics",
    value: function withPhysics() {
      this.physicsEnabled = true;
      return this;
    }
    /**
     * Provides the Entity with the ERA world to which it belongs.
     * @param {World} world
     */

  }, {
    key: "setWorld",
    value: function setWorld(world) {
      this.world = world;
    }
    /**
     * Returns the ERA world to which the Entity belongs.
     * @return {World}
     */

  }, {
    key: "getWorld",
    value: function getWorld() {
      return this.world;
    }
    /**
     * Callback that's fired when an entity is added to a world.
     */

  }, {
    key: "onAdd",
    value: function onAdd() {}
    /**
     * Callback that's fired when an entity is removed from a world.
     */

  }, {
    key: "onRemove",
    value: function onRemove() {}
    /**
     * Sets the entity to be attached to a certain local player, used explicitly
     * for split-screen/local co-op experiences.
     * @param {number} playerNumber
     */

  }, {
    key: "setPlayerNumber",
    value: function setPlayerNumber(playerNumber) {
      this.playerNumber = playerNumber;
      return this;
    }
  }, {
    key: "getPlayerNumber",
    value: function getPlayerNumber() {
      return this.playerNumber;
    }
    /**
     * Returns the static controls ID for the entity. Needs to be defined for
     * each entity with unique controls.
     */

  }, {
    key: "getControlsId",
    value: function getControlsId() {
      return CONTROLS_ID;
    }
    /**
     * Returns the default set of bindings for the entity.
     * @returns {Bindings}
     */

  }, {
    key: "getDefaultBindings",
    value: function getDefaultBindings() {
      return this.constructor.GetBindings();
    }
    /**
     * @param {THREE.Vector3|CANNON.Vec3} position
     * @return {Entity}
     */

  }, {
    key: "setPosition",
    value: function setPosition(position) {
      if (this.physicsEnabled && this.physicsBody) {
        this.physicsBody.position.copy(position);
      } else {
        this.position.copy(position);
      }
    }
    /**
     * Creates the mesh and physics object.
     */

  }, {
    key: "build",
    value: function () {
      var _build = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.built) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", this);

              case 2:
                _context.next = 4;
                return this.generateMesh();

              case 4:
                this.mesh = _context.sent;

                if (this.mesh) {
                  this.add(this.mesh);
                  this.animationMixer = Animation.get().createAnimationMixer(this.modelName, this);
                  this.animationClips = Animation.get().getClips(this.modelName);

                  if (Settings$1.get('shadows')) {
                    this.enableShadows();
                  }
                }

                this.cameraArm = this.createCameraArm();
                this.physicsBody = this.generatePhysicsBody();
                this.built = true;
                return _context.abrupt("return", this);

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function build() {
        return _build.apply(this, arguments);
      }

      return build;
    }()
    /**
     * Destroys the entity by unregistering from all core components and disposing
     * of all objects in memory.
     */

  }, {
    key: "destroy",
    value: function destroy() {
      var world = getRootWorld(this);

      if (!world) {
        return console.warn('Destroyed entity has no root world');
      }

      world.remove(this);
    }
    /**
     * Registers a physics instance to the entity. This is used for communicating
     * with the physics engine.
     * @param {Physics} physics
     */

  }, {
    key: "registerPhysicsWorld",
    value: function registerPhysicsWorld(physics) {
      this.physicsWorld = physics;
    }
    /**
     * Unregisters a physics instance from the entity.
     * @param {Physics} physics
     */

  }, {
    key: "unregisterPhysicsWorld",
    value: function unregisterPhysicsWorld(physics) {
      if (this.physicsWorld && this.physicsWorld.uuid == physics.uuid) {
        this.physicsWorld = null;
      }
    }
    /**
     * Creates the mesh for the entity, using the entity name provided.
     */

  }, {
    key: "generateMesh",
    value: function () {
      var _generateMesh = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2() {
        var scene;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.meshEnabled) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                if (this.modelName) {
                  _context2.next = 4;
                  break;
                }

                return _context2.abrupt("return", console.warn('Model name not provided'));

              case 4:
                scene = Models.get().createModel(this.modelName);
                return _context2.abrupt("return", scene);

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function generateMesh() {
        return _generateMesh.apply(this, arguments);
      }

      return generateMesh;
    }()
    /**
     * Creates a camera arm for the entity. All cameras will be automatically
     * added to this arm by default.
     */

  }, {
    key: "createCameraArm",
    value: function createCameraArm() {
      var obj = new Object3D();
      this.add(obj);
      return obj;
    }
    /**
     * Attaches a camera to the entity. It can be assumed that the camera has been
     * properly detached from other entities and is ready for spatial mutations.
     * @param {THREE.Camera} camera
     */

  }, {
    key: "attachCamera",
    value: function attachCamera(camera) {
      if (this.registeredCameras.has(camera)) {
        return console.warn('Camera already registered on entity');
      }

      this.registeredCameras.add(camera);
      this.positionCamera(camera);
    }
    /**
     * Positions the camera when attaching. This should be overriden by custom
     * entities, not the attachCamera function.
     * @param {THREE.Camera} camera
     */

  }, {
    key: "positionCamera",
    value: function positionCamera(camera) {
      this.cameraArm.add(camera);
      camera.position.set(0, 0, 0);
      camera.rotation.set(0, 0, 0);
    }
    /**
     * Detaches a camera from the entity.
     * @param {THREE.Camera} camera
     */

  }, {
    key: "detachCamera",
    value: function detachCamera(camera) {
      if (!this.registeredCameras.has(camera)) {
        return console.warn('Camera not registered on entity');
      }

      camera.parent.remove(camera);
      this.registeredCameras["delete"](camera);
    }
    /**
     * Creates the physics object for the entity. This should be defined by each
     * entity.
     * @return {CANNON.Body}
     */

  }, {
    key: "generatePhysicsBody",
    value: function generatePhysicsBody() {
      if (!this.physicsEnabled) {
        return null;
      }

      if (this.autogeneratePhysics) {
        return Autogenerator.generatePhysicsBody(this.mesh);
      }

      return null;
    }
    /**
     * Handles a collision for the entity.
     * @param {?} e
     */

  }, {
    key: "handleCollision",
    value: function handleCollision(e) {}
    /**
     * Serializes the physics aspect of the entity.
     */

  }, {
    key: "serializePhysics",
    value: function serializePhysics() {
      var body = this.physicsBody;
      if (!body) return null;
      var precision = 4; // TODO: make this engine-agnostic.

      return [[body.angularVelocity.toFixed(precision)], body.interpolatedPosition.map(function (x) {
        return x.toFixed(precision);
      }), body.velocity.map(function (x) {
        return x.toFixed(precision);
      }), [body.angle.toFixed(precision)]];
    }
  }, {
    key: "getMesh",
    value: function getMesh() {
      return this.mesh;
    }
    /**
     * Clears all input registered to the entity. This is used in
     * the case controller input is removed from the entity.
     */

  }, {
    key: "clearInput",
    value: function clearInput() {
      this.actions.clear();
      this.mouseMovement.set(0, 0);
      this.lastMouseMovement.set(0, 0);
    }
    /**
     * Sets an action to the specified value for the entity
     */

  }, {
    key: "setAction",
    value: function setAction(action, value) {
      if (this.actions.has(action.getName()) && this.actions.get(action.getName()) === value) {
        return;
      }

      if (value !== 0) {
        this.actions.set(action.getName(), value);
      } else {
        this.actions["delete"](action.getName());
      }
    }
    /**
     * Check the force a registered action is pressed with.
     * @param {string} binding
     * @returns {number}
     */

  }, {
    key: "getActionValue",
    value: function getActionValue(actionName) {
      return this.actions.get(actionName) || 0;
    }
    /**
     * Gets the last mouse movement registered. Does not directly read from mouse
     * movement in order to better handle clearing.
     */

  }, {
    key: "getMouseMovement",
    value: function getMouseMovement() {
      return this.lastMouseMovement;
    }
    /**
     * Sets the mouse movement vector for the entity.
     */

  }, {
    key: "setMouseMovement",
    value: function setMouseMovement(x, y) {
      this.mouseMovement.x += x;
      this.mouseMovement.y += y;
    }
    /**
     * Takes in data passed from the client to the server as input.
     */

  }, {
    key: "setInputFromData",
    value: function setInputFromData(data) {
      this.mouseMovement = data.mouseMovement;
      this.cameraRotation = data.cameraRotation;
      this.actions = data.actions ? data.actions : {};
      this.inputDevice = data.inputDevice;
    }
    /**
     * Called every step of the physics engine to keep the mesh and physics object
     * synchronized.
     */

  }, {
    key: "update",
    value: function update() {
      this.lastMouseMovement.copy(this.mouseMovement);
      this.mouseMovement.set(0, 0);

      if (this.bindings) {
        this.calculateInputVector();
      }

      if (!this.mesh || !this.physicsBody || !this.physicsWorld) {
        return;
      }

      var position = this.physicsWorld.getPosition(this);
      var rotation = this.physicsWorld.getRotation(this);

      if (position.x != null) {
        this.position.x = position.x;
      }

      if (position.y != null) {
        this.position.y = position.y;
      }

      if (position.z != null) {
        this.position.z = position.z;
      }

      if (rotation.w != null && !this.meshRotationLocked) {
        this.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }
    }
    /**
     * Calculates the input vector of the entity.
     */

  }, {
    key: "calculateInputVector",
    value: function calculateInputVector() {
      var inputVector = this.inputVector;
      inputVector.set(0, 0, 0);

      if (this.getActionValue(this.bindings.FORWARD)) {
        inputVector.z -= this.getActionValue(this.bindings.FORWARD);
      }

      if (this.getActionValue(this.bindings.BACKWARD)) {
        inputVector.z += this.getActionValue(this.bindings.BACKWARD);
      }

      if (this.getActionValue(this.bindings.LEFT)) {
        inputVector.x -= this.getActionValue(this.bindings.LEFT);
      }

      if (this.getActionValue(this.bindings.RIGHT)) {
        inputVector.x += this.getActionValue(this.bindings.RIGHT);
      } // Update input vector with camera direction.


      var camera = this.getWorld() ? this.getWorld().getAssociatedCamera(this) : null;

      if (camera) {
        camera.getWorldQuaternion(this.cameraQuaternion);
        this.cameraEuler.setFromQuaternion(this.cameraQuaternion); // We only care about the X and Z axis, so remove the angle looking down
        // on the character.

        this.cameraEuler.x = 0;
        this.cameraQuaternion.setFromEuler(this.cameraEuler);
      }

      inputVector.applyQuaternion(this.cameraQuaternion);
      inputVector.normalize();
    }
    /**
     * Updates the entity based on data sent from the server.
     */

  }, {
    key: "consumeUpdate",
    value: function consumeUpdate(physics) {
      if (!physics) return; // TODO: make this engine-agnostic.

      var _physics = _slicedToArray(physics, 4),
          angVelo = _physics[0],
          pos = _physics[1],
          velo = _physics[2],
          rot = _physics[3];

      this.physicsBody.angularVelocity = angVelo;
      this.physicsBody.angle = rot;
      this.physicsBody.position.copy(pos);
      this.physicsBody.velocity.copy(velo);
    }
    /**
     * Registers the entity to the physics engine.
     */

  }, {
    key: "registerToPhysics",
    value: function registerToPhysics() {
      PhysicsPlugin.get().registerEntity(this);
    }
    /**
     * Registers a component of an entity to the physics engine. This
     * is primarily used if there is a body separate from the entity's
     * main physics body.
     */

  }, {
    key: "registerComponent",
    value: function registerComponent(body) {
      PhysicsPlugin.get().registerComponent(body);
    }
    /**
     * Finds an animation clip by name.
     * @param {string} name
     * @returns {THREE.AnimationClip}
     */

  }, {
    key: "getAnimationClip",
    value: function getAnimationClip(name) {
      if (!name || !this.animationClips) {
        return null;
      }

      return AnimationClip.findByName(this.animationClips, name);
    }
    /**
     * Plays an animation given a name.
     * @param {string} name
     * @returns {THREE.AnimationAction}
     */

  }, {
    key: "playAnimation",
    value: function playAnimation(name) {
      if (!name) {
        return null;
      }

      var clip = this.getAnimationClip(name);

      if (!clip) {
        return null;
      }

      var action = this.animationMixer.clipAction(clip);
      action.reset();

      if (this.currentAction) {
        action.crossFadeFrom(this.currentAction, 0.2, true);
      }

      action.play();
      this.currentAction = action;
      return action;
    }
    /**
     * Stops all animations on the entity.
     */

  }, {
    key: "stopAllAnimation",
    value: function stopAllAnimation() {
      this.animationMixer.stopAllAction();
      this.currentAction = null;
    }
    /**
     * Enables shadows to be cast and received by the entity.
     */

  }, {
    key: "enableShadows",
    value: function enableShadows() {
      this.traverse(function (child) {
        child.castShadow = true;
        child.receiveShadow = true;
      });
    }
    /**
     * Disabled shadows from being cast and received by the entity.
     */

  }, {
    key: "disableShadows",
    value: function disableShadows() {
      this.traverse(function (child) {
        child.castShadow = false;
        child.receiveShadow = false;
      });
    }
    /**
     * Handles a settings change event.
     */

  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {}
  }]);

  return Entity;
}(Object3DEventTarget);

function _createSuper$f(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$f(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$f() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var CHARACTER_BINDINGS = {
  SPRINT: {
    keys: {
      keyboard: 16,
      controller: 'button10'
    }
  },
  JUMP: {
    keys: {
      keyboard: 32,
      controller: 'button0'
    }
  },
  LOOK_X: {
    keys: {
      controller: 'axes2'
    }
  },
  LOOK_Y: {
    keys: {
      controller: 'axes3'
    }
  }
};
var RAYCAST_GEO = new BoxGeometry(0.2, 0.2, 0.2);
var RAYCAST_MATERIAL = new MeshLambertMaterial({
  color: 0xff0000
});
var RAYCAST_BLUE_MATERIAL = new MeshLambertMaterial({
  color: 0x0000ff
});
var CONTROLS_ID$1 = 'Character'; // Default character properties.

var DEFAULT_CAPSULE_OFFSET = 0.2;
var DEFAULT_CAPSULE_RADIUS = 0.25;
var DEFAULT_HEIGHT = 1.8;
var DEFAULT_LERP_FACTOR = 0.5;
var DEFAULT_MASS = 1;
var DEFAULT_FALL_THRESHOLD = 700;
var DEFAULT_JUMP_MIN = 500;
var DEFAULT_LAND_MIX_THRESHOLD = 150;
var DEFAULT_LAND_SPEED_THRESHOLD = 5;
var DEFAULT_LAND_TIME_THRESHOLD = 1500;
var DEFAULT_VELO_LERP_FACTOR = 0.15;
/**
 * A special entity used for controlling an organic character, such as a human.
 * This is different from a standard entity in its physics and animation
 * behavior. Note: This is designed exclusively for Cannon.js.
 */

var Character = /*#__PURE__*/function (_Entity) {
  _inherits(Character, _Entity);

  var _super = _createSuper$f(Character);

  function Character() {
    var _this;

    _classCallCheck(this, Character);

    _this = _super.call(this);
    _this.qualityAdjustEnabled = false; // Make all defaults overrideable by subclasses.
    // Height of the character.

    _this.height = DEFAULT_HEIGHT; // Offset used for smoother movement. Increase for larger vertical motion.

    _this.capsuleOffset = DEFAULT_CAPSULE_OFFSET; // Radius of the character's physics capsule.

    _this.capsuleRadius = DEFAULT_CAPSULE_RADIUS; // Amount of time in ms that the fall animation requires to trigger.

    _this.fallThreshold = DEFAULT_FALL_THRESHOLD; // The interpolation factor for character raycasting adjustments.

    _this.lerpFactor = DEFAULT_LERP_FACTOR; // The interpolation factor for character movement.

    _this.velocityLerpFactor = DEFAULT_VELO_LERP_FACTOR; // The mass of the character.

    _this.mass = DEFAULT_MASS; // Amount of time in ms required to cancel a jump animation.

    _this.jumpMin = DEFAULT_JUMP_MIN; // Time in ms before the end of the landing animation that the next
    // animation can start.

    _this.landMixThreshold = DEFAULT_LAND_MIX_THRESHOLD; // The speed at which a landing animation will be cancelled.

    _this.landSpeedThreshold = DEFAULT_LAND_SPEED_THRESHOLD; // The amount of time falling in ms that a character needs to endure before
    // triggering a landing action.

    _this.landTimeThreshold = DEFAULT_LAND_TIME_THRESHOLD; // TODO: Bundle animation names with states.

    _this.idleAnimationName = null;
    _this.walkingAnimationName = null;
    _this.sprintingAnimationName = null;
    _this.jumpingAnimationName = null;
    _this.fallingAnimationName = null;
    _this.landingAnimationName = null;
    _this.jumpAction = null;
    _this.landAction = null; // TODO: Make state a common practice in ERA.

    _this.state = 'idle';
    _this.grounded = false;
    _this.frozen = false;
    _this.lastGroundedTime = 0;
    _this.jumpTime = 0;
    _this.wasFalling = false;
    _this.previouslyGrounded = true;
    _this.unfreezeTimeout = null;
    _this.landingDummy = new Vector2(); // Raycasting properties.

    _this.startVec = new Vec3();
    _this.endVec = new Vec3();
    _this.ray = new Ray(_this.startVec, _this.endVec);
    _this.ray.skipBackfaces = true;
    _this.ray.mode = Ray.CLOSEST;
    _this.ray.collisionFilterMask = ~2;
    _this.rayStartBox = new Mesh(RAYCAST_GEO, RAYCAST_BLUE_MATERIAL);
    _this.rayEndBox = new Mesh(RAYCAST_GEO, RAYCAST_MATERIAL); // Input properties.

    _this.targetQuaternion = new Quaternion();
    _this.lerpedVelocity = new Vector3();
    _this.targetVelocity = new Vector3();
    return _this;
  }
  /** @override */


  _createClass(Character, [{
    key: "getControlsId",

    /** @override */
    value: function getControlsId() {
      return CONTROLS_ID$1;
    }
    /** @override */

  }, {
    key: "generatePhysicsBody",
    value: function generatePhysicsBody() {
      var capsule = new Body({
        mass: this.mass
      }); // TODO: Remove this collison filter group and make it more explicit to the
      // user.

      capsule.collisionFilterGroup = 2; // Create center portion of capsule.

      var height = this.height - this.capsuleRadius * 2 - this.capsuleOffset;
      var cylinderShape = new Cylinder(this.capsuleRadius, this.capsuleRadius, height, 20);
      var quat = new Quaternion();
      var cylinderPos = height / 2 + this.capsuleRadius + this.capsuleOffset;
      capsule.addShape(cylinderShape, new Vec3(0, cylinderPos, 0), quat); // Create round ends of capsule.

      var sphereShape = new Sphere(this.capsuleRadius);
      var topPos = new Vec3(0, height + this.capsuleRadius + this.capsuleOffset, 0);
      var bottomPos = new Vec3(0, this.capsuleRadius + this.capsuleOffset, 0);
      capsule.addShape(sphereShape, topPos);
      capsule.addShape(sphereShape, bottomPos); // Prevent capsule from tipping over.

      capsule.fixedRotation = true;
      capsule.updateMassProperties();
      capsule.material = MaterialManager.get().createPhysicalMaterial('character', {
        friction: 0
      });
      MaterialManager.get().createContactMaterial('character', 'ground', {
        friction: 0,
        contactEquationStiffness: 1e8
      }); // Raycast debug.

      this.toggleRaycastDebug();
      return capsule;
    }
    /** @override */

  }, {
    key: "build",
    value: function () {
      var _build = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _get(_getPrototypeOf(Character.prototype), "build", this).call(this);

              case 2:
                this.playAnimation(this.idleAnimationName);
                return _context.abrupt("return", this);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function build() {
        return _build.apply(this, arguments);
      }

      return build;
    }()
    /** @override */

  }, {
    key: "positionCamera",
    value: function positionCamera(camera) {
      this.cameraArm.add(camera);
      camera.position.x = 5;
      this.cameraArm.rotation.z = Math.PI / 6;
      this.cameraArm.rotation.y = Math.PI / 2;
      camera.lookAt(this.position); // TODO: Fix this junk.

      Promise.resolve().then(function () {
        return camera.position.y = 1.2;
      });
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {
      _get(_getPrototypeOf(Character.prototype), "update", this).call(this);

      this.updateRaycast();
      this.updateAnimations();
      this.updatePhysics();
    }
    /** @override */

  }, {
    key: "handleSettingsChange",
    value: function handleSettingsChange() {
      this.toggleRaycastDebug();
    }
    /**
     * Raycast to the ground.
     */

  }, {
    key: "updateRaycast",
    value: function updateRaycast() {
      if (!this.physicsWorld) {
        return;
      } // Set up ray targets. Make the origin vector around mid-level.


      this.ray.from.copy(this.physicsBody.interpolatedPosition);
      this.ray.to.copy(this.ray.from);
      this.ray.from.y += this.capsuleOffset + this.height / 2;
      this.rayStartBox.position.copy(this.ray.from);
      this.rayEndBox.position.copy(this.ray.to); // Intersect against the world.

      this.ray.result.reset();
      this.ray.intersectBodies(this.physicsWorld.getWorld().bodies, this.ray.result);

      if (this.ray.result.hasHit) {
        var hitDistance = this.ray.result.distance;
        var diff = this.capsuleOffset + this.height / 2 - hitDistance;
        this.rayEndBox.position.y = this.rayStartBox.position.y - hitDistance;
        this.rayEndBox.material.color.setHex(0xff8800); // Lerp new position.

        var newY = this.physicsBody.position.y + diff;
        var lerpedY = lerp(this.physicsBody.position.y, newY, this.lerpFactor);
        this.physicsBody.position.y = lerpedY;
        this.physicsBody.interpolatedPosition.y = lerpedY;
        this.physicsBody.velocity.y = 0;
        this.grounded = true;
      } else {
        this.grounded = false;
        this.rayEndBox.material.color.setHex(0xff0000);
      }
    }
    /**
     * Updates the animation state of the character.
     */

  }, {
    key: "updateAnimations",
    value: function updateAnimations() {
      if (this.frozen) {
        this.idle();
        return;
      } // Handle grounded/landing state.


      if (!this.grounded) {
        this.previouslyGrounded = false;
        return this.fall();
      } else {
        if (!this.previouslyGrounded && this.wasFalling) {
          this.land();
        }

        this.wasFalling = false;
        this.lastGroundedTime = performance.now();
        this.previouslyGrounded = true;
      }

      if (this.getActionValue(this.bindings.JUMP)) {
        return this.jump();
      }

      if (this.getActionValue(this.bindings.FORWARD) || this.getActionValue(this.bindings.BACKWARD) || this.getActionValue(this.bindings.LEFT) || this.getActionValue(this.bindings.RIGHT)) {
        if (this.getActionValue(this.bindings.SPRINT)) {
          this.sprint();
        } else {
          this.walk();
        }
      } else {
        this.idle();
      }
    }
    /**
     * Updates the physics state of the character.
     */

  }, {
    key: "updatePhysics",
    value: function updatePhysics() {
      // Update physics.
      if (this.frozen) {
        return;
      }

      if (this.grounded) {
        this.targetVelocity.x = this.inputVector.x * 2.5;
        this.targetVelocity.z = this.inputVector.z * 2.5;

        if (this.getActionValue(this.bindings.SPRINT)) {
          this.targetVelocity.x *= 2.5;
          this.targetVelocity.z *= 2.5;
        }

        this.lerpedVelocity.copy(this.physicsBody.velocity);
        this.targetVelocity.y = this.physicsBody.velocity.y;
        this.lerpedVelocity.lerp(this.targetVelocity, this.velocityLerpFactor);
        this.physicsBody.velocity.copy(this.lerpedVelocity);
      } // Update body rotation.


      if (this.inputVector.x || this.inputVector.z) {
        var angle = vectorToAngle(this.inputVector.z, this.inputVector.x);
        this.targetQuaternion.setFromAxisAngle(Vec3.UNIT_Y, angle);
        this.updateRotation();
      }
    }
    /**
     * Updates the rotation of the character.
     */

  }, {
    key: "updateRotation",
    value: function updateRotation() {
      this.physicsBody.quaternion.slerp(this.targetQuaternion, 0.1, this.physicsBody.quaternion);
    }
    /**
     * Checks settings to see if raycast debug should be used.
     */

  }, {
    key: "toggleRaycastDebug",
    value: function toggleRaycastDebug() {
      var world = this.getWorld();

      if (!world) {
        return console.warn('World not set on character');
      }

      if (Settings$1.get('physics_debug')) {
        var scene = world.getScene();
        scene.add(this.rayStartBox);
        scene.add(this.rayEndBox);
      } else {
        var _scene = world.getScene();

        _scene.remove(this.rayStartBox);

        _scene.remove(this.rayEndBox);
      }
    }
    /**
     * Freezes the character, preventing it from updating.
     */

  }, {
    key: "freeze",
    value: function freeze() {
      clearTimeout(this.unfreezeTimeout);
      this.frozen = true;
    }
    /**
     * Unfreezes the character, allowing updates.
     */

  }, {
    key: "unfreeze",
    value: function unfreeze() {
      this.frozen = false;
    }
    /**
     * Sets the character in the idle state.
     */

  }, {
    key: "idle",
    value: function idle() {
      if (this.state == 'idle') {
        return;
      }

      if (this.isJumpCooldown()) {
        return;
      }

      if (this.isLandPlaying()) {
        return;
      }

      this.state = 'idle';
      this.playAnimation(this.idleAnimationName);
    }
    /**
     * Marks the character in a walking state.
     */

  }, {
    key: "walk",
    value: function walk() {
      if (this.state == 'walking') {
        return;
      }

      if (this.isJumpCooldown()) {
        return;
      }

      if (this.isLandPlaying()) {
        return;
      }

      this.state = 'walking';
      this.playAnimation(this.walkingAnimationName);
    }
    /**
     * Marks the character in a sprint state.
     */

  }, {
    key: "sprint",
    value: function sprint() {
      if (this.state == 'sprinting') {
        return;
      }

      if (this.isJumpCooldown()) {
        return;
      }

      if (this.isLandPlaying()) {
        return;
      }

      this.state = 'sprinting';
      this.playAnimation(this.sprintingAnimationName);
    }
    /**
     * Marks the character in a jump state.
     */

  }, {
    key: "jump",
    value: function jump() {
      if (this.state == 'jumping') {
        return;
      }

      this.state = 'jumping';
      this.jumpTime = performance.now();
      this.jumpAction = this.playAnimation(this.jumpingAnimationName);

      if (!this.jumpAction) {
        return;
      }

      this.jumpAction.loop = LoopOnce;
      this.jumpAction.clampWhenFinished = true;
      return true;
    }
    /**
     * Marks the character in a falling state.
     */

  }, {
    key: "fall",
    value: function fall() {
      if (this.state == 'falling') {
        return;
      }

      if (performance.now() - this.lastGroundedTime < this.fallThreshold) {
        return;
      }

      if (this.jumpAction && this.jumpAction.isRunning()) {
        return;
      }

      this.wasFalling = true;
      this.state = 'falling';
      this.playAnimation(this.fallingAnimationName);
    }
    /**
     * Plays landing animation.
     */

  }, {
    key: "land",
    value: function land() {
      var diff = performance.now() - this.lastGroundedTime;

      if (diff < this.landTimeThreshold) {
        return;
      }

      this.landingDummy.set(this.physicsBody.velocity.x, this.physicsBody.velocity.z); // TODO: We should have a cooler running landing animation like a roll or
      //       stumble.

      if (this.landingDummy.length() > this.landSpeedThreshold) {
        return;
      }

      this.landAction = this.playAnimation(this.landingAnimationName);

      if (!this.landAction) {
        return;
      }

      this.landAction.loop = LoopOnce;
      this.physicsBody.velocity.x = 0;
      this.physicsBody.velocity.z = 0;
      this.tempFreeze(1000 * this.landAction.getClip().duration - this.landMixThreshold);
    }
    /**
     * Checks if the landing animation is still playing.
     */

  }, {
    key: "isLandPlaying",
    value: function isLandPlaying() {
      if (!this.landAction) {
        return false;
      }

      var landDiff = this.landAction.getClip().duration - this.landAction.time;
      return landDiff * 1000 > this.landMixThreshold;
    }
    /**
     * Returns if the jump animation cooldown is still in effect.
     * @return {boolean}
     */

  }, {
    key: "isJumpCooldown",
    value: function isJumpCooldown() {
      return performance.now() - this.jumpTime < this.jumpMin;
    }
    /**
     * Temporarily freezes the character.
     * @param {number} time
     */

  }, {
    key: "tempFreeze",
    value: function tempFreeze(time) {
      var _this2 = this;

      this.freeze();
      this.unfreezeTimeout = setTimeout(function () {
        return _this2.unfreeze();
      }, time);
    }
  }], [{
    key: "GetBindings",
    value: function GetBindings() {
      return new Bindings(CONTROLS_ID$1).load(CHARACTER_BINDINGS).merge(Entity.GetBindings());
    }
  }]);

  return Character;
}(Entity);

Controls.get().registerBindings(Character);

function _createSuper$g(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$g(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$g() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var WIDTH$1 = 500;
var SUFFIXES = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];
/**
 * Wrapper class for a cube geometry, representing a skybox.
 */

var Skybox = /*#__PURE__*/function (_THREE$Object3D) {
  _inherits(Skybox, _THREE$Object3D);

  var _super = _createSuper$g(Skybox);

  function Skybox() {
    var _this;

    var width = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : WIDTH$1;

    _classCallCheck(this, Skybox);

    _this = _super.call(this);
    _this.cube = null;
    _this.width = width;
    return _this;
  }
  /**
   * Loads the skybox with a given texture. Requires that the
   * @param {string} directory
   * @param {string} filename
   * @param {string} extension
   * @async
   */


  _createClass(Skybox, [{
    key: "load",
    value: function () {
      var _load = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(directory, filename, extension) {
        var cubeMaterials, geometry, cube;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(!directory || !filename || !extension)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", console.warn('Not all params present for skybox load'));

              case 2:
                // Append a trailing slash to the directory if it doesn't exist.
                if (!directory.endsWith('/')) {
                  directory += '/';
                } // Insert a period if the extension doesn't have one.


                if (!extension.startsWith('.')) {
                  extension = '.' + extension;
                } // Load each texture for the cube.


                _context.next = 6;
                return this.createCubeMaterials(directory, filename, extension);

              case 6:
                cubeMaterials = _context.sent;
                geometry = new CubeGeometry(this.width, this.width, this.width);
                cube = new Mesh(geometry, cubeMaterials);
                this.cube = cube;
                this.add(cube);

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function load(_x, _x2, _x3) {
        return _load.apply(this, arguments);
      }

      return load;
    }()
    /**
     * Loads each cube face material.
     * @param {string} directory
     * @param {string} filename
     * @param {string} extension
     * @returns {Array<THREE.Material>}
     * @async
     */

  }, {
    key: "createCubeMaterials",
    value: function () {
      var _createCubeMaterials = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(directory, filename, extension) {
        var loader, texturePromises, i, suffix, path, textures, cubeMaterials, _i, mat;

        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // Load all textures first.
                loader = extension == '.tga' ? new TGALoader() : new TextureLoader();
                texturePromises = new Array();

                for (i = 0; i < SUFFIXES.length; ++i) {
                  suffix = SUFFIXES[i];
                  path = "".concat(directory).concat(filename, "_").concat(suffix).concat(extension);
                  texturePromises.push(this.loadTexture(loader, path));
                }

                _context2.next = 5;
                return Promise.all(texturePromises);

              case 5:
                textures = _context2.sent;
                // Create all materials from textures.
                cubeMaterials = new Array();

                for (_i = 0; _i < textures.length; ++_i) {
                  mat = new MeshBasicMaterial({
                    map: textures[_i],
                    side: DoubleSide,
                    fog: false
                  });
                  cubeMaterials.push(mat);
                }

                return _context2.abrupt("return", cubeMaterials);

              case 9:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function createCubeMaterials(_x4, _x5, _x6) {
        return _createCubeMaterials.apply(this, arguments);
      }

      return createCubeMaterials;
    }()
    /**
     * Wrapper for loading a texture.
     * @param {THREE.Loader} loader
     * @param {string} path
     * @returns {THREE.Texture}
     * @async
     */

  }, {
    key: "loadTexture",
    value: function () {
      var _loadTexture = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(loader, path) {
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt("return", new Promise(function (resolve) {
                  loader.load(path, function (texture) {
                    resolve(texture);
                  });
                }));

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function loadTexture(_x7, _x8) {
        return _loadTexture.apply(this, arguments);
      }

      return loadTexture;
    }()
  }]);

  return Skybox;
}(Object3D);

function _createSuper$h(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$h(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$h() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
/**
 * Provides a way of dynamically creating light, skyboxes, ambient sounds, etc
 * that are unique to an environment. Extends THREE.Object3D to act as a root
 * that can be added to a scene.
 */

var Environment = /*#__PURE__*/function (_Entity) {
  _inherits(Environment, _Entity);

  var _super = _createSuper$h(Environment);

  function Environment() {
    var _this;

    _classCallCheck(this, Environment);

    _this = _super.call(this);
    _this.meshEnabled = false;
    _this.clearColor = 0xffffff;
    _this.fog = null;
    _this.qualityAdjustEnabled = false;
    return _this;
  }
  /**
   * Loads the environment from a JSON file.
   * @param {string} filePath
   * @async
   */


  _createClass(Environment, [{
    key: "loadFromFile",
    value: function () {
      var _loadFromFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(filePath) {
        var environmentData;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (filePath) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return");

              case 2:
                _context.next = 4;
                return loadJsonFromFile(filePath);

              case 4:
                environmentData = _context.sent;
                this.loadLights(environmentData.lights);
                this.loadBackground(environmentData.background);
                this.loadFog(environmentData.fog);
                _context.next = 10;
                return this.loadSkybox(environmentData.skybox);

              case 10:
                return _context.abrupt("return", this);

              case 11:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function loadFromFile(_x) {
        return _loadFromFile.apply(this, arguments);
      }

      return loadFromFile;
    }()
    /**
     * Loads lights from the environment file.
     * @param {Object} lightsData
     */

  }, {
    key: "loadLights",
    value: function loadLights(lightsData) {
      var _this2 = this;

      if (!lightsData) {
        return;
      }

      if (lightsData.ambient) {
        lightsData.ambient.forEach(function (data) {
          return _this2.add(Light.get().createAmbientLight(data));
        });
      }

      if (lightsData.directional) {
        lightsData.directional.forEach(function (data) {
          return _this2.add(Light.get().createDirectionalLight(data));
        });
      }
    }
    /**
     * Sets the renderer background color.
     * @param {string} background
     */

  }, {
    key: "loadBackground",
    value: function loadBackground(background) {
      if (!background) {
        return;
      }

      this.clearColor = parseInt(background, 16);
    }
    /**
     * Loads the skybox for the environment.
     * @param {Object} skyboxData
     * @async
     */

  }, {
    key: "loadSkybox",
    value: function () {
      var _loadSkybox = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(skyboxData) {
        var skybox, directory, file, extension;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (skyboxData) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                // Create skybox.
                skybox = new Skybox(skyboxData.width);
                directory = skyboxData.directory;
                file = skyboxData.file;
                extension = skyboxData.extension;
                _context2.next = 8;
                return skybox.load(directory, file, extension);

              case 8:
                this.add(skybox);

              case 9:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loadSkybox(_x2) {
        return _loadSkybox.apply(this, arguments);
      }

      return loadSkybox;
    }()
    /**
     * Loads fog into the scene.
     * @param {Object} fogData
     */

  }, {
    key: "loadFog",
    value: function loadFog(fogData) {
      if (!fogData) {
        return;
      }

      var color = fogData.color != null ? parseInt(fogData.color, 16) : 0xffffff;
      var near = fogData.near;
      var far = fogData.far;
      var density = fogData.density;
      this.fog = fogData.type == 'exp2' ? new FogExp2(color, density) : new Fog(color, near, far);
    }
    /**
     * Returns the clear color a renderer should set based on the environment.
     * @return {number}
     */

  }, {
    key: "getClearColor",
    value: function getClearColor() {
      return this.clearColor;
    }
    /**
     * Returns the fog to be added to the scene.
     * @return {THREE.Fog}
     */

  }, {
    key: "getFog",
    value: function getFog() {
      return this.fog;
    }
  }]);

  return Environment;
}(Entity);

function _createSuper$i(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$i(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$i() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var FREE_ROAM_BINDINGS = {
  UP: {
    keys: {
      keyboard: 32,
      controller: 'button7'
    }
  },
  DOWN: {
    keys: {
      keyboard: 67,
      controller: 'button6'
    }
  },
  LOOK_X: {
    keys: {
      controller: 'axes2'
    }
  },
  LOOK_Y: {
    keys: {
      controller: 'axes3'
    }
  },
  SPRINT: {
    keys: {
      keyboard: 16,
      controller: 'button10'
    }
  }
};
var CONTROLS_ID$2 = 'FreeRoam';
var MAX_CAMERA_Z = Math.PI / 2;
var MIN_CAMERA_Z = -Math.PI / 2;
var MOUSE_SENS = 0.002;
var SPRINT_COEFFICIENT = 5;
var VELOCITY_COEFFICIENT = 0.5;
/**
 * An entity that provides "free roam" controls, allowing it to fly through
 * space unaffected by physics.
 */

var FreeRoamEntity = /*#__PURE__*/function (_Entity) {
  _inherits(FreeRoamEntity, _Entity);

  var _super = _createSuper$i(FreeRoamEntity);

  _createClass(FreeRoamEntity, [{
    key: "getControlsId",

    /** @override */
    value: function getControlsId() {
      return CONTROLS_ID$2;
    }
  }], [{
    key: "GetBindings",
    value: function GetBindings() {
      return new Bindings(CONTROLS_ID$2).load(FREE_ROAM_BINDINGS).merge(Entity.GetBindings());
    }
  }]);

  function FreeRoamEntity() {
    var _this;

    var speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : VELOCITY_COEFFICIENT;

    _classCallCheck(this, FreeRoamEntity);

    /**
     * @param {number} speed
     */
    _this = _super.call(this); // Input properties.

    _this.targetQuaternion = new Quaternion();
    _this.lerpedVelocity = new Vector3();
    _this.targetVelocity = new Vector3();
    _this.speed = speed;
    return _this;
  }
  /** @override */


  _createClass(FreeRoamEntity, [{
    key: "positionCamera",
    value: function positionCamera(camera) {
      this.cameraArm.add(camera);
      camera.position.x = 0.5;
      camera.lookAt(this.position);
    }
    /** @override */

  }, {
    key: "update",
    value: function update() {
      _get(_getPrototypeOf(FreeRoamEntity.prototype), "update", this).call(this);

      var inputY = 0;

      if (this.getActionValue(this.bindings.UP)) {
        inputY += this.getActionValue(this.bindings.UP);
      }

      if (this.getActionValue(this.bindings.DOWN)) {
        inputY -= this.getActionValue(this.bindings.DOWN);
      }

      this.targetVelocity.set(this.inputVector.x, inputY, this.inputVector.z);
      this.targetVelocity.multiplyScalar(this.speed);

      if (this.getActionValue(this.bindings.SPRINT)) {
        this.targetVelocity.multiplyScalar(SPRINT_COEFFICIENT);
      }

      this.position.add(this.targetVelocity);
      this.updateRotation();
    }
    /**
     * Updates the camera rotation.
     */

  }, {
    key: "updateRotation",
    value: function updateRotation() {
      // Update from controller.
      if (this.getActionValue(this.bindings.LOOK_X)) {
        this.cameraArm.rotation.y -= 0.1 * this.getActionValue(this.bindings.LOOK_X);
      }

      if (this.getActionValue(this.bindings.LOOK_Y)) {
        this.cameraArm.rotation.z += 0.02 * this.getActionValue(this.bindings.LOOK_Y);
      } // Update from mouse movement.


      this.cameraArm.rotation.y -= MOUSE_SENS * this.getMouseMovement().x;
      this.cameraArm.rotation.z += MOUSE_SENS * this.getMouseMovement().y; // Clamp.

      this.cameraArm.rotation.z = Math.min(MAX_CAMERA_Z, Math.max(MIN_CAMERA_Z, this.cameraArm.rotation.z));
    }
  }]);

  return FreeRoamEntity;
}(Entity);

Controls.get().registerBindings(FreeRoamEntity);

function _createSuper$j(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$j(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$j() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var instance$a = null;
/**
 * Plugin for TWEEN.
 * https://github.com/tweenjs/tween.js
 */

var TweenPlugin = /*#__PURE__*/function (_Plugin) {
  _inherits(TweenPlugin, _Plugin);

  var _super = _createSuper$j(TweenPlugin);

  _createClass(TweenPlugin, null, [{
    key: "get",

    /**
     * Enforces singleton instance.
     */
    value: function get() {
      if (!instance$a) {
        instance$a = new TweenPlugin();
      }

      return instance$a;
    }
  }]);

  function TweenPlugin() {
    var _this;

    _classCallCheck(this, TweenPlugin);

    _this = _super.call(this);
    _this.lastTime = performance.now();
    return _this;
  }
  /** @override */


  _createClass(TweenPlugin, [{
    key: "reset",
    value: function reset() {// Nothing to reset.
    }
    /** @override */

  }, {
    key: "update",
    value: function update(timestamp) {
      TWEEN.update(timestamp);
    }
    /**
     * Creates a Tween for the given args.
     * @param {?} args
     * @return {TWEEN.Tween}
     */

  }, {
    key: "createTween",
    value: function createTween() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return new TWEEN.Tween(args);
    }
  }]);

  return TweenPlugin;
}(Plugin);

function _createSuper$k(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct$k(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _isNativeReflectConstruct$k() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }
var DEBUG_MATERIAL = new MeshLambertMaterial({
  color: 0xff0000,
  wireframe: true
});
/**
 * An individual tile of terrain.
 */

var TerrainTile = /*#__PURE__*/function (_Entity) {
  _inherits(TerrainTile, _Entity);

  var _super = _createSuper$k(TerrainTile);

  /**
   * @param {number} size
   * @param {number} scale
   * @param {number} elementSize
   */
  function TerrainTile(size) {
    var _this;

    var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0;
    var elementSize = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1.0;

    _classCallCheck(this, TerrainTile);

    _this = _super.call(this);
    _this.size = size;
    _this.tileScale = scale; // Lock mesh rotation due to discrepancies with Three and Cannon planes.

    _this.meshRotationLocked = true; // The size of each data tile.

    _this.elementSize = elementSize; // A matrix of data that creates the terrain tile.

    _this.data = null; // Map tile coordinates.

    _this.tileCoordinates = new Vector2(); // Debug planes to help find boundaries of tiles.

    _this.debugWalls = null;
    return _this;
  }
  /** @override */


  _createClass(TerrainTile, [{
    key: "handleSettingsChange",
    value: function handleSettingsChange() {
      this.toggleDebug();
    }
    /** @override */

  }, {
    key: "generateMesh",
    value: function () {
      var _generateMesh = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee() {
        var dataHeight, dataWidth, totalWidth, totalHeight, geometry, material, mesh;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.data) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt("return", console.error('Attempting to create a terrain tile with no data'));

              case 2:
                dataHeight = this.data.length;
                dataWidth = this.data[0].length;
                totalWidth = (dataWidth - 1) * this.elementSize;
                totalHeight = (dataHeight - 1) * this.elementSize;
                geometry = new PlaneGeometry(totalWidth, totalHeight, dataWidth - 1, dataHeight - 1);
                this.data.forEach(function (row, rowIndex) {
                  row.forEach(function (value, valueIndex) {
                    var vertexIndex = rowIndex * dataWidth + valueIndex;
                    geometry.vertices[vertexIndex].z = value;
                  });
                });
                geometry.rotateX(-Math.PI / 2);
                geometry.computeBoundingBox();
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                material = new MeshLambertMaterial();
                mesh = new Mesh(geometry, material);
                mesh.castShadow = true;
                mesh.receiveShadow = true; // Debug init.

                this.generateDebugWalls(mesh);
                this.toggleDebug();
                _context.next = 20;
                return this.generateTexture(mesh);

              case 20:
                return _context.abrupt("return", mesh);

              case 21:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function generateMesh() {
        return _generateMesh.apply(this, arguments);
      }

      return generateMesh;
    }()
    /** @override */

  }, {
    key: "generatePhysicsBody",
    value: function generatePhysicsBody() {
      var body = new Body();
      var heightfieldShape = new Heightfield(this.data, {
        elementSize: this.elementSize
      });
      var dataHeight = this.data.length;
      var dataWidth = this.data[0].length;
      var totalWidth = (dataWidth - 1) * this.elementSize;
      var totalHeight = (dataHeight - 1) * this.elementSize;
      var shapeQuaternion = new Quaternion().setFromEuler(-Math.PI / 2, 0, -Math.PI / 2, 'XYZ');
      var shapeOffset = new Vec3(-totalWidth / 2, 0, -totalHeight / 2);
      body.addShape(heightfieldShape, shapeOffset, shapeQuaternion);
      body.material = MaterialManager.get().createPhysicalMaterial('ground');
      return body;
    }
    /**
     * Generates a texture given the generated mesh. Takes vertex height and slope
     * into account.
     * @param {THREE.Mesh} mesh
     * @async
     */

  }, {
    key: "generateTexture",
    value: function () {
      var _generateTexture = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(mesh) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                console.warn('No generateTexture implementation for terrain tile.');

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function generateTexture(_x) {
        return _generateTexture.apply(this, arguments);
      }

      return generateTexture;
    }()
    /**
     * Toggles debug meshes for the tile.
     */

  }, {
    key: "toggleDebug",
    value: function toggleDebug() {
      if (Settings$1.get('terrain_debug')) {
        this.add(this.debugWalls);
      } else {
        this.remove(this.debugWalls);
      }
    }
    /**
     * Creates debug walls to aid finding the boundaries of a tile.
     * @param {THREE.Mesh} mesh Tile mesh to get bounding box.
     */

  }, {
    key: "generateDebugWalls",
    value: function generateDebugWalls(mesh) {
      if (!this.data || !mesh) {
        return;
      } // Create walls.


      var dataHeight = this.data.length;
      var dataWidth = this.data[0].length;
      var totalWidth = (dataWidth - 1) * this.elementSize;
      var totalHeight = (dataHeight - 1) * this.elementSize;
      var geometry = new PlaneGeometry(totalWidth, totalHeight, 10, 10);
      this.debugWalls = new Object3D(); // Calculate min/max.

      var y = (mesh.geometry.boundingBox.min.y + mesh.geometry.boundingBox.max.y) / 2;

      for (var i = 0; i < 4; i++) {
        var _mesh = new Mesh(geometry, DEBUG_MATERIAL);

        this.mesh;

        switch (i) {
          case 0:
            _mesh.position.set(0, y, totalWidth / 2);

            break;

          case 1:
            _mesh.position.set(totalWidth / 2, y, 0);

            break;

          case 2:
            _mesh.position.set(0, y, -totalWidth / 2);

            break;

          case 3:
            _mesh.position.set(-totalWidth / 2, y, 0);

            break;
        }

        _mesh.rotation.y = i % 2 == 0 ? 0 : Math.PI / 2;
        this.debugWalls.add(_mesh);
      } // Create root mesh.


      var tileRoot = new Mesh(new BoxGeometry(totalWidth / 20, totalWidth / 2, totalWidth / 20), new MeshLambertMaterial({
        color: 0xffff00
      }));
      tileRoot.position.y = y;
      this.debugWalls.add(tileRoot);
    }
    /**
     * Builds the tile from a given matrix of data.
     * @param {Array<Array<number>>} matrix
     */

  }, {
    key: "fromMatrix",
    value: function fromMatrix(matrix) {
      this.data = matrix;
      return this;
    }
    /**
     * Extracts the relevant data from a parent matrix.
     * @param {Array<Array<number>>} parentMatrix
     */

  }, {
    key: "fromParentMatrix",
    value: function fromParentMatrix(parentMatrix) {
      var _this2 = this;

      var coordinates = this.getCoordinates(); // Compute the number of rows we can skip based on the y coordinate.

      var yOffset = coordinates.y * this.size; // Compute the number of columns we can skip based on the x coordinate.

      var xOffset = coordinates.x * this.size; // Now that we have our starting point, we can consume chunks of `size` at a
      // time, skipping to the next row until we have consumed `size` rows.

      var matrix = new Array();

      for (var i = 0; i < this.size + 1; i++) {
        var rowIndex = yOffset + i;
        var row = parentMatrix[rowIndex].slice(xOffset, xOffset + this.size + 1);
        row = row.map(function (x) {
          return x * _this2.tileScale;
        });
        matrix.splice(0, 0, row);
      } // Fill tile out with data.


      return this.fromMatrix(matrix);
    }
    /**
     * Sets the coordinates of the tile relative to other tiles in the map.
     * @param {number} x
     * @param {number} y
     * @return {TerrainTile}
     */

  }, {
    key: "setCoordinates",
    value: function setCoordinates(x, y) {
      this.tileCoordinates.set(x, y);
      return this;
    }
    /**
     * @return {THREE.Vector2}
     */

  }, {
    key: "getCoordinates",
    value: function getCoordinates() {
      return this.tileCoordinates;
    }
  }]);

  return TerrainTile;
}(Entity);

/**
 * Handles loading a terrain map from a 3D model and parsing it into digestible
 * tiles. All terrain maps should be square, with dimensions that are a power of
 * 2.
 */

var TerrainMap = /*#__PURE__*/function () {
  /**
   * @param {number} tileSize The size of a tile. Must be a power of two.
   * @param {number} scale The scale based on the original heightmap size.
   */
  function TerrainMap(tileSize) {
    var scale = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0;

    _classCallCheck(this, TerrainMap);

    this.tileSize = tileSize;
    this.scale = scale; // Must be computed post-load.

    this.elementSize = 1 * this.scale;
    this.tiles = null;
    this.TerrainTileClass = TerrainTile;
  }
  /**
   * Sets a custom tile implementation for use within the terrain map.
   * @param {TerrainTile} terrainTileClass
   */


  _createClass(TerrainMap, [{
    key: "setTerrainTileClass",
    value: function setTerrainTileClass(terrainTileClass) {
      this.TerrainTileClass = terrainTileClass;
      return this;
    }
    /**
     * Loads the terrain map from a 3D model.
     * @param {string} modelUrl
     * @async
     */

  }, {
    key: "loadFromFile",
    value: function () {
      var _loadFromFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(modelUrl) {
        var model, heightmapObj, bufferGeometry, geometry, heightmap;
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Models.get().loadModelWithoutStorage(modelUrl);

              case 2:
                model = _context.sent;
                heightmapObj = model.getObjectByName('Grid');
                bufferGeometry = heightmapObj.geometry;
                geometry = new Geometry().fromBufferGeometry(bufferGeometry);
                geometry.mergeVertices();
                this.elementSize = this.computeGeometryElementSize_(geometry);
                heightmap = this.extractHeightmapFromGeometry(geometry);
                geometry.dispose(); // Compute how large each element will be within a tile.

                this.tiles = this.breakIntoTiles_(heightmap);
                _context.next = 13;
                return this.buildTiles_();

              case 13:
                this.positionTiles_();

              case 14:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function loadFromFile(_x) {
        return _loadFromFile.apply(this, arguments);
      }

      return loadFromFile;
    }()
    /**
     * Loads the terrain map from a geometry.
     * @param {THREE.Geometry} geometry
     * @async
     */

  }, {
    key: "loadFromGeometry",
    value: function () {
      var _loadFromGeometry = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(geometry) {
        var heightmap;
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                geometry.mergeVertices();
                this.elementSize = this.computeGeometryElementSize_(geometry);
                heightmap = this.extractHeightmapFromGeometry(geometry);
                geometry.dispose(); // Compute how large each element will be within a tile.

                this.tiles = this.breakIntoTiles_(heightmap);
                _context2.next = 7;
                return this.buildTiles_();

              case 7:
                this.positionTiles_();

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function loadFromGeometry(_x2) {
        return _loadFromGeometry.apply(this, arguments);
      }

      return loadFromGeometry;
    }()
    /**
     * Extracts elevation data from the given geometry and forms a generic matrix.
     * The y element of each vertex is meant to be the height.
     * @param {THREE.Geometry} geometry
     * @returns {Array<Array<number>}
     */

  }, {
    key: "extractHeightmapFromGeometry",
    value: function extractHeightmapFromGeometry(geometry) {
      var vertices = geometry.vertices; // Preprocess vertices first.
      // TODO: This is inefficient, and also depends on stable sorting.

      vertices.sort(function (a, b) {
        return a.x - b.x;
      });
      vertices.sort(function (a, b) {
        return b.z - a.z;
      }); // Extract values.

      var dimensions = Math.sqrt(vertices.length);

      if (parseInt(dimensions) != dimensions) {
        return console.error('Dimensions not an integer, geometry not square.');
      }

      var matrix = new Array();

      for (var i = 0; i < dimensions; i++) {
        var row = new Array();

        for (var j = 0; j < dimensions; j++) {
          var vIndex = i * dimensions + j;
          var value = vertices[vIndex].y;
          row.push(value);
        }

        matrix.push(row);
      }

      return matrix;
    }
    /**
     * Compute the size of each element within a tile, based on the original
     * geometry dimensions as well as how many tiles there will be.
     * @param {THREE.Geometry} geometry
     * @return {number}
     */

  }, {
    key: "computeGeometryElementSize_",
    value: function computeGeometryElementSize_(geometry) {
      geometry.computeBoundingBox();
      var width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      var numVertices = Math.sqrt(geometry.vertices.length);
      return width / numVertices * this.scale;
    }
    /**
     * Breaks the given heightmap into tiles.
     * @param {Array<Array<number>>} heightmap
     * @async
     * @protected
     */

  }, {
    key: "breakIntoTiles_",
    value: function breakIntoTiles_(heightmap) {
      // Determine how many tiles we need in a row on the given map.
      var tilesInMapRow = (heightmap.length - 1) / this.tileSize; // We can throw all tiles into an array, as they each keep their own
      // coordinates relative to the map.

      var tiles = new Array(); // Iterate to create tiles. One tile will be filled at a time.

      for (var i = 0; i < tilesInMapRow; i++) {
        for (var j = 0; j < tilesInMapRow; j++) {
          var tile = new this.TerrainTileClass(this.tileSize, this.scale, this.elementSize).withPhysics().setCoordinates(i, j).fromParentMatrix(heightmap);
          tiles.push(tile);
        }
      }

      return tiles;
    }
    /**
     * Loads all tile textures before the terrain map is finished loading.
     * @async
     * @private
     */

  }, {
    key: "buildTiles_",
    value: function () {
      var _buildTiles_ = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3() {
        var promises;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                promises = new Array();
                this.tiles.forEach(function (tile) {
                  return promises.push(tile.build());
                });
                return _context3.abrupt("return", Promise.all(promises));

              case 3:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function buildTiles_() {
        return _buildTiles_.apply(this, arguments);
      }

      return buildTiles_;
    }()
    /**
     * Positions all tiles in the world so that they align properly.
     * @private
     */

  }, {
    key: "positionTiles_",
    value: function positionTiles_() {
      var _this = this;

      this.tiles.forEach(function (tile) {
        var coords = tile.getCoordinates();
        var tilesInMapRow = Math.sqrt(_this.tiles.length); // We want the middle of the terrain map to be at the world origin, so we
        // create an offset based on half of the terrain map width.

        var tileOffset = tilesInMapRow / 2 - 0.5;
        var x = (coords.x - tileOffset) * _this.tileSize * _this.elementSize;
        var z = -(coords.y - tileOffset) * _this.tileSize * _this.elementSize;
        tile.setPosition(new Vector3(x, 0, z));
      });
    }
  }]);

  return TerrainMap;
}();

export { Action, Animation, Audio, Bindings, Camera, Character, Controls, Engine, EngineResetEvent, Entity, Environment, EraEvent, EventTarget, Events, FreeRoamEntity, GameMode, Light, MaterialManager, Models, Network, network_registry as NetworkRegistry, Object3DEventTarget, PhysicsPlugin, Plugin, QualityAdjuster, RendererStats, Settings$1 as Settings, SettingsEvent, SettingsPanel$1 as SettingsPanel, Skybox, TerrainMap, TerrainTile, TweenPlugin, WorkerPool, World, createUUID, defaultEraRenderer, disableShadows, dispose, extractMeshes, extractMeshesByName, getHexColorRatio, getRootScene, getRootWorld, lerp, loadJsonFromFile, loadTexture, shuffleArray, toDegrees, toRadians, vectorToAngle };
