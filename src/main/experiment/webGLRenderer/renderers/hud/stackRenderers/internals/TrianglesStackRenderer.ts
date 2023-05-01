import { ShaderProgram, GeometryWrapper } from '../../../../wrappers';

import * as glm from 'gl-matrix';

const k_bufferSize = 7 * 1024;

export class TrianglesStackRenderer {
  private _geometry: GeometryWrapper.Geometry;

  private _buffer = new Float32Array(k_bufferSize);
  private _currentSize: number = 0;

  constructor(
    inShader: ShaderProgram,
    inGeometryDef: GeometryWrapper.GeometryDefinition
  ) {
    const geometryDef: GeometryWrapper.GeometryDefinition = {
      ...inGeometryDef,
      primitiveType: GeometryWrapper.PrimitiveType.triangles
    };

    this._geometry = new GeometryWrapper.Geometry(inShader, geometryDef);
    this._geometry.setFloatBufferSize(0, k_bufferSize, true);
  }

  pushLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    thickness: number,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {

    if (this._currentSize + 7 * 6 >= this._buffer.length)
      return;

    const diffX = inPointB[0] - inPointA[0];
    const diffY = inPointB[1] - inPointA[1];
    const angle = Math.atan2(diffY, diffX) + Math.PI * 0.5;

    const stepX = Math.cos(angle) * thickness * 0.5;
    const stepY = Math.sin(angle) * thickness * 0.5;

    const alphaValue = inColor[3] ?? 1;

    // 0
    this._buffer[this._currentSize + 0] = inPointA[0] - stepX;
    this._buffer[this._currentSize + 1] = inPointA[1] - stepY;
    this._buffer[this._currentSize + 2] = inPointA[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 2
    this._buffer[this._currentSize + 0] = inPointB[0] - stepX;
    this._buffer[this._currentSize + 1] = inPointB[1] - stepY;
    this._buffer[this._currentSize + 2] = inPointB[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 3
    this._buffer[this._currentSize + 0] = inPointB[0] + stepX;
    this._buffer[this._currentSize + 1] = inPointB[1] + stepY;
    this._buffer[this._currentSize + 2] = inPointB[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;



    // 0
    this._buffer[this._currentSize + 0] = inPointA[0] - stepX;
    this._buffer[this._currentSize + 1] = inPointA[1] - stepY;
    this._buffer[this._currentSize + 2] = inPointA[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 3
    this._buffer[this._currentSize + 0] = inPointB[0] + stepX;
    this._buffer[this._currentSize + 1] = inPointB[1] + stepY;
    this._buffer[this._currentSize + 2] = inPointB[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 1
    this._buffer[this._currentSize + 0] = inPointA[0] + stepX;
    this._buffer[this._currentSize + 1] = inPointA[1] + stepY;
    this._buffer[this._currentSize + 2] = inPointA[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;


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

    if (this._currentSize + 7 * 6 >= this._buffer.length)
      return;

    const maxCoord: glm.ReadonlyVec2 = [
      inOrigin[0] + inSize[0],
      inOrigin[1] + inSize[1]
    ];

    const alphaValue = inColor[3] ?? 1;

    // 0
    this._buffer[this._currentSize + 0] = inOrigin[0];
    this._buffer[this._currentSize + 1] = inOrigin[1];
    this._buffer[this._currentSize + 2] = inOrigin[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 2
    this._buffer[this._currentSize + 0] = maxCoord[0];
    this._buffer[this._currentSize + 1] = maxCoord[1];
    this._buffer[this._currentSize + 2] = inOrigin[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 3
    this._buffer[this._currentSize + 0] = inOrigin[0];
    this._buffer[this._currentSize + 1] = maxCoord[1];
    this._buffer[this._currentSize + 2] = inOrigin[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;



    // 0
    this._buffer[this._currentSize + 0] = inOrigin[0];
    this._buffer[this._currentSize + 1] = inOrigin[1];
    this._buffer[this._currentSize + 2] = inOrigin[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 1
    this._buffer[this._currentSize + 0] = maxCoord[0];
    this._buffer[this._currentSize + 1] = inOrigin[1];
    this._buffer[this._currentSize + 2] = inOrigin[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;

    // 2
    this._buffer[this._currentSize + 0] = maxCoord[0];
    this._buffer[this._currentSize + 1] = maxCoord[1];
    this._buffer[this._currentSize + 2] = inOrigin[2];
    this._buffer[this._currentSize + 3] = inColor[0];
    this._buffer[this._currentSize + 4] = inColor[1];
    this._buffer[this._currentSize + 5] = inColor[2];
    this._buffer[this._currentSize + 6] = alphaValue;
    this._currentSize += 7;


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
    if (!this.canRender()) return;

    this._geometry.updateBuffer(0, this._buffer, this._currentSize, true);
    this._geometry.setPrimitiveCount(this._currentSize / 7);

    this._geometry.render();

    this.clear();
  }

  clear(): void {
    // reset vertices
    this._currentSize = 0;
  }
}
