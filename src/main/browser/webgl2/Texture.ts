import { WebGLContext } from './WebGLContext';

export class Texture {
  private _width: number = 0;
  private _height: number = 0;
  private _texture: WebGLTexture | null = null;

  constructor() {}

  async load(url: string, pixelated: boolean = false): Promise<void> {
    const gl = WebGLContext.getContext();

    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );

    gl.bindTexture(gl.TEXTURE_2D, null);

    return new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        this._width = image.width;
        this._height = image.height;

        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          image
        );

        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        const filter = pixelated ? gl.NEAREST : gl.LINEAR;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

        gl.bindTexture(gl.TEXTURE_2D, null);

        resolve();
      };
      image.src = url;
    });
  }

  loadFromMemory(
    inWidth: number,
    inHeight: number,
    inPixels: Uint8Array,
    inPixelated: boolean = false
  ): void {
    const gl = WebGLContext.getContext();

    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);

    // wrapping to clamp to edge
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const filter = inPixelated ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

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

    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  getWidth(): number {
    if (!this._texture) throw new Error('texture not initialized');

    return this._width;
  }

  getHeight(): number {
    if (!this._texture) throw new Error('texture not initialized');

    return this._height;
  }

  bind(): void {
    if (!this._texture) throw new Error('texture not initialized');

    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, this._texture);
  }

  static unbind(): void {
    const gl = WebGLContext.getContext();

    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}
