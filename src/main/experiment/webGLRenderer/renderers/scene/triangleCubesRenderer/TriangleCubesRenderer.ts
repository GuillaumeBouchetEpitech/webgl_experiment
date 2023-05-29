import { ShaderProgram, GeometryWrapper } from '../../../wrappers';
import { ICamera } from '../../../camera/Camera';

import * as shaders from './shaders';

import * as glm from 'gl-matrix';

const generateCubeVertices = (inOrigin: glm.ReadonlyVec3, inSize: glm.ReadonlyVec3) => {

  const vertices: glm.ReadonlyVec3[] = [];

  const hSizeX = inSize[0] * 0.5;
  const hSizeY = inSize[1] * 0.5;
  const hSizeZ = inSize[2] * 0.5;

  const tmpVertices: glm.ReadonlyVec3[] = [
    [ inOrigin[0] - hSizeX, inOrigin[1] - hSizeY, inOrigin[2] - hSizeZ ], // 0
    [ inOrigin[0] + hSizeX, inOrigin[1] - hSizeY, inOrigin[2] - hSizeZ ], // 1
    [ inOrigin[0] - hSizeX, inOrigin[1] + hSizeY, inOrigin[2] - hSizeZ ], // 2
    [ inOrigin[0] + hSizeX, inOrigin[1] + hSizeY, inOrigin[2] - hSizeZ ], // 3
    [ inOrigin[0] - hSizeX, inOrigin[1] - hSizeY, inOrigin[2] + hSizeZ ], // 4
    [ inOrigin[0] + hSizeX, inOrigin[1] - hSizeY, inOrigin[2] + hSizeZ ], // 5
    [ inOrigin[0] - hSizeX, inOrigin[1] + hSizeY, inOrigin[2] + hSizeZ ], // 6
    [ inOrigin[0] + hSizeX, inOrigin[1] + hSizeY, inOrigin[2] + hSizeZ ], // 7
  ];

  const indices: number[] = [];

  // -z 0123
  indices.push(0, 2, 1);
  indices.push(2, 3, 1);
  // +z 4567
  indices.push(4, 5, 6);
  indices.push(6, 5, 7);

  // +x 1357
  indices.push(1, 3, 5);
  indices.push(5, 3, 7);
  // -x 0246
  indices.push(0, 4, 2);
  indices.push(4, 6, 2);

  // +y 2367
  indices.push(2, 6, 3);
  indices.push(6, 7, 3);
  // -y 0145
  indices.push(0, 1, 4);
  indices.push(4, 1, 5);

  for (const index of indices) {
    vertices.push(tmpVertices[index]);
  }

  return vertices;
};

const generateWireFrameCubeVertices = (inSize: number): number[] => {

  const rectSize = 1 / 512;
  const rectPos = (0.5 - rectSize * 0.5);

  const vertices: glm.ReadonlyVec3[] = [
    ...generateCubeVertices([inSize * -rectPos, inSize * -rectPos, 0], [rectSize, rectSize, 1.0]),
    ...generateCubeVertices([inSize * +rectPos, inSize * -rectPos, 0], [rectSize, rectSize, 1.0]),
    ...generateCubeVertices([inSize * +rectPos, inSize * +rectPos, 0], [rectSize, rectSize, 1.0]),
    ...generateCubeVertices([inSize * -rectPos, inSize * +rectPos, 0], [rectSize, rectSize, 1.0]),

    ...generateCubeVertices([inSize * -rectPos, 0, inSize * -rectPos], [rectSize, 1.0, rectSize]),
    ...generateCubeVertices([inSize * +rectPos, 0, inSize * -rectPos], [rectSize, 1.0, rectSize]),
    ...generateCubeVertices([inSize * +rectPos, 0, inSize * +rectPos], [rectSize, 1.0, rectSize]),
    ...generateCubeVertices([inSize * -rectPos, 0, inSize * +rectPos], [rectSize, 1.0, rectSize]),

    ...generateCubeVertices([0, inSize * -rectPos, inSize * -rectPos], [1.0, rectSize, rectSize]),
    ...generateCubeVertices([0, inSize * +rectPos, inSize * -rectPos], [1.0, rectSize, rectSize]),
    ...generateCubeVertices([0, inSize * +rectPos, inSize * +rectPos], [1.0, rectSize, rectSize]),
    ...generateCubeVertices([0, inSize * -rectPos, inSize * +rectPos], [1.0, rectSize, rectSize]),
  ];

  const finalVertices: number[] = [];

  vertices.forEach((vertex) => {
    finalVertices.push(vertex[0], vertex[1], vertex[2]);
  });

  return finalVertices;
};

//
//
//

export interface ITriangleCubesRenderer {
  pushCenteredCube(
    inCenter: glm.ReadonlyVec3,
    inScale: number,
    inColor: glm.ReadonlyVec3
  ): void;

  pushOriginBoundCube(
    inOrigin: glm.ReadonlyVec3,
    inScale: number,
    inColor: glm.ReadonlyVec3
  ): void;

  clear(): void;
}

const k_bufferSize = 8 * 1024 * 4;

export class TriangleCubesRenderer implements ITriangleCubesRenderer {
  private _shader: ShaderProgram;
  private _geometry: GeometryWrapper.Geometry;

  private _buffer = new Float32Array(k_bufferSize);
  private _currentSize: number = 0;

  constructor() {
    this._shader = new ShaderProgram({
      vertexSrc: shaders.triangleCubes.vertex,
      fragmentSrc: shaders.triangleCubes.fragment,
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
          instanced: false,
          dynamic: false
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
              type: GeometryWrapper.AttributeType.vec4f,
              index: 4
            }
          ],
          stride: 8 * 4,
          instanced: true,
          dynamic: true
        }
      ],
      primitiveType: GeometryWrapper.PrimitiveType.triangles
    } as GeometryWrapper.GeometryDefinition;

    const vertices = generateWireFrameCubeVertices(1);

    this._geometry = new GeometryWrapper.Geometry(this._shader, geometryDef);
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

  flush(inCamera: ICamera) {
    if (this._currentSize <= 0) {
      return;
    }

    this._shader.bind();
    this._shader.setMatrix4Uniform(
      'u_composedMatrix',
      inCamera.getComposedMatrix()
    );

    this._geometry.updateBuffer(1, this._buffer, this._currentSize);
    this._geometry.setInstancedCount(this._currentSize / 8);
    this._geometry.render();

    this.clear();
  }

  clear(): void {
    // reset vertices
    this._currentSize = 0;
  }
}