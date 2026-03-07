import { Vec3 } from './internals/types';
import * as utilities from './internals/utilities';

import {
  a2fVertexOffset,
  OnVertexCallback,
  IMarchingAlgorithm,
  AbstractMarchingAlgorithm,
  OnSampleCallback
} from './internals/MarchingAlgorithm';

import * as data from './MarchingCubeData';

const k_vertex = new Float32Array([0, 0, 0]);
const k_normal = new Float32Array([0, 0, 0]);

export class MarchingCube
  extends AbstractMarchingAlgorithm
  implements IMarchingAlgorithm
{
  private _afCubeValue = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
  private _asEdgeVertex = new Float32Array(12 * 3);
  private _asEdgeNorm = new Float32Array(12 * 3);
  generate(
    inPos: Vec3,
    // inCubeData: utilities.CubeData,
    onVertexCallback: OnVertexCallback,
    onSampleCallback: OnSampleCallback
  ): void {
    this._onVertexCallback = onVertexCallback;
    this._onSampleCallback = onSampleCallback;
    this._stepPos[0] = inPos[0] * this._stepSize;
    this._stepPos[1] = inPos[1] * this._stepSize;
    this._stepPos[2] = inPos[2] * this._stepSize;

    for (let iX = 0; iX <= this._chunkSize; ++iX)
      for (let iY = 0; iY <= this._chunkSize; ++iY)
        for (let iZ = 0; iZ <= this._chunkSize; ++iZ)
          this._marchCubeSingle(iX, iY, iZ);
  }

  private _marchCubeSingle(iX: number, iY: number, iZ: number): void {
    /// add chunk pos here
    const fX = iX * this._stepSize;
    const fY = iY * this._stepSize;
    const fZ = iZ * this._stepSize;

    /// Make a local copy of the values at the cube's corners
    for (let iVertex = 0; iVertex < 8; ++iVertex) {
      this._afCubeValue[iVertex] = this._getSample(
        fX + a2fVertexOffset[iVertex * 3 + 0] * this._stepSize,
        fY + a2fVertexOffset[iVertex * 3 + 1] * this._stepSize,
        fZ + a2fVertexOffset[iVertex * 3 + 2] * this._stepSize
      );
    }

    //Find which vertices are inside of the surface and which are outside
    let iFlagIndex = 0 | 0;
    for (let iVertexTest = 0 | 0; iVertexTest < 8; ++iVertexTest)
      if (this._afCubeValue[iVertexTest] <= this._threshold)
        iFlagIndex |= 1 << iVertexTest;

    //Find which edges are intersected by the surface
    const iEdgeFlags = data.aiCubeEdgeFlags[iFlagIndex];

    //If the cube is entirely inside or outside of the surface, then there will be no intersections
    if (iEdgeFlags == 0) {
      return;
    }

    //Find the point of intersection of the surface with each edge
    //Then find the normal to the surface at those points
    for (let iEdge = 0; iEdge < 12; ++iEdge) {
      //if there is an intersection on this edge
      if (iEdgeFlags & (1 << iEdge)) {
        // const currEdge = data.a2iEdgeConnection[iEdge];

        const fOffset = utilities.getOffset(
          this._afCubeValue[data.a2iEdgeConnection[iEdge * 2 + 0]],
          this._afCubeValue[data.a2iEdgeConnection[iEdge * 2 + 1]],
          this._threshold
        );

        const currOffsetX = a2fVertexOffset[data.a2iEdgeConnection[iEdge * 2 + 0] * 3 + 0];
        const currOffsetY = a2fVertexOffset[data.a2iEdgeConnection[iEdge * 2 + 0] * 3 + 1];
        const currOffsetZ = a2fVertexOffset[data.a2iEdgeConnection[iEdge * 2 + 0] * 3 + 2];
        // const currEdgeDir = data.a2fEdgeDirection[iEdge];

        // const currVertex = this._asEdgeVertex[iEdge];
        // currVertex[0] = fX + (currOffset[0] + fOffset * currEdgeDir[0]) * this._stepSize;
        // currVertex[1] = fY + (currOffset[1] + fOffset * currEdgeDir[1]) * this._stepSize;
        // currVertex[2] = fZ + (currOffset[2] + fOffset * currEdgeDir[2]) * this._stepSize;
        this._asEdgeVertex[iEdge * 3 + 0] =
          fX + (currOffsetX + fOffset * data.a2fEdgeDirection[iEdge * 3 + 0]) * this._stepSize;
        this._asEdgeVertex[iEdge * 3 + 1] =
          fY + (currOffsetY + fOffset * data.a2fEdgeDirection[iEdge * 3 + 1]) * this._stepSize;
        this._asEdgeVertex[iEdge * 3 + 2] =
          fZ + (currOffsetZ + fOffset * data.a2fEdgeDirection[iEdge * 3 + 2]) * this._stepSize;

        // this._asEdgeNorm[iEdge] = this._getNormal(
        //   this._asEdgeVertex[iEdge * 3 + 0],
        //   this._asEdgeVertex[iEdge * 3 + 1],
        //   this._asEdgeVertex[iEdge * 3 + 2]
        // );
        this._getNormalToBuf(
          this._asEdgeVertex[iEdge * 3 + 0],
          this._asEdgeVertex[iEdge * 3 + 1],
          this._asEdgeVertex[iEdge * 3 + 2],
          this._asEdgeNorm,
          iEdge
        );
      }
    }

    //Draw the triangles that were found. There can be up to five per cube
    for (let iTriangle = 0; iTriangle < 5; ++iTriangle) {

      if (data.a2iTriangleConnectionTable[iFlagIndex * 16 + iTriangle * 3] < 0) {
        break;
      }

      for (let iCorner = 0; iCorner < 3; ++iCorner) {
        const iVertex = data.a2iTriangleConnectionTable[iFlagIndex * 16 + iTriangle * 3 + iCorner];

        //

        // const vertex = this._asEdgeVertex[iVertex];
        k_vertex[0] = this._asEdgeVertex[iVertex * 3 + 0];
        k_vertex[1] = this._asEdgeVertex[iVertex * 3 + 1];
        k_vertex[2] = this._asEdgeVertex[iVertex * 3 + 2];
        // const normal = this._asEdgeNorm[iVertex];
        k_normal[0] = this._asEdgeNorm[iVertex * 3 + 0];
        k_normal[1] = this._asEdgeNorm[iVertex * 3 + 1];
        k_normal[2] = this._asEdgeNorm[iVertex * 3 + 2];

        //

        this._onVertexCallback!(k_vertex, k_normal);
      } // for (iCorner = [...]
    } // for (iTriangle = [...]


  }
}
