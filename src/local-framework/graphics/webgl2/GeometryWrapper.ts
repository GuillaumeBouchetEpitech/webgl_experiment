import { WebGLContext } from './WebGLContext';
import { IUnboundShader, ShaderProgram } from './ShaderProgram';

export const BytesPerPixel = 4; // float (float32 = 4 bytes)

export enum AttributeType {
  float,
  vec2f,
  vec3f,
  vec4f,
  mat3f,
  mat4f
}

const getAttrTypeSize = (inType: AttributeType) => {
  switch (inType) {
    case AttributeType.float:
      return 1;
    case AttributeType.vec2f:
      return 2;
    case AttributeType.vec3f:
      return 3;
    case AttributeType.vec4f:
      return 4;
    case AttributeType.mat3f:
      return 9;
    case AttributeType.mat4f:
      return 16;
  }
};

export enum PrimitiveType {
  lines,
  triangles,
  triangleStrip
}

export interface VboAttr {
  name: string;
  type: AttributeType;
  index: number;
}

export interface VboDefinition {
  attrs: VboAttr[];
  stride?: number;
  instanced: boolean;
  dynamic?: boolean;
}

export interface GeometryDefinition {
  vbos: VboDefinition[];
  primitiveType: PrimitiveType;
}

export class Geometry {
  private _def: GeometryDefinition;
  private _vao: WebGLVertexArrayObjectOES;
  private _vbos: { object: WebGLBuffer; maxSize: number; dynamic: boolean }[];
  private _primitiveType: number;
  private _primitiveStart: number = 0;
  private _primitiveCount: number = 0;
  private _instanceCount: number = 0;
  private _isInstanced: boolean = false;

  constructor(shader: IUnboundShader, def: GeometryDefinition) {
    const gl = WebGLContext.getContext();

    if (def.vbos.length === 0) {
      throw new Error('empty vbo definition');
    }

    for (const vbo of def.vbos) {
      if (vbo.attrs.length === 0) {
        throw new Error('empty vbo attribute definition');
      }

      for (const attr of vbo.attrs) {
        if (!shader.hasAttribute(attr.name)) {
          throw new Error(`attribute not found, name="${attr.name}"`);
        }
      }
    }

    this._def = def;

    switch (def.primitiveType) {
      case PrimitiveType.lines:
        this._primitiveType = gl.LINES;
        break;
      case PrimitiveType.triangles:
        this._primitiveType = gl.TRIANGLES;
        break;
      case PrimitiveType.triangleStrip:
        this._primitiveType = gl.TRIANGLE_STRIP;
        break;
      default:
        throw new Error('primitive type not found');
    }

    const newVao = gl.createVertexArray();
    if (!newVao) {
      throw new Error('fail o create a vao unit');
    }

    this._vao = newVao;
    gl.bindVertexArray(this._vao);

    //

    this._vbos = [];
    for (const vboDef of this._def.vbos) {
      const newVbo = gl.createBuffer();
      if (!newVbo) {
        throw new Error('fail o create a vbo unit');
      }

      this._vbos.push({
        object: newVbo,
        maxSize: 0,
        dynamic: vboDef.dynamic || false
      });

      gl.bindBuffer(gl.ARRAY_BUFFER, newVbo);

      let stride = vboDef.stride || 0;
      if (!stride) {
        // auto determine stride value
        for (const attr of vboDef.attrs) {
          switch (attr.type) {
            case AttributeType.float:
              stride += 1;
              break;
            case AttributeType.vec2f:
              stride += 2;
              break;
            case AttributeType.vec3f:
              stride += 3;
              break;
            case AttributeType.vec4f:
              stride += 4;
              break;
            case AttributeType.mat3f:
              stride += 9;
              break;
            case AttributeType.mat4f:
              stride += 16;
              break;
          }
        }
        stride *= BytesPerPixel;
      }

      for (const attr of vboDef.attrs) {
        let rowSize = 1;
        let totalRows = 1;
        switch (attr.type) {
          case AttributeType.float:
            rowSize = 1;
            totalRows = 1;
            break;
          case AttributeType.vec2f:
            rowSize = 2;
            totalRows = 1;
            break;
          case AttributeType.vec3f:
            rowSize = 3;
            totalRows = 1;
            break;
          case AttributeType.vec4f:
            rowSize = 4;
            totalRows = 1;
            break;
          case AttributeType.mat3f:
            rowSize = 3;
            totalRows = 3;
            break;
          case AttributeType.mat4f:
            rowSize = 4;
            totalRows = 4;
            break;
        }

        const attrLocation = shader.getAttribute(attr.name);

        // TODO: check if the index is 0 on k>0 and assert/throw on it

        for (let ii = 0; ii < totalRows; ++ii) {
          const attrId = attrLocation + ii;
          const rowIndex = (attr.index + ii * rowSize) * BytesPerPixel;

          gl.enableVertexAttribArray(attrId);
          gl.vertexAttribPointer(
            attrId,
            rowSize,
            gl.FLOAT,
            false,
            stride,
            rowIndex
          );

          if (vboDef.instanced === true) {
            gl.vertexAttribDivisor(attrId, 1);
            this._isInstanced = true;
          }
        }
      }
    }

    //

    gl.bindVertexArray(null);
  }

