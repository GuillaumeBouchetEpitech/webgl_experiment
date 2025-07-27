import * as webgl2 from '../../../graphics/webgl2';

// import * as shaders from './shaders';

// @ts-ignore
import textRendererVertex from './shaders/text-renderer.glsl.vert';
// @ts-ignore
import textRendererFragment from './shaders/text-renderer.glsl.frag';

import { asciiTextureHex } from './internals/asciiTextureHex';

import * as glm from 'gl-matrix';

const k_gridSize: glm.ReadonlyVec2 = [16, 6];
const k_texCoord: glm.ReadonlyVec2 = [1 / k_gridSize[0], 1 / k_gridSize[1]];

const k_bufferSize = 9 * 1024 * 4;

type HorizontalTextAlign = 'left' | 'centered' | 'right';
type VerticalTextAlign = 'top' | 'centered' | 'bottom';

export interface ITextRenderer {
  setTextAlign(
    inHorizontalTextAlign: HorizontalTextAlign,
    inVerticalTextAlign: VerticalTextAlign
  ): this;
  setTextScale(inScale: number): this;
  setTextColor(inRed: number, inGreen: number, inBlue: number): this;

  pushText(inMessage: string, inPosition: glm.ReadonlyVec2): this;

  flush(composedMatrix: glm.ReadonlyMat4): this;
  clear(): this;
}

export class TextRenderer implements ITextRenderer {
  private _shader: webgl2.IUnboundShader;
  private _geometry: webgl2.GeometryWrapper.Geometry;
  private _texture: webgl2.IUnboundTexture = new webgl2.Texture();
  private _texCoordMap: Map<string, glm.ReadonlyVec2>;

  private _buffer = new Float32Array(k_bufferSize);
  private _currentSize: number = 0;

  private _textScale: number = 14;
  private _textColor: glm.vec3 = [1, 1, 1];

  private _horizontalTextAlign: HorizontalTextAlign = 'left';
  private _verticalTextAlign: VerticalTextAlign = 'top';

