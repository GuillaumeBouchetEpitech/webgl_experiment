import { WebGLContext, ShaderProgram, GeometryWrapper } from '../wrappers';

import { wireFrameCubes } from './shaders';

import * as glm from 'gl-matrix';

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

    finalVertices.push(vertex[0]);
    finalVertices.push(vertex[1]);
    finalVertices.push(vertex[2]);
  }

  return finalVertices;
};

//
//
//

export class WireFrameCubesRenderer {
  private _shader: ShaderProgram;
  private _geometry: GeometryWrapper.Geometry;
  private _vertices: number[] = [];

  constructor() {
    this._shader = new ShaderProgram({
      vertexSrc: wireFrameCubes.vertex,
      fragmentSrc: wireFrameCubes.fragment,
      attributes: [
        'a_vertex_position',
        'a_offset_center',
        'a_offset_scale',
        'a_offset_color'
      ],
      uniforms: ['u_composedMatrix']
    });

    const geometryDef = {
      vbos: [
        {
          attrs: [
            {
              name: 'a_vertex_position',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 0
            }
          ],
          stride: 3 * 4,
          instanced: false
        },
        {
          attrs: [
            {
              name: 'a_offset_center',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 0
            },
            {
              name: 'a_offset_scale',
              type: GeometryWrapper.AttributeType.float,
              index: 3
            },
            {
              name: 'a_offset_color',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 4
            }
          ],
          stride: 7 * 4,
          instanced: true
        }
      ],
      primitiveType: GeometryWrapper.PrimitiveType.lines
    } as GeometryWrapper.GeometryDefinition;

    this._geometry = new GeometryWrapper.Geometry(this._shader, geometryDef);

    const vertices = generateWireFrameCubeVertices(1);

    this._geometry.updateBuffer(0, vertices);
    this._geometry.setPrimitiveCount(vertices.length / 3);
  }

  pushCenteredCube(
    inCenter: glm.ReadonlyVec3,
    inScale: number,
    inColor: glm.ReadonlyVec3
  ) {
    this._vertices.push(
      inCenter[0],
      inCenter[1],
      inCenter[2],
      inScale,
      inColor[0],
      inColor[1],
      inColor[2]
    );
  }

  pushOriginBoundCube(
    inOrigin: glm.ReadonlyVec3,
    inScale: number,
    inColor: glm.ReadonlyVec3
  ) {
    this._vertices.push(
      inOrigin[0] + inScale * 0.5,
      inOrigin[1] + inScale * 0.5,
      inOrigin[2] + inScale * 0.5,
      inScale,
      inColor[0],
      inColor[1],
      inColor[2]
    );
  }

  flush(composedMatrix: glm.mat4) {
    const gl = WebGLContext.getContext();

    this._shader.bind();
    this._shader.setMatrix4Uniform('u_composedMatrix', composedMatrix);

    this._geometry.updateBuffer(1, this._vertices, true);
    this._geometry.setInstancedCount(this._vertices.length / 7);
    this._geometry.render();

    // reset vertices
    this._vertices.length = 0;
  }
}
