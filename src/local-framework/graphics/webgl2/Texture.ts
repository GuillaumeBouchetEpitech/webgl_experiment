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

export enum TextureFilter {
  pixelated = 0,
  linear = 1,
  mipmap = 2
}

export enum TextureRepeat {
  noRepeat = 0,
  repeat = 1
}

export interface IBoundTexture {
  loadFromImage(inImage: HTMLImageElement, mode?: TextureFilter, repeat?: TextureRepeat): void;
  loadFromMemory(
    inWidth: number,
    inHeight: number,
    inPixels: Uint8Array,
    mode?: TextureFilter,
    repeat?: TextureRepeat
  ): void;
  allocate(inWidth: number, inHeight: number, mode?: TextureFilter, repeat?: TextureRepeat): void;
  allocateDepth(inWidth: number, inHeight: number, mode?: TextureFilter, repeat?: TextureRepeat): void;
  resize(inWidth: number, inHeight: number, mode?: TextureFilter, repeat?: TextureRepeat): void;
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

  loadFromImage(
    inImage: HTMLImageElement,
    mode: TextureFilter = TextureFilter.pixelated,
    repeat: TextureRepeat = TextureRepeat.noRepeat
  ): void {
    this._allocate(inImage.width, inImage.height, inImage, mode, repeat);
  }

  loadFromMemory(
    inWidth: number,
    inHeight: number,
    inPixels: Uint8Array,
    mode: TextureFilter = TextureFilter.pixelated,
    repeat: TextureRepeat = TextureRepeat.noRepeat
  ): void {
    this._allocate(inWidth, inHeight, inPixels, mode, repeat);
  }

  allocate(
    inWidth: number,
    inHeight: number,
    mode: TextureFilter = TextureFilter.pixelated,
    repeat: TextureRepeat = TextureRepeat.noRepeat
  ): void {
    this._allocate(inWidth, inHeight, null, mode, repeat);
  }

  allocateDepth(
    inWidth: number,
    inHeight: number,
    mode: TextureFilter = TextureFilter.pixelated,
    repeat: TextureRepeat = TextureRepeat.noRepeat
  ): void {
    this._allocate(inWidth, inHeight, null, mode, repeat, true);
  }

  resize(
    inWidth: number,
    inHeight: number,
    mode: TextureFilter = TextureFilter.pixelated,
    repeat: TextureRepeat = TextureRepeat.noRepeat
  ): void {
    this._allocate(inWidth, inHeight, null, mode, repeat);
  }

  private _allocate(
    inWidth: number,
    inHeight: number,
    inPixels: Uint8Array | HTMLImageElement | null = null,
    mode: TextureFilter = TextureFilter.pixelated,
    repeat: TextureRepeat = TextureRepeat.noRepeat,
    isDepthTexture: boolean = false
  ): void {
    if (!this._texture) {
      throw new Error('texture: not initialized');
    }
    if (inWidth <= 0) {
      throw new Error('texture: width must be positive');
    }
    if (inHeight <= 0) {
      throw new Error('texture: height must be positive');
    }

    const gl = WebGLContext.getContext();

    this._width = inWidth;
    this._height = inHeight;

    const level = 0;
    const internalFormat = isDepthTexture ? gl.DEPTH_COMPONENT32F : gl.RGBA;
    const border = 0;
    const srcFormat = isDepthTexture ? gl.DEPTH_COMPONENT : gl.RGBA;
    const srcType = isDepthTexture ? gl.FLOAT : gl.UNSIGNED_BYTE;

    if (inPixels instanceof HTMLImageElement) {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, inPixels);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, inWidth, inHeight, border, srcFormat, srcType, inPixels);
    }

    if (repeat === TextureRepeat.noRepeat) {
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else if (repeat === TextureRepeat.repeat) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }

    if (mode === TextureFilter.pixelated) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    } else if (mode === TextureFilter.linear) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else if (mode === TextureFilter.mipmap) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
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