  constructor() {
    this._shader = new webgl2.ShaderProgram('TextRenderer', {
      vertexSrc: textRendererVertex,
      fragmentSrc: textRendererFragment,
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

    const geoBuilder = new webgl2.GeometryWrapper.GeometryBuilder();
    geoBuilder
      .reset()
      .setPrimitiveType('triangles')
      .addVbo()
      .addVboAttribute('a_vertex_position', 'vec2f')
      .addVboAttribute('a_vertex_texCoord', 'vec2f')
      .setStride(4 * 4)
      .addVbo()
      .setVboAsDynamic()
      .setVboAsInstanced()
      .addVboAttribute('a_offset_position', 'vec3f')
      .addVboAttribute('a_offset_texCoord', 'vec2f')
      .addVboAttribute('a_offset_color', 'vec3f')
      .addVboAttribute('a_offset_scale', 'float')
      .setStride(9 * 4);

    this._geometry = new webgl2.GeometryWrapper.Geometry(
      this._shader,
      geoBuilder.getDef()
    );

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

    const indices = [1, 0, 2, 1, 2, 3];

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

    this._geometry.allocateBuffer(0, letterVertices, letterVertices.length);
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

    this._texture.initialize();
    this._texture.bind((boundTexture) => {
      boundTexture.loadFromMemory(width, height, imagePixels);
    });
  }

  setTextAlign(
    inHorizontalTextAlign: HorizontalTextAlign,
    inVerticalTextAlign: VerticalTextAlign
  ): this {
    this._horizontalTextAlign = inHorizontalTextAlign;
    this._verticalTextAlign = inVerticalTextAlign;
    return this;
  }

  setTextScale(inScale: number): this {
    this._textScale = inScale;
    return this;
  }

  setTextColor(inRed: number, inGreen: number, inBlue: number): this {
    this._textColor[0] = inRed;
    this._textColor[1] = inGreen;
    this._textColor[2] = inBlue;
    return this;
  }

  pushText(inMessage: string, inPosition: glm.ReadonlyVec2): this {
    //
    // validate
    //

    if (inMessage.length === 0) {
      return this;
    }
    if (this._textScale <= 0) {
      return this;
    }

    const allLineWidth: number[] = [0];
    for (let ii = 0; ii < inMessage.length; ++ii) {
      if (inMessage[ii] == '\n') {
        allLineWidth.push(0);
      } else {
        allLineWidth[allLineWidth.length - 1] += 1;
      }
    }

    if (allLineWidth.length === 0) {
      return this;
    }
    // for (const currLine of allLineWidth) {
    //   if (currLine === 0) {
    //     return this;
    //   }
    // }

    let lineIndex = 0;

    const currPos: glm.vec2 = [0, 0];

    //
    // pre process
    //

    const hScale = this._textScale * 0.5;

    switch (this._horizontalTextAlign) {
      case 'left':
        currPos[0] = inPosition[0];
        break;
      case 'centered':
        currPos[0] = inPosition[0] - allLineWidth[lineIndex] * hScale + hScale;
        break;
      case 'right':
        currPos[0] =
          inPosition[0] -
          allLineWidth[lineIndex] * this._textScale +
          this._textScale;
        break;
    }

    switch (this._verticalTextAlign) {
      case 'top':
        currPos[1] = inPosition[1];
        break;
      case 'centered':
        currPos[1] = inPosition[1] + allLineWidth.length * hScale - hScale;
        break;
      case 'bottom':
        currPos[1] =
          inPosition[1] - (allLineWidth.length - 1) * this._textScale;
        break;
    }

    //
    // process
    //

    for (let ii = 0; ii < inMessage.length; ++ii) {
      const letter = inMessage[ii];

      if (letter == '\n') {
        lineIndex += 1;

        // go back
        switch (this._horizontalTextAlign) {
          case 'left':
            currPos[0] = inPosition[0];
            break;
          case 'centered':
            currPos[0] =
              inPosition[0] - allLineWidth[lineIndex] * hScale + hScale;
            break;
          case 'right':
            currPos[0] =
              inPosition[0] -
              allLineWidth[lineIndex] * this._textScale +
              this._textScale;
            break;
        }

        currPos[1] -= this._textScale; // go down
      } else {
        this._pushLetter(letter, currPos);
        // go right
        currPos[0] += this._textScale;
      }
    }
    return this;
  }

  private _pushLetter(inCharacter: string, inPosition: glm.ReadonlyVec2) {
    if (this._currentSize + 9 * 10 >= this._buffer.length) {
      return;
    }

    const texCoord = this._texCoordMap.get(inCharacter);

    if (!texCoord)
      throw new Error(`fail to find a letter, letter=${inCharacter}`);

    for (let yy = -1; yy <= 1; ++yy) {
      for (let xx = -1; xx <= 1; ++xx) {
        this._buffer[this._currentSize++] = inPosition[0] + 2 * xx;
        this._buffer[this._currentSize++] = inPosition[1] + 2 * yy;
        this._buffer[this._currentSize++] = -0.1;
        this._buffer[this._currentSize++] = texCoord[0];
        this._buffer[this._currentSize++] = texCoord[1];
        this._buffer[this._currentSize++] = 0; // blackColor
        this._buffer[this._currentSize++] = 0; // blackColor
        this._buffer[this._currentSize++] = 0; // blackColor
        this._buffer[this._currentSize++] = this._textScale;
      }
    }

    this._buffer[this._currentSize++] = inPosition[0];
    this._buffer[this._currentSize++] = inPosition[1];
    this._buffer[this._currentSize++] = 0.0;
    this._buffer[this._currentSize++] = texCoord[0];
    this._buffer[this._currentSize++] = texCoord[1];
    this._buffer[this._currentSize++] = this._textColor[0];
    this._buffer[this._currentSize++] = this._textColor[1];
    this._buffer[this._currentSize++] = this._textColor[2];
    this._buffer[this._currentSize++] = this._textScale;
  }

  flush(composedMatrix: glm.ReadonlyMat4): this {
    if (this._currentSize === 0) {
      return this;
    }

    this._shader.bind((boundShader) => {
      boundShader.setMatrix4Uniform('u_composedMatrix', composedMatrix);
      boundShader.setTextureUniform('u_texture', this._texture, 0);

      this._geometry.allocateBuffer(1, this._buffer, this._currentSize);
      this._geometry.setInstancedCount(this._currentSize / 9);
      this._geometry.render();
    });

    webgl2.Texture.unbind();

    this.clear();

    return this;
  }

  clear(): this {
    // reset vertices
    this._currentSize = 0;
    return this;
  }
}
