
import { Vec2, Vec3, Vec4, utilities, a2fVertexOffset, OnVertexCallback, IMarchingAlgorithm, AbstractMarchingAlgorithm} from "./internals/MarchingAlgorithm"

type Vec7 = [number, number, number, number, number, number, number];

// tetra
const a2iTetrahedronEdgeConnection: Vec2[] = [
  [0, 1],
  [1, 2],
  [2, 0],
  [0, 3],
  [1, 3],
  [2, 3]
];

// tetra
const a2iTetrahedronsInACube: Vec4[] = [
  [0, 5, 1, 6],
  [0, 1, 2, 6],
  [0, 2, 3, 6],
  [0, 3, 7, 6],
  [0, 7, 4, 6],
  [0, 4, 5, 6]
];

// tetra
const aiTetrahedronEdgeFlags = [
  0x00, 0x0d, 0x13, 0x1e, 0x26, 0x2b, 0x35, 0x38, 0x38, 0x35, 0x2b, 0x26, 0x1e,
  0x13, 0x0d, 0x00
];

// tetra
const a2iTetrahedronTriangles: Vec7[] = [
  [-1, -1, -1, -1, -1, -1, -1],
  [0, 3, 2, -1, -1, -1, -1],
  [0, 1, 4, -1, -1, -1, -1],
  [1, 4, 2, 2, 4, 3, -1],

  [1, 2, 5, -1, -1, -1, -1],
  [0, 3, 5, 0, 5, 1, -1],
  [0, 2, 5, 0, 5, 4, -1],
  [5, 4, 3, -1, -1, -1, -1],

  [3, 4, 5, -1, -1, -1, -1],
  [4, 5, 0, 5, 2, 0, -1],
  [1, 5, 0, 5, 3, 0, -1],
  [5, 2, 1, -1, -1, -1, -1],

  [3, 4, 2, 2, 4, 1, -1],
  [4, 1, 0, -1, -1, -1, -1],
  [2, 3, 0, -1, -1, -1, -1],
  [-1, -1, -1, -1, -1, -1, -1]
];

export class MarchingTetrahedron extends AbstractMarchingAlgorithm implements IMarchingAlgorithm {

  private _asEdgeVertex: Vec3[] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  private _asEdgeNorm: Vec3[] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  private _asCubePosition: Vec3[] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  generate(pos: Vec3, onVertexCallback: OnVertexCallback): void {

    if (!onVertexCallback) throw new Error('no geometry callback supplied');

    this._onVertexCallback = onVertexCallback;

    for (let iX = 0; iX <= this._chunkSize; ++iX)
      for (let iY = 0; iY <= this._chunkSize; ++iY)
        for (let iZ = 0; iZ <= this._chunkSize; ++iZ)
          this._marchTetrahedron(pos[0] + iX, pos[1] + iY, pos[2] + iZ);
  }

  private _marchTetrahedron(iX: number, iY: number, iZ: number): void {
    /// add chunk pos here
    const fX = iX * this._stepSize;
    const fY = iY * this._stepSize;
    const fZ = iZ * this._stepSize;

    // Make a local copy of the cube's corner positions
    for (let iVertex = 0; iVertex < 8; ++iVertex) {

      const currPos = this._asCubePosition[iVertex];
      const currOffset = a2fVertexOffset[iVertex];

      currPos[0] = fX + currOffset[0] * this._stepSize;
      currPos[1] = fY + currOffset[1] * this._stepSize;
      currPos[2] = fZ + currOffset[2] * this._stepSize;
    }

    const afCubeValue = [0, 0, 0, 0, 0, 0, 0, 0];

    // Make a local copy of the cube's corner values
    for (let iVertex = 0; iVertex < 8; iVertex++) {
      const currPos = this._asCubePosition[iVertex];
      afCubeValue[iVertex] = this._sampleCallback(currPos[0], currPos[1], currPos[2]);
    }

    const asTetrahedronPosition: Vec3[] = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];
    const afTetrahedronValue = [0, 0, 0, 0];

    for (let iTetrahedron = 0; iTetrahedron < 6; iTetrahedron++) {
      for (let iVertex = 0; iVertex < 4; iVertex++) {
        const iVertexInACube = a2iTetrahedronsInACube[iTetrahedron][iVertex];

        const currOutPos = asTetrahedronPosition[iVertex];
        const currInPos = this._asCubePosition[iVertexInACube];

        currOutPos[0] = currInPos[0];
        currOutPos[1] = currInPos[1];
        currOutPos[2] = currInPos[2];

        afTetrahedronValue[iVertex] = afCubeValue[iVertexInACube];
      }

      this._marchTetrahedronSingle(asTetrahedronPosition, afTetrahedronValue);
    }
  }

  private _marchTetrahedronSingle(
    pasTetrahedronPosition: Vec3[],
    pafTetrahedronValue: number[]
  ): void {

    //Find which vertices are inside of the surface and which are outside
    let iFlagIndex = 0;
    for (let iVertex = 0; iVertex < 4; iVertex++)
      if (pafTetrahedronValue[iVertex] <= this._limit)
        iFlagIndex |= 1 << iVertex;

    //Find which edges are intersected by the surface
    const iEdgeFlags = aiTetrahedronEdgeFlags[iFlagIndex];

    //If the tetrahedron is entirely inside or outside of the surface, then there will be no intersections
    if (iEdgeFlags == 0) return;

    for (let iEdge = 0; iEdge < 6; iEdge++) {
      if (iEdgeFlags & (1 << iEdge)) {
        const iVert0 = a2iTetrahedronEdgeConnection[iEdge][0];
        const iVert1 = a2iTetrahedronEdgeConnection[iEdge][1];
        const fOffset = utilities.getOffset(
          pafTetrahedronValue[iVert0],
          pafTetrahedronValue[iVert1],
          this._limit
        );
        const fInvOffset = 1.0 - fOffset;

        const currEdge = this._asEdgeVertex[iEdge];
        const posA = pasTetrahedronPosition[iVert0];
        const posB = pasTetrahedronPosition[iVert1];

        currEdge[0] = fInvOffset * posA[0] + fOffset * posB[0];
        currEdge[1] = fInvOffset * posA[1] + fOffset * posB[1];
        currEdge[2] = fInvOffset * posA[2] + fOffset * posB[2];

        this._asEdgeNorm[iEdge] = this.getNormal(
          currEdge[0],
          currEdge[1],
          currEdge[2]
        );
      }
    }

    for (let iTriangle = 0; iTriangle < 2; iTriangle++) {
      if (a2iTetrahedronTriangles[iFlagIndex][3 * iTriangle] < 0) break;

      for (let iCorner = 0; iCorner < 3; iCorner++) {
        const iVertex = a2iTetrahedronTriangles[iFlagIndex][3 * iTriangle + iCorner];

        const vertex: Vec3 = [
          this._asEdgeVertex[iVertex][0] * this._chunkSize,
          this._asEdgeVertex[iVertex][1] * this._chunkSize,
          this._asEdgeVertex[iVertex][2] * this._chunkSize
        ];

        const normal = this._asEdgeNorm[iVertex];

        if (this._onVertexCallback) {
          this._onVertexCallback(vertex, normal);
        }

      }
    }
  }

}