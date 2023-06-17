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

export class MarchingCube
  extends AbstractMarchingAlgorithm
  implements IMarchingAlgorithm
{
  private _afCubeValue = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
  // private _asEdgeVertex: Vec3[] = [
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0]
  // ];
  private _asEdgeVertex = new Float32Array(12 * 3);
  // private _asEdgeNorm: Vec3[] = [
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0],
  //   [0, 0, 0]
  // ];
  private _asEdgeNorm = new Float32Array(12 * 3);
  generate(
    inPos: Vec3,
    inCubeData: utilities.CubeData,
    onVertexCallback: OnVertexCallback,
    onSampleCallback: OnSampleCallback
  ): void {
    this._onVertexCallback = onVertexCallback;
    this._onSampleCallback = onSampleCallback;
    // this._currentPos[0] = inPos[0];
    // this._currentPos[1] = inPos[1];
    // this._currentPos[2] = inPos[2];
    this._stepPos[0] = inPos[0] * this._stepSize;
    this._stepPos[1] = inPos[1] * this._stepSize;
    this._stepPos[2] = inPos[2] * this._stepSize;

    for (let iX = 0; iX <= this._chunkSize + 1; ++iX)
      for (let iY = 0; iY <= this._chunkSize + 1; ++iY)
        for (let iZ = 0; iZ <= this._chunkSize + 1; ++iZ) {
          /// add chunk pos here
          const fX = iX * this._stepSize;
          const fY = iY * this._stepSize;
          const fZ = iZ * this._stepSize;

          const currVal = this._getSample(fX, fY, fZ);

          inCubeData.set(iX, iY, iZ, currVal);
        }

    for (let iX = 0; iX <= this._chunkSize; ++iX)
      for (let iY = 0; iY <= this._chunkSize; ++iY)
        for (let iZ = 0; iZ <= this._chunkSize; ++iZ)
          this._marchCubeSingle(iX, iY, iZ, inCubeData);
  }

  private _marchCubeSingle(
    iX: number,
    iY: number,
    iZ: number,
    inCubeData: utilities.CubeData
  ): void {
    /// add chunk pos here
    const fX = iX * this._stepSize;
    const fY = iY * this._stepSize;
    const fZ = iZ * this._stepSize;

    /// Make a local copy of the values at the cube's corners
    for (let iVertex = 0; iVertex < 8; ++iVertex) {
      const currOffset = a2fVertexOffset[iVertex];

      this._afCubeValue[iVertex] = inCubeData.get(
        iX + currOffset[0],
        iY + currOffset[1],
        iZ + currOffset[2]
      );

      // this._afCubeValue[iVertex] = this._getSample(
      //   fX + currOffset[0] * this._stepSize,
      //   fY + currOffset[1] * this._stepSize,
      //   fZ + currOffset[2] * this._stepSize
      // );
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
        const currEdge = data.a2iEdgeConnection[iEdge];

        const fOffset = utilities.getOffset(
          this._afCubeValue[currEdge[0]],
          this._afCubeValue[currEdge[1]],
          this._threshold
        );

        const currOffset = a2fVertexOffset[currEdge[0]];
        const currEdgeDir = data.a2fEdgeDirection[iEdge];

        // const currVertex = this._asEdgeVertex[iEdge];
        // currVertex[0] = fX + (currOffset[0] + fOffset * currEdgeDir[0]) * this._stepSize;
        // currVertex[1] = fY + (currOffset[1] + fOffset * currEdgeDir[1]) * this._stepSize;
        // currVertex[2] = fZ + (currOffset[2] + fOffset * currEdgeDir[2]) * this._stepSize;
        this._asEdgeVertex[iEdge * 3 + 0] =
          fX + (currOffset[0] + fOffset * currEdgeDir[0]) * this._stepSize;
        this._asEdgeVertex[iEdge * 3 + 1] =
          fY + (currOffset[1] + fOffset * currEdgeDir[1]) * this._stepSize;
        this._asEdgeVertex[iEdge * 3 + 2] =
          fZ + (currOffset[2] + fOffset * currEdgeDir[2]) * this._stepSize;

        // this._asEdgeNorm[iEdge] = this._getNormal(
        //   this._asEdgeVertex[iEdge * 3 + 0],
        //   this._asEdgeVertex[iEdge * 3 + 1],
        //   this._asEdgeVertex[iEdge * 3 + 2]
        // );
        this._getNormalToBuf(
          this._asEdgeVertex[iEdge * 3 + 0],
          this._asEdgeVertex[iEdge * 3 + 1],
          this._asEdgeVertex[iEdge * 3 + 2],
          // this._asEdgeNorm.slice(iEdge),
          this._asEdgeNorm,
          iEdge
        );
      }
    }

    const vertex: Vec3 = [0, 0, 0];
    const normal: Vec3 = [0, 0, 0];

    //Draw the triangles that were found. There can be up to five per cube
    for (let iTriangle = 0; iTriangle < 5; ++iTriangle) {
      const currTable = data.a2iTriangleConnectionTable[iFlagIndex];

      if (currTable[3 * iTriangle] < 0) {
        break;
      }

      for (let iCorner = 0; iCorner < 3; ++iCorner) {
        const iVertex = currTable[3 * iTriangle + iCorner];

        //

        // const vertex = this._asEdgeVertex[iVertex];
        vertex[0] = this._asEdgeVertex[iVertex * 3 + 0];
        vertex[1] = this._asEdgeVertex[iVertex * 3 + 1];
        vertex[2] = this._asEdgeVertex[iVertex * 3 + 2];
        // const normal = this._asEdgeNorm[iVertex];
        normal[0] = this._asEdgeNorm[iVertex * 3 + 0];
        normal[1] = this._asEdgeNorm[iVertex * 3 + 1];
        normal[2] = this._asEdgeNorm[iVertex * 3 + 2];

        //

        this._onVertexCallback!(vertex, normal);
      } // for (iCorner = [...]
    } // for (iTriangle = [...]
  }
}
