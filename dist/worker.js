'use strict';

const chunkLogicSize = 10;
const chunkThreshold = 0.5;

const getOffset = (fValue1, fValue2, fValueDesired) => {
    const fDelta = fValue2 - fValue1;
    if (fDelta === 0)
        return 0.5;
    return (fValueDesired - fValue1) / fDelta;
};
const _getVectorMagnitude = (x, y, z) => {
    return Math.sqrt(x * x + y * y + z * z);
};
const _getNormalizeVector = (x, y, z) => {
    const length = _getVectorMagnitude(x, y, z);
    if (length === 0) {
        return [x, y, z];
    }
    const scale = 1 / length;
    return [x * scale, y * scale, z * scale];
};
// export const computeTriangleNormalToBuffer = (inBuf: Float32Array): void => {
//   const Ux = inBuf[6 * 1 + 0] - inBuf[6 * 0 + 0];
//   const Uy = inBuf[6 * 1 + 1] - inBuf[6 * 0 + 1];
//   const Uz = inBuf[6 * 1 + 2] - inBuf[6 * 0 + 2];
//   const Vx = inBuf[6 * 2 + 0] - inBuf[6 * 0 + 0];
//   const Vy = inBuf[6 * 2 + 1] - inBuf[6 * 0 + 1];
//   const Vz = inBuf[6 * 2 + 2] - inBuf[6 * 0 + 2];
//   let normX = Uy * Vz - Uz * Vy;
//   let normY = Uz * Vx - Ux * Vz;
//   let normZ = Ux * Vy - Uy * Vx;
//   const length = _getVectorMagnitude(normX, normY, normZ);
//   if (length > 0) {
//     const scale = 1 / length;
//     normX *= scale;
//     normY *= scale;
//     normZ *= scale;
//   }
//   inBuf[6 * 0 + 3] = normX;
//   inBuf[6 * 0 + 4] = normX;
//   inBuf[6 * 0 + 5] = normX;
//   inBuf[6 * 1 + 3] = normX;
//   inBuf[6 * 1 + 4] = normX;
//   inBuf[6 * 1 + 5] = normX;
//   inBuf[6 * 2 + 3] = normX;
//   inBuf[6 * 2 + 4] = normX;
//   inBuf[6 * 2 + 5] = normX;
//   // return [x * scale, y * scale, z * scale];
//   // return _getNormalizeVector(normX, normY, normZ);
// };
// export class CubeData {
//   private _size: number;
//   private _buffer: Float32Array;
//   constructor(inBuffer: Float32Array, inSize: number) {
//     this._size = inSize;
//     this._buffer = inBuffer;
//   }
//   set(inX: number, inY: number, inZ: number, inValue: number) {
//     this._buffer[this._getIndex(inX, inY, inZ)] = inValue;
//   }
//   get(inX: number, inY: number, inZ: number): number {
//     return this._buffer[this._getIndex(inX, inY, inZ)];
//   }
//   private _getIndex(inX: number, inY: number, inZ: number) {
//     return inZ * this._size * this._size + inY * this._size + inX;
//   }
// }

// common
const a2fVertexOffset = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1]
];
class AbstractMarchingAlgorithm {
    constructor(inChunkSize, inThreshold) {
        this._stepPos = [0, 0, 0];
        this._chunkSize = inChunkSize;
        this._threshold = inThreshold;
        this._stepSize = 1.0 / this._chunkSize;
    }
    _getSample(x, y, z) {
        return this._onSampleCallback(this._stepPos[0] + x, this._stepPos[1] + y, this._stepPos[2] + z);
    }
    _getNormal(fX, fY, fZ) {
        const offset = this._stepSize * 0.1;
        const nX = this._getSample(fX - offset, fY, fZ);
        const pX = this._getSample(fX + offset, fY, fZ);
        const nY = this._getSample(fX, fY - offset, fZ);
        const pY = this._getSample(fX, fY + offset, fZ);
        const nZ = this._getSample(fX, fY, fZ - offset);
        const pZ = this._getSample(fX, fY, fZ + offset);
        return _getNormalizeVector(nX - pX, nY - pY, nZ - pZ);
    }
    _getNormalToBuf(fX, fY, fZ, inBuf, inIndex) {
        const offset = this._stepSize * 0.1;
        const nX = this._getSample(fX - offset, fY, fZ);
        const pX = this._getSample(fX + offset, fY, fZ);
        const nY = this._getSample(fX, fY - offset, fZ);
        const pY = this._getSample(fX, fY + offset, fZ);
        const nZ = this._getSample(fX, fY, fZ - offset);
        const pZ = this._getSample(fX, fY, fZ + offset);
        let normX = nX - pX;
        let normY = nY - pY;
        let normZ = nZ - pZ;
        const length = _getVectorMagnitude(normX, normY, normZ);
        if (length > 0) {
            const scale = 1 / length;
            normX *= scale;
            normY *= scale;
            normZ *= scale;
        }
        const start1 = 3 * inIndex;
        const start2 = start1 + 3;
        const start3 = start2 + 3;
        inBuf[start1 + 0] = inBuf[start2 + 0] = inBuf[start3 + 0] = normX;
        inBuf[start1 + 1] = inBuf[start2 + 1] = inBuf[start3 + 1] = normY;
        inBuf[start1 + 2] = inBuf[start2 + 2] = inBuf[start3 + 2] = normZ;
    }
}

