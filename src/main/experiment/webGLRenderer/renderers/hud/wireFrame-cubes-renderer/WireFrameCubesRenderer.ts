import { graphics } from '@local-framework';

// @ts-ignore
import wireFrameCubesRendererVertex from './shaders/wireFrame-cubes-renderer.glsl.vert';
// @ts-ignore
import wireFrameCubesRendererFragment from './shaders/wireFrame-cubes-renderer.glsl.frag';

import * as glm from 'gl-matrix';

const { ShaderProgram, GeometryWrapper } = graphics.webgl2;

type IUnboundShader = graphics.webgl2.IUnboundShader
type Geometry = graphics.webgl2.GeometryWrapper.Geometry

const generateWireFrameCubeVertices = (inSize: number): number[] => {
  const hSize = inSize * 0.5;

  const vertices: glm.ReadonlyVec3[] = [];

  vertices.push([+hSize, +hSize, +hSize]);
  vertices.push([-hSize, +hSize, +hSize]);
  vertices.push([+hSize, -hSize, +hSize]);
  vertices.push([-hSize, -hSize, +hSize]);

  vertices.push([+hSize, +hSize, -hSize]);
  vertices.push([-hSize, +hSize, -hSize]);
  vertices.push([+hSize, -hSize, -hSize]);
  vertices.push([-hSize, -hSize, -hSize]);

  //

  const indices: number[] = [];

  indices.push(0, 1, 1, 3, 3, 2, 2, 0);
  indices.push(4, 5, 5, 7, 7, 6, 6, 4);
  indices.push(0, 4, 1, 5, 3, 7, 2, 6);

  //

  const finalVertices: number[] = [];

  for (let ii = 0; ii < indices.length; ++ii) {
    const vertex = vertices[indices[ii]];
    finalVertices.push(vertex[0], vertex[1], vertex[2]);
  }

  return finalVertices;
};

//
//
//

export interface IWireFrameCubesRenderer {
  pushCenteredCube(
    inCenter: glm.ReadonlyVec3,
    inScale: number,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ): void;
  pushOriginBoundCube(
    inOrigin: glm.ReadonlyVec3,
    inScale: number,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ): void;
  flush(composedMatrix: glm.ReadonlyMat4): void;
  clear(): void;
}

const k_bufferSize = 8 * 1024 * 4;

export class WireFrameCubesRenderer implements IWireFrameCubesRenderer {
  private _shader: IUnboundShader;
  private _geometry: Geometry;

  private _buffer = new Float32Array(k_bufferSize);
  private _currentSize: number = 0;

  constructor() {
    this._shader = new ShaderProgram('WireFrameCubesRenderer', {
      vertexSrc: wireFrameCubesRendererVertex,
      fragmentSrc: wireFrameCubesRendererFragment,
      attributes: [
        'a_vertex_position',
        'a_offset_center',
        'a_offset_scale',
        'a_offset_color'
      ],
      uniforms: ['u_composedMatrix']
    });

    const geoBuilder = new GeometryWrapper.GeometryBuilder();
    geoBuilder
      .reset()
      .setPrimitiveType('lines')
      .addVbo()
      .addVboAttribute('a_vertex_position', 'vec3f')
      .setStride(3 * 4)
      .addVbo()
      .setVboAsDynamic()
      .setVboAsInstanced()
      .addVboAttribute('a_offset_center', 'vec3f')
      .addVboAttribute('a_offset_scale', 'float')
      .addVboAttribute('a_offset_color', 'vec4f')
      .setStride(8 * 4);

    const vertices = generateWireFrameCubeVertices(1);

    this._geometry = new GeometryWrapper.Geometry(
      this._shader,
      geoBuilder.getDef()
    );
    this._geometry.updateBuffer(0, vertices, vertices.length);
    this._geometry.setPrimitiveCount(vertices.length / 3);
    this._geometry.setFloatBufferSize(1, k_bufferSize);
  }

  pushCenteredCube(
    inCenter: glm.ReadonlyVec3,
    inScale: number,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    if (this._currentSize + 8 >= this._buffer.length) {
      return;
    }

    this._buffer[this._currentSize++] = inCenter[0];
    this._buffer[this._currentSize++] = inCenter[1];
    this._buffer[this._currentSize++] = inCenter[2];
    this._buffer[this._currentSize++] = inScale;
    this._buffer[this._currentSize++] = inColor[0];
    this._buffer[this._currentSize++] = inColor[1];
    this._buffer[this._currentSize++] = inColor[2];
    this._buffer[this._currentSize++] = inColor[3] || 1;
  }

  pushOriginBoundCube(
    inOrigin: glm.ReadonlyVec3,
    inScale: number,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    if (this._currentSize + 8 >= this._buffer.length) {
      return;
    }

    const hScale = inScale * 0.5;

    this._buffer[this._currentSize++] = inOrigin[0] + hScale;
    this._buffer[this._currentSize++] = inOrigin[1] + hScale;
    this._buffer[this._currentSize++] = inOrigin[2] + hScale;
    this._buffer[this._currentSize++] = inScale;
    this._buffer[this._currentSize++] = inColor[0];
    this._buffer[this._currentSize++] = inColor[1];
    this._buffer[this._currentSize++] = inColor[2];
    this._buffer[this._currentSize++] = inColor[3] || 1;
  }

  flush(composedMatrix: glm.ReadonlyMat4): void {
    if (this._currentSize <= 0) {
      return;
    }

    this._shader.bind((boundShader) => {
      boundShader.setMatrix4Uniform('u_composedMatrix', composedMatrix);

      this._geometry.updateBuffer(1, this._buffer, this._currentSize);
      this._geometry.setInstancedCount(this._currentSize / 8);
      this._geometry.render();
    });

    this.clear();
  }

  clear(): void {
    // reset vertices
    this._currentSize = 0;
  }
}
