export interface IFrameProfiler {
  framesDelta: ReadonlyArray<number>;
  averageDelta: number;
  minDelta: number;
  maxDelta: number;
}

export class FrameProfiler implements IFrameProfiler {
  private _framesDelta: number[] = [];
  private _averageDelta: number = 0;
  private _minDelta: number = 0;
  private _maxDelta: number = 0;

  pushDelta(inDelta: number) {
    if (this._framesDelta.length >= 100) {
      this._framesDelta.shift();
    }

    this._framesDelta.push(inDelta);

    //
    //
    //

    this._minDelta = +999999999;
    this._maxDelta = -999999999;
    this._averageDelta = 0;

    for (const currDelta of this._framesDelta) {
      this._minDelta = Math.min(this._minDelta, currDelta);
      this._maxDelta = Math.max(this._maxDelta, currDelta);
      this._averageDelta += currDelta;
    }
    this._averageDelta /= this._framesDelta.length;
  }

  get framesDelta(): ReadonlyArray<number> {
    return this._framesDelta;
  }
  get averageDelta(): number {
    return this._averageDelta;
  }
  get minDelta(): number {
    return this._minDelta;
  }
  get maxDelta(): number {
    return this._maxDelta;
  }
}
