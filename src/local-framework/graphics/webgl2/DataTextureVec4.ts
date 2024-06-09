import { WebGLContext } from './WebGLContext';

export interface IUnboundDataTextureVec4 {
  initialize(data: [number, number, number, number][]): void;
  rawBind(): void;
  preBind(inCallback: (bound: IBoundDataTextureVec4) => void): void;
  bind(inCallback: (bound: IBoundDataTextureVec4) => void): void;
}

export interface IBoundDataTextureVec4 extends IUnboundDataTextureVec4 {
  allocate(data: [number, number, number, number][]): void;
  update(start: number, data: [number, number, number, number][]): void;
}

export class DataTextureVec4 implements IBoundDataTextureVec4 {
  private _texture: WebGLTexture | null = null;

  private _buffer: Uint8Array | undefined;

  // initialize(data: number[] = [], numComponents: number = 1) {
  initialize(data: [number, number, number, number][] = []) {
    if (this._texture) {
      throw new Error('data texture already initialized');
    }

    const gl = WebGLContext.getContext();

    this._texture = gl.createTexture();
    if (!this._texture) {
      throw new Error('data texture failed to be created');
    }

    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    // we don't want any filtering
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // this.update(data, numComponents);
    this.allocate(data);
  }

  dispose() {
    const gl = WebGLContext.getContext();
    gl.deleteTexture(this._texture);
  }

  // update(data: number[], numComponents: number = 1) {
  allocate(data: [number, number, number, number][]) {
    if (!this._texture) {
      throw new Error('data texture not initialized');
    }
    if (data.length <= 0) {
      throw new Error('texture: width must be positive');
    }

    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    this._buffer = new Uint8Array(data.flat());

    // // expand the data to 4 values per pixel.
    // const numElements = data.length / numComponents;
    // const expandedData = new Float32Array(numElements * 4);
    // for (let ii = 0; ii < numElements; ++ii) {
    //   const srcOffset = ii * numComponents;
    //   const dstOffset = ii * 4;
    //   for (let jj = 0; jj < numComponents; ++jj)
    //     expandedData[dstOffset + jj] = data[srcOffset + jj];
    // }

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = data.length;
    const height = 1;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, this._buffer);
  }

  update(start: number, data: [number, number, number, number][]) {
    if (!this._texture) {
      throw new Error('data texture not initialized');
    }
    if (!this._buffer) {
      throw new Error('data texture update but not previously allocated');
    }
    if (start + data.length > this._buffer.length) {
      throw new Error(
        `data texture update but size is larger (start: ${start}, length: ${data.length}, max: ${this._buffer.length})`
      );
    }

    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    // this._buffer = new Uint8Array(data.flat());

    for (let ii = 0; ii < data.length; ++ii) {
      this._buffer[ii * 4 + 0] = data[ii][0];
      this._buffer[ii * 4 + 1] = data[ii][1];
      this._buffer[ii * 4 + 2] = data[ii][2];
      this._buffer[ii * 4 + 3] = data[ii][3];
    }

    const level = 0;
    const width = data.length;
    const height = 1;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    const xoffset = start;
    const yoffset = 0; // must stay 0
    const srcOffset = 0;

    gl.texSubImage2D(gl.TEXTURE_2D, level, xoffset, yoffset, width, height, format, type, this._buffer, srcOffset);
  }

  rawBind() {
    if (!this._texture) {
      throw new Error('data texture not initialized');
    }

    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);
  }

  preBind(inCallback: (bound: IBoundDataTextureVec4) => void): void {
    this.rawBind();
    inCallback(this);
  }

  bind(inCallback: (bound: IBoundDataTextureVec4) => void): void {
    this.preBind(inCallback);
    DataTextureVec4.unbind();
  }

  static unbind(): void {
    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}
