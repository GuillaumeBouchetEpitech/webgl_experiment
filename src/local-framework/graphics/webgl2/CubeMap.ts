import { WebGLContext } from './WebGLContext';

export enum CubeMapType {
  positiveX,
  negativeX,
  positiveY,
  negativeY,
  positiveZ,
  negativeZ
}

export const getCubeMapType = (inType: CubeMapType): number => {
  const gl = WebGLContext.getContext();
  switch (inType) {
    case CubeMapType.positiveX:
      return gl.TEXTURE_CUBE_MAP_POSITIVE_X;
    case CubeMapType.negativeX:
      return gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
    case CubeMapType.positiveY:
      return gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
    case CubeMapType.negativeY:
      return gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
    case CubeMapType.positiveZ:
      return gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
    case CubeMapType.negativeZ:
      return gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
  }
  // throw new Error('cube map: invalid type');
};

export interface IUnboundCubeMap {
  initialize(width: number, height: number): void;
  rawBind(): void;
  bind(inCallback: (bound: IBoundCubeMap) => void): void;
  getRawObject(): WebGLTexture;
}

export interface IBoundCubeMap {
  allocate(): void;
  loadFromMemory(inType: CubeMapType, inPixels: Uint8Array): void;
  complete(): void;
  getRawObject(): WebGLTexture;
}

export class CubeMap implements IUnboundCubeMap, IBoundCubeMap {
  private _width: number = 0;
  private _height: number = 0;
  private _minBufferSize: number = 0;
  private _texture: WebGLTexture | null = null;

  initialize(width: number, height: number): void {
    if (width < 1) throw new Error(`cube map: width is < 1, input: ${width}`);
    if (height < 1)
      throw new Error(`cube map: height is < 1, input: ${height}`);
    const gl = WebGLContext.getContext();
    this._texture = gl.createTexture();
    this._width = width;
    this._height = height;
    this._minBufferSize = this._width * this._height * 4;
  }

  dispose() {
    const gl = WebGLContext.getContext();
    gl.deleteTexture(this._texture);
  }

  rawBind(): void {
    if (!this._texture) throw new Error('cube map: not initialized');
    const gl = WebGLContext.getContext();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._texture);
  }

  bind(inCallback: (bound: IBoundCubeMap) => void): void {
    this.rawBind();

    inCallback(this);

    CubeMap.unbind();
  }

  static unbind(): void {
    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }

  loadFromMemory(inType: CubeMapType, inPixels: Uint8Array): void {
    if (!this._texture) throw new Error('cube map: not initialized');
    if (inPixels.length < this._minBufferSize)
      throw new Error(
        `cube map: miss-matching pixels buffer size, input: ${inPixels.length}`
      );

    const gl = WebGLContext.getContext();

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    gl.texImage2D(
      getCubeMapType(inType),
      level,
      internalFormat,
      this._width,
      this._height,
      border,
      srcFormat,
      srcType,
      inPixels
    );
  }

  allocate(): void {
    const gl = WebGLContext.getContext();

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    const pixels = new Uint8Array(this._width * this._height * 4);

    [
      CubeMapType.negativeX,
      CubeMapType.negativeY,
      CubeMapType.negativeZ,
      CubeMapType.positiveX,
      CubeMapType.positiveY,
      CubeMapType.positiveZ
    ].forEach((type) => {
      gl.texImage2D(
        getCubeMapType(type),
        level,
        internalFormat,
        this._width,
        this._height,
        border,
        srcFormat,
        srcType,
        pixels
      );
    });
  }

  complete() {
    const gl = WebGLContext.getContext();

    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    gl.texParameteri(
      gl.TEXTURE_CUBE_MAP,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    );
  }

  getWidth(): number {
    if (!this._texture) throw new Error('cube map: not initialized');

    return this._width;
  }

  getHeight(): number {
    if (!this._texture) throw new Error('cube map: not initialized');

    return this._height;
  }

  getRawObject() {
    if (!this._texture) throw new Error('texture not initialized');

    // TODO: this is ugly
    return this._texture;
  }
}
