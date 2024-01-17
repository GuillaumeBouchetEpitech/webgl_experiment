import { IUnboundTextureArray } from './TextureArray';
import { IUnboundCubeMap } from './CubeMap';
import { IUnboundTexture } from './Texture';
import { WebGLContext } from './WebGLContext';

import * as glm from 'gl-matrix';

export interface IShaderProgramOpts {
  vertexSrc: string;
  fragmentSrc: string;
  attributes: string[];
  uniforms: string[];
}

export interface IUnboundShader {
  isBound(): boolean;
  hasAttribute(name: string): boolean;
  getAttribute(name: string): number;
  getUniform(name: string): WebGLUniformLocation;
  bind(inCallback: (bound: IBoundShader) => void): void;
}

export interface IBoundShader {
  setTextureUniform(
    inName: string,
    inTexture: IUnboundTexture | IUnboundTextureArray | IUnboundCubeMap,
    inIndex: number
  ): void;
  setInteger1Uniform(inName: string, inValue: number): void;
  setInteger2Uniform(inName: string, inValueX: number, inValueY: number): void;
  setInteger3Uniform(
    inName: string,
    inValueX: number,
    inValueY: number,
    inValueZ: number
  ): void;
  setFloat1Uniform(inName: string, inValue: number): void;
  setFloat2Uniform(inName: string, inValueX: number, inValueY: number): void;
  setFloat3Uniform(
    inName: string,
    inValueX: number,
    inValueY: number,
    inValueZ: number
  ): void;
  setMatrix4Uniform(inName: string, inMatrix: glm.ReadonlyMat4): void;
}

export class ShaderProgram {
  private static _isBound: ShaderProgram | null = null;

  private _name: string;

  private _program: WebGLProgram;

  private _attributes = new Map<string, number>();
  private _uniforms = new Map<string, WebGLUniformLocation>();

  constructor(inName: string, opt: IShaderProgramOpts) {
    this._name = inName;

    const gl = WebGLContext.getContext();

    const vertexShader = this._getShader(opt.vertexSrc, gl.VERTEX_SHADER);
    const fragmentShader = this._getShader(opt.fragmentSrc, gl.FRAGMENT_SHADER);

    //

    const program = gl.createProgram();
    if (!program) throw new Error('could not create a shader program');

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader); // free up now unused memory
    gl.deleteShader(fragmentShader); // free up now unused memory

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // An error occurred while linking
      const lastError = gl.getProgramInfoLog(program);

      throw new Error(
        'Failed to initialized shaders, Error linking:' + lastError
      );
    }

    this._program = program;

    // this._getAttribAndLocation(opt.attributes, opt.uniforms);

    // this.rawBind();
    this.bind(() => {
      this._getAttributes(opt.attributes);
      this._getUniforms(opt.uniforms);
    });
    // ShaderProgram.unbind();
  }

  // rawBind() {
  //   const gl = WebGLContext.getContext();

  //   gl.useProgram(this._program);
  // }

  bind(inCallback: (bound: IBoundShader) => void) {
    if (ShaderProgram._isBound !== null) {
      throw new Error(
        `Double shader binding (bound: ${ShaderProgram._isBound._name}, binding: ${this._name})`
      );
    }

    ShaderProgram._isBound = this;
    // this.rawBind();
    const gl = WebGLContext.getContext();
    gl.useProgram(this._program);

    inCallback(this);

    ShaderProgram.unbind();
  }

  static unbind() {
    const gl = WebGLContext.getContext();

    gl.useProgram(null);
    ShaderProgram._isBound = null;
  }

  isBound(): boolean {
    return ShaderProgram._isBound === this;
  }

  hasAttribute(name: string) {
    return this._attributes.has(name);
  }

  getAttribute(name: string) {
    const attribute = this._attributes.get(name);
    if (attribute === undefined)
      throw new Error(`attribute not found: ${name}`);

    return attribute;
  }

  getUniform(name: string) {
    const uniform = this._uniforms.get(name);
    if (uniform === undefined) throw new Error(`uniform not found: ${name}`);

    return uniform;
  }

  setTextureUniform(
    inName: string,
    inTexture: IUnboundTexture | IUnboundCubeMap,
    inIndex: number
  ) {
    const gl = WebGLContext.getContext();

    gl.activeTexture(gl.TEXTURE0 + inIndex);
    gl.uniform1i(this.getUniform(inName), inIndex);
    inTexture.rawBind();
  }

  setInteger1Uniform(inName: string, inValue: number) {
    const gl = WebGLContext.getContext();
    gl.uniform1i(this.getUniform(inName), inValue);
  }

  setInteger2Uniform(inName: string, inValueX: number, inValueY: number) {
    const gl = WebGLContext.getContext();
    gl.uniform2i(this.getUniform(inName), inValueX, inValueY);
  }

  setInteger3Uniform(
    inName: string,
    inValueX: number,
    inValueY: number,
    inValueZ: number
  ) {
    const gl = WebGLContext.getContext();
    gl.uniform3i(this.getUniform(inName), inValueX, inValueY, inValueZ);
  }

  setFloat1Uniform(inName: string, inValue: number) {
    const gl = WebGLContext.getContext();
    gl.uniform1f(this.getUniform(inName), inValue);
  }

  setFloat2Uniform(inName: string, inValueX: number, inValueY: number) {
    const gl = WebGLContext.getContext();
    gl.uniform2f(this.getUniform(inName), inValueX, inValueY);
  }

  setFloat3Uniform(
    inName: string,
    inValueX: number,
    inValueY: number,
    inValueZ: number
  ) {
    const gl = WebGLContext.getContext();
    gl.uniform3f(this.getUniform(inName), inValueX, inValueY, inValueZ);
  }

  setMatrix4Uniform(inName: string, inMatrix: glm.ReadonlyMat4) {
    const gl = WebGLContext.getContext();
    gl.uniformMatrix4fv(this.getUniform(inName), false, inMatrix as glm.mat4);
  }

  private _getAttributes(attributes: string[]) {
    const gl = WebGLContext.getContext();

    for (let ii = 0; ii < attributes.length; ++ii) {
      const value = gl.getAttribLocation(this._program, attributes[ii]);

      if (value < 0)
        throw new Error(`attribute not found => ${attributes[ii]}`);

      this._attributes.set(attributes[ii], value);
    }
  }

  private _getUniforms(uniforms: string[]) {
    const gl = WebGLContext.getContext();

    for (let ii = 0; ii < uniforms.length; ++ii) {
      const value = gl.getUniformLocation(this._program, uniforms[ii]);

      if (value === null)
        throw new Error(`uniform not found => ${uniforms[ii]}`);

      this._uniforms.set(uniforms[ii], value);
    }
  }

  //

  private _getShader(src: string, type: number) {
    const gl = WebGLContext.getContext();

    const shader = gl.createShader(type);
    if (!shader) throw new Error('could not create a shader');

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      let error_str = gl.getShaderInfoLog(shader);
      if (!error_str) error_str = 'failed to compile a shader';

      throw new Error(error_str);
    }

    return shader;
  }
}
