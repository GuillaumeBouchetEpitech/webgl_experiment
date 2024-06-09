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
  private _handleMouseWheel: (event: WheelEvent) => void;

  private _positionX = 0;
  private _positionY = 0;
  private _deltaX = 0;
  private _deltaY = 0;
  private _wheelDeltaY = 0;

  private _onEvent: (() => void) | undefined;

  constructor() {
    const handleMouseDown = (event: MouseEvent) => {
      if (this._onEvent) {
        this._onEvent();
      }

      this._positionX = event.pageX;
      this._positionY = event.pageY;

      this._pressedButtonsSet.add(event.button);
    };
    const handleMouseUp = (event: MouseEvent) => {
      if (this._onEvent) {
        this._onEvent();
      }

      this._positionX = event.pageX;
      this._positionY = event.pageY;

      this._pressedButtonsSet.delete(event.button);
    };
    const handleMouseMove = (event: MouseEvent) => {
      if (this._onEvent) {
        this._onEvent();
      }

      this._positionX = event.pageX;
      this._positionY = event.pageY;

      this._deltaX += event.movementX || (event as any).mozMovementX || (event as any).webkitMovementX || 0;

      this._deltaY += event.movementY || (event as any).mozMovementY || (event as any).webkitMovementY || 0;
    };
    const handleWheelEvent = (event: WheelEvent) => {
      if (this._onEvent) {
        this._onEvent();
      }

      this._wheelDeltaY += event.deltaY || 0;
    };

    this._activated = false;
    this._handleMouseDown = handleMouseDown.bind(this);
    this._handleMouseUp = handleMouseUp.bind(this);
    this._handleMouseMove = handleMouseMove.bind(this);
    this._handleMouseWheel = handleWheelEvent.bind(this);
  }

  activate(domElement: HTMLElement) {
    if (this._activated) {
      return;
    }

    this._pressedButtonsSet.clear();

    domElement.addEventListener('mousedown', this._handleMouseDown);
    domElement.addEventListener('mouseup', this._handleMouseUp);
    domElement.addEventListener('mousemove', this._handleMouseMove);
    domElement.addEventListener('wheel', this._handleMouseWheel);

    this._activated = true;
  }

  deactivate(domElement: HTMLElement) {
    if (!this._activated) {
      return;
    }

    this._pressedButtonsSet.clear();

    domElement.removeEventListener('mousedown', this._handleMouseDown);
    domElement.removeEventListener('mouseup', this._handleMouseUp);
    domElement.removeEventListener('mousemove', this._handleMouseMove);
    domElement.removeEventListener('wheel', this._handleMouseWheel);

    this._activated = false;
  }

  isButtonPressed(inKey: keyof typeof AllMouseButtons) {
    return this._pressedButtonsSet.has(AllMouseButtons[inKey]);
  }

  get positionX(): number {
    return this._positionX;
  }
  get positionY(): number {
    return this._positionY;
  }
  deltaX(): number {
    return this._deltaX;
  }
  deltaY(): number {
    return this._deltaY;
  }
  wheelDeltaY(): number {
    return this._wheelDeltaY;
  }
  resetDeltas() {
    this._deltaX = 0;
    this._deltaY = 0;
    this._wheelDeltaY = 0;
  }

  onEvent(callback: (() => void) | undefined) {
    this._onEvent = callback;
  }
}

//
//
//

const GlobalMouseManager = new MouseManager();

export { GlobalMouseManager };
