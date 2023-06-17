
export class CubeData {
  private _size: number;
  private _buffer: Float32Array;

  constructor(inBuffer: Float32Array, inSize: number) {
    this._size = inSize;
    this._buffer = inBuffer;
  }

  // set(inX: number, inY: number, inZ: number, inValue: number) {
  //   this._buffer[this._getIndex(inX, inY, inZ)] = inValue;
  // }

  copy(inBuffer: Float32Array) {
    for (let ii = 0; ii < this._size; ++ii) {
      this._buffer[ii] = inBuffer[ii];
    }
  }

  get(inX: number, inY: number, inZ: number): number {
    if (
      inX < 0 ||
      inX >= this._size ||
      inY < 0 ||
      inY >= this._size ||
      inZ < 0 ||
      inZ >= this._size
    ) {
      return 1;
    }

    return this._buffer[this._getIndex(inX, inY, inZ)];
  }

  private _getIndex(inX: number, inY: number, inZ: number) {
    return inZ * this._size * this._size + inY * this._size + inX;
  }
}
