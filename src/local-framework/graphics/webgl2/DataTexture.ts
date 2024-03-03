import { WebGLContext } from './WebGLContext';

export interface IUnboundDataTexture {
  initialize(data?: number[]): void;
  rawBind(): void;
  preBind(inCallback: (bound: IBoundDataTexture) => void): void;
  bind(inCallback: (bound: IBoundDataTexture) => void): void;
}

export interface IBoundDataTexture extends IUnboundDataTexture {
  update(data: number[]): void;
}

export class DataTexture implements IBoundDataTexture {
  private _texture: WebGLTexture | null = null;

  // initialize(data: number[] = [], numComponents: number = 1) {
  initialize(data: number[] = []) {
    if (this._texture) {
      throw new Error('data texture already initialized');
    }

    const gl = WebGLContext.getContext();

    this._texture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    // make it possible to use a non-power-of-2 texture + we don't need any filtering
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // this.update(data, numComponents);
    this.update(data);
  }

  dispose() {
    const gl = WebGLContext.getContext();
    gl.deleteTexture(this._texture);
  }

  // update(data: number[], numComponents: number = 1) {
  update(data: number[]) {
    if (!this._texture) {
      throw new Error('data texture not initialized');
    }

    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    const expandedData = new Float32Array(data);

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
    // const internalFormat = gl.RGBA;
    // const internalFormat = gl.RGBA32F;
    const internalFormat = gl.R32F;
    // const width = numElements;
    const width = data.length;
    const height = 1;
    const border = 0;
    // const format = gl.RGBA;
    const format = gl.RED;
    // const type = gl.UNSIGNED_BYTE;
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
      expandedData
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
