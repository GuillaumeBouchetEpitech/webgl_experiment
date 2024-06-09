import * as webgl2 from '../../../graphics/webgl2';

// @ts-ignore
import stackRendererVertex from './shaders/stack-renderer.glsl.vert';
// @ts-ignore
import stackRendererFragment from './shaders/stack-renderer.glsl.frag';

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

  pushQuad(
    inPos: glm.ReadonlyVec3,
    inSize: glm.ReadonlyVec2,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ): void;

  pushLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    inColor: glm.ReadonlyVec3
  ): void;

  pushCross(
    inCenter: glm.ReadonlyVec3,
    inSize: number,
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

  safeRender(inComposedMatrix: glm.ReadonlyMat4, inCallback: () => void): void;
  flush(composedMatrix: glm.ReadonlyMat4): void;
  clear(): void;
}

export class StackRenderers implements IStackRenderers {
  private _shader: webgl2.IUnboundShader;

  private _wireFramesStackRenderer: WireFramesStackRenderer;
  private _trianglesStackRenderer: TrianglesStackRenderer;

  constructor() {
    this._shader = new webgl2.ShaderProgram('StackRenderers', {
      vertexSrc: stackRendererVertex,
      fragmentSrc: stackRendererFragment,
      attributes: ['a_vertex_position', 'a_vertex_color'],
      uniforms: ['u_composedMatrix']
    });

    const geoBuilder = new webgl2.GeometryWrapper.GeometryBuilder();
    geoBuilder
      .reset()
      .setPrimitiveType('lines')
      .addVbo()
      .setVboAsDynamic()
      .addVboAttribute('a_vertex_position', 'vec3f')
      .addVboAttribute('a_vertex_color', 'vec4f');

    this._wireFramesStackRenderer = new WireFramesStackRenderer(
      this._shader,
      geoBuilder.getDef()
    );
    this._trianglesStackRenderer = new TrianglesStackRenderer(
      this._shader,
      geoBuilder.getDef()
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

  pushQuad(
    inPos: glm.ReadonlyVec3,
    inSize: glm.ReadonlyVec2,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    this.pushTriangle(
      [inPos[0] + inSize[0] * 0, inPos[1] + inSize[1] * 0, inPos[2]],
      [inPos[0] + inSize[0] * 1, inPos[1] + inSize[1] * 1, inPos[2]],
      [inPos[0] + inSize[0] * 1, inPos[1] + inSize[1] * 0, inPos[2]],
      inColor
    );
    this.pushTriangle(
      [inPos[0] + inSize[0] * 0, inPos[1] + inSize[1] * 0, inPos[2]],
      [inPos[0] + inSize[0] * 1, inPos[1] + inSize[1] * 1, inPos[2]],
      [inPos[0] + inSize[0] * 0, inPos[1] + inSize[1] * 1, inPos[2]],
      inColor
    );
  }

  flush(inComposedMatrix: glm.ReadonlyMat4) {
    if (
      !this._wireFramesStackRenderer.canRender() &&
      !this._trianglesStackRenderer.canRender()
    ) {
      return;
    }

    this._shader.bind((bound) => {
      bound.setMatrix4Uniform('u_composedMatrix', inComposedMatrix);

      this._wireFramesStackRenderer.flush();
      this._trianglesStackRenderer.flush();
    });
  }

  safeRender(inComposedMatrix: glm.ReadonlyMat4, inCallback: () => void) {
    this._shader.bind((bound) => {
      bound.setMatrix4Uniform('u_composedMatrix', inComposedMatrix);

      inCallback();

      this._wireFramesStackRenderer.flush();
      this._trianglesStackRenderer.flush();
    });
  }

  clear(): void {
    this._wireFramesStackRenderer.clear();
    this._trianglesStackRenderer.clear();
  }
}
