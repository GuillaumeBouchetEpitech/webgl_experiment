import { ShaderProgram, GeometryWrapper } from '../../../wrappers';
import { ICamera } from '../../../camera/Camera';

import * as shaders from './shaders';

import { WireFramesStackRenderer } from './internals/WireFramesStackRenderer';
import { TrianglesStackRenderer } from './internals/TrianglesStackRenderer';

import * as glm from 'gl-matrix';

export interface IStackRenderers {
  pushTriangle(
    inPosA: glm.ReadonlyVec3,
    inPosB: glm.ReadonlyVec3,
    inPosC: glm.ReadonlyVec3,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ): void;

  pushLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    inColor: glm.ReadonlyVec3
  ): void;

  pushThickLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    thickness: number,
    inColor: glm.ReadonlyVec3
  ): void;

  pushRotatedLine(
    center: glm.ReadonlyVec3,
    angle: number,
    length: number,
    thickness: number,
    color: glm.ReadonlyVec3
  ): void;

  pushOriginBoundRectangle(
    inOrigin: glm.ReadonlyVec3,
    inSize: glm.ReadonlyVec2,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ): void;

  pushCenteredRectangle(
    inCenter: glm.ReadonlyVec3,
    inSize: glm.ReadonlyVec2,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ): void;

  flush(composedMatrix: glm.ReadonlyMat4): void;
  clear(): void;
}

export class StackRenderers implements IStackRenderers {
  private _shader: ShaderProgram;

  private _wireFramesStackRenderer: WireFramesStackRenderer;
  private _trianglesStackRenderer: TrianglesStackRenderer;

  constructor() {
    this._shader = new ShaderProgram({
      vertexSrc: shaders.stackRenderer.vertex,
      fragmentSrc: shaders.stackRenderer.fragment,
      attributes: ['a_vertex_position', 'a_vertex_color'],
      uniforms: ['u_composedMatrix']
    });

    const geometryDef: GeometryWrapper.GeometryDefinition = {
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
              type: GeometryWrapper.AttributeType.vec4f,
              index: 3
            }
          ],
          stride: 7 * 4,
          instanced: false,
          dynamic: true
        }
      ],
      primitiveType: GeometryWrapper.PrimitiveType.lines // is overridden later
    };

    this._wireFramesStackRenderer = new WireFramesStackRenderer(
      this._shader,
      geometryDef
    );
    this._trianglesStackRenderer = new TrianglesStackRenderer(
      this._shader,
      geometryDef
    );
  }

  pushLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    inColor: glm.ReadonlyVec3
  ) {
    this._wireFramesStackRenderer.pushLine(inPointA, inPointB, inColor);
  }

  pushCross(
    inCenter: glm.ReadonlyVec3,
    inSize: number,
    inColor: glm.ReadonlyVec3
  ) {
    const crossVertices: glm.ReadonlyVec3[] = [
      [inCenter[0] - inSize, inCenter[1], inCenter[2]],
      [inCenter[0] + inSize, inCenter[1], inCenter[2]],
      [inCenter[0], inCenter[1] - inSize, inCenter[2]],
      [inCenter[0], inCenter[1] + inSize, inCenter[2]],
      [inCenter[0], inCenter[1], inCenter[2] - inSize],
      [inCenter[0], inCenter[1], inCenter[2] + inSize]
    ];
    const crossIndices: number[] = [0, 1, 2, 3, 4, 5];

    for (let ii = 0; ii < crossIndices.length; ii += 2) {
      const vertexA = crossVertices[ii + 0];
      const vertexB = crossVertices[ii + 1];
      this._wireFramesStackRenderer.pushLine(vertexA, vertexB, inColor);
    }
  }

  pushThickLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    thickness: number,
    inColor: glm.ReadonlyVec3
  ) {
    this._trianglesStackRenderer.pushLine(
      inPointA,
      inPointB,
      thickness,
      inColor
    );
  }

  pushRotatedLine(
    center: glm.ReadonlyVec3,
    angle: number,
    length: number,
    thickness: number,
    color: glm.ReadonlyVec3
  ) {
    this._trianglesStackRenderer.pushRotatedLine(
      center,
      angle,
      length,
      thickness,
      color
    );
  }

  pushOriginBoundRectangle(
    inOrigin: glm.ReadonlyVec3,
    inSize: glm.ReadonlyVec2,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    this._trianglesStackRenderer.pushOriginBoundRectangle(
      inOrigin,
      inSize,
      inColor
    );
  }

  pushCenteredRectangle(
    inCenter: glm.ReadonlyVec3,
    inSize: glm.ReadonlyVec2,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    this._trianglesStackRenderer.pushCenteredRectangle(
      inCenter,
      inSize,
      inColor
    );
  }

  pushTriangle(
    inPosA: glm.ReadonlyVec3,
    inPosB: glm.ReadonlyVec3,
    inPosC: glm.ReadonlyVec3,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    this._trianglesStackRenderer.pushTriangle(inPosA, inPosB, inPosC, inColor);
  }

  flush(composedMatrix: glm.ReadonlyMat4): void {
    if (
      !this._wireFramesStackRenderer.canRender() &&
      !this._trianglesStackRenderer.canRender()
    ) {
      return;
    }

    this._shader.bind();
    this._shader.setMatrix4Uniform('u_composedMatrix', composedMatrix);

    this._wireFramesStackRenderer.flush();
    this._trianglesStackRenderer.flush();
  }

  clear(): void {
    this._wireFramesStackRenderer.clear();
    this._trianglesStackRenderer.clear();
  }
}
