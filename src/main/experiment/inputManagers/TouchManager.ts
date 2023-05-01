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
  private _activated: boolean = false;
  private _allTouchDataMap = new Map<string, TouchData>();
  private _allCachedTouchDataArray: TouchData[] = [];

  private _handleTouchStart: (event: TouchEvent) => void;
  private _handleTouchEnd: (event: TouchEvent) => void;
  private _handleTouchMove: (event: TouchEvent) => void;

  constructor() {
    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault();

      for (let ii = 0; ii < event.changedTouches.length; ++ii) {
        const { identifier, pageX, pageY } = event.changedTouches[ii];
        const newData = new TouchData(identifier, pageX, pageY);

        this._allTouchDataMap.set(`${identifier}`, newData);
        this._allCachedTouchDataArray.length = 0;
      }
    };
    const handleTouchEnd = (event: TouchEvent) => {
      event.preventDefault();

      for (let ii = 0; ii < event.changedTouches.length; ++ii) {
        const { identifier } = event.changedTouches[ii];

        this._allTouchDataMap.delete(`${identifier}`);
        this._allCachedTouchDataArray.length = 0;
      }
    };
    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault();

      for (let ii = 0; ii < event.changedTouches.length; ++ii) {
        const { identifier, pageX, pageY } = event.changedTouches[ii];

        const currData = this._allTouchDataMap.get(`${identifier}`);
        if (!currData) continue;

        currData.deltaX += pageX - currData.positionX;
        currData.deltaY += pageY - currData.positionY;
        currData.positionX = pageX;
        currData.positionY = pageY;
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

    this._allTouchDataMap.clear();
    this._allCachedTouchDataArray.length = 0;

    document.addEventListener('touchstart', this._handleTouchStart);
    document.addEventListener('touchend', this._handleTouchEnd);
    document.addEventListener('touchcancel', this._handleTouchEnd);
    document.addEventListener('touchmove', this._handleTouchMove, {
      passive: false
    });

    this._activated = true;
  }

  deactivate() {
    if (!this._activated) return;

    this._allTouchDataMap.clear();
    this._allCachedTouchDataArray.length = 0;

    document.removeEventListener('touchstart', this._handleTouchStart);
    document.removeEventListener('touchend', this._handleTouchEnd);
    document.removeEventListener('touchcancel', this._handleTouchEnd);
    document.removeEventListener('touchmove', this._handleTouchMove);

    this._activated = false;
  }

  private _refreshCache() {
    if (this._allCachedTouchDataArray.length === 0) {
      this._allCachedTouchDataArray = [...this._allTouchDataMap.values()];
    }
  }

  getTouchData(): ReadonlyArray<TouchData> {
    this._refreshCache();
    return this._allCachedTouchDataArray;
  }

  resetDeltas() {
    this._refreshCache();
    this._allCachedTouchDataArray.forEach((item) => item.resetDelta());
  }
}

//
//
//

const GlobalTouchManager = new TouchManager();

export { GlobalTouchManager };
