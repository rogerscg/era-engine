/**
 * Defines the default input bindings per device. Binding id is sent over the
 * network.
 */
const Bindings = {
  BACKWARD: {
    binding_id: 0,
    keys: {
      keyboard: 83,
      controller: 'axes1',
    }
  },
  FORWARD: {
    binding_id: 5,
    keys: {
      keyboard: 87,
      controller: 'axes1',
    }
  },
  LEFT: {
    binding_id: 6,
    keys: {
      keyboard: 65,
      controller: 'axes0',
    }
  },
  RIGHT: {
    binding_id: 7,
    keys: {
      keyboard: 68,
      controller: 'axes0',
    }
  },
  SPRINT: {
    binding_id: 8,
    keys: {
      keyboard: 16,
      controller: 'button5',
    }
  },
};

export default Bindings;