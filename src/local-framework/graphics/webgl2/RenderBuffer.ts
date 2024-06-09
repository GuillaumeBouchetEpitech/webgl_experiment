
import { WebGLContext } from './WebGLContext';

export interface IUnboundRenderBuffer {
  dispose(): void;
  rawBind(): void;
  preBind(inCallback: (bound: IBoundRenderBuffer) => void): void
  bind(inCallback: (bound: IBoundRenderBuffer) => void): void;
}

export interface IBoundRenderBuffer {
  setSize(type: 'depth16' | 'depth24' | 'depth32f', width: number, height: number): void;
  getRawObject(): WebGLRenderbuffer;
}

export class RenderBuffer implements IUnboundRenderBuffer, IBoundRenderBuffer {

  private _buffer: WebGLRenderbuffer;

  constructor() {
    const gl = WebGLContext.getContext();

    const tmpBuf = gl.createRenderbuffer();
    if (tmpBuf === null) {
      throw new Error('null render buffer object');
    }
    this._buffer = tmpBuf;
  }

  dispose() {
    const gl = WebGLContext.getContext();
    gl.deleteRenderbuffer(this._buffer);
  }


  rawBind() {
    const gl = WebGLContext.getContext();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this._buffer);
  }

  preBind(inCallback: (bound: IBoundRenderBuffer) => void): void {
    this.rawBind();
    inCallback(this);
  }

  bind(inCallback: (bound: IBoundRenderBuffer) => void): void {
    this.preBind(inCallback);
    RenderBuffer.unbind();
  }

  static unbind() {
    const gl = WebGLContext.getContext();

    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  setSize(type: 'depth16' | 'depth24' | 'depth32f', width: number, height: number): void {
    const gl = WebGLContext.getContext();

    let internalFormat: number = gl.DEPTH_COMPONENT32F;
    switch (type) {
      case 'depth16': {
        internalFormat = gl.DEPTH_COMPONENT16;
        break;
      }
      case 'depth24': {
        internalFormat = gl.DEPTH_COMPONENT16;
        break;
      }
    }

    gl.renderbufferStorage(gl.RENDERBUFFER, internalFormat, width, height);
  }

  getRawObject(): WebGLRenderbuffer {
    return this._buffer;
  }
}

