import { WebGLContext } from './WebGLContext';

export interface IUnboundTextureArray {
  initialize(): void;
  rawBind(): void;
  preBind(inCallback: (bound: IBoundTextureArray) => void): void;
  bind(inCallback: (bound: IBoundTextureArray) => void): void;
  getWidth(): number;
  getHeight(): number;
  getRawObject(): WebGLTexture;
}

export interface IBoundTextureArray {
  load(
    inWidth: number,
    inHeight: number,
    inTotalLayers: number,
    inImage: HTMLImageElement
  ): void;
  loadFromMemory(inWidth: number, inHeight: number, inTotalLayers: number, inPixels: Uint8Array): void;
  getRawObject(): WebGLTexture;
}

export class TextureArray implements IUnboundTextureArray, IBoundTextureArray {
  private _width: number = 0;
  private _height: number = 0;
  private _texture: WebGLTexture | null = null;

  initialize(): void {
    if (this._texture) throw new Error('texture: already initialized');

    const gl = WebGLContext.getContext();
    this._texture = gl.createTexture();
  }

  rawBind(): void {
    if (!this._texture) throw new Error('texture: not initialized');
    const gl = WebGLContext.getContext();
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, this._texture);
  }

  preBind(inCallback: (bound: IBoundTextureArray) => void): void {
    this.rawBind();
    inCallback(this);
  }

  bind(inCallback: (bound: IBoundTextureArray) => void): void {
    this.preBind(inCallback);
    TextureArray.unbind();
  }

  static unbind(): void {
    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
  }

  load(
    inWidth: number,
    inHeight: number,
    inTotalLayers: number,
    inImage: HTMLImageElement
  ): void {
    if (!this._texture) throw new Error('texture: not initialized');

    const gl = WebGLContext.getContext();

    this._width = inImage.width;
    this._height = inImage.height;

    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const level = 0;
    const border = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    // texImage3D(target: GLenum, level: GLint, internalformat: GLint, width: GLsizei, height: GLsizei, depth: GLsizei, border: GLint, format: GLenum, type: GLenum, source: TexImageSource): void;

    gl.texImage3D(
      gl.TEXTURE_2D_ARRAY,
      level,
      internalFormat,
      inWidth,
      inHeight,
      inTotalLayers,
      border,
      srcFormat,
      srcType,
      inImage
    );
  }

  loadFromMemory(
    inWidth: number,
    inHeight: number,
    inTotalLayers: number,
    inPixels: Uint8Array
  ): void {
    this._allocate(inWidth, inHeight, inTotalLayers, inPixels);
  }

  private _allocate(
    inWidth: number,
    inHeight: number,
    inTotalLayers: number,
    inPixels: Uint8Array | null = null
  ): void {
    if (!this._texture) throw new Error('texture: not initialized');

    const gl = WebGLContext.getContext();

    this._width = inWidth;
    this._height = inHeight;

    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.texImage3D(
      gl.TEXTURE_2D_ARRAY,
      level,
      internalFormat,
      inWidth,
      inHeight,
      inTotalLayers,
      border,
      srcFormat,
      srcType,
      inPixels
    );
  }

  getWidth(): number {
    if (!this._texture) throw new Error('texture not initialized');

    return this._width;
  }

  getHeight(): number {
    if (!this._texture) throw new Error('texture not initialized');

    return this._height;
  }

  getRawObject() {
    if (!this._texture) throw new Error('texture not initialized');

    // TODO: this is ugly
    return this._texture;
  }

}
