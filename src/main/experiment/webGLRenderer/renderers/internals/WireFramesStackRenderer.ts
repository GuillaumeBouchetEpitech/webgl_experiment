import { ShaderProgram, GeometryWrapper } from '../../wrappers';

import * as glm from 'gl-matrix';

export class WireFramesStackRenderer {
  private _geometry: GeometryWrapper.Geometry;
  private _vertices: number[] = [];

  constructor(
    inShader: ShaderProgram,
    inGeometryDef: GeometryWrapper.GeometryDefinition
  ) {
    const geometryDef: GeometryWrapper.GeometryDefinition = {
      ...inGeometryDef,
      primitiveType: GeometryWrapper.PrimitiveType.lines
    };

    this._geometry = new GeometryWrapper.Geometry(inShader, geometryDef);
  }

  pushLine(
    inPointA: glm.ReadonlyVec3,
    inPointB: glm.ReadonlyVec3,
    inColor: glm.ReadonlyVec3 | glm.ReadonlyVec4
  ) {
    this._vertices.push(inPointA[0], inPointA[1], inPointA[2]);
    this._vertices.push(inColor[0], inColor[1], inColor[2], inColor[3] ?? 1);

    this._vertices.push(inPointB[0], inPointB[1], inPointB[2]);
    this._vertices.push(inColor[0], inColor[1], inColor[2], inColor[3] ?? 1);
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
