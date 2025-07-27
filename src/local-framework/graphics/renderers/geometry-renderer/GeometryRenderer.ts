import * as webgl2 from '../../../graphics/webgl2';
import { ICamera } from '../../../graphics/camera';

// @ts-ignore
import stackRendererVertex from './shaders/geometry-renderer.glsl.vert';
// @ts-ignore
import stackRendererFragment from './shaders/geometry-renderer.glsl.frag';

import * as glm from 'gl-matrix';

const k_bufferSize = 14 * 1024;

export interface IVertex {
  pos: glm.vec3;
  normal: glm.vec3;
}

export interface IGeometryRenderer {
  push(
    inPointA: glm.ReadonlyVec3,
    inQuat: glm.ReadonlyQuat,
    inColor: glm.ReadonlyVec3,
    inScale: glm.ReadonlyVec3
  ): void;
  flush(inCamera: ICamera): void;
  clear(): void;
}

export class GeometryRenderer implements IGeometryRenderer {
  private _shader: webgl2.IUnboundShader;
  private _geometry: webgl2.GeometryWrapper.Geometry;

  private _buffer = new Float32Array(k_bufferSize);
  private _currentSize: number = 0;

  constructor() {
    this._shader = new webgl2.ShaderProgram('GeometryRenderer', {
      vertexSrc: stackRendererVertex,
      fragmentSrc: stackRendererFragment,
      attributes: [
        'a_vertex_position',
        'a_vertex_normal',
        'a_offset_center',
        'a_offset_orientation',
        'a_offset_color',
        'a_offset_scale'
      ],
      uniforms: ['u_composedMatrix', 'u_lightPos']
    });

    const geoBuilder = new webgl2.GeometryWrapper.GeometryBuilder();
    geoBuilder
      .reset()
      .setPrimitiveType('triangles')
      .addVbo()
      .addVboAttribute('a_vertex_position', 'vec3f')
      .addVboAttribute('a_vertex_normal', 'vec3f')
      // .setStride(3 * 4 * 6)
      .addVbo()
      .setVboAsStreaming()
      .setVboAsInstanced()
      .addVboAttribute('a_offset_center', 'vec3f')
      .addVboAttribute('a_offset_orientation', 'vec4f')
      .addVboAttribute('a_offset_color', 'vec3f')
      .addVboAttribute('a_offset_scale', 'vec3f');

    this._geometry = new webgl2.GeometryWrapper.Geometry(
      this._shader,
      geoBuilder.getDef()
    );
    this._geometry.setFloatBufferSize(1, k_bufferSize);
  }

  setGeometryVertices(vertices: IVertex[]) {
    const buf = new Float32Array([
      ...vertices.map((val) => [...val.pos, ...val.normal]).flat()
    ]);
    // const buf = new Float32Array([...vertices.map(val => [...val.pos]).flat()]);
    this._geometry.allocateBuffer(0, buf, buf.length);
    this._geometry.setPrimitiveCount(buf.length / 6);
  }

  push(
    inPointA: glm.ReadonlyVec3,
    inQuat: glm.ReadonlyQuat,
    inColor: glm.ReadonlyVec3,
    inScale: glm.ReadonlyVec3
  ) {
    if (this._currentSize + 13 >= this._buffer.length) {
      if (this._shader.isBound()) {
        this._flush();
      } else {
        return;
      }
    }

    this._buffer[this._currentSize++] = inPointA[0];
    this._buffer[this._currentSize++] = inPointA[1];
    this._buffer[this._currentSize++] = inPointA[2];
    this._buffer[this._currentSize++] = inQuat[0];
    this._buffer[this._currentSize++] = inQuat[1];
    this._buffer[this._currentSize++] = inQuat[2];
    this._buffer[this._currentSize++] = inQuat[3];
    this._buffer[this._currentSize++] = inColor[0];
    this._buffer[this._currentSize++] = inColor[1];
    this._buffer[this._currentSize++] = inColor[2];
    this._buffer[this._currentSize++] = inScale[0];
    this._buffer[this._currentSize++] = inScale[1];
    this._buffer[this._currentSize++] = inScale[2];
    // this._currentSize += 6;
  }

  flush(inCamera: ICamera) {
    if (!this.canRender()) {
      return;
    }

    this._shader.bind((bound) => {
      bound.setMatrix4Uniform('u_composedMatrix', inCamera.getComposedMatrix());
      const eyePos = inCamera.getEye();
      bound.setFloat3Uniform('u_lightPos', eyePos[0], eyePos[1], eyePos[2]);

      this._flush();
    });
  }

  safeRender(inCamera: ICamera, inCallback: () => void) {
    this._shader.bind((bound) => {
      bound.setMatrix4Uniform('u_composedMatrix', inCamera.getComposedMatrix());
      const eyePos = inCamera.getEye();
      bound.setFloat3Uniform('u_lightPos', eyePos[0], eyePos[1], eyePos[2]);

      inCallback();

      this._flush();
    });
  }

  private _flush() {
    this._geometry.updateBuffer(1, this._buffer, this._currentSize, 0);
    this._geometry.setInstancedCount(this._currentSize / 13);

    this._geometry.render();

    this.clear();
  }

  canRender() {
    return this._currentSize > 0;
  }

  clear(): void {
    this._currentSize = 0;
  }
}