  dispose() {
    const gl = WebGLContext.getContext();

    for (const vbo of this._vbos) gl.deleteBuffer(vbo.object);
    this._vbos.length = 0;

    gl.deleteVertexArray(this._vao);
  }

  setBufferSize(index: number, inSize: number) {
    if (index < 0 || index >= this._vbos.length) {
      throw new Error('no buffer available to that index');
    }

    if (inSize <= 0) {
      return;
    }

    const currVbo = this._vbos[index];

    if (inSize < currVbo.maxSize) {
      return;
    }

    currVbo.maxSize = inSize;

    const gl = WebGLContext.getContext();

    const usage = currVbo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;

    gl.bindBuffer(gl.ARRAY_BUFFER, currVbo.object);
    gl.bufferData(gl.ARRAY_BUFFER, inSize, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  setFloatBufferSize(index: number, inSize: number) {
    this.setBufferSize(index, inSize * 4);
  }

  updateBuffer(
    index: number,
    vertices: ReadonlyArray<number> | Readonly<Float32Array>,
    inSize: number
  ) {
    if (index < 0 || index >= this._vbos.length) {
      throw new Error('no buffer available to that index');
    }

    if (inSize <= 0) {
      return;
    }

    const gl = WebGLContext.getContext();

    const buffer =
      vertices instanceof Float32Array ? vertices : new Float32Array(vertices);

    const currVbo = this._vbos[index];

    gl.bindBuffer(gl.ARRAY_BUFFER, currVbo.object);

    if (inSize > currVbo.maxSize) {
      currVbo.maxSize = inSize;
      const usage = currVbo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
      gl.bufferData(gl.ARRAY_BUFFER, buffer, usage, 0, inSize);
    } else {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, buffer, 0, inSize);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  render() {
    if (this._primitiveCount == 0) {
      return;
    }

    if (this._isInstanced && this._instanceCount == 0) {
      return;
    }

    const gl = WebGLContext.getContext();

    gl.bindVertexArray(this._vao);

    if (this._isInstanced === true) {
      gl.drawArraysInstanced(
        this._primitiveType,
        this._primitiveStart,
        this._primitiveCount,
        this._instanceCount
      );
    } else {
      gl.drawArrays(
        this._primitiveType,
        this._primitiveStart,
        this._primitiveCount
      );
    }

    gl.bindVertexArray(null);
  }

  setPrimitiveStart(start: number) {
    this._primitiveStart = start;
  }

  setPrimitiveCount(count: number) {
    this._primitiveCount = count;
  }

  setInstancedCount(count: number) {
    this._instanceCount = count;
  }
}

export class GeometryBuilder {
  private _def: GeometryDefinition = {
    vbos: [],
    primitiveType: PrimitiveType.lines
  };

  reset(): this {
    this._def = {
      vbos: [],
      primitiveType: PrimitiveType.lines
    };
    return this;
  }

  getDef(): GeometryDefinition {
    return this._def;
  }

  setPrimitiveType(inPrimitive: 'lines' | 'triangles' | 'triangleStrip'): this {
    this._def.primitiveType = PrimitiveType[inPrimitive];
    return this;
  }
  addVbo(): this {
    this._def.vbos.push({
      attrs: [],
      // stride: 0,
      instanced: false
      // dynamic: false,
    });
    return this;
  }
  setVboAsInstanced(): this {
    this._getLastVbo().instanced = true;
    return this;
  }
  setVboAsDynamic(): this {
    this._getLastVbo().dynamic = true;
    return this;
  }
  setStride(inStride: number): this {
    this._getLastVbo().stride = inStride;
    return this;
  }
  addVboAttribute(
    inName: string,
    inType: 'float' | 'vec2f' | 'vec3f' | 'vec4f' | 'mat3f' | 'mat4f'
  ): this {
    const currVbo = this._getLastVbo();
    const lastAttr =
      currVbo.attrs.length > 0 ? currVbo.attrs[currVbo.attrs.length - 1] : null;
    currVbo.attrs.push({
      name: inName,
      type: AttributeType[inType],
      index: lastAttr ? lastAttr.index + getAttrTypeSize(lastAttr.type) : 0
    });
    return this;
  }

  private _getLastVbo(): VboDefinition {
    if (this._def.vbos.length === 0) {
      throw new Error('no VBO setup');
    }
    return this._def.vbos[this._def.vbos.length - 1];
  }
}
