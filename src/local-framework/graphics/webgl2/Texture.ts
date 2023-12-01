import { WebGLContext } from './WebGLContext';

export interface IUnboundTexture {
  initialize(): void;
  rawBind(): void;
  preBind(inCallback: (bound: IBoundTexture) => void): void;
  bind(inCallback: (bound: IBoundTexture) => void): void;
  getWidth(): number;
  getHeight(): number;
  getRawObject(): WebGLTexture;
}

export interface IBoundTexture {
  load(inImage: HTMLImageElement): void;
  loadFromMemory(inWidth: number, inHeight: number, inPixels: Uint8Array): void;
  allocate(inWidth: number, inHeight: number): void;
  resize(inWidth: number, inHeight: number): void;
  getRawObject(): WebGLTexture;
}

export class Texture implements IUnboundTexture, IBoundTexture {
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
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
  }

  preBind(inCallback: (bound: IBoundTexture) => void): void {
    this.rawBind();
    inCallback(this);
  }

  bind(inCallback: (bound: IBoundTexture) => void): void {
    this.preBind(inCallback);
    Texture.unbind();
  }

  static unbind(): void {
    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  load(inImage: HTMLImageElement): void {
    if (!this._texture) throw new Error('texture: not initialized');

    const gl = WebGLContext.getContext();

    this._width = inImage.width;
    this._height = inImage.height;

    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      inImage
    );
  }

  loadFromMemory(
    inWidth: number,
    inHeight: number,
    inPixels: Uint8Array
  ): void {
    this._allocate(inWidth, inHeight, inPixels);
  }

  allocate(inWidth: number, inHeight: number): void {
    this._allocate(inWidth, inHeight);
  }

  resize(inWidth: number, inHeight: number): void {
    this._allocate(inWidth, inHeight);
  }

  private _allocate(
    inWidth: number,
    inHeight: number,
    inPixels: Uint8Array | null = null
  ): void {
    if (!this._texture) throw new Error('texture: not initialized');

    const gl = WebGLContext.getContext();

    this._width = inWidth;
    this._height = inHeight;

    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      inWidth,
      inHeight,
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

  static getImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        resolve(image);
      };
      image.src = url;
    });
  }
}
