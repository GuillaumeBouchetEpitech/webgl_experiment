import { graphics } from '../../../..';

import * as glm from 'gl-matrix';

const k_bufferSize = 7 * 1024;

export class TrianglesStackRenderer {
  private _shader: graphics.webgl2.IUnboundShader;
  private _geometry: graphics.webgl2.GeometryWrapper.Geometry;

  private _buffer = new Float32Array(k_bufferSize);
  private _currentSize: number = 0;

  constructor(
    inShader: graphics.webgl2.IUnboundShader,
    inGeometryDef: graphics.webgl2.GeometryWrapper.GeometryDefinition
  ) {
    this._shader = inShader;
    const geometryDef: graphics.webgl2.GeometryWrapper.GeometryDefinition = {
      ...inGeometryDef,
      primitiveType: graphics.webgl2.GeometryWrapper.PrimitiveType.triangles
    };

    this._geometry = new graphics.webgl2.GeometryWrapper.Geometry(
      inShader,
      geometryDef
    );
    this._geometry.setFloatBufferSize(0, k_bufferSize);
  }

  pushTriangle(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    inPointC: glm.ReadonlyVec3,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    if (this._currentSize + 7 * 6 >= this._buffer.length) {
      if (this._shader.isBound()) {
        this.flush();
      } else {
        return;
      }
    }

    const alphaValue = inColor[3] ?? 1;

    // 0
    this._buffer[this._currentSize + 0] = inPointA[0];
    this._buffer[this._currentSize + 1] = inPointA[1];
    this._buffer[this._currentSize + 2] = inPointA[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 2
    this._buffer[this._currentSize + 0] = inPointB[0];
    this._buffer[this._currentSize + 1] = inPointB[1];
    this._buffer[this._currentSize + 2] = inPointB[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 3
    this._buffer[this._currentSize + 0] = inPointC[0];
    this._buffer[this._currentSize + 1] = inPointC[1];
    this._buffer[this._currentSize + 2] = inPointC[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;
  }

  pushLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    thickness: number,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    if (this._currentSize + 7 * 6 >= this._buffer.length) {
      return;
    }

    const diffX = inPointB[0] - inPointA[0];
    const diffY = inPointB[1] - inPointA[1];
    const angle = Math.atan2(diffY, diffX) + Math.PI * 0.5;

    const stepX = Math.cos(angle) * thickness * 0.5;
    const stepY = Math.sin(angle) * thickness * 0.5;

    this.pushTriangle(
      [inPointA[0] - stepX, inPointA[1] - stepY, inPointA[2]],
      [inPointB[0] - stepX, inPointB[1] - stepY, inPointB[2]],
      [inPointB[0] + stepX, inPointB[1] + stepY, inPointB[2]],
      inColor
    );
    this.pushTriangle(
      [inPointA[0] - stepX, inPointA[1] - stepY, inPointA[2]],
      [inPointB[0] + stepX, inPointB[1] + stepY, inPointB[2]],
      [inPointA[0] + stepX, inPointA[1] + stepY, inPointA[2]],
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
    this.pushLine(
      [
        center[0] - length * Math.cos(angle),
        center[1] - length * Math.sin(angle),
        center[2]
      ],
      [
        center[0] + length * Math.cos(angle),
        center[1] + length * Math.sin(angle),
        center[2]
      ],
      thickness,
      color
    );
  }

  pushOriginBoundRectangle(
    inOrigin: glm.ReadonlyVec3,
    inSize: glm.ReadonlyVec2,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    if (this._currentSize + 7 * 6 >= this._buffer.length) {
      return;
    }

    const maxCoord: glm.ReadonlyVec2 = [
      inOrigin[0] + inSize[0],
      inOrigin[1] + inSize[1]
    ];

    this.pushTriangle(
      [inOrigin[0], inOrigin[1], inOrigin[2]],
      [maxCoord[0], maxCoord[1], inOrigin[2]],
      [inOrigin[0], maxCoord[1], inOrigin[2]],
      inColor
    );

    this.pushTriangle(
      [inOrigin[0], inOrigin[1], inOrigin[2]],
      [maxCoord[0], inOrigin[1], inOrigin[2]],
      [maxCoord[0], maxCoord[1], inOrigin[2]],
      inColor
    );
  }

  pushCenteredRectangle(
    inCenter: glm.ReadonlyVec3,
    inSize: glm.ReadonlyVec2,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    const origin: glm.ReadonlyVec3 = [
      inCenter[0] - inSize[0] * 0.5,
      inCenter[1] - inSize[1] * 0.5,
      inCenter[2]
    ];

    this.pushOriginBoundRectangle(origin, inSize, inColor);
  }

  canRender() {
    return this._currentSize > 0;
  }

  flush() {
    if (!this.canRender()) {
      return;
    }

    this._geometry.updateBuffer(0, this._buffer, this._currentSize);
    this._geometry.setPrimitiveCount(this._currentSize / 7);

    this._geometry.render();

    this.clear();
  }

  clear(): void {
    // reset vertices
    this._currentSize = 0;
  }
}
