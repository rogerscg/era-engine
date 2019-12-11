/**
 * @author rogerscg / https://github.com/rogerscg
 */

/**
 * The UI core for the game engine. The initial components are
 * created here, then most control is passed to individual controllers.
 */

let uiInstance = null;

class UI {
  
  /**
   * Enforces a singleton instance of UI.
   */
  static get() {
    if (!uiInstance) {
      uiInstance = new UI();
    }
    return uiInstance;
  }
  
  constructor() {
    this.currentScreen = null;
    this.hud = true;
  }
  
  showScreen(screen) {
    if (screen == this.currentScreen) {
      return;
    }
    if (this.currentScreen) {
      this.currentScreen.hide();
    }
    this.currentScreen = screen;
    if (!screen.root) {
      // Fetch the screen template if it doesn't exist yet, append to document.
      return screen.getTemplate().then((root) => {
        document.body.appendChild(root);
        screen.show();
      });
    }
    screen.show();
  }
}

export default UI;