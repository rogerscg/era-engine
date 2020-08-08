class CharacterState {
  /**
   * @param {string} stateName
   */
  constructor(stateName) {
    this.name = stateName;
    // Transitions for the given states.
    this.transitions = new Map();
    // The function called when starting the state.
    this.startFunction = null;
    // The function called when ending the state.
    this.endFunction = null;
    // The function called to determine if the state is eligible.
    this.eligibilityFunction = null;
  }

  /**
   * Sets the state as transition state between the two states.
   * @param {string} fromState
   * @param {string} toState
   * @returns {CharacterState}
   */
  withTransition(fromState, toState) {
    this.transitions.set(fromState, toState);
    return this;
  }

  /**
   * Sets the function called at the start of the state.
   * @param {function} startFunction
   * @returns {CharacterState}
   */
  withStartFunction(startFunction) {
    this.startFunction = startFunction;
    return this;
  }

  /**
   * Sets the function called at the end of the state.
   * @param {function} endFunction
   * @returns {CharacterState}
   */
  withEndFunction(endFunction) {
    this.endFunction = endFunction;
    return this;
  }

  /**
   * Sets a function called to determine if the state is eligible.
   */
  withEligibilityFunction(eligibilityFunction) {
    this.eligibilityFunction = eligibilityFunction;
    return this;
  }

  /**
   * Marks the beginning of the state.
   */
  start() {
    if (this.startFunction) {
      this.startFunction();
    }
  }

  /**
   * Marks the end of the state. Returns true if ended successfully. Otherwise,
   * the state can prevent itself from ending by returning false.
   * @returns {boolean}
   */
  end() {
    if (this.endFunction) {
      return this.endFunction();
    }
    return true;
  }

  /**
   * Returns if the state is eligible.
   * @returns {boolean}
   */
  isEligible() {
    if (this.eligibilityFunction) {
      return this.eligibilityFunction();
    }
    return true;
  }
}

export default CharacterState;