// cube
const a2iEdgeConnection = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7]
];
// cube
const a2fEdgeDirection = [
    [1, 0, 0],
    [0, 1, 0],
    [-1, 0, 0],
    [0, -1, 0],
    [1, 0, 0],
    [0, 1, 0],
    [-1, 0, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1],
    [0, 0, 1]
];
// cube
const a2iTriangleConnectionTable = [
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1],
    [3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1],
    [3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1],
    [3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1],
    [9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1],
    [9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
    [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1],
    [8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1],
    [9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
    [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1],
    [3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1],
    [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1],
    [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1],
    [4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
    [5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1],
    [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1],
    [9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
    [0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
    [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1],
    [10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1],
    [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1],
    [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1],
    [5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1],
    [9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1],
    [0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1],
    [1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1],
    [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1],
    [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1],
    [2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1],
    [7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1],
    [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1],
    [11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1],
    [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
    [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
    [11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
    [1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1],
    [9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1],
    [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1],
    [2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
    [0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
    [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1],
    [6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1],
    [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1],
    [6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1],
    [5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1],
    [1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
    [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1],
    [6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1],
    [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1],
    [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
    [3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
    [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1],
    [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1],
    [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
    [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1],
    [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
    [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
    [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1],
    [10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1],
    [10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1],
    [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1],
    [1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1],
    [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1],
    [0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1],
    [10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1],
    [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1],
    [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
    [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1],
    [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
    [3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1],
    [6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1],
    [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1],
    [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1],
    [10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1],
    [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1],
    [7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1],
    [7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1],
    [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1],
    [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1],
    [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1],
    [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1],
    [0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1],
    [7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
    [10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
    [2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
    [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1],
    [7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1],
    [2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1],
    [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1],
    [10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1],
    [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1],
    [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1],
    [7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1],
    [6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1],
    [8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1],
    [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1],
    [6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1],
    [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1],
    [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1],
    [8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1],
    [0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1],
    [1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1],
    [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1],
    [10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1],
    [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1],
    [10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
    [5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
    [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1],
    [9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
    [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1],
    [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1],
    [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1],
    [7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1],
    [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1],
    [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1],
    [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1],
    [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1],
    [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1],
    [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1],
    [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1],
    [6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1],
    [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1],
    [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1],
    [6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1],
    [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1],
    [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1],
    [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1],
    [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1],
    [9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1],
    [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1],
    [1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1],
    [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1],
    [0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1],
    [5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1],
    [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1],
    [11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1],
    [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1],
    [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1],
    [2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1],
    [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1],
    [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1],
    [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1],
    [1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1],
    [9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1],
    [9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1],
    [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1],
    [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1],
    [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1],
    [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1],
    [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1],
    [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1],
    [9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1],
    [5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1],
    [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1],
    [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1],
    [8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1],
    [0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1],
    [9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1],
    [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1],
    [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1],
    [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1],
    [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1],
    [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1],
    [11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1],
    [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1],
    [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1],
    [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1],
    [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1],
    [1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1],
    [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1],
    [4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1],
    [0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1],
    [3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1],
    [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1],
    [0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1],
    [9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1],
    [1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]
];
// cube
const aiCubeEdgeFlags = new Int32Array([
    0x000, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905, 0xa0f,
    0xb06, 0xc0a, 0xd03, 0xe09, 0xf00, 0x190, 0x099, 0x393, 0x29a, 0x596, 0x49f,
    0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90, 0x230,
    0x339, 0x033, 0x13a, 0x636, 0x73f, 0x435, 0x53c, 0xa3c, 0xb35, 0x83f, 0x936,
    0xe3a, 0xf33, 0xc39, 0xd30, 0x3a0, 0x2a9, 0x1a3, 0x0aa, 0x7a6, 0x6af, 0x5a5,
    0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0, 0x460, 0x569,
    0x663, 0x76a, 0x066, 0x16f, 0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a,
    0x963, 0xa69, 0xb60, 0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0x0ff, 0x3f5, 0x2fc,
    0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0, 0x650, 0x759, 0x453,
    0x55a, 0x256, 0x35f, 0x055, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53,
    0x859, 0x950, 0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0x0cc, 0xfcc,
    0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0, 0x8c0, 0x9c9, 0xac3, 0xbca,
    0xcc6, 0xdcf, 0xec5, 0xfcc, 0x0cc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9,
    0x7c0, 0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c, 0x15c, 0x055,
    0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650, 0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6,
    0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5, 0x0ff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
    0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f,
    0x066, 0x76a, 0x663, 0x569, 0x460, 0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af,
    0xaa5, 0xbac, 0x4ac, 0x5a5, 0x6af, 0x7a6, 0x0aa, 0x1a3, 0x2a9, 0x3a0, 0xd30,
    0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636,
    0x13a, 0x033, 0x339, 0x230, 0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895,
    0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x099, 0x190, 0xf00, 0xe09,
    0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605, 0x50f, 0x406, 0x30a,
    0x203, 0x109, 0x000
]);

class MarchingCube extends AbstractMarchingAlgorithm {
    constructor() {
        super(...arguments);
        this._afCubeValue = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
        this._asEdgeVertex = new Float32Array(12 * 3);
        this._asEdgeNorm = new Float32Array(12 * 3);
    }
    generate(inPos, 
    // inCubeData: utilities.CubeData,
    onVertexCallback, onSampleCallback) {
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
    _marchCubeSingle(iX, iY, iZ) {
        /// add chunk pos here
        const fX = iX * this._stepSize;
        const fY = iY * this._stepSize;
        const fZ = iZ * this._stepSize;
        /// Make a local copy of the values at the cube's corners
        for (let iVertex = 0; iVertex < 8; ++iVertex) {
            const currOffset = a2fVertexOffset[iVertex];
            this._afCubeValue[iVertex] = this._getSample(fX + currOffset[0] * this._stepSize, fY + currOffset[1] * this._stepSize, fZ + currOffset[2] * this._stepSize);
        }
        //Find which vertices are inside of the surface and which are outside
        let iFlagIndex = 0 | 0;
        for (let iVertexTest = 0 | 0; iVertexTest < 8; ++iVertexTest)
            if (this._afCubeValue[iVertexTest] <= this._threshold)
                iFlagIndex |= 1 << iVertexTest;
        //Find which edges are intersected by the surface
        const iEdgeFlags = aiCubeEdgeFlags[iFlagIndex];
        //If the cube is entirely inside or outside of the surface, then there will be no intersections
        if (iEdgeFlags == 0) {
            return;
        }
        //Find the point of intersection of the surface with each edge
        //Then find the normal to the surface at those points
        for (let iEdge = 0; iEdge < 12; ++iEdge) {
            //if there is an intersection on this edge
            if (iEdgeFlags & (1 << iEdge)) {
                const currEdge = a2iEdgeConnection[iEdge];
                const fOffset = getOffset(this._afCubeValue[currEdge[0]], this._afCubeValue[currEdge[1]], this._threshold);
                const currOffset = a2fVertexOffset[currEdge[0]];
                const currEdgeDir = a2fEdgeDirection[iEdge];
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
                this._getNormalToBuf(this._asEdgeVertex[iEdge * 3 + 0], this._asEdgeVertex[iEdge * 3 + 1], this._asEdgeVertex[iEdge * 3 + 2], this._asEdgeNorm, iEdge);
            }
        }
        const vertex = [0, 0, 0];
        const normal = [0, 0, 0];
        //Draw the triangles that were found. There can be up to five per cube
        for (let iTriangle = 0; iTriangle < 5; ++iTriangle) {
            const currTable = a2iTriangleConnectionTable[iFlagIndex];
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
                this._onVertexCallback(vertex, normal);
            } // for (iCorner = [...]
        } // for (iTriangle = [...]
    }
}

const k_grad3 = [
    [1, 1, 0],
    [-1, 1, 0],
    [1, -1, 0],
    [-1, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [1, 0, -1],
    [-1, 0, -1],
    [0, 1, 1],
    [0, -1, 1],
    [0, 1, -1],
    [0, -1, -1]
];
class ClassicalNoise {
    constructor(def) {
        this._octaves = 1;
        this._frequency = 1.0;
        this._amplitude = 0.5;
        this._octaves = def.octaves || 1;
        this._frequency = def.frequency || 1;
        this._amplitude = def.amplitude || 0.5;
        const randomCallback = def.randomCallback || (() => Math.random());
        const k_sampleSize = 256;
        const k_sampleDoubleSize = k_sampleSize * 2;
        const initialP = new Uint8Array(k_sampleSize);
        for (let ii = 0; ii < k_sampleSize; ++ii)
            initialP[ii] = Math.floor(randomCallback() * k_sampleSize) | 0;
        // To remove the need for index wrapping, double the permutation table length
        this._perm = new Uint8Array(k_sampleDoubleSize);
        for (let ii = 0; ii < k_sampleDoubleSize; ++ii)
            this._perm[ii] = initialP[ii & (k_sampleSize - 1)] | 0;
    }
    getNoise(inX, inY, inZ) {
        let result = 0.0;
        let amp = this._amplitude;
        let x = inX * this._frequency;
        let y = inY * this._frequency;
        let z = inZ * this._frequency;
        for (let ii = 0; ii < this._octaves; ++ii) {
            result += this._noise(x, y, z) * amp;
            x *= 2.0;
            y *= 2.0;
            z *= 2.0;
            amp *= 0.5;
        }
        return result;
    }
    _dot(i, x, y, z) {
        const g = k_grad3[i];
        return g[0] * x + g[1] * y + g[2] * z;
    }
    _mix(a, b, t) {
        return (1 - t) * a + t * b;
    }
    _fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    _noise(x, y, z) {
        // Find unit grid cell containing point
        let X = Math.floor(x) | 0;
        let Y = Math.floor(y) | 0;
        let Z = Math.floor(z) | 0;
        // Get relative xyz coordinates of point within that cell
        x = x - X;
        y = y - Y;
        z = z - Z;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = (X & 255) | 0;
        Y = (Y & 255) | 0;
        Z = (Z & 255) | 0;
        // Calculate a set of eight hashed gradient indices
        const gi000 = this._perm[X + this._perm[Y + this._perm[Z]]] % 12 | 0;
        const gi001 = this._perm[X + this._perm[Y + this._perm[Z + 1]]] % 12 | 0;
        const gi010 = this._perm[X + this._perm[Y + 1 + this._perm[Z]]] % 12 | 0;
        const gi011 = this._perm[X + this._perm[Y + 1 + this._perm[Z + 1]]] % 12 | 0;
        const gi100 = this._perm[X + 1 + this._perm[Y + this._perm[Z]]] % 12 | 0;
        const gi101 = this._perm[X + 1 + this._perm[Y + this._perm[Z + 1]]] % 12 | 0;
        const gi110 = this._perm[X + 1 + this._perm[Y + 1 + this._perm[Z]]] % 12 | 0;
        const gi111 = this._perm[X + 1 + this._perm[Y + 1 + this._perm[Z + 1]]] % 12 | 0;
        // Calculate noise contributions from each of the eight corners
        const n000 = this._dot(gi000, x, y, z);
        const n100 = this._dot(gi100, x - 1, y, z);
        const n010 = this._dot(gi010, x, y - 1, z);
        const n110 = this._dot(gi110, x - 1, y - 1, z);
        const n001 = this._dot(gi001, x, y, z - 1);
        const n101 = this._dot(gi101, x - 1, y, z - 1);
        const n011 = this._dot(gi011, x, y - 1, z - 1);
        const n111 = this._dot(gi111, x - 1, y - 1, z - 1);
        // Compute the fade curve value for each of x, y, z
        const u = this._fade(x);
        const v = this._fade(y);
        const w = this._fade(z);
        // Interpolate along x the contributions from each of the corners
        const nx00 = this._mix(n000, n100, u);
        const nx01 = this._mix(n001, n101, u);
        const nx10 = this._mix(n010, n110, u);
        const nx11 = this._mix(n011, n111, u);
        // Interpolate the four results along y
        const nxy0 = this._mix(nx00, nx10, v);
        const nxy1 = this._mix(nx01, nx11, v);
        // Interpolate the two last results along z
        const nxyz = this._mix(nxy0, nxy1, w);
        return nxyz;
    }
}

const RAND_MAX = 2147483648 | 0;
class DeterministicRng {
    constructor() {
        this._seed = 1 | 0;
    }
    random() {
        if (this._seed == 0)
            this._seed = 123459876 | 0;
        const hi = (this._seed / 127773) | 0;
        const lo = this._seed % 127773 | 0;
        let x = (16807 * lo - 2836 * hi) | 0;
        if (x < 0)
            x += 0x7fffffff | 0;
        this._seed = x;
        return (x % (RAND_MAX + 1)) / -RAND_MAX;
    }
    setSeed(inSeed) {
        this._seed = inSeed | 0;
    }
}

const tmpRng = new DeterministicRng();
tmpRng.setSeed(1);
const simplexNoiseInstance = new ClassicalNoise({
    randomCallback: () => tmpRng.random(),
    octaves: 1,
    frequency: 1,
    amplitude: 0.5
});
const _clamp = (inVal, inMin, inMax) => {
    return Math.min(Math.max(inVal, inMin), inMax);
};
const _lerp = (inValA, inValB, inRatio) => {
    return inValA + (inValB - inValA) * _clamp(inRatio, 0, 1);
};
const _getLength = (inX, inY, inZ) => {
    return Math.sqrt(inX * inX + inY * inY + inZ * inZ);
};
const _getRadius = (inX, inY, inZ, inRadius) => {
    return _getLength(inX, inY, inZ) / inRadius;
};
const k_originRadius = 1.25;
const k_originRange = 2;
const onGenericSampleCallback = (x, y, z) => {
    return simplexNoiseInstance.getNoise(x, y, z) + 0.5; // [0..1]
};
const onOriginSampleCallback = (inX, inY, inZ) => {
    const noiseValue = onGenericSampleCallback(inX, inY, inZ);
    const lerpCoef = 1 - _getRadius(inX, inY, inZ, k_originRadius);
    return _lerp(noiseValue, 0, lerpCoef);
};
const marchingCubeInstance = new MarchingCube(chunkLogicSize, chunkThreshold);
const myself = self; // well, that's apparently needed...
const onMainScriptMessage = (event) => {
    const { indexPosition, realPosition, geometryFloat32buffer, geometryBufferSize } = event.data;
    //
    // generate
    const logicOrigin = [
        indexPosition[0] * chunkLogicSize,
        indexPosition[1] * chunkLogicSize,
        indexPosition[2] * chunkLogicSize
    ];
    let bufIndex = 0;
    const onVertexCallback = (vertex, normal) => {
        // should never happen, but just in case
        if (bufIndex + 6 > geometryBufferSize) {
            return;
        }
        // conveniently setting up the buffer to work with the receiving geometry
        geometryFloat32buffer[bufIndex++] = vertex[0];
        geometryFloat32buffer[bufIndex++] = vertex[1];
        geometryFloat32buffer[bufIndex++] = vertex[2];
        geometryFloat32buffer[bufIndex++] = normal[0];
        geometryFloat32buffer[bufIndex++] = normal[1];
        geometryFloat32buffer[bufIndex++] = normal[2];
    };
    const isOutsideTheOrigin = indexPosition[0] < -k_originRange ||
        indexPosition[0] > +k_originRange ||
        indexPosition[1] < -k_originRange ||
        indexPosition[1] > +k_originRange ||
        indexPosition[2] < -k_originRange ||
        indexPosition[2] > +k_originRange;
    const onSampleCallback = isOutsideTheOrigin
        ? onGenericSampleCallback
        : onOriginSampleCallback;
    marchingCubeInstance.generate(logicOrigin, onVertexCallback, onSampleCallback);
    //
    const toSend = {
        indexPosition,
        realPosition,
        geometryFloat32buffer,
        geometryBufferSize,
        sizeUsed: bufIndex,
        time: event.data.time
    };
    myself.postMessage(toSend, [
        // we now transfer the ownership of the vertices buffer
        geometryFloat32buffer.buffer
    ]);
};
myself.addEventListener('message', onMainScriptMessage, false);
