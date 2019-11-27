/**
 * Defines the default input bindings per device
 * Binding id is sent over the network
 */
const Bindings = {
  BACKWARD: {
    binding_id: 0,
    keys: {
      keyboard: 83,
      controller: 'axes1',
    }
  },
  CAM_LOWER: {
    binding_id: 1,
    keys: {
      keyboard: 67,
      controller: 'button13',
    }
  },
  CAM_RAISE: {
    binding_id: 2,
    keys: {
      keyboard: 32,
      controller: 'button12',
    }
  },
  CHAT: {
    binding_id: 3,
    keys: {
      keyboard: 84,
      controller: 'button3',
    }
  },
  LIFT: {
    binding_id: 4,
    keys: {
      keyboard: 0,
      controller: 'button7',
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
  STOP: {
    binding_id: 9,
    keys: {
      keyboard: 32,
      controller: 'button6',
    }
  },
  TOGGLE_HUD: {
    binding_id: 10,
    keys: {
      keyboard: 72,
      controller: 'button8',
    }
  },
  RESET_PRACTICE: {
    binding_id: 11,
    keys: {
      keyboard: 82,
      controller: 'button8',
    }
  },
  TWIN_STICK_X: {
    binding_id: 12,
    keys: {
      controller: 'axes2',
    }
  },
  TWIN_STICK_Y: {
    binding_id: 13,
    keys: {
      controller: 'axes3',
    }
  },
  LOOK_BACK: {
    binding_id: 14,
    keys: {
      keyboard: 69,
      controller: 'button0',
    }
  },
};

export default Bindings;