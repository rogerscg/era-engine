/**
 * A bindings object, used for better control of custom bindings.
 */
class Bindings {
  constructor(id) {
    this.id = id;
    this.actions = new Map();
    this.keysToActions = new Map();
    this.staticProperties = new Set();
  }

  getId() {
    return this.id;
  }

  getActions() {
    return this.actions;
  }

  /**
   * Returns all actions associated with a given key.
   * @param {?} key
   * @returns {Array<Action>}
   */
  getActionsForKey(key) {
    return this.keysToActions.get(key);
  }

  /**
   * Adds an action to the bindings.
   * @param {Action} action
   */
  addAction(action) {
    this.actions.set(action.getName(), action);
    this.loadKeysToActions();
    this.loadStaticProperties();
    return this;
  }

  /**
   * Removes an action from the bindings.
   * @param {Action} action
   */
  removeAction(action) {
    this.actions.delete(action.getName());
    this.loadKeysToActions();
    this.loadStaticProperties();
    return this;
  }

  /**
   * Gets the action for a given name.
   * @param {string} actionName 
   */
  getAction(actionName) {
    return this.actions.get(actionName);
  }

  /**
   * Loads an object into the bindings, considering custom bindings.
   * @param {Object} bindingsObj
   */
  load(bindingsObj) {
    for (let actionName in bindingsObj) {
      const actionObj = bindingsObj[actionName];
      const action = new Action(actionName).load(actionObj);
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
  loadKeysToActions() {
    // Clear beforehand in case we're reloading.
    this.keysToActions.clear();
    this.actions.forEach((action) => {
      const keys = action.getKeys();
      keys.forEach((key) => {
        if (!this.keysToActions.has(key)) {
          this.keysToActions.set(key, new Array());
        }
        this.keysToActions.get(key).push(action);
      });
    });
  }

  /**
   * Takes all action names and sets their names as "static" fields of the
   * bindings instance. This is to ease development for the user, so they can
   * call `entity.getActionValue(bindings.SPRINT)` as opposed to passing in a
   * string literal `entity.getActionValue('SPRINT')`.
   */
  loadStaticProperties() {
    // Clear old static properties, based on a set created from earlier.
    this.staticProperties.forEach((propName) => {
      delete this[propName];
    });
    this.staticProperties.clear();
    // Set new static properties based on actions.
    this.actions.forEach((ignore, actionName) => {
      this[actionName] = actionName;
      this.staticProperties.add(actionName);
    });
  }

  /**
   * Merges the given bindings into the existing bindings.
   * @param {Bindings} other
   */
  merge(other) {
    other.getActions().forEach((action) => {
      if (!this.actions.has(action.getName())) {
        this.actions.set(action.getName(), action);
      } else {
        this.actions.get(action.getName()).merge(action);
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
  toObject() {
    const exportObj = {};
    this.actions.forEach((action) => {
      exportObj[action.getName()] = action.toObject();
    });
    return exportObj;
  }

  /**
   * Returns if there are no actions associated with the bindings.
   * @returns {boolean}
   */
  isEmpty() {
    // Get all non-empty actions.
    const nonEmptyActions = [...this.actions.values()].filter((action) => {
      return !action.isEmpty();
    })
    return nonEmptyActions.length == 0;
  }
}

/**
 * Represents an action an entity can take as well as the inputs that are used
 * to trigger this action.
 */
class Action {
  constructor(name) {
    this.name = name;
    this.id = null;
    this.keys = new Map();
  }

  getName() {
    return this.name;
  }

  getKeys() {
    return this.keys;
  }

  /**
   * Adds a key that can trigger the action.
   * @param {string} inputType
   * @param {?} key 
   */
  addKey(inputType, key) {
    this.keys.set(inputType, key);
    return this;
  }

  /**
   * Clears the key for the given input type.
   * @param {string} inputType 
   */
  clearInputType(inputType) {
    this.keys.delete(inputType);
  }

  /**
   * Loads the action from an arbitrary object.
   */
  load(actionObj) {
    for (let inputType in actionObj.keys) {
      this.keys.set(inputType, actionObj.keys[inputType]);
    }
    return this;
  }

  /**
   * Merges an existing action with this action.
   * @param {Action} other
   */
  merge(other) {
    other.getKeys().forEach((key, inputType) => {
      if (!this.keys.has(inputType)) {
        this.keys.set(inputType, key);
      }
    });
    return this
  }

  /**
   * Converts the action instance to an object.
   * @returns {Object}
   */
  toObject() {
    const exportObj = {};
    exportObj.keys = {};
    this.keys.forEach((key, inputType) => exportObj.keys[inputType] = key);
    return exportObj;
  }

  /**
   * Detects if the action is empty.
   * @returns {boolean}
   */
  isEmpty() {
    return this.keys.size == 0;
  }
}

export {Action, Bindings};