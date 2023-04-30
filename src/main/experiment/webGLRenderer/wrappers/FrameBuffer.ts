import { WebGLContext } from './WebGLContext';

export enum ColorTextureType {
  RBGA_UBYTES,
  RBGA_FLOAT
}

export enum DepthTextureType {
  FLOAT
}

interface ColorTexture {
  index: number;
  type: ColorTextureType;
}

export interface IFrameBufferDef {
  width: number;
  height: number;
  colorTextures: ColorTexture[];
  depthTexture: DepthTextureType;
}

export class FrameBuffer {
  private _def: IFrameBufferDef;
  private _fbo: WebGLFramebuffer;
  private _depthTex: WebGLTexture;
  private _colorsTex: WebGLTexture[] = [];

  constructor(inDef: IFrameBufferDef) {

    this._def = { ...inDef };

    const gl = WebGLContext.getContext();

    const tmpFbo = gl.createFramebuffer();
    if (tmpFbo === null) throw new Error('null frame buffer object');
    this._fbo = tmpFbo;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);

    {
      const tmpTex = gl.createTexture();
      if (tmpTex === null) throw new Error('null texture object');
      this._depthTex = tmpTex;

      const level = 0;
      const border = 0;
      const format = gl.DEPTH_COMPONENT;
      const internalFormat = gl.DEPTH_COMPONENT32F;
      const type = gl.FLOAT;
      // const internalFormat = gl.DEPTH_COMPONENT;
      // const type = gl.UNSIGNED_SHORT;

      gl.bindTexture(gl.TEXTURE_2D, this._depthTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        this._def.width,
        this._def.height,
        border,
        format,
        type,
        null
      );

      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.DEPTH_ATTACHMENT,
        gl.TEXTURE_2D,
        this._depthTex,
        0
      );
    }

    {
      this._def.colorTextures.forEach((inTex) => {
        const tmpTex = gl.createTexture();
        if (tmpTex === null) throw new Error('null texture object');
        this._colorsTex.push(tmpTex);

        const level = 0;
        const border = 0;
        const format = gl.RGBA;

        let internalFormat = gl.RGBA32F;
        let type = gl.FLOAT;

        if (inTex.type === ColorTextureType.RBGA_UBYTES) {
          internalFormat = gl.RGBA;
          type = gl.UNSIGNED_BYTE;
        }

        gl.bindTexture(gl.TEXTURE_2D, tmpTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          this._def.width,
          this._def.height,
          border,
          format,
          type,
          null
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0 + inTex.index,
          gl.TEXTURE_2D,
          tmpTex,
          0
        );
      });
    }

    {
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

      // if (status == gl.FRAMEBUFFER_UNDEFINED) {
      //   throw new Error("Framebuffer incomplete -> gl.FRAMEBUFFER_UNDEFINED");
      // }
      if (status == gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {
        throw new Error(
          'Framebuffer incomplete -> gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT'
        );
      }
      if (status == gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
        throw new Error(
          'Framebuffer incomplete -> gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT'
        );
      }
      if (status == gl.FRAMEBUFFER_UNSUPPORTED) {
        throw new Error('Framebuffer incomplete -> gl.FRAMEBUFFER_UNSUPPORTED');
      }
      if (status == gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE) {
        throw new Error(
          'Framebuffer incomplete -> gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE'
        );
      }
      if (status != gl.FRAMEBUFFER_COMPLETE) {
        throw new Error('Framebuffer incomplete -> ???');
      }
    }

    const allAttachments = inDef.colorTextures.map(
      (tex) => gl.COLOR_ATTACHMENT0 + tex.index
    );
    gl.drawBuffers(allAttachments);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(inWidth: number, inHeight: number) {

    this._def.width = inWidth;
    this._def.height = inHeight;

    const gl = WebGLContext.getContext();

    {

      const level = 0;
      const border = 0;
      const format = gl.DEPTH_COMPONENT;
      const internalFormat = gl.DEPTH_COMPONENT32F;
      const type = gl.FLOAT;

      gl.bindTexture(gl.TEXTURE_2D, this._depthTex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        this._def.width,
        this._def.height,
        border,
        format,
        type,
        null
      );

    }

    {

      const level = 0;
      const border = 0;
      const format = gl.RGBA;

      this._colorsTex.forEach((texObj, index) => {

        let internalFormat = gl.RGBA32F;
        let type = gl.FLOAT;

        if (this._def.colorTextures[index].type === ColorTextureType.RBGA_UBYTES) {
          internalFormat = gl.RGBA;
          type = gl.UNSIGNED_BYTE;
        }

        gl.bindTexture(gl.TEXTURE_2D, texObj);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          this._def.width,
          this._def.height,
          border,
          format,
          type,
          null
        );

      });


    }
  }

  bind() {
    const gl = WebGLContext.getContext();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo);
  }

  static unbind() {
    const gl = WebGLContext.getContext();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  get depthTexture(): Readonly<WebGLTexture> {
    return this._depthTex;
  }

  get colorsTextures(): ReadonlyArray<WebGLTexture> {
    return this._colorsTex;
  }

  get width() {
    return this._def.width;
  }
  get height() {
    return this._def.height;
  }
}
