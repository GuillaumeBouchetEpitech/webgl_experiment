import { AllKeyCodes } from './KeyCodes';

const AllMouseButtons = {
  Left: 0,
  Middle: 1,
  Right: 2
};

class MouseManager {
  private _pressedButtonsSet = new Set<number>();
  private _activated: boolean = false;
  private _handleMouseDown: (event: MouseEvent) => void;
  private _handleMouseUp: (event: MouseEvent) => void;
  private _handleMouseMove: (event: MouseEvent) => void;

  // private _positionX = 0;
  // private _positionY = 0;
  private _deltaX = 0;
  private _deltaY = 0;

  constructor() {
    const handleMouseDown = (event: MouseEvent) => {
      this._pressedButtonsSet.add(event.button);
    };
    const handleMouseUp = (event: MouseEvent) => {
      this._pressedButtonsSet.delete(event.button);
    };
    const handleMouseMove = (event: MouseEvent) => {
      this._deltaX +=
        event.movementX ||
        (event as any).mozMovementX ||
        (event as any).webkitMovementX ||
        0;

      this._deltaY +=
        event.movementY ||
        (event as any).mozMovementY ||
        (event as any).webkitMovementY ||
        0;
    };

    this._activated = false;
    this._handleMouseDown = handleMouseDown.bind(this);
    this._handleMouseUp = handleMouseUp.bind(this);
    this._handleMouseMove = handleMouseMove.bind(this);
  }

  activate() {
    if (this._activated) {
      return;
    }

    this._pressedButtonsSet.clear();

    document.addEventListener('mousedown', this._handleMouseDown);
    document.addEventListener('mouseup', this._handleMouseUp);
    document.addEventListener('mousemove', this._handleMouseMove);

    this._activated = true;
  }

  deactivate() {
    if (!this._activated) {
      return;
    }

    this._pressedButtonsSet.clear();

    document.removeEventListener('mousedown', this._handleMouseDown);
    document.removeEventListener('mouseup', this._handleMouseUp);
    document.removeEventListener('mousemove', this._handleMouseMove);

    this._activated = false;
  }

  isButtonPressed(inKey: keyof typeof AllMouseButtons) {
    return this._pressedButtonsSet.has(AllMouseButtons[inKey]);
  }

  deltaX(): number {
    return this._deltaX;
  }
  deltaY(): number {
    return this._deltaY;
  }
  resetDeltas() {
    this._deltaX = 0;
    this._deltaY = 0;
  }
}

//
//
//

const GlobalMouseManager = new MouseManager();

export { GlobalMouseManager };
