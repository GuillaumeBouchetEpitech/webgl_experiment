import * as shaders from './shaders';
import {
  WebGLContext,
  GeometryWrapper,
  ShaderProgram,
  Texture
} from '../../../wrappers';

import * as glm from 'gl-matrix';

export interface ILiveGeometry {
  update(inBuffer: Float32Array, inSize: number): void;
  setVisibility(isVisible: boolean): void;
}

class LiveGeometry implements ILiveGeometry {
  private _geometry: GeometryWrapper.Geometry;
  private _isVisible: boolean = false;

  constructor(
    inShader: ShaderProgram,
    inGeometryDefinition: GeometryWrapper.GeometryDefinition,
    preAllocatedSize: number
  ) {
    this._geometry = new GeometryWrapper.Geometry(
      inShader,
      inGeometryDefinition
    );
    this._geometry.setFloatBufferSize(0, preAllocatedSize);
  }

  update(inBuffer: Float32Array, inSize: number): void {
    this._geometry.updateBuffer(0, inBuffer, inSize);
    this._geometry.setPrimitiveCount(inSize / 6);
  }

  // dispose(): void {
  //   this._geometry.dispose();
  // }

  render() {
    if (!this._isVisible) {
      return;
    }

    this._geometry.render();
  }

  setVisibility(isVisible: boolean): void {
    this._isVisible = isVisible;
  }
}

export interface IChunksRenderer {
  acquireGeometry(size: number): ILiveGeometry;
  releaseGeometry(geom: ILiveGeometry): void;
}

export class ChunksRenderer implements IChunksRenderer {
  private _shader: ShaderProgram;
  private _texture = new Texture();
  private _geometryDefinition: GeometryWrapper.GeometryDefinition;

  private _unusedGeometries: LiveGeometry[] = [];
  private _inUseGeometries: LiveGeometry[] = [];

  constructor() {
    this._shader = new ShaderProgram({
      vertexSrc: shaders.chunksRenderer.vertex,
      fragmentSrc: shaders.chunksRenderer.fragment,
      attributes: ['a_vertex_position', 'a_vertex_normal'],
      uniforms: ['u_viewMatrix', 'u_projMatrix', 'u_eyePosition', 'u_texture']
    });

    this._geometryDefinition = {
      vbos: [
        {
          attrs: [
            {
              name: 'a_vertex_position',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 0
            },
            {
              name: 'a_vertex_normal',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 3
            }
          ],
          stride: 6 * 4,
          instanced: false
        }
      ],
      primitiveType: GeometryWrapper.PrimitiveType.triangles
    };
  }

  async initialize() {
    await this._texture.load('assets/texture.png');
  }

  acquireGeometry(inSize: number): ILiveGeometry {
    if (this._unusedGeometries.length > 0) {
      const reusedGeom = this._unusedGeometries.pop()!;
      this._inUseGeometries.push(reusedGeom);
      return reusedGeom;
    }

    const newGeom = new LiveGeometry(
      this._shader,
      this._geometryDefinition,
      inSize
    );
    this._inUseGeometries.push(newGeom);
    return newGeom;
  }

  releaseGeometry(geom: ILiveGeometry): void {
    const index = this._inUseGeometries.indexOf(geom as LiveGeometry);
    if (index < 0) return;

    this._unusedGeometries.push(geom as LiveGeometry);
    this._inUseGeometries.splice(index, 1);
  }

  render(
    viewMatrix: glm.mat4,
    projectionMatrix: glm.mat4,
    eyePosition: glm.ReadonlyVec3
  ) {
    const gl = WebGLContext.getContext();
    gl.disable(gl.BLEND);

    this._shader.bind();
    this._shader.setInteger1Uniform('u_texture', 0);
    this._shader.setMatrix4Uniform('u_viewMatrix', viewMatrix);
    this._shader.setMatrix4Uniform('u_projMatrix', projectionMatrix);
    this._shader.setFloat3Uniform(
      'u_eyePosition',
      eyePosition[0],
      eyePosition[1],
      eyePosition[2]
    );

    this._texture.bind();

    this._inUseGeometries.forEach((geometry) => geometry.render());
  }
}
