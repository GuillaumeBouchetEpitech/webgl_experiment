import { AllKeyCodes } from './KeyCodes';

class KeyboardManager {
  private _pressedKeysSet = new Set<number>();
  private _preventDefaultKeysSet = new Set<number>();
  private _activated: boolean = false;
  private _handleKeyDown: (event: KeyboardEvent) => void;
  private _handleKeyUp: (event: KeyboardEvent) => void;

  constructor() {
    const handleKeyDown = (event: KeyboardEvent) => {
      const { keyCode } = event;

      if (this._preventDefaultKeysSet.has(keyCode)) event.preventDefault();

      this._pressedKeysSet.add(keyCode);
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      const { keyCode } = event;

      if (this._preventDefaultKeysSet.has(keyCode)) event.preventDefault();

      this._pressedKeysSet.delete(keyCode);
    };

    this._activated = false;
    this._handleKeyDown = handleKeyDown.bind(this);
    this._handleKeyUp = handleKeyUp.bind(this);
  }

  isPressed(...inKeys: (keyof typeof AllKeyCodes)[]) {
    for (const key of inKeys)
      if (this._pressedKeysSet.has(AllKeyCodes[key])) return true;
    return false;
  }

  preventDefault(inKey: keyof typeof AllKeyCodes) {
    this._preventDefaultKeysSet.add(AllKeyCodes[inKey]);
  }

  enableDefault(inKey: keyof typeof AllKeyCodes) {
    this._preventDefaultKeysSet.delete(AllKeyCodes[inKey]);
  }

  activate() {
    if (this._activated) return;

    this._pressedKeysSet.clear();

    document.addEventListener('keydown', this._handleKeyDown);
    document.addEventListener('keyup', this._handleKeyUp);

    this._activated = true;
  }

  deactivate() {
    if (!this._activated) return;

    this._pressedKeysSet.clear();

    document.removeEventListener('keydown', this._handleKeyDown);
    document.removeEventListener('keyup', this._handleKeyUp);

    this._activated = false;
  }
}

//
//
//

const GlobalKeyboardManager = new KeyboardManager();

export { GlobalKeyboardManager };
