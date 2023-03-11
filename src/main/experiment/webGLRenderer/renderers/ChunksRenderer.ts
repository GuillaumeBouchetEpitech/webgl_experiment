import { chunksRenderer } from './shaders';
import {
  WebGLContext,
  GeometryWrapper,
  ShaderProgram,
  Texture
} from '../wrappers';

import * as glm from 'gl-matrix';

export interface IChunksRenderer {
  buildGeometry(buffer: Float32Array): GeometryWrapper.Geometry;
}

export class ChunksRenderer implements IChunksRenderer {
  private _shader: ShaderProgram;
  private _texture = new Texture();
  private _geometryDefinition: GeometryWrapper.GeometryDefinition;

  constructor() {
    this._shader = new ShaderProgram({
      vertexSrc: chunksRenderer.vertex,
      fragmentSrc: chunksRenderer.fragment,
      attributes: [
        'a_vertex_position',
        'a_vertex_color',
        'a_vertex_normal',
        'a_vertex_baryCenter'
      ],
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
              name: 'a_vertex_color',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 3
            },
            {
              name: 'a_vertex_normal',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 6
            },
            {
              name: 'a_vertex_baryCenter',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 9
            }
          ],
          stride: 12 * 4,
          instanced: false
        }
      ],
      primitiveType: GeometryWrapper.PrimitiveType.triangles
    };
  }

  async initialize() {
    await this._texture.load('assets/texture.png');
  }

  buildGeometry(buffer: Float32Array): GeometryWrapper.Geometry {
    const geom = new GeometryWrapper.Geometry(
      this._shader,
      this._geometryDefinition
    );
    geom.updateBuffer(0, buffer);
    geom.setPrimitiveCount(buffer.length / 12);
    return geom;
  }

  render(
    viewMatrix: glm.mat4,
    projectionMatrix: glm.mat4,
    eyePosition: glm.ReadonlyVec3,
    geometries: GeometryWrapper.Geometry[]
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

    geometries.forEach((geometry) => {
      geometry.render();
    });
  }
}
