import { WebGLContext } from './WebGLContext';
import { IBoundTexture } from './Texture';
import { CubeMapType, IBoundCubeMap, getCubeMapType } from './CubeMap';

export interface IUnboundFrameBuffer {
  rawBind(): void;
  bind(inCallback: (bound: IBoundFrameBuffer) => void): void;
}

export interface IBoundFrameBuffer {
  attachTexture(texture: IBoundTexture): void;
  attachCubeMap(texture: IBoundCubeMap, type: CubeMapType): void;
  getPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    outDst: Uint8Array
  ): void;
}

export class FrameBuffer implements IUnboundFrameBuffer, IBoundFrameBuffer {
  private _frameBuffer: WebGLFramebuffer;

  constructor() {
    const gl = WebGLContext.getContext();

    const tmpFbo = gl.createFramebuffer();
    if (tmpFbo === null) {
      throw new Error('null frame buffer object');
    }
    this._frameBuffer = tmpFbo;
  }

  dispose() {
    const gl = WebGLContext.getContext();
    gl.deleteFramebuffer(this._frameBuffer);
  }

  rawBind() {
    const gl = WebGLContext.getContext();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
  }

  bind(inCallback: (bound: IBoundFrameBuffer) => void): void {
    this.rawBind();

    inCallback(this);

    FrameBuffer.unbind();
  }

  static unbind() {
    const gl = WebGLContext.getContext();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  attachTexture(texture: IBoundTexture) {
    const gl = WebGLContext.getContext();

    // gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);

    // texture.rawBind();

    const mipmapLevel = 0;

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture.getRawObject(),
      mipmapLevel
    );
  }

  attachCubeMap(texture: IBoundCubeMap, type: CubeMapType) {
    const gl = WebGLContext.getContext();

    // gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);

    // texture.rawBind();

    const mipmapLevel = 0;

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      getCubeMapType(type),
      texture.getRawObject(),
      mipmapLevel
    );
  }

  getPixels(
    x: number,
    y: number,
    width: number,
    height: number,
    outDst: Uint8Array
  ): void {
    const gl = WebGLContext.getContext();
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, outDst);
  }
}
