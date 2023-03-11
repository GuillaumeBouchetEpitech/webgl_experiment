import { ShaderProgram, GeometryWrapper } from '../../wrappers';

import * as glm from 'gl-matrix';

export class TrianglesStackRenderer {
  private _geometry: GeometryWrapper.Geometry;
  private _vertices: number[] = [];

  constructor(
    inShader: ShaderProgram,
    inGeometryDef: GeometryWrapper.GeometryDefinition
  ) {
    const geometryDef: GeometryWrapper.GeometryDefinition = {
      ...inGeometryDef,
      primitiveType: GeometryWrapper.PrimitiveType.triangles
    };

    this._geometry = new GeometryWrapper.Geometry(inShader, geometryDef);
  }

  pushLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    thickness: number,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    const diffX = inPointB[0] - inPointA[0];
    const diffY = inPointB[1] - inPointA[1];
    const angle = Math.atan2(diffY, diffX) + Math.PI * 0.5;

    const stepX = Math.cos(angle) * thickness * 0.5;
    const stepY = Math.sin(angle) * thickness * 0.5;

    const allVertices: [
      glm.ReadonlyVec3,
      glm.ReadonlyVec3,
      glm.ReadonlyVec3,
      glm.ReadonlyVec3
    ] = [
      [inPointA[0] - stepX, inPointA[1] - stepY, inPointA[2]],
      [inPointA[0] + stepX, inPointA[1] + stepY, inPointA[2]],
      [inPointB[0] - stepX, inPointB[1] - stepY, inPointB[2]],
      [inPointB[0] + stepX, inPointB[1] + stepY, inPointB[2]]
    ];

    const indices: number[] = [0, 3, 2, 0, 1, 3];
    indices.forEach((index) => {
      const vertex = allVertices[index];
      this._vertices.push(vertex[0], vertex[1], vertex[2]);
      this._vertices.push(inColor[0], inColor[1], inColor[2], inColor[3] ?? 1);
    });
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
    const maxCoord: glm.ReadonlyVec2 = [
      inOrigin[0] + inSize[0],
      inOrigin[1] + inSize[1]
    ];

    const allVertices: [
      glm.ReadonlyVec3,
      glm.ReadonlyVec3,
      glm.ReadonlyVec3,
      glm.ReadonlyVec3
    ] = [
      [inOrigin[0], inOrigin[1], inOrigin[2]],
      [maxCoord[0], inOrigin[1], inOrigin[2]],
      [maxCoord[0], maxCoord[1], inOrigin[2]],
      [inOrigin[0], maxCoord[1], inOrigin[2]]
    ];

    const indices: number[] = [0, 3, 2, 0, 1, 2];
    indices.forEach((index) => {
      const vertex = allVertices[index];
      this._vertices.push(vertex[0], vertex[1], vertex[2]);
      this._vertices.push(inColor[0], inColor[1], inColor[2], inColor[3] ?? 1);
    });
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
    return this._vertices.length > 0;
  }

  flush() {
    if (this._vertices.length === 0) return;

    this._geometry.updateBuffer(0, this._vertices, true);
    this._geometry.setPrimitiveCount(this._vertices.length / 7);

    this._geometry.render();

    // reset vertices
    this._vertices.length = 0;
  }
}
