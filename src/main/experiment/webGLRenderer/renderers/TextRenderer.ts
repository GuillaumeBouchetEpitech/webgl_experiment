
import { ShaderProgram, Texture, GeometryWrapper } from '../wrappers';

import { textRenderer } from './shaders';

import { asciiTextureHex } from './internals/asciiTextureHex';

import * as glm from 'gl-matrix';

const k_gridSize: glm.ReadonlyVec2 = [16, 6];
const k_texCoord: glm.ReadonlyVec2 = [1 / k_gridSize[0], 1 / k_gridSize[1]];

export interface ITextRenderer {

  pushText(inMessage: string, inPosition: glm.ReadonlyVec2, inScale: number): void;
  pushCenteredText(inMessage: string, inCenter: glm.ReadonlyVec2, inScale: number): void;
  pushRightAlignedText(inMessage: string, inRightOrigin: glm.ReadonlyVec2, inScale: number): void
  flush(composedMatrix: glm.ReadonlyMat4): void;

};

export class TextRenderer implements ITextRenderer {
  private _shader: ShaderProgram;
  private _geometry: GeometryWrapper.Geometry;
  private _texture = new Texture();
  private _texCoordMap: Map<string, glm.ReadonlyVec2>;
  private _vertices: number[] = [];

  constructor() {
    this._shader = new ShaderProgram({
      vertexSrc: textRenderer.vertex,
      fragmentSrc: textRenderer.fragment,
      attributes: [
        'a_vertex_position',
        'a_vertex_texCoord',
        'a_offset_position',
        'a_offset_texCoord',
        'a_offset_color',
        'a_offset_scale'
      ],
      uniforms: ['u_composedMatrix', 'u_texture']
    });

    const geometryDef = {
      vbos: [
        {
          attrs: [
            {
              name: 'a_vertex_position',
              type: GeometryWrapper.AttributeType.vec2f,
              index: 0
            },
            {
              name: 'a_vertex_texCoord',
              type: GeometryWrapper.AttributeType.vec2f,
              index: 2
            }
          ],
          stride: 4 * 4,
          instanced: false
        },
        {
          attrs: [
            {
              name: 'a_offset_position',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 0
            },
            {
              name: 'a_offset_texCoord',
              type: GeometryWrapper.AttributeType.vec2f,
              index: 3
            },
            {
              name: 'a_offset_color',
              type: GeometryWrapper.AttributeType.vec3f,
              index: 5
            },
            {
              name: 'a_offset_scale',
              type: GeometryWrapper.AttributeType.float,
              index: 8
            }
          ],
          stride: 9 * 4,
          instanced: true
        }
      ],
      primitiveType: GeometryWrapper.PrimitiveType.triangles
    } as GeometryWrapper.GeometryDefinition;

    this._geometry = new GeometryWrapper.Geometry(this._shader, geometryDef);

    type Vertex = { position: glm.ReadonlyVec2; texCoord: glm.ReadonlyVec2 };

    const vertices: [Vertex, Vertex, Vertex, Vertex] = [
      {
        position: [+0.5, -0.5],
        texCoord: [k_texCoord[0] * 1, k_texCoord[1] * 1]
      },
      {
        position: [-0.5, -0.5],
        texCoord: [k_texCoord[0] * 0, k_texCoord[1] * 1]
      },
      {
        position: [+0.5, +0.5],
        texCoord: [k_texCoord[0] * 1, k_texCoord[1] * 0]
      },
      {
        position: [-0.5, +0.5],
        texCoord: [k_texCoord[0] * 0, k_texCoord[1] * 0]
      }
    ];

    const indices = [1, 0, 2, 1, 3, 2];

    const letterVertices: number[] = [];
    for (const index of indices) {
      const vertex = vertices[index];
      letterVertices.push(
        vertex.position[0],
        vertex.position[1],
        vertex.texCoord[0],
        vertex.texCoord[1]
      );
    }

    this._geometry.updateBuffer(0, letterVertices);
    this._geometry.setPrimitiveCount(letterVertices.length / 4);

    this._texCoordMap = new Map<string, glm.ReadonlyVec2>([
      [' ', [0 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['!', [1 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['"', [2 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['#', [3 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['$', [4 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['%', [5 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['&', [6 * k_texCoord[0], 0 * k_texCoord[1]]],
      ["'", [7 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['(', [8 * k_texCoord[0], 0 * k_texCoord[1]]],
      [')', [9 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['*', [10 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['+', [11 * k_texCoord[0], 0 * k_texCoord[1]]],
      [',', [12 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['-', [13 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['.', [14 * k_texCoord[0], 0 * k_texCoord[1]]],
      ['/', [15 * k_texCoord[0], 0 * k_texCoord[1]]],

      ['0', [0 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['1', [1 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['2', [2 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['3', [3 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['4', [4 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['5', [5 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['6', [6 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['7', [7 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['8', [8 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['9', [9 * k_texCoord[0], 1 * k_texCoord[1]]],
      [':', [10 * k_texCoord[0], 1 * k_texCoord[1]]],
      [';', [11 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['<', [12 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['=', [13 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['>', [14 * k_texCoord[0], 1 * k_texCoord[1]]],
      ['?', [15 * k_texCoord[0], 1 * k_texCoord[1]]],

      ['@', [0 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['A', [1 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['B', [2 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['C', [3 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['D', [4 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['E', [5 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['F', [6 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['G', [7 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['H', [8 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['I', [9 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['J', [10 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['K', [11 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['L', [12 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['M', [13 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['N', [14 * k_texCoord[0], 2 * k_texCoord[1]]],
      ['O', [15 * k_texCoord[0], 2 * k_texCoord[1]]],

      ['P', [0 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['Q', [1 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['R', [2 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['S', [3 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['T', [4 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['U', [5 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['V', [6 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['W', [7 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['X', [8 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['Y', [9 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['Z', [10 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['[', [11 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['\\', [12 * k_texCoord[0], 3 * k_texCoord[1]]],
      [']', [13 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['^', [14 * k_texCoord[0], 3 * k_texCoord[1]]],
      ['_', [15 * k_texCoord[0], 3 * k_texCoord[1]]],

      ['`', [0 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['a', [1 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['b', [2 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['c', [3 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['d', [4 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['e', [5 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['f', [6 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['g', [7 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['h', [8 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['i', [9 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['j', [10 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['k', [11 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['l', [12 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['m', [13 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['n', [14 * k_texCoord[0], 4 * k_texCoord[1]]],
      ['o', [15 * k_texCoord[0], 4 * k_texCoord[1]]],

      ['p', [0 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['q', [1 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['r', [2 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['s', [3 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['t', [4 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['u', [5 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['v', [6 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['w', [7 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['x', [8 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['y', [9 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['z', [10 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['{', [11 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['|', [12 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['}', [13 * k_texCoord[0], 5 * k_texCoord[1]]],
      ['~', [14 * k_texCoord[0], 5 * k_texCoord[1]]]
    ]);

    const width = 256;
    const height = 96;
    const imagePixels = new Uint8Array(width * height * 4);
    {
      let index = 0;
      for (let ii = 0; ii < asciiTextureHex.length; ii += 2) {
        let currSize =
          parseInt(`${asciiTextureHex.substring(ii, ii + 2)}000000`, 16) >> 24;

        let currVal = 0;
        if (currSize < 0) {
          currSize = -currSize;
          currVal = 255;
        }

        for (let ii = 0; ii < currSize; ++ii) {
          imagePixels[index * 4 + 0] = currVal;
          imagePixels[index * 4 + 1] = currVal;
          imagePixels[index * 4 + 2] = currVal;
          imagePixels[index * 4 + 3] = currVal;
          ++index;
        }
      }
    }

    this._texture.loadFromMemory(width, height, imagePixels, true);
  }

  pushText(inMessage: string, inPosition: glm.ReadonlyVec2, inScale: number) {
    const currPos: glm.vec2 = [inPosition[0], inPosition[1]];

    for (let ii = 0; ii < inMessage.length; ++ii) {
      const letter = inMessage[ii];

      if (letter == '\n') {
        currPos[0] = inPosition[0]; // go back
        currPos[1] -= inScale; // got down
        continue;
      }

      this._pushLetter(letter, currPos, inScale);

      currPos[0] += inScale;
    }
  }

  pushCenteredText(inMessage: string, inCenter: glm.ReadonlyVec2, inScale: number) {
    const allLineWidth: number[] = [0];
    for (let ii = 0; ii < inMessage.length; ++ii) {
      if (inMessage[ii] == '\n') {
        allLineWidth.push(0);
      } else {
        allLineWidth[allLineWidth.length - 1] += 1;
      }
    }

    let lineIndex = 0;

    const currPos: glm.vec2 = [0, 0];
    currPos[0] =
      inCenter[0] - allLineWidth[lineIndex] * inScale * 0.5 + inScale * 0.5;
    currPos[1] =
      inCenter[1] + allLineWidth.length * inScale * 0.5 - inScale * 0.5;

    for (let ii = 0; ii < inMessage.length; ++ii) {
      const letter = inMessage[ii];

      if (letter == '\n') {
        lineIndex += 1;
        // go back
        (currPos[0] =
          inCenter[0] -
          allLineWidth[lineIndex] * inScale * 0.5 +
          inScale * 0.5),
          // go down
          (currPos[1] -= inScale);
      } else {
        this._pushLetter(letter, currPos, inScale);
        // go right
        currPos[0] += inScale;
      }
    }
  }

  pushRightAlignedText(
    inMessage: string,
    inRightOrigin: glm.ReadonlyVec2,
    inScale: number
  ) {
    const allLineWidth: number[] = [0];
    for (let ii = 0; ii < inMessage.length; ++ii) {
      if (inMessage[ii] == '\n') {
        allLineWidth.push(0);
      } else {
        allLineWidth[allLineWidth.length - 1] += 1;
      }
    }

    let lineIndex = 0;

    const currPos: glm.vec2 = [0, 0];
    currPos[0] = inRightOrigin[0] - allLineWidth[lineIndex] * inScale + inScale;
    currPos[1] = inRightOrigin[1];

    for (let ii = 0; ii < inMessage.length; ++ii) {
      const letter = inMessage[ii];

      if (letter == '\n') {
        lineIndex += 1;
        // go back
        currPos[0] =
          inRightOrigin[0] - allLineWidth[lineIndex] * inScale + inScale;
        // go down
        currPos[1] -= inScale;
      } else {
        this._pushLetter(letter, currPos, inScale);
        // go right
        currPos[0] += inScale;
      }
    }
  }

  private _pushLetter(inCharacter: string, inPosition: glm.ReadonlyVec2, inScale: number) {
    const texCoord = this._texCoordMap.get(inCharacter);

    if (!texCoord)
      throw new Error(`fail to find a letter, letter=${inCharacter}`);

    const whiteColor: glm.ReadonlyVec3 = [1.0, 1.0, 1.0];
    const blackColor: glm.ReadonlyVec3 = [0.0, 0.0, 0.0];

    for (let yy = -1; yy <= 1; ++yy) {
      for (let xx = -1; xx <= 1; ++xx) {
        this._vertices.push(
          inPosition[0] + 2 * xx,
          inPosition[1] + 2 * yy,
          -0.1,

          texCoord[0],
          texCoord[1],

          blackColor[0],
          blackColor[1],
          blackColor[2],

          inScale
        );
      }
    }

    this._vertices.push(
      inPosition[0],
      inPosition[1],
      0.0,
      texCoord[0],
      texCoord[1],
      whiteColor[0],
      whiteColor[1],
      whiteColor[2],
      inScale
    );
  }

  flush(composedMatrix: glm.ReadonlyMat4) {
    this._shader.bind();
    this._shader.setMatrix4Uniform('u_composedMatrix', composedMatrix);

    this._texture.bind();

    this._geometry.updateBuffer(1, this._vertices, true);
    this._geometry.setInstancedCount(this._vertices.length / 9);
    this._geometry.render();

    Texture.unbind();

    // reset vertices
    this._vertices.length = 0;
  }
}
