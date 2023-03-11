class TouchData {
  public id: number;
  public createdAt = Date.now();
  public positionX: number;
  public positionY: number;
  public deltaX: number = 0;
  public deltaY: number = 0;

  constructor(id: number, positionX: number, positionY: number) {
    this.id = id;
    this.positionX = positionX;
    this.positionY = positionY;
  }

  resetDelta() {
    this.deltaX = 0;
    this.deltaY = 0;
  }
}

class TouchManager {
  private _pressedButtonsSet = new Set<number>();
  private _activated: boolean = false;
  private _handleTouchStart: (event: TouchEvent) => void;
  private _handleTouchEnd: (event: TouchEvent) => void;
  private _handleTouchMove: (event: TouchEvent) => void;

  private _allTouchData: TouchData[] = [];

  constructor() {
    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();

      for (let ii = 0; ii < event.changedTouches.length; ++ii) {
        const currTouch = event.changedTouches[ii];
        this._allTouchData.push(
          new TouchData(currTouch.identifier, currTouch.pageX, currTouch.pageY)
        );
      }
    };
    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault();

      for (let ii = 0; ii < event.changedTouches.length; ++ii) {
        const currTouch = event.changedTouches[ii];

        const index = this._allTouchData.findIndex(
          (item) => item.id === currTouch.identifier
        );
        if (index < 0) continue;

        this._allTouchData.splice(index, 1);
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();

      for (let ii = 0; ii < event.changedTouches.length; ++ii) {
        const currTouch = event.changedTouches[ii];

        const index = this._allTouchData.findIndex(
          (item) => item.id === currTouch.identifier
        );
        if (index < 0) continue;

        const savedTouch = this._allTouchData[index];

        savedTouch.deltaX += currTouch.pageX - savedTouch.positionX;
        savedTouch.deltaY += currTouch.pageY - savedTouch.positionY;
        savedTouch.positionX = currTouch.pageX;
        savedTouch.positionY = currTouch.pageY;
      }
    };

    this._activated = false;
    this._handleTouchStart = handleTouchStart.bind(this);
    this._handleTouchEnd = handleTouchEnd.bind(this);
    this._handleTouchMove = handleTouchMove.bind(this);
  }

  isSupported() {
    return 'ontouchstart' in window;
  }

  activate() {
    if (!this.isSupported()) return;
    if (this._activated) return;

    this._pressedButtonsSet.clear();

    document.addEventListener('touchstart', this._handleTouchStart);
    document.addEventListener('touchend', this._handleTouchEnd);
    document.addEventListener('touchmove', this._handleTouchMove);

    this._activated = true;
  }

  deactivate() {
    if (!this._activated) return;

    this._pressedButtonsSet.clear();

    document.removeEventListener('touchstart', this._handleTouchStart);
    document.removeEventListener('touchend', this._handleTouchEnd);
    document.removeEventListener('touchmove', this._handleTouchMove);

    this._activated = false;
  }

  getTouchData(): ReadonlyArray<TouchData> {
    return this._allTouchData;
  }

  resetDeltas() {
    this._allTouchData.forEach((item) => item.resetDelta());
  }
}

//
//
//

const GlobalTouchManager = new TouchManager();

export { GlobalTouchManager };
