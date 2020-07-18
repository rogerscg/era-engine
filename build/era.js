import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _classCallCheck from '@babel/runtime/helpers/classCallCheck';
import _createClass from '@babel/runtime/helpers/createClass';
import _inherits from '@babel/runtime/helpers/inherits';
import _possibleConstructorReturn from '@babel/runtime/helpers/possibleConstructorReturn';
import _getPrototypeOf from '@babel/runtime/helpers/getPrototypeOf';
import _regeneratorRuntime from '@babel/runtime/regenerator';
import _asyncToGenerator from '@babel/runtime/helpers/asyncToGenerator';
import { FileLoader, TextureLoader, WebGLRenderer, PCFSoftShadowMap, sRGBEncoding, AnimationMixer, PerspectiveCamera, OrthographicCamera, Object3D, AmbientLight, DirectionalLight, DirectionalLightHelper, SpotLight, SpotLightHelper, CameraHelper, Vector3, Vector4, Curve, Loader, LoaderUtils, RepeatWrapping, ClampToEdgeWrapping, Texture, MeshPhongMaterial, MeshLambertMaterial, Color as Color$1, EquirectangularReflectionMapping, Matrix4, Group, Bone, PropertyBinding, PointLight, MathUtils, SkinnedMesh, Mesh, LineBasicMaterial, Line, Skeleton, BufferGeometry, Float32BufferAttribute, Uint16BufferAttribute, Matrix3, BufferAttribute, AnimationClip, Quaternion, Euler, VectorKeyframeTrack, QuaternionKeyframeTrack, NumberKeyframeTrack, MeshBasicMaterial, MeshStandardMaterial, TangentSpaceNormalMap, Interpolant, ImageBitmapLoader, InterleavedBuffer, InterleavedBufferAttribute, LinearFilter, LinearMipmapLinearFilter, RGBFormat, PointsMaterial, Material, DoubleSide, Vector2, LineSegments, LineLoop, Points, InterpolateLinear, MeshPhysicalMaterial, NearestFilter, NearestMipmapNearestFilter, LinearMipmapNearestFilter, NearestMipmapLinearFilter, MirroredRepeatWrapping, InterpolateDiscrete, RGBAFormat, FrontSide, CanvasTexture, TriangleFanDrawMode, TriangleStripDrawMode, Box3, Sphere, DefaultLoadingManager, SkeletonHelper, LOD, Box3Helper, SphereGeometry, BoxGeometry, PlaneGeometry, Geometry, Face3, CylinderGeometry, Scene, LoopOnce, CubeGeometry, FogExp2, Fog } from 'three';
import _get from '@babel/runtime/helpers/get';
import _wrapNativeSuper from '@babel/runtime/helpers/wrapNativeSuper';
import _typeof2 from '@babel/runtime/helpers/typeof';
import _assertThisInitialized from '@babel/runtime/helpers/assertThisInitialized';
import OrbitControls from 'three-orbitcontrols';
import { Sphere as Sphere$1, Box, Plane, ConvexPolyhedron, Trimesh, Heightfield, Shape, Vec3, Material as Material$1, ContactMaterial, World as World$1, Body, Quaternion as Quaternion$1, Ray, Cylinder } from 'cannon-es';
import io from 'socket.io-client';
import _slicedToArray from '@babel/runtime/helpers/slicedToArray';

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
 * dat-gui JavaScript Controller Library
 * http://code.google.com/p/dat-gui
 *
 * Copyright 2011 Data Arts Team, Google Creative Lab
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */
function ___$insertStyle(css) {
  if (!css) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  var style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.innerHTML = css;
  document.head.appendChild(style);
  return css;
}

function colorToString(color, forceCSSHex) {
  var colorFormat = color.__state.conversionName.toString();

  var r = Math.round(color.r);
  var g = Math.round(color.g);
  var b = Math.round(color.b);
  var a = color.a;
  var h = Math.round(color.h);
  var s = color.s.toFixed(1);
  var v = color.v.toFixed(1);

  if (forceCSSHex || colorFormat === 'THREE_CHAR_HEX' || colorFormat === 'SIX_CHAR_HEX') {
    var str = color.hex.toString(16);

    while (str.length < 6) {
      str = '0' + str;
    }

    return '#' + str;
  } else if (colorFormat === 'CSS_RGB') {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  } else if (colorFormat === 'CSS_RGBA') {
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  } else if (colorFormat === 'HEX') {
    return '0x' + color.hex.toString(16);
  } else if (colorFormat === 'RGB_ARRAY') {
    return '[' + r + ',' + g + ',' + b + ']';
  } else if (colorFormat === 'RGBA_ARRAY') {
    return '[' + r + ',' + g + ',' + b + ',' + a + ']';
  } else if (colorFormat === 'RGB_OBJ') {
    return '{r:' + r + ',g:' + g + ',b:' + b + '}';
  } else if (colorFormat === 'RGBA_OBJ') {
    return '{r:' + r + ',g:' + g + ',b:' + b + ',a:' + a + '}';
  } else if (colorFormat === 'HSV_OBJ') {
    return '{h:' + h + ',s:' + s + ',v:' + v + '}';
  } else if (colorFormat === 'HSVA_OBJ') {
    return '{h:' + h + ',s:' + s + ',v:' + v + ',a:' + a + '}';
  }

  return 'unknown format';
}

var ARR_EACH = Array.prototype.forEach;
var ARR_SLICE = Array.prototype.slice;
var Common = {
  BREAK: {},
  extend: function extend(target) {
    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
      var keys = this.isObject(obj) ? Object.keys(obj) : [];
      keys.forEach(function (key) {
        if (!this.isUndefined(obj[key])) {
          target[key] = obj[key];
        }
      }.bind(this));
    }, this);
    return target;
  },
  defaults: function defaults(target) {
    this.each(ARR_SLICE.call(arguments, 1), function (obj) {
      var keys = this.isObject(obj) ? Object.keys(obj) : [];
      keys.forEach(function (key) {
        if (this.isUndefined(target[key])) {
          target[key] = obj[key];
        }
      }.bind(this));
    }, this);
    return target;
  },
  compose: function compose() {
    var toCall = ARR_SLICE.call(arguments);
    return function () {
      var args = ARR_SLICE.call(arguments);

      for (var i = toCall.length - 1; i >= 0; i--) {
        args = [toCall[i].apply(this, args)];
      }

      return args[0];
    };
  },
  each: function each(obj, itr, scope) {
    if (!obj) {
      return;
    }

    if (ARR_EACH && obj.forEach && obj.forEach === ARR_EACH) {
      obj.forEach(itr, scope);
    } else if (obj.length === obj.length + 0) {
      var key = void 0;
      var l = void 0;

      for (key = 0, l = obj.length; key < l; key++) {
        if (key in obj && itr.call(scope, obj[key], key) === this.BREAK) {
          return;
        }
      }
    } else {
      for (var _key in obj) {
        if (itr.call(scope, obj[_key], _key) === this.BREAK) {
          return;
        }
      }
    }
  },
  defer: function defer(fnc) {
    setTimeout(fnc, 0);
  },
  debounce: function debounce(func, threshold, callImmediately) {
    var timeout = void 0;
    return function () {
      var obj = this;
      var args = arguments;

      function delayed() {
        timeout = null;
        if (!callImmediately) func.apply(obj, args);
      }

      var callNow = callImmediately || !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(delayed, threshold);

      if (callNow) {
        func.apply(obj, args);
      }
    };
  },
  toArray: function toArray(obj) {
    if (obj.toArray) return obj.toArray();
    return ARR_SLICE.call(obj);
  },
  isUndefined: function isUndefined(obj) {
    return obj === undefined;
  },
  isNull: function isNull(obj) {
    return obj === null;
  },
  isNaN: function (_isNaN) {
    function isNaN(_x) {
      return _isNaN.apply(this, arguments);
    }

    isNaN.toString = function () {
      return _isNaN.toString();
    };

    return isNaN;
  }(function (obj) {
    return isNaN(obj);
  }),
  isArray: Array.isArray || function (obj) {
    return obj.constructor === Array;
  },
  isObject: function isObject(obj) {
    return obj === Object(obj);
  },
  isNumber: function isNumber(obj) {
    return obj === obj + 0;
  },
  isString: function isString(obj) {
    return obj === obj + '';
  },
  isBoolean: function isBoolean(obj) {
    return obj === false || obj === true;
  },
  isFunction: function isFunction(obj) {
    return Object.prototype.toString.call(obj) === '[object Function]';
  }
};
var INTERPRETATIONS = [{
  litmus: Common.isString,
  conversions: {
    THREE_CHAR_HEX: {
      read: function read(original) {
        var test = original.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);

        if (test === null) {
          return false;
        }

        return {
          space: 'HEX',
          hex: parseInt('0x' + test[1].toString() + test[1].toString() + test[2].toString() + test[2].toString() + test[3].toString() + test[3].toString(), 0)
        };
      },
      write: colorToString
    },
    SIX_CHAR_HEX: {
      read: function read(original) {
        var test = original.match(/^#([A-F0-9]{6})$/i);

        if (test === null) {
          return false;
        }

        return {
          space: 'HEX',
          hex: parseInt('0x' + test[1].toString(), 0)
        };
      },
      write: colorToString
    },
    CSS_RGB: {
      read: function read(original) {
        var test = original.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);

        if (test === null) {
          return false;
        }

        return {
          space: 'RGB',
          r: parseFloat(test[1]),
          g: parseFloat(test[2]),
          b: parseFloat(test[3])
        };
      },
      write: colorToString
    },
    CSS_RGBA: {
      read: function read(original) {
        var test = original.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);

        if (test === null) {
          return false;
        }

        return {
          space: 'RGB',
          r: parseFloat(test[1]),
          g: parseFloat(test[2]),
          b: parseFloat(test[3]),
          a: parseFloat(test[4])
        };
      },
      write: colorToString
    }
  }
}, {
  litmus: Common.isNumber,
  conversions: {
    HEX: {
      read: function read(original) {
        return {
          space: 'HEX',
          hex: original,
          conversionName: 'HEX'
        };
      },
      write: function write(color) {
        return color.hex;
      }
    }
  }
}, {
  litmus: Common.isArray,
  conversions: {
    RGB_ARRAY: {
      read: function read(original) {
        if (original.length !== 3) {
          return false;
        }

        return {
          space: 'RGB',
          r: original[0],
          g: original[1],
          b: original[2]
        };
      },
      write: function write(color) {
        return [color.r, color.g, color.b];
      }
    },
    RGBA_ARRAY: {
      read: function read(original) {
        if (original.length !== 4) return false;
        return {
          space: 'RGB',
          r: original[0],
          g: original[1],
          b: original[2],
          a: original[3]
        };
      },
      write: function write(color) {
        return [color.r, color.g, color.b, color.a];
      }
    }
  }
}, {
  litmus: Common.isObject,
  conversions: {
    RGBA_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b) && Common.isNumber(original.a)) {
          return {
            space: 'RGB',
            r: original.r,
            g: original.g,
            b: original.b,
            a: original.a
          };
        }

        return false;
      },
      write: function write(color) {
        return {
          r: color.r,
          g: color.g,
          b: color.b,
          a: color.a
        };
      }
    },
    RGB_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.r) && Common.isNumber(original.g) && Common.isNumber(original.b)) {
          return {
            space: 'RGB',
            r: original.r,
            g: original.g,
            b: original.b
          };
        }

        return false;
      },
      write: function write(color) {
        return {
          r: color.r,
          g: color.g,
          b: color.b
        };
      }
    },
    HSVA_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v) && Common.isNumber(original.a)) {
          return {
            space: 'HSV',
            h: original.h,
            s: original.s,
            v: original.v,
            a: original.a
          };
        }

        return false;
      },
      write: function write(color) {
        return {
          h: color.h,
          s: color.s,
          v: color.v,
          a: color.a
        };
      }
    },
    HSV_OBJ: {
      read: function read(original) {
        if (Common.isNumber(original.h) && Common.isNumber(original.s) && Common.isNumber(original.v)) {
          return {
            space: 'HSV',
            h: original.h,
            s: original.s,
            v: original.v
          };
        }

        return false;
      },
      write: function write(color) {
        return {
          h: color.h,
          s: color.s,
          v: color.v
        };
      }
    }
  }
}];
var result = void 0;
var toReturn = void 0;

var interpret = function interpret() {
  toReturn = false;
  var original = arguments.length > 1 ? Common.toArray(arguments) : arguments[0];
  Common.each(INTERPRETATIONS, function (family) {
    if (family.litmus(original)) {
      Common.each(family.conversions, function (conversion, conversionName) {
        result = conversion.read(original);

        if (toReturn === false && result !== false) {
          toReturn = result;
          result.conversionName = conversionName;
          result.conversion = conversion;
          return Common.BREAK;
        }
      });
      return Common.BREAK;
    }
  });
  return toReturn;
};

var tmpComponent = void 0;
var ColorMath = {
  hsv_to_rgb: function hsv_to_rgb(h, s, v) {
    var hi = Math.floor(h / 60) % 6;
    var f = h / 60 - Math.floor(h / 60);
    var p = v * (1.0 - s);
    var q = v * (1.0 - f * s);
    var t = v * (1.0 - (1.0 - f) * s);
    var c = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][hi];
    return {
      r: c[0] * 255,
      g: c[1] * 255,
      b: c[2] * 255
    };
  },
  rgb_to_hsv: function rgb_to_hsv(r, g, b) {
    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);
    var delta = max - min;
    var h = void 0;
    var s = void 0;

    if (max !== 0) {
      s = delta / max;
    } else {
      return {
        h: NaN,
        s: 0,
        v: 0
      };
    }

    if (r === max) {
      h = (g - b) / delta;
    } else if (g === max) {
      h = 2 + (b - r) / delta;
    } else {
      h = 4 + (r - g) / delta;
    }

    h /= 6;

    if (h < 0) {
      h += 1;
    }

    return {
      h: h * 360,
      s: s,
      v: max / 255
    };
  },
  rgb_to_hex: function rgb_to_hex(r, g, b) {
    var hex = this.hex_with_component(0, 2, r);
    hex = this.hex_with_component(hex, 1, g);
    hex = this.hex_with_component(hex, 0, b);
    return hex;
  },
  component_from_hex: function component_from_hex(hex, componentIndex) {
    return hex >> componentIndex * 8 & 0xff;
  },
  hex_with_component: function hex_with_component(hex, componentIndex, value) {
    return value << (tmpComponent = componentIndex * 8) | hex & ~(0xff << tmpComponent);
  }
};

var _typeof = typeof Symbol === 'function' && _typeof2(Symbol.iterator) === 'symbol' ? function (obj) {
  return _typeof2(obj);
} : function (obj) {
  return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : _typeof2(obj);
};

var classCallCheck = function classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ('value' in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function, not ' + _typeof2(superClass));
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (_typeof2(call) === 'object' || typeof call === 'function') ? call : self;
};

var Color = function () {
  function Color() {
    classCallCheck(this, Color);
    this.__state = interpret.apply(this, arguments);

    if (this.__state === false) {
      throw new Error('Failed to interpret color arguments');
    }

    this.__state.a = this.__state.a || 1;
  }

  createClass(Color, [{
    key: 'toString',
    value: function toString() {
      return colorToString(this);
    }
  }, {
    key: 'toHexString',
    value: function toHexString() {
      return colorToString(this, true);
    }
  }, {
    key: 'toOriginal',
    value: function toOriginal() {
      return this.__state.conversion.write(this);
    }
  }]);
  return Color;
}();

function defineRGBComponent(target, component, componentHexIndex) {
  Object.defineProperty(target, component, {
    get: function get$$1() {
      if (this.__state.space === 'RGB') {
        return this.__state[component];
      }

      Color.recalculateRGB(this, component, componentHexIndex);
      return this.__state[component];
    },
    set: function set$$1(v) {
      if (this.__state.space !== 'RGB') {
        Color.recalculateRGB(this, component, componentHexIndex);
        this.__state.space = 'RGB';
      }

      this.__state[component] = v;
    }
  });
}

function defineHSVComponent(target, component) {
  Object.defineProperty(target, component, {
    get: function get$$1() {
      if (this.__state.space === 'HSV') {
        return this.__state[component];
      }

      Color.recalculateHSV(this);
      return this.__state[component];
    },
    set: function set$$1(v) {
      if (this.__state.space !== 'HSV') {
        Color.recalculateHSV(this);
        this.__state.space = 'HSV';
      }

      this.__state[component] = v;
    }
  });
}

Color.recalculateRGB = function (color, component, componentHexIndex) {
  if (color.__state.space === 'HEX') {
    color.__state[component] = ColorMath.component_from_hex(color.__state.hex, componentHexIndex);
  } else if (color.__state.space === 'HSV') {
    Common.extend(color.__state, ColorMath.hsv_to_rgb(color.__state.h, color.__state.s, color.__state.v));
  } else {
    throw new Error('Corrupted color state');
  }
};

Color.recalculateHSV = function (color) {
  var result = ColorMath.rgb_to_hsv(color.r, color.g, color.b);
  Common.extend(color.__state, {
    s: result.s,
    v: result.v
  });

  if (!Common.isNaN(result.h)) {
    color.__state.h = result.h;
  } else if (Common.isUndefined(color.__state.h)) {
    color.__state.h = 0;
  }
};

Color.COMPONENTS = ['r', 'g', 'b', 'h', 's', 'v', 'hex', 'a'];
defineRGBComponent(Color.prototype, 'r', 2);
defineRGBComponent(Color.prototype, 'g', 1);
defineRGBComponent(Color.prototype, 'b', 0);
defineHSVComponent(Color.prototype, 'h');
defineHSVComponent(Color.prototype, 's');
defineHSVComponent(Color.prototype, 'v');
Object.defineProperty(Color.prototype, 'a', {
  get: function get$$1() {
    return this.__state.a;
  },
  set: function set$$1(v) {
    this.__state.a = v;
  }
});
Object.defineProperty(Color.prototype, 'hex', {
  get: function get$$1() {
    if (!this.__state.space !== 'HEX') {
      this.__state.hex = ColorMath.rgb_to_hex(this.r, this.g, this.b);
    }

    return this.__state.hex;
  },
  set: function set$$1(v) {
    this.__state.space = 'HEX';
    this.__state.hex = v;
  }
});

var Controller = function () {
  function Controller(object, property) {
    classCallCheck(this, Controller);
    this.initialValue = object[property];
    this.domElement = document.createElement('div');
    this.object = object;
    this.property = property;
    this.__onChange = undefined;
    this.__onFinishChange = undefined;
  }

  createClass(Controller, [{
    key: 'onChange',
    value: function onChange(fnc) {
      this.__onChange = fnc;
      return this;
    }
  }, {
    key: 'onFinishChange',
    value: function onFinishChange(fnc) {
      this.__onFinishChange = fnc;
      return this;
    }
  }, {
    key: 'setValue',
    value: function setValue(newValue) {
      this.object[this.property] = newValue;

      if (this.__onChange) {
        this.__onChange.call(this, newValue);
      }

      this.updateDisplay();
      return this;
    }
  }, {
    key: 'getValue',
    value: function getValue() {
      return this.object[this.property];
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      return this;
    }
  }, {
    key: 'isModified',
    value: function isModified() {
      return this.initialValue !== this.getValue();
    }
  }]);
  return Controller;
}();

var EVENT_MAP = {
  HTMLEvents: ['change'],
  MouseEvents: ['click', 'mousemove', 'mousedown', 'mouseup', 'mouseover'],
  KeyboardEvents: ['keydown']
};
var EVENT_MAP_INV = {};
Common.each(EVENT_MAP, function (v, k) {
  Common.each(v, function (e) {
    EVENT_MAP_INV[e] = k;
  });
});
var CSS_VALUE_PIXELS = /(\d+(\.\d+)?)px/;

function cssValueToPixels(val) {
  if (val === '0' || Common.isUndefined(val)) {
    return 0;
  }

  var match = val.match(CSS_VALUE_PIXELS);

  if (!Common.isNull(match)) {
    return parseFloat(match[1]);
  }

  return 0;
}

var dom = {
  makeSelectable: function makeSelectable(elem, selectable) {
    if (elem === undefined || elem.style === undefined) return;
    elem.onselectstart = selectable ? function () {
      return false;
    } : function () {};
    elem.style.MozUserSelect = selectable ? 'auto' : 'none';
    elem.style.KhtmlUserSelect = selectable ? 'auto' : 'none';
    elem.unselectable = selectable ? 'on' : 'off';
  },
  makeFullscreen: function makeFullscreen(elem, hor, vert) {
    var vertical = vert;
    var horizontal = hor;

    if (Common.isUndefined(horizontal)) {
      horizontal = true;
    }

    if (Common.isUndefined(vertical)) {
      vertical = true;
    }

    elem.style.position = 'absolute';

    if (horizontal) {
      elem.style.left = 0;
      elem.style.right = 0;
    }

    if (vertical) {
      elem.style.top = 0;
      elem.style.bottom = 0;
    }
  },
  fakeEvent: function fakeEvent(elem, eventType, pars, aux) {
    var params = pars || {};
    var className = EVENT_MAP_INV[eventType];

    if (!className) {
      throw new Error('Event type ' + eventType + ' not supported.');
    }

    var evt = document.createEvent(className);

    switch (className) {
      case 'MouseEvents':
        {
          var clientX = params.x || params.clientX || 0;
          var clientY = params.y || params.clientY || 0;
          evt.initMouseEvent(eventType, params.bubbles || false, params.cancelable || true, window, params.clickCount || 1, 0, 0, clientX, clientY, false, false, false, false, 0, null);
          break;
        }

      case 'KeyboardEvents':
        {
          var init = evt.initKeyboardEvent || evt.initKeyEvent;
          Common.defaults(params, {
            cancelable: true,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false,
            keyCode: undefined,
            charCode: undefined
          });
          init(eventType, params.bubbles || false, params.cancelable, window, params.ctrlKey, params.altKey, params.shiftKey, params.metaKey, params.keyCode, params.charCode);
          break;
        }

      default:
        {
          evt.initEvent(eventType, params.bubbles || false, params.cancelable || true);
          break;
        }
    }

    Common.defaults(evt, aux);
    elem.dispatchEvent(evt);
  },
  bind: function bind(elem, event, func, newBool) {
    var bool = newBool || false;

    if (elem.addEventListener) {
      elem.addEventListener(event, func, bool);
    } else if (elem.attachEvent) {
      elem.attachEvent('on' + event, func);
    }

    return dom;
  },
  unbind: function unbind(elem, event, func, newBool) {
    var bool = newBool || false;

    if (elem.removeEventListener) {
      elem.removeEventListener(event, func, bool);
    } else if (elem.detachEvent) {
      elem.detachEvent('on' + event, func);
    }

    return dom;
  },
  addClass: function addClass(elem, className) {
    if (elem.className === undefined) {
      elem.className = className;
    } else if (elem.className !== className) {
      var classes = elem.className.split(/ +/);

      if (classes.indexOf(className) === -1) {
        classes.push(className);
        elem.className = classes.join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
      }
    }

    return dom;
  },
  removeClass: function removeClass(elem, className) {
    if (className) {
      if (elem.className === className) {
        elem.removeAttribute('class');
      } else {
        var classes = elem.className.split(/ +/);
        var index = classes.indexOf(className);

        if (index !== -1) {
          classes.splice(index, 1);
          elem.className = classes.join(' ');
        }
      }
    } else {
      elem.className = undefined;
    }

    return dom;
  },
  hasClass: function hasClass(elem, className) {
    return new RegExp('(?:^|\\s+)' + className + '(?:\\s+|$)').test(elem.className) || false;
  },
  getWidth: function getWidth(elem) {
    var style = getComputedStyle(elem);
    return cssValueToPixels(style['border-left-width']) + cssValueToPixels(style['border-right-width']) + cssValueToPixels(style['padding-left']) + cssValueToPixels(style['padding-right']) + cssValueToPixels(style.width);
  },
  getHeight: function getHeight(elem) {
    var style = getComputedStyle(elem);
    return cssValueToPixels(style['border-top-width']) + cssValueToPixels(style['border-bottom-width']) + cssValueToPixels(style['padding-top']) + cssValueToPixels(style['padding-bottom']) + cssValueToPixels(style.height);
  },
  getOffset: function getOffset(el) {
    var elem = el;
    var offset = {
      left: 0,
      top: 0
    };

    if (elem.offsetParent) {
      do {
        offset.left += elem.offsetLeft;
        offset.top += elem.offsetTop;
        elem = elem.offsetParent;
      } while (elem);
    }

    return offset;
  },
  isActive: function isActive(elem) {
    return elem === document.activeElement && (elem.type || elem.href);
  }
};

var BooleanController = function (_Controller) {
  inherits(BooleanController, _Controller);

  function BooleanController(object, property) {
    classCallCheck(this, BooleanController);

    var _this2 = possibleConstructorReturn(this, (BooleanController.__proto__ || Object.getPrototypeOf(BooleanController)).call(this, object, property));

    var _this = _this2;
    _this2.__prev = _this2.getValue();
    _this2.__checkbox = document.createElement('input');

    _this2.__checkbox.setAttribute('type', 'checkbox');

    function onChange() {
      _this.setValue(!_this.__prev);
    }

    dom.bind(_this2.__checkbox, 'change', onChange, false);

    _this2.domElement.appendChild(_this2.__checkbox);

    _this2.updateDisplay();

    return _this2;
  }

  createClass(BooleanController, [{
    key: 'setValue',
    value: function setValue(v) {
      var toReturn = get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'setValue', this).call(this, v);

      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }

      this.__prev = this.getValue();
      return toReturn;
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (this.getValue() === true) {
        this.__checkbox.setAttribute('checked', 'checked');

        this.__checkbox.checked = true;
        this.__prev = true;
      } else {
        this.__checkbox.checked = false;
        this.__prev = false;
      }

      return get(BooleanController.prototype.__proto__ || Object.getPrototypeOf(BooleanController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return BooleanController;
}(Controller);

var OptionController = function (_Controller) {
  inherits(OptionController, _Controller);

  function OptionController(object, property, opts) {
    classCallCheck(this, OptionController);

    var _this2 = possibleConstructorReturn(this, (OptionController.__proto__ || Object.getPrototypeOf(OptionController)).call(this, object, property));

    var options = opts;
    var _this = _this2;
    _this2.__select = document.createElement('select');

    if (Common.isArray(options)) {
      var map = {};
      Common.each(options, function (element) {
        map[element] = element;
      });
      options = map;
    }

    Common.each(options, function (value, key) {
      var opt = document.createElement('option');
      opt.innerHTML = key;
      opt.setAttribute('value', value);

      _this.__select.appendChild(opt);
    });

    _this2.updateDisplay();

    dom.bind(_this2.__select, 'change', function () {
      var desiredValue = this.options[this.selectedIndex].value;

      _this.setValue(desiredValue);
    });

    _this2.domElement.appendChild(_this2.__select);

    return _this2;
  }

  createClass(OptionController, [{
    key: 'setValue',
    value: function setValue(v) {
      var toReturn = get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'setValue', this).call(this, v);

      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }

      return toReturn;
    }
  }, {
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (dom.isActive(this.__select)) return this;
      this.__select.value = this.getValue();
      return get(OptionController.prototype.__proto__ || Object.getPrototypeOf(OptionController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return OptionController;
}(Controller);

var StringController = function (_Controller) {
  inherits(StringController, _Controller);

  function StringController(object, property) {
    classCallCheck(this, StringController);

    var _this2 = possibleConstructorReturn(this, (StringController.__proto__ || Object.getPrototypeOf(StringController)).call(this, object, property));

    var _this = _this2;

    function onChange() {
      _this.setValue(_this.__input.value);
    }

    function onBlur() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    _this2.__input = document.createElement('input');

    _this2.__input.setAttribute('type', 'text');

    dom.bind(_this2.__input, 'keyup', onChange);
    dom.bind(_this2.__input, 'change', onChange);
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        this.blur();
      }
    });

    _this2.updateDisplay();

    _this2.domElement.appendChild(_this2.__input);

    return _this2;
  }

  createClass(StringController, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      if (!dom.isActive(this.__input)) {
        this.__input.value = this.getValue();
      }

      return get(StringController.prototype.__proto__ || Object.getPrototypeOf(StringController.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return StringController;
}(Controller);

function numDecimals(x) {
  var _x = x.toString();

  if (_x.indexOf('.') > -1) {
    return _x.length - _x.indexOf('.') - 1;
  }

  return 0;
}

var NumberController = function (_Controller) {
  inherits(NumberController, _Controller);

  function NumberController(object, property, params) {
    classCallCheck(this, NumberController);

    var _this = possibleConstructorReturn(this, (NumberController.__proto__ || Object.getPrototypeOf(NumberController)).call(this, object, property));

    var _params = params || {};

    _this.__min = _params.min;
    _this.__max = _params.max;
    _this.__step = _params.step;

    if (Common.isUndefined(_this.__step)) {
      if (_this.initialValue === 0) {
        _this.__impliedStep = 1;
      } else {
        _this.__impliedStep = Math.pow(10, Math.floor(Math.log(Math.abs(_this.initialValue)) / Math.LN10)) / 10;
      }
    } else {
      _this.__impliedStep = _this.__step;
    }

    _this.__precision = numDecimals(_this.__impliedStep);
    return _this;
  }

  createClass(NumberController, [{
    key: 'setValue',
    value: function setValue(v) {
      var _v = v;

      if (this.__min !== undefined && _v < this.__min) {
        _v = this.__min;
      } else if (this.__max !== undefined && _v > this.__max) {
        _v = this.__max;
      }

      if (this.__step !== undefined && _v % this.__step !== 0) {
        _v = Math.round(_v / this.__step) * this.__step;
      }

      return get(NumberController.prototype.__proto__ || Object.getPrototypeOf(NumberController.prototype), 'setValue', this).call(this, _v);
    }
  }, {
    key: 'min',
    value: function min(minValue) {
      this.__min = minValue;
      return this;
    }
  }, {
    key: 'max',
    value: function max(maxValue) {
      this.__max = maxValue;
      return this;
    }
  }, {
    key: 'step',
    value: function step(stepValue) {
      this.__step = stepValue;
      this.__impliedStep = stepValue;
      this.__precision = numDecimals(stepValue);
      return this;
    }
  }]);
  return NumberController;
}(Controller);

function roundToDecimal(value, decimals) {
  var tenTo = Math.pow(10, decimals);
  return Math.round(value * tenTo) / tenTo;
}

var NumberControllerBox = function (_NumberController) {
  inherits(NumberControllerBox, _NumberController);

  function NumberControllerBox(object, property, params) {
    classCallCheck(this, NumberControllerBox);

    var _this2 = possibleConstructorReturn(this, (NumberControllerBox.__proto__ || Object.getPrototypeOf(NumberControllerBox)).call(this, object, property, params));

    _this2.__truncationSuspended = false;
    var _this = _this2;
    var prevY = void 0;

    function onChange() {
      var attempted = parseFloat(_this.__input.value);

      if (!Common.isNaN(attempted)) {
        _this.setValue(attempted);
      }
    }

    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    function onBlur() {
      onFinish();
    }

    function onMouseDrag(e) {
      var diff = prevY - e.clientY;

      _this.setValue(_this.getValue() + diff * _this.__impliedStep);

      prevY = e.clientY;
    }

    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);
      onFinish();
    }

    function onMouseDown(e) {
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      prevY = e.clientY;
    }

    _this2.__input = document.createElement('input');

    _this2.__input.setAttribute('type', 'text');

    dom.bind(_this2.__input, 'change', onChange);
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__input, 'mousedown', onMouseDown);
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        _this.__truncationSuspended = true;
        this.blur();
        _this.__truncationSuspended = false;
        onFinish();
      }
    });

    _this2.updateDisplay();

    _this2.domElement.appendChild(_this2.__input);

    return _this2;
  }

  createClass(NumberControllerBox, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      this.__input.value = this.__truncationSuspended ? this.getValue() : roundToDecimal(this.getValue(), this.__precision);
      return get(NumberControllerBox.prototype.__proto__ || Object.getPrototypeOf(NumberControllerBox.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return NumberControllerBox;
}(NumberController);

function map(v, i1, i2, o1, o2) {
  return o1 + (o2 - o1) * ((v - i1) / (i2 - i1));
}

var NumberControllerSlider = function (_NumberController) {
  inherits(NumberControllerSlider, _NumberController);

  function NumberControllerSlider(object, property, min, max, step) {
    classCallCheck(this, NumberControllerSlider);

    var _this2 = possibleConstructorReturn(this, (NumberControllerSlider.__proto__ || Object.getPrototypeOf(NumberControllerSlider)).call(this, object, property, {
      min: min,
      max: max,
      step: step
    }));

    var _this = _this2;
    _this2.__background = document.createElement('div');
    _this2.__foreground = document.createElement('div');
    dom.bind(_this2.__background, 'mousedown', onMouseDown);
    dom.bind(_this2.__background, 'touchstart', onTouchStart);
    dom.addClass(_this2.__background, 'slider');
    dom.addClass(_this2.__foreground, 'slider-fg');

    function onMouseDown(e) {
      document.activeElement.blur();
      dom.bind(window, 'mousemove', onMouseDrag);
      dom.bind(window, 'mouseup', onMouseUp);
      onMouseDrag(e);
    }

    function onMouseDrag(e) {
      e.preventDefault();

      var bgRect = _this.__background.getBoundingClientRect();

      _this.setValue(map(e.clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));

      return false;
    }

    function onMouseUp() {
      dom.unbind(window, 'mousemove', onMouseDrag);
      dom.unbind(window, 'mouseup', onMouseUp);

      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    function onTouchStart(e) {
      if (e.touches.length !== 1) {
        return;
      }

      dom.bind(window, 'touchmove', onTouchMove);
      dom.bind(window, 'touchend', onTouchEnd);
      onTouchMove(e);
    }

    function onTouchMove(e) {
      var clientX = e.touches[0].clientX;

      var bgRect = _this.__background.getBoundingClientRect();

      _this.setValue(map(clientX, bgRect.left, bgRect.right, _this.__min, _this.__max));
    }

    function onTouchEnd() {
      dom.unbind(window, 'touchmove', onTouchMove);
      dom.unbind(window, 'touchend', onTouchEnd);

      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.getValue());
      }
    }

    _this2.updateDisplay();

    _this2.__background.appendChild(_this2.__foreground);

    _this2.domElement.appendChild(_this2.__background);

    return _this2;
  }

  createClass(NumberControllerSlider, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      var pct = (this.getValue() - this.__min) / (this.__max - this.__min);

      this.__foreground.style.width = pct * 100 + '%';
      return get(NumberControllerSlider.prototype.__proto__ || Object.getPrototypeOf(NumberControllerSlider.prototype), 'updateDisplay', this).call(this);
    }
  }]);
  return NumberControllerSlider;
}(NumberController);

var FunctionController = function (_Controller) {
  inherits(FunctionController, _Controller);

  function FunctionController(object, property, text) {
    classCallCheck(this, FunctionController);

    var _this2 = possibleConstructorReturn(this, (FunctionController.__proto__ || Object.getPrototypeOf(FunctionController)).call(this, object, property));

    var _this = _this2;
    _this2.__button = document.createElement('div');
    _this2.__button.innerHTML = text === undefined ? 'Fire' : text;
    dom.bind(_this2.__button, 'click', function (e) {
      e.preventDefault();

      _this.fire();

      return false;
    });
    dom.addClass(_this2.__button, 'button');

    _this2.domElement.appendChild(_this2.__button);

    return _this2;
  }

  createClass(FunctionController, [{
    key: 'fire',
    value: function fire() {
      if (this.__onChange) {
        this.__onChange.call(this);
      }

      this.getValue().call(this.object);

      if (this.__onFinishChange) {
        this.__onFinishChange.call(this, this.getValue());
      }
    }
  }]);
  return FunctionController;
}(Controller);

var ColorController = function (_Controller) {
  inherits(ColorController, _Controller);

  function ColorController(object, property) {
    classCallCheck(this, ColorController);

    var _this2 = possibleConstructorReturn(this, (ColorController.__proto__ || Object.getPrototypeOf(ColorController)).call(this, object, property));

    _this2.__color = new Color(_this2.getValue());
    _this2.__temp = new Color(0);
    var _this = _this2;
    _this2.domElement = document.createElement('div');
    dom.makeSelectable(_this2.domElement, false);
    _this2.__selector = document.createElement('div');
    _this2.__selector.className = 'selector';
    _this2.__saturation_field = document.createElement('div');
    _this2.__saturation_field.className = 'saturation-field';
    _this2.__field_knob = document.createElement('div');
    _this2.__field_knob.className = 'field-knob';
    _this2.__field_knob_border = '2px solid ';
    _this2.__hue_knob = document.createElement('div');
    _this2.__hue_knob.className = 'hue-knob';
    _this2.__hue_field = document.createElement('div');
    _this2.__hue_field.className = 'hue-field';
    _this2.__input = document.createElement('input');
    _this2.__input.type = 'text';
    _this2.__input_textShadow = '0 1px 1px ';
    dom.bind(_this2.__input, 'keydown', function (e) {
      if (e.keyCode === 13) {
        onBlur.call(this);
      }
    });
    dom.bind(_this2.__input, 'blur', onBlur);
    dom.bind(_this2.__selector, 'mousedown', function () {
      dom.addClass(this, 'drag').bind(window, 'mouseup', function () {
        dom.removeClass(_this.__selector, 'drag');
      });
    });
    dom.bind(_this2.__selector, 'touchstart', function () {
      dom.addClass(this, 'drag').bind(window, 'touchend', function () {
        dom.removeClass(_this.__selector, 'drag');
      });
    });
    var valueField = document.createElement('div');
    Common.extend(_this2.__selector.style, {
      width: '122px',
      height: '102px',
      padding: '3px',
      backgroundColor: '#222',
      boxShadow: '0px 1px 3px rgba(0,0,0,0.3)'
    });
    Common.extend(_this2.__field_knob.style, {
      position: 'absolute',
      width: '12px',
      height: '12px',
      border: _this2.__field_knob_border + (_this2.__color.v < 0.5 ? '#fff' : '#000'),
      boxShadow: '0px 1px 3px rgba(0,0,0,0.5)',
      borderRadius: '12px',
      zIndex: 1
    });
    Common.extend(_this2.__hue_knob.style, {
      position: 'absolute',
      width: '15px',
      height: '2px',
      borderRight: '4px solid #fff',
      zIndex: 1
    });
    Common.extend(_this2.__saturation_field.style, {
      width: '100px',
      height: '100px',
      border: '1px solid #555',
      marginRight: '3px',
      display: 'inline-block',
      cursor: 'pointer'
    });
    Common.extend(valueField.style, {
      width: '100%',
      height: '100%',
      background: 'none'
    });
    linearGradient(valueField, 'top', 'rgba(0,0,0,0)', '#000');
    Common.extend(_this2.__hue_field.style, {
      width: '15px',
      height: '100px',
      border: '1px solid #555',
      cursor: 'ns-resize',
      position: 'absolute',
      top: '3px',
      right: '3px'
    });
    hueGradient(_this2.__hue_field);
    Common.extend(_this2.__input.style, {
      outline: 'none',
      textAlign: 'center',
      color: '#fff',
      border: 0,
      fontWeight: 'bold',
      textShadow: _this2.__input_textShadow + 'rgba(0,0,0,0.7)'
    });
    dom.bind(_this2.__saturation_field, 'mousedown', fieldDown);
    dom.bind(_this2.__saturation_field, 'touchstart', fieldDown);
    dom.bind(_this2.__field_knob, 'mousedown', fieldDown);
    dom.bind(_this2.__field_knob, 'touchstart', fieldDown);
    dom.bind(_this2.__hue_field, 'mousedown', fieldDownH);
    dom.bind(_this2.__hue_field, 'touchstart', fieldDownH);

    function fieldDown(e) {
      setSV(e);
      dom.bind(window, 'mousemove', setSV);
      dom.bind(window, 'touchmove', setSV);
      dom.bind(window, 'mouseup', fieldUpSV);
      dom.bind(window, 'touchend', fieldUpSV);
    }

    function fieldDownH(e) {
      setH(e);
      dom.bind(window, 'mousemove', setH);
      dom.bind(window, 'touchmove', setH);
      dom.bind(window, 'mouseup', fieldUpH);
      dom.bind(window, 'touchend', fieldUpH);
    }

    function fieldUpSV() {
      dom.unbind(window, 'mousemove', setSV);
      dom.unbind(window, 'touchmove', setSV);
      dom.unbind(window, 'mouseup', fieldUpSV);
      dom.unbind(window, 'touchend', fieldUpSV);
      onFinish();
    }

    function fieldUpH() {
      dom.unbind(window, 'mousemove', setH);
      dom.unbind(window, 'touchmove', setH);
      dom.unbind(window, 'mouseup', fieldUpH);
      dom.unbind(window, 'touchend', fieldUpH);
      onFinish();
    }

    function onBlur() {
      var i = interpret(this.value);

      if (i !== false) {
        _this.__color.__state = i;

        _this.setValue(_this.__color.toOriginal());
      } else {
        this.value = _this.__color.toString();
      }
    }

    function onFinish() {
      if (_this.__onFinishChange) {
        _this.__onFinishChange.call(_this, _this.__color.toOriginal());
      }
    }

    _this2.__saturation_field.appendChild(valueField);

    _this2.__selector.appendChild(_this2.__field_knob);

    _this2.__selector.appendChild(_this2.__saturation_field);

    _this2.__selector.appendChild(_this2.__hue_field);

    _this2.__hue_field.appendChild(_this2.__hue_knob);

    _this2.domElement.appendChild(_this2.__input);

    _this2.domElement.appendChild(_this2.__selector);

    _this2.updateDisplay();

    function setSV(e) {
      if (e.type.indexOf('touch') === -1) {
        e.preventDefault();
      }

      var fieldRect = _this.__saturation_field.getBoundingClientRect();

      var _ref = e.touches && e.touches[0] || e,
          clientX = _ref.clientX,
          clientY = _ref.clientY;

      var s = (clientX - fieldRect.left) / (fieldRect.right - fieldRect.left);
      var v = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

      if (v > 1) {
        v = 1;
      } else if (v < 0) {
        v = 0;
      }

      if (s > 1) {
        s = 1;
      } else if (s < 0) {
        s = 0;
      }

      _this.__color.v = v;
      _this.__color.s = s;

      _this.setValue(_this.__color.toOriginal());

      return false;
    }

    function setH(e) {
      if (e.type.indexOf('touch') === -1) {
        e.preventDefault();
      }

      var fieldRect = _this.__hue_field.getBoundingClientRect();

      var _ref2 = e.touches && e.touches[0] || e,
          clientY = _ref2.clientY;

      var h = 1 - (clientY - fieldRect.top) / (fieldRect.bottom - fieldRect.top);

      if (h > 1) {
        h = 1;
      } else if (h < 0) {
        h = 0;
      }

      _this.__color.h = h * 360;

      _this.setValue(_this.__color.toOriginal());

      return false;
    }

    return _this2;
  }

  createClass(ColorController, [{
    key: 'updateDisplay',
    value: function updateDisplay() {
      var i = interpret(this.getValue());

      if (i !== false) {
        var mismatch = false;
        Common.each(Color.COMPONENTS, function (component) {
          if (!Common.isUndefined(i[component]) && !Common.isUndefined(this.__color.__state[component]) && i[component] !== this.__color.__state[component]) {
            mismatch = true;
            return {};
          }
        }, this);

        if (mismatch) {
          Common.extend(this.__color.__state, i);
        }
      }

      Common.extend(this.__temp.__state, this.__color.__state);
      this.__temp.a = 1;
      var flip = this.__color.v < 0.5 || this.__color.s > 0.5 ? 255 : 0;

      var _flip = 255 - flip;

      Common.extend(this.__field_knob.style, {
        marginLeft: 100 * this.__color.s - 7 + 'px',
        marginTop: 100 * (1 - this.__color.v) - 7 + 'px',
        backgroundColor: this.__temp.toHexString(),
        border: this.__field_knob_border + 'rgb(' + flip + ',' + flip + ',' + flip + ')'
      });
      this.__hue_knob.style.marginTop = (1 - this.__color.h / 360) * 100 + 'px';
      this.__temp.s = 1;
      this.__temp.v = 1;
      linearGradient(this.__saturation_field, 'left', '#fff', this.__temp.toHexString());
      this.__input.value = this.__color.toString();
      Common.extend(this.__input.style, {
        backgroundColor: this.__color.toHexString(),
        color: 'rgb(' + flip + ',' + flip + ',' + flip + ')',
        textShadow: this.__input_textShadow + 'rgba(' + _flip + ',' + _flip + ',' + _flip + ',.7)'
      });
    }
  }]);
  return ColorController;
}(Controller);

var vendors = ['-moz-', '-o-', '-webkit-', '-ms-', ''];

function linearGradient(elem, x, a, b) {
  elem.style.background = '';
  Common.each(vendors, function (vendor) {
    elem.style.cssText += 'background: ' + vendor + 'linear-gradient(' + x + ', ' + a + ' 0%, ' + b + ' 100%); ';
  });
}

function hueGradient(elem) {
  elem.style.background = '';
  elem.style.cssText += 'background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);';
  elem.style.cssText += 'background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
  elem.style.cssText += 'background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);';
}

var css = {
  load: function load(url, indoc) {
    var doc = indoc || document;
    var link = doc.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = url;
    doc.getElementsByTagName('head')[0].appendChild(link);
  },
  inject: function inject(cssContent, indoc) {
    var doc = indoc || document;
    var injected = document.createElement('style');
    injected.type = 'text/css';
    injected.innerHTML = cssContent;
    var head = doc.getElementsByTagName('head')[0];

    try {
      head.appendChild(injected);
    } catch (e) {}
  }
};
var saveDialogContents = '<div id="dg-save" class="dg dialogue">\n\n  Here\'s the new load parameter for your <code>GUI</code>\'s constructor:\n\n  <textarea id="dg-new-constructor"></textarea>\n\n  <div id="dg-save-locally">\n\n    <input id="dg-local-storage" type="checkbox"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id="dg-local-explain">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>\'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n\n    </div>\n\n  </div>\n\n</div>';

var ControllerFactory = function ControllerFactory(object, property) {
  var initialValue = object[property];

  if (Common.isArray(arguments[2]) || Common.isObject(arguments[2])) {
    return new OptionController(object, property, arguments[2]);
  }

  if (Common.isNumber(initialValue)) {
    if (Common.isNumber(arguments[2]) && Common.isNumber(arguments[3])) {
      if (Common.isNumber(arguments[4])) {
        return new NumberControllerSlider(object, property, arguments[2], arguments[3], arguments[4]);
      }

      return new NumberControllerSlider(object, property, arguments[2], arguments[3]);
    }

    if (Common.isNumber(arguments[4])) {
      return new NumberControllerBox(object, property, {
        min: arguments[2],
        max: arguments[3],
        step: arguments[4]
      });
    }

    return new NumberControllerBox(object, property, {
      min: arguments[2],
      max: arguments[3]
    });
  }

  if (Common.isString(initialValue)) {
    return new StringController(object, property);
  }

  if (Common.isFunction(initialValue)) {
    return new FunctionController(object, property, '');
  }

  if (Common.isBoolean(initialValue)) {
    return new BooleanController(object, property);
  }

  return null;
};

function requestAnimationFrame$1(callback) {
  setTimeout(callback, 1000 / 60);
}

var requestAnimationFrame$1$1 = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || requestAnimationFrame$1;

var CenteredDiv = function () {
  function CenteredDiv() {
    classCallCheck(this, CenteredDiv);
    this.backgroundElement = document.createElement('div');
    Common.extend(this.backgroundElement.style, {
      backgroundColor: 'rgba(0,0,0,0.8)',
      top: 0,
      left: 0,
      display: 'none',
      zIndex: '1000',
      opacity: 0,
      WebkitTransition: 'opacity 0.2s linear',
      transition: 'opacity 0.2s linear'
    });
    dom.makeFullscreen(this.backgroundElement);
    this.backgroundElement.style.position = 'fixed';
    this.domElement = document.createElement('div');
    Common.extend(this.domElement.style, {
      position: 'fixed',
      display: 'none',
      zIndex: '1001',
      opacity: 0,
      WebkitTransition: '-webkit-transform 0.2s ease-out, opacity 0.2s linear',
      transition: 'transform 0.2s ease-out, opacity 0.2s linear'
    });
    document.body.appendChild(this.backgroundElement);
    document.body.appendChild(this.domElement);

    var _this = this;

    dom.bind(this.backgroundElement, 'click', function () {
      _this.hide();
    });
  }

  createClass(CenteredDiv, [{
    key: 'show',
    value: function show() {
      var _this = this;

      this.backgroundElement.style.display = 'block';
      this.domElement.style.display = 'block';
      this.domElement.style.opacity = 0;
      this.domElement.style.webkitTransform = 'scale(1.1)';
      this.layout();
      Common.defer(function () {
        _this.backgroundElement.style.opacity = 1;
        _this.domElement.style.opacity = 1;
        _this.domElement.style.webkitTransform = 'scale(1)';
      });
    }
  }, {
    key: 'hide',
    value: function hide() {
      var _this = this;

      var hide = function hide() {
        _this.domElement.style.display = 'none';
        _this.backgroundElement.style.display = 'none';
        dom.unbind(_this.domElement, 'webkitTransitionEnd', hide);
        dom.unbind(_this.domElement, 'transitionend', hide);
        dom.unbind(_this.domElement, 'oTransitionEnd', hide);
      };

      dom.bind(this.domElement, 'webkitTransitionEnd', hide);
      dom.bind(this.domElement, 'transitionend', hide);
      dom.bind(this.domElement, 'oTransitionEnd', hide);
      this.backgroundElement.style.opacity = 0;
      this.domElement.style.opacity = 0;
      this.domElement.style.webkitTransform = 'scale(1.1)';
    }
  }, {
    key: 'layout',
    value: function layout() {
      this.domElement.style.left = window.innerWidth / 2 - dom.getWidth(this.domElement) / 2 + 'px';
      this.domElement.style.top = window.innerHeight / 2 - dom.getHeight(this.domElement) / 2 + 'px';
    }
  }]);
  return CenteredDiv;
}();

var styleSheet = ___$insertStyle(".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity .1s linear;-o-transition:opacity .1s linear;-moz-transition:opacity .1s linear;transition:opacity .1s linear;border:0;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button.close-top{position:relative}.dg.main .close-button.close-bottom{position:absolute}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-y:visible}.dg.a.has-save>ul.close-top{margin-top:0}.dg.a.has-save>ul.close-bottom{margin-top:27px}.dg.a.has-save>ul.closed{margin-top:0}.dg.a .save-row{top:0;z-index:1002}.dg.a .save-row.close-top{position:relative}.dg.a .save-row.close-bottom{position:fixed}.dg li{-webkit-transition:height .1s ease-out;-o-transition:height .1s ease-out;-moz-transition:height .1s ease-out;transition:height .1s ease-out;-webkit-transition:overflow .1s linear;-o-transition:overflow .1s linear;-moz-transition:overflow .1s linear;transition:overflow .1s linear}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li>*{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px;overflow:hidden}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%;position:relative}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:7px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .cr.color{overflow:visible}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.color{border-left:3px solid}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2FA1D6}.dg .cr.number input[type=text]{color:#2FA1D6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2FA1D6;max-width:100%}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n");

css.inject(styleSheet);
var CSS_NAMESPACE = 'dg';
var HIDE_KEY_CODE = 192;
var CLOSE_BUTTON_HEIGHT = 20;
var DEFAULT_DEFAULT_PRESET_NAME = 'Default';

var SUPPORTS_LOCAL_STORAGE = function () {
  try {
    return !!window.localStorage;
  } catch (e) {
    return false;
  }
}();

var SAVE_DIALOGUE = void 0;
var autoPlaceVirgin = true;
var autoPlaceContainer = void 0;
var hide = false;
var hideableGuis = [];

var GUI = function GUI(pars) {
  var _this = this;

  var params = pars || {};
  this.domElement = document.createElement('div');
  this.__ul = document.createElement('ul');
  this.domElement.appendChild(this.__ul);
  dom.addClass(this.domElement, CSS_NAMESPACE);
  this.__folders = {};
  this.__controllers = [];
  this.__rememberedObjects = [];
  this.__rememberedObjectIndecesToControllers = [];
  this.__listening = [];
  params = Common.defaults(params, {
    closeOnTop: false,
    autoPlace: true,
    width: GUI.DEFAULT_WIDTH
  });
  params = Common.defaults(params, {
    resizable: params.autoPlace,
    hideable: params.autoPlace
  });

  if (!Common.isUndefined(params.load)) {
    if (params.preset) {
      params.load.preset = params.preset;
    }
  } else {
    params.load = {
      preset: DEFAULT_DEFAULT_PRESET_NAME
    };
  }

  if (Common.isUndefined(params.parent) && params.hideable) {
    hideableGuis.push(this);
  }

  params.resizable = Common.isUndefined(params.parent) && params.resizable;

  if (params.autoPlace && Common.isUndefined(params.scrollable)) {
    params.scrollable = true;
  }

  var useLocalStorage = SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(this, 'isLocal')) === 'true';
  var saveToLocalStorage = void 0;
  var titleRow = void 0;
  Object.defineProperties(this, {
    parent: {
      get: function get$$1() {
        return params.parent;
      }
    },
    scrollable: {
      get: function get$$1() {
        return params.scrollable;
      }
    },
    autoPlace: {
      get: function get$$1() {
        return params.autoPlace;
      }
    },
    closeOnTop: {
      get: function get$$1() {
        return params.closeOnTop;
      }
    },
    preset: {
      get: function get$$1() {
        if (_this.parent) {
          return _this.getRoot().preset;
        }

        return params.load.preset;
      },
      set: function set$$1(v) {
        if (_this.parent) {
          _this.getRoot().preset = v;
        } else {
          params.load.preset = v;
        }

        setPresetSelectIndex(this);

        _this.revert();
      }
    },
    width: {
      get: function get$$1() {
        return params.width;
      },
      set: function set$$1(v) {
        params.width = v;
        setWidth(_this, v);
      }
    },
    name: {
      get: function get$$1() {
        return params.name;
      },
      set: function set$$1(v) {
        params.name = v;

        if (titleRow) {
          titleRow.innerHTML = params.name;
        }
      }
    },
    closed: {
      get: function get$$1() {
        return params.closed;
      },
      set: function set$$1(v) {
        params.closed = v;

        if (params.closed) {
          dom.addClass(_this.__ul, GUI.CLASS_CLOSED);
        } else {
          dom.removeClass(_this.__ul, GUI.CLASS_CLOSED);
        }

        this.onResize();

        if (_this.__closeButton) {
          _this.__closeButton.innerHTML = v ? GUI.TEXT_OPEN : GUI.TEXT_CLOSED;
        }
      }
    },
    load: {
      get: function get$$1() {
        return params.load;
      }
    },
    useLocalStorage: {
      get: function get$$1() {
        return useLocalStorage;
      },
      set: function set$$1(bool) {
        if (SUPPORTS_LOCAL_STORAGE) {
          useLocalStorage = bool;

          if (bool) {
            dom.bind(window, 'unload', saveToLocalStorage);
          } else {
            dom.unbind(window, 'unload', saveToLocalStorage);
          }

          localStorage.setItem(getLocalStorageHash(_this, 'isLocal'), bool);
        }
      }
    }
  });

  if (Common.isUndefined(params.parent)) {
    this.closed = params.closed || false;
    dom.addClass(this.domElement, GUI.CLASS_MAIN);
    dom.makeSelectable(this.domElement, false);

    if (SUPPORTS_LOCAL_STORAGE) {
      if (useLocalStorage) {
        _this.useLocalStorage = true;
        var savedGui = localStorage.getItem(getLocalStorageHash(this, 'gui'));

        if (savedGui) {
          params.load = JSON.parse(savedGui);
        }
      }
    }

    this.__closeButton = document.createElement('div');
    this.__closeButton.innerHTML = GUI.TEXT_CLOSED;
    dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BUTTON);

    if (params.closeOnTop) {
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_TOP);
      this.domElement.insertBefore(this.__closeButton, this.domElement.childNodes[0]);
    } else {
      dom.addClass(this.__closeButton, GUI.CLASS_CLOSE_BOTTOM);
      this.domElement.appendChild(this.__closeButton);
    }

    dom.bind(this.__closeButton, 'click', function () {
      _this.closed = !_this.closed;
    });
  } else {
    if (params.closed === undefined) {
      params.closed = true;
    }

    var titleRowName = document.createTextNode(params.name);
    dom.addClass(titleRowName, 'controller-name');
    titleRow = addRow(_this, titleRowName);

    var onClickTitle = function onClickTitle(e) {
      e.preventDefault();
      _this.closed = !_this.closed;
      return false;
    };

    dom.addClass(this.__ul, GUI.CLASS_CLOSED);
    dom.addClass(titleRow, 'title');
    dom.bind(titleRow, 'click', onClickTitle);

    if (!params.closed) {
      this.closed = false;
    }
  }

  if (params.autoPlace) {
    if (Common.isUndefined(params.parent)) {
      if (autoPlaceVirgin) {
        autoPlaceContainer = document.createElement('div');
        dom.addClass(autoPlaceContainer, CSS_NAMESPACE);
        dom.addClass(autoPlaceContainer, GUI.CLASS_AUTO_PLACE_CONTAINER);
        document.body.appendChild(autoPlaceContainer);
        autoPlaceVirgin = false;
      }

      autoPlaceContainer.appendChild(this.domElement);
      dom.addClass(this.domElement, GUI.CLASS_AUTO_PLACE);
    }

    if (!this.parent) {
      setWidth(_this, params.width);
    }
  }

  this.__resizeHandler = function () {
    _this.onResizeDebounced();
  };

  dom.bind(window, 'resize', this.__resizeHandler);
  dom.bind(this.__ul, 'webkitTransitionEnd', this.__resizeHandler);
  dom.bind(this.__ul, 'transitionend', this.__resizeHandler);
  dom.bind(this.__ul, 'oTransitionEnd', this.__resizeHandler);
  this.onResize();

  if (params.resizable) {
    addResizeHandle(this);
  }

  saveToLocalStorage = function saveToLocalStorage() {
    if (SUPPORTS_LOCAL_STORAGE && localStorage.getItem(getLocalStorageHash(_this, 'isLocal')) === 'true') {
      localStorage.setItem(getLocalStorageHash(_this, 'gui'), JSON.stringify(_this.getSaveObject()));
    }
  };

  this.saveToLocalStorageIfPossible = saveToLocalStorage;

  function resetWidth() {
    var root = _this.getRoot();

    root.width += 1;
    Common.defer(function () {
      root.width -= 1;
    });
  }

  if (!params.parent) {
    resetWidth();
  }
};

GUI.toggleHide = function () {
  hide = !hide;
  Common.each(hideableGuis, function (gui) {
    gui.domElement.style.display = hide ? 'none' : '';
  });
};

GUI.CLASS_AUTO_PLACE = 'a';
GUI.CLASS_AUTO_PLACE_CONTAINER = 'ac';
GUI.CLASS_MAIN = 'main';
GUI.CLASS_CONTROLLER_ROW = 'cr';
GUI.CLASS_TOO_TALL = 'taller-than-window';
GUI.CLASS_CLOSED = 'closed';
GUI.CLASS_CLOSE_BUTTON = 'close-button';
GUI.CLASS_CLOSE_TOP = 'close-top';
GUI.CLASS_CLOSE_BOTTOM = 'close-bottom';
GUI.CLASS_DRAG = 'drag';
GUI.DEFAULT_WIDTH = 245;
GUI.TEXT_CLOSED = 'Close Controls';
GUI.TEXT_OPEN = 'Open Controls';

GUI._keydownHandler = function (e) {
  if (document.activeElement.type !== 'text' && (e.which === HIDE_KEY_CODE || e.keyCode === HIDE_KEY_CODE)) {
    GUI.toggleHide();
  }
};

dom.bind(window, 'keydown', GUI._keydownHandler, false);
Common.extend(GUI.prototype, {
  add: function add(object, property) {
    return _add(this, object, property, {
      factoryArgs: Array.prototype.slice.call(arguments, 2)
    });
  },
  addColor: function addColor(object, property) {
    return _add(this, object, property, {
      color: true
    });
  },
  remove: function remove(controller) {
    this.__ul.removeChild(controller.__li);

    this.__controllers.splice(this.__controllers.indexOf(controller), 1);

    var _this = this;

    Common.defer(function () {
      _this.onResize();
    });
  },
  destroy: function destroy() {
    if (this.parent) {
      throw new Error('Only the root GUI should be removed with .destroy(). ' + 'For subfolders, use gui.removeFolder(folder) instead.');
    }

    if (this.autoPlace) {
      autoPlaceContainer.removeChild(this.domElement);
    }

    var _this = this;

    Common.each(this.__folders, function (subfolder) {
      _this.removeFolder(subfolder);
    });
    dom.unbind(window, 'keydown', GUI._keydownHandler, false);
    removeListeners(this);
  },
  addFolder: function addFolder(name) {
    if (this.__folders[name] !== undefined) {
      throw new Error('You already have a folder in this GUI by the' + ' name "' + name + '"');
    }

    var newGuiParams = {
      name: name,
      parent: this
    };
    newGuiParams.autoPlace = this.autoPlace;

    if (this.load && this.load.folders && this.load.folders[name]) {
      newGuiParams.closed = this.load.folders[name].closed;
      newGuiParams.load = this.load.folders[name];
    }

    var gui = new GUI(newGuiParams);
    this.__folders[name] = gui;
    var li = addRow(this, gui.domElement);
    dom.addClass(li, 'folder');
    return gui;
  },
  removeFolder: function removeFolder(folder) {
    this.__ul.removeChild(folder.domElement.parentElement);

    delete this.__folders[folder.name];

    if (this.load && this.load.folders && this.load.folders[folder.name]) {
      delete this.load.folders[folder.name];
    }

    removeListeners(folder);

    var _this = this;

    Common.each(folder.__folders, function (subfolder) {
      folder.removeFolder(subfolder);
    });
    Common.defer(function () {
      _this.onResize();
    });
  },
  open: function open() {
    this.closed = false;
  },
  close: function close() {
    this.closed = true;
  },
  hide: function hide() {
    this.domElement.style.display = 'none';
  },
  show: function show() {
    this.domElement.style.display = '';
  },
  onResize: function onResize() {
    var root = this.getRoot();

    if (root.scrollable) {
      var top = dom.getOffset(root.__ul).top;
      var h = 0;
      Common.each(root.__ul.childNodes, function (node) {
        if (!(root.autoPlace && node === root.__save_row)) {
          h += dom.getHeight(node);
        }
      });

      if (window.innerHeight - top - CLOSE_BUTTON_HEIGHT < h) {
        dom.addClass(root.domElement, GUI.CLASS_TOO_TALL);
        root.__ul.style.height = window.innerHeight - top - CLOSE_BUTTON_HEIGHT + 'px';
      } else {
        dom.removeClass(root.domElement, GUI.CLASS_TOO_TALL);
        root.__ul.style.height = 'auto';
      }
    }

    if (root.__resize_handle) {
      Common.defer(function () {
        root.__resize_handle.style.height = root.__ul.offsetHeight + 'px';
      });
    }

    if (root.__closeButton) {
      root.__closeButton.style.width = root.width + 'px';
    }
  },
  onResizeDebounced: Common.debounce(function () {
    this.onResize();
  }, 50),
  remember: function remember() {
    if (Common.isUndefined(SAVE_DIALOGUE)) {
      SAVE_DIALOGUE = new CenteredDiv();
      SAVE_DIALOGUE.domElement.innerHTML = saveDialogContents;
    }

    if (this.parent) {
      throw new Error('You can only call remember on a top level GUI.');
    }

    var _this = this;

    Common.each(Array.prototype.slice.call(arguments), function (object) {
      if (_this.__rememberedObjects.length === 0) {
        addSaveMenu(_this);
      }

      if (_this.__rememberedObjects.indexOf(object) === -1) {
        _this.__rememberedObjects.push(object);
      }
    });

    if (this.autoPlace) {
      setWidth(this, this.width);
    }
  },
  getRoot: function getRoot() {
    var gui = this;

    while (gui.parent) {
      gui = gui.parent;
    }

    return gui;
  },
  getSaveObject: function getSaveObject() {
    var toReturn = this.load;
    toReturn.closed = this.closed;

    if (this.__rememberedObjects.length > 0) {
      toReturn.preset = this.preset;

      if (!toReturn.remembered) {
        toReturn.remembered = {};
      }

      toReturn.remembered[this.preset] = getCurrentPreset(this);
    }

    toReturn.folders = {};
    Common.each(this.__folders, function (element, key) {
      toReturn.folders[key] = element.getSaveObject();
    });
    return toReturn;
  },
  save: function save() {
    if (!this.load.remembered) {
      this.load.remembered = {};
    }

    this.load.remembered[this.preset] = getCurrentPreset(this);
    markPresetModified(this, false);
    this.saveToLocalStorageIfPossible();
  },
  saveAs: function saveAs(presetName) {
    if (!this.load.remembered) {
      this.load.remembered = {};
      this.load.remembered[DEFAULT_DEFAULT_PRESET_NAME] = getCurrentPreset(this, true);
    }

    this.load.remembered[presetName] = getCurrentPreset(this);
    this.preset = presetName;
    addPresetOption(this, presetName, true);
    this.saveToLocalStorageIfPossible();
  },
  revert: function revert(gui) {
    Common.each(this.__controllers, function (controller) {
      if (!this.getRoot().load.remembered) {
        controller.setValue(controller.initialValue);
      } else {
        recallSavedValue(gui || this.getRoot(), controller);
      }

      if (controller.__onFinishChange) {
        controller.__onFinishChange.call(controller, controller.getValue());
      }
    }, this);
    Common.each(this.__folders, function (folder) {
      folder.revert(folder);
    });

    if (!gui) {
      markPresetModified(this.getRoot(), false);
    }
  },
  listen: function listen(controller) {
    var init = this.__listening.length === 0;

    this.__listening.push(controller);

    if (init) {
      updateDisplays(this.__listening);
    }
  },
  updateDisplay: function updateDisplay() {
    Common.each(this.__controllers, function (controller) {
      controller.updateDisplay();
    });
    Common.each(this.__folders, function (folder) {
      folder.updateDisplay();
    });
  }
});

function addRow(gui, newDom, liBefore) {
  var li = document.createElement('li');

  if (newDom) {
    li.appendChild(newDom);
  }

  if (liBefore) {
    gui.__ul.insertBefore(li, liBefore);
  } else {
    gui.__ul.appendChild(li);
  }

  gui.onResize();
  return li;
}

function removeListeners(gui) {
  dom.unbind(window, 'resize', gui.__resizeHandler);

  if (gui.saveToLocalStorageIfPossible) {
    dom.unbind(window, 'unload', gui.saveToLocalStorageIfPossible);
  }
}

function markPresetModified(gui, modified) {
  var opt = gui.__preset_select[gui.__preset_select.selectedIndex];

  if (modified) {
    opt.innerHTML = opt.value + '*';
  } else {
    opt.innerHTML = opt.value;
  }
}

function augmentController(gui, li, controller) {
  controller.__li = li;
  controller.__gui = gui;
  Common.extend(controller, {
    options: function options(_options) {
      if (arguments.length > 1) {
        var nextSibling = controller.__li.nextElementSibling;
        controller.remove();
        return _add(gui, controller.object, controller.property, {
          before: nextSibling,
          factoryArgs: [Common.toArray(arguments)]
        });
      }

      if (Common.isArray(_options) || Common.isObject(_options)) {
        var _nextSibling = controller.__li.nextElementSibling;
        controller.remove();
        return _add(gui, controller.object, controller.property, {
          before: _nextSibling,
          factoryArgs: [_options]
        });
      }
    },
    name: function name(_name) {
      controller.__li.firstElementChild.firstElementChild.innerHTML = _name;
      return controller;
    },
    listen: function listen() {
      controller.__gui.listen(controller);

      return controller;
    },
    remove: function remove() {
      controller.__gui.remove(controller);

      return controller;
    }
  });

  if (controller instanceof NumberControllerSlider) {
    var box = new NumberControllerBox(controller.object, controller.property, {
      min: controller.__min,
      max: controller.__max,
      step: controller.__step
    });
    Common.each(['updateDisplay', 'onChange', 'onFinishChange', 'step', 'min', 'max'], function (method) {
      var pc = controller[method];
      var pb = box[method];

      controller[method] = box[method] = function () {
        var args = Array.prototype.slice.call(arguments);
        pb.apply(box, args);
        return pc.apply(controller, args);
      };
    });
    dom.addClass(li, 'has-slider');
    controller.domElement.insertBefore(box.domElement, controller.domElement.firstElementChild);
  } else if (controller instanceof NumberControllerBox) {
    var r = function r(returned) {
      if (Common.isNumber(controller.__min) && Common.isNumber(controller.__max)) {
        var oldName = controller.__li.firstElementChild.firstElementChild.innerHTML;
        var wasListening = controller.__gui.__listening.indexOf(controller) > -1;
        controller.remove();

        var newController = _add(gui, controller.object, controller.property, {
          before: controller.__li.nextElementSibling,
          factoryArgs: [controller.__min, controller.__max, controller.__step]
        });

        newController.name(oldName);
        if (wasListening) newController.listen();
        return newController;
      }

      return returned;
    };

    controller.min = Common.compose(r, controller.min);
    controller.max = Common.compose(r, controller.max);
  } else if (controller instanceof BooleanController) {
    dom.bind(li, 'click', function () {
      dom.fakeEvent(controller.__checkbox, 'click');
    });
    dom.bind(controller.__checkbox, 'click', function (e) {
      e.stopPropagation();
    });
  } else if (controller instanceof FunctionController) {
    dom.bind(li, 'click', function () {
      dom.fakeEvent(controller.__button, 'click');
    });
    dom.bind(li, 'mouseover', function () {
      dom.addClass(controller.__button, 'hover');
    });
    dom.bind(li, 'mouseout', function () {
      dom.removeClass(controller.__button, 'hover');
    });
  } else if (controller instanceof ColorController) {
    dom.addClass(li, 'color');
    controller.updateDisplay = Common.compose(function (val) {
      li.style.borderLeftColor = controller.__color.toString();
      return val;
    }, controller.updateDisplay);
    controller.updateDisplay();
  }

  controller.setValue = Common.compose(function (val) {
    if (gui.getRoot().__preset_select && controller.isModified()) {
      markPresetModified(gui.getRoot(), true);
    }

    return val;
  }, controller.setValue);
}

function recallSavedValue(gui, controller) {
  var root = gui.getRoot();

  var matchedIndex = root.__rememberedObjects.indexOf(controller.object);

  if (matchedIndex !== -1) {
    var controllerMap = root.__rememberedObjectIndecesToControllers[matchedIndex];

    if (controllerMap === undefined) {
      controllerMap = {};
      root.__rememberedObjectIndecesToControllers[matchedIndex] = controllerMap;
    }

    controllerMap[controller.property] = controller;

    if (root.load && root.load.remembered) {
      var presetMap = root.load.remembered;
      var preset = void 0;

      if (presetMap[gui.preset]) {
        preset = presetMap[gui.preset];
      } else if (presetMap[DEFAULT_DEFAULT_PRESET_NAME]) {
        preset = presetMap[DEFAULT_DEFAULT_PRESET_NAME];
      } else {
        return;
      }

      if (preset[matchedIndex] && preset[matchedIndex][controller.property] !== undefined) {
        var value = preset[matchedIndex][controller.property];
        controller.initialValue = value;
        controller.setValue(value);
      }
    }
  }
}

function _add(gui, object, property, params) {
  if (object[property] === undefined) {
    throw new Error('Object "' + object + '" has no property "' + property + '"');
  }

  var controller = void 0;

  if (params.color) {
    controller = new ColorController(object, property);
  } else {
    var factoryArgs = [object, property].concat(params.factoryArgs);
    controller = ControllerFactory.apply(gui, factoryArgs);
  }

  if (params.before instanceof Controller) {
    params.before = params.before.__li;
  }

  recallSavedValue(gui, controller);
  dom.addClass(controller.domElement, 'c');
  var name = document.createElement('span');
  dom.addClass(name, 'property-name');
  name.innerHTML = controller.property;
  var container = document.createElement('div');
  container.appendChild(name);
  container.appendChild(controller.domElement);
  var li = addRow(gui, container, params.before);
  dom.addClass(li, GUI.CLASS_CONTROLLER_ROW);

  if (controller instanceof ColorController) {
    dom.addClass(li, 'color');
  } else {
    dom.addClass(li, _typeof(controller.getValue()));
  }

  augmentController(gui, li, controller);

  gui.__controllers.push(controller);

  return controller;
}

function getLocalStorageHash(gui, key) {
  return document.location.href + '.' + key;
}

function addPresetOption(gui, name, setSelected) {
  var opt = document.createElement('option');
  opt.innerHTML = name;
  opt.value = name;

  gui.__preset_select.appendChild(opt);

  if (setSelected) {
    gui.__preset_select.selectedIndex = gui.__preset_select.length - 1;
  }
}

function showHideExplain(gui, explain) {
  explain.style.display = gui.useLocalStorage ? 'block' : 'none';
}

function addSaveMenu(gui) {
  var div = gui.__save_row = document.createElement('li');
  dom.addClass(gui.domElement, 'has-save');

  gui.__ul.insertBefore(div, gui.__ul.firstChild);

  dom.addClass(div, 'save-row');
  var gears = document.createElement('span');
  gears.innerHTML = '&nbsp;';
  dom.addClass(gears, 'button gears');
  var button = document.createElement('span');
  button.innerHTML = 'Save';
  dom.addClass(button, 'button');
  dom.addClass(button, 'save');
  var button2 = document.createElement('span');
  button2.innerHTML = 'New';
  dom.addClass(button2, 'button');
  dom.addClass(button2, 'save-as');
  var button3 = document.createElement('span');
  button3.innerHTML = 'Revert';
  dom.addClass(button3, 'button');
  dom.addClass(button3, 'revert');
  var select = gui.__preset_select = document.createElement('select');

  if (gui.load && gui.load.remembered) {
    Common.each(gui.load.remembered, function (value, key) {
      addPresetOption(gui, key, key === gui.preset);
    });
  } else {
    addPresetOption(gui, DEFAULT_DEFAULT_PRESET_NAME, false);
  }

  dom.bind(select, 'change', function () {
    for (var index = 0; index < gui.__preset_select.length; index++) {
      gui.__preset_select[index].innerHTML = gui.__preset_select[index].value;
    }

    gui.preset = this.value;
  });
  div.appendChild(select);
  div.appendChild(gears);
  div.appendChild(button);
  div.appendChild(button2);
  div.appendChild(button3);

  if (SUPPORTS_LOCAL_STORAGE) {
    var explain = document.getElementById('dg-local-explain');
    var localStorageCheckBox = document.getElementById('dg-local-storage');
    var saveLocally = document.getElementById('dg-save-locally');
    saveLocally.style.display = 'block';

    if (localStorage.getItem(getLocalStorageHash(gui, 'isLocal')) === 'true') {
      localStorageCheckBox.setAttribute('checked', 'checked');
    }

    showHideExplain(gui, explain);
    dom.bind(localStorageCheckBox, 'change', function () {
      gui.useLocalStorage = !gui.useLocalStorage;
      showHideExplain(gui, explain);
    });
  }

  var newConstructorTextArea = document.getElementById('dg-new-constructor');
  dom.bind(newConstructorTextArea, 'keydown', function (e) {
    if (e.metaKey && (e.which === 67 || e.keyCode === 67)) {
      SAVE_DIALOGUE.hide();
    }
  });
  dom.bind(gears, 'click', function () {
    newConstructorTextArea.innerHTML = JSON.stringify(gui.getSaveObject(), undefined, 2);
    SAVE_DIALOGUE.show();
    newConstructorTextArea.focus();
    newConstructorTextArea.select();
  });
  dom.bind(button, 'click', function () {
    gui.save();
  });
  dom.bind(button2, 'click', function () {
    var presetName = prompt('Enter a new preset name.');

    if (presetName) {
      gui.saveAs(presetName);
    }
  });
  dom.bind(button3, 'click', function () {
    gui.revert();
  });
}

function addResizeHandle(gui) {
  var pmouseX = void 0;
  gui.__resize_handle = document.createElement('div');
  Common.extend(gui.__resize_handle.style, {
    width: '6px',
    marginLeft: '-3px',
    height: '200px',
    cursor: 'ew-resize',
    position: 'absolute'
  });

  function drag(e) {
    e.preventDefault();
    gui.width += pmouseX - e.clientX;
    gui.onResize();
    pmouseX = e.clientX;
    return false;
  }

  function dragStop() {
    dom.removeClass(gui.__closeButton, GUI.CLASS_DRAG);
    dom.unbind(window, 'mousemove', drag);
    dom.unbind(window, 'mouseup', dragStop);
  }

  function dragStart(e) {
    e.preventDefault();
    pmouseX = e.clientX;
    dom.addClass(gui.__closeButton, GUI.CLASS_DRAG);
    dom.bind(window, 'mousemove', drag);
    dom.bind(window, 'mouseup', dragStop);
    return false;
  }

  dom.bind(gui.__resize_handle, 'mousedown', dragStart);
  dom.bind(gui.__closeButton, 'mousedown', dragStart);
  gui.domElement.insertBefore(gui.__resize_handle, gui.domElement.firstElementChild);
}

function setWidth(gui, w) {
  gui.domElement.style.width = w + 'px';

  if (gui.__save_row && gui.autoPlace) {
    gui.__save_row.style.width = w + 'px';
  }

  if (gui.__closeButton) {
    gui.__closeButton.style.width = w + 'px';
  }
}

function getCurrentPreset(gui, useInitialValues) {
  var toReturn = {};
  Common.each(gui.__rememberedObjects, function (val, index) {
    var savedValues = {};
    var controllerMap = gui.__rememberedObjectIndecesToControllers[index];
    Common.each(controllerMap, function (controller, property) {
      savedValues[property] = useInitialValues ? controller.initialValue : controller.getValue();
    });
    toReturn[index] = savedValues;
  });
  return toReturn;
}

function setPresetSelectIndex(gui) {
  for (var index = 0; index < gui.__preset_select.length; index++) {
    if (gui.__preset_select[index].value === gui.preset) {
      gui.__preset_select.selectedIndex = index;
    }
  }
}

function updateDisplays(controllerArray) {
  if (controllerArray.length !== 0) {
    requestAnimationFrame$1$1.call(window, function () {
      updateDisplays(controllerArray);
    });
  }

  Common.each(controllerArray, function (c) {
    c.updateDisplay();
  });
}
var GUI$1 = GUI;

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
        this.gui = new GUI$1();
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

/** @license zlib.js 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */
var mod = {},
    l = void 0,
    aa = mod;

function r(c, d) {
  var a = c.split('.'),
      b = aa;
  !(a[0] in b) && b.execScript && b.execScript('var ' + a[0]);

  for (var e; a.length && (e = a.shift());) {
    !a.length && d !== l ? b[e] = d : b = b[e] ? b[e] : b[e] = {};
  }
}

var t = 'undefined' !== typeof Uint8Array && 'undefined' !== typeof Uint16Array && 'undefined' !== typeof Uint32Array && 'undefined' !== typeof DataView;

function v(c) {
  var d = c.length,
      a = 0,
      b = Number.POSITIVE_INFINITY,
      e,
      f,
      g,
      h,
      k,
      m,
      n,
      p,
      s,
      x;

  for (p = 0; p < d; ++p) {
    c[p] > a && (a = c[p]), c[p] < b && (b = c[p]);
  }

  e = 1 << a;
  f = new (t ? Uint32Array : Array)(e);
  g = 1;
  h = 0;

  for (k = 2; g <= a;) {
    for (p = 0; p < d; ++p) {
      if (c[p] === g) {
        m = 0;
        n = h;

        for (s = 0; s < g; ++s) {
          m = m << 1 | n & 1, n >>= 1;
        }

        x = g << 16 | p;

        for (s = m; s < e; s += k) {
          f[s] = x;
        }

        ++h;
      }
    }

    ++g;
    h <<= 1;
    k <<= 1;
  }

  return [f, a, b];
}

function w(c, d) {
  this.g = [];
  this.h = 32768;
  this.d = this.f = this.a = this.l = 0;
  this.input = t ? new Uint8Array(c) : c;
  this.m = !1;
  this.i = y;
  this.r = !1;
  if (d || !(d = {})) d.index && (this.a = d.index), d.bufferSize && (this.h = d.bufferSize), d.bufferType && (this.i = d.bufferType), d.resize && (this.r = d.resize);

  switch (this.i) {
    case A:
      this.b = 32768;
      this.c = new (t ? Uint8Array : Array)(32768 + this.h + 258);
      break;

    case y:
      this.b = 0;
      this.c = new (t ? Uint8Array : Array)(this.h);
      this.e = this.z;
      this.n = this.v;
      this.j = this.w;
      break;

    default:
      throw Error('invalid inflate mode');
  }
}

var A = 0,
    y = 1,
    B = {
  t: A,
  s: y
};

w.prototype.k = function () {
  for (; !this.m;) {
    var c = C(this, 3);
    c & 1 && (this.m = !0);
    c >>>= 1;

    switch (c) {
      case 0:
        var d = this.input,
            a = this.a,
            b = this.c,
            e = this.b,
            f = d.length,
            g = l,
            h = l,
            k = b.length,
            m = l;
        this.d = this.f = 0;
        if (a + 1 >= f) throw Error('invalid uncompressed block header: LEN');
        g = d[a++] | d[a++] << 8;
        if (a + 1 >= f) throw Error('invalid uncompressed block header: NLEN');
        h = d[a++] | d[a++] << 8;
        if (g === ~h) throw Error('invalid uncompressed block header: length verify');
        if (a + g > d.length) throw Error('input buffer is broken');

        switch (this.i) {
          case A:
            for (; e + g > b.length;) {
              m = k - e;
              g -= m;
              if (t) b.set(d.subarray(a, a + m), e), e += m, a += m;else for (; m--;) {
                b[e++] = d[a++];
              }
              this.b = e;
              b = this.e();
              e = this.b;
            }

            break;

          case y:
            for (; e + g > b.length;) {
              b = this.e({
                p: 2
              });
            }

            break;

          default:
            throw Error('invalid inflate mode');
        }

        if (t) b.set(d.subarray(a, a + g), e), e += g, a += g;else for (; g--;) {
          b[e++] = d[a++];
        }
        this.a = a;
        this.b = e;
        this.c = b;
        break;

      case 1:
        this.j(ba, ca);
        break;

      case 2:
        for (var n = C(this, 5) + 257, p = C(this, 5) + 1, s = C(this, 4) + 4, x = new (t ? Uint8Array : Array)(D.length), S = l, T = l, U = l, u = l, M = l, F = l, z = l, q = l, V = l, q = 0; q < s; ++q) {
          x[D[q]] = C(this, 3);
        }

        if (!t) {
          q = s;

          for (s = x.length; q < s; ++q) {
            x[D[q]] = 0;
          }
        }

        S = v(x);
        u = new (t ? Uint8Array : Array)(n + p);
        q = 0;

        for (V = n + p; q < V;) {
          switch (M = E(this, S), M) {
            case 16:
              for (z = 3 + C(this, 2); z--;) {
                u[q++] = F;
              }

              break;

            case 17:
              for (z = 3 + C(this, 3); z--;) {
                u[q++] = 0;
              }

              F = 0;
              break;

            case 18:
              for (z = 11 + C(this, 7); z--;) {
                u[q++] = 0;
              }

              F = 0;
              break;

            default:
              F = u[q++] = M;
          }
        }

        T = t ? v(u.subarray(0, n)) : v(u.slice(0, n));
        U = t ? v(u.subarray(n)) : v(u.slice(n));
        this.j(T, U);
        break;

      default:
        throw Error('unknown BTYPE: ' + c);
    }
  }

  return this.n();
};

var G = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
    D = t ? new Uint16Array(G) : G,
    H = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 258, 258],
    I = t ? new Uint16Array(H) : H,
    J = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0],
    K = t ? new Uint8Array(J) : J,
    L = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577],
    da = t ? new Uint16Array(L) : L,
    ea = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
    N = t ? new Uint8Array(ea) : ea,
    O = new (t ? Uint8Array : Array)(288),
    P,
    fa;
P = 0;

for (fa = O.length; P < fa; ++P) {
  O[P] = 143 >= P ? 8 : 255 >= P ? 9 : 279 >= P ? 7 : 8;
}

var ba = v(O),
    Q = new (t ? Uint8Array : Array)(30),
    R,
    ga;
R = 0;

for (ga = Q.length; R < ga; ++R) {
  Q[R] = 5;
}

var ca = v(Q);

function C(c, d) {
  for (var a = c.f, b = c.d, e = c.input, f = c.a, g = e.length, h; b < d;) {
    if (f >= g) throw Error('input buffer is broken');
    a |= e[f++] << b;
    b += 8;
  }

  h = a & (1 << d) - 1;
  c.f = a >>> d;
  c.d = b - d;
  c.a = f;
  return h;
}

function E(c, d) {
  for (var a = c.f, b = c.d, e = c.input, f = c.a, g = e.length, h = d[0], k = d[1], m, n; b < k && !(f >= g);) {
    a |= e[f++] << b, b += 8;
  }

  m = h[a & (1 << k) - 1];
  n = m >>> 16;
  if (n > b) throw Error('invalid code length: ' + n);
  c.f = a >> n;
  c.d = b - n;
  c.a = f;
  return m & 65535;
}

w.prototype.j = function (c, d) {
  var a = this.c,
      b = this.b;
  this.o = c;

  for (var e = a.length - 258, f, g, h, k; 256 !== (f = E(this, c));) {
    if (256 > f) b >= e && (this.b = b, a = this.e(), b = this.b), a[b++] = f;else {
      g = f - 257;
      k = I[g];
      0 < K[g] && (k += C(this, K[g]));
      f = E(this, d);
      h = da[f];
      0 < N[f] && (h += C(this, N[f]));
      b >= e && (this.b = b, a = this.e(), b = this.b);

      for (; k--;) {
        a[b] = a[b++ - h];
      }
    }
  }

  for (; 8 <= this.d;) {
    this.d -= 8, this.a--;
  }

  this.b = b;
};

w.prototype.w = function (c, d) {
  var a = this.c,
      b = this.b;
  this.o = c;

  for (var e = a.length, f, g, h, k; 256 !== (f = E(this, c));) {
    if (256 > f) b >= e && (a = this.e(), e = a.length), a[b++] = f;else {
      g = f - 257;
      k = I[g];
      0 < K[g] && (k += C(this, K[g]));
      f = E(this, d);
      h = da[f];
      0 < N[f] && (h += C(this, N[f]));
      b + k > e && (a = this.e(), e = a.length);

      for (; k--;) {
        a[b] = a[b++ - h];
      }
    }
  }

  for (; 8 <= this.d;) {
    this.d -= 8, this.a--;
  }

  this.b = b;
};

w.prototype.e = function () {
  var c = new (t ? Uint8Array : Array)(this.b - 32768),
      d = this.b - 32768,
      a,
      b,
      e = this.c;
  if (t) c.set(e.subarray(32768, c.length));else {
    a = 0;

    for (b = c.length; a < b; ++a) {
      c[a] = e[a + 32768];
    }
  }
  this.g.push(c);
  this.l += c.length;
  if (t) e.set(e.subarray(d, d + 32768));else for (a = 0; 32768 > a; ++a) {
    e[a] = e[d + a];
  }
  this.b = 32768;
  return e;
};

w.prototype.z = function (c) {
  var d,
      a = this.input.length / this.a + 1 | 0,
      b,
      e,
      f,
      g = this.input,
      h = this.c;
  c && ('number' === typeof c.p && (a = c.p), 'number' === typeof c.u && (a += c.u));
  2 > a ? (b = (g.length - this.a) / this.o[2], f = 258 * (b / 2) | 0, e = f < h.length ? h.length + f : h.length << 1) : e = h.length * a;
  t ? (d = new Uint8Array(e), d.set(h)) : d = h;
  return this.c = d;
};

w.prototype.n = function () {
  var c = 0,
      d = this.c,
      a = this.g,
      b,
      e = new (t ? Uint8Array : Array)(this.l + (this.b - 32768)),
      f,
      g,
      h,
      k;
  if (0 === a.length) return t ? this.c.subarray(32768, this.b) : this.c.slice(32768, this.b);
  f = 0;

  for (g = a.length; f < g; ++f) {
    b = a[f];
    h = 0;

    for (k = b.length; h < k; ++h) {
      e[c++] = b[h];
    }
  }

  f = 32768;

  for (g = this.b; f < g; ++f) {
    e[c++] = d[f];
  }

  this.g = [];
  return this.buffer = e;
};

w.prototype.v = function () {
  var c,
      d = this.b;
  t ? this.r ? (c = new Uint8Array(d), c.set(this.c.subarray(0, d))) : c = this.c.subarray(0, d) : (this.c.length > d && (this.c.length = d), c = this.c);
  return this.buffer = c;
};

function W(c, d) {
  var a, b;
  this.input = c;
  this.a = 0;
  if (d || !(d = {})) d.index && (this.a = d.index), d.verify && (this.A = d.verify);
  a = c[this.a++];
  b = c[this.a++];

  switch (a & 15) {
    case ha:
      this.method = ha;
      break;

    default:
      throw Error('unsupported compression method');
  }

  if (0 !== ((a << 8) + b) % 31) throw Error('invalid fcheck flag:' + ((a << 8) + b) % 31);
  if (b & 32) throw Error('fdict flag is not supported');
  this.q = new w(c, {
    index: this.a,
    bufferSize: d.bufferSize,
    bufferType: d.bufferType,
    resize: d.resize
  });
}

W.prototype.k = function () {
  var c = this.input,
      d,
      a;
  d = this.q.k();
  this.a = this.q.a;

  if (this.A) {
    a = (c[this.a++] << 24 | c[this.a++] << 16 | c[this.a++] << 8 | c[this.a++]) >>> 0;
    var b = d;

    if ('string' === typeof b) {
      var e = b.split(''),
          f,
          g;
      f = 0;

      for (g = e.length; f < g; f++) {
        e[f] = (e[f].charCodeAt(0) & 255) >>> 0;
      }

      b = e;
    }

    for (var h = 1, k = 0, m = b.length, n, p = 0; 0 < m;) {
      n = 1024 < m ? 1024 : m;
      m -= n;

      do {
        h += b[p++], k += h;
      } while (--n);

      h %= 65521;
      k %= 65521;
    }

    if (a !== (k << 16 | h) >>> 0) throw Error('invalid adler-32 checksum');
  }

  return d;
};

var ha = 8;
r('Zlib.Inflate', W);
r('Zlib.Inflate.prototype.decompress', W.prototype.k);
var X = {
  ADAPTIVE: B.s,
  BLOCK: B.t
},
    Y,
    Z,
    $,
    ia;
if (Object.keys) Y = Object.keys(X);else for (Z in Y = [], $ = 0, X) {
  Y[$++] = Z;
}
$ = 0;

for (ia = Y.length; $ < ia; ++$) {
  Z = Y[$], r('Zlib.Inflate.BufferType.' + Z, X[Z]);
}

var Inflate = mod.Zlib.Inflate;

/**
 * @author renej
 * NURBS utils
 *
 * See NURBSCurve and NURBSSurface.
 *
 **/
/**************************************************************
 *	NURBS Utils
 **************************************************************/

var NURBSUtils = {
  /*
  Finds knot vector span.
  	p : degree
  u : parametric value
  U : knot vector
  	returns the span
  */
  findSpan: function findSpan(p, u, U) {
    var n = U.length - p - 1;

    if (u >= U[n]) {
      return n - 1;
    }

    if (u <= U[p]) {
      return p;
    }

    var low = p;
    var high = n;
    var mid = Math.floor((low + high) / 2);

    while (u < U[mid] || u >= U[mid + 1]) {
      if (u < U[mid]) {
        high = mid;
      } else {
        low = mid;
      }

      mid = Math.floor((low + high) / 2);
    }

    return mid;
  },

  /*
  Calculate basis functions. See The NURBS Book, page 70, algorithm A2.2
  	span : span in which u lies
  u    : parametric point
  p    : degree
  U    : knot vector
  	returns array[p+1] with basis functions values.
  */
  calcBasisFunctions: function calcBasisFunctions(span, u, p, U) {
    var N = [];
    var left = [];
    var right = [];
    N[0] = 1.0;

    for (var j = 1; j <= p; ++j) {
      left[j] = u - U[span + 1 - j];
      right[j] = U[span + j] - u;
      var saved = 0.0;

      for (var r = 0; r < j; ++r) {
        var rv = right[r + 1];
        var lv = left[j - r];
        var temp = N[r] / (rv + lv);
        N[r] = saved + rv * temp;
        saved = lv * temp;
      }

      N[j] = saved;
    }

    return N;
  },

  /*
  Calculate B-Spline curve points. See The NURBS Book, page 82, algorithm A3.1.
  	p : degree of B-Spline
  U : knot vector
  P : control points (x, y, z, w)
  u : parametric point
  	returns point for given u
  */
  calcBSplinePoint: function calcBSplinePoint(p, U, P, u) {
    var span = this.findSpan(p, u, U);
    var N = this.calcBasisFunctions(span, u, p, U);
    var C = new Vector4(0, 0, 0, 0);

    for (var j = 0; j <= p; ++j) {
      var point = P[span - p + j];
      var Nj = N[j];
      var wNj = point.w * Nj;
      C.x += point.x * wNj;
      C.y += point.y * wNj;
      C.z += point.z * wNj;
      C.w += point.w * Nj;
    }

    return C;
  },

  /*
  Calculate basis functions derivatives. See The NURBS Book, page 72, algorithm A2.3.
  	span : span in which u lies
  u    : parametric point
  p    : degree
  n    : number of derivatives to calculate
  U    : knot vector
  	returns array[n+1][p+1] with basis functions derivatives
  */
  calcBasisFunctionDerivatives: function calcBasisFunctionDerivatives(span, u, p, n, U) {
    var zeroArr = [];

    for (var i = 0; i <= p; ++i) {
      zeroArr[i] = 0.0;
    }

    var ders = [];

    for (var i = 0; i <= n; ++i) {
      ders[i] = zeroArr.slice(0);
    }

    var ndu = [];

    for (var i = 0; i <= p; ++i) {
      ndu[i] = zeroArr.slice(0);
    }

    ndu[0][0] = 1.0;
    var left = zeroArr.slice(0);
    var right = zeroArr.slice(0);

    for (var j = 1; j <= p; ++j) {
      left[j] = u - U[span + 1 - j];
      right[j] = U[span + j] - u;
      var saved = 0.0;

      for (var r = 0; r < j; ++r) {
        var rv = right[r + 1];
        var lv = left[j - r];
        ndu[j][r] = rv + lv;
        var temp = ndu[r][j - 1] / ndu[j][r];
        ndu[r][j] = saved + rv * temp;
        saved = lv * temp;
      }

      ndu[j][j] = saved;
    }

    for (var j = 0; j <= p; ++j) {
      ders[0][j] = ndu[j][p];
    }

    for (var r = 0; r <= p; ++r) {
      var s1 = 0;
      var s2 = 1;
      var a = [];

      for (var i = 0; i <= p; ++i) {
        a[i] = zeroArr.slice(0);
      }

      a[0][0] = 1.0;

      for (var k = 1; k <= n; ++k) {
        var d = 0.0;
        var rk = r - k;
        var pk = p - k;

        if (r >= k) {
          a[s2][0] = a[s1][0] / ndu[pk + 1][rk];
          d = a[s2][0] * ndu[rk][pk];
        }

        var j1 = rk >= -1 ? 1 : -rk;
        var j2 = r - 1 <= pk ? k - 1 : p - r;

        for (var j = j1; j <= j2; ++j) {
          a[s2][j] = (a[s1][j] - a[s1][j - 1]) / ndu[pk + 1][rk + j];
          d += a[s2][j] * ndu[rk + j][pk];
        }

        if (r <= pk) {
          a[s2][k] = -a[s1][k - 1] / ndu[pk + 1][r];
          d += a[s2][k] * ndu[r][pk];
        }

        ders[k][r] = d;
        var j = s1;
        s1 = s2;
        s2 = j;
      }
    }

    var r = p;

    for (var k = 1; k <= n; ++k) {
      for (var j = 0; j <= p; ++j) {
        ders[k][j] *= r;
      }

      r *= p - k;
    }

    return ders;
  },

  /*
  Calculate derivatives of a B-Spline. See The NURBS Book, page 93, algorithm A3.2.
  		p  : degree
  U  : knot vector
  P  : control points
  u  : Parametric points
  nd : number of derivatives
  		returns array[d+1] with derivatives
  */
  calcBSplineDerivatives: function calcBSplineDerivatives(p, U, P, u, nd) {
    var du = nd < p ? nd : p;
    var CK = [];
    var span = this.findSpan(p, u, U);
    var nders = this.calcBasisFunctionDerivatives(span, u, p, du, U);
    var Pw = [];

    for (var i = 0; i < P.length; ++i) {
      var point = P[i].clone();
      var w = point.w;
      point.x *= w;
      point.y *= w;
      point.z *= w;
      Pw[i] = point;
    }

    for (var k = 0; k <= du; ++k) {
      var point = Pw[span - p].clone().multiplyScalar(nders[k][0]);

      for (var j = 1; j <= p; ++j) {
        point.add(Pw[span - p + j].clone().multiplyScalar(nders[k][j]));
      }

      CK[k] = point;
    }

    for (var k = du + 1; k <= nd + 1; ++k) {
      CK[k] = new Vector4(0, 0, 0);
    }

    return CK;
  },

  /*
  Calculate "K over I"
  	returns k!/(i!(k-i)!)
  */
  calcKoverI: function calcKoverI(k, i) {
    var nom = 1;

    for (var j = 2; j <= k; ++j) {
      nom *= j;
    }

    var denom = 1;

    for (var j = 2; j <= i; ++j) {
      denom *= j;
    }

    for (var j = 2; j <= k - i; ++j) {
      denom *= j;
    }

    return nom / denom;
  },

  /*
  Calculate derivatives (0-nd) of rational curve. See The NURBS Book, page 127, algorithm A4.2.
  	Pders : result of function calcBSplineDerivatives
  	returns array with derivatives for rational curve.
  */
  calcRationalCurveDerivatives: function calcRationalCurveDerivatives(Pders) {
    var nd = Pders.length;
    var Aders = [];
    var wders = [];

    for (var i = 0; i < nd; ++i) {
      var point = Pders[i];
      Aders[i] = new Vector3(point.x, point.y, point.z);
      wders[i] = point.w;
    }

    var CK = [];

    for (var k = 0; k < nd; ++k) {
      var v = Aders[k].clone();

      for (var i = 1; i <= k; ++i) {
        v.sub(CK[k - i].clone().multiplyScalar(this.calcKoverI(k, i) * wders[i]));
      }

      CK[k] = v.divideScalar(wders[0]);
    }

    return CK;
  },

  /*
  Calculate NURBS curve derivatives. See The NURBS Book, page 127, algorithm A4.2.
  	p  : degree
  U  : knot vector
  P  : control points in homogeneous space
  u  : parametric points
  nd : number of derivatives
  	returns array with derivatives.
  */
  calcNURBSDerivatives: function calcNURBSDerivatives(p, U, P, u, nd) {
    var Pders = this.calcBSplineDerivatives(p, U, P, u, nd);
    return this.calcRationalCurveDerivatives(Pders);
  },

  /*
  Calculate rational B-Spline surface point. See The NURBS Book, page 134, algorithm A4.3.
  	p1, p2 : degrees of B-Spline surface
  U1, U2 : knot vectors
  P      : control points (x, y, z, w)
  u, v   : parametric values
  	returns point for given (u, v)
  */
  calcSurfacePoint: function calcSurfacePoint(p, q, U, V, P, u, v, target) {
    var uspan = this.findSpan(p, u, U);
    var vspan = this.findSpan(q, v, V);
    var Nu = this.calcBasisFunctions(uspan, u, p, U);
    var Nv = this.calcBasisFunctions(vspan, v, q, V);
    var temp = [];

    for (var l = 0; l <= q; ++l) {
      temp[l] = new Vector4(0, 0, 0, 0);

      for (var k = 0; k <= p; ++k) {
        var point = P[uspan - p + k][vspan - q + l].clone();
        var w = point.w;
        point.x *= w;
        point.y *= w;
        point.z *= w;
        temp[l].add(point.multiplyScalar(Nu[k]));
      }
    }

    var Sw = new Vector4(0, 0, 0, 0);

    for (var l = 0; l <= q; ++l) {
      Sw.add(temp[l].multiplyScalar(Nv[l]));
    }

    Sw.divideScalar(Sw.w);
    target.set(Sw.x, Sw.y, Sw.z);
  }
};

/**
 * @author renej
 * NURBS curve object
 *
 * Derives from Curve, overriding getPoint and getTangent.
 *
 * Implementation is based on (x, y [, z=0 [, w=1]]) control points with w=weight.
 *
 **/
/**************************************************************
 *	NURBS curve
 **************************************************************/

var NURBSCurve = function NURBSCurve(degree, knots
/* array of reals */
, controlPoints
/* array of Vector(2|3|4) */
, startKnot
/* index in knots */
, endKnot
/* index in knots */
) {
  Curve.call(this);
  this.degree = degree;
  this.knots = knots;
  this.controlPoints = []; // Used by periodic NURBS to remove hidden spans

  this.startKnot = startKnot || 0;
  this.endKnot = endKnot || this.knots.length - 1;

  for (var i = 0; i < controlPoints.length; ++i) {
    // ensure Vector4 for control points
    var point = controlPoints[i];
    this.controlPoints[i] = new Vector4(point.x, point.y, point.z, point.w);
  }
};

NURBSCurve.prototype = Object.create(Curve.prototype);
NURBSCurve.prototype.constructor = NURBSCurve;

NURBSCurve.prototype.getPoint = function (t, optionalTarget) {
  var point = optionalTarget || new Vector3();
  var u = this.knots[this.startKnot] + t * (this.knots[this.endKnot] - this.knots[this.startKnot]); // linear mapping t->u
  // following results in (wx, wy, wz, w) homogeneous point

  var hpoint = NURBSUtils.calcBSplinePoint(this.degree, this.knots, this.controlPoints, u);

  if (hpoint.w != 1.0) {
    // project to 3D space: (wx, wy, wz, w) -> (x, y, z, 1)
    hpoint.divideScalar(hpoint.w);
  }

  return point.set(hpoint.x, hpoint.y, hpoint.z);
};

NURBSCurve.prototype.getTangent = function (t, optionalTarget) {
  var tangent = optionalTarget || new Vector3();
  var u = this.knots[0] + t * (this.knots[this.knots.length - 1] - this.knots[0]);
  var ders = NURBSUtils.calcNURBSDerivatives(this.degree, this.knots, this.controlPoints, u, 1);
  tangent.copy(ders[1]).normalize();
  return tangent;
};

var FBXLoader = function () {
  var fbxTree;
  var connections;
  var sceneGraph;

  function FBXLoader(manager) {
    Loader.call(this, manager);
  }

  FBXLoader.prototype = Object.assign(Object.create(Loader.prototype), {
    constructor: FBXLoader,
    load: function load(url, onLoad, onProgress, onError) {
      var scope = this;
      var path = scope.path === '' ? LoaderUtils.extractUrlBase(url) : scope.path;
      var loader = new FileLoader(this.manager);
      loader.setPath(scope.path);
      loader.setResponseType('arraybuffer');
      loader.load(url, function (buffer) {
        try {
          onLoad(scope.parse(buffer, path));
        } catch (e) {
          if (onError) {
            onError(e);
          } else {
            console.error(e);
          }

          scope.manager.itemError(url);
        }
      }, onProgress, onError);
    },
    parse: function parse(FBXBuffer, path) {
      if (isFbxFormatBinary(FBXBuffer)) {
        fbxTree = new BinaryParser().parse(FBXBuffer);
      } else {
        var FBXText = convertArrayBufferToString(FBXBuffer);

        if (!isFbxFormatASCII(FBXText)) {
          throw new Error('THREE.FBXLoader: Unknown format.');
        }

        if (getFbxVersion(FBXText) < 7000) {
          throw new Error('THREE.FBXLoader: FBX version not supported, FileVersion: ' + getFbxVersion(FBXText));
        }

        fbxTree = new TextParser().parse(FBXText);
      } // console.log( fbxTree );


      var textureLoader = new TextureLoader(this.manager).setPath(this.resourcePath || path).setCrossOrigin(this.crossOrigin);
      return new FBXTreeParser(textureLoader, this.manager).parse(fbxTree);
    }
  }); // Parse the FBXTree object returned by the BinaryParser or TextParser and return a Group

  function FBXTreeParser(textureLoader, manager) {
    this.textureLoader = textureLoader;
    this.manager = manager;
  }

  FBXTreeParser.prototype = {
    constructor: FBXTreeParser,
    parse: function parse() {
      connections = this.parseConnections();
      var images = this.parseImages();
      var textures = this.parseTextures(images);
      var materials = this.parseMaterials(textures);
      var deformers = this.parseDeformers();
      var geometryMap = new GeometryParser().parse(deformers);
      this.parseScene(deformers, geometryMap, materials);
      return sceneGraph;
    },
    // Parses FBXTree.Connections which holds parent-child connections between objects (e.g. material -> texture, model->geometry )
    // and details the connection type
    parseConnections: function parseConnections() {
      var connectionMap = new Map();

      if ('Connections' in fbxTree) {
        var rawConnections = fbxTree.Connections.connections;
        rawConnections.forEach(function (rawConnection) {
          var fromID = rawConnection[0];
          var toID = rawConnection[1];
          var relationship = rawConnection[2];

          if (!connectionMap.has(fromID)) {
            connectionMap.set(fromID, {
              parents: [],
              children: []
            });
          }

          var parentRelationship = {
            ID: toID,
            relationship: relationship
          };
          connectionMap.get(fromID).parents.push(parentRelationship);

          if (!connectionMap.has(toID)) {
            connectionMap.set(toID, {
              parents: [],
              children: []
            });
          }

          var childRelationship = {
            ID: fromID,
            relationship: relationship
          };
          connectionMap.get(toID).children.push(childRelationship);
        });
      }

      return connectionMap;
    },
    // Parse FBXTree.Objects.Video for embedded image data
    // These images are connected to textures in FBXTree.Objects.Textures
    // via FBXTree.Connections.
    parseImages: function parseImages() {
      var images = {};
      var blobs = {};

      if ('Video' in fbxTree.Objects) {
        var videoNodes = fbxTree.Objects.Video;

        for (var nodeID in videoNodes) {
          var videoNode = videoNodes[nodeID];
          var id = parseInt(nodeID);
          images[id] = videoNode.RelativeFilename || videoNode.Filename; // raw image data is in videoNode.Content

          if ('Content' in videoNode) {
            var arrayBufferContent = videoNode.Content instanceof ArrayBuffer && videoNode.Content.byteLength > 0;
            var base64Content = typeof videoNode.Content === 'string' && videoNode.Content !== '';

            if (arrayBufferContent || base64Content) {
              var image = this.parseImage(videoNodes[nodeID]);
              blobs[videoNode.RelativeFilename || videoNode.Filename] = image;
            }
          }
        }
      }

      for (var id in images) {
        var filename = images[id];
        if (blobs[filename] !== undefined) images[id] = blobs[filename];else images[id] = images[id].split('\\').pop();
      }

      return images;
    },
    // Parse embedded image data in FBXTree.Video.Content
    parseImage: function parseImage(videoNode) {
      var content = videoNode.Content;
      var fileName = videoNode.RelativeFilename || videoNode.Filename;
      var extension = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
      var type;

      switch (extension) {
        case 'bmp':
          type = 'image/bmp';
          break;

        case 'jpg':
        case 'jpeg':
          type = 'image/jpeg';
          break;

        case 'png':
          type = 'image/png';
          break;

        case 'tif':
          type = 'image/tiff';
          break;

        case 'tga':
          if (this.manager.getHandler('.tga') === null) {
            console.warn('FBXLoader: TGA loader not found, skipping ', fileName);
          }

          type = 'image/tga';
          break;

        default:
          console.warn('FBXLoader: Image type "' + extension + '" is not supported.');
          return;
      }

      if (typeof content === 'string') {
        // ASCII format
        return 'data:' + type + ';base64,' + content;
      } else {
        // Binary Format
        var array = new Uint8Array(content);
        return window.URL.createObjectURL(new Blob([array], {
          type: type
        }));
      }
    },
    // Parse nodes in FBXTree.Objects.Texture
    // These contain details such as UV scaling, cropping, rotation etc and are connected
    // to images in FBXTree.Objects.Video
    parseTextures: function parseTextures(images) {
      var textureMap = new Map();

      if ('Texture' in fbxTree.Objects) {
        var textureNodes = fbxTree.Objects.Texture;

        for (var nodeID in textureNodes) {
          var texture = this.parseTexture(textureNodes[nodeID], images);
          textureMap.set(parseInt(nodeID), texture);
        }
      }

      return textureMap;
    },
    // Parse individual node in FBXTree.Objects.Texture
    parseTexture: function parseTexture(textureNode, images) {
      var texture = this.loadTexture(textureNode, images);
      texture.ID = textureNode.id;
      texture.name = textureNode.attrName;
      var wrapModeU = textureNode.WrapModeU;
      var wrapModeV = textureNode.WrapModeV;
      var valueU = wrapModeU !== undefined ? wrapModeU.value : 0;
      var valueV = wrapModeV !== undefined ? wrapModeV.value : 0; // http://download.autodesk.com/us/fbx/SDKdocs/FBX_SDK_Help/files/fbxsdkref/class_k_fbx_texture.html#889640e63e2e681259ea81061b85143a
      // 0: repeat(default), 1: clamp

      texture.wrapS = valueU === 0 ? RepeatWrapping : ClampToEdgeWrapping;
      texture.wrapT = valueV === 0 ? RepeatWrapping : ClampToEdgeWrapping;

      if ('Scaling' in textureNode) {
        var values = textureNode.Scaling.value;
        texture.repeat.x = values[0];
        texture.repeat.y = values[1];
      }

      return texture;
    },
    // load a texture specified as a blob or data URI, or via an external URL using TextureLoader
    loadTexture: function loadTexture(textureNode, images) {
      var fileName;
      var currentPath = this.textureLoader.path;
      var children = connections.get(textureNode.id).children;

      if (children !== undefined && children.length > 0 && images[children[0].ID] !== undefined) {
        fileName = images[children[0].ID];

        if (fileName.indexOf('blob:') === 0 || fileName.indexOf('data:') === 0) {
          this.textureLoader.setPath(undefined);
        }
      }

      var texture;
      var extension = textureNode.FileName.slice(-3).toLowerCase();

      if (extension === 'tga') {
        var loader = this.manager.getHandler('.tga');

        if (loader === null) {
          console.warn('FBXLoader: TGA loader not found, creating placeholder texture for', textureNode.RelativeFilename);
          texture = new Texture();
        } else {
          texture = loader.load(fileName);
        }
      } else if (extension === 'psd') {
        console.warn('FBXLoader: PSD textures are not supported, creating placeholder texture for', textureNode.RelativeFilename);
        texture = new Texture();
      } else {
        texture = this.textureLoader.load(fileName);
      }

      this.textureLoader.setPath(currentPath);
      return texture;
    },
    // Parse nodes in FBXTree.Objects.Material
    parseMaterials: function parseMaterials(textureMap) {
      var materialMap = new Map();

      if ('Material' in fbxTree.Objects) {
        var materialNodes = fbxTree.Objects.Material;

        for (var nodeID in materialNodes) {
          var material = this.parseMaterial(materialNodes[nodeID], textureMap);
          if (material !== null) materialMap.set(parseInt(nodeID), material);
        }
      }

      return materialMap;
    },
    // Parse single node in FBXTree.Objects.Material
    // Materials are connected to texture maps in FBXTree.Objects.Textures
    // FBX format currently only supports Lambert and Phong shading models
    parseMaterial: function parseMaterial(materialNode, textureMap) {
      var ID = materialNode.id;
      var name = materialNode.attrName;
      var type = materialNode.ShadingModel; // Case where FBX wraps shading model in property object.

      if (_typeof2(type) === 'object') {
        type = type.value;
      } // Ignore unused materials which don't have any connections.


      if (!connections.has(ID)) return null;
      var parameters = this.parseParameters(materialNode, textureMap, ID);
      var material;

      switch (type.toLowerCase()) {
        case 'phong':
          material = new MeshPhongMaterial();
          break;

        case 'lambert':
          material = new MeshLambertMaterial();
          break;

        default:
          console.warn('THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.', type);
          material = new MeshPhongMaterial();
          break;
      }

      material.setValues(parameters);
      material.name = name;
      return material;
    },
    // Parse FBX material and return parameters suitable for a three.js material
    // Also parse the texture map and return any textures associated with the material
    parseParameters: function parseParameters(materialNode, textureMap, ID) {
      var parameters = {};

      if (materialNode.BumpFactor) {
        parameters.bumpScale = materialNode.BumpFactor.value;
      }

      if (materialNode.Diffuse) {
        parameters.color = new Color$1().fromArray(materialNode.Diffuse.value);
      } else if (materialNode.DiffuseColor && materialNode.DiffuseColor.type === 'Color') {
        // The blender exporter exports diffuse here instead of in materialNode.Diffuse
        parameters.color = new Color$1().fromArray(materialNode.DiffuseColor.value);
      }

      if (materialNode.DisplacementFactor) {
        parameters.displacementScale = materialNode.DisplacementFactor.value;
      }

      if (materialNode.Emissive) {
        parameters.emissive = new Color$1().fromArray(materialNode.Emissive.value);
      } else if (materialNode.EmissiveColor && materialNode.EmissiveColor.type === 'Color') {
        // The blender exporter exports emissive color here instead of in materialNode.Emissive
        parameters.emissive = new Color$1().fromArray(materialNode.EmissiveColor.value);
      }

      if (materialNode.EmissiveFactor) {
        parameters.emissiveIntensity = parseFloat(materialNode.EmissiveFactor.value);
      }

      if (materialNode.Opacity) {
        parameters.opacity = parseFloat(materialNode.Opacity.value);
      }

      if (parameters.opacity < 1.0) {
        parameters.transparent = true;
      }

      if (materialNode.ReflectionFactor) {
        parameters.reflectivity = materialNode.ReflectionFactor.value;
      }

      if (materialNode.Shininess) {
        parameters.shininess = materialNode.Shininess.value;
      }

      if (materialNode.Specular) {
        parameters.specular = new Color$1().fromArray(materialNode.Specular.value);
      } else if (materialNode.SpecularColor && materialNode.SpecularColor.type === 'Color') {
        // The blender exporter exports specular color here instead of in materialNode.Specular
        parameters.specular = new Color$1().fromArray(materialNode.SpecularColor.value);
      }

      var scope = this;
      connections.get(ID).children.forEach(function (child) {
        var type = child.relationship;

        switch (type) {
          case 'Bump':
            parameters.bumpMap = scope.getTexture(textureMap, child.ID);
            break;

          case 'Maya|TEX_ao_map':
            parameters.aoMap = scope.getTexture(textureMap, child.ID);
            break;

          case 'DiffuseColor':
          case 'Maya|TEX_color_map':
            parameters.map = scope.getTexture(textureMap, child.ID);
            parameters.map.encoding = sRGBEncoding;
            break;

          case 'DisplacementColor':
            parameters.displacementMap = scope.getTexture(textureMap, child.ID);
            break;

          case 'EmissiveColor':
            parameters.emissiveMap = scope.getTexture(textureMap, child.ID);
            parameters.emissiveMap.encoding = sRGBEncoding;
            break;

          case 'NormalMap':
          case 'Maya|TEX_normal_map':
            parameters.normalMap = scope.getTexture(textureMap, child.ID);
            break;

          case 'ReflectionColor':
            parameters.envMap = scope.getTexture(textureMap, child.ID);
            parameters.envMap.mapping = EquirectangularReflectionMapping;
            parameters.envMap.encoding = sRGBEncoding;
            break;

          case 'SpecularColor':
            parameters.specularMap = scope.getTexture(textureMap, child.ID);
            parameters.specularMap.encoding = sRGBEncoding;
            break;

          case 'TransparentColor':
          case 'TransparencyFactor':
            parameters.alphaMap = scope.getTexture(textureMap, child.ID);
            parameters.transparent = true;
            break;

          case 'AmbientColor':
          case 'ShininessExponent': // AKA glossiness map

          case 'SpecularFactor': // AKA specularLevel

          case 'VectorDisplacementColor': // NOTE: Seems to be a copy of DisplacementColor

          default:
            console.warn('THREE.FBXLoader: %s map is not supported in three.js, skipping texture.', type);
            break;
        }
      });
      return parameters;
    },
    // get a texture from the textureMap for use by a material.
    getTexture: function getTexture(textureMap, id) {
      // if the texture is a layered texture, just use the first layer and issue a warning
      if ('LayeredTexture' in fbxTree.Objects && id in fbxTree.Objects.LayeredTexture) {
        console.warn('THREE.FBXLoader: layered textures are not supported in three.js. Discarding all but first layer.');
        id = connections.get(id).children[0].ID;
      }

      return textureMap.get(id);
    },
    // Parse nodes in FBXTree.Objects.Deformer
    // Deformer node can contain skinning or Vertex Cache animation data, however only skinning is supported here
    // Generates map of Skeleton-like objects for use later when generating and binding skeletons.
    parseDeformers: function parseDeformers() {
      var skeletons = {};
      var morphTargets = {};

      if ('Deformer' in fbxTree.Objects) {
        var DeformerNodes = fbxTree.Objects.Deformer;

        for (var nodeID in DeformerNodes) {
          var deformerNode = DeformerNodes[nodeID];
          var relationships = connections.get(parseInt(nodeID));

          if (deformerNode.attrType === 'Skin') {
            var skeleton = this.parseSkeleton(relationships, DeformerNodes);
            skeleton.ID = nodeID;
            if (relationships.parents.length > 1) console.warn('THREE.FBXLoader: skeleton attached to more than one geometry is not supported.');
            skeleton.geometryID = relationships.parents[0].ID;
            skeletons[nodeID] = skeleton;
          } else if (deformerNode.attrType === 'BlendShape') {
            var morphTarget = {
              id: nodeID
            };
            morphTarget.rawTargets = this.parseMorphTargets(relationships, DeformerNodes);
            morphTarget.id = nodeID;
            if (relationships.parents.length > 1) console.warn('THREE.FBXLoader: morph target attached to more than one geometry is not supported.');
            morphTargets[nodeID] = morphTarget;
          }
        }
      }

      return {
        skeletons: skeletons,
        morphTargets: morphTargets
      };
    },
    // Parse single nodes in FBXTree.Objects.Deformer
    // The top level skeleton node has type 'Skin' and sub nodes have type 'Cluster'
    // Each skin node represents a skeleton and each cluster node represents a bone
    parseSkeleton: function parseSkeleton(relationships, deformerNodes) {
      var rawBones = [];
      relationships.children.forEach(function (child) {
        var boneNode = deformerNodes[child.ID];
        if (boneNode.attrType !== 'Cluster') return;
        var rawBone = {
          ID: child.ID,
          indices: [],
          weights: [],
          transformLink: new Matrix4().fromArray(boneNode.TransformLink.a) // transform: new Matrix4().fromArray( boneNode.Transform.a ),
          // linkMode: boneNode.Mode,

        };

        if ('Indexes' in boneNode) {
          rawBone.indices = boneNode.Indexes.a;
          rawBone.weights = boneNode.Weights.a;
        }

        rawBones.push(rawBone);
      });
      return {
        rawBones: rawBones,
        bones: []
      };
    },
    // The top level morph deformer node has type "BlendShape" and sub nodes have type "BlendShapeChannel"
    parseMorphTargets: function parseMorphTargets(relationships, deformerNodes) {
      var rawMorphTargets = [];

      for (var i = 0; i < relationships.children.length; i++) {
        var child = relationships.children[i];
        var morphTargetNode = deformerNodes[child.ID];
        var rawMorphTarget = {
          name: morphTargetNode.attrName,
          initialWeight: morphTargetNode.DeformPercent,
          id: morphTargetNode.id,
          fullWeights: morphTargetNode.FullWeights.a
        };
        if (morphTargetNode.attrType !== 'BlendShapeChannel') return;
        rawMorphTarget.geoID = connections.get(parseInt(child.ID)).children.filter(function (child) {
          return child.relationship === undefined;
        })[0].ID;
        rawMorphTargets.push(rawMorphTarget);
      }

      return rawMorphTargets;
    },
    // create the main Group() to be returned by the loader
    parseScene: function parseScene(deformers, geometryMap, materialMap) {
      sceneGraph = new Group();
      var modelMap = this.parseModels(deformers.skeletons, geometryMap, materialMap);
      var modelNodes = fbxTree.Objects.Model;
      var scope = this;
      modelMap.forEach(function (model) {
        var modelNode = modelNodes[model.ID];
        scope.setLookAtProperties(model, modelNode);
        var parentConnections = connections.get(model.ID).parents;
        parentConnections.forEach(function (connection) {
          var parent = modelMap.get(connection.ID);
          if (parent !== undefined) parent.add(model);
        });

        if (model.parent === null) {
          sceneGraph.add(model);
        }
      });
      this.bindSkeleton(deformers.skeletons, geometryMap, modelMap);
      this.createAmbientLight();
      this.setupMorphMaterials();
      sceneGraph.traverse(function (node) {
        if (node.userData.transformData) {
          if (node.parent) node.userData.transformData.parentMatrixWorld = node.parent.matrix;
          var transform = generateTransform(node.userData.transformData);
          node.applyMatrix4(transform);
        }
      });
      var animations = new AnimationParser().parse(); // if all the models where already combined in a single group, just return that

      if (sceneGraph.children.length === 1 && sceneGraph.children[0].isGroup) {
        sceneGraph.children[0].animations = animations;
        sceneGraph = sceneGraph.children[0];
      }

      sceneGraph.animations = animations;
    },
    // parse nodes in FBXTree.Objects.Model
    parseModels: function parseModels(skeletons, geometryMap, materialMap) {
      var modelMap = new Map();
      var modelNodes = fbxTree.Objects.Model;

      for (var nodeID in modelNodes) {
        var id = parseInt(nodeID);
        var node = modelNodes[nodeID];
        var relationships = connections.get(id);
        var model = this.buildSkeleton(relationships, skeletons, id, node.attrName);

        if (!model) {
          switch (node.attrType) {
            case 'Camera':
              model = this.createCamera(relationships);
              break;

            case 'Light':
              model = this.createLight(relationships);
              break;

            case 'Mesh':
              model = this.createMesh(relationships, geometryMap, materialMap);
              break;

            case 'NurbsCurve':
              model = this.createCurve(relationships, geometryMap);
              break;

            case 'LimbNode':
            case 'Root':
              model = new Bone();
              break;

            case 'Null':
            default:
              model = new Group();
              break;
          }

          model.name = node.attrName ? PropertyBinding.sanitizeNodeName(node.attrName) : '';
          model.ID = id;
        }

        this.getTransformData(model, node);
        modelMap.set(id, model);
      }

      return modelMap;
    },
    buildSkeleton: function buildSkeleton(relationships, skeletons, id, name) {
      var bone = null;
      relationships.parents.forEach(function (parent) {
        for (var ID in skeletons) {
          var skeleton = skeletons[ID];
          skeleton.rawBones.forEach(function (rawBone, i) {
            if (rawBone.ID === parent.ID) {
              var subBone = bone;
              bone = new Bone();
              bone.matrixWorld.copy(rawBone.transformLink); // set name and id here - otherwise in cases where "subBone" is created it will not have a name / id

              bone.name = name ? PropertyBinding.sanitizeNodeName(name) : '';
              bone.ID = id;
              skeleton.bones[i] = bone; // In cases where a bone is shared between multiple meshes
              // duplicate the bone here and and it as a child of the first bone

              if (subBone !== null) {
                bone.add(subBone);
              }
            }
          });
        }
      });
      return bone;
    },
    // create a PerspectiveCamera or OrthographicCamera
    createCamera: function createCamera(relationships) {
      var model;
      var cameraAttribute;
      relationships.children.forEach(function (child) {
        var attr = fbxTree.Objects.NodeAttribute[child.ID];

        if (attr !== undefined) {
          cameraAttribute = attr;
        }
      });

      if (cameraAttribute === undefined) {
        model = new Object3D();
      } else {
        var type = 0;

        if (cameraAttribute.CameraProjectionType !== undefined && cameraAttribute.CameraProjectionType.value === 1) {
          type = 1;
        }

        var nearClippingPlane = 1;

        if (cameraAttribute.NearPlane !== undefined) {
          nearClippingPlane = cameraAttribute.NearPlane.value / 1000;
        }

        var farClippingPlane = 1000;

        if (cameraAttribute.FarPlane !== undefined) {
          farClippingPlane = cameraAttribute.FarPlane.value / 1000;
        }

        var width = window.innerWidth;
        var height = window.innerHeight;

        if (cameraAttribute.AspectWidth !== undefined && cameraAttribute.AspectHeight !== undefined) {
          width = cameraAttribute.AspectWidth.value;
          height = cameraAttribute.AspectHeight.value;
        }

        var aspect = width / height;
        var fov = 45;

        if (cameraAttribute.FieldOfView !== undefined) {
          fov = cameraAttribute.FieldOfView.value;
        }

        var focalLength = cameraAttribute.FocalLength ? cameraAttribute.FocalLength.value : null;

        switch (type) {
          case 0:
            // Perspective
            model = new PerspectiveCamera(fov, aspect, nearClippingPlane, farClippingPlane);
            if (focalLength !== null) model.setFocalLength(focalLength);
            break;

          case 1:
            // Orthographic
            model = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, nearClippingPlane, farClippingPlane);
            break;

          default:
            console.warn('THREE.FBXLoader: Unknown camera type ' + type + '.');
            model = new Object3D();
            break;
        }
      }

      return model;
    },
    // Create a DirectionalLight, PointLight or SpotLight
    createLight: function createLight(relationships) {
      var model;
      var lightAttribute;
      relationships.children.forEach(function (child) {
        var attr = fbxTree.Objects.NodeAttribute[child.ID];

        if (attr !== undefined) {
          lightAttribute = attr;
        }
      });

      if (lightAttribute === undefined) {
        model = new Object3D();
      } else {
        var type; // LightType can be undefined for Point lights

        if (lightAttribute.LightType === undefined) {
          type = 0;
        } else {
          type = lightAttribute.LightType.value;
        }

        var color = 0xffffff;

        if (lightAttribute.Color !== undefined) {
          color = new Color$1().fromArray(lightAttribute.Color.value);
        }

        var intensity = lightAttribute.Intensity === undefined ? 1 : lightAttribute.Intensity.value / 100; // light disabled

        if (lightAttribute.CastLightOnObject !== undefined && lightAttribute.CastLightOnObject.value === 0) {
          intensity = 0;
        }

        var distance = 0;

        if (lightAttribute.FarAttenuationEnd !== undefined) {
          if (lightAttribute.EnableFarAttenuation !== undefined && lightAttribute.EnableFarAttenuation.value === 0) {
            distance = 0;
          } else {
            distance = lightAttribute.FarAttenuationEnd.value;
          }
        } // TODO: could this be calculated linearly from FarAttenuationStart to FarAttenuationEnd?


        var decay = 1;

        switch (type) {
          case 0:
            // Point
            model = new PointLight(color, intensity, distance, decay);
            break;

          case 1:
            // Directional
            model = new DirectionalLight(color, intensity);
            break;

          case 2:
            // Spot
            var angle = Math.PI / 3;

            if (lightAttribute.InnerAngle !== undefined) {
              angle = MathUtils.degToRad(lightAttribute.InnerAngle.value);
            }

            var penumbra = 0;

            if (lightAttribute.OuterAngle !== undefined) {
              // TODO: this is not correct - FBX calculates outer and inner angle in degrees
              // with OuterAngle > InnerAngle && OuterAngle <= Math.PI
              // while three.js uses a penumbra between (0, 1) to attenuate the inner angle
              penumbra = MathUtils.degToRad(lightAttribute.OuterAngle.value);
              penumbra = Math.max(penumbra, 1);
            }

            model = new SpotLight(color, intensity, distance, angle, penumbra, decay);
            break;

          default:
            console.warn('THREE.FBXLoader: Unknown light type ' + lightAttribute.LightType.value + ', defaulting to a PointLight.');
            model = new PointLight(color, intensity);
            break;
        }

        if (lightAttribute.CastShadows !== undefined && lightAttribute.CastShadows.value === 1) {
          model.castShadow = true;
        }
      }

      return model;
    },
    createMesh: function createMesh(relationships, geometryMap, materialMap) {
      var model;
      var geometry = null;
      var material = null;
      var materials = []; // get geometry and materials(s) from connections

      relationships.children.forEach(function (child) {
        if (geometryMap.has(child.ID)) {
          geometry = geometryMap.get(child.ID);
        }

        if (materialMap.has(child.ID)) {
          materials.push(materialMap.get(child.ID));
        }
      });

      if (materials.length > 1) {
        material = materials;
      } else if (materials.length > 0) {
        material = materials[0];
      } else {
        material = new MeshPhongMaterial({
          color: 0xcccccc
        });
        materials.push(material);
      }

      if ('color' in geometry.attributes) {
        materials.forEach(function (material) {
          material.vertexColors = true;
        });
      }

      if (geometry.FBX_Deformer) {
        materials.forEach(function (material) {
          material.skinning = true;
        });
        model = new SkinnedMesh(geometry, material);
        model.normalizeSkinWeights();
      } else {
        model = new Mesh(geometry, material);
      }

      return model;
    },
    createCurve: function createCurve(relationships, geometryMap) {
      var geometry = relationships.children.reduce(function (geo, child) {
        if (geometryMap.has(child.ID)) geo = geometryMap.get(child.ID);
        return geo;
      }, null); // FBX does not list materials for Nurbs lines, so we'll just put our own in here.

      var material = new LineBasicMaterial({
        color: 0x3300ff,
        linewidth: 1
      });
      return new Line(geometry, material);
    },
    // parse the model node for transform data
    getTransformData: function getTransformData(model, modelNode) {
      var transformData = {};
      if ('InheritType' in modelNode) transformData.inheritType = parseInt(modelNode.InheritType.value);
      if ('RotationOrder' in modelNode) transformData.eulerOrder = getEulerOrder(modelNode.RotationOrder.value);else transformData.eulerOrder = 'ZYX';
      if ('Lcl_Translation' in modelNode) transformData.translation = modelNode.Lcl_Translation.value;
      if ('PreRotation' in modelNode) transformData.preRotation = modelNode.PreRotation.value;
      if ('Lcl_Rotation' in modelNode) transformData.rotation = modelNode.Lcl_Rotation.value;
      if ('PostRotation' in modelNode) transformData.postRotation = modelNode.PostRotation.value;
      if ('Lcl_Scaling' in modelNode) transformData.scale = modelNode.Lcl_Scaling.value;
      if ('ScalingOffset' in modelNode) transformData.scalingOffset = modelNode.ScalingOffset.value;
      if ('ScalingPivot' in modelNode) transformData.scalingPivot = modelNode.ScalingPivot.value;
      if ('RotationOffset' in modelNode) transformData.rotationOffset = modelNode.RotationOffset.value;
      if ('RotationPivot' in modelNode) transformData.rotationPivot = modelNode.RotationPivot.value;
      model.userData.transformData = transformData;
    },
    setLookAtProperties: function setLookAtProperties(model, modelNode) {
      if ('LookAtProperty' in modelNode) {
        var children = connections.get(model.ID).children;
        children.forEach(function (child) {
          if (child.relationship === 'LookAtProperty') {
            var lookAtTarget = fbxTree.Objects.Model[child.ID];

            if ('Lcl_Translation' in lookAtTarget) {
              var pos = lookAtTarget.Lcl_Translation.value; // DirectionalLight, SpotLight

              if (model.target !== undefined) {
                model.target.position.fromArray(pos);
                sceneGraph.add(model.target);
              } else {
                // Cameras and other Object3Ds
                model.lookAt(new Vector3().fromArray(pos));
              }
            }
          }
        });
      }
    },
    bindSkeleton: function bindSkeleton(skeletons, geometryMap, modelMap) {
      var bindMatrices = this.parsePoseNodes();

      for (var ID in skeletons) {
        var skeleton = skeletons[ID];
        var parents = connections.get(parseInt(skeleton.ID)).parents;
        parents.forEach(function (parent) {
          if (geometryMap.has(parent.ID)) {
            var geoID = parent.ID;
            var geoRelationships = connections.get(geoID);
            geoRelationships.parents.forEach(function (geoConnParent) {
              if (modelMap.has(geoConnParent.ID)) {
                var model = modelMap.get(geoConnParent.ID);
                model.bind(new Skeleton(skeleton.bones), bindMatrices[geoConnParent.ID]);
              }
            });
          }
        });
      }
    },
    parsePoseNodes: function parsePoseNodes() {
      var bindMatrices = {};

      if ('Pose' in fbxTree.Objects) {
        var BindPoseNode = fbxTree.Objects.Pose;

        for (var nodeID in BindPoseNode) {
          if (BindPoseNode[nodeID].attrType === 'BindPose') {
            var poseNodes = BindPoseNode[nodeID].PoseNode;

            if (Array.isArray(poseNodes)) {
              poseNodes.forEach(function (poseNode) {
                bindMatrices[poseNode.Node] = new Matrix4().fromArray(poseNode.Matrix.a);
              });
            } else {
              bindMatrices[poseNodes.Node] = new Matrix4().fromArray(poseNodes.Matrix.a);
            }
          }
        }
      }

      return bindMatrices;
    },
    // Parse ambient color in FBXTree.GlobalSettings - if it's not set to black (default), create an ambient light
    createAmbientLight: function createAmbientLight() {
      if ('GlobalSettings' in fbxTree && 'AmbientColor' in fbxTree.GlobalSettings) {
        var ambientColor = fbxTree.GlobalSettings.AmbientColor.value;
        var r = ambientColor[0];
        var g = ambientColor[1];
        var b = ambientColor[2];

        if (r !== 0 || g !== 0 || b !== 0) {
          var color = new Color$1(r, g, b);
          sceneGraph.add(new AmbientLight(color, 1));
        }
      }
    },
    setupMorphMaterials: function setupMorphMaterials() {
      var scope = this;
      sceneGraph.traverse(function (child) {
        if (child.isMesh) {
          if (child.geometry.morphAttributes.position && child.geometry.morphAttributes.position.length) {
            if (Array.isArray(child.material)) {
              child.material.forEach(function (material, i) {
                scope.setupMorphMaterial(child, material, i);
              });
            } else {
              scope.setupMorphMaterial(child, child.material);
            }
          }
        }
      });
    },
    setupMorphMaterial: function setupMorphMaterial(child, material, index) {
      var uuid = child.uuid;
      var matUuid = material.uuid; // if a geometry has morph targets, it cannot share the material with other geometries

      var sharedMat = false;
      sceneGraph.traverse(function (node) {
        if (node.isMesh) {
          if (Array.isArray(node.material)) {
            node.material.forEach(function (mat) {
              if (mat.uuid === matUuid && node.uuid !== uuid) sharedMat = true;
            });
          } else if (node.material.uuid === matUuid && node.uuid !== uuid) sharedMat = true;
        }
      });

      if (sharedMat === true) {
        var clonedMat = material.clone();
        clonedMat.morphTargets = true;
        if (index === undefined) child.material = clonedMat;else child.material[index] = clonedMat;
      } else material.morphTargets = true;
    }
  }; // parse Geometry data from FBXTree and return map of BufferGeometries

  function GeometryParser() {}

  GeometryParser.prototype = {
    constructor: GeometryParser,
    // Parse nodes in FBXTree.Objects.Geometry
    parse: function parse(deformers) {
      var geometryMap = new Map();

      if ('Geometry' in fbxTree.Objects) {
        var geoNodes = fbxTree.Objects.Geometry;

        for (var nodeID in geoNodes) {
          var relationships = connections.get(parseInt(nodeID));
          var geo = this.parseGeometry(relationships, geoNodes[nodeID], deformers);
          geometryMap.set(parseInt(nodeID), geo);
        }
      }

      return geometryMap;
    },
    // Parse single node in FBXTree.Objects.Geometry
    parseGeometry: function parseGeometry(relationships, geoNode, deformers) {
      switch (geoNode.attrType) {
        case 'Mesh':
          return this.parseMeshGeometry(relationships, geoNode, deformers);

        case 'NurbsCurve':
          return this.parseNurbsGeometry(geoNode);
      }
    },
    // Parse single node mesh geometry in FBXTree.Objects.Geometry
    parseMeshGeometry: function parseMeshGeometry(relationships, geoNode, deformers) {
      var skeletons = deformers.skeletons;
      var morphTargets = [];
      var modelNodes = relationships.parents.map(function (parent) {
        return fbxTree.Objects.Model[parent.ID];
      }); // don't create geometry if it is not associated with any models

      if (modelNodes.length === 0) return;
      var skeleton = relationships.children.reduce(function (skeleton, child) {
        if (skeletons[child.ID] !== undefined) skeleton = skeletons[child.ID];
        return skeleton;
      }, null);
      relationships.children.forEach(function (child) {
        if (deformers.morphTargets[child.ID] !== undefined) {
          morphTargets.push(deformers.morphTargets[child.ID]);
        }
      }); // Assume one model and get the preRotation from that
      // if there is more than one model associated with the geometry this may cause problems

      var modelNode = modelNodes[0];
      var transformData = {};
      if ('RotationOrder' in modelNode) transformData.eulerOrder = getEulerOrder(modelNode.RotationOrder.value);
      if ('InheritType' in modelNode) transformData.inheritType = parseInt(modelNode.InheritType.value);
      if ('GeometricTranslation' in modelNode) transformData.translation = modelNode.GeometricTranslation.value;
      if ('GeometricRotation' in modelNode) transformData.rotation = modelNode.GeometricRotation.value;
      if ('GeometricScaling' in modelNode) transformData.scale = modelNode.GeometricScaling.value;
      var transform = generateTransform(transformData);
      return this.genGeometry(geoNode, skeleton, morphTargets, transform);
    },
    // Generate a BufferGeometry from a node in FBXTree.Objects.Geometry
    genGeometry: function genGeometry(geoNode, skeleton, morphTargets, preTransform) {
      var geo = new BufferGeometry();
      if (geoNode.attrName) geo.name = geoNode.attrName;
      var geoInfo = this.parseGeoNode(geoNode, skeleton);
      var buffers = this.genBuffers(geoInfo);
      var positionAttribute = new Float32BufferAttribute(buffers.vertex, 3);
      positionAttribute.applyMatrix4(preTransform);
      geo.setAttribute('position', positionAttribute);

      if (buffers.colors.length > 0) {
        geo.setAttribute('color', new Float32BufferAttribute(buffers.colors, 3));
      }

      if (skeleton) {
        geo.setAttribute('skinIndex', new Uint16BufferAttribute(buffers.weightsIndices, 4));
        geo.setAttribute('skinWeight', new Float32BufferAttribute(buffers.vertexWeights, 4)); // used later to bind the skeleton to the model

        geo.FBX_Deformer = skeleton;
      }

      if (buffers.normal.length > 0) {
        var normalMatrix = new Matrix3().getNormalMatrix(preTransform);
        var normalAttribute = new Float32BufferAttribute(buffers.normal, 3);
        normalAttribute.applyNormalMatrix(normalMatrix);
        geo.setAttribute('normal', normalAttribute);
      }

      buffers.uvs.forEach(function (uvBuffer, i) {
        // subsequent uv buffers are called 'uv1', 'uv2', ...
        var name = 'uv' + (i + 1).toString(); // the first uv buffer is just called 'uv'

        if (i === 0) {
          name = 'uv';
        }

        geo.setAttribute(name, new Float32BufferAttribute(buffers.uvs[i], 2));
      });

      if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {
        // Convert the material indices of each vertex into rendering groups on the geometry.
        var prevMaterialIndex = buffers.materialIndex[0];
        var startIndex = 0;
        buffers.materialIndex.forEach(function (currentIndex, i) {
          if (currentIndex !== prevMaterialIndex) {
            geo.addGroup(startIndex, i - startIndex, prevMaterialIndex);
            prevMaterialIndex = currentIndex;
            startIndex = i;
          }
        }); // the loop above doesn't add the last group, do that here.

        if (geo.groups.length > 0) {
          var lastGroup = geo.groups[geo.groups.length - 1];
          var lastIndex = lastGroup.start + lastGroup.count;

          if (lastIndex !== buffers.materialIndex.length) {
            geo.addGroup(lastIndex, buffers.materialIndex.length - lastIndex, prevMaterialIndex);
          }
        } // case where there are multiple materials but the whole geometry is only
        // using one of them


        if (geo.groups.length === 0) {
          geo.addGroup(0, buffers.materialIndex.length, buffers.materialIndex[0]);
        }
      }

      this.addMorphTargets(geo, geoNode, morphTargets, preTransform);
      return geo;
    },
    parseGeoNode: function parseGeoNode(geoNode, skeleton) {
      var geoInfo = {};
      geoInfo.vertexPositions = geoNode.Vertices !== undefined ? geoNode.Vertices.a : [];
      geoInfo.vertexIndices = geoNode.PolygonVertexIndex !== undefined ? geoNode.PolygonVertexIndex.a : [];

      if (geoNode.LayerElementColor) {
        geoInfo.color = this.parseVertexColors(geoNode.LayerElementColor[0]);
      }

      if (geoNode.LayerElementMaterial) {
        geoInfo.material = this.parseMaterialIndices(geoNode.LayerElementMaterial[0]);
      }

      if (geoNode.LayerElementNormal) {
        geoInfo.normal = this.parseNormals(geoNode.LayerElementNormal[0]);
      }

      if (geoNode.LayerElementUV) {
        geoInfo.uv = [];
        var i = 0;

        while (geoNode.LayerElementUV[i]) {
          geoInfo.uv.push(this.parseUVs(geoNode.LayerElementUV[i]));
          i++;
        }
      }

      geoInfo.weightTable = {};

      if (skeleton !== null) {
        geoInfo.skeleton = skeleton;
        skeleton.rawBones.forEach(function (rawBone, i) {
          // loop over the bone's vertex indices and weights
          rawBone.indices.forEach(function (index, j) {
            if (geoInfo.weightTable[index] === undefined) geoInfo.weightTable[index] = [];
            geoInfo.weightTable[index].push({
              id: i,
              weight: rawBone.weights[j]
            });
          });
        });
      }

      return geoInfo;
    },
    genBuffers: function genBuffers(geoInfo) {
      var buffers = {
        vertex: [],
        normal: [],
        colors: [],
        uvs: [],
        materialIndex: [],
        vertexWeights: [],
        weightsIndices: []
      };
      var polygonIndex = 0;
      var faceLength = 0;
      var displayedWeightsWarning = false; // these will hold data for a single face

      var facePositionIndexes = [];
      var faceNormals = [];
      var faceColors = [];
      var faceUVs = [];
      var faceWeights = [];
      var faceWeightIndices = [];
      var scope = this;
      geoInfo.vertexIndices.forEach(function (vertexIndex, polygonVertexIndex) {
        var endOfFace = false; // Face index and vertex index arrays are combined in a single array
        // A cube with quad faces looks like this:
        // PolygonVertexIndex: *24 {
        //  a: 0, 1, 3, -3, 2, 3, 5, -5, 4, 5, 7, -7, 6, 7, 1, -1, 1, 7, 5, -4, 6, 0, 2, -5
        //  }
        // Negative numbers mark the end of a face - first face here is 0, 1, 3, -3
        // to find index of last vertex bit shift the index: ^ - 1

        if (vertexIndex < 0) {
          vertexIndex = vertexIndex ^ -1; // equivalent to ( x * -1 ) - 1

          endOfFace = true;
        }

        var weightIndices = [];
        var weights = [];
        facePositionIndexes.push(vertexIndex * 3, vertexIndex * 3 + 1, vertexIndex * 3 + 2);

        if (geoInfo.color) {
          var data = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.color);
          faceColors.push(data[0], data[1], data[2]);
        }

        if (geoInfo.skeleton) {
          if (geoInfo.weightTable[vertexIndex] !== undefined) {
            geoInfo.weightTable[vertexIndex].forEach(function (wt) {
              weights.push(wt.weight);
              weightIndices.push(wt.id);
            });
          }

          if (weights.length > 4) {
            if (!displayedWeightsWarning) {
              console.warn('THREE.FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights.');
              displayedWeightsWarning = true;
            }

            var wIndex = [0, 0, 0, 0];
            var Weight = [0, 0, 0, 0];
            weights.forEach(function (weight, weightIndex) {
              var currentWeight = weight;
              var currentIndex = weightIndices[weightIndex];
              Weight.forEach(function (comparedWeight, comparedWeightIndex, comparedWeightArray) {
                if (currentWeight > comparedWeight) {
                  comparedWeightArray[comparedWeightIndex] = currentWeight;
                  currentWeight = comparedWeight;
                  var tmp = wIndex[comparedWeightIndex];
                  wIndex[comparedWeightIndex] = currentIndex;
                  currentIndex = tmp;
                }
              });
            });
            weightIndices = wIndex;
            weights = Weight;
          } // if the weight array is shorter than 4 pad with 0s


          while (weights.length < 4) {
            weights.push(0);
            weightIndices.push(0);
          }

          for (var i = 0; i < 4; ++i) {
            faceWeights.push(weights[i]);
            faceWeightIndices.push(weightIndices[i]);
          }
        }

        if (geoInfo.normal) {
          var data = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.normal);
          faceNormals.push(data[0], data[1], data[2]);
        }

        if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {
          var materialIndex = getData(polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.material)[0];
        }

        if (geoInfo.uv) {
          geoInfo.uv.forEach(function (uv, i) {
            var data = getData(polygonVertexIndex, polygonIndex, vertexIndex, uv);

            if (faceUVs[i] === undefined) {
              faceUVs[i] = [];
            }

            faceUVs[i].push(data[0]);
            faceUVs[i].push(data[1]);
          });
        }

        faceLength++;

        if (endOfFace) {
          scope.genFace(buffers, geoInfo, facePositionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength);
          polygonIndex++;
          faceLength = 0; // reset arrays for the next face

          facePositionIndexes = [];
          faceNormals = [];
          faceColors = [];
          faceUVs = [];
          faceWeights = [];
          faceWeightIndices = [];
        }
      });
      return buffers;
    },
    // Generate data for a single face in a geometry. If the face is a quad then split it into 2 tris
    genFace: function genFace(buffers, geoInfo, facePositionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength) {
      for (var i = 2; i < faceLength; i++) {
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[0]]);
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[1]]);
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[2]]);
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[(i - 1) * 3]]);
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[(i - 1) * 3 + 1]]);
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[(i - 1) * 3 + 2]]);
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i * 3]]);
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i * 3 + 1]]);
        buffers.vertex.push(geoInfo.vertexPositions[facePositionIndexes[i * 3 + 2]]);

        if (geoInfo.skeleton) {
          buffers.vertexWeights.push(faceWeights[0]);
          buffers.vertexWeights.push(faceWeights[1]);
          buffers.vertexWeights.push(faceWeights[2]);
          buffers.vertexWeights.push(faceWeights[3]);
          buffers.vertexWeights.push(faceWeights[(i - 1) * 4]);
          buffers.vertexWeights.push(faceWeights[(i - 1) * 4 + 1]);
          buffers.vertexWeights.push(faceWeights[(i - 1) * 4 + 2]);
          buffers.vertexWeights.push(faceWeights[(i - 1) * 4 + 3]);
          buffers.vertexWeights.push(faceWeights[i * 4]);
          buffers.vertexWeights.push(faceWeights[i * 4 + 1]);
          buffers.vertexWeights.push(faceWeights[i * 4 + 2]);
          buffers.vertexWeights.push(faceWeights[i * 4 + 3]);
          buffers.weightsIndices.push(faceWeightIndices[0]);
          buffers.weightsIndices.push(faceWeightIndices[1]);
          buffers.weightsIndices.push(faceWeightIndices[2]);
          buffers.weightsIndices.push(faceWeightIndices[3]);
          buffers.weightsIndices.push(faceWeightIndices[(i - 1) * 4]);
          buffers.weightsIndices.push(faceWeightIndices[(i - 1) * 4 + 1]);
          buffers.weightsIndices.push(faceWeightIndices[(i - 1) * 4 + 2]);
          buffers.weightsIndices.push(faceWeightIndices[(i - 1) * 4 + 3]);
          buffers.weightsIndices.push(faceWeightIndices[i * 4]);
          buffers.weightsIndices.push(faceWeightIndices[i * 4 + 1]);
          buffers.weightsIndices.push(faceWeightIndices[i * 4 + 2]);
          buffers.weightsIndices.push(faceWeightIndices[i * 4 + 3]);
        }

        if (geoInfo.color) {
          buffers.colors.push(faceColors[0]);
          buffers.colors.push(faceColors[1]);
          buffers.colors.push(faceColors[2]);
          buffers.colors.push(faceColors[(i - 1) * 3]);
          buffers.colors.push(faceColors[(i - 1) * 3 + 1]);
          buffers.colors.push(faceColors[(i - 1) * 3 + 2]);
          buffers.colors.push(faceColors[i * 3]);
          buffers.colors.push(faceColors[i * 3 + 1]);
          buffers.colors.push(faceColors[i * 3 + 2]);
        }

        if (geoInfo.material && geoInfo.material.mappingType !== 'AllSame') {
          buffers.materialIndex.push(materialIndex);
          buffers.materialIndex.push(materialIndex);
          buffers.materialIndex.push(materialIndex);
        }

        if (geoInfo.normal) {
          buffers.normal.push(faceNormals[0]);
          buffers.normal.push(faceNormals[1]);
          buffers.normal.push(faceNormals[2]);
          buffers.normal.push(faceNormals[(i - 1) * 3]);
          buffers.normal.push(faceNormals[(i - 1) * 3 + 1]);
          buffers.normal.push(faceNormals[(i - 1) * 3 + 2]);
          buffers.normal.push(faceNormals[i * 3]);
          buffers.normal.push(faceNormals[i * 3 + 1]);
          buffers.normal.push(faceNormals[i * 3 + 2]);
        }

        if (geoInfo.uv) {
          geoInfo.uv.forEach(function (uv, j) {
            if (buffers.uvs[j] === undefined) buffers.uvs[j] = [];
            buffers.uvs[j].push(faceUVs[j][0]);
            buffers.uvs[j].push(faceUVs[j][1]);
            buffers.uvs[j].push(faceUVs[j][(i - 1) * 2]);
            buffers.uvs[j].push(faceUVs[j][(i - 1) * 2 + 1]);
            buffers.uvs[j].push(faceUVs[j][i * 2]);
            buffers.uvs[j].push(faceUVs[j][i * 2 + 1]);
          });
        }
      }
    },
    addMorphTargets: function addMorphTargets(parentGeo, parentGeoNode, morphTargets, preTransform) {
      if (morphTargets.length === 0) return;
      parentGeo.morphTargetsRelative = true;
      parentGeo.morphAttributes.position = []; // parentGeo.morphAttributes.normal = []; // not implemented

      var scope = this;
      morphTargets.forEach(function (morphTarget) {
        morphTarget.rawTargets.forEach(function (rawTarget) {
          var morphGeoNode = fbxTree.Objects.Geometry[rawTarget.geoID];

          if (morphGeoNode !== undefined) {
            scope.genMorphGeometry(parentGeo, parentGeoNode, morphGeoNode, preTransform, rawTarget.name);
          }
        });
      });
    },
    // a morph geometry node is similar to a standard  node, and the node is also contained
    // in FBXTree.Objects.Geometry, however it can only have attributes for position, normal
    // and a special attribute Index defining which vertices of the original geometry are affected
    // Normal and position attributes only have data for the vertices that are affected by the morph
    genMorphGeometry: function genMorphGeometry(parentGeo, parentGeoNode, morphGeoNode, preTransform, name) {
      var vertexIndices = parentGeoNode.PolygonVertexIndex !== undefined ? parentGeoNode.PolygonVertexIndex.a : [];
      var morphPositionsSparse = morphGeoNode.Vertices !== undefined ? morphGeoNode.Vertices.a : [];
      var indices = morphGeoNode.Indexes !== undefined ? morphGeoNode.Indexes.a : [];
      var length = parentGeo.attributes.position.count * 3;
      var morphPositions = new Float32Array(length);

      for (var i = 0; i < indices.length; i++) {
        var morphIndex = indices[i] * 3;
        morphPositions[morphIndex] = morphPositionsSparse[i * 3];
        morphPositions[morphIndex + 1] = morphPositionsSparse[i * 3 + 1];
        morphPositions[morphIndex + 2] = morphPositionsSparse[i * 3 + 2];
      } // TODO: add morph normal support


      var morphGeoInfo = {
        vertexIndices: vertexIndices,
        vertexPositions: morphPositions
      };
      var morphBuffers = this.genBuffers(morphGeoInfo);
      var positionAttribute = new Float32BufferAttribute(morphBuffers.vertex, 3);
      positionAttribute.name = name || morphGeoNode.attrName;
      positionAttribute.applyMatrix4(preTransform);
      parentGeo.morphAttributes.position.push(positionAttribute);
    },
    // Parse normal from FBXTree.Objects.Geometry.LayerElementNormal if it exists
    parseNormals: function parseNormals(NormalNode) {
      var mappingType = NormalNode.MappingInformationType;
      var referenceType = NormalNode.ReferenceInformationType;
      var buffer = NormalNode.Normals.a;
      var indexBuffer = [];

      if (referenceType === 'IndexToDirect') {
        if ('NormalIndex' in NormalNode) {
          indexBuffer = NormalNode.NormalIndex.a;
        } else if ('NormalsIndex' in NormalNode) {
          indexBuffer = NormalNode.NormalsIndex.a;
        }
      }

      return {
        dataSize: 3,
        buffer: buffer,
        indices: indexBuffer,
        mappingType: mappingType,
        referenceType: referenceType
      };
    },
    // Parse UVs from FBXTree.Objects.Geometry.LayerElementUV if it exists
    parseUVs: function parseUVs(UVNode) {
      var mappingType = UVNode.MappingInformationType;
      var referenceType = UVNode.ReferenceInformationType;
      var buffer = UVNode.UV.a;
      var indexBuffer = [];

      if (referenceType === 'IndexToDirect') {
        indexBuffer = UVNode.UVIndex.a;
      }

      return {
        dataSize: 2,
        buffer: buffer,
        indices: indexBuffer,
        mappingType: mappingType,
        referenceType: referenceType
      };
    },
    // Parse Vertex Colors from FBXTree.Objects.Geometry.LayerElementColor if it exists
    parseVertexColors: function parseVertexColors(ColorNode) {
      var mappingType = ColorNode.MappingInformationType;
      var referenceType = ColorNode.ReferenceInformationType;
      var buffer = ColorNode.Colors.a;
      var indexBuffer = [];

      if (referenceType === 'IndexToDirect') {
        indexBuffer = ColorNode.ColorIndex.a;
      }

      return {
        dataSize: 4,
        buffer: buffer,
        indices: indexBuffer,
        mappingType: mappingType,
        referenceType: referenceType
      };
    },
    // Parse mapping and material data in FBXTree.Objects.Geometry.LayerElementMaterial if it exists
    parseMaterialIndices: function parseMaterialIndices(MaterialNode) {
      var mappingType = MaterialNode.MappingInformationType;
      var referenceType = MaterialNode.ReferenceInformationType;

      if (mappingType === 'NoMappingInformation') {
        return {
          dataSize: 1,
          buffer: [0],
          indices: [0],
          mappingType: 'AllSame',
          referenceType: referenceType
        };
      }

      var materialIndexBuffer = MaterialNode.Materials.a; // Since materials are stored as indices, there's a bit of a mismatch between FBX and what
      // we expect.So we create an intermediate buffer that points to the index in the buffer,
      // for conforming with the other functions we've written for other data.

      var materialIndices = [];

      for (var i = 0; i < materialIndexBuffer.length; ++i) {
        materialIndices.push(i);
      }

      return {
        dataSize: 1,
        buffer: materialIndexBuffer,
        indices: materialIndices,
        mappingType: mappingType,
        referenceType: referenceType
      };
    },
    // Generate a NurbGeometry from a node in FBXTree.Objects.Geometry
    parseNurbsGeometry: function parseNurbsGeometry(geoNode) {
      if (NURBSCurve === undefined) {
        console.error('THREE.FBXLoader: The loader relies on NURBSCurve for any nurbs present in the model. Nurbs will show up as empty geometry.');
        return new BufferGeometry();
      }

      var order = parseInt(geoNode.Order);

      if (isNaN(order)) {
        console.error('THREE.FBXLoader: Invalid Order %s given for geometry ID: %s', geoNode.Order, geoNode.id);
        return new BufferGeometry();
      }

      var degree = order - 1;
      var knots = geoNode.KnotVector.a;
      var controlPoints = [];
      var pointsValues = geoNode.Points.a;

      for (var i = 0, l = pointsValues.length; i < l; i += 4) {
        controlPoints.push(new Vector4().fromArray(pointsValues, i));
      }

      var startKnot, endKnot;

      if (geoNode.Form === 'Closed') {
        controlPoints.push(controlPoints[0]);
      } else if (geoNode.Form === 'Periodic') {
        startKnot = degree;
        endKnot = knots.length - 1 - startKnot;

        for (var i = 0; i < degree; ++i) {
          controlPoints.push(controlPoints[i]);
        }
      }

      var curve = new NURBSCurve(degree, knots, controlPoints, startKnot, endKnot);
      var vertices = curve.getPoints(controlPoints.length * 7);
      var positions = new Float32Array(vertices.length * 3);
      vertices.forEach(function (vertex, i) {
        vertex.toArray(positions, i * 3);
      });
      var geometry = new BufferGeometry();
      geometry.setAttribute('position', new BufferAttribute(positions, 3));
      return geometry;
    }
  }; // parse animation data from FBXTree

  function AnimationParser() {}

  AnimationParser.prototype = {
    constructor: AnimationParser,
    // take raw animation clips and turn them into three.js animation clips
    parse: function parse() {
      var animationClips = [];
      var rawClips = this.parseClips();

      if (rawClips !== undefined) {
        for (var key in rawClips) {
          var rawClip = rawClips[key];
          var clip = this.addClip(rawClip);
          animationClips.push(clip);
        }
      }

      return animationClips;
    },
    parseClips: function parseClips() {
      // since the actual transformation data is stored in FBXTree.Objects.AnimationCurve,
      // if this is undefined we can safely assume there are no animations
      if (fbxTree.Objects.AnimationCurve === undefined) return undefined;
      var curveNodesMap = this.parseAnimationCurveNodes();
      this.parseAnimationCurves(curveNodesMap);
      var layersMap = this.parseAnimationLayers(curveNodesMap);
      var rawClips = this.parseAnimStacks(layersMap);
      return rawClips;
    },
    // parse nodes in FBXTree.Objects.AnimationCurveNode
    // each AnimationCurveNode holds data for an animation transform for a model (e.g. left arm rotation )
    // and is referenced by an AnimationLayer
    parseAnimationCurveNodes: function parseAnimationCurveNodes() {
      var rawCurveNodes = fbxTree.Objects.AnimationCurveNode;
      var curveNodesMap = new Map();

      for (var nodeID in rawCurveNodes) {
        var rawCurveNode = rawCurveNodes[nodeID];

        if (rawCurveNode.attrName.match(/S|R|T|DeformPercent/) !== null) {
          var curveNode = {
            id: rawCurveNode.id,
            attr: rawCurveNode.attrName,
            curves: {}
          };
          curveNodesMap.set(curveNode.id, curveNode);
        }
      }

      return curveNodesMap;
    },
    // parse nodes in FBXTree.Objects.AnimationCurve and connect them up to
    // previously parsed AnimationCurveNodes. Each AnimationCurve holds data for a single animated
    // axis ( e.g. times and values of x rotation)
    parseAnimationCurves: function parseAnimationCurves(curveNodesMap) {
      var rawCurves = fbxTree.Objects.AnimationCurve; // TODO: Many values are identical up to roundoff error, but won't be optimised
      // e.g. position times: [0, 0.4, 0. 8]
      // position values: [7.23538335023477e-7, 93.67518615722656, -0.9982695579528809, 7.23538335023477e-7, 93.67518615722656, -0.9982695579528809, 7.235384487103147e-7, 93.67520904541016, -0.9982695579528809]
      // clearly, this should be optimised to
      // times: [0], positions [7.23538335023477e-7, 93.67518615722656, -0.9982695579528809]
      // this shows up in nearly every FBX file, and generally time array is length > 100

      for (var nodeID in rawCurves) {
        var animationCurve = {
          id: rawCurves[nodeID].id,
          times: rawCurves[nodeID].KeyTime.a.map(convertFBXTimeToSeconds),
          values: rawCurves[nodeID].KeyValueFloat.a
        };
        var relationships = connections.get(animationCurve.id);

        if (relationships !== undefined) {
          var animationCurveID = relationships.parents[0].ID;
          var animationCurveRelationship = relationships.parents[0].relationship;

          if (animationCurveRelationship.match(/X/)) {
            curveNodesMap.get(animationCurveID).curves['x'] = animationCurve;
          } else if (animationCurveRelationship.match(/Y/)) {
            curveNodesMap.get(animationCurveID).curves['y'] = animationCurve;
          } else if (animationCurveRelationship.match(/Z/)) {
            curveNodesMap.get(animationCurveID).curves['z'] = animationCurve;
          } else if (animationCurveRelationship.match(/d|DeformPercent/) && curveNodesMap.has(animationCurveID)) {
            curveNodesMap.get(animationCurveID).curves['morph'] = animationCurve;
          }
        }
      }
    },
    // parse nodes in FBXTree.Objects.AnimationLayer. Each layers holds references
    // to various AnimationCurveNodes and is referenced by an AnimationStack node
    // note: theoretically a stack can have multiple layers, however in practice there always seems to be one per stack
    parseAnimationLayers: function parseAnimationLayers(curveNodesMap) {
      var rawLayers = fbxTree.Objects.AnimationLayer;
      var layersMap = new Map();

      for (var nodeID in rawLayers) {
        var layerCurveNodes = [];
        var connection = connections.get(parseInt(nodeID));

        if (connection !== undefined) {
          // all the animationCurveNodes used in the layer
          var children = connection.children;
          children.forEach(function (child, i) {
            if (curveNodesMap.has(child.ID)) {
              var curveNode = curveNodesMap.get(child.ID); // check that the curves are defined for at least one axis, otherwise ignore the curveNode

              if (curveNode.curves.x !== undefined || curveNode.curves.y !== undefined || curveNode.curves.z !== undefined) {
                if (layerCurveNodes[i] === undefined) {
                  var modelID = connections.get(child.ID).parents.filter(function (parent) {
                    return parent.relationship !== undefined;
                  })[0].ID;

                  if (modelID !== undefined) {
                    var rawModel = fbxTree.Objects.Model[modelID.toString()];

                    if (rawModel === undefined) {
                      console.warn('THREE.FBXLoader: Encountered a unused curve.', child);
                      return;
                    }

                    var node = {
                      modelName: rawModel.attrName ? PropertyBinding.sanitizeNodeName(rawModel.attrName) : '',
                      ID: rawModel.id,
                      initialPosition: [0, 0, 0],
                      initialRotation: [0, 0, 0],
                      initialScale: [1, 1, 1]
                    };
                    sceneGraph.traverse(function (child) {
                      if (child.ID === rawModel.id) {
                        node.transform = child.matrix;
                        if (child.userData.transformData) node.eulerOrder = child.userData.transformData.eulerOrder;
                      }
                    });
                    if (!node.transform) node.transform = new Matrix4(); // if the animated model is pre rotated, we'll have to apply the pre rotations to every
                    // animation value as well

                    if ('PreRotation' in rawModel) node.preRotation = rawModel.PreRotation.value;
                    if ('PostRotation' in rawModel) node.postRotation = rawModel.PostRotation.value;
                    layerCurveNodes[i] = node;
                  }
                }

                if (layerCurveNodes[i]) layerCurveNodes[i][curveNode.attr] = curveNode;
              } else if (curveNode.curves.morph !== undefined) {
                if (layerCurveNodes[i] === undefined) {
                  var deformerID = connections.get(child.ID).parents.filter(function (parent) {
                    return parent.relationship !== undefined;
                  })[0].ID;
                  var morpherID = connections.get(deformerID).parents[0].ID;
                  var geoID = connections.get(morpherID).parents[0].ID; // assuming geometry is not used in more than one model

                  var modelID = connections.get(geoID).parents[0].ID;
                  var rawModel = fbxTree.Objects.Model[modelID];
                  var node = {
                    modelName: rawModel.attrName ? PropertyBinding.sanitizeNodeName(rawModel.attrName) : '',
                    morphName: fbxTree.Objects.Deformer[deformerID].attrName
                  };
                  layerCurveNodes[i] = node;
                }

                layerCurveNodes[i][curveNode.attr] = curveNode;
              }
            }
          });
          layersMap.set(parseInt(nodeID), layerCurveNodes);
        }
      }

      return layersMap;
    },
    // parse nodes in FBXTree.Objects.AnimationStack. These are the top level node in the animation
    // hierarchy. Each Stack node will be used to create a AnimationClip
    parseAnimStacks: function parseAnimStacks(layersMap) {
      var rawStacks = fbxTree.Objects.AnimationStack; // connect the stacks (clips) up to the layers

      var rawClips = {};

      for (var nodeID in rawStacks) {
        var children = connections.get(parseInt(nodeID)).children;

        if (children.length > 1) {
          // it seems like stacks will always be associated with a single layer. But just in case there are files
          // where there are multiple layers per stack, we'll display a warning
          console.warn('THREE.FBXLoader: Encountered an animation stack with multiple layers, this is currently not supported. Ignoring subsequent layers.');
        }

        var layer = layersMap.get(children[0].ID);
        rawClips[nodeID] = {
          name: rawStacks[nodeID].attrName,
          layer: layer
        };
      }

      return rawClips;
    },
    addClip: function addClip(rawClip) {
      var tracks = [];
      var scope = this;
      rawClip.layer.forEach(function (rawTracks) {
        tracks = tracks.concat(scope.generateTracks(rawTracks));
      });
      return new AnimationClip(rawClip.name, -1, tracks);
    },
    generateTracks: function generateTracks(rawTracks) {
      var tracks = [];
      var initialPosition = new Vector3();
      var initialRotation = new Quaternion();
      var initialScale = new Vector3();
      if (rawTracks.transform) rawTracks.transform.decompose(initialPosition, initialRotation, initialScale);
      initialPosition = initialPosition.toArray();
      initialRotation = new Euler().setFromQuaternion(initialRotation, rawTracks.eulerOrder).toArray();
      initialScale = initialScale.toArray();

      if (rawTracks.T !== undefined && Object.keys(rawTracks.T.curves).length > 0) {
        var positionTrack = this.generateVectorTrack(rawTracks.modelName, rawTracks.T.curves, initialPosition, 'position');
        if (positionTrack !== undefined) tracks.push(positionTrack);
      }

      if (rawTracks.R !== undefined && Object.keys(rawTracks.R.curves).length > 0) {
        var rotationTrack = this.generateRotationTrack(rawTracks.modelName, rawTracks.R.curves, initialRotation, rawTracks.preRotation, rawTracks.postRotation, rawTracks.eulerOrder);
        if (rotationTrack !== undefined) tracks.push(rotationTrack);
      }

      if (rawTracks.S !== undefined && Object.keys(rawTracks.S.curves).length > 0) {
        var scaleTrack = this.generateVectorTrack(rawTracks.modelName, rawTracks.S.curves, initialScale, 'scale');
        if (scaleTrack !== undefined) tracks.push(scaleTrack);
      }

      if (rawTracks.DeformPercent !== undefined) {
        var morphTrack = this.generateMorphTrack(rawTracks);
        if (morphTrack !== undefined) tracks.push(morphTrack);
      }

      return tracks;
    },
    generateVectorTrack: function generateVectorTrack(modelName, curves, initialValue, type) {
      var times = this.getTimesForAllAxes(curves);
      var values = this.getKeyframeTrackValues(times, curves, initialValue);
      return new VectorKeyframeTrack(modelName + '.' + type, times, values);
    },
    generateRotationTrack: function generateRotationTrack(modelName, curves, initialValue, preRotation, postRotation, eulerOrder) {
      if (curves.x !== undefined) {
        this.interpolateRotations(curves.x);
        curves.x.values = curves.x.values.map(MathUtils.degToRad);
      }

      if (curves.y !== undefined) {
        this.interpolateRotations(curves.y);
        curves.y.values = curves.y.values.map(MathUtils.degToRad);
      }

      if (curves.z !== undefined) {
        this.interpolateRotations(curves.z);
        curves.z.values = curves.z.values.map(MathUtils.degToRad);
      }

      var times = this.getTimesForAllAxes(curves);
      var values = this.getKeyframeTrackValues(times, curves, initialValue);

      if (preRotation !== undefined) {
        preRotation = preRotation.map(MathUtils.degToRad);
        preRotation.push(eulerOrder);
        preRotation = new Euler().fromArray(preRotation);
        preRotation = new Quaternion().setFromEuler(preRotation);
      }

      if (postRotation !== undefined) {
        postRotation = postRotation.map(MathUtils.degToRad);
        postRotation.push(eulerOrder);
        postRotation = new Euler().fromArray(postRotation);
        postRotation = new Quaternion().setFromEuler(postRotation).inverse();
      }

      var quaternion = new Quaternion();
      var euler = new Euler();
      var quaternionValues = [];

      for (var i = 0; i < values.length; i += 3) {
        euler.set(values[i], values[i + 1], values[i + 2], eulerOrder);
        quaternion.setFromEuler(euler);
        if (preRotation !== undefined) quaternion.premultiply(preRotation);
        if (postRotation !== undefined) quaternion.multiply(postRotation);
        quaternion.toArray(quaternionValues, i / 3 * 4);
      }

      return new QuaternionKeyframeTrack(modelName + '.quaternion', times, quaternionValues);
    },
    generateMorphTrack: function generateMorphTrack(rawTracks) {
      var curves = rawTracks.DeformPercent.curves.morph;
      var values = curves.values.map(function (val) {
        return val / 100;
      });
      var morphNum = sceneGraph.getObjectByName(rawTracks.modelName).morphTargetDictionary[rawTracks.morphName];
      return new NumberKeyframeTrack(rawTracks.modelName + '.morphTargetInfluences[' + morphNum + ']', curves.times, values);
    },
    // For all animated objects, times are defined separately for each axis
    // Here we'll combine the times into one sorted array without duplicates
    getTimesForAllAxes: function getTimesForAllAxes(curves) {
      var times = []; // first join together the times for each axis, if defined

      if (curves.x !== undefined) times = times.concat(curves.x.times);
      if (curves.y !== undefined) times = times.concat(curves.y.times);
      if (curves.z !== undefined) times = times.concat(curves.z.times); // then sort them and remove duplicates

      times = times.sort(function (a, b) {
        return a - b;
      }).filter(function (elem, index, array) {
        return array.indexOf(elem) == index;
      });
      return times;
    },
    getKeyframeTrackValues: function getKeyframeTrackValues(times, curves, initialValue) {
      var prevValue = initialValue;
      var values = [];
      var xIndex = -1;
      var yIndex = -1;
      var zIndex = -1;
      times.forEach(function (time) {
        if (curves.x) xIndex = curves.x.times.indexOf(time);
        if (curves.y) yIndex = curves.y.times.indexOf(time);
        if (curves.z) zIndex = curves.z.times.indexOf(time); // if there is an x value defined for this frame, use that

        if (xIndex !== -1) {
          var xValue = curves.x.values[xIndex];
          values.push(xValue);
          prevValue[0] = xValue;
        } else {
          // otherwise use the x value from the previous frame
          values.push(prevValue[0]);
        }

        if (yIndex !== -1) {
          var yValue = curves.y.values[yIndex];
          values.push(yValue);
          prevValue[1] = yValue;
        } else {
          values.push(prevValue[1]);
        }

        if (zIndex !== -1) {
          var zValue = curves.z.values[zIndex];
          values.push(zValue);
          prevValue[2] = zValue;
        } else {
          values.push(prevValue[2]);
        }
      });
      return values;
    },
    // Rotations are defined as Euler angles which can have values  of any size
    // These will be converted to quaternions which don't support values greater than
    // PI, so we'll interpolate large rotations
    interpolateRotations: function interpolateRotations(curve) {
      for (var i = 1; i < curve.values.length; i++) {
        var initialValue = curve.values[i - 1];
        var valuesSpan = curve.values[i] - initialValue;
        var absoluteSpan = Math.abs(valuesSpan);

        if (absoluteSpan >= 180) {
          var numSubIntervals = absoluteSpan / 180;
          var step = valuesSpan / numSubIntervals;
          var nextValue = initialValue + step;
          var initialTime = curve.times[i - 1];
          var timeSpan = curve.times[i] - initialTime;
          var interval = timeSpan / numSubIntervals;
          var nextTime = initialTime + interval;
          var interpolatedTimes = [];
          var interpolatedValues = [];

          while (nextTime < curve.times[i]) {
            interpolatedTimes.push(nextTime);
            nextTime += interval;
            interpolatedValues.push(nextValue);
            nextValue += step;
          }

          curve.times = inject(curve.times, i, interpolatedTimes);
          curve.values = inject(curve.values, i, interpolatedValues);
        }
      }
    }
  }; // parse an FBX file in ASCII format

  function TextParser() {}

  TextParser.prototype = {
    constructor: TextParser,
    getPrevNode: function getPrevNode() {
      return this.nodeStack[this.currentIndent - 2];
    },
    getCurrentNode: function getCurrentNode() {
      return this.nodeStack[this.currentIndent - 1];
    },
    getCurrentProp: function getCurrentProp() {
      return this.currentProp;
    },
    pushStack: function pushStack(node) {
      this.nodeStack.push(node);
      this.currentIndent += 1;
    },
    popStack: function popStack() {
      this.nodeStack.pop();
      this.currentIndent -= 1;
    },
    setCurrentProp: function setCurrentProp(val, name) {
      this.currentProp = val;
      this.currentPropName = name;
    },
    parse: function parse(text) {
      this.currentIndent = 0;
      this.allNodes = new FBXTree();
      this.nodeStack = [];
      this.currentProp = [];
      this.currentPropName = '';
      var scope = this;
      var split = text.split(/[\r\n]+/);
      split.forEach(function (line, i) {
        var matchComment = line.match(/^[\s\t]*;/);
        var matchEmpty = line.match(/^[\s\t]*$/);
        if (matchComment || matchEmpty) return;
        var matchBeginning = line.match('^\\t{' + scope.currentIndent + '}(\\w+):(.*){', '');
        var matchProperty = line.match('^\\t{' + scope.currentIndent + '}(\\w+):[\\s\\t\\r\\n](.*)');
        var matchEnd = line.match('^\\t{' + (scope.currentIndent - 1) + '}}');

        if (matchBeginning) {
          scope.parseNodeBegin(line, matchBeginning);
        } else if (matchProperty) {
          scope.parseNodeProperty(line, matchProperty, split[++i]);
        } else if (matchEnd) {
          scope.popStack();
        } else if (line.match(/^[^\s\t}]/)) {
          // large arrays are split over multiple lines terminated with a ',' character
          // if this is encountered the line needs to be joined to the previous line
          scope.parseNodePropertyContinued(line);
        }
      });
      return this.allNodes;
    },
    parseNodeBegin: function parseNodeBegin(line, property) {
      var nodeName = property[1].trim().replace(/^"/, '').replace(/"$/, '');
      var nodeAttrs = property[2].split(',').map(function (attr) {
        return attr.trim().replace(/^"/, '').replace(/"$/, '');
      });
      var node = {
        name: nodeName
      };
      var attrs = this.parseNodeAttr(nodeAttrs);
      var currentNode = this.getCurrentNode(); // a top node

      if (this.currentIndent === 0) {
        this.allNodes.add(nodeName, node);
      } else {
        // a subnode
        // if the subnode already exists, append it
        if (nodeName in currentNode) {
          // special case Pose needs PoseNodes as an array
          if (nodeName === 'PoseNode') {
            currentNode.PoseNode.push(node);
          } else if (currentNode[nodeName].id !== undefined) {
            currentNode[nodeName] = {};
            currentNode[nodeName][currentNode[nodeName].id] = currentNode[nodeName];
          }

          if (attrs.id !== '') currentNode[nodeName][attrs.id] = node;
        } else if (typeof attrs.id === 'number') {
          currentNode[nodeName] = {};
          currentNode[nodeName][attrs.id] = node;
        } else if (nodeName !== 'Properties70') {
          if (nodeName === 'PoseNode') currentNode[nodeName] = [node];else currentNode[nodeName] = node;
        }
      }

      if (typeof attrs.id === 'number') node.id = attrs.id;
      if (attrs.name !== '') node.attrName = attrs.name;
      if (attrs.type !== '') node.attrType = attrs.type;
      this.pushStack(node);
    },
    parseNodeAttr: function parseNodeAttr(attrs) {
      var id = attrs[0];

      if (attrs[0] !== '') {
        id = parseInt(attrs[0]);

        if (isNaN(id)) {
          id = attrs[0];
        }
      }

      var name = '',
          type = '';

      if (attrs.length > 1) {
        name = attrs[1].replace(/^(\w+)::/, '');
        type = attrs[2];
      }

      return {
        id: id,
        name: name,
        type: type
      };
    },
    parseNodeProperty: function parseNodeProperty(line, property, contentLine) {
      var propName = property[1].replace(/^"/, '').replace(/"$/, '').trim();
      var propValue = property[2].replace(/^"/, '').replace(/"$/, '').trim(); // for special case: base64 image data follows "Content: ," line
      //	Content: ,
      //	 "/9j/4RDaRXhpZgAATU0A..."

      if (propName === 'Content' && propValue === ',') {
        propValue = contentLine.replace(/"/g, '').replace(/,$/, '').trim();
      }

      var currentNode = this.getCurrentNode();
      var parentName = currentNode.name;

      if (parentName === 'Properties70') {
        this.parseNodeSpecialProperty(line, propName, propValue);
        return;
      } // Connections


      if (propName === 'C') {
        var connProps = propValue.split(',').slice(1);
        var from = parseInt(connProps[0]);
        var to = parseInt(connProps[1]);
        var rest = propValue.split(',').slice(3);
        rest = rest.map(function (elem) {
          return elem.trim().replace(/^"/, '');
        });
        propName = 'connections';
        propValue = [from, to];
        append(propValue, rest);

        if (currentNode[propName] === undefined) {
          currentNode[propName] = [];
        }
      } // Node


      if (propName === 'Node') currentNode.id = propValue; // connections

      if (propName in currentNode && Array.isArray(currentNode[propName])) {
        currentNode[propName].push(propValue);
      } else {
        if (propName !== 'a') currentNode[propName] = propValue;else currentNode.a = propValue;
      }

      this.setCurrentProp(currentNode, propName); // convert string to array, unless it ends in ',' in which case more will be added to it

      if (propName === 'a' && propValue.slice(-1) !== ',') {
        currentNode.a = parseNumberArray(propValue);
      }
    },
    parseNodePropertyContinued: function parseNodePropertyContinued(line) {
      var currentNode = this.getCurrentNode();
      currentNode.a += line; // if the line doesn't end in ',' we have reached the end of the property value
      // so convert the string to an array

      if (line.slice(-1) !== ',') {
        currentNode.a = parseNumberArray(currentNode.a);
      }
    },
    // parse "Property70"
    parseNodeSpecialProperty: function parseNodeSpecialProperty(line, propName, propValue) {
      // split this
      // P: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1
      // into array like below
      // ["Lcl Scaling", "Lcl Scaling", "", "A", "1,1,1" ]
      var props = propValue.split('",').map(function (prop) {
        return prop.trim().replace(/^\"/, '').replace(/\s/, '_');
      });
      var innerPropName = props[0];
      var innerPropType1 = props[1];
      var innerPropType2 = props[2];
      var innerPropFlag = props[3];
      var innerPropValue = props[4]; // cast values where needed, otherwise leave as strings

      switch (innerPropType1) {
        case 'int':
        case 'enum':
        case 'bool':
        case 'ULongLong':
        case 'double':
        case 'Number':
        case 'FieldOfView':
          innerPropValue = parseFloat(innerPropValue);
          break;

        case 'Color':
        case 'ColorRGB':
        case 'Vector3D':
        case 'Lcl_Translation':
        case 'Lcl_Rotation':
        case 'Lcl_Scaling':
          innerPropValue = parseNumberArray(innerPropValue);
          break;
      } // CAUTION: these props must append to parent's parent


      this.getPrevNode()[innerPropName] = {
        type: innerPropType1,
        type2: innerPropType2,
        flag: innerPropFlag,
        value: innerPropValue
      };
      this.setCurrentProp(this.getPrevNode(), innerPropName);
    }
  }; // Parse an FBX file in Binary format

  function BinaryParser() {}

  BinaryParser.prototype = {
    constructor: BinaryParser,
    parse: function parse(buffer) {
      var reader = new BinaryReader(buffer);
      reader.skip(23); // skip magic 23 bytes

      var version = reader.getUint32();
      console.log('THREE.FBXLoader: FBX binary version: ' + version);
      var allNodes = new FBXTree();

      while (!this.endOfContent(reader)) {
        var node = this.parseNode(reader, version);
        if (node !== null) allNodes.add(node.name, node);
      }

      return allNodes;
    },
    // Check if reader has reached the end of content.
    endOfContent: function endOfContent(reader) {
      // footer size: 160bytes + 16-byte alignment padding
      // - 16bytes: magic
      // - padding til 16-byte alignment (at least 1byte?)
      //	(seems like some exporters embed fixed 15 or 16bytes?)
      // - 4bytes: magic
      // - 4bytes: version
      // - 120bytes: zero
      // - 16bytes: magic
      if (reader.size() % 16 === 0) {
        return (reader.getOffset() + 160 + 16 & ~0xf) >= reader.size();
      } else {
        return reader.getOffset() + 160 + 16 >= reader.size();
      }
    },
    // recursively parse nodes until the end of the file is reached
    parseNode: function parseNode(reader, version) {
      var node = {}; // The first three data sizes depends on version.

      var endOffset = version >= 7500 ? reader.getUint64() : reader.getUint32();
      var numProperties = version >= 7500 ? reader.getUint64() : reader.getUint32();
      version >= 7500 ? reader.getUint64() : reader.getUint32(); // the returned propertyListLen is not used

      var nameLen = reader.getUint8();
      var name = reader.getString(nameLen); // Regards this node as NULL-record if endOffset is zero

      if (endOffset === 0) return null;
      var propertyList = [];

      for (var i = 0; i < numProperties; i++) {
        propertyList.push(this.parseProperty(reader));
      } // Regards the first three elements in propertyList as id, attrName, and attrType


      var id = propertyList.length > 0 ? propertyList[0] : '';
      var attrName = propertyList.length > 1 ? propertyList[1] : '';
      var attrType = propertyList.length > 2 ? propertyList[2] : ''; // check if this node represents just a single property
      // like (name, 0) set or (name2, [0, 1, 2]) set of {name: 0, name2: [0, 1, 2]}

      node.singleProperty = numProperties === 1 && reader.getOffset() === endOffset ? true : false;

      while (endOffset > reader.getOffset()) {
        var subNode = this.parseNode(reader, version);
        if (subNode !== null) this.parseSubNode(name, node, subNode);
      }

      node.propertyList = propertyList; // raw property list used by parent

      if (typeof id === 'number') node.id = id;
      if (attrName !== '') node.attrName = attrName;
      if (attrType !== '') node.attrType = attrType;
      if (name !== '') node.name = name;
      return node;
    },
    parseSubNode: function parseSubNode(name, node, subNode) {
      // special case: child node is single property
      if (subNode.singleProperty === true) {
        var value = subNode.propertyList[0];

        if (Array.isArray(value)) {
          node[subNode.name] = subNode;
          subNode.a = value;
        } else {
          node[subNode.name] = value;
        }
      } else if (name === 'Connections' && subNode.name === 'C') {
        var array = [];
        subNode.propertyList.forEach(function (property, i) {
          // first Connection is FBX type (OO, OP, etc.). We'll discard these
          if (i !== 0) array.push(property);
        });

        if (node.connections === undefined) {
          node.connections = [];
        }

        node.connections.push(array);
      } else if (subNode.name === 'Properties70') {
        var keys = Object.keys(subNode);
        keys.forEach(function (key) {
          node[key] = subNode[key];
        });
      } else if (name === 'Properties70' && subNode.name === 'P') {
        var innerPropName = subNode.propertyList[0];
        var innerPropType1 = subNode.propertyList[1];
        var innerPropType2 = subNode.propertyList[2];
        var innerPropFlag = subNode.propertyList[3];
        var innerPropValue;
        if (innerPropName.indexOf('Lcl ') === 0) innerPropName = innerPropName.replace('Lcl ', 'Lcl_');
        if (innerPropType1.indexOf('Lcl ') === 0) innerPropType1 = innerPropType1.replace('Lcl ', 'Lcl_');

        if (innerPropType1 === 'Color' || innerPropType1 === 'ColorRGB' || innerPropType1 === 'Vector' || innerPropType1 === 'Vector3D' || innerPropType1.indexOf('Lcl_') === 0) {
          innerPropValue = [subNode.propertyList[4], subNode.propertyList[5], subNode.propertyList[6]];
        } else {
          innerPropValue = subNode.propertyList[4];
        } // this will be copied to parent, see above


        node[innerPropName] = {
          type: innerPropType1,
          type2: innerPropType2,
          flag: innerPropFlag,
          value: innerPropValue
        };
      } else if (node[subNode.name] === undefined) {
        if (typeof subNode.id === 'number') {
          node[subNode.name] = {};
          node[subNode.name][subNode.id] = subNode;
        } else {
          node[subNode.name] = subNode;
        }
      } else {
        if (subNode.name === 'PoseNode') {
          if (!Array.isArray(node[subNode.name])) {
            node[subNode.name] = [node[subNode.name]];
          }

          node[subNode.name].push(subNode);
        } else if (node[subNode.name][subNode.id] === undefined) {
          node[subNode.name][subNode.id] = subNode;
        }
      }
    },
    parseProperty: function parseProperty(reader) {
      var type = reader.getString(1);

      switch (type) {
        case 'C':
          return reader.getBoolean();

        case 'D':
          return reader.getFloat64();

        case 'F':
          return reader.getFloat32();

        case 'I':
          return reader.getInt32();

        case 'L':
          return reader.getInt64();

        case 'R':
          var length = reader.getUint32();
          return reader.getArrayBuffer(length);

        case 'S':
          var length = reader.getUint32();
          return reader.getString(length);

        case 'Y':
          return reader.getInt16();

        case 'b':
        case 'c':
        case 'd':
        case 'f':
        case 'i':
        case 'l':
          var arrayLength = reader.getUint32();
          var encoding = reader.getUint32(); // 0: non-compressed, 1: compressed

          var compressedLength = reader.getUint32();

          if (encoding === 0) {
            switch (type) {
              case 'b':
              case 'c':
                return reader.getBooleanArray(arrayLength);

              case 'd':
                return reader.getFloat64Array(arrayLength);

              case 'f':
                return reader.getFloat32Array(arrayLength);

              case 'i':
                return reader.getInt32Array(arrayLength);

              case 'l':
                return reader.getInt64Array(arrayLength);
            }
          }

          if (typeof Inflate === 'undefined') {
            console.error('THREE.FBXLoader: External library Inflate.min.js required, obtain or import from https://github.com/imaya/zlib.js');
          }

          var inflate = new Inflate(new Uint8Array(reader.getArrayBuffer(compressedLength))); // eslint-disable-line no-undef

          var reader2 = new BinaryReader(inflate.decompress().buffer);

          switch (type) {
            case 'b':
            case 'c':
              return reader2.getBooleanArray(arrayLength);

            case 'd':
              return reader2.getFloat64Array(arrayLength);

            case 'f':
              return reader2.getFloat32Array(arrayLength);

            case 'i':
              return reader2.getInt32Array(arrayLength);

            case 'l':
              return reader2.getInt64Array(arrayLength);
          }

        default:
          throw new Error('THREE.FBXLoader: Unknown property type ' + type);
      }
    }
  };

  function BinaryReader(buffer, littleEndian) {
    this.dv = new DataView(buffer);
    this.offset = 0;
    this.littleEndian = littleEndian !== undefined ? littleEndian : true;
  }

  BinaryReader.prototype = {
    constructor: BinaryReader,
    getOffset: function getOffset() {
      return this.offset;
    },
    size: function size() {
      return this.dv.buffer.byteLength;
    },
    skip: function skip(length) {
      this.offset += length;
    },
    // seems like true/false representation depends on exporter.
    // true: 1 or 'Y'(=0x59), false: 0 or 'T'(=0x54)
    // then sees LSB.
    getBoolean: function getBoolean() {
      return (this.getUint8() & 1) === 1;
    },
    getBooleanArray: function getBooleanArray(size) {
      var a = [];

      for (var i = 0; i < size; i++) {
        a.push(this.getBoolean());
      }

      return a;
    },
    getUint8: function getUint8() {
      var value = this.dv.getUint8(this.offset);
      this.offset += 1;
      return value;
    },
    getInt16: function getInt16() {
      var value = this.dv.getInt16(this.offset, this.littleEndian);
      this.offset += 2;
      return value;
    },
    getInt32: function getInt32() {
      var value = this.dv.getInt32(this.offset, this.littleEndian);
      this.offset += 4;
      return value;
    },
    getInt32Array: function getInt32Array(size) {
      var a = [];

      for (var i = 0; i < size; i++) {
        a.push(this.getInt32());
      }

      return a;
    },
    getUint32: function getUint32() {
      var value = this.dv.getUint32(this.offset, this.littleEndian);
      this.offset += 4;
      return value;
    },
    // JavaScript doesn't support 64-bit integer so calculate this here
    // 1 << 32 will return 1 so using multiply operation instead here.
    // There's a possibility that this method returns wrong value if the value
    // is out of the range between Number.MAX_SAFE_INTEGER and Number.MIN_SAFE_INTEGER.
    // TODO: safely handle 64-bit integer
    getInt64: function getInt64() {
      var low, high;

      if (this.littleEndian) {
        low = this.getUint32();
        high = this.getUint32();
      } else {
        high = this.getUint32();
        low = this.getUint32();
      } // calculate negative value


      if (high & 0x80000000) {
        high = ~high & 0xffffffff;
        low = ~low & 0xffffffff;
        if (low === 0xffffffff) high = high + 1 & 0xffffffff;
        low = low + 1 & 0xffffffff;
        return -(high * 0x100000000 + low);
      }

      return high * 0x100000000 + low;
    },
    getInt64Array: function getInt64Array(size) {
      var a = [];

      for (var i = 0; i < size; i++) {
        a.push(this.getInt64());
      }

      return a;
    },
    // Note: see getInt64() comment
    getUint64: function getUint64() {
      var low, high;

      if (this.littleEndian) {
        low = this.getUint32();
        high = this.getUint32();
      } else {
        high = this.getUint32();
        low = this.getUint32();
      }

      return high * 0x100000000 + low;
    },
    getFloat32: function getFloat32() {
      var value = this.dv.getFloat32(this.offset, this.littleEndian);
      this.offset += 4;
      return value;
    },
    getFloat32Array: function getFloat32Array(size) {
      var a = [];

      for (var i = 0; i < size; i++) {
        a.push(this.getFloat32());
      }

      return a;
    },
    getFloat64: function getFloat64() {
      var value = this.dv.getFloat64(this.offset, this.littleEndian);
      this.offset += 8;
      return value;
    },
    getFloat64Array: function getFloat64Array(size) {
      var a = [];

      for (var i = 0; i < size; i++) {
        a.push(this.getFloat64());
      }

      return a;
    },
    getArrayBuffer: function getArrayBuffer(size) {
      var value = this.dv.buffer.slice(this.offset, this.offset + size);
      this.offset += size;
      return value;
    },
    getString: function getString(size) {
      // note: safari 9 doesn't support Uint8Array.indexOf; create intermediate array instead
      var a = [];

      for (var i = 0; i < size; i++) {
        a[i] = this.getUint8();
      }

      var nullByte = a.indexOf(0);
      if (nullByte >= 0) a = a.slice(0, nullByte);
      return LoaderUtils.decodeText(new Uint8Array(a));
    }
  }; // FBXTree holds a representation of the FBX data, returned by the TextParser ( FBX ASCII format)
  // and BinaryParser( FBX Binary format)

  function FBXTree() {}

  FBXTree.prototype = {
    constructor: FBXTree,
    add: function add(key, val) {
      this[key] = val;
    }
  }; // ************** UTILITY FUNCTIONS **************

  function isFbxFormatBinary(buffer) {
    var CORRECT = 'Kaydara FBX Binary  \0';
    return buffer.byteLength >= CORRECT.length && CORRECT === convertArrayBufferToString(buffer, 0, CORRECT.length);
  }

  function isFbxFormatASCII(text) {
    var CORRECT = ['K', 'a', 'y', 'd', 'a', 'r', 'a', '\\', 'F', 'B', 'X', '\\', 'B', 'i', 'n', 'a', 'r', 'y', '\\', '\\'];
    var cursor = 0;

    function read(offset) {
      var result = text[offset - 1];
      text = text.slice(cursor + offset);
      cursor++;
      return result;
    }

    for (var i = 0; i < CORRECT.length; ++i) {
      var num = read(1);

      if (num === CORRECT[i]) {
        return false;
      }
    }

    return true;
  }

  function getFbxVersion(text) {
    var versionRegExp = /FBXVersion: (\d+)/;
    var match = text.match(versionRegExp);

    if (match) {
      var version = parseInt(match[1]);
      return version;
    }

    throw new Error('THREE.FBXLoader: Cannot find the version number for the file given.');
  } // Converts FBX ticks into real time seconds.


  function convertFBXTimeToSeconds(time) {
    return time / 46186158000;
  }

  var dataArray = []; // extracts the data from the correct position in the FBX array based on indexing type

  function getData(polygonVertexIndex, polygonIndex, vertexIndex, infoObject) {
    var index;

    switch (infoObject.mappingType) {
      case 'ByPolygonVertex':
        index = polygonVertexIndex;
        break;

      case 'ByPolygon':
        index = polygonIndex;
        break;

      case 'ByVertice':
        index = vertexIndex;
        break;

      case 'AllSame':
        index = infoObject.indices[0];
        break;

      default:
        console.warn('THREE.FBXLoader: unknown attribute mapping type ' + infoObject.mappingType);
    }

    if (infoObject.referenceType === 'IndexToDirect') index = infoObject.indices[index];
    var from = index * infoObject.dataSize;
    var to = from + infoObject.dataSize;
    return slice(dataArray, infoObject.buffer, from, to);
  }

  var tempEuler = new Euler();
  var tempVec = new Vector3(); // generate transformation from FBX transform data
  // ref: https://help.autodesk.com/view/FBX/2017/ENU/?guid=__files_GUID_10CDD63C_79C1_4F2D_BB28_AD2BE65A02ED_htm
  // ref: http://docs.autodesk.com/FBX/2014/ENU/FBX-SDK-Documentation/index.html?url=cpp_ref/_transformations_2main_8cxx-example.html,topicNumber=cpp_ref__transformations_2main_8cxx_example_htmlfc10a1e1-b18d-4e72-9dc0-70d0f1959f5e

  function generateTransform(transformData) {
    var lTranslationM = new Matrix4();
    var lPreRotationM = new Matrix4();
    var lRotationM = new Matrix4();
    var lPostRotationM = new Matrix4();
    var lScalingM = new Matrix4();
    var lScalingPivotM = new Matrix4();
    var lScalingOffsetM = new Matrix4();
    var lRotationOffsetM = new Matrix4();
    var lRotationPivotM = new Matrix4();
    var lParentGX = new Matrix4();
    var lGlobalT = new Matrix4();
    var inheritType = transformData.inheritType ? transformData.inheritType : 0;
    if (transformData.translation) lTranslationM.setPosition(tempVec.fromArray(transformData.translation));

    if (transformData.preRotation) {
      var array = transformData.preRotation.map(MathUtils.degToRad);
      array.push(transformData.eulerOrder);
      lPreRotationM.makeRotationFromEuler(tempEuler.fromArray(array));
    }

    if (transformData.rotation) {
      var array = transformData.rotation.map(MathUtils.degToRad);
      array.push(transformData.eulerOrder);
      lRotationM.makeRotationFromEuler(tempEuler.fromArray(array));
    }

    if (transformData.postRotation) {
      var array = transformData.postRotation.map(MathUtils.degToRad);
      array.push(transformData.eulerOrder);
      lPostRotationM.makeRotationFromEuler(tempEuler.fromArray(array));
    }

    if (transformData.scale) lScalingM.scale(tempVec.fromArray(transformData.scale)); // Pivots and offsets

    if (transformData.scalingOffset) lScalingOffsetM.setPosition(tempVec.fromArray(transformData.scalingOffset));
    if (transformData.scalingPivot) lScalingPivotM.setPosition(tempVec.fromArray(transformData.scalingPivot));
    if (transformData.rotationOffset) lRotationOffsetM.setPosition(tempVec.fromArray(transformData.rotationOffset));
    if (transformData.rotationPivot) lRotationPivotM.setPosition(tempVec.fromArray(transformData.rotationPivot)); // parent transform

    if (transformData.parentMatrixWorld) lParentGX = transformData.parentMatrixWorld; // Global Rotation

    var lLRM = lPreRotationM.multiply(lRotationM).multiply(lPostRotationM);
    var lParentGRM = new Matrix4();
    lParentGX.extractRotation(lParentGRM); // Global Shear*Scaling

    var lParentTM = new Matrix4();
    lParentTM.copyPosition(lParentGX);
    var lParentGSM = new Matrix4();
    lParentGSM.getInverse(lParentGRM).multiply(lParentGX);
    var lGlobalRS = new Matrix4();

    if (inheritType === 0) {
      lGlobalRS.copy(lParentGRM).multiply(lLRM).multiply(lParentGSM).multiply(lScalingM);
    } else if (inheritType === 1) {
      lGlobalRS.copy(lParentGRM).multiply(lParentGSM).multiply(lLRM).multiply(lScalingM);
    } else {
      var lParentLSM_inv = new Matrix4().getInverse(lScalingM);
      var lParentGSM_noLocal = new Matrix4().multiply(lParentGSM).multiply(lParentLSM_inv);
      lGlobalRS.copy(lParentGRM).multiply(lLRM).multiply(lParentGSM_noLocal).multiply(lScalingM);
    }

    var lRotationPivotM_inv = new Matrix4().getInverse(lRotationPivotM);
    var lScalingPivotM_inv = new Matrix4().getInverse(lScalingPivotM); // Calculate the local transform matrix

    var lTransform = new Matrix4();
    lTransform.copy(lTranslationM).multiply(lRotationOffsetM).multiply(lRotationPivotM).multiply(lPreRotationM).multiply(lRotationM).multiply(lPostRotationM).multiply(lRotationPivotM_inv).multiply(lScalingOffsetM).multiply(lScalingPivotM).multiply(lScalingM).multiply(lScalingPivotM_inv);
    var lLocalTWithAllPivotAndOffsetInfo = new Matrix4().copyPosition(lTransform);
    var lGlobalTranslation = new Matrix4().copy(lParentGX).multiply(lLocalTWithAllPivotAndOffsetInfo);
    lGlobalT.copyPosition(lGlobalTranslation);
    lTransform = new Matrix4().multiply(lGlobalT).multiply(lGlobalRS);
    return lTransform;
  } // Returns the three.js intrinsic Euler order corresponding to FBX extrinsic Euler order
  // ref: http://help.autodesk.com/view/FBX/2017/ENU/?guid=__cpp_ref_class_fbx_euler_html


  function getEulerOrder(order) {
    order = order || 0;
    var enums = ['ZYX', // -> XYZ extrinsic
    'YZX', // -> XZY extrinsic
    'XZY', // -> YZX extrinsic
    'ZXY', // -> YXZ extrinsic
    'YXZ', // -> ZXY extrinsic
    'XYZ' // -> ZYX extrinsic
    //'SphericXYZ', // not possible to support
    ];

    if (order === 6) {
      console.warn('THREE.FBXLoader: unsupported Euler Order: Spherical XYZ. Animations and rotations may be incorrect.');
      return enums[0];
    }

    return enums[order];
  } // Parses comma separated list of numbers and returns them an array.
  // Used internally by the TextParser


  function parseNumberArray(value) {
    var array = value.split(',').map(function (val) {
      return parseFloat(val);
    });
    return array;
  }

  function convertArrayBufferToString(buffer, from, to) {
    if (from === undefined) from = 0;
    if (to === undefined) to = buffer.byteLength;
    return LoaderUtils.decodeText(new Uint8Array(buffer, from, to));
  }

  function append(a, b) {
    for (var i = 0, j = a.length, l = b.length; i < l; i++, j++) {
      a[j] = b[i];
    }
  }

  function slice(a, b, from, to) {
    for (var i = from, j = 0; i < to; i++, j++) {
      a[j] = b[i];
    }

    return a;
  } // inject array a2 into array a1 at index


  function inject(a1, index, a2) {
    return a1.slice(0, index).concat(a2).concat(a1.slice(index));
  }

  return FBXLoader;
}();

var GLTFLoader = function () {
  function GLTFLoader(manager) {
    Loader.call(this, manager);
    this.dracoLoader = null;
    this.ddsLoader = null;
    this.ktx2Loader = null;
    this.pluginCallbacks = [];
    this.register(function (parser) {
      return new GLTFMaterialsClearcoatExtension(parser);
    });
    this.register(function (parser) {
      return new GLTFTextureBasisUExtension(parser);
    });
    this.register(function (parser) {
      return new GLTFMaterialsTransmissionExtension(parser);
    });
  }

  GLTFLoader.prototype = Object.assign(Object.create(Loader.prototype), {
    constructor: GLTFLoader,
    load: function load(url, onLoad, onProgress, onError) {
      var scope = this;
      var resourcePath;

      if (this.resourcePath !== '') {
        resourcePath = this.resourcePath;
      } else if (this.path !== '') {
        resourcePath = this.path;
      } else {
        resourcePath = LoaderUtils.extractUrlBase(url);
      } // Tells the LoadingManager to track an extra item, which resolves after
      // the model is fully loaded. This means the count of items loaded will
      // be incorrect, but ensures manager.onLoad() does not fire early.


      scope.manager.itemStart(url);

      var _onError = function _onError(e) {
        if (onError) {
          onError(e);
        } else {
          console.error(e);
        }

        scope.manager.itemError(url);
        scope.manager.itemEnd(url);
      };

      var loader = new FileLoader(scope.manager);
      loader.setPath(this.path);
      loader.setResponseType('arraybuffer');
      loader.setRequestHeader(this.requestHeader);

      if (scope.crossOrigin === 'use-credentials') {
        loader.setWithCredentials(true);
      }

      loader.load(url, function (data) {
        try {
          scope.parse(data, resourcePath, function (gltf) {
            onLoad(gltf);
            scope.manager.itemEnd(url);
          }, _onError);
        } catch (e) {
          _onError(e);
        }
      }, onProgress, _onError);
    },
    setDRACOLoader: function setDRACOLoader(dracoLoader) {
      this.dracoLoader = dracoLoader;
      return this;
    },
    setDDSLoader: function setDDSLoader(ddsLoader) {
      this.ddsLoader = ddsLoader;
      return this;
    },
    setKTX2Loader: function setKTX2Loader(ktx2Loader) {
      this.ktx2Loader = ktx2Loader;
      return this;
    },
    register: function register(callback) {
      if (this.pluginCallbacks.indexOf(callback) === -1) {
        this.pluginCallbacks.push(callback);
      }

      return this;
    },
    unregister: function unregister(callback) {
      if (this.pluginCallbacks.indexOf(callback) !== -1) {
        this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(callback), 1);
      }

      return this;
    },
    parse: function parse(data, path, onLoad, onError) {
      var content;
      var extensions = {};
      var plugins = {};

      if (typeof data === 'string') {
        content = data;
      } else {
        var magic = LoaderUtils.decodeText(new Uint8Array(data, 0, 4));

        if (magic === BINARY_EXTENSION_HEADER_MAGIC) {
          try {
            extensions[EXTENSIONS.KHR_BINARY_GLTF] = new GLTFBinaryExtension(data);
          } catch (error) {
            if (onError) onError(error);
            return;
          }

          content = extensions[EXTENSIONS.KHR_BINARY_GLTF].content;
        } else {
          content = LoaderUtils.decodeText(new Uint8Array(data));
        }
      }

      var json = JSON.parse(content);

      if (json.asset === undefined || json.asset.version[0] < 2) {
        if (onError) onError(new Error('THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.'));
        return;
      }

      var parser = new GLTFParser(json, {
        path: path || this.resourcePath || '',
        crossOrigin: this.crossOrigin,
        manager: this.manager,
        ktx2Loader: this.ktx2Loader
      });
      parser.fileLoader.setRequestHeader(this.requestHeader);

      for (var i = 0; i < this.pluginCallbacks.length; i++) {
        var plugin = this.pluginCallbacks[i](parser);
        plugins[plugin.name] = plugin; // Workaround to avoid determining as unknown extension
        // in addUnknownExtensionsToUserData().
        // Remove this workaround if we move all the existing
        // extension handlers to plugin system

        extensions[plugin.name] = true;
      }

      if (json.extensionsUsed) {
        for (var i = 0; i < json.extensionsUsed.length; ++i) {
          var extensionName = json.extensionsUsed[i];
          var extensionsRequired = json.extensionsRequired || [];

          switch (extensionName) {
            case EXTENSIONS.KHR_LIGHTS_PUNCTUAL:
              extensions[extensionName] = new GLTFLightsExtension(json);
              break;

            case EXTENSIONS.KHR_MATERIALS_UNLIT:
              extensions[extensionName] = new GLTFMaterialsUnlitExtension();
              break;

            case EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS:
              extensions[extensionName] = new GLTFMaterialsPbrSpecularGlossinessExtension();
              break;

            case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
              extensions[extensionName] = new GLTFDracoMeshCompressionExtension(json, this.dracoLoader);
              break;

            case EXTENSIONS.MSFT_TEXTURE_DDS:
              extensions[extensionName] = new GLTFTextureDDSExtension(this.ddsLoader);
              break;

            case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
              extensions[extensionName] = new GLTFTextureTransformExtension();
              break;

            case EXTENSIONS.KHR_MESH_QUANTIZATION:
              extensions[extensionName] = new GLTFMeshQuantizationExtension();
              break;

            default:
              if (extensionsRequired.indexOf(extensionName) >= 0 && plugins[extensionName] === undefined) {
                console.warn('THREE.GLTFLoader: Unknown extension "' + extensionName + '".');
              }

          }
        }
      }

      parser.setExtensions(extensions);
      parser.setPlugins(plugins);
      parser.parse(onLoad, onError);
    }
  });
  /* GLTFREGISTRY */

  function GLTFRegistry() {
    var objects = {};
    return {
      get: function get(key) {
        return objects[key];
      },
      add: function add(key, object) {
        objects[key] = object;
      },
      remove: function remove(key) {
        delete objects[key];
      },
      removeAll: function removeAll() {
        objects = {};
      }
    };
  }
  /*********************************/

  /********** EXTENSIONS ***********/

  /*********************************/


  var EXTENSIONS = {
    KHR_BINARY_GLTF: 'KHR_binary_glTF',
    KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
    KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
    KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
    KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS: 'KHR_materials_pbrSpecularGlossiness',
    KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
    KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
    KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
    KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
    KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
    MSFT_TEXTURE_DDS: 'MSFT_texture_dds'
  };
  /**
   * DDS Texture Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/MSFT_texture_dds
   *
   */

  function GLTFTextureDDSExtension(ddsLoader) {
    if (!ddsLoader) {
      throw new Error('THREE.GLTFLoader: Attempting to load .dds texture without importing DDSLoader');
    }

    this.name = EXTENSIONS.MSFT_TEXTURE_DDS;
    this.ddsLoader = ddsLoader;
  }
  /**
   * Punctual Lights Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
   */


  function GLTFLightsExtension(json) {
    this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;
    var extension = json.extensions && json.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL] || {};
    this.lightDefs = extension.lights || [];
  }

  GLTFLightsExtension.prototype.loadLight = function (lightIndex) {
    var lightDef = this.lightDefs[lightIndex];
    var lightNode;
    var color = new Color$1(0xffffff);
    if (lightDef.color !== undefined) color.fromArray(lightDef.color);
    var range = lightDef.range !== undefined ? lightDef.range : 0;

    switch (lightDef.type) {
      case 'directional':
        lightNode = new DirectionalLight(color);
        lightNode.target.position.set(0, 0, -1);
        lightNode.add(lightNode.target);
        break;

      case 'point':
        lightNode = new PointLight(color);
        lightNode.distance = range;
        break;

      case 'spot':
        lightNode = new SpotLight(color);
        lightNode.distance = range; // Handle spotlight properties.

        lightDef.spot = lightDef.spot || {};
        lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
        lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
        lightNode.angle = lightDef.spot.outerConeAngle;
        lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
        lightNode.target.position.set(0, 0, -1);
        lightNode.add(lightNode.target);
        break;

      default:
        throw new Error('THREE.GLTFLoader: Unexpected light type, "' + lightDef.type + '".');
    } // Some lights (e.g. spot) default to a position other than the origin. Reset the position
    // here, because node-level parsing will only override position if explicitly specified.


    lightNode.position.set(0, 0, 0);
    lightNode.decay = 2;
    if (lightDef.intensity !== undefined) lightNode.intensity = lightDef.intensity;
    lightNode.name = lightDef.name || 'light_' + lightIndex;
    return Promise.resolve(lightNode);
  };
  /**
   * Unlit Materials Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
   */


  function GLTFMaterialsUnlitExtension() {
    this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;
  }

  GLTFMaterialsUnlitExtension.prototype.getMaterialType = function () {
    return MeshBasicMaterial;
  };

  GLTFMaterialsUnlitExtension.prototype.extendParams = function (materialParams, materialDef, parser) {
    var pending = [];
    materialParams.color = new Color$1(1.0, 1.0, 1.0);
    materialParams.opacity = 1.0;
    var metallicRoughness = materialDef.pbrMetallicRoughness;

    if (metallicRoughness) {
      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        var array = metallicRoughness.baseColorFactor;
        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }

      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'map', metallicRoughness.baseColorTexture));
      }
    }

    return Promise.all(pending);
  };
  /**
   * Clearcoat Materials Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
   */


  function GLTFMaterialsClearcoatExtension(parser) {
    this.parser = parser;
    this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;
  }

  GLTFMaterialsClearcoatExtension.prototype.getMaterialType = function ()
  /* materialIndex */
  {
    return MeshPhysicalMaterial;
  };

  GLTFMaterialsClearcoatExtension.prototype.extendMaterialParams = function (materialIndex, materialParams) {
    var parser = this.parser;
    var materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    var pending = [];
    var extension = materialDef.extensions[this.name];

    if (extension.clearcoatFactor !== undefined) {
      materialParams.clearcoat = extension.clearcoatFactor;
    }

    if (extension.clearcoatTexture !== undefined) {
      pending.push(parser.assignTexture(materialParams, 'clearcoatMap', extension.clearcoatTexture));
    }

    if (extension.clearcoatRoughnessFactor !== undefined) {
      materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;
    }

    if (extension.clearcoatRoughnessTexture !== undefined) {
      pending.push(parser.assignTexture(materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture));
    }

    if (extension.clearcoatNormalTexture !== undefined) {
      pending.push(parser.assignTexture(materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture));

      if (extension.clearcoatNormalTexture.scale !== undefined) {
        var scale = extension.clearcoatNormalTexture.scale;
        materialParams.clearcoatNormalScale = new Vector2(scale, scale);
      }
    }

    return Promise.all(pending);
  };
  /**
   * Transmission Materials Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
   */


  function GLTFMaterialsTransmissionExtension(parser) {
    this.parser = parser;
    this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;
  }

  GLTFMaterialsTransmissionExtension.prototype.getMaterialType = function ()
  /* materialIndex */
  {
    return MeshPhysicalMaterial;
  };

  GLTFMaterialsTransmissionExtension.prototype.extendMaterialParams = function (materialIndex, materialParams) {
    var parser = this.parser;
    var materialDef = parser.json.materials[materialIndex];

    if (!materialDef.extensions || !materialDef.extensions[this.name]) {
      return Promise.resolve();
    }

    var pending = [];
    var extension = materialDef.extensions[this.name];

    if (extension.transmissionFactor !== undefined) {
      materialParams.transmission = extension.transmissionFactor;
    }

    if (extension.transmissionTexture !== undefined) {
      pending.push(parser.assignTexture(materialParams, 'transmissionMap', extension.transmissionTexture));
    }

    return Promise.all(pending);
  };
  /**
   * BasisU Texture Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
   * (draft PR https://github.com/KhronosGroup/glTF/pull/1751)
   */


  function GLTFTextureBasisUExtension(parser) {
    this.parser = parser;
    this.name = EXTENSIONS.KHR_TEXTURE_BASISU;
  }

  GLTFTextureBasisUExtension.prototype.loadTexture = function (textureIndex) {
    var parser = this.parser;
    var json = parser.json;
    var textureDef = json.textures[textureIndex];

    if (!textureDef.extensions || !textureDef.extensions[this.name]) {
      return null;
    }

    var extension = textureDef.extensions[this.name];
    var source = json.images[extension.source];
    var loader = parser.options.ktx2Loader;

    if (!loader) {
      throw new Error('THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures');
    }

    return parser.loadTextureImage(textureIndex, source, loader);
  };
  /* BINARY EXTENSION */


  var BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
  var BINARY_EXTENSION_HEADER_LENGTH = 12;
  var BINARY_EXTENSION_CHUNK_TYPES = {
    JSON: 0x4e4f534a,
    BIN: 0x004e4942
  };

  function GLTFBinaryExtension(data) {
    this.name = EXTENSIONS.KHR_BINARY_GLTF;
    this.content = null;
    this.body = null;
    var headerView = new DataView(data, 0, BINARY_EXTENSION_HEADER_LENGTH);
    this.header = {
      magic: LoaderUtils.decodeText(new Uint8Array(data.slice(0, 4))),
      version: headerView.getUint32(4, true),
      length: headerView.getUint32(8, true)
    };

    if (this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC) {
      throw new Error('THREE.GLTFLoader: Unsupported glTF-Binary header.');
    } else if (this.header.version < 2.0) {
      throw new Error('THREE.GLTFLoader: Legacy binary file detected.');
    }

    var chunkView = new DataView(data, BINARY_EXTENSION_HEADER_LENGTH);
    var chunkIndex = 0;

    while (chunkIndex < chunkView.byteLength) {
      var chunkLength = chunkView.getUint32(chunkIndex, true);
      chunkIndex += 4;
      var chunkType = chunkView.getUint32(chunkIndex, true);
      chunkIndex += 4;

      if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON) {
        var contentArray = new Uint8Array(data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength);
        this.content = LoaderUtils.decodeText(contentArray);
      } else if (chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN) {
        var byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
        this.body = data.slice(byteOffset, byteOffset + chunkLength);
      } // Clients must ignore chunks with unknown types.


      chunkIndex += chunkLength;
    }

    if (this.content === null) {
      throw new Error('THREE.GLTFLoader: JSON content not found.');
    }
  }
  /**
   * DRACO Mesh Compression Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
   */


  function GLTFDracoMeshCompressionExtension(json, dracoLoader) {
    if (!dracoLoader) {
      throw new Error('THREE.GLTFLoader: No DRACOLoader instance provided.');
    }

    this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
    this.json = json;
    this.dracoLoader = dracoLoader;
    this.dracoLoader.preload();
  }

  GLTFDracoMeshCompressionExtension.prototype.decodePrimitive = function (primitive, parser) {
    var json = this.json;
    var dracoLoader = this.dracoLoader;
    var bufferViewIndex = primitive.extensions[this.name].bufferView;
    var gltfAttributeMap = primitive.extensions[this.name].attributes;
    var threeAttributeMap = {};
    var attributeNormalizedMap = {};
    var attributeTypeMap = {};

    for (var attributeName in gltfAttributeMap) {
      var threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();
      threeAttributeMap[threeAttributeName] = gltfAttributeMap[attributeName];
    }

    for (attributeName in primitive.attributes) {
      var threeAttributeName = ATTRIBUTES[attributeName] || attributeName.toLowerCase();

      if (gltfAttributeMap[attributeName] !== undefined) {
        var accessorDef = json.accessors[primitive.attributes[attributeName]];
        var componentType = WEBGL_COMPONENT_TYPES[accessorDef.componentType];
        attributeTypeMap[threeAttributeName] = componentType;
        attributeNormalizedMap[threeAttributeName] = accessorDef.normalized === true;
      }
    }

    return parser.getDependency('bufferView', bufferViewIndex).then(function (bufferView) {
      return new Promise(function (resolve) {
        dracoLoader.decodeDracoFile(bufferView, function (geometry) {
          for (var attributeName in geometry.attributes) {
            var attribute = geometry.attributes[attributeName];
            var normalized = attributeNormalizedMap[attributeName];
            if (normalized !== undefined) attribute.normalized = normalized;
          }

          resolve(geometry);
        }, threeAttributeMap, attributeTypeMap);
      });
    });
  };
  /**
   * Texture Transform Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
   */


  function GLTFTextureTransformExtension() {
    this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;
  }

  GLTFTextureTransformExtension.prototype.extendTexture = function (texture, transform) {
    texture = texture.clone();

    if (transform.offset !== undefined) {
      texture.offset.fromArray(transform.offset);
    }

    if (transform.rotation !== undefined) {
      texture.rotation = transform.rotation;
    }

    if (transform.scale !== undefined) {
      texture.repeat.fromArray(transform.scale);
    }

    if (transform.texCoord !== undefined) {
      console.warn('THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.');
    }

    texture.needsUpdate = true;
    return texture;
  };
  /**
   * Specular-Glossiness Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness
   */

  /**
   * A sub class of StandardMaterial with some of the functionality
   * changed via the `onBeforeCompile` callback
   * @pailhead
   */


  function GLTFMeshStandardSGMaterial(params) {
    MeshStandardMaterial.call(this);
    this.isGLTFSpecularGlossinessMaterial = true; //various chunks that need replacing

    var specularMapParsFragmentChunk = ['#ifdef USE_SPECULARMAP', '	uniform sampler2D specularMap;', '#endif'].join('\n');
    var glossinessMapParsFragmentChunk = ['#ifdef USE_GLOSSINESSMAP', '	uniform sampler2D glossinessMap;', '#endif'].join('\n');
    var specularMapFragmentChunk = ['vec3 specularFactor = specular;', '#ifdef USE_SPECULARMAP', '	vec4 texelSpecular = texture2D( specularMap, vUv );', '	texelSpecular = sRGBToLinear( texelSpecular );', '	// reads channel RGB, compatible with a glTF Specular-Glossiness (RGBA) texture', '	specularFactor *= texelSpecular.rgb;', '#endif'].join('\n');
    var glossinessMapFragmentChunk = ['float glossinessFactor = glossiness;', '#ifdef USE_GLOSSINESSMAP', '	vec4 texelGlossiness = texture2D( glossinessMap, vUv );', '	// reads channel A, compatible with a glTF Specular-Glossiness (RGBA) texture', '	glossinessFactor *= texelGlossiness.a;', '#endif'].join('\n');
    var lightPhysicalFragmentChunk = ['PhysicalMaterial material;', 'material.diffuseColor = diffuseColor.rgb;', 'vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );', 'float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );', 'material.specularRoughness = max( 1.0 - glossinessFactor, 0.0525 );// 0.0525 corresponds to the base mip of a 256 cubemap.', 'material.specularRoughness += geometryRoughness;', 'material.specularRoughness = min( material.specularRoughness, 1.0 );', 'material.specularColor = specularFactor.rgb;'].join('\n');
    var uniforms = {
      specular: {
        value: new Color$1().setHex(0xffffff)
      },
      glossiness: {
        value: 1
      },
      specularMap: {
        value: null
      },
      glossinessMap: {
        value: null
      }
    };
    this._extraUniforms = uniforms; // please see #14031 or #13198 for an alternate approach

    this.onBeforeCompile = function (shader) {
      for (var uniformName in uniforms) {
        shader.uniforms[uniformName] = uniforms[uniformName];
      }

      shader.fragmentShader = shader.fragmentShader.replace('uniform float roughness;', 'uniform vec3 specular;');
      shader.fragmentShader = shader.fragmentShader.replace('uniform float metalness;', 'uniform float glossiness;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_pars_fragment>', specularMapParsFragmentChunk);
      shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_pars_fragment>', glossinessMapParsFragmentChunk);
      shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', specularMapFragmentChunk);
      shader.fragmentShader = shader.fragmentShader.replace('#include <metalnessmap_fragment>', glossinessMapFragmentChunk);
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_fragment>', lightPhysicalFragmentChunk);
    };
    /*eslint-disable*/


    Object.defineProperties(this, {
      specular: {
        get: function get() {
          return uniforms.specular.value;
        },
        set: function set(v) {
          uniforms.specular.value = v;
        }
      },
      specularMap: {
        get: function get() {
          return uniforms.specularMap.value;
        },
        set: function set(v) {
          uniforms.specularMap.value = v;
        }
      },
      glossiness: {
        get: function get() {
          return uniforms.glossiness.value;
        },
        set: function set(v) {
          uniforms.glossiness.value = v;
        }
      },
      glossinessMap: {
        get: function get() {
          return uniforms.glossinessMap.value;
        },
        set: function set(v) {
          uniforms.glossinessMap.value = v; //how about something like this - @pailhead

          if (v) {
            this.defines.USE_GLOSSINESSMAP = ''; // set USE_ROUGHNESSMAP to enable vUv

            this.defines.USE_ROUGHNESSMAP = '';
          } else {
            delete this.defines.USE_ROUGHNESSMAP;
            delete this.defines.USE_GLOSSINESSMAP;
          }
        }
      }
    });
    /*eslint-enable*/

    delete this.metalness;
    delete this.roughness;
    delete this.metalnessMap;
    delete this.roughnessMap;
    this.setValues(params);
  }

  GLTFMeshStandardSGMaterial.prototype = Object.create(MeshStandardMaterial.prototype);
  GLTFMeshStandardSGMaterial.prototype.constructor = GLTFMeshStandardSGMaterial;

  GLTFMeshStandardSGMaterial.prototype.copy = function (source) {
    MeshStandardMaterial.prototype.copy.call(this, source);
    this.specularMap = source.specularMap;
    this.specular.copy(source.specular);
    this.glossinessMap = source.glossinessMap;
    this.glossiness = source.glossiness;
    delete this.metalness;
    delete this.roughness;
    delete this.metalnessMap;
    delete this.roughnessMap;
    return this;
  };

  function GLTFMaterialsPbrSpecularGlossinessExtension() {
    return {
      name: EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS,
      specularGlossinessParams: ['color', 'map', 'lightMap', 'lightMapIntensity', 'aoMap', 'aoMapIntensity', 'emissive', 'emissiveIntensity', 'emissiveMap', 'bumpMap', 'bumpScale', 'normalMap', 'normalMapType', 'displacementMap', 'displacementScale', 'displacementBias', 'specularMap', 'specular', 'glossinessMap', 'glossiness', 'alphaMap', 'envMap', 'envMapIntensity', 'refractionRatio'],
      getMaterialType: function getMaterialType() {
        return GLTFMeshStandardSGMaterial;
      },
      extendParams: function extendParams(materialParams, materialDef, parser) {
        var pbrSpecularGlossiness = materialDef.extensions[this.name];
        materialParams.color = new Color$1(1.0, 1.0, 1.0);
        materialParams.opacity = 1.0;
        var pending = [];

        if (Array.isArray(pbrSpecularGlossiness.diffuseFactor)) {
          var array = pbrSpecularGlossiness.diffuseFactor;
          materialParams.color.fromArray(array);
          materialParams.opacity = array[3];
        }

        if (pbrSpecularGlossiness.diffuseTexture !== undefined) {
          pending.push(parser.assignTexture(materialParams, 'map', pbrSpecularGlossiness.diffuseTexture));
        }

        materialParams.emissive = new Color$1(0.0, 0.0, 0.0);
        materialParams.glossiness = pbrSpecularGlossiness.glossinessFactor !== undefined ? pbrSpecularGlossiness.glossinessFactor : 1.0;
        materialParams.specular = new Color$1(1.0, 1.0, 1.0);

        if (Array.isArray(pbrSpecularGlossiness.specularFactor)) {
          materialParams.specular.fromArray(pbrSpecularGlossiness.specularFactor);
        }

        if (pbrSpecularGlossiness.specularGlossinessTexture !== undefined) {
          var specGlossMapDef = pbrSpecularGlossiness.specularGlossinessTexture;
          pending.push(parser.assignTexture(materialParams, 'glossinessMap', specGlossMapDef));
          pending.push(parser.assignTexture(materialParams, 'specularMap', specGlossMapDef));
        }

        return Promise.all(pending);
      },
      createMaterial: function createMaterial(materialParams) {
        var material = new GLTFMeshStandardSGMaterial(materialParams);
        material.fog = true;
        material.color = materialParams.color;
        material.map = materialParams.map === undefined ? null : materialParams.map;
        material.lightMap = null;
        material.lightMapIntensity = 1.0;
        material.aoMap = materialParams.aoMap === undefined ? null : materialParams.aoMap;
        material.aoMapIntensity = 1.0;
        material.emissive = materialParams.emissive;
        material.emissiveIntensity = 1.0;
        material.emissiveMap = materialParams.emissiveMap === undefined ? null : materialParams.emissiveMap;
        material.bumpMap = materialParams.bumpMap === undefined ? null : materialParams.bumpMap;
        material.bumpScale = 1;
        material.normalMap = materialParams.normalMap === undefined ? null : materialParams.normalMap;
        material.normalMapType = TangentSpaceNormalMap;
        if (materialParams.normalScale) material.normalScale = materialParams.normalScale;
        material.displacementMap = null;
        material.displacementScale = 1;
        material.displacementBias = 0;
        material.specularMap = materialParams.specularMap === undefined ? null : materialParams.specularMap;
        material.specular = materialParams.specular;
        material.glossinessMap = materialParams.glossinessMap === undefined ? null : materialParams.glossinessMap;
        material.glossiness = materialParams.glossiness;
        material.alphaMap = null;
        material.envMap = materialParams.envMap === undefined ? null : materialParams.envMap;
        material.envMapIntensity = 1.0;
        material.refractionRatio = 0.98;
        return material;
      }
    };
  }
  /**
   * Mesh Quantization Extension
   *
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
   */


  function GLTFMeshQuantizationExtension() {
    this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;
  }
  /*********************************/

  /********** INTERPOLATION ********/

  /*********************************/
  // Spline Interpolation
  // Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation


  function GLTFCubicSplineInterpolant(parameterPositions, sampleValues, sampleSize, resultBuffer) {
    Interpolant.call(this, parameterPositions, sampleValues, sampleSize, resultBuffer);
  }

  GLTFCubicSplineInterpolant.prototype = Object.create(Interpolant.prototype);
  GLTFCubicSplineInterpolant.prototype.constructor = GLTFCubicSplineInterpolant;

  GLTFCubicSplineInterpolant.prototype.copySampleValue_ = function (index) {
    // Copies a sample value to the result buffer. See description of glTF
    // CUBICSPLINE values layout in interpolate_() function below.
    var result = this.resultBuffer,
        values = this.sampleValues,
        valueSize = this.valueSize,
        offset = index * valueSize * 3 + valueSize;

    for (var i = 0; i !== valueSize; i++) {
      result[i] = values[offset + i];
    }

    return result;
  };

  GLTFCubicSplineInterpolant.prototype.beforeStart_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;
  GLTFCubicSplineInterpolant.prototype.afterEnd_ = GLTFCubicSplineInterpolant.prototype.copySampleValue_;

  GLTFCubicSplineInterpolant.prototype.interpolate_ = function (i1, t0, t, t1) {
    var result = this.resultBuffer;
    var values = this.sampleValues;
    var stride = this.valueSize;
    var stride2 = stride * 2;
    var stride3 = stride * 3;
    var td = t1 - t0;
    var p = (t - t0) / td;
    var pp = p * p;
    var ppp = pp * p;
    var offset1 = i1 * stride3;
    var offset0 = offset1 - stride3;
    var s2 = -2 * ppp + 3 * pp;
    var s3 = ppp - pp;
    var s0 = 1 - s2;
    var s1 = s3 - pp + p; // Layout of keyframe output values for CUBICSPLINE animations:
    //   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]

    for (var i = 0; i !== stride; i++) {
      var p0 = values[offset0 + i + stride]; // splineVertex_k

      var m0 = values[offset0 + i + stride2] * td; // outTangent_k * (t_k+1 - t_k)

      var p1 = values[offset1 + i + stride]; // splineVertex_k+1

      var m1 = values[offset1 + i] * td; // inTangent_k+1 * (t_k+1 - t_k)

      result[i] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;
    }

    return result;
  };
  /*********************************/

  /********** INTERNALS ************/

  /*********************************/

  /* CONSTANTS */


  var WEBGL_CONSTANTS = {
    FLOAT: 5126,
    //FLOAT_MAT2: 35674,
    FLOAT_MAT3: 35675,
    FLOAT_MAT4: 35676,
    FLOAT_VEC2: 35664,
    FLOAT_VEC3: 35665,
    FLOAT_VEC4: 35666,
    LINEAR: 9729,
    REPEAT: 10497,
    SAMPLER_2D: 35678,
    POINTS: 0,
    LINES: 1,
    LINE_LOOP: 2,
    LINE_STRIP: 3,
    TRIANGLES: 4,
    TRIANGLE_STRIP: 5,
    TRIANGLE_FAN: 6,
    UNSIGNED_BYTE: 5121,
    UNSIGNED_SHORT: 5123
  };
  var WEBGL_COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array
  };
  var WEBGL_FILTERS = {
    9728: NearestFilter,
    9729: LinearFilter,
    9984: NearestMipmapNearestFilter,
    9985: LinearMipmapNearestFilter,
    9986: NearestMipmapLinearFilter,
    9987: LinearMipmapLinearFilter
  };
  var WEBGL_WRAPPINGS = {
    33071: ClampToEdgeWrapping,
    33648: MirroredRepeatWrapping,
    10497: RepeatWrapping
  };
  var WEBGL_TYPE_SIZES = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16
  };
  var ATTRIBUTES = {
    POSITION: 'position',
    NORMAL: 'normal',
    TANGENT: 'tangent',
    TEXCOORD_0: 'uv',
    TEXCOORD_1: 'uv2',
    COLOR_0: 'color',
    WEIGHTS_0: 'skinWeight',
    JOINTS_0: 'skinIndex'
  };
  var PATH_PROPERTIES = {
    scale: 'scale',
    translation: 'position',
    rotation: 'quaternion',
    weights: 'morphTargetInfluences'
  };
  var INTERPOLATION = {
    CUBICSPLINE: undefined,
    // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
    // keyframe track will be initialized with a default interpolation type, then modified.
    LINEAR: InterpolateLinear,
    STEP: InterpolateDiscrete
  };
  var ALPHA_MODES = {
    OPAQUE: 'OPAQUE',
    MASK: 'MASK',
    BLEND: 'BLEND'
  };
  var MIME_TYPE_FORMATS = {
    'image/png': RGBAFormat,
    'image/jpeg': RGBFormat
  };
  /* UTILITY FUNCTIONS */

  function resolveURL(url, path) {
    // Invalid URL
    if (typeof url !== 'string' || url === '') return ''; // Host Relative URL

    if (/^https?:\/\//i.test(path) && /^\//.test(url)) {
      path = path.replace(/(^https?:\/\/[^\/]+).*/i, '$1');
    } // Absolute URL http://,https://,//


    if (/^(https?:)?\/\//i.test(url)) return url; // Data URI

    if (/^data:.*,.*$/i.test(url)) return url; // Blob URL

    if (/^blob:.*$/i.test(url)) return url; // Relative URL

    return path + url;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
   */


  function createDefaultMaterial(cache) {
    if (cache['DefaultMaterial'] === undefined) {
      cache['DefaultMaterial'] = new MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x000000,
        metalness: 1,
        roughness: 1,
        transparent: false,
        depthTest: true,
        side: FrontSide
      });
    }

    return cache['DefaultMaterial'];
  }

  function addUnknownExtensionsToUserData(knownExtensions, object, objectDef) {
    // Add unknown glTF extensions to an object's userData.
    for (var name in objectDef.extensions) {
      if (knownExtensions[name] === undefined) {
        object.userData.gltfExtensions = object.userData.gltfExtensions || {};
        object.userData.gltfExtensions[name] = objectDef.extensions[name];
      }
    }
  }
  /**
   * @param {Object3D|Material|BufferGeometry} object
   * @param {GLTF.definition} gltfDef
   */


  function assignExtrasToUserData(object, gltfDef) {
    if (gltfDef.extras !== undefined) {
      if (_typeof2(gltfDef.extras) === 'object') {
        Object.assign(object.userData, gltfDef.extras);
      } else {
        console.warn('THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras);
      }
    }
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
   *
   * @param {BufferGeometry} geometry
   * @param {Array<GLTF.Target>} targets
   * @param {GLTFParser} parser
   * @return {Promise<BufferGeometry>}
   */


  function addMorphTargets(geometry, targets, parser) {
    var hasMorphPosition = false;
    var hasMorphNormal = false;

    for (var i = 0, il = targets.length; i < il; i++) {
      var target = targets[i];
      if (target.POSITION !== undefined) hasMorphPosition = true;
      if (target.NORMAL !== undefined) hasMorphNormal = true;
      if (hasMorphPosition && hasMorphNormal) break;
    }

    if (!hasMorphPosition && !hasMorphNormal) return Promise.resolve(geometry);
    var pendingPositionAccessors = [];
    var pendingNormalAccessors = [];

    for (var i = 0, il = targets.length; i < il; i++) {
      var target = targets[i];

      if (hasMorphPosition) {
        var pendingAccessor = target.POSITION !== undefined ? parser.getDependency('accessor', target.POSITION) : geometry.attributes.position;
        pendingPositionAccessors.push(pendingAccessor);
      }

      if (hasMorphNormal) {
        var pendingAccessor = target.NORMAL !== undefined ? parser.getDependency('accessor', target.NORMAL) : geometry.attributes.normal;
        pendingNormalAccessors.push(pendingAccessor);
      }
    }

    return Promise.all([Promise.all(pendingPositionAccessors), Promise.all(pendingNormalAccessors)]).then(function (accessors) {
      var morphPositions = accessors[0];
      var morphNormals = accessors[1];
      if (hasMorphPosition) geometry.morphAttributes.position = morphPositions;
      if (hasMorphNormal) geometry.morphAttributes.normal = morphNormals;
      geometry.morphTargetsRelative = true;
      return geometry;
    });
  }
  /**
   * @param {Mesh} mesh
   * @param {GLTF.Mesh} meshDef
   */


  function updateMorphTargets(mesh, meshDef) {
    mesh.updateMorphTargets();

    if (meshDef.weights !== undefined) {
      for (var i = 0, il = meshDef.weights.length; i < il; i++) {
        mesh.morphTargetInfluences[i] = meshDef.weights[i];
      }
    } // .extras has user-defined data, so check that .extras.targetNames is an array.


    if (meshDef.extras && Array.isArray(meshDef.extras.targetNames)) {
      var targetNames = meshDef.extras.targetNames;

      if (mesh.morphTargetInfluences.length === targetNames.length) {
        mesh.morphTargetDictionary = {};

        for (var i = 0, il = targetNames.length; i < il; i++) {
          mesh.morphTargetDictionary[targetNames[i]] = i;
        }
      } else {
        console.warn('THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.');
      }
    }
  }

  function createPrimitiveKey(primitiveDef) {
    var dracoExtension = primitiveDef.extensions && primitiveDef.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION];
    var geometryKey;

    if (dracoExtension) {
      geometryKey = 'draco:' + dracoExtension.bufferView + ':' + dracoExtension.indices + ':' + createAttributesKey(dracoExtension.attributes);
    } else {
      geometryKey = primitiveDef.indices + ':' + createAttributesKey(primitiveDef.attributes) + ':' + primitiveDef.mode;
    }

    return geometryKey;
  }

  function createAttributesKey(attributes) {
    var attributesKey = '';
    var keys = Object.keys(attributes).sort();

    for (var i = 0, il = keys.length; i < il; i++) {
      attributesKey += keys[i] + ':' + attributes[keys[i]] + ';';
    }

    return attributesKey;
  }
  /* GLTF PARSER */


  function GLTFParser(json, options) {
    this.json = json || {};
    this.extensions = {};
    this.plugins = {};
    this.options = options || {}; // loader object cache

    this.cache = new GLTFRegistry(); // associations between Three.js objects and glTF elements

    this.associations = new Map(); // BufferGeometry caching

    this.primitiveCache = {}; // Object3D instance caches

    this.meshCache = {
      refs: {},
      uses: {}
    };
    this.cameraCache = {
      refs: {},
      uses: {}
    };
    this.lightCache = {
      refs: {},
      uses: {}
    }; // Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
    // expensive work of uploading a texture to the GPU off the main thread.

    if (typeof createImageBitmap !== 'undefined' && /Firefox/.test(navigator.userAgent) === false) {
      this.textureLoader = new ImageBitmapLoader(this.options.manager);
    } else {
      this.textureLoader = new TextureLoader(this.options.manager);
    }

    this.textureLoader.setCrossOrigin(this.options.crossOrigin);
    this.fileLoader = new FileLoader(this.options.manager);
    this.fileLoader.setResponseType('arraybuffer');

    if (this.options.crossOrigin === 'use-credentials') {
      this.fileLoader.setWithCredentials(true);
    }
  }

  GLTFParser.prototype.setExtensions = function (extensions) {
    this.extensions = extensions;
  };

  GLTFParser.prototype.setPlugins = function (plugins) {
    this.plugins = plugins;
  };

  GLTFParser.prototype.parse = function (onLoad, onError) {
    var parser = this;
    var json = this.json;
    var extensions = this.extensions; // Clear the loader cache

    this.cache.removeAll(); // Mark the special nodes/meshes in json for efficient parse

    this._markDefs();

    Promise.all([this.getDependencies('scene'), this.getDependencies('animation'), this.getDependencies('camera')]).then(function (dependencies) {
      var result = {
        scene: dependencies[0][json.scene || 0],
        scenes: dependencies[0],
        animations: dependencies[1],
        cameras: dependencies[2],
        asset: json.asset,
        parser: parser,
        userData: {}
      };
      addUnknownExtensionsToUserData(extensions, result, json);
      assignExtrasToUserData(result, json);
      onLoad(result);
    })["catch"](onError);
  };
  /**
   * Marks the special nodes/meshes in json for efficient parse.
   */


  GLTFParser.prototype._markDefs = function () {
    var nodeDefs = this.json.nodes || [];
    var skinDefs = this.json.skins || [];
    var meshDefs = this.json.meshes || []; // Nothing in the node definition indicates whether it is a Bone or an
    // Object3D. Use the skins' joint references to mark bones.

    for (var skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex++) {
      var joints = skinDefs[skinIndex].joints;

      for (var i = 0, il = joints.length; i < il; i++) {
        nodeDefs[joints[i]].isBone = true;
      }
    } // Iterate over all nodes, marking references to shared resources,
    // as well as skeleton joints.


    for (var nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex++) {
      var nodeDef = nodeDefs[nodeIndex];

      if (nodeDef.mesh !== undefined) {
        this._addNodeRef(this.meshCache, nodeDef.mesh); // Nothing in the mesh definition indicates whether it is
        // a SkinnedMesh or Mesh. Use the node's mesh reference
        // to mark SkinnedMesh if node has skin.


        if (nodeDef.skin !== undefined) {
          meshDefs[nodeDef.mesh].isSkinnedMesh = true;
        }
      }

      if (nodeDef.camera !== undefined) {
        this._addNodeRef(this.cameraCache, nodeDef.camera);
      }

      if (nodeDef.extensions && nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL] && nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light !== undefined) {
        this._addNodeRef(this.lightCache, nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light);
      }
    }
  };
  /**
   * Counts references to shared node / Object3D resources. These resources
   * can be reused, or "instantiated", at multiple nodes in the scene
   * hierarchy. Mesh, Camera, and Light instances are instantiated and must
   * be marked. Non-scenegraph resources (like Materials, Geometries, and
   * Textures) can be reused directly and are not marked here.
   *
   * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
   */


  GLTFParser.prototype._addNodeRef = function (cache, index) {
    if (index === undefined) return;

    if (cache.refs[index] === undefined) {
      cache.refs[index] = cache.uses[index] = 0;
    }

    cache.refs[index]++;
  };
  /** Returns a reference to a shared resource, cloning it if necessary. */


  GLTFParser.prototype._getNodeRef = function (cache, index, object) {
    if (cache.refs[index] <= 1) return object;
    var ref = object.clone();
    ref.name += '_instance_' + cache.uses[index]++;
    return ref;
  };

  GLTFParser.prototype._invokeOne = function (func) {
    var extensions = Object.values(this.plugins);
    extensions.push(this);

    for (var i = 0; i < extensions.length; i++) {
      var result = func(extensions[i]);
      if (result) return result;
    }
  };

  GLTFParser.prototype._invokeAll = function (func) {
    var extensions = Object.values(this.plugins);
    extensions.unshift(this);
    var pending = [];

    for (var i = 0; i < extensions.length; i++) {
      pending.push(func(extensions[i]));
    }

    return Promise.all(pending);
  };
  /**
   * Requests the specified dependency asynchronously, with caching.
   * @param {string} type
   * @param {number} index
   * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
   */


  GLTFParser.prototype.getDependency = function (type, index) {
    var cacheKey = type + ':' + index;
    var dependency = this.cache.get(cacheKey);

    if (!dependency) {
      switch (type) {
        case 'scene':
          dependency = this.loadScene(index);
          break;

        case 'node':
          dependency = this.loadNode(index);
          break;

        case 'mesh':
          dependency = this._invokeOne(function (ext) {
            return ext.loadMesh && ext.loadMesh(index);
          });
          break;

        case 'accessor':
          dependency = this.loadAccessor(index);
          break;

        case 'bufferView':
          dependency = this._invokeOne(function (ext) {
            return ext.loadBufferView && ext.loadBufferView(index);
          });
          break;

        case 'buffer':
          dependency = this.loadBuffer(index);
          break;

        case 'material':
          dependency = this._invokeOne(function (ext) {
            return ext.loadMaterial && ext.loadMaterial(index);
          });
          break;

        case 'texture':
          dependency = this._invokeOne(function (ext) {
            return ext.loadTexture && ext.loadTexture(index);
          });
          break;

        case 'skin':
          dependency = this.loadSkin(index);
          break;

        case 'animation':
          dependency = this.loadAnimation(index);
          break;

        case 'camera':
          dependency = this.loadCamera(index);
          break;

        case 'light':
          dependency = this.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].loadLight(index);
          break;

        default:
          throw new Error('Unknown type: ' + type);
      }

      this.cache.add(cacheKey, dependency);
    }

    return dependency;
  };
  /**
   * Requests all dependencies of the specified type asynchronously, with caching.
   * @param {string} type
   * @return {Promise<Array<Object>>}
   */


  GLTFParser.prototype.getDependencies = function (type) {
    var dependencies = this.cache.get(type);

    if (!dependencies) {
      var parser = this;
      var defs = this.json[type + (type === 'mesh' ? 'es' : 's')] || [];
      dependencies = Promise.all(defs.map(function (def, index) {
        return parser.getDependency(type, index);
      }));
      this.cache.add(type, dependencies);
    }

    return dependencies;
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferIndex
   * @return {Promise<ArrayBuffer>}
   */


  GLTFParser.prototype.loadBuffer = function (bufferIndex) {
    var bufferDef = this.json.buffers[bufferIndex];
    var loader = this.fileLoader;

    if (bufferDef.type && bufferDef.type !== 'arraybuffer') {
      throw new Error('THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.');
    } // If present, GLB container is required to be the first buffer.


    if (bufferDef.uri === undefined && bufferIndex === 0) {
      return Promise.resolve(this.extensions[EXTENSIONS.KHR_BINARY_GLTF].body);
    }

    var options = this.options;
    return new Promise(function (resolve, reject) {
      loader.load(resolveURL(bufferDef.uri, options.path), resolve, undefined, function () {
        reject(new Error('THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".'));
      });
    });
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
   * @param {number} bufferViewIndex
   * @return {Promise<ArrayBuffer>}
   */


  GLTFParser.prototype.loadBufferView = function (bufferViewIndex) {
    var bufferViewDef = this.json.bufferViews[bufferViewIndex];
    return this.getDependency('buffer', bufferViewDef.buffer).then(function (buffer) {
      var byteLength = bufferViewDef.byteLength || 0;
      var byteOffset = bufferViewDef.byteOffset || 0;
      return buffer.slice(byteOffset, byteOffset + byteLength);
    });
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
   * @param {number} accessorIndex
   * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
   */


  GLTFParser.prototype.loadAccessor = function (accessorIndex) {
    var parser = this;
    var json = this.json;
    var accessorDef = this.json.accessors[accessorIndex];

    if (accessorDef.bufferView === undefined && accessorDef.sparse === undefined) {
      // Ignore empty accessors, which may be used to declare runtime
      // information about attributes coming from another source (e.g. Draco
      // compression extension).
      return Promise.resolve(null);
    }

    var pendingBufferViews = [];

    if (accessorDef.bufferView !== undefined) {
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.bufferView));
    } else {
      pendingBufferViews.push(null);
    }

    if (accessorDef.sparse !== undefined) {
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.indices.bufferView));
      pendingBufferViews.push(this.getDependency('bufferView', accessorDef.sparse.values.bufferView));
    }

    return Promise.all(pendingBufferViews).then(function (bufferViews) {
      var bufferView = bufferViews[0];
      var itemSize = WEBGL_TYPE_SIZES[accessorDef.type];
      var TypedArray = WEBGL_COMPONENT_TYPES[accessorDef.componentType]; // For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.

      var elementBytes = TypedArray.BYTES_PER_ELEMENT;
      var itemBytes = elementBytes * itemSize;
      var byteOffset = accessorDef.byteOffset || 0;
      var byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[accessorDef.bufferView].byteStride : undefined;
      var normalized = accessorDef.normalized === true;
      var array, bufferAttribute; // The buffer is not interleaved if the stride is the item size in bytes.

      if (byteStride && byteStride !== itemBytes) {
        // Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
        // This makes sure that IBA.count reflects accessor.count properly
        var ibSlice = Math.floor(byteOffset / byteStride);
        var ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count;
        var ib = parser.cache.get(ibCacheKey);

        if (!ib) {
          array = new TypedArray(bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes); // Integer parameters to IB/IBA are in array elements, not bytes.

          ib = new InterleavedBuffer(array, byteStride / elementBytes);
          parser.cache.add(ibCacheKey, ib);
        }

        bufferAttribute = new InterleavedBufferAttribute(ib, itemSize, byteOffset % byteStride / elementBytes, normalized);
      } else {
        if (bufferView === null) {
          array = new TypedArray(accessorDef.count * itemSize);
        } else {
          array = new TypedArray(bufferView, byteOffset, accessorDef.count * itemSize);
        }

        bufferAttribute = new BufferAttribute(array, itemSize, normalized);
      } // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors


      if (accessorDef.sparse !== undefined) {
        var itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
        var TypedArrayIndices = WEBGL_COMPONENT_TYPES[accessorDef.sparse.indices.componentType];
        var byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
        var byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;
        var sparseIndices = new TypedArrayIndices(bufferViews[1], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices);
        var sparseValues = new TypedArray(bufferViews[2], byteOffsetValues, accessorDef.sparse.count * itemSize);

        if (bufferView !== null) {
          // Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
          bufferAttribute = new BufferAttribute(bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized);
        }

        for (var i = 0, il = sparseIndices.length; i < il; i++) {
          var index = sparseIndices[i];
          bufferAttribute.setX(index, sparseValues[i * itemSize]);
          if (itemSize >= 2) bufferAttribute.setY(index, sparseValues[i * itemSize + 1]);
          if (itemSize >= 3) bufferAttribute.setZ(index, sparseValues[i * itemSize + 2]);
          if (itemSize >= 4) bufferAttribute.setW(index, sparseValues[i * itemSize + 3]);
          if (itemSize >= 5) throw new Error('THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.');
        }
      }

      return bufferAttribute;
    });
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
   * @param {number} textureIndex
   * @return {Promise<THREE.Texture>}
   */


  GLTFParser.prototype.loadTexture = function (textureIndex) {
    var parser = this;
    var json = this.json;
    var options = this.options;
    var textureDef = json.textures[textureIndex];
    var textureExtensions = textureDef.extensions || {};
    var source;

    if (textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS]) {
      source = json.images[textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS].source];
    } else {
      source = json.images[textureDef.source];
    }

    var loader;

    if (source.uri) {
      loader = options.manager.getHandler(source.uri);
    }

    if (!loader) {
      loader = textureExtensions[EXTENSIONS.MSFT_TEXTURE_DDS] ? parser.extensions[EXTENSIONS.MSFT_TEXTURE_DDS].ddsLoader : this.textureLoader;
    }

    return this.loadTextureImage(textureIndex, source, loader);
  };

  GLTFParser.prototype.loadTextureImage = function (textureIndex, source, loader) {
    var parser = this;
    var json = this.json;
    var options = this.options;
    var textureDef = json.textures[textureIndex];
    var URL = self.URL || self.webkitURL;
    var sourceURI = source.uri;
    var isObjectURL = false;

    if (source.bufferView !== undefined) {
      // Load binary image data from bufferView, if provided.
      sourceURI = parser.getDependency('bufferView', source.bufferView).then(function (bufferView) {
        isObjectURL = true;
        var blob = new Blob([bufferView], {
          type: source.mimeType
        });
        sourceURI = URL.createObjectURL(blob);
        return sourceURI;
      });
    }

    return Promise.resolve(sourceURI).then(function (sourceURI) {
      return new Promise(function (resolve, reject) {
        var onLoad = resolve;

        if (loader.isImageBitmapLoader === true) {
          onLoad = function onLoad(imageBitmap) {
            resolve(new CanvasTexture(imageBitmap));
          };
        }

        loader.load(resolveURL(sourceURI, options.path), onLoad, undefined, reject);
      });
    }).then(function (texture) {
      // Clean up resources and configure Texture.
      if (isObjectURL === true) {
        URL.revokeObjectURL(sourceURI);
      }

      texture.flipY = false;
      if (textureDef.name) texture.name = textureDef.name; // Ignore unknown mime types, like DDS files.

      if (source.mimeType in MIME_TYPE_FORMATS) {
        texture.format = MIME_TYPE_FORMATS[source.mimeType];
      }

      var samplers = json.samplers || {};
      var sampler = samplers[textureDef.sampler] || {};
      texture.magFilter = WEBGL_FILTERS[sampler.magFilter] || LinearFilter;
      texture.minFilter = WEBGL_FILTERS[sampler.minFilter] || LinearMipmapLinearFilter;
      texture.wrapS = WEBGL_WRAPPINGS[sampler.wrapS] || RepeatWrapping;
      texture.wrapT = WEBGL_WRAPPINGS[sampler.wrapT] || RepeatWrapping;
      parser.associations.set(texture, {
        type: 'textures',
        index: textureIndex
      });
      return texture;
    });
  };
  /**
   * Asynchronously assigns a texture to the given material parameters.
   * @param {Object} materialParams
   * @param {string} mapName
   * @param {Object} mapDef
   * @return {Promise}
   */


  GLTFParser.prototype.assignTexture = function (materialParams, mapName, mapDef) {
    var parser = this;
    return this.getDependency('texture', mapDef.index).then(function (texture) {
      if (!texture.isCompressedTexture) {
        switch (mapName) {
          case 'aoMap':
          case 'emissiveMap':
          case 'metalnessMap':
          case 'normalMap':
          case 'roughnessMap':
            texture.format = RGBFormat;
            break;
        }
      } // Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
      // However, we will copy UV set 0 to UV set 1 on demand for aoMap


      if (mapDef.texCoord !== undefined && mapDef.texCoord != 0 && !(mapName === 'aoMap' && mapDef.texCoord == 1)) {
        console.warn('THREE.GLTFLoader: Custom UV set ' + mapDef.texCoord + ' for texture ' + mapName + ' not yet supported.');
      }

      if (parser.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM]) {
        var transform = mapDef.extensions !== undefined ? mapDef.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM] : undefined;

        if (transform) {
          var gltfReference = parser.associations.get(texture);
          texture = parser.extensions[EXTENSIONS.KHR_TEXTURE_TRANSFORM].extendTexture(texture, transform);
          parser.associations.set(texture, gltfReference);
        }
      }

      materialParams[mapName] = texture;
    });
  };
  /**
   * Assigns final material to a Mesh, Line, or Points instance. The instance
   * already has a material (generated from the glTF material options alone)
   * but reuse of the same glTF material may require multiple threejs materials
   * to accomodate different primitive types, defines, etc. New materials will
   * be created if necessary, and reused from a cache.
   * @param  {Object3D} mesh Mesh, Line, or Points instance.
   */


  GLTFParser.prototype.assignFinalMaterial = function (mesh) {
    var geometry = mesh.geometry;
    var material = mesh.material;
    var useVertexTangents = geometry.attributes.tangent !== undefined;
    var useVertexColors = geometry.attributes.color !== undefined;
    var useFlatShading = geometry.attributes.normal === undefined;
    var useSkinning = mesh.isSkinnedMesh === true;
    var useMorphTargets = Object.keys(geometry.morphAttributes).length > 0;
    var useMorphNormals = useMorphTargets && geometry.morphAttributes.normal !== undefined;

    if (mesh.isPoints) {
      var cacheKey = 'PointsMaterial:' + material.uuid;
      var pointsMaterial = this.cache.get(cacheKey);

      if (!pointsMaterial) {
        pointsMaterial = new PointsMaterial();
        Material.prototype.copy.call(pointsMaterial, material);
        pointsMaterial.color.copy(material.color);
        pointsMaterial.map = material.map;
        pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

        this.cache.add(cacheKey, pointsMaterial);
      }

      material = pointsMaterial;
    } else if (mesh.isLine) {
      var cacheKey = 'LineBasicMaterial:' + material.uuid;
      var lineMaterial = this.cache.get(cacheKey);

      if (!lineMaterial) {
        lineMaterial = new LineBasicMaterial();
        Material.prototype.copy.call(lineMaterial, material);
        lineMaterial.color.copy(material.color);
        this.cache.add(cacheKey, lineMaterial);
      }

      material = lineMaterial;
    } // Clone the material if it will be modified


    if (useVertexTangents || useVertexColors || useFlatShading || useSkinning || useMorphTargets) {
      var cacheKey = 'ClonedMaterial:' + material.uuid + ':';
      if (material.isGLTFSpecularGlossinessMaterial) cacheKey += 'specular-glossiness:';
      if (useSkinning) cacheKey += 'skinning:';
      if (useVertexTangents) cacheKey += 'vertex-tangents:';
      if (useVertexColors) cacheKey += 'vertex-colors:';
      if (useFlatShading) cacheKey += 'flat-shading:';
      if (useMorphTargets) cacheKey += 'morph-targets:';
      if (useMorphNormals) cacheKey += 'morph-normals:';
      var cachedMaterial = this.cache.get(cacheKey);

      if (!cachedMaterial) {
        cachedMaterial = material.clone();
        if (useSkinning) cachedMaterial.skinning = true;
        if (useVertexTangents) cachedMaterial.vertexTangents = true;
        if (useVertexColors) cachedMaterial.vertexColors = true;
        if (useFlatShading) cachedMaterial.flatShading = true;
        if (useMorphTargets) cachedMaterial.morphTargets = true;
        if (useMorphNormals) cachedMaterial.morphNormals = true;
        this.cache.add(cacheKey, cachedMaterial);
        this.associations.set(cachedMaterial, this.associations.get(material));
      }

      material = cachedMaterial;
    } // workarounds for mesh and geometry


    if (material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined) {
      geometry.setAttribute('uv2', geometry.attributes.uv);
    } // https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995


    if (material.normalScale && !useVertexTangents) {
      material.normalScale.y = -material.normalScale.y;
    }

    if (material.clearcoatNormalScale && !useVertexTangents) {
      material.clearcoatNormalScale.y = -material.clearcoatNormalScale.y;
    }

    mesh.material = material;
  };

  GLTFParser.prototype.getMaterialType = function ()
  /* materialIndex */
  {
    return MeshStandardMaterial;
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
   * @param {number} materialIndex
   * @return {Promise<Material>}
   */


  GLTFParser.prototype.loadMaterial = function (materialIndex) {
    var parser = this;
    var json = this.json;
    var extensions = this.extensions;
    var materialDef = json.materials[materialIndex];
    var materialType;
    var materialParams = {};
    var materialExtensions = materialDef.extensions || {};
    var pending = [];

    if (materialExtensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS]) {
      var sgExtension = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS];
      materialType = sgExtension.getMaterialType();
      pending.push(sgExtension.extendParams(materialParams, materialDef, parser));
    } else if (materialExtensions[EXTENSIONS.KHR_MATERIALS_UNLIT]) {
      var kmuExtension = extensions[EXTENSIONS.KHR_MATERIALS_UNLIT];
      materialType = kmuExtension.getMaterialType();
      pending.push(kmuExtension.extendParams(materialParams, materialDef, parser));
    } else {
      // Specification:
      // https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material
      var metallicRoughness = materialDef.pbrMetallicRoughness || {};
      materialParams.color = new Color$1(1.0, 1.0, 1.0);
      materialParams.opacity = 1.0;

      if (Array.isArray(metallicRoughness.baseColorFactor)) {
        var array = metallicRoughness.baseColorFactor;
        materialParams.color.fromArray(array);
        materialParams.opacity = array[3];
      }

      if (metallicRoughness.baseColorTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'map', metallicRoughness.baseColorTexture));
      }

      materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
      materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

      if (metallicRoughness.metallicRoughnessTexture !== undefined) {
        pending.push(parser.assignTexture(materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture));
        pending.push(parser.assignTexture(materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture));
      }

      materialType = this._invokeOne(function (ext) {
        return ext.getMaterialType && ext.getMaterialType(materialIndex);
      });
      pending.push(this._invokeAll(function (ext) {
        return ext.extendMaterialParams && ext.extendMaterialParams(materialIndex, materialParams);
      }));
    }

    if (materialDef.doubleSided === true) {
      materialParams.side = DoubleSide;
    }

    var alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

    if (alphaMode === ALPHA_MODES.BLEND) {
      materialParams.transparent = true; // See: https://github.com/mrdoob/three.js/issues/17706

      materialParams.depthWrite = false;
    } else {
      materialParams.transparent = false;

      if (alphaMode === ALPHA_MODES.MASK) {
        materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;
      }
    }

    if (materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(parser.assignTexture(materialParams, 'normalMap', materialDef.normalTexture));
      materialParams.normalScale = new Vector2(1, 1);

      if (materialDef.normalTexture.scale !== undefined) {
        materialParams.normalScale.set(materialDef.normalTexture.scale, materialDef.normalTexture.scale);
      }
    }

    if (materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(parser.assignTexture(materialParams, 'aoMap', materialDef.occlusionTexture));

      if (materialDef.occlusionTexture.strength !== undefined) {
        materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;
      }
    }

    if (materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial) {
      materialParams.emissive = new Color$1().fromArray(materialDef.emissiveFactor);
    }

    if (materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial) {
      pending.push(parser.assignTexture(materialParams, 'emissiveMap', materialDef.emissiveTexture));
    }

    return Promise.all(pending).then(function () {
      var material;

      if (materialType === GLTFMeshStandardSGMaterial) {
        material = extensions[EXTENSIONS.KHR_MATERIALS_PBR_SPECULAR_GLOSSINESS].createMaterial(materialParams);
      } else {
        material = new materialType(materialParams);
      }

      if (materialDef.name) material.name = materialDef.name; // baseColorTexture, emissiveTexture, and specularGlossinessTexture use sRGB encoding.

      if (material.map) material.map.encoding = sRGBEncoding;
      if (material.emissiveMap) material.emissiveMap.encoding = sRGBEncoding;
      assignExtrasToUserData(material, materialDef);
      parser.associations.set(material, {
        type: 'materials',
        index: materialIndex
      });
      if (materialDef.extensions) addUnknownExtensionsToUserData(extensions, material, materialDef);
      return material;
    });
  };
  /**
   * @param {BufferGeometry} geometry
   * @param {GLTF.Primitive} primitiveDef
   * @param {GLTFParser} parser
   */


  function computeBounds(geometry, primitiveDef, parser) {
    var attributes = primitiveDef.attributes;
    var box = new Box3();

    if (attributes.POSITION !== undefined) {
      var accessor = parser.json.accessors[attributes.POSITION];
      var min = accessor.min;
      var max = accessor.max; // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

      if (min !== undefined && max !== undefined) {
        box.set(new Vector3(min[0], min[1], min[2]), new Vector3(max[0], max[1], max[2]));
      } else {
        console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
        return;
      }
    } else {
      return;
    }

    var targets = primitiveDef.targets;

    if (targets !== undefined) {
      var maxDisplacement = new Vector3();
      var vector = new Vector3();

      for (var i = 0, il = targets.length; i < il; i++) {
        var target = targets[i];

        if (target.POSITION !== undefined) {
          var accessor = parser.json.accessors[target.POSITION];
          var min = accessor.min;
          var max = accessor.max; // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

          if (min !== undefined && max !== undefined) {
            // we need to get max of absolute components because target weight is [-1,1]
            vector.setX(Math.max(Math.abs(min[0]), Math.abs(max[0])));
            vector.setY(Math.max(Math.abs(min[1]), Math.abs(max[1])));
            vector.setZ(Math.max(Math.abs(min[2]), Math.abs(max[2]))); // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
            // to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
            // are used to implement key-frame animations and as such only two are active at a time - this results in very large
            // boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.

            maxDisplacement.max(vector);
          } else {
            console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
          }
        }
      } // As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.


      box.expandByVector(maxDisplacement);
    }

    geometry.boundingBox = box;
    var sphere = new Sphere();
    box.getCenter(sphere.center);
    sphere.radius = box.min.distanceTo(box.max) / 2;
    geometry.boundingSphere = sphere;
  }
  /**
   * @param {BufferGeometry} geometry
   * @param {GLTF.Primitive} primitiveDef
   * @param {GLTFParser} parser
   * @return {Promise<BufferGeometry>}
   */


  function addPrimitiveAttributes(geometry, primitiveDef, parser) {
    var attributes = primitiveDef.attributes;
    var pending = [];

    function assignAttributeAccessor(accessorIndex, attributeName) {
      return parser.getDependency('accessor', accessorIndex).then(function (accessor) {
        geometry.setAttribute(attributeName, accessor);
      });
    }

    for (var gltfAttributeName in attributes) {
      var threeAttributeName = ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase(); // Skip attributes already provided by e.g. Draco extension.

      if (threeAttributeName in geometry.attributes) continue;
      pending.push(assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName));
    }

    if (primitiveDef.indices !== undefined && !geometry.index) {
      var accessor = parser.getDependency('accessor', primitiveDef.indices).then(function (accessor) {
        geometry.setIndex(accessor);
      });
      pending.push(accessor);
    }

    assignExtrasToUserData(geometry, primitiveDef);
    computeBounds(geometry, primitiveDef, parser);
    return Promise.all(pending).then(function () {
      return primitiveDef.targets !== undefined ? addMorphTargets(geometry, primitiveDef.targets, parser) : geometry;
    });
  }
  /**
   * @param {BufferGeometry} geometry
   * @param {Number} drawMode
   * @return {BufferGeometry}
   */


  function toTrianglesDrawMode(geometry, drawMode) {
    var index = geometry.getIndex(); // generate index if not present

    if (index === null) {
      var indices = [];
      var position = geometry.getAttribute('position');

      if (position !== undefined) {
        for (var i = 0; i < position.count; i++) {
          indices.push(i);
        }

        geometry.setIndex(indices);
        index = geometry.getIndex();
      } else {
        console.error('THREE.GLTFLoader.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.');
        return geometry;
      }
    } //


    var numberOfTriangles = index.count - 2;
    var newIndices = [];

    if (drawMode === TriangleFanDrawMode) {
      // gl.TRIANGLE_FAN
      for (var i = 1; i <= numberOfTriangles; i++) {
        newIndices.push(index.getX(0));
        newIndices.push(index.getX(i));
        newIndices.push(index.getX(i + 1));
      }
    } else {
      // gl.TRIANGLE_STRIP
      for (var i = 0; i < numberOfTriangles; i++) {
        if (i % 2 === 0) {
          newIndices.push(index.getX(i));
          newIndices.push(index.getX(i + 1));
          newIndices.push(index.getX(i + 2));
        } else {
          newIndices.push(index.getX(i + 2));
          newIndices.push(index.getX(i + 1));
          newIndices.push(index.getX(i));
        }
      }
    }

    if (newIndices.length / 3 !== numberOfTriangles) {
      console.error('THREE.GLTFLoader.toTrianglesDrawMode(): Unable to generate correct amount of triangles.');
    } // build final geometry


    var newGeometry = geometry.clone();
    newGeometry.setIndex(newIndices);
    return newGeometry;
  }
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
   *
   * Creates BufferGeometries from primitives.
   *
   * @param {Array<GLTF.Primitive>} primitives
   * @return {Promise<Array<BufferGeometry>>}
   */


  GLTFParser.prototype.loadGeometries = function (primitives) {
    var parser = this;
    var extensions = this.extensions;
    var cache = this.primitiveCache;

    function createDracoPrimitive(primitive) {
      return extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(primitive, parser).then(function (geometry) {
        return addPrimitiveAttributes(geometry, primitive, parser);
      });
    }

    var pending = [];

    for (var i = 0, il = primitives.length; i < il; i++) {
      var primitive = primitives[i];
      var cacheKey = createPrimitiveKey(primitive); // See if we've already created this geometry

      var cached = cache[cacheKey];

      if (cached) {
        // Use the cached geometry if it exists
        pending.push(cached.promise);
      } else {
        var geometryPromise;

        if (primitive.extensions && primitive.extensions[EXTENSIONS.KHR_DRACO_MESH_COMPRESSION]) {
          // Use DRACO geometry if available
          geometryPromise = createDracoPrimitive(primitive);
        } else {
          // Otherwise create a new geometry
          geometryPromise = addPrimitiveAttributes(new BufferGeometry(), primitive, parser);
        } // Cache this geometry


        cache[cacheKey] = {
          primitive: primitive,
          promise: geometryPromise
        };
        pending.push(geometryPromise);
      }
    }

    return Promise.all(pending);
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
   * @param {number} meshIndex
   * @return {Promise<Group|Mesh|SkinnedMesh>}
   */


  GLTFParser.prototype.loadMesh = function (meshIndex) {
    var parser = this;
    var json = this.json;
    var meshDef = json.meshes[meshIndex];
    var primitives = meshDef.primitives;
    var pending = [];

    for (var i = 0, il = primitives.length; i < il; i++) {
      var material = primitives[i].material === undefined ? createDefaultMaterial(this.cache) : this.getDependency('material', primitives[i].material);
      pending.push(material);
    }

    pending.push(parser.loadGeometries(primitives));
    return Promise.all(pending).then(function (results) {
      var materials = results.slice(0, results.length - 1);
      var geometries = results[results.length - 1];
      var meshes = [];

      for (var i = 0, il = geometries.length; i < il; i++) {
        var geometry = geometries[i];
        var primitive = primitives[i]; // 1. create Mesh

        var mesh;
        var material = materials[i];

        if (primitive.mode === WEBGL_CONSTANTS.TRIANGLES || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP || primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN || primitive.mode === undefined) {
          // .isSkinnedMesh isn't in glTF spec. See ._markDefs()
          mesh = meshDef.isSkinnedMesh === true ? new SkinnedMesh(geometry, material) : new Mesh(geometry, material);

          if (mesh.isSkinnedMesh === true && !mesh.geometry.attributes.skinWeight.normalized) {
            // we normalize floating point skin weight array to fix malformed assets (see #15319)
            // it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
            mesh.normalizeSkinWeights();
          }

          if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP) {
            mesh.geometry = toTrianglesDrawMode(mesh.geometry, TriangleStripDrawMode);
          } else if (primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN) {
            mesh.geometry = toTrianglesDrawMode(mesh.geometry, TriangleFanDrawMode);
          }
        } else if (primitive.mode === WEBGL_CONSTANTS.LINES) {
          mesh = new LineSegments(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.LINE_STRIP) {
          mesh = new Line(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.LINE_LOOP) {
          mesh = new LineLoop(geometry, material);
        } else if (primitive.mode === WEBGL_CONSTANTS.POINTS) {
          mesh = new Points(geometry, material);
        } else {
          throw new Error('THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode);
        }

        if (Object.keys(mesh.geometry.morphAttributes).length > 0) {
          updateMorphTargets(mesh, meshDef);
        }

        mesh.name = meshDef.name || 'mesh_' + meshIndex;
        if (geometries.length > 1) mesh.name += '_' + i;
        assignExtrasToUserData(mesh, meshDef);
        parser.assignFinalMaterial(mesh);
        meshes.push(mesh);
      }

      if (meshes.length === 1) {
        return meshes[0];
      }

      var group = new Group();

      for (var i = 0, il = meshes.length; i < il; i++) {
        group.add(meshes[i]);
      }

      return group;
    });
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
   * @param {number} cameraIndex
   * @return {Promise<THREE.Camera>}
   */


  GLTFParser.prototype.loadCamera = function (cameraIndex) {
    var camera;
    var cameraDef = this.json.cameras[cameraIndex];
    var params = cameraDef[cameraDef.type];

    if (!params) {
      console.warn('THREE.GLTFLoader: Missing camera parameters.');
      return;
    }

    if (cameraDef.type === 'perspective') {
      camera = new PerspectiveCamera(MathUtils.radToDeg(params.yfov), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6);
    } else if (cameraDef.type === 'orthographic') {
      camera = new OrthographicCamera(-params.xmag, params.xmag, params.ymag, -params.ymag, params.znear, params.zfar);
    }

    if (cameraDef.name) camera.name = cameraDef.name;
    assignExtrasToUserData(camera, cameraDef);
    return Promise.resolve(camera);
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
   * @param {number} skinIndex
   * @return {Promise<Object>}
   */


  GLTFParser.prototype.loadSkin = function (skinIndex) {
    var skinDef = this.json.skins[skinIndex];
    var skinEntry = {
      joints: skinDef.joints
    };

    if (skinDef.inverseBindMatrices === undefined) {
      return Promise.resolve(skinEntry);
    }

    return this.getDependency('accessor', skinDef.inverseBindMatrices).then(function (accessor) {
      skinEntry.inverseBindMatrices = accessor;
      return skinEntry;
    });
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
   * @param {number} animationIndex
   * @return {Promise<AnimationClip>}
   */


  GLTFParser.prototype.loadAnimation = function (animationIndex) {
    var json = this.json;
    var animationDef = json.animations[animationIndex];
    var pendingNodes = [];
    var pendingInputAccessors = [];
    var pendingOutputAccessors = [];
    var pendingSamplers = [];
    var pendingTargets = [];

    for (var i = 0, il = animationDef.channels.length; i < il; i++) {
      var channel = animationDef.channels[i];
      var sampler = animationDef.samplers[channel.sampler];
      var target = channel.target;
      var name = target.node !== undefined ? target.node : target.id; // NOTE: target.id is deprecated.

      var input = animationDef.parameters !== undefined ? animationDef.parameters[sampler.input] : sampler.input;
      var output = animationDef.parameters !== undefined ? animationDef.parameters[sampler.output] : sampler.output;
      pendingNodes.push(this.getDependency('node', name));
      pendingInputAccessors.push(this.getDependency('accessor', input));
      pendingOutputAccessors.push(this.getDependency('accessor', output));
      pendingSamplers.push(sampler);
      pendingTargets.push(target);
    }

    return Promise.all([Promise.all(pendingNodes), Promise.all(pendingInputAccessors), Promise.all(pendingOutputAccessors), Promise.all(pendingSamplers), Promise.all(pendingTargets)]).then(function (dependencies) {
      var nodes = dependencies[0];
      var inputAccessors = dependencies[1];
      var outputAccessors = dependencies[2];
      var samplers = dependencies[3];
      var targets = dependencies[4];
      var tracks = [];

      for (var i = 0, il = nodes.length; i < il; i++) {
        var node = nodes[i];
        var inputAccessor = inputAccessors[i];
        var outputAccessor = outputAccessors[i];
        var sampler = samplers[i];
        var target = targets[i];
        if (node === undefined) continue;
        node.updateMatrix();
        node.matrixAutoUpdate = true;
        var TypedKeyframeTrack;

        switch (PATH_PROPERTIES[target.path]) {
          case PATH_PROPERTIES.weights:
            TypedKeyframeTrack = NumberKeyframeTrack;
            break;

          case PATH_PROPERTIES.rotation:
            TypedKeyframeTrack = QuaternionKeyframeTrack;
            break;

          case PATH_PROPERTIES.position:
          case PATH_PROPERTIES.scale:
          default:
            TypedKeyframeTrack = VectorKeyframeTrack;
            break;
        }

        var targetName = node.name ? node.name : node.uuid;
        var interpolation = sampler.interpolation !== undefined ? INTERPOLATION[sampler.interpolation] : InterpolateLinear;
        var targetNames = [];

        if (PATH_PROPERTIES[target.path] === PATH_PROPERTIES.weights) {
          // Node may be a Group (glTF mesh with several primitives) or a Mesh.
          node.traverse(function (object) {
            if (object.isMesh === true && object.morphTargetInfluences) {
              targetNames.push(object.name ? object.name : object.uuid);
            }
          });
        } else {
          targetNames.push(targetName);
        }

        var outputArray = outputAccessor.array;

        if (outputAccessor.normalized) {
          var scale;

          if (outputArray.constructor === Int8Array) {
            scale = 1 / 127;
          } else if (outputArray.constructor === Uint8Array) {
            scale = 1 / 255;
          } else if (outputArray.constructor == Int16Array) {
            scale = 1 / 32767;
          } else if (outputArray.constructor === Uint16Array) {
            scale = 1 / 65535;
          } else {
            throw new Error('THREE.GLTFLoader: Unsupported output accessor component type.');
          }

          var scaled = new Float32Array(outputArray.length);

          for (var j = 0, jl = outputArray.length; j < jl; j++) {
            scaled[j] = outputArray[j] * scale;
          }

          outputArray = scaled;
        }

        for (var j = 0, jl = targetNames.length; j < jl; j++) {
          var track = new TypedKeyframeTrack(targetNames[j] + '.' + PATH_PROPERTIES[target.path], inputAccessor.array, outputArray, interpolation); // Override interpolation with custom factory method.

          if (sampler.interpolation === 'CUBICSPLINE') {
            track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline(result) {
              // A CUBICSPLINE keyframe in glTF has three output values for each input value,
              // representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
              // must be divided by three to get the interpolant's sampleSize argument.
              return new GLTFCubicSplineInterpolant(this.times, this.values, this.getValueSize() / 3, result);
            }; // Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.


            track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;
          }

          tracks.push(track);
        }
      }

      var name = animationDef.name ? animationDef.name : 'animation_' + animationIndex;
      return new AnimationClip(name, undefined, tracks);
    });
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
   * @param {number} nodeIndex
   * @return {Promise<Object3D>}
   */


  GLTFParser.prototype.loadNode = function (nodeIndex) {
    var json = this.json;
    var extensions = this.extensions;
    var parser = this;
    var nodeDef = json.nodes[nodeIndex];
    return function () {
      var pending = [];

      if (nodeDef.mesh !== undefined) {
        pending.push(parser.getDependency('mesh', nodeDef.mesh).then(function (mesh) {
          var node = parser._getNodeRef(parser.meshCache, nodeDef.mesh, mesh); // if weights are provided on the node, override weights on the mesh.


          if (nodeDef.weights !== undefined) {
            node.traverse(function (o) {
              if (!o.isMesh) return;

              for (var i = 0, il = nodeDef.weights.length; i < il; i++) {
                o.morphTargetInfluences[i] = nodeDef.weights[i];
              }
            });
          }

          return node;
        }));
      }

      if (nodeDef.camera !== undefined) {
        pending.push(parser.getDependency('camera', nodeDef.camera).then(function (camera) {
          return parser._getNodeRef(parser.cameraCache, nodeDef.camera, camera);
        }));
      }

      if (nodeDef.extensions && nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL] && nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light !== undefined) {
        var lightIndex = nodeDef.extensions[EXTENSIONS.KHR_LIGHTS_PUNCTUAL].light;
        pending.push(parser.getDependency('light', lightIndex).then(function (light) {
          return parser._getNodeRef(parser.lightCache, lightIndex, light);
        }));
      }

      return Promise.all(pending);
    }().then(function (objects) {
      var node; // .isBone isn't in glTF spec. See ._markDefs

      if (nodeDef.isBone === true) {
        node = new Bone();
      } else if (objects.length > 1) {
        node = new Group();
      } else if (objects.length === 1) {
        node = objects[0];
      } else {
        node = new Object3D();
      }

      if (node !== objects[0]) {
        for (var i = 0, il = objects.length; i < il; i++) {
          node.add(objects[i]);
        }
      }

      if (nodeDef.name) {
        node.userData.name = nodeDef.name;
        node.name = PropertyBinding.sanitizeNodeName(nodeDef.name);
      }

      assignExtrasToUserData(node, nodeDef);
      if (nodeDef.extensions) addUnknownExtensionsToUserData(extensions, node, nodeDef);

      if (nodeDef.matrix !== undefined) {
        var matrix = new Matrix4();
        matrix.fromArray(nodeDef.matrix);
        node.applyMatrix4(matrix);
      } else {
        if (nodeDef.translation !== undefined) {
          node.position.fromArray(nodeDef.translation);
        }

        if (nodeDef.rotation !== undefined) {
          node.quaternion.fromArray(nodeDef.rotation);
        }

        if (nodeDef.scale !== undefined) {
          node.scale.fromArray(nodeDef.scale);
        }
      }

      parser.associations.set(node, {
        type: 'nodes',
        index: nodeIndex
      });
      return node;
    });
  };
  /**
   * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
   * @param {number} sceneIndex
   * @return {Promise<Group>}
   */


  GLTFParser.prototype.loadScene = function () {
    // scene node hierachy builder
    function buildNodeHierachy(nodeId, parentObject, json, parser) {
      var nodeDef = json.nodes[nodeId];
      return parser.getDependency('node', nodeId).then(function (node) {
        if (nodeDef.skin === undefined) return node; // build skeleton here as well

        var skinEntry;
        return parser.getDependency('skin', nodeDef.skin).then(function (skin) {
          skinEntry = skin;
          var pendingJoints = [];

          for (var i = 0, il = skinEntry.joints.length; i < il; i++) {
            pendingJoints.push(parser.getDependency('node', skinEntry.joints[i]));
          }

          return Promise.all(pendingJoints);
        }).then(function (jointNodes) {
          node.traverse(function (mesh) {
            if (!mesh.isMesh) return;
            var bones = [];
            var boneInverses = [];

            for (var j = 0, jl = jointNodes.length; j < jl; j++) {
              var jointNode = jointNodes[j];

              if (jointNode) {
                bones.push(jointNode);
                var mat = new Matrix4();

                if (skinEntry.inverseBindMatrices !== undefined) {
                  mat.fromArray(skinEntry.inverseBindMatrices.array, j * 16);
                }

                boneInverses.push(mat);
              } else {
                console.warn('THREE.GLTFLoader: Joint "%s" could not be found.', skinEntry.joints[j]);
              }
            }

            mesh.bind(new Skeleton(bones, boneInverses), mesh.matrixWorld);
          });
          return node;
        });
      }).then(function (node) {
        // build node hierachy
        parentObject.add(node);
        var pending = [];

        if (nodeDef.children) {
          var children = nodeDef.children;

          for (var i = 0, il = children.length; i < il; i++) {
            var child = children[i];
            pending.push(buildNodeHierachy(child, node, json, parser));
          }
        }

        return Promise.all(pending);
      });
    }

    return function loadScene(sceneIndex) {
      var json = this.json;
      var extensions = this.extensions;
      var sceneDef = this.json.scenes[sceneIndex];
      var parser = this; // Loader returns Group, not Scene.
      // See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172

      var scene = new Group();
      if (sceneDef.name) scene.name = sceneDef.name;
      assignExtrasToUserData(scene, sceneDef);
      if (sceneDef.extensions) addUnknownExtensionsToUserData(extensions, scene, sceneDef);
      var nodeIds = sceneDef.nodes || [];
      var pending = [];

      for (var i = 0, il = nodeIds.length; i < il; i++) {
        pending.push(buildNodeHierachy(nodeIds[i], scene, json, parser));
      }

      return Promise.all(pending).then(function () {
        return scene;
      });
    };
  }();

  return GLTFLoader;
}();

/**
 * Loads a Wavefront .mtl file specifying materials
 *
 * @author angelxuanchang
 */

var MTLLoader = function MTLLoader(manager) {
  Loader.call(this, manager);
};

MTLLoader.prototype = Object.assign(Object.create(Loader.prototype), {
  constructor: MTLLoader,

  /**
   * Loads and parses a MTL asset from a URL.
   *
   * @param {String} url - URL to the MTL file.
   * @param {Function} [onLoad] - Callback invoked with the loaded object.
   * @param {Function} [onProgress] - Callback for download progress.
   * @param {Function} [onError] - Callback for download errors.
   *
   * @see setPath setResourcePath
   *
   * @note In order for relative texture references to resolve correctly
   * you must call setResourcePath() explicitly prior to load.
   */
  load: function load(url, onLoad, onProgress, onError) {
    var scope = this;
    var path = this.path === '' ? LoaderUtils.extractUrlBase(url) : this.path;
    var loader = new FileLoader(this.manager);
    loader.setPath(this.path);
    loader.load(url, function (text) {
      try {
        onLoad(scope.parse(text, path));
      } catch (e) {
        if (onError) {
          onError(e);
        } else {
          console.error(e);
        }

        scope.manager.itemError(url);
      }
    }, onProgress, onError);
  },
  setMaterialOptions: function setMaterialOptions(value) {
    this.materialOptions = value;
    return this;
  },

  /**
   * Parses a MTL file.
   *
   * @param {String} text - Content of MTL file
   * @return {MTLLoader.MaterialCreator}
   *
   * @see setPath setResourcePath
   *
   * @note In order for relative texture references to resolve correctly
   * you must call setResourcePath() explicitly prior to parse.
   */
  parse: function parse(text, path) {
    var lines = text.split('\n');
    var info = {};
    var delimiter_pattern = /\s+/;
    var materialsInfo = {};

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      line = line.trim();

      if (line.length === 0 || line.charAt(0) === '#') {
        // Blank line or comment ignore
        continue;
      }

      var pos = line.indexOf(' ');
      var key = pos >= 0 ? line.substring(0, pos) : line;
      key = key.toLowerCase();
      var value = pos >= 0 ? line.substring(pos + 1) : '';
      value = value.trim();

      if (key === 'newmtl') {
        // New material
        info = {
          name: value
        };
        materialsInfo[value] = info;
      } else {
        if (key === 'ka' || key === 'kd' || key === 'ks' || key === 'ke') {
          var ss = value.split(delimiter_pattern, 3);
          info[key] = [parseFloat(ss[0]), parseFloat(ss[1]), parseFloat(ss[2])];
        } else {
          info[key] = value;
        }
      }
    }

    var materialCreator = new MTLLoader.MaterialCreator(this.resourcePath || path, this.materialOptions);
    materialCreator.setCrossOrigin(this.crossOrigin);
    materialCreator.setManager(this.manager);
    materialCreator.setMaterials(materialsInfo);
    return materialCreator;
  }
});
/**
 * Create a new MTLLoader.MaterialCreator
 * @param baseUrl - Url relative to which textures are loaded
 * @param options - Set of options on how to construct the materials
 *                  side: Which side to apply the material
 *                        FrontSide (default), THREE.BackSide, THREE.DoubleSide
 *                  wrap: What type of wrapping to apply for textures
 *                        RepeatWrapping (default), THREE.ClampToEdgeWrapping, THREE.MirroredRepeatWrapping
 *                  normalizeRGB: RGBs need to be normalized to 0-1 from 0-255
 *                                Default: false, assumed to be already normalized
 *                  ignoreZeroRGBs: Ignore values of RGBs (Ka,Kd,Ks) that are all 0's
 *                                  Default: false
 * @constructor
 */

MTLLoader.MaterialCreator = function (baseUrl, options) {
  this.baseUrl = baseUrl || '';
  this.options = options;
  this.materialsInfo = {};
  this.materials = {};
  this.materialsArray = [];
  this.nameLookup = {};
  this.side = this.options && this.options.side ? this.options.side : FrontSide;
  this.wrap = this.options && this.options.wrap ? this.options.wrap : RepeatWrapping;
};

MTLLoader.MaterialCreator.prototype = {
  constructor: MTLLoader.MaterialCreator,
  crossOrigin: 'anonymous',
  setCrossOrigin: function setCrossOrigin(value) {
    this.crossOrigin = value;
    return this;
  },
  setManager: function setManager(value) {
    this.manager = value;
  },
  setMaterials: function setMaterials(materialsInfo) {
    this.materialsInfo = this.convert(materialsInfo);
    this.materials = {};
    this.materialsArray = [];
    this.nameLookup = {};
  },
  convert: function convert(materialsInfo) {
    if (!this.options) return materialsInfo;
    var converted = {};

    for (var mn in materialsInfo) {
      // Convert materials info into normalized form based on options
      var mat = materialsInfo[mn];
      var covmat = {};
      converted[mn] = covmat;

      for (var prop in mat) {
        var save = true;
        var value = mat[prop];
        var lprop = prop.toLowerCase();

        switch (lprop) {
          case 'kd':
          case 'ka':
          case 'ks':
            // Diffuse color (color under white light) using RGB values
            if (this.options && this.options.normalizeRGB) {
              value = [value[0] / 255, value[1] / 255, value[2] / 255];
            }

            if (this.options && this.options.ignoreZeroRGBs) {
              if (value[0] === 0 && value[1] === 0 && value[2] === 0) {
                // ignore
                save = false;
              }
            }

            break;
        }

        if (save) {
          covmat[lprop] = value;
        }
      }
    }

    return converted;
  },
  preload: function preload() {
    for (var mn in this.materialsInfo) {
      this.create(mn);
    }
  },
  getIndex: function getIndex(materialName) {
    return this.nameLookup[materialName];
  },
  getAsArray: function getAsArray() {
    var index = 0;

    for (var mn in this.materialsInfo) {
      this.materialsArray[index] = this.create(mn);
      this.nameLookup[mn] = index;
      index++;
    }

    return this.materialsArray;
  },
  create: function create(materialName) {
    if (this.materials[materialName] === undefined) {
      this.createMaterial_(materialName);
    }

    return this.materials[materialName];
  },
  createMaterial_: function createMaterial_(materialName) {
    // Create material
    var scope = this;
    var mat = this.materialsInfo[materialName];
    var params = {
      name: materialName,
      side: this.side
    };

    function resolveURL(baseUrl, url) {
      if (typeof url !== 'string' || url === '') return ''; // Absolute URL

      if (/^https?:\/\//i.test(url)) return url;
      return baseUrl + url;
    }

    function setMapForType(mapType, value) {
      if (params[mapType]) return; // Keep the first encountered texture

      var texParams = scope.getTextureParams(value, params);
      var map = scope.loadTexture(resolveURL(scope.baseUrl, texParams.url));
      map.repeat.copy(texParams.scale);
      map.offset.copy(texParams.offset);
      map.wrapS = scope.wrap;
      map.wrapT = scope.wrap;
      params[mapType] = map;
    }

    for (var prop in mat) {
      var value = mat[prop];
      var n;
      if (value === '') continue;

      switch (prop.toLowerCase()) {
        // Ns is material specular exponent
        case 'kd':
          // Diffuse color (color under white light) using RGB values
          params.color = new Color$1().fromArray(value);
          break;

        case 'ks':
          // Specular color (color when light is reflected from shiny surface) using RGB values
          params.specular = new Color$1().fromArray(value);
          break;

        case 'ke':
          // Emissive using RGB values
          params.emissive = new Color$1().fromArray(value);
          break;

        case 'map_kd':
          // Diffuse texture map
          setMapForType('map', value);
          break;

        case 'map_ks':
          // Specular map
          setMapForType('specularMap', value);
          break;

        case 'map_ke':
          // Emissive map
          setMapForType('emissiveMap', value);
          break;

        case 'norm':
          setMapForType('normalMap', value);
          break;

        case 'map_bump':
        case 'bump':
          // Bump texture map
          setMapForType('bumpMap', value);
          break;

        case 'map_d':
          // Alpha map
          setMapForType('alphaMap', value);
          params.transparent = true;
          break;

        case 'ns':
          // The specular exponent (defines the focus of the specular highlight)
          // A high exponent results in a tight, concentrated highlight. Ns values normally range from 0 to 1000.
          params.shininess = parseFloat(value);
          break;

        case 'd':
          n = parseFloat(value);

          if (n < 1) {
            params.opacity = n;
            params.transparent = true;
          }

          break;

        case 'tr':
          n = parseFloat(value);
          if (this.options && this.options.invertTrProperty) n = 1 - n;

          if (n > 0) {
            params.opacity = 1 - n;
            params.transparent = true;
          }

          break;
      }
    }

    this.materials[materialName] = new MeshPhongMaterial(params);
    return this.materials[materialName];
  },
  getTextureParams: function getTextureParams(value, matParams) {
    var texParams = {
      scale: new Vector2(1, 1),
      offset: new Vector2(0, 0)
    };
    var items = value.split(/\s+/);
    var pos;
    pos = items.indexOf('-bm');

    if (pos >= 0) {
      matParams.bumpScale = parseFloat(items[pos + 1]);
      items.splice(pos, 2);
    }

    pos = items.indexOf('-s');

    if (pos >= 0) {
      texParams.scale.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
      items.splice(pos, 4); // we expect 3 parameters here!
    }

    pos = items.indexOf('-o');

    if (pos >= 0) {
      texParams.offset.set(parseFloat(items[pos + 1]), parseFloat(items[pos + 2]));
      items.splice(pos, 4); // we expect 3 parameters here!
    }

    texParams.url = items.join(' ').trim();
    return texParams;
  },
  loadTexture: function loadTexture(url, mapping, onLoad, onProgress, onError) {
    var texture;
    var manager = this.manager !== undefined ? this.manager : DefaultLoadingManager;
    var loader = manager.getHandler(url);

    if (loader === null) {
      loader = new TextureLoader(manager);
    }

    if (loader.setCrossOrigin) loader.setCrossOrigin(this.crossOrigin);
    texture = loader.load(url, onLoad, onProgress, onError);
    if (mapping !== undefined) texture.mapping = mapping;
    return texture;
  }
};

/**
 * @author mrdoob / http://mrdoob.com/
 */

var OBJLoader = function () {
  // o object_name | g group_name
  var object_pattern = /^[og]\s*(.+)?/; // mtllib file_reference

  var material_library_pattern = /^mtllib /; // usemtl material_name

  var material_use_pattern = /^usemtl /; // usemap map_name

  var map_use_pattern = /^usemap /;
  var vA = new Vector3();
  var vB = new Vector3();
  var vC = new Vector3();
  var ab = new Vector3();
  var cb = new Vector3();

  function ParserState() {
    var state = {
      objects: [],
      object: {},
      vertices: [],
      normals: [],
      colors: [],
      uvs: [],
      materials: {},
      materialLibraries: [],
      startObject: function startObject(name, fromDeclaration) {
        // If the current object (initial from reset) is not from a g/o declaration in the parsed
        // file. We need to use it for the first parsed g/o to keep things in sync.
        if (this.object && this.object.fromDeclaration === false) {
          this.object.name = name;
          this.object.fromDeclaration = fromDeclaration !== false;
          return;
        }

        var previousMaterial = this.object && typeof this.object.currentMaterial === 'function' ? this.object.currentMaterial() : undefined;

        if (this.object && typeof this.object._finalize === 'function') {
          this.object._finalize(true);
        }

        this.object = {
          name: name || '',
          fromDeclaration: fromDeclaration !== false,
          geometry: {
            vertices: [],
            normals: [],
            colors: [],
            uvs: [],
            hasNormalIndices: false,
            hasUVIndices: false
          },
          materials: [],
          smooth: true,
          startMaterial: function startMaterial(name, libraries) {
            var previous = this._finalize(false); // New usemtl declaration overwrites an inherited material, except if faces were declared
            // after the material, then it must be preserved for proper MultiMaterial continuation.


            if (previous && (previous.inherited || previous.groupCount <= 0)) {
              this.materials.splice(previous.index, 1);
            }

            var material = {
              index: this.materials.length,
              name: name || '',
              mtllib: Array.isArray(libraries) && libraries.length > 0 ? libraries[libraries.length - 1] : '',
              smooth: previous !== undefined ? previous.smooth : this.smooth,
              groupStart: previous !== undefined ? previous.groupEnd : 0,
              groupEnd: -1,
              groupCount: -1,
              inherited: false,
              clone: function clone(index) {
                var cloned = {
                  index: typeof index === 'number' ? index : this.index,
                  name: this.name,
                  mtllib: this.mtllib,
                  smooth: this.smooth,
                  groupStart: 0,
                  groupEnd: -1,
                  groupCount: -1,
                  inherited: false
                };
                cloned.clone = this.clone.bind(cloned);
                return cloned;
              }
            };
            this.materials.push(material);
            return material;
          },
          currentMaterial: function currentMaterial() {
            if (this.materials.length > 0) {
              return this.materials[this.materials.length - 1];
            }

            return undefined;
          },
          _finalize: function _finalize(end) {
            var lastMultiMaterial = this.currentMaterial();

            if (lastMultiMaterial && lastMultiMaterial.groupEnd === -1) {
              lastMultiMaterial.groupEnd = this.geometry.vertices.length / 3;
              lastMultiMaterial.groupCount = lastMultiMaterial.groupEnd - lastMultiMaterial.groupStart;
              lastMultiMaterial.inherited = false;
            } // Ignore objects tail materials if no face declarations followed them before a new o/g started.


            if (end && this.materials.length > 1) {
              for (var mi = this.materials.length - 1; mi >= 0; mi--) {
                if (this.materials[mi].groupCount <= 0) {
                  this.materials.splice(mi, 1);
                }
              }
            } // Guarantee at least one empty material, this makes the creation later more straight forward.


            if (end && this.materials.length === 0) {
              this.materials.push({
                name: '',
                smooth: this.smooth
              });
            }

            return lastMultiMaterial;
          }
        }; // Inherit previous objects material.
        // Spec tells us that a declared material must be set to all objects until a new material is declared.
        // If a usemtl declaration is encountered while this new object is being parsed, it will
        // overwrite the inherited material. Exception being that there was already face declarations
        // to the inherited material, then it will be preserved for proper MultiMaterial continuation.

        if (previousMaterial && previousMaterial.name && typeof previousMaterial.clone === 'function') {
          var declared = previousMaterial.clone(0);
          declared.inherited = true;
          this.object.materials.push(declared);
        }

        this.objects.push(this.object);
      },
      finalize: function finalize() {
        if (this.object && typeof this.object._finalize === 'function') {
          this.object._finalize(true);
        }
      },
      parseVertexIndex: function parseVertexIndex(value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 3) * 3;
      },
      parseNormalIndex: function parseNormalIndex(value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 3) * 3;
      },
      parseUVIndex: function parseUVIndex(value, len) {
        var index = parseInt(value, 10);
        return (index >= 0 ? index - 1 : index + len / 2) * 2;
      },
      addVertex: function addVertex(a, b, c) {
        var src = this.vertices;
        var dst = this.object.geometry.vertices;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
        dst.push(src[b + 0], src[b + 1], src[b + 2]);
        dst.push(src[c + 0], src[c + 1], src[c + 2]);
      },
      addVertexPoint: function addVertexPoint(a) {
        var src = this.vertices;
        var dst = this.object.geometry.vertices;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
      },
      addVertexLine: function addVertexLine(a) {
        var src = this.vertices;
        var dst = this.object.geometry.vertices;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
      },
      addNormal: function addNormal(a, b, c) {
        var src = this.normals;
        var dst = this.object.geometry.normals;
        dst.push(src[a + 0], src[a + 1], src[a + 2]);
        dst.push(src[b + 0], src[b + 1], src[b + 2]);
        dst.push(src[c + 0], src[c + 1], src[c + 2]);
      },
      addFaceNormal: function addFaceNormal(a, b, c) {
        var src = this.vertices;
        var dst = this.object.geometry.normals;
        vA.fromArray(src, a);
        vB.fromArray(src, b);
        vC.fromArray(src, c);
        cb.subVectors(vC, vB);
        ab.subVectors(vA, vB);
        cb.cross(ab);
        cb.normalize();
        dst.push(cb.x, cb.y, cb.z);
        dst.push(cb.x, cb.y, cb.z);
        dst.push(cb.x, cb.y, cb.z);
      },
      addColor: function addColor(a, b, c) {
        var src = this.colors;
        var dst = this.object.geometry.colors;
        if (src[a] !== undefined) dst.push(src[a + 0], src[a + 1], src[a + 2]);
        if (src[b] !== undefined) dst.push(src[b + 0], src[b + 1], src[b + 2]);
        if (src[c] !== undefined) dst.push(src[c + 0], src[c + 1], src[c + 2]);
      },
      addUV: function addUV(a, b, c) {
        var src = this.uvs;
        var dst = this.object.geometry.uvs;
        dst.push(src[a + 0], src[a + 1]);
        dst.push(src[b + 0], src[b + 1]);
        dst.push(src[c + 0], src[c + 1]);
      },
      addDefaultUV: function addDefaultUV() {
        var dst = this.object.geometry.uvs;
        dst.push(0, 0);
        dst.push(0, 0);
        dst.push(0, 0);
      },
      addUVLine: function addUVLine(a) {
        var src = this.uvs;
        var dst = this.object.geometry.uvs;
        dst.push(src[a + 0], src[a + 1]);
      },
      addFace: function addFace(a, b, c, ua, ub, uc, na, nb, nc) {
        var vLen = this.vertices.length;
        var ia = this.parseVertexIndex(a, vLen);
        var ib = this.parseVertexIndex(b, vLen);
        var ic = this.parseVertexIndex(c, vLen);
        this.addVertex(ia, ib, ic);
        this.addColor(ia, ib, ic); // normals

        if (na !== undefined && na !== '') {
          var nLen = this.normals.length;
          ia = this.parseNormalIndex(na, nLen);
          ib = this.parseNormalIndex(nb, nLen);
          ic = this.parseNormalIndex(nc, nLen);
          this.addNormal(ia, ib, ic);
          this.object.geometry.hasNormalIndices = true;
        } else {
          this.addFaceNormal(ia, ib, ic);
        } // uvs


        if (ua !== undefined && ua !== '') {
          var uvLen = this.uvs.length;
          ia = this.parseUVIndex(ua, uvLen);
          ib = this.parseUVIndex(ub, uvLen);
          ic = this.parseUVIndex(uc, uvLen);
          this.addUV(ia, ib, ic);
          this.object.geometry.hasUVIndices = true;
        } else {
          // add placeholder values (for inconsistent face definitions)
          this.addDefaultUV();
        }
      },
      addPointGeometry: function addPointGeometry(vertices) {
        this.object.geometry.type = 'Points';
        var vLen = this.vertices.length;

        for (var vi = 0, l = vertices.length; vi < l; vi++) {
          this.addVertexPoint(this.parseVertexIndex(vertices[vi], vLen));
        }
      },
      addLineGeometry: function addLineGeometry(vertices, uvs) {
        this.object.geometry.type = 'Line';
        var vLen = this.vertices.length;
        var uvLen = this.uvs.length;

        for (var vi = 0, l = vertices.length; vi < l; vi++) {
          this.addVertexLine(this.parseVertexIndex(vertices[vi], vLen));
        }

        for (var uvi = 0, l = uvs.length; uvi < l; uvi++) {
          this.addUVLine(this.parseUVIndex(uvs[uvi], uvLen));
        }
      }
    };
    state.startObject('', false);
    return state;
  } //


  function OBJLoader(manager) {
    Loader.call(this, manager);
    this.materials = null;
  }

  OBJLoader.prototype = Object.assign(Object.create(Loader.prototype), {
    constructor: OBJLoader,
    load: function load(url, onLoad, onProgress, onError) {
      var scope = this;
      var loader = new FileLoader(scope.manager);
      loader.setPath(this.path);
      loader.load(url, function (text) {
        try {
          onLoad(scope.parse(text));
        } catch (e) {
          if (onError) {
            onError(e);
          } else {
            console.error(e);
          }

          scope.manager.itemError(url);
        }
      }, onProgress, onError);
    },
    setMaterials: function setMaterials(materials) {
      this.materials = materials;
      return this;
    },
    parse: function parse(text) {
      var state = new ParserState();

      if (text.indexOf('\r\n') !== -1) {
        // This is faster than String.split with regex that splits on both
        text = text.replace(/\r\n/g, '\n');
      }

      if (text.indexOf('\\\n') !== -1) {
        // join lines separated by a line continuation character (\)
        text = text.replace(/\\\n/g, '');
      }

      var lines = text.split('\n');
      var line = '',
          lineFirstChar = '';
      var lineLength = 0;
      var result = []; // Faster to just trim left side of the line. Use if available.

      var trimLeft = typeof ''.trimLeft === 'function';

      for (var i = 0, l = lines.length; i < l; i++) {
        line = lines[i];
        line = trimLeft ? line.trimLeft() : line.trim();
        lineLength = line.length;
        if (lineLength === 0) continue;
        lineFirstChar = line.charAt(0); // @todo invoke passed in handler if any

        if (lineFirstChar === '#') continue;

        if (lineFirstChar === 'v') {
          var data = line.split(/\s+/);

          switch (data[0]) {
            case 'v':
              state.vertices.push(parseFloat(data[1]), parseFloat(data[2]), parseFloat(data[3]));

              if (data.length >= 7) {
                state.colors.push(parseFloat(data[4]), parseFloat(data[5]), parseFloat(data[6]));
              } else {
                // if no colors are defined, add placeholders so color and vertex indices match
                state.colors.push(undefined, undefined, undefined);
              }

              break;

            case 'vn':
              state.normals.push(parseFloat(data[1]), parseFloat(data[2]), parseFloat(data[3]));
              break;

            case 'vt':
              state.uvs.push(parseFloat(data[1]), parseFloat(data[2]));
              break;
          }
        } else if (lineFirstChar === 'f') {
          var lineData = line.substr(1).trim();
          var vertexData = lineData.split(/\s+/);
          var faceVertices = []; // Parse the face vertex data into an easy to work with format

          for (var j = 0, jl = vertexData.length; j < jl; j++) {
            var vertex = vertexData[j];

            if (vertex.length > 0) {
              var vertexParts = vertex.split('/');
              faceVertices.push(vertexParts);
            }
          } // Draw an edge between the first vertex and all subsequent vertices to form an n-gon


          var v1 = faceVertices[0];

          for (var j = 1, jl = faceVertices.length - 1; j < jl; j++) {
            var v2 = faceVertices[j];
            var v3 = faceVertices[j + 1];
            state.addFace(v1[0], v2[0], v3[0], v1[1], v2[1], v3[1], v1[2], v2[2], v3[2]);
          }
        } else if (lineFirstChar === 'l') {
          var lineParts = line.substring(1).trim().split(' ');
          var lineVertices = [],
              lineUVs = [];

          if (line.indexOf('/') === -1) {
            lineVertices = lineParts;
          } else {
            for (var li = 0, llen = lineParts.length; li < llen; li++) {
              var parts = lineParts[li].split('/');
              if (parts[0] !== '') lineVertices.push(parts[0]);
              if (parts[1] !== '') lineUVs.push(parts[1]);
            }
          }

          state.addLineGeometry(lineVertices, lineUVs);
        } else if (lineFirstChar === 'p') {
          var lineData = line.substr(1).trim();
          var pointData = lineData.split(' ');
          state.addPointGeometry(pointData);
        } else if ((result = object_pattern.exec(line)) !== null) {
          // o object_name
          // or
          // g group_name
          // WORKAROUND: https://bugs.chromium.org/p/v8/issues/detail?id=2869
          // var name = result[ 0 ].substr( 1 ).trim();
          var name = (' ' + result[0].substr(1).trim()).substr(1);
          state.startObject(name);
        } else if (material_use_pattern.test(line)) {
          // material
          state.object.startMaterial(line.substring(7).trim(), state.materialLibraries);
        } else if (material_library_pattern.test(line)) {
          // mtl file
          state.materialLibraries.push(line.substring(7).trim());
        } else if (map_use_pattern.test(line)) {
          // the line is parsed but ignored since the loader assumes textures are defined MTL files
          // (according to https://www.okino.com/conv/imp_wave.htm, 'usemap' is the old-style Wavefront texture reference method)
          console.warn('THREE.OBJLoader: Rendering identifier "usemap" not supported. Textures must be defined in MTL files.');
        } else if (lineFirstChar === 's') {
          result = line.split(' '); // smooth shading
          // @todo Handle files that have varying smooth values for a set of faces inside one geometry,
          // but does not define a usemtl for each face set.
          // This should be detected and a dummy material created (later MultiMaterial and geometry groups).
          // This requires some care to not create extra material on each smooth value for "normal" obj files.
          // where explicit usemtl defines geometry groups.
          // Example asset: examples/models/obj/cerberus/Cerberus.obj

          /*
           * http://paulbourke.net/dataformats/obj/
           * or
           * http://www.cs.utah.edu/~boulos/cs3505/obj_spec.pdf
           *
           * From chapter "Grouping" Syntax explanation "s group_number":
           * "group_number is the smoothing group number. To turn off smoothing groups, use a value of 0 or off.
           * Polygonal elements use group numbers to put elements in different smoothing groups. For free-form
           * surfaces, smoothing groups are either turned on or off; there is no difference between values greater
           * than 0."
           */

          if (result.length > 1) {
            var value = result[1].trim().toLowerCase();
            state.object.smooth = value !== '0' && value !== 'off';
          } else {
            // ZBrush can produce "s" lines #11707
            state.object.smooth = true;
          }

          var material = state.object.currentMaterial();
          if (material) material.smooth = state.object.smooth;
        } else {
          // Handle null terminated files without exception
          if (line === '\0') continue;
          console.warn('THREE.OBJLoader: Unexpected line: "' + line + '"');
        }
      }

      state.finalize();
      var container = new Group();
      container.materialLibraries = [].concat(state.materialLibraries);

      for (var i = 0, l = state.objects.length; i < l; i++) {
        var object = state.objects[i];
        var geometry = object.geometry;
        var materials = object.materials;
        var isLine = geometry.type === 'Line';
        var isPoints = geometry.type === 'Points';
        var hasVertexColors = false; // Skip o/g line declarations that did not follow with any faces

        if (geometry.vertices.length === 0) continue;
        var buffergeometry = new BufferGeometry();
        buffergeometry.setAttribute('position', new Float32BufferAttribute(geometry.vertices, 3));

        if (geometry.hasNormalIndices === true) {
          buffergeometry.setAttribute('normal', new Float32BufferAttribute(geometry.normals, 3));
        }

        if (geometry.colors.length > 0) {
          hasVertexColors = true;
          buffergeometry.setAttribute('color', new Float32BufferAttribute(geometry.colors, 3));
        }

        if (geometry.hasUVIndices === true) {
          buffergeometry.setAttribute('uv', new Float32BufferAttribute(geometry.uvs, 2));
        } // Create materials


        var createdMaterials = [];

        for (var mi = 0, miLen = materials.length; mi < miLen; mi++) {
          var sourceMaterial = materials[mi];
          var materialHash = sourceMaterial.name + '_' + sourceMaterial.smooth + '_' + hasVertexColors;
          var material = state.materials[materialHash];

          if (this.materials !== null) {
            material = this.materials.create(sourceMaterial.name); // mtl etc. loaders probably can't create line materials correctly, copy properties to a line material.

            if (isLine && material && !(material instanceof LineBasicMaterial)) {
              var materialLine = new LineBasicMaterial();
              Material.prototype.copy.call(materialLine, material);
              materialLine.color.copy(material.color);
              material = materialLine;
            } else if (isPoints && material && !(material instanceof PointsMaterial)) {
              var materialPoints = new PointsMaterial({
                size: 10,
                sizeAttenuation: false
              });
              Material.prototype.copy.call(materialPoints, material);
              materialPoints.color.copy(material.color);
              materialPoints.map = material.map;
              material = materialPoints;
            }
          }

          if (material === undefined) {
            if (isLine) {
              material = new LineBasicMaterial();
            } else if (isPoints) {
              material = new PointsMaterial({
                size: 1,
                sizeAttenuation: false
              });
            } else {
              material = new MeshPhongMaterial();
            }

            material.name = sourceMaterial.name;
            material.flatShading = sourceMaterial.smooth ? false : true;
            material.vertexColors = hasVertexColors;
            state.materials[materialHash] = material;
          }

          createdMaterials.push(material);
        } // Create mesh


        var mesh;

        if (createdMaterials.length > 1) {
          for (var mi = 0, miLen = materials.length; mi < miLen; mi++) {
            var sourceMaterial = materials[mi];
            buffergeometry.addGroup(sourceMaterial.groupStart, sourceMaterial.groupCount, mi);
          }

          if (isLine) {
            mesh = new LineSegments(buffergeometry, createdMaterials);
          } else if (isPoints) {
            mesh = new Points(buffergeometry, createdMaterials);
          } else {
            mesh = new Mesh(buffergeometry, createdMaterials);
          }
        } else {
          if (isLine) {
            mesh = new LineSegments(buffergeometry, createdMaterials[0]);
          } else if (isPoints) {
            mesh = new Points(buffergeometry, createdMaterials[0]);
          } else {
            mesh = new Mesh(buffergeometry, createdMaterials[0]);
          }
        }

        mesh.name = object.name;
        container.add(mesh);
      }

      return container;
    }
  });
  return OBJLoader;
}();

/**
 * @author sunag / http://www.sunag.com.br
 */
var SkeletonUtils = {
  retarget: function () {
    var pos = new Vector3(),
        quat = new Quaternion(),
        scale = new Vector3(),
        bindBoneMatrix = new Matrix4(),
        relativeMatrix = new Matrix4(),
        globalMatrix = new Matrix4();
    return function (target, source, options) {
      options = options || {};
      options.preserveMatrix = options.preserveMatrix !== undefined ? options.preserveMatrix : true;
      options.preservePosition = options.preservePosition !== undefined ? options.preservePosition : true;
      options.preserveHipPosition = options.preserveHipPosition !== undefined ? options.preserveHipPosition : false;
      options.useTargetMatrix = options.useTargetMatrix !== undefined ? options.useTargetMatrix : false;
      options.hip = options.hip !== undefined ? options.hip : 'hip';
      options.names = options.names || {};
      var sourceBones = source.isObject3D ? source.skeleton.bones : this.getBones(source),
          bones = target.isObject3D ? target.skeleton.bones : this.getBones(target),
          bindBones,
          bone,
          name,
          boneTo,
          bonesPosition,
          i; // reset bones

      if (target.isObject3D) {
        target.skeleton.pose();
      } else {
        options.useTargetMatrix = true;
        options.preserveMatrix = false;
      }

      if (options.preservePosition) {
        bonesPosition = [];

        for (i = 0; i < bones.length; i++) {
          bonesPosition.push(bones[i].position.clone());
        }
      }

      if (options.preserveMatrix) {
        // reset matrix
        target.updateMatrixWorld();
        target.matrixWorld.identity(); // reset children matrix

        for (i = 0; i < target.children.length; ++i) {
          target.children[i].updateMatrixWorld(true);
        }
      }

      if (options.offsets) {
        bindBones = [];

        for (i = 0; i < bones.length; ++i) {
          bone = bones[i];
          name = options.names[bone.name] || bone.name;

          if (options.offsets && options.offsets[name]) {
            bone.matrix.multiply(options.offsets[name]);
            bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
            bone.updateMatrixWorld();
          }

          bindBones.push(bone.matrixWorld.clone());
        }
      }

      for (i = 0; i < bones.length; ++i) {
        bone = bones[i];
        name = options.names[bone.name] || bone.name;
        boneTo = this.getBoneByName(name, sourceBones);
        globalMatrix.copy(bone.matrixWorld);

        if (boneTo) {
          boneTo.updateMatrixWorld();

          if (options.useTargetMatrix) {
            relativeMatrix.copy(boneTo.matrixWorld);
          } else {
            relativeMatrix.getInverse(target.matrixWorld);
            relativeMatrix.multiply(boneTo.matrixWorld);
          } // ignore scale to extract rotation


          scale.setFromMatrixScale(relativeMatrix);
          relativeMatrix.scale(scale.set(1 / scale.x, 1 / scale.y, 1 / scale.z)); // apply to global matrix

          globalMatrix.makeRotationFromQuaternion(quat.setFromRotationMatrix(relativeMatrix));

          if (target.isObject3D) {
            var boneIndex = bones.indexOf(bone),
                wBindMatrix = bindBones ? bindBones[boneIndex] : bindBoneMatrix.getInverse(target.skeleton.boneInverses[boneIndex]);
            globalMatrix.multiply(wBindMatrix);
          }

          globalMatrix.copyPosition(relativeMatrix);
        }

        if (bone.parent && bone.parent.isBone) {
          bone.matrix.getInverse(bone.parent.matrixWorld);
          bone.matrix.multiply(globalMatrix);
        } else {
          bone.matrix.copy(globalMatrix);
        }

        if (options.preserveHipPosition && name === options.hip) {
          bone.matrix.setPosition(pos.set(0, bone.position.y, 0));
        }

        bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
        bone.updateMatrixWorld();
      }

      if (options.preservePosition) {
        for (i = 0; i < bones.length; ++i) {
          bone = bones[i];
          name = options.names[bone.name] || bone.name;

          if (name !== options.hip) {
            bone.position.copy(bonesPosition[i]);
          }
        }
      }

      if (options.preserveMatrix) {
        // restore matrix
        target.updateMatrixWorld(true);
      }
    };
  }(),
  retargetClip: function retargetClip(target, source, clip, options) {
    options = options || {};
    options.useFirstFramePosition = options.useFirstFramePosition !== undefined ? options.useFirstFramePosition : false;
    options.fps = options.fps !== undefined ? options.fps : 30;
    options.names = options.names || [];

    if (!source.isObject3D) {
      source = this.getHelperFromSkeleton(source);
    }

    var numFrames = Math.round(clip.duration * (options.fps / 1000) * 1000),
        delta = 1 / options.fps,
        convertedTracks = [],
        mixer = new AnimationMixer(source),
        bones = this.getBones(target.skeleton),
        boneDatas = [],
        positionOffset,
        bone,
        boneTo,
        boneData,
        name,
        i,
        j;
    mixer.clipAction(clip).play();
    mixer.update(0);
    source.updateMatrixWorld();

    for (i = 0; i < numFrames; ++i) {
      var time = i * delta;
      this.retarget(target, source, options);

      for (j = 0; j < bones.length; ++j) {
        name = options.names[bones[j].name] || bones[j].name;
        boneTo = this.getBoneByName(name, source.skeleton);

        if (boneTo) {
          bone = bones[j];
          boneData = boneDatas[j] = boneDatas[j] || {
            bone: bone
          };

          if (options.hip === name) {
            if (!boneData.pos) {
              boneData.pos = {
                times: new Float32Array(numFrames),
                values: new Float32Array(numFrames * 3)
              };
            }

            if (options.useFirstFramePosition) {
              if (i === 0) {
                positionOffset = bone.position.clone();
              }

              bone.position.sub(positionOffset);
            }

            boneData.pos.times[i] = time;
            bone.position.toArray(boneData.pos.values, i * 3);
          }

          if (!boneData.quat) {
            boneData.quat = {
              times: new Float32Array(numFrames),
              values: new Float32Array(numFrames * 4)
            };
          }

          boneData.quat.times[i] = time;
          bone.quaternion.toArray(boneData.quat.values, i * 4);
        }
      }

      mixer.update(delta);
      source.updateMatrixWorld();
    }

    for (i = 0; i < boneDatas.length; ++i) {
      boneData = boneDatas[i];

      if (boneData) {
        if (boneData.pos) {
          convertedTracks.push(new VectorKeyframeTrack('.bones[' + boneData.bone.name + '].position', boneData.pos.times, boneData.pos.values));
        }

        convertedTracks.push(new QuaternionKeyframeTrack('.bones[' + boneData.bone.name + '].quaternion', boneData.quat.times, boneData.quat.values));
      }
    }

    mixer.uncacheAction(clip);
    return new AnimationClip(clip.name, -1, convertedTracks);
  },
  getHelperFromSkeleton: function getHelperFromSkeleton(skeleton) {
    var source = new SkeletonHelper(skeleton.bones[0]);
    source.skeleton = skeleton;
    return source;
  },
  getSkeletonOffsets: function () {
    var targetParentPos = new Vector3(),
        targetPos = new Vector3(),
        sourceParentPos = new Vector3(),
        sourcePos = new Vector3(),
        targetDir = new Vector2(),
        sourceDir = new Vector2();
    return function (target, source, options) {
      options = options || {};
      options.hip = options.hip !== undefined ? options.hip : 'hip';
      options.names = options.names || {};

      if (!source.isObject3D) {
        source = this.getHelperFromSkeleton(source);
      }

      var nameKeys = Object.keys(options.names),
          nameValues = Object.values(options.names),
          sourceBones = source.isObject3D ? source.skeleton.bones : this.getBones(source),
          bones = target.isObject3D ? target.skeleton.bones : this.getBones(target),
          offsets = [],
          bone,
          boneTo,
          name,
          i;
      target.skeleton.pose();

      for (i = 0; i < bones.length; ++i) {
        bone = bones[i];
        name = options.names[bone.name] || bone.name;
        boneTo = this.getBoneByName(name, sourceBones);

        if (boneTo && name !== options.hip) {
          var boneParent = this.getNearestBone(bone.parent, nameKeys),
              boneToParent = this.getNearestBone(boneTo.parent, nameValues);
          boneParent.updateMatrixWorld();
          boneToParent.updateMatrixWorld();
          targetParentPos.setFromMatrixPosition(boneParent.matrixWorld);
          targetPos.setFromMatrixPosition(bone.matrixWorld);
          sourceParentPos.setFromMatrixPosition(boneToParent.matrixWorld);
          sourcePos.setFromMatrixPosition(boneTo.matrixWorld);
          targetDir.subVectors(new Vector2(targetPos.x, targetPos.y), new Vector2(targetParentPos.x, targetParentPos.y)).normalize();
          sourceDir.subVectors(new Vector2(sourcePos.x, sourcePos.y), new Vector2(sourceParentPos.x, sourceParentPos.y)).normalize();
          var laterialAngle = targetDir.angle() - sourceDir.angle();
          var offset = new Matrix4().makeRotationFromEuler(new Euler(0, 0, laterialAngle));
          bone.matrix.multiply(offset);
          bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
          bone.updateMatrixWorld();
          offsets[name] = offset;
        }
      }

      return offsets;
    };
  }(),
  renameBones: function renameBones(skeleton, names) {
    var bones = this.getBones(skeleton);

    for (var i = 0; i < bones.length; ++i) {
      var bone = bones[i];

      if (names[bone.name]) {
        bone.name = names[bone.name];
      }
    }

    return this;
  },
  getBones: function getBones(skeleton) {
    return Array.isArray(skeleton) ? skeleton : skeleton.bones;
  },
  getBoneByName: function getBoneByName(name, skeleton) {
    for (var i = 0, bones = this.getBones(skeleton); i < bones.length; i++) {
      if (name === bones[i].name) return bones[i];
    }
  },
  getNearestBone: function getNearestBone(bone, names) {
    while (bone.isBone) {
      if (names.indexOf(bone.name) !== -1) {
        return bone;
      }

      bone = bone.parent;
    }
  },
  findBoneTrackData: function findBoneTrackData(name, tracks) {
    var regexp = /\[(.*)\]\.(.*)/,
        result = {
      name: name
    };

    for (var i = 0; i < tracks.length; ++i) {
      // 1 is track name
      // 2 is track type
      var trackData = regexp.exec(tracks[i].name);

      if (trackData && name === trackData[1]) {
        result[trackData[2]] = i;
      }
    }

    return result;
  },
  getEqualsBonesNames: function getEqualsBonesNames(skeleton, targetSkeleton) {
    var sourceBones = this.getBones(skeleton),
        targetBones = this.getBones(targetSkeleton),
        bones = [];

    search: for (var i = 0; i < sourceBones.length; i++) {
      var boneName = sourceBones[i].name;

      for (var j = 0; j < targetBones.length; j++) {
        if (boneName === targetBones[j].name) {
          bones.push(boneName);
          continue search;
        }
      }
    }

    return bones;
  },
  clone: function clone(source) {
    var sourceLookup = new Map();
    var cloneLookup = new Map();
    var clone = source.clone();
    parallelTraverse(source, clone, function (sourceNode, clonedNode) {
      sourceLookup.set(clonedNode, sourceNode);
      cloneLookup.set(sourceNode, clonedNode);
    });
    clone.traverse(function (node) {
      if (!node.isSkinnedMesh) return;
      var clonedMesh = node;
      var sourceMesh = sourceLookup.get(node);
      var sourceBones = sourceMesh.skeleton.bones;
      clonedMesh.skeleton = sourceMesh.skeleton.clone();
      clonedMesh.bindMatrix.copy(sourceMesh.bindMatrix);
      clonedMesh.skeleton.bones = sourceBones.map(function (bone) {
        return cloneLookup.get(bone);
      });
      clonedMesh.bind(clonedMesh.skeleton, clonedMesh.bindMatrix);
    });
    return clone;
  }
};

function parallelTraverse(a, b, callback) {
  callback(a, b);

  for (var i = 0; i < a.children.length; i++) {
    parallelTraverse(a.children[i], b.children[i], callback);
  }
}

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
      return geo instanceof SphereGeometry && shape instanceof Sphere$1 || geo instanceof BoxGeometry && shape instanceof Box || geo instanceof PlaneGeometry && shape instanceof Plane || geo.id === shape.geometryId && shape instanceof ConvexPolyhedron || geo.id === shape.geometryId && shape instanceof Trimesh || geo.id === shape.geometryId && shape instanceof Heightfield;
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

var instance$7 = null;
/**
 * Handles creation and installation of physical materials within the physics
 * engine.
 */

var MaterialManager = /*#__PURE__*/function () {
  _createClass(MaterialManager, null, [{
    key: "get",
    value: function get() {
      if (!instance$7) {
        instance$7 = new MaterialManager();
      }

      return instance$7;
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
        var material = new Material$1(options);
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
var instance$8 = null;
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
      if (!instance$8) {
        instance$8 = new PhysicsPlugin();
      }

      return instance$8;
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
      this.world.remove(entity.physicsBody);
      return true;
    }
    /**
     * Ends the physics simulation. Is only called client-side.
     */

  }, {
    key: "terminate",
    value: function terminate() {
      clearInterval(this.updateInterval);
      instance$8 = null;
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
        return renderer.render(_this2.scene, camera);
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
     */

  }, {
    key: "add",
    value: function add(entity) {
      if (this.entities.has(entity)) {
        console.warn('Entity already added to the world');
        return this;
      }

      if (entity.physicsBody) {
        entity.registerPhysicsWorld(this.physics);
      }

      entity.setWorld(this);
      entity.build();
      this.entities.add(entity);
      this.scene.add(entity);

      if (entity.physicsBody) {
        this.physics.registerEntity(entity);
      }

      entity.onAdd();
      return this;
    }
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
      var quaternion = new Quaternion$1().copy(subject.quaternion);
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
    _this.cameraQuaternion = new Quaternion();
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
    value: function build() {
      if (this.built) {
        return this;
      }

      this.mesh = this.generateMesh();

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
      return this;
    }
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
    value: function generateMesh() {
      if (!this.meshEnabled) {
        return;
      }

      if (!this.modelName) {
        return console.warn('Model name not provided');
      }

      var scene = Models.get().createModel(this.modelName);
      return scene;
    }
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

    _this.targetQuaternion = new Quaternion$1();
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
      var quat = new Quaternion$1();
      quat.setFromAxisAngle(Vec3.UNIT_X, Math.PI / 2);
      var cylinderPos = height / 2 + this.capsuleRadius + this.capsuleOffset;
      capsule.addShape(cylinderShape, new Vec3(0, cylinderPos, 0), quat); // Create round ends of capsule.

      var sphereShape = new Sphere$1(this.capsuleRadius);
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
    value: function build() {
      _get(_getPrototypeOf(Character.prototype), "build", this).call(this);

      this.playAnimation(this.idleAnimationName);
      return this;
    }
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

/**
 * @author Daosheng Mu / https://github.com/DaoshengMu/
 * @author mrdoob / http://mrdoob.com/
 * @author takahirox / https://github.com/takahirox/
 */

var TGALoader = function TGALoader(manager) {
  Loader.call(this, manager);
};

TGALoader.prototype = Object.assign(Object.create(Loader.prototype), {
  constructor: TGALoader,
  load: function load(url, onLoad, onProgress, onError) {
    var scope = this;
    var texture = new Texture();
    var loader = new FileLoader(this.manager);
    loader.setResponseType('arraybuffer');
    loader.setPath(this.path);
    loader.load(url, function (buffer) {
      texture.image = scope.parse(buffer);
      texture.needsUpdate = true;

      if (onLoad !== undefined) {
        onLoad(texture);
      }
    }, onProgress, onError);
    return texture;
  },
  parse: function parse(buffer) {
    // reference from vthibault, https://github.com/vthibault/roBrowser/blob/master/src/Loaders/Targa.js
    function tgaCheckHeader(header) {
      switch (header.image_type) {
        // check indexed type
        case TGA_TYPE_INDEXED:
        case TGA_TYPE_RLE_INDEXED:
          if (header.colormap_length > 256 || header.colormap_size !== 24 || header.colormap_type !== 1) {
            console.error('THREE.TGALoader: Invalid type colormap data for indexed type.');
          }

          break;
        // check colormap type

        case TGA_TYPE_RGB:
        case TGA_TYPE_GREY:
        case TGA_TYPE_RLE_RGB:
        case TGA_TYPE_RLE_GREY:
          if (header.colormap_type) {
            console.error('THREE.TGALoader: Invalid type colormap data for colormap type.');
          }

          break;
        // What the need of a file without data ?

        case TGA_TYPE_NO_DATA:
          console.error('THREE.TGALoader: No data.');
        // Invalid type ?

        default:
          console.error('THREE.TGALoader: Invalid type "%s".', header.image_type);
      } // check image width and height


      if (header.width <= 0 || header.height <= 0) {
        console.error('THREE.TGALoader: Invalid image size.');
      } // check image pixel size


      if (header.pixel_size !== 8 && header.pixel_size !== 16 && header.pixel_size !== 24 && header.pixel_size !== 32) {
        console.error('THREE.TGALoader: Invalid pixel size "%s".', header.pixel_size);
      }
    } // parse tga image buffer


    function tgaParse(use_rle, use_pal, header, offset, data) {
      var pixel_data, pixel_size, pixel_total, palettes;
      pixel_size = header.pixel_size >> 3;
      pixel_total = header.width * header.height * pixel_size; // read palettes

      if (use_pal) {
        palettes = data.subarray(offset, offset += header.colormap_length * (header.colormap_size >> 3));
      } // read RLE


      if (use_rle) {
        pixel_data = new Uint8Array(pixel_total);
        var c, count, i;
        var shift = 0;
        var pixels = new Uint8Array(pixel_size);

        while (shift < pixel_total) {
          c = data[offset++];
          count = (c & 0x7f) + 1; // RLE pixels

          if (c & 0x80) {
            // bind pixel tmp array
            for (i = 0; i < pixel_size; ++i) {
              pixels[i] = data[offset++];
            } // copy pixel array


            for (i = 0; i < count; ++i) {
              pixel_data.set(pixels, shift + i * pixel_size);
            }

            shift += pixel_size * count;
          } else {
            // raw pixels
            count *= pixel_size;

            for (i = 0; i < count; ++i) {
              pixel_data[shift + i] = data[offset++];
            }

            shift += count;
          }
        }
      } else {
        // raw pixels
        pixel_data = data.subarray(offset, offset += use_pal ? header.width * header.height : pixel_total);
      }

      return {
        pixel_data: pixel_data,
        palettes: palettes
      };
    }

    function tgaGetImageData8bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end, image, palettes) {
      var colormap = palettes;
      var color,
          i = 0,
          x,
          y;
      var width = header.width;

      for (y = y_start; y !== y_end; y += y_step) {
        for (x = x_start; x !== x_end; x += x_step, i++) {
          color = image[i];
          imageData[(x + width * y) * 4 + 3] = 255;
          imageData[(x + width * y) * 4 + 2] = colormap[color * 3 + 0];
          imageData[(x + width * y) * 4 + 1] = colormap[color * 3 + 1];
          imageData[(x + width * y) * 4 + 0] = colormap[color * 3 + 2];
        }
      }

      return imageData;
    }

    function tgaGetImageData16bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end, image) {
      var color,
          i = 0,
          x,
          y;
      var width = header.width;

      for (y = y_start; y !== y_end; y += y_step) {
        for (x = x_start; x !== x_end; x += x_step, i += 2) {
          color = image[i + 0] + (image[i + 1] << 8); // Inversed ?

          imageData[(x + width * y) * 4 + 0] = (color & 0x7c00) >> 7;
          imageData[(x + width * y) * 4 + 1] = (color & 0x03e0) >> 2;
          imageData[(x + width * y) * 4 + 2] = (color & 0x001f) >> 3;
          imageData[(x + width * y) * 4 + 3] = color & 0x8000 ? 0 : 255;
        }
      }

      return imageData;
    }

    function tgaGetImageData24bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end, image) {
      var i = 0,
          x,
          y;
      var width = header.width;

      for (y = y_start; y !== y_end; y += y_step) {
        for (x = x_start; x !== x_end; x += x_step, i += 3) {
          imageData[(x + width * y) * 4 + 3] = 255;
          imageData[(x + width * y) * 4 + 2] = image[i + 0];
          imageData[(x + width * y) * 4 + 1] = image[i + 1];
          imageData[(x + width * y) * 4 + 0] = image[i + 2];
        }
      }

      return imageData;
    }

    function tgaGetImageData32bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end, image) {
      var i = 0,
          x,
          y;
      var width = header.width;

      for (y = y_start; y !== y_end; y += y_step) {
        for (x = x_start; x !== x_end; x += x_step, i += 4) {
          imageData[(x + width * y) * 4 + 2] = image[i + 0];
          imageData[(x + width * y) * 4 + 1] = image[i + 1];
          imageData[(x + width * y) * 4 + 0] = image[i + 2];
          imageData[(x + width * y) * 4 + 3] = image[i + 3];
        }
      }

      return imageData;
    }

    function tgaGetImageDataGrey8bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end, image) {
      var color,
          i = 0,
          x,
          y;
      var width = header.width;

      for (y = y_start; y !== y_end; y += y_step) {
        for (x = x_start; x !== x_end; x += x_step, i++) {
          color = image[i];
          imageData[(x + width * y) * 4 + 0] = color;
          imageData[(x + width * y) * 4 + 1] = color;
          imageData[(x + width * y) * 4 + 2] = color;
          imageData[(x + width * y) * 4 + 3] = 255;
        }
      }

      return imageData;
    }

    function tgaGetImageDataGrey16bits(imageData, y_start, y_step, y_end, x_start, x_step, x_end, image) {
      var i = 0,
          x,
          y;
      var width = header.width;

      for (y = y_start; y !== y_end; y += y_step) {
        for (x = x_start; x !== x_end; x += x_step, i += 2) {
          imageData[(x + width * y) * 4 + 0] = image[i + 0];
          imageData[(x + width * y) * 4 + 1] = image[i + 0];
          imageData[(x + width * y) * 4 + 2] = image[i + 0];
          imageData[(x + width * y) * 4 + 3] = image[i + 1];
        }
      }

      return imageData;
    }

    function getTgaRGBA(data, width, height, image, palette) {
      var x_start, y_start, x_step, y_step, x_end, y_end;

      switch ((header.flags & TGA_ORIGIN_MASK) >> TGA_ORIGIN_SHIFT) {
        default:
        case TGA_ORIGIN_UL:
          x_start = 0;
          x_step = 1;
          x_end = width;
          y_start = 0;
          y_step = 1;
          y_end = height;
          break;

        case TGA_ORIGIN_BL:
          x_start = 0;
          x_step = 1;
          x_end = width;
          y_start = height - 1;
          y_step = -1;
          y_end = -1;
          break;

        case TGA_ORIGIN_UR:
          x_start = width - 1;
          x_step = -1;
          x_end = -1;
          y_start = 0;
          y_step = 1;
          y_end = height;
          break;

        case TGA_ORIGIN_BR:
          x_start = width - 1;
          x_step = -1;
          x_end = -1;
          y_start = height - 1;
          y_step = -1;
          y_end = -1;
          break;
      }

      if (use_grey) {
        switch (header.pixel_size) {
          case 8:
            tgaGetImageDataGrey8bits(data, y_start, y_step, y_end, x_start, x_step, x_end, image);
            break;

          case 16:
            tgaGetImageDataGrey16bits(data, y_start, y_step, y_end, x_start, x_step, x_end, image);
            break;

          default:
            console.error('THREE.TGALoader: Format not supported.');
            break;
        }
      } else {
        switch (header.pixel_size) {
          case 8:
            tgaGetImageData8bits(data, y_start, y_step, y_end, x_start, x_step, x_end, image, palette);
            break;

          case 16:
            tgaGetImageData16bits(data, y_start, y_step, y_end, x_start, x_step, x_end, image);
            break;

          case 24:
            tgaGetImageData24bits(data, y_start, y_step, y_end, x_start, x_step, x_end, image);
            break;

          case 32:
            tgaGetImageData32bits(data, y_start, y_step, y_end, x_start, x_step, x_end, image);
            break;

          default:
            console.error('THREE.TGALoader: Format not supported.');
            break;
        }
      } // Load image data according to specific method
      // var func = 'tgaGetImageData' + (use_grey ? 'Grey' : '') + (header.pixel_size) + 'bits';
      // func(data, y_start, y_step, y_end, x_start, x_step, x_end, width, image, palette );


      return data;
    } // TGA constants


    var TGA_TYPE_NO_DATA = 0,
        TGA_TYPE_INDEXED = 1,
        TGA_TYPE_RGB = 2,
        TGA_TYPE_GREY = 3,
        TGA_TYPE_RLE_INDEXED = 9,
        TGA_TYPE_RLE_RGB = 10,
        TGA_TYPE_RLE_GREY = 11,
        TGA_ORIGIN_MASK = 0x30,
        TGA_ORIGIN_SHIFT = 0x04,
        TGA_ORIGIN_BL = 0x00,
        TGA_ORIGIN_BR = 0x01,
        TGA_ORIGIN_UL = 0x02,
        TGA_ORIGIN_UR = 0x03;
    if (buffer.length < 19) console.error('THREE.TGALoader: Not enough data to contain header.');
    var content = new Uint8Array(buffer),
        offset = 0,
        header = {
      id_length: content[offset++],
      colormap_type: content[offset++],
      image_type: content[offset++],
      colormap_index: content[offset++] | content[offset++] << 8,
      colormap_length: content[offset++] | content[offset++] << 8,
      colormap_size: content[offset++],
      origin: [content[offset++] | content[offset++] << 8, content[offset++] | content[offset++] << 8],
      width: content[offset++] | content[offset++] << 8,
      height: content[offset++] | content[offset++] << 8,
      pixel_size: content[offset++],
      flags: content[offset++]
    }; // check tga if it is valid format

    tgaCheckHeader(header);

    if (header.id_length + offset > buffer.length) {
      console.error('THREE.TGALoader: No data.');
    } // skip the needn't data


    offset += header.id_length; // get targa information about RLE compression and palette

    var use_rle = false,
        use_pal = false,
        use_grey = false;

    switch (header.image_type) {
      case TGA_TYPE_RLE_INDEXED:
        use_rle = true;
        use_pal = true;
        break;

      case TGA_TYPE_INDEXED:
        use_pal = true;
        break;

      case TGA_TYPE_RLE_RGB:
        use_rle = true;
        break;

      case TGA_TYPE_RGB:
        break;

      case TGA_TYPE_RLE_GREY:
        use_rle = true;
        use_grey = true;
        break;

      case TGA_TYPE_GREY:
        use_grey = true;
        break;
    } //


    var useOffscreen = typeof OffscreenCanvas !== 'undefined';
    var canvas = useOffscreen ? new OffscreenCanvas(header.width, header.height) : document.createElement('canvas');
    canvas.width = header.width;
    canvas.height = header.height;
    var context = canvas.getContext('2d');
    var imageData = context.createImageData(header.width, header.height);
    var result = tgaParse(use_rle, use_pal, header, offset, content);
    getTgaRGBA(imageData.data, header.width, header.height, result.pixel_data, result.palettes);
    context.putImageData(imageData, 0, 0);
    return useOffscreen ? canvas.transferToImageBitmap() : canvas;
  }
});

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

    _this.targetQuaternion = new Quaternion$1();
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

export { Action, Animation, Audio, Bindings, Camera, Character, Controls, Engine, EngineResetEvent, Entity, Environment, EraEvent, EventTarget, Events, FreeRoamEntity, GameMode, Light, MaterialManager, Models, Network, network_registry as NetworkRegistry, Object3DEventTarget, PhysicsPlugin, Plugin, QualityAdjuster, RendererStats, Settings$1 as Settings, SettingsEvent, SettingsPanel$1 as SettingsPanel, Skybox, World, createUUID, defaultEraRenderer, disableShadows, dispose, extractMeshes, extractMeshesByName, getHexColorRatio, getRootScene, getRootWorld, lerp, loadJsonFromFile, loadTexture, shuffleArray, toDegrees, toRadians, vectorToAngle };
