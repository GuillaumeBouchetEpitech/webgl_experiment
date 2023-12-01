type OnChangeCallback = (isVisible: boolean) => void;

class VisibilityManager {
  private _activated: boolean = false;
  private _onVisibilityChangeCallbacks: OnChangeCallback[] = [];

  private _handleVisibilityChange: () => void;

  constructor() {
    const handleVisibilityChange = () => {
      const isVisible = this.isVisible();
      this._onVisibilityChangeCallbacks.forEach((callback) =>
        callback(isVisible)
      );
    };

    this._handleVisibilityChange = handleVisibilityChange.bind(this);
  }

  activate() {
    if (!this.isSupported()) {
      return;
    }
    if (this._activated) {
      return;
    }

    document.addEventListener(
      'visibilitychange',
      this._handleVisibilityChange,
      false
    );

    this._activated = true;
  }

  deactivate() {
    if (!this._activated) {
      return;
    }

    document.removeEventListener(
      'visibilitychange',
      this._handleVisibilityChange,
      false
    );

    this._activated = false;
  }

  //

  isSupported() {
    return 'onvisibilitychange' in document;
  }

  //

  isVisible() {
    return document.visibilityState === 'visible';
  }

  //

  addVisibilityChange(inCallback: OnChangeCallback) {
    this._onVisibilityChangeCallbacks.push(inCallback);
  }
  removeVisibilityChange(inCallback: OnChangeCallback) {
    const index = this._onVisibilityChangeCallbacks.indexOf(inCallback);
    if (index < 0) {
      return;
    }
    this._onVisibilityChangeCallbacks.splice(index, 1);
  }

  //

  removeAllCallbacks() {
    this._onVisibilityChangeCallbacks.length = 0;
  }
}

const GlobalVisibilityManager = new VisibilityManager();

export { GlobalVisibilityManager };
