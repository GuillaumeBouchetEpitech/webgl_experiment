import * as chunksRenderer from './shaders/chunksRenderer';
import {
  WebGLContext,
  GeometryWrapper,
  ShaderProgram,
  Texture
} from '../../../wrappers';

import * as glm from 'gl-matrix';

export interface IChunksRenderer {
  buildGeometry(size: number): GeometryWrapper.Geometry;
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
        'a_vertex_normal',
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
              name: 'a_vertex_normal',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 3
            },
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

  buildGeometry(inSize: number): GeometryWrapper.Geometry {
    const geom = new GeometryWrapper.Geometry(
      this._shader,
      this._geometryDefinition
    );
    geom.setFloatBufferSize(0, inSize, false)
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
