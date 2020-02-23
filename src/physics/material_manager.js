let instance = null;
/**
 * Handles creation and installation of physical materials within the physics
 * engine.
 */
class MaterialManager {
  static get() {
    if (!instance) {
      instance = new MaterialManager();
    }
    return instance;
  }

  constructor() {
    this.physicalMaterials = new Map();
    this.contactMaterials = new Map();
    this.worlds = new Set();
  }

  /**
   * Registers a physics world to receive updates to materials created by
   * objects within it.
   * @param {CANNON.World} world
   */
  registerWorld(world) {
    this.worlds.add(world);
    this.contactMaterials.forEach((material) =>
      world.addContactMaterial(material)
    );
  }

  /**
   * Unregisters a physics world from updates to materials.
   * @param {CANNON.World} world
   */
  unregisterWorld(world) {
    this.worlds.delete(world);
  }

  /**
   * Creates a new physical material for the given name and options. If the
   * physical material already exists, return the existing one.
   */
  createPhysicalMaterial(name, options) {
    if (!this.physicalMaterials.has(name)) {
      const material = new CANNON.Material(options);
      this.physicalMaterials.set(name, material);
    }
    return this.physicalMaterials.get(name);
  }

  /**
   * Creates a new contact material between two given names. If the contact
   * material already exists, return the existing one.
   */
  createContactMaterial(name1, name2, options) {
    // TODO: Allow for "pending" contact material if one of the materials has
    // not been created yet.
    const key = this.createContactKey(name1, name2);
    if (!this.contactMaterials.has(key)) {
      const mat1 = this.createPhysicalMaterial(name1);
      const mat2 = this.createPhysicalMaterial(name2);
      const contactMat = new CANNON.ContactMaterial(mat1, mat2, options);
      this.contactMaterials.set(key, contactMat);
      this.worlds.forEach((world) => world.addContactMaterial(contactMat));
    }
    return this.contactMaterials.get(key);
  }

  /**
   * Creates a combined string to use as a key for contact materials.
   */
  createContactKey(name1, name2) {
    // Alphabetize, then concatenate.
    if (name1 < name2) {
      return `${name1},${name2}`;
    }
    return `${name2},${name1}`;
  }
}

export default MaterialManager;
