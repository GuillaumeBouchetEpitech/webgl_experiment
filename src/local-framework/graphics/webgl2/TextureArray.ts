import { TextureFilter, TextureRepeat } from './Texture';
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
  loadFromImage(
    inWidth: number,
    inHeight: number,
    inTotalLayers: number,
    inImage: HTMLImageElement
  ): void;
  loadFromMemory(
    inWidth: number,
    inHeight: number,
    inTotalLayers: number,
    inPixels: Uint8Array
  ): void;

  setRepeat(repeat: TextureRepeat): void;
  setFilter(mode: TextureFilter): void;

  getRawObject(): WebGLTexture;
}

export class TextureArray implements IUnboundTextureArray, IBoundTextureArray {
  private _width: number = 0;
  private _height: number = 0;
  private _texture: WebGLTexture | null = null;

  initialize(): void {
    if (this._texture) {
      throw new Error('texture: already initialized');
    }

    const gl = WebGLContext.getContext();
    this._texture = gl.createTexture();
  }

  dispose() {
    const gl = WebGLContext.getContext();
    gl.deleteTexture(this._texture);
  }

  rawBind(): void {
    if (!this._texture) {
      throw new Error('texture: not initialized');
    }
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

  loadFromImage(
    inWidth: number,
    inHeight: number,
    inTotalLayers: number,
    inImage: HTMLImageElement
  ): void {
    if (!this._texture) {
      throw new Error('texture: not initialized');
    }

    this._allocate(inWidth, inHeight, inTotalLayers, inImage);

    this.setRepeat(TextureRepeat.noRepeat);
    this.setFilter(TextureFilter.pixelated);
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
    inPixels: Uint8Array | HTMLImageElement | null = null
  ): void {
    if (!this._texture) {
      throw new Error('texture: not initialized');
    }

    const gl = WebGLContext.getContext();

    this._width = inWidth;
    this._height = inHeight;

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    if (inPixels !== null) {
      if (inPixels instanceof Uint8Array) {
        gl.texImage3D(gl.TEXTURE_2D_ARRAY, level, internalFormat, inWidth, inHeight, inTotalLayers, border, srcFormat, srcType, inPixels);
      } else {
        gl.texImage3D(gl.TEXTURE_2D_ARRAY, level, internalFormat, inWidth, inHeight, inTotalLayers, border, srcFormat, srcType, inPixels);
      }
    }

    this.setRepeat(TextureRepeat.noRepeat);
    this.setFilter(TextureFilter.pixelated);
  }

  setRepeat(repeat: TextureRepeat): void {
    const gl = WebGLContext.getContext();

    if (repeat === TextureRepeat.noRepeat) {
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else if (repeat === TextureRepeat.repeat) {
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
  }

  setFilter(mode: TextureFilter): void {
    const gl = WebGLContext.getContext();

    if (mode === TextureFilter.pixelated) {
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    } else if (mode === TextureFilter.linear) {
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } else if (mode === TextureFilter.mipmap) {
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
  }

  getWidth(): number {
    if (!this._texture) {
      throw new Error('texture not initialized');
    }

    return this._width;
  }

  getHeight(): number {
    if (!this._texture) {
      throw new Error('texture not initialized');
    }

    return this._height;
  }

  getRawObject() {
    if (!this._texture) {
      throw new Error('texture not initialized');
    }

    // TODO: this is ugly
    return this._texture;
  }
}
