import { WebGLContext } from './WebGLContext';

export interface IUnboundDataTexture {
  initialize(data: number[] | number): void;
  rawBind(): void;
  preBind(inCallback: (bound: IBoundDataTexture) => void): void;
  bind(inCallback: (bound: IBoundDataTexture) => void): void;
}

export interface IBoundDataTexture extends IUnboundDataTexture {
  allocate(data: number[] | number): void;
  update(start: number, data: number[]): void;
}

export class DataTexture implements IBoundDataTexture {
  private _texture: WebGLTexture | null = null;

  private _buffer: Float32Array | undefined;

  // initialize(data: number[] = [], numComponents: number = 1) {
  initialize(data: number[] | number) {
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
  allocate(data: number[] | number) {
    if (!this._texture) {
      throw new Error('data texture not initialized');
    }
    const dataSize = Array.isArray(data) ? data.length : data;
    if (dataSize <= 0) {
      throw new Error('texture: width must be positive');
    }
    if (dataSize > 2048) {
      throw new Error(`data texture max size is 2048 (input was ${dataSize})`);
    }

    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    // done for type safety compliance reasons
    if (Array.isArray(data)) {
      // -> new Float32Array(number[])
      this._buffer = new Float32Array(data);
    } else {
      // -> new Float32Array(number)
      this._buffer = new Float32Array(data);
    }

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
    const internalFormat = gl.R32F;
    const width = dataSize;
    const height = 1;
    const border = 0;
    const format = gl.RED;
    const type = gl.FLOAT;
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      format,
      type,
      this._buffer
    );
  }

  update(start: number, data: number[]) {
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

    // this._buffer = new Float32Array(data);

    for (let ii = 0; ii < data.length; ++ii) {
      this._buffer[ii] = data[ii];
    }

    const level = 0;
    // const internalFormat = gl.R32F;
    const width = data.length;
    const height = 1;
    // const border = 0;
    const format = gl.RED;
    const type = gl.FLOAT;

    const xoffset = start;
    const yoffset = 0; // must stay 0
    const srcOffset = 0;

    gl.texSubImage2D(
      gl.TEXTURE_2D,
      level,
      xoffset,
      yoffset,
      width,
      height,
      format,
      type,
      this._buffer,
      srcOffset
    );
  }

  rawBind() {
    if (!this._texture) {
      throw new Error('data texture not initialized');
    }

    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);
  }

  preBind(inCallback: (bound: IBoundDataTexture) => void): void {
    this.rawBind();
    inCallback(this);
  }

  bind(inCallback: (bound: IBoundDataTexture) => void): void {
    this.preBind(inCallback);
    DataTexture.unbind();
  }

  static unbind(): void {
    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}
