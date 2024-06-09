// src/main/configuration.ts
var chunkLogicSize = 8;
var chunkThreshold = 0.5;
var controllerKeyboardSensibility = Math.PI * 0.55;

// src/worker/marching-algorithms/internals/utilities.ts
var getOffset = (fValue1, fValue2, fValueDesired) => {
  const fDelta = fValue2 - fValue1;
  if (fDelta === 0)
    return 0.5;
  return (fValueDesired - fValue1) / fDelta;
};
var _getVectorMagnitude = (x, y, z) => {
  return Math.sqrt(x * x + y * y + z * z);
};
var _getNormalizeVector = (x, y, z) => {
  const length = _getVectorMagnitude(x, y, z);
  if (length === 0) {
    return [x, y, z];
  }
  const scale = 1 / length;
  return [x * scale, y * scale, z * scale];
};

// src/worker/marching-algorithms/internals/MarchingAlgorithm.ts
var a2fVertexOffset = [
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
  _chunkSize;
  _threshold;
  _onSampleCallback;
  _stepSize;
  _onVertexCallback;
  _stepPos = [0, 0, 0];
  constructor(inChunkSize, inThreshold) {
    this._chunkSize = inChunkSize;
    this._threshold = inThreshold;
    this._stepSize = 1 / this._chunkSize;
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
// src/worker/marching-algorithms/MarchingCubeData.ts
var a2iEdgeConnection = [
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
var a2fEdgeDirection = [
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
var a2iTriangleConnectionTable = [
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
var aiCubeEdgeFlags = new Int32Array([
  0,
  265,
  515,
  778,
  1030,
  1295,
  1541,
  1804,
  2060,
  2309,
  2575,
  2822,
  3082,
  3331,
  3593,
  3840,
  400,
  153,
  915,
  666,
  1430,
  1183,
  1941,
  1692,
  2460,
  2197,
  2975,
  2710,
  3482,
  3219,
  3993,
  3728,
  560,
  825,
  51,
  314,
  1590,
  1855,
  1077,
  1340,
  2620,
  2869,
  2111,
  2358,
  3642,
  3891,
  3129,
  3376,
  928,
  681,
  419,
  170,
  1958,
  1711,
  1445,
  1196,
  2988,
  2725,
  2479,
  2214,
  4010,
  3747,
  3497,
  3232,
  1120,
  1385,
  1635,
  1898,
  102,
  367,
  613,
  876,
  3180,
  3429,
  3695,
  3942,
  2154,
  2403,
  2665,
  2912,
  1520,
  1273,
  2035,
  1786,
  502,
  255,
  1013,
  764,
  3580,
  3317,
  4095,
  3830,
  2554,
  2291,
  3065,
  2800,
  1616,
  1881,
  1107,
  1370,
  598,
  863,
  85,
  348,
  3676,
  3925,
  3167,
  3414,
  2650,
  2899,
  2137,
  2384,
  1984,
  1737,
  1475,
  1226,
  966,
  719,
  453,
  204,
  4044,
  3781,
  3535,
  3270,
  3018,
  2755,
  2505,
  2240,
  2240,
  2505,
  2755,
  3018,
  3270,
  3535,
  3781,
  4044,
  204,
  453,
  719,
  966,
  1226,
  1475,
  1737,
  1984,
  2384,
  2137,
  2899,
  2650,
  3414,
  3167,
  3925,
  3676,
  348,
  85,
  863,
  598,
  1370,
  1107,
  1881,
  1616,
  2800,
  3065,
  2291,
  2554,
  3830,
  4095,
  3317,
  3580,
  764,
  1013,
  255,
  502,
  1786,
  2035,
  1273,
  1520,
  2912,
  2665,
  2403,
  2154,
  3942,
  3695,
  3429,
  3180,
  876,
  613,
  367,
  102,
  1898,
  1635,
  1385,
  1120,
  3232,
  3497,
  3747,
  4010,
  2214,
  2479,
  2725,
  2988,
  1196,
  1445,
  1711,
  1958,
  170,
  419,
  681,
  928,
  3376,
  3129,
  3891,
  3642,
  2358,
  2111,
  2869,
  2620,
  1340,
  1077,
  1855,
  1590,
  314,
  51,
  825,
  560,
  3728,
  3993,
  3219,
  3482,
  2710,
  2975,
  2197,
  2460,
  1692,
  1941,
  1183,
  1430,
  666,
  915,
  153,
  400,
  3840,
  3593,
  3331,
  3082,
  2822,
  2575,
  2309,
  2060,
  1804,
  1541,
  1295,
  1030,
  778,
  515,
  265,
  0
]);

// src/worker/marching-algorithms/MarchingCube.ts
class MarchingCube extends AbstractMarchingAlgorithm {
  constructor() {
    super(...arguments);
  }
  _afCubeValue = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
  _asEdgeVertex = new Float32Array(36);
  _asEdgeNorm = new Float32Array(36);
  generate(inPos, onVertexCallback, onSampleCallback) {
    this._onVertexCallback = onVertexCallback;
    this._onSampleCallback = onSampleCallback;
    this._stepPos[0] = inPos[0] * this._stepSize;
    this._stepPos[1] = inPos[1] * this._stepSize;
    this._stepPos[2] = inPos[2] * this._stepSize;
    for (let iX = 0;iX <= this._chunkSize; ++iX)
      for (let iY = 0;iY <= this._chunkSize; ++iY)
        for (let iZ = 0;iZ <= this._chunkSize; ++iZ)
          this._marchCubeSingle(iX, iY, iZ);
  }
  _marchCubeSingle(iX, iY, iZ) {
    const fX = iX * this._stepSize;
    const fY = iY * this._stepSize;
    const fZ = iZ * this._stepSize;
    for (let iVertex = 0;iVertex < 8; ++iVertex) {
      const currOffset = a2fVertexOffset[iVertex];
      this._afCubeValue[iVertex] = this._getSample(fX + currOffset[0] * this._stepSize, fY + currOffset[1] * this._stepSize, fZ + currOffset[2] * this._stepSize);
    }
    let iFlagIndex = 0 | 0;
    for (let iVertexTest = 0 | 0;iVertexTest < 8; ++iVertexTest)
      if (this._afCubeValue[iVertexTest] <= this._threshold)
        iFlagIndex |= 1 << iVertexTest;
    const iEdgeFlags = aiCubeEdgeFlags[iFlagIndex];
    if (iEdgeFlags == 0) {
      return;
    }
    for (let iEdge = 0;iEdge < 12; ++iEdge) {
      if (iEdgeFlags & 1 << iEdge) {
        const currEdge = a2iEdgeConnection[iEdge];
        const fOffset = getOffset(this._afCubeValue[currEdge[0]], this._afCubeValue[currEdge[1]], this._threshold);
        const currOffset = a2fVertexOffset[currEdge[0]];
        const currEdgeDir = a2fEdgeDirection[iEdge];
        this._asEdgeVertex[iEdge * 3 + 0] = fX + (currOffset[0] + fOffset * currEdgeDir[0]) * this._stepSize;
        this._asEdgeVertex[iEdge * 3 + 1] = fY + (currOffset[1] + fOffset * currEdgeDir[1]) * this._stepSize;
        this._asEdgeVertex[iEdge * 3 + 2] = fZ + (currOffset[2] + fOffset * currEdgeDir[2]) * this._stepSize;
        this._getNormalToBuf(this._asEdgeVertex[iEdge * 3 + 0], this._asEdgeVertex[iEdge * 3 + 1], this._asEdgeVertex[iEdge * 3 + 2], this._asEdgeNorm, iEdge);
      }
    }
    const vertex = [0, 0, 0];
    const normal = [0, 0, 0];
    for (let iTriangle = 0;iTriangle < 5; ++iTriangle) {
      const currTable = a2iTriangleConnectionTable[iFlagIndex];
      if (currTable[3 * iTriangle] < 0) {
        break;
      }
      for (let iCorner = 0;iCorner < 3; ++iCorner) {
        const iVertex = currTable[3 * iTriangle + iCorner];
        vertex[0] = this._asEdgeVertex[iVertex * 3 + 0];
        vertex[1] = this._asEdgeVertex[iVertex * 3 + 1];
        vertex[2] = this._asEdgeVertex[iVertex * 3 + 2];
        normal[0] = this._asEdgeNorm[iVertex * 3 + 0];
        normal[1] = this._asEdgeNorm[iVertex * 3 + 1];
        normal[2] = this._asEdgeNorm[iVertex * 3 + 2];
        this._onVertexCallback(vertex, normal);
      }
    }
  }
}
// src/worker/helpers/ClassicalNoise.ts
var k_grad3 = [
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
  _octaves = 1;
  _frequency = 1;
  _amplitude = 0.5;
  _perm;
  constructor(def) {
    this._octaves = def.octaves || 1;
    this._frequency = def.frequency || 1;
    this._amplitude = def.amplitude || 0.5;
    const randomCallback = def.randomCallback || (() => Math.random());
    const k_sampleSize = 256;
    const k_sampleDoubleSize = k_sampleSize * 2;
    const initialP = new Uint8Array(k_sampleSize);
    for (let ii = 0;ii < k_sampleSize; ++ii)
      initialP[ii] = Math.floor(randomCallback() * k_sampleSize) | 0;
    this._perm = new Uint8Array(k_sampleDoubleSize);
    for (let ii = 0;ii < k_sampleDoubleSize; ++ii)
      this._perm[ii] = initialP[ii & k_sampleSize - 1] | 0;
  }
  getNoise(inX, inY, inZ) {
    let result = 0;
    let amp = this._amplitude;
    let x = inX * this._frequency;
    let y = inY * this._frequency;
    let z = inZ * this._frequency;
    for (let ii = 0;ii < this._octaves; ++ii) {
      result += this._noise(x, y, z) * amp;
      x *= 2;
      y *= 2;
      z *= 2;
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
    let X = Math.floor(x) | 0;
    let Y = Math.floor(y) | 0;
    let Z = Math.floor(z) | 0;
    x = x - X;
    y = y - Y;
    z = z - Z;
    X = X & 255 | 0;
    Y = Y & 255 | 0;
    Z = Z & 255 | 0;
    const gi000 = this._perm[X + this._perm[Y + this._perm[Z]]] % 12 | 0;
    const gi001 = this._perm[X + this._perm[Y + this._perm[Z + 1]]] % 12 | 0;
    const gi010 = this._perm[X + this._perm[Y + 1 + this._perm[Z]]] % 12 | 0;
    const gi011 = this._perm[X + this._perm[Y + 1 + this._perm[Z + 1]]] % 12 | 0;
    const gi100 = this._perm[X + 1 + this._perm[Y + this._perm[Z]]] % 12 | 0;
    const gi101 = this._perm[X + 1 + this._perm[Y + this._perm[Z + 1]]] % 12 | 0;
    const gi110 = this._perm[X + 1 + this._perm[Y + 1 + this._perm[Z]]] % 12 | 0;
    const gi111 = this._perm[X + 1 + this._perm[Y + 1 + this._perm[Z + 1]]] % 12 | 0;
    const n000 = this._dot(gi000, x, y, z);
    const n100 = this._dot(gi100, x - 1, y, z);
    const n010 = this._dot(gi010, x, y - 1, z);
    const n110 = this._dot(gi110, x - 1, y - 1, z);
    const n001 = this._dot(gi001, x, y, z - 1);
    const n101 = this._dot(gi101, x - 1, y, z - 1);
    const n011 = this._dot(gi011, x, y - 1, z - 1);
    const n111 = this._dot(gi111, x - 1, y - 1, z - 1);
    const u = this._fade(x);
    const v = this._fade(y);
    const w = this._fade(z);
    const nx00 = this._mix(n000, n100, u);
    const nx01 = this._mix(n001, n101, u);
    const nx10 = this._mix(n010, n110, u);
    const nx11 = this._mix(n011, n111, u);
    const nxy0 = this._mix(nx00, nx10, v);
    const nxy1 = this._mix(nx01, nx11, v);
    const nxyz = this._mix(nxy0, nxy1, w);
    return nxyz;
  }
}

// src/worker/helpers/DeterministicRng.ts
var RAND_MAX = 2147483648 | 0;

class DeterministicRng {
  _seed = 1 | 0;
  random() {
    if (this._seed == 0)
      this._seed = 123459876 | 0;
    const hi = this._seed / 127773 | 0;
    const lo = this._seed % 127773 | 0;
    let x = 16807 * lo - 2836 * hi | 0;
    if (x < 0)
      x += 2147483647 | 0;
    this._seed = x;
    return x % (RAND_MAX + 1) / -RAND_MAX;
  }
  setSeed(inSeed) {
    this._seed = inSeed | 0;
  }
}

// src/worker/main.ts
var tmpRng = new DeterministicRng;
tmpRng.setSeed(1);
var simplexNoiseInstance = new ClassicalNoise({
  randomCallback: () => tmpRng.random(),
  octaves: 1,
  frequency: 1,
  amplitude: 0.5
});
var _clamp = (inVal, inMin, inMax) => {
  return Math.min(Math.max(inVal, inMin), inMax);
};
var _lerp = (inValA, inValB, inRatio) => {
  return inValA + (inValB - inValA) * _clamp(inRatio, 0, 1);
};
var _getLength = (inX, inY, inZ) => {
  return Math.sqrt(inX * inX + inY * inY + inZ * inZ);
};
var _getRadius = (inX, inY, inZ, inRadius) => {
  return _getLength(inX, inY, inZ) / inRadius;
};
var k_originRadius = 1.25;
var k_originRange = 2;
var onGenericSampleCallback = (x, y, z) => {
  return simplexNoiseInstance.getNoise(x, y, z) + 0.5;
};
var onOriginSampleCallback = (inX, inY, inZ) => {
  const noiseValue = onGenericSampleCallback(inX, inY, inZ);
  const lerpCoef = 1 - _getRadius(inX, inY, inZ, k_originRadius);
  return _lerp(noiseValue, 0, lerpCoef);
};
var marchingCubeInstance = new MarchingCube(chunkLogicSize, chunkThreshold);
var myself = self;
var onMainScriptMessage = (event) => {
  const {
    indexPosition,
    realPosition,
    geometryFloat32buffer,
    geometryBufferSize
  } = event.data;
  const logicOrigin = [
    indexPosition[0] * chunkLogicSize,
    indexPosition[1] * chunkLogicSize,
    indexPosition[2] * chunkLogicSize
  ];
  let bufIndex = 0;
  const onVertexCallback = (vertex, normal) => {
    if (bufIndex + 6 > geometryBufferSize) {
      return;
    }
    geometryFloat32buffer[bufIndex++] = vertex[0];
    geometryFloat32buffer[bufIndex++] = vertex[1];
    geometryFloat32buffer[bufIndex++] = vertex[2];
    geometryFloat32buffer[bufIndex++] = normal[0];
    geometryFloat32buffer[bufIndex++] = normal[1];
    geometryFloat32buffer[bufIndex++] = normal[2];
  };
  const isOutsideTheOrigin = indexPosition[0] < -k_originRange || indexPosition[0] > +k_originRange || indexPosition[1] < -k_originRange || indexPosition[1] > +k_originRange || indexPosition[2] < -k_originRange || indexPosition[2] > +k_originRange;
  const onSampleCallback = isOutsideTheOrigin ? onGenericSampleCallback : onOriginSampleCallback;
  marchingCubeInstance.generate(logicOrigin, onVertexCallback, onSampleCallback);
  const toSend = {
    indexPosition,
    realPosition,
    geometryFloat32buffer,
    geometryBufferSize,
    sizeUsed: bufIndex,
    time: event.data.time
  };
  myself.postMessage(toSend, [
    geometryFloat32buffer.buffer
  ]);
};
myself.addEventListener("message", onMainScriptMessage, false);

//# debugId=DF7DFF2AA7CFE07064756e2164756e21
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4vY29uZmlndXJhdGlvbi50cyIsICJzcmMvbWFpbi9jb25maWd1cmF0aW9uLnRzIiwgInNyYy93b3JrZXIvbWFyY2hpbmctYWxnb3JpdGhtcy9pbnRlcm5hbHMvdXRpbGl0aWVzLnRzIiwgInNyYy93b3JrZXIvbWFyY2hpbmctYWxnb3JpdGhtcy9pbnRlcm5hbHMvdXRpbGl0aWVzLnRzIiwgInNyYy93b3JrZXIvbWFyY2hpbmctYWxnb3JpdGhtcy9pbnRlcm5hbHMvTWFyY2hpbmdBbGdvcml0aG0udHMiLCAic3JjL3dvcmtlci9tYXJjaGluZy1hbGdvcml0aG1zL01hcmNoaW5nQ3ViZURhdGEudHMiLCAic3JjL3dvcmtlci9tYXJjaGluZy1hbGdvcml0aG1zL01hcmNoaW5nQ3ViZS50cyIsICJzcmMvd29ya2VyL2hlbHBlcnMvQ2xhc3NpY2FsTm9pc2UudHMiLCAic3JjL3dvcmtlci9oZWxwZXJzL0RldGVybWluaXN0aWNSbmcudHMiLCAic3JjL3dvcmtlci9tYWluLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWwogICAgImV4cG9ydCBjb25zdCBjaHVua0dyYXBoaWNTaXplID0gMzA7XG5leHBvcnQgY29uc3QgY2h1bmtMb2dpY1NpemUgPSA4O1xuZXhwb3J0IGNvbnN0IGNodW5rVGhyZXNob2xkID0gMC41O1xuZXhwb3J0IGNvbnN0IGNodW5rUmFuZ2UgPSAyO1xuXG5leHBvcnQgY29uc3QgY29udHJvbGxlck1vdmluZ1NwZWVkID0gMzI7XG5leHBvcnQgY29uc3QgY29udHJvbGxlck1vdXNlU2Vuc2liaWxpdHkgPSAxNTtcbmV4cG9ydCBjb25zdCBjb250cm9sbGVyS2V5Ym9hcmRTZW5zaWJpbGl0eSA9IE1hdGguUEkgKiAwLjU1O1xuZXhwb3J0IGNvbnN0IGNvbnRyb2xsZXJUb3VjaFNlbnNpYmlsaXR5ID0gMTU7XG5cbmV4cG9ydCBjb25zdCB3b3JrZXJGaWxlID0gJy4vZGlzdC93b3JrZXIuanMnO1xuZXhwb3J0IGNvbnN0IHdvcmtlclRvdGFsID0gMjtcbiIsCiAgImV4cG9ydCBjb25zdCBjaHVua0dyYXBoaWNTaXplID0gMzA7XG5leHBvcnQgY29uc3QgY2h1bmtMb2dpY1NpemUgPSA4O1xuZXhwb3J0IGNvbnN0IGNodW5rVGhyZXNob2xkID0gMC41O1xuZXhwb3J0IGNvbnN0IGNodW5rUmFuZ2UgPSAyO1xuXG5leHBvcnQgY29uc3QgY29udHJvbGxlck1vdmluZ1NwZWVkID0gMzI7XG5leHBvcnQgY29uc3QgY29udHJvbGxlck1vdXNlU2Vuc2liaWxpdHkgPSAxNTtcbmV4cG9ydCBjb25zdCBjb250cm9sbGVyS2V5Ym9hcmRTZW5zaWJpbGl0eSA9IE1hdGguUEkgKiAwLjU1O1xuZXhwb3J0IGNvbnN0IGNvbnRyb2xsZXJUb3VjaFNlbnNpYmlsaXR5ID0gMTU7XG5cbmV4cG9ydCBjb25zdCB3b3JrZXJGaWxlID0gJy4vZGlzdC93b3JrZXIuanMnO1xuZXhwb3J0IGNvbnN0IHdvcmtlclRvdGFsID0gMjtcbiIsCiAgImltcG9ydCB7IFZlYzMgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGNvbnN0IGdldE9mZnNldCA9IChcbiAgZlZhbHVlMTogbnVtYmVyLFxuICBmVmFsdWUyOiBudW1iZXIsXG4gIGZWYWx1ZURlc2lyZWQ6IG51bWJlclxuKTogbnVtYmVyID0+IHtcbiAgY29uc3QgZkRlbHRhID0gZlZhbHVlMiAtIGZWYWx1ZTE7XG5cbiAgaWYgKGZEZWx0YSA9PT0gMCkgcmV0dXJuIDAuNTtcblxuICByZXR1cm4gKGZWYWx1ZURlc2lyZWQgLSBmVmFsdWUxKSAvIGZEZWx0YTtcbn07XG5cbmV4cG9ydCBjb25zdCBfZ2V0VmVjdG9yTWFnbml0dWRlID0gKFxuICB4OiBudW1iZXIsXG4gIHk6IG51bWJlcixcbiAgejogbnVtYmVyXG4pOiBudW1iZXIgPT4ge1xuICByZXR1cm4gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeik7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0VmVjdG9yTWFnbml0dWRlID0gKHZlYzogVmVjMyk6IG51bWJlciA9PiB7XG4gIHJldHVybiBfZ2V0VmVjdG9yTWFnbml0dWRlKHZlY1swXSwgdmVjWzFdLCB2ZWNbMl0pO1xufTtcblxuZXhwb3J0IGNvbnN0IF9nZXROb3JtYWxpemVWZWN0b3IgPSAoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcik6IFZlYzMgPT4ge1xuICBjb25zdCBsZW5ndGggPSBfZ2V0VmVjdG9yTWFnbml0dWRlKHgsIHksIHopO1xuXG4gIGlmIChsZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gW3gsIHksIHpdO1xuICB9XG5cbiAgY29uc3Qgc2NhbGUgPSAxIC8gbGVuZ3RoO1xuXG4gIHJldHVybiBbeCAqIHNjYWxlLCB5ICogc2NhbGUsIHogKiBzY2FsZV07XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0Tm9ybWFsaXplVmVjdG9yID0gKHZlYzogVmVjMyk6IFZlYzMgPT4ge1xuICByZXR1cm4gX2dldE5vcm1hbGl6ZVZlY3Rvcih2ZWNbMF0sIHZlY1sxXSwgdmVjWzJdKTtcbn07XG5cbmV4cG9ydCBjb25zdCBjb21wdXRlVHJpYW5nbGVOb3JtYWwgPSAodDE6IFZlYzMsIHQyOiBWZWMzLCB0MzogVmVjMyk6IFZlYzMgPT4ge1xuICBjb25zdCBVeCA9IHQyWzBdIC0gdDFbMF07XG4gIGNvbnN0IFV5ID0gdDJbMV0gLSB0MVsxXTtcbiAgY29uc3QgVXogPSB0MlsyXSAtIHQxWzJdO1xuICBjb25zdCBWeCA9IHQzWzBdIC0gdDFbMF07XG4gIGNvbnN0IFZ5ID0gdDNbMV0gLSB0MVsxXTtcbiAgY29uc3QgVnogPSB0M1syXSAtIHQxWzJdO1xuXG4gIGNvbnN0IG5vcm1YID0gVXkgKiBWeiAtIFV6ICogVnk7XG4gIGNvbnN0IG5vcm1ZID0gVXogKiBWeCAtIFV4ICogVno7XG4gIGNvbnN0IG5vcm1aID0gVXggKiBWeSAtIFV5ICogVng7XG5cbiAgcmV0dXJuIF9nZXROb3JtYWxpemVWZWN0b3Iobm9ybVgsIG5vcm1ZLCBub3JtWik7XG59O1xuXG4vLyBleHBvcnQgY29uc3QgY29tcHV0ZVRyaWFuZ2xlTm9ybWFsVG9CdWZmZXIgPSAoaW5CdWY6IEZsb2F0MzJBcnJheSk6IHZvaWQgPT4ge1xuLy8gICBjb25zdCBVeCA9IGluQnVmWzYgKiAxICsgMF0gLSBpbkJ1Zls2ICogMCArIDBdO1xuLy8gICBjb25zdCBVeSA9IGluQnVmWzYgKiAxICsgMV0gLSBpbkJ1Zls2ICogMCArIDFdO1xuLy8gICBjb25zdCBVeiA9IGluQnVmWzYgKiAxICsgMl0gLSBpbkJ1Zls2ICogMCArIDJdO1xuLy8gICBjb25zdCBWeCA9IGluQnVmWzYgKiAyICsgMF0gLSBpbkJ1Zls2ICogMCArIDBdO1xuLy8gICBjb25zdCBWeSA9IGluQnVmWzYgKiAyICsgMV0gLSBpbkJ1Zls2ICogMCArIDFdO1xuLy8gICBjb25zdCBWeiA9IGluQnVmWzYgKiAyICsgMl0gLSBpbkJ1Zls2ICogMCArIDJdO1xuXG4vLyAgIGxldCBub3JtWCA9IFV5ICogVnogLSBVeiAqIFZ5O1xuLy8gICBsZXQgbm9ybVkgPSBVeiAqIFZ4IC0gVXggKiBWejtcbi8vICAgbGV0IG5vcm1aID0gVXggKiBWeSAtIFV5ICogVng7XG5cbi8vICAgY29uc3QgbGVuZ3RoID0gX2dldFZlY3Rvck1hZ25pdHVkZShub3JtWCwgbm9ybVksIG5vcm1aKTtcbi8vICAgaWYgKGxlbmd0aCA+IDApIHtcbi8vICAgICBjb25zdCBzY2FsZSA9IDEgLyBsZW5ndGg7XG4vLyAgICAgbm9ybVggKj0gc2NhbGU7XG4vLyAgICAgbm9ybVkgKj0gc2NhbGU7XG4vLyAgICAgbm9ybVogKj0gc2NhbGU7XG4vLyAgIH1cblxuLy8gICBpbkJ1Zls2ICogMCArIDNdID0gbm9ybVg7XG4vLyAgIGluQnVmWzYgKiAwICsgNF0gPSBub3JtWDtcbi8vICAgaW5CdWZbNiAqIDAgKyA1XSA9IG5vcm1YO1xuLy8gICBpbkJ1Zls2ICogMSArIDNdID0gbm9ybVg7XG4vLyAgIGluQnVmWzYgKiAxICsgNF0gPSBub3JtWDtcbi8vICAgaW5CdWZbNiAqIDEgKyA1XSA9IG5vcm1YO1xuLy8gICBpbkJ1Zls2ICogMiArIDNdID0gbm9ybVg7XG4vLyAgIGluQnVmWzYgKiAyICsgNF0gPSBub3JtWDtcbi8vICAgaW5CdWZbNiAqIDIgKyA1XSA9IG5vcm1YO1xuXG4vLyAgIC8vIHJldHVybiBbeCAqIHNjYWxlLCB5ICogc2NhbGUsIHogKiBzY2FsZV07XG5cbi8vICAgLy8gcmV0dXJuIF9nZXROb3JtYWxpemVWZWN0b3Iobm9ybVgsIG5vcm1ZLCBub3JtWik7XG4vLyB9O1xuXG4vLyBleHBvcnQgY2xhc3MgQ3ViZURhdGEge1xuLy8gICBwcml2YXRlIF9zaXplOiBudW1iZXI7XG4vLyAgIHByaXZhdGUgX2J1ZmZlcjogRmxvYXQzMkFycmF5O1xuXG4vLyAgIGNvbnN0cnVjdG9yKGluQnVmZmVyOiBGbG9hdDMyQXJyYXksIGluU2l6ZTogbnVtYmVyKSB7XG4vLyAgICAgdGhpcy5fc2l6ZSA9IGluU2l6ZTtcbi8vICAgICB0aGlzLl9idWZmZXIgPSBpbkJ1ZmZlcjtcbi8vICAgfVxuXG4vLyAgIHNldChpblg6IG51bWJlciwgaW5ZOiBudW1iZXIsIGluWjogbnVtYmVyLCBpblZhbHVlOiBudW1iZXIpIHtcbi8vICAgICB0aGlzLl9idWZmZXJbdGhpcy5fZ2V0SW5kZXgoaW5YLCBpblksIGluWildID0gaW5WYWx1ZTtcbi8vICAgfVxuXG4vLyAgIGdldChpblg6IG51bWJlciwgaW5ZOiBudW1iZXIsIGluWjogbnVtYmVyKTogbnVtYmVyIHtcbi8vICAgICByZXR1cm4gdGhpcy5fYnVmZmVyW3RoaXMuX2dldEluZGV4KGluWCwgaW5ZLCBpblopXTtcbi8vICAgfVxuXG4vLyAgIHByaXZhdGUgX2dldEluZGV4KGluWDogbnVtYmVyLCBpblk6IG51bWJlciwgaW5aOiBudW1iZXIpIHtcbi8vICAgICByZXR1cm4gaW5aICogdGhpcy5fc2l6ZSAqIHRoaXMuX3NpemUgKyBpblkgKiB0aGlzLl9zaXplICsgaW5YO1xuLy8gICB9XG4vLyB9XG4iLAogICJpbXBvcnQgeyBWZWMzIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBjb25zdCBnZXRPZmZzZXQgPSAoXG4gIGZWYWx1ZTE6IG51bWJlcixcbiAgZlZhbHVlMjogbnVtYmVyLFxuICBmVmFsdWVEZXNpcmVkOiBudW1iZXJcbik6IG51bWJlciA9PiB7XG4gIGNvbnN0IGZEZWx0YSA9IGZWYWx1ZTIgLSBmVmFsdWUxO1xuXG4gIGlmIChmRGVsdGEgPT09IDApIHJldHVybiAwLjU7XG5cbiAgcmV0dXJuIChmVmFsdWVEZXNpcmVkIC0gZlZhbHVlMSkgLyBmRGVsdGE7XG59O1xuXG5leHBvcnQgY29uc3QgX2dldFZlY3Rvck1hZ25pdHVkZSA9IChcbiAgeDogbnVtYmVyLFxuICB5OiBudW1iZXIsXG4gIHo6IG51bWJlclxuKTogbnVtYmVyID0+IHtcbiAgcmV0dXJuIE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldFZlY3Rvck1hZ25pdHVkZSA9ICh2ZWM6IFZlYzMpOiBudW1iZXIgPT4ge1xuICByZXR1cm4gX2dldFZlY3Rvck1hZ25pdHVkZSh2ZWNbMF0sIHZlY1sxXSwgdmVjWzJdKTtcbn07XG5cbmV4cG9ydCBjb25zdCBfZ2V0Tm9ybWFsaXplVmVjdG9yID0gKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBWZWMzID0+IHtcbiAgY29uc3QgbGVuZ3RoID0gX2dldFZlY3Rvck1hZ25pdHVkZSh4LCB5LCB6KTtcblxuICBpZiAobGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFt4LCB5LCB6XTtcbiAgfVxuXG4gIGNvbnN0IHNjYWxlID0gMSAvIGxlbmd0aDtcblxuICByZXR1cm4gW3ggKiBzY2FsZSwgeSAqIHNjYWxlLCB6ICogc2NhbGVdO1xufTtcblxuZXhwb3J0IGNvbnN0IGdldE5vcm1hbGl6ZVZlY3RvciA9ICh2ZWM6IFZlYzMpOiBWZWMzID0+IHtcbiAgcmV0dXJuIF9nZXROb3JtYWxpemVWZWN0b3IodmVjWzBdLCB2ZWNbMV0sIHZlY1syXSk7XG59O1xuXG5leHBvcnQgY29uc3QgY29tcHV0ZVRyaWFuZ2xlTm9ybWFsID0gKHQxOiBWZWMzLCB0MjogVmVjMywgdDM6IFZlYzMpOiBWZWMzID0+IHtcbiAgY29uc3QgVXggPSB0MlswXSAtIHQxWzBdO1xuICBjb25zdCBVeSA9IHQyWzFdIC0gdDFbMV07XG4gIGNvbnN0IFV6ID0gdDJbMl0gLSB0MVsyXTtcbiAgY29uc3QgVnggPSB0M1swXSAtIHQxWzBdO1xuICBjb25zdCBWeSA9IHQzWzFdIC0gdDFbMV07XG4gIGNvbnN0IFZ6ID0gdDNbMl0gLSB0MVsyXTtcblxuICBjb25zdCBub3JtWCA9IFV5ICogVnogLSBVeiAqIFZ5O1xuICBjb25zdCBub3JtWSA9IFV6ICogVnggLSBVeCAqIFZ6O1xuICBjb25zdCBub3JtWiA9IFV4ICogVnkgLSBVeSAqIFZ4O1xuXG4gIHJldHVybiBfZ2V0Tm9ybWFsaXplVmVjdG9yKG5vcm1YLCBub3JtWSwgbm9ybVopO1xufTtcblxuLy8gZXhwb3J0IGNvbnN0IGNvbXB1dGVUcmlhbmdsZU5vcm1hbFRvQnVmZmVyID0gKGluQnVmOiBGbG9hdDMyQXJyYXkpOiB2b2lkID0+IHtcbi8vICAgY29uc3QgVXggPSBpbkJ1Zls2ICogMSArIDBdIC0gaW5CdWZbNiAqIDAgKyAwXTtcbi8vICAgY29uc3QgVXkgPSBpbkJ1Zls2ICogMSArIDFdIC0gaW5CdWZbNiAqIDAgKyAxXTtcbi8vICAgY29uc3QgVXogPSBpbkJ1Zls2ICogMSArIDJdIC0gaW5CdWZbNiAqIDAgKyAyXTtcbi8vICAgY29uc3QgVnggPSBpbkJ1Zls2ICogMiArIDBdIC0gaW5CdWZbNiAqIDAgKyAwXTtcbi8vICAgY29uc3QgVnkgPSBpbkJ1Zls2ICogMiArIDFdIC0gaW5CdWZbNiAqIDAgKyAxXTtcbi8vICAgY29uc3QgVnogPSBpbkJ1Zls2ICogMiArIDJdIC0gaW5CdWZbNiAqIDAgKyAyXTtcblxuLy8gICBsZXQgbm9ybVggPSBVeSAqIFZ6IC0gVXogKiBWeTtcbi8vICAgbGV0IG5vcm1ZID0gVXogKiBWeCAtIFV4ICogVno7XG4vLyAgIGxldCBub3JtWiA9IFV4ICogVnkgLSBVeSAqIFZ4O1xuXG4vLyAgIGNvbnN0IGxlbmd0aCA9IF9nZXRWZWN0b3JNYWduaXR1ZGUobm9ybVgsIG5vcm1ZLCBub3JtWik7XG4vLyAgIGlmIChsZW5ndGggPiAwKSB7XG4vLyAgICAgY29uc3Qgc2NhbGUgPSAxIC8gbGVuZ3RoO1xuLy8gICAgIG5vcm1YICo9IHNjYWxlO1xuLy8gICAgIG5vcm1ZICo9IHNjYWxlO1xuLy8gICAgIG5vcm1aICo9IHNjYWxlO1xuLy8gICB9XG5cbi8vICAgaW5CdWZbNiAqIDAgKyAzXSA9IG5vcm1YO1xuLy8gICBpbkJ1Zls2ICogMCArIDRdID0gbm9ybVg7XG4vLyAgIGluQnVmWzYgKiAwICsgNV0gPSBub3JtWDtcbi8vICAgaW5CdWZbNiAqIDEgKyAzXSA9IG5vcm1YO1xuLy8gICBpbkJ1Zls2ICogMSArIDRdID0gbm9ybVg7XG4vLyAgIGluQnVmWzYgKiAxICsgNV0gPSBub3JtWDtcbi8vICAgaW5CdWZbNiAqIDIgKyAzXSA9IG5vcm1YO1xuLy8gICBpbkJ1Zls2ICogMiArIDRdID0gbm9ybVg7XG4vLyAgIGluQnVmWzYgKiAyICsgNV0gPSBub3JtWDtcblxuLy8gICAvLyByZXR1cm4gW3ggKiBzY2FsZSwgeSAqIHNjYWxlLCB6ICogc2NhbGVdO1xuXG4vLyAgIC8vIHJldHVybiBfZ2V0Tm9ybWFsaXplVmVjdG9yKG5vcm1YLCBub3JtWSwgbm9ybVopO1xuLy8gfTtcblxuLy8gZXhwb3J0IGNsYXNzIEN1YmVEYXRhIHtcbi8vICAgcHJpdmF0ZSBfc2l6ZTogbnVtYmVyO1xuLy8gICBwcml2YXRlIF9idWZmZXI6IEZsb2F0MzJBcnJheTtcblxuLy8gICBjb25zdHJ1Y3RvcihpbkJ1ZmZlcjogRmxvYXQzMkFycmF5LCBpblNpemU6IG51bWJlcikge1xuLy8gICAgIHRoaXMuX3NpemUgPSBpblNpemU7XG4vLyAgICAgdGhpcy5fYnVmZmVyID0gaW5CdWZmZXI7XG4vLyAgIH1cblxuLy8gICBzZXQoaW5YOiBudW1iZXIsIGluWTogbnVtYmVyLCBpblo6IG51bWJlciwgaW5WYWx1ZTogbnVtYmVyKSB7XG4vLyAgICAgdGhpcy5fYnVmZmVyW3RoaXMuX2dldEluZGV4KGluWCwgaW5ZLCBpblopXSA9IGluVmFsdWU7XG4vLyAgIH1cblxuLy8gICBnZXQoaW5YOiBudW1iZXIsIGluWTogbnVtYmVyLCBpblo6IG51bWJlcik6IG51bWJlciB7XG4vLyAgICAgcmV0dXJuIHRoaXMuX2J1ZmZlclt0aGlzLl9nZXRJbmRleChpblgsIGluWSwgaW5aKV07XG4vLyAgIH1cblxuLy8gICBwcml2YXRlIF9nZXRJbmRleChpblg6IG51bWJlciwgaW5ZOiBudW1iZXIsIGluWjogbnVtYmVyKSB7XG4vLyAgICAgcmV0dXJuIGluWiAqIHRoaXMuX3NpemUgKiB0aGlzLl9zaXplICsgaW5ZICogdGhpcy5fc2l6ZSArIGluWDtcbi8vICAgfVxuLy8gfVxuIiwKICAiaW1wb3J0IHsgVmVjMyB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0ICogYXMgdXRpbGl0aWVzIGZyb20gJy4vdXRpbGl0aWVzJztcblxuLy8gY29tbW9uXG5leHBvcnQgY29uc3QgYTJmVmVydGV4T2Zmc2V0OiBWZWMzW10gPSBbXG4gIFswLCAwLCAwXSxcbiAgWzEsIDAsIDBdLFxuICBbMSwgMSwgMF0sXG4gIFswLCAxLCAwXSxcbiAgWzAsIDAsIDFdLFxuICBbMSwgMCwgMV0sXG4gIFsxLCAxLCAxXSxcbiAgWzAsIDEsIDFdXG5dO1xuXG5leHBvcnQgdHlwZSBPblNhbXBsZUNhbGxiYWNrID0gKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpID0+IG51bWJlcjtcblxuZXhwb3J0IHR5cGUgT25WZXJ0ZXhDYWxsYmFjayA9ICh2ZXJ0ZXg6IFZlYzMsIG5vcm1hbDogVmVjMykgPT4gdm9pZDtcblxuZXhwb3J0IGludGVyZmFjZSBJTWFyY2hpbmdBbGdvcml0aG0ge1xuICBnZW5lcmF0ZShcbiAgICBpblBvczogVmVjMyxcbiAgICBvblZlcnRleENhbGxiYWNrOiBPblZlcnRleENhbGxiYWNrLFxuICAgIG9uU2FtcGxlQ2FsbGJhY2s6IE9uU2FtcGxlQ2FsbGJhY2tcbiAgKTogdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIEFic3RyYWN0TWFyY2hpbmdBbGdvcml0aG0ge1xuICBwcm90ZWN0ZWQgX2NodW5rU2l6ZTogbnVtYmVyO1xuICBwcm90ZWN0ZWQgX3RocmVzaG9sZDogbnVtYmVyO1xuICBwcm90ZWN0ZWQgX29uU2FtcGxlQ2FsbGJhY2s6IE9uU2FtcGxlQ2FsbGJhY2sgfCB1bmRlZmluZWQ7XG4gIHByb3RlY3RlZCBfc3RlcFNpemU6IG51bWJlcjtcbiAgcHJvdGVjdGVkIF9vblZlcnRleENhbGxiYWNrOiBPblZlcnRleENhbGxiYWNrIHwgdW5kZWZpbmVkO1xuICBwcm90ZWN0ZWQgX3N0ZXBQb3M6IFZlYzMgPSBbMCwgMCwgMF07XG5cbiAgY29uc3RydWN0b3IoaW5DaHVua1NpemU6IG51bWJlciwgaW5UaHJlc2hvbGQ6IG51bWJlcikge1xuICAgIHRoaXMuX2NodW5rU2l6ZSA9IGluQ2h1bmtTaXplO1xuICAgIHRoaXMuX3RocmVzaG9sZCA9IGluVGhyZXNob2xkO1xuXG4gICAgdGhpcy5fc3RlcFNpemUgPSAxLjAgLyB0aGlzLl9jaHVua1NpemU7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2dldFNhbXBsZSh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fb25TYW1wbGVDYWxsYmFjayEoXG4gICAgICB0aGlzLl9zdGVwUG9zWzBdICsgeCxcbiAgICAgIHRoaXMuX3N0ZXBQb3NbMV0gKyB5LFxuICAgICAgdGhpcy5fc3RlcFBvc1syXSArIHpcbiAgICApO1xuICB9XG5cbiAgcHJvdGVjdGVkIF9nZXROb3JtYWwoZlg6IG51bWJlciwgZlk6IG51bWJlciwgZlo6IG51bWJlcik6IFZlYzMge1xuICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuX3N0ZXBTaXplICogMC4xO1xuXG4gICAgY29uc3QgblggPSB0aGlzLl9nZXRTYW1wbGUoZlggLSBvZmZzZXQsIGZZLCBmWik7XG4gICAgY29uc3QgcFggPSB0aGlzLl9nZXRTYW1wbGUoZlggKyBvZmZzZXQsIGZZLCBmWik7XG4gICAgY29uc3QgblkgPSB0aGlzLl9nZXRTYW1wbGUoZlgsIGZZIC0gb2Zmc2V0LCBmWik7XG4gICAgY29uc3QgcFkgPSB0aGlzLl9nZXRTYW1wbGUoZlgsIGZZICsgb2Zmc2V0LCBmWik7XG4gICAgY29uc3QgblogPSB0aGlzLl9nZXRTYW1wbGUoZlgsIGZZLCBmWiAtIG9mZnNldCk7XG4gICAgY29uc3QgcFogPSB0aGlzLl9nZXRTYW1wbGUoZlgsIGZZLCBmWiArIG9mZnNldCk7XG5cbiAgICByZXR1cm4gdXRpbGl0aWVzLl9nZXROb3JtYWxpemVWZWN0b3IoblggLSBwWCwgblkgLSBwWSwgblogLSBwWik7XG4gIH1cblxuICBwcm90ZWN0ZWQgX2dldE5vcm1hbFRvQnVmKFxuICAgIGZYOiBudW1iZXIsXG4gICAgZlk6IG51bWJlcixcbiAgICBmWjogbnVtYmVyLFxuICAgIGluQnVmOiBGbG9hdDMyQXJyYXksXG4gICAgaW5JbmRleDogbnVtYmVyXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IG9mZnNldCA9IHRoaXMuX3N0ZXBTaXplICogMC4xO1xuXG4gICAgY29uc3QgblggPSB0aGlzLl9nZXRTYW1wbGUoZlggLSBvZmZzZXQsIGZZLCBmWik7XG4gICAgY29uc3QgcFggPSB0aGlzLl9nZXRTYW1wbGUoZlggKyBvZmZzZXQsIGZZLCBmWik7XG4gICAgY29uc3QgblkgPSB0aGlzLl9nZXRTYW1wbGUoZlgsIGZZIC0gb2Zmc2V0LCBmWik7XG4gICAgY29uc3QgcFkgPSB0aGlzLl9nZXRTYW1wbGUoZlgsIGZZICsgb2Zmc2V0LCBmWik7XG4gICAgY29uc3QgblogPSB0aGlzLl9nZXRTYW1wbGUoZlgsIGZZLCBmWiAtIG9mZnNldCk7XG4gICAgY29uc3QgcFogPSB0aGlzLl9nZXRTYW1wbGUoZlgsIGZZLCBmWiArIG9mZnNldCk7XG5cbiAgICBsZXQgbm9ybVggPSBuWCAtIHBYO1xuICAgIGxldCBub3JtWSA9IG5ZIC0gcFk7XG4gICAgbGV0IG5vcm1aID0gblogLSBwWjtcbiAgICBjb25zdCBsZW5ndGggPSB1dGlsaXRpZXMuX2dldFZlY3Rvck1hZ25pdHVkZShub3JtWCwgbm9ybVksIG5vcm1aKTtcbiAgICBpZiAobGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgc2NhbGUgPSAxIC8gbGVuZ3RoO1xuICAgICAgbm9ybVggKj0gc2NhbGU7XG4gICAgICBub3JtWSAqPSBzY2FsZTtcbiAgICAgIG5vcm1aICo9IHNjYWxlO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0MSA9IDMgKiBpbkluZGV4O1xuICAgIGNvbnN0IHN0YXJ0MiA9IHN0YXJ0MSArIDM7XG4gICAgY29uc3Qgc3RhcnQzID0gc3RhcnQyICsgMztcblxuICAgIGluQnVmW3N0YXJ0MSArIDBdID0gaW5CdWZbc3RhcnQyICsgMF0gPSBpbkJ1ZltzdGFydDMgKyAwXSA9IG5vcm1YO1xuICAgIGluQnVmW3N0YXJ0MSArIDFdID0gaW5CdWZbc3RhcnQyICsgMV0gPSBpbkJ1ZltzdGFydDMgKyAxXSA9IG5vcm1ZO1xuICAgIGluQnVmW3N0YXJ0MSArIDJdID0gaW5CdWZbc3RhcnQyICsgMl0gPSBpbkJ1ZltzdGFydDMgKyAyXSA9IG5vcm1aO1xuICB9XG59XG4iLAogICJpbXBvcnQgeyBWZWMyLCBWZWMzIH0gZnJvbSAnLi9pbnRlcm5hbHMvdHlwZXMnO1xuXG50eXBlIFZlYzE2ID0gW1xuICBudW1iZXIsXG4gIG51bWJlcixcbiAgbnVtYmVyLFxuICBudW1iZXIsXG4gIG51bWJlcixcbiAgbnVtYmVyLFxuICBudW1iZXIsXG4gIG51bWJlcixcbiAgbnVtYmVyLFxuICBudW1iZXIsXG4gIG51bWJlcixcbiAgbnVtYmVyLFxuICBudW1iZXIsXG4gIG51bWJlcixcbiAgbnVtYmVyLFxuICBudW1iZXJcbl07XG5cbi8vIGN1YmVcbmV4cG9ydCBjb25zdCBhMmlFZGdlQ29ubmVjdGlvbjogVmVjMltdID0gW1xuICBbMCwgMV0sXG4gIFsxLCAyXSxcbiAgWzIsIDNdLFxuICBbMywgMF0sXG4gIFs0LCA1XSxcbiAgWzUsIDZdLFxuICBbNiwgN10sXG4gIFs3LCA0XSxcbiAgWzAsIDRdLFxuICBbMSwgNV0sXG4gIFsyLCA2XSxcbiAgWzMsIDddXG5dO1xuXG4vLyBjdWJlXG5leHBvcnQgY29uc3QgYTJmRWRnZURpcmVjdGlvbjogVmVjM1tdID0gW1xuICBbMSwgMCwgMF0sXG4gIFswLCAxLCAwXSxcbiAgWy0xLCAwLCAwXSxcbiAgWzAsIC0xLCAwXSxcbiAgWzEsIDAsIDBdLFxuICBbMCwgMSwgMF0sXG4gIFstMSwgMCwgMF0sXG4gIFswLCAtMSwgMF0sXG4gIFswLCAwLCAxXSxcbiAgWzAsIDAsIDFdLFxuICBbMCwgMCwgMV0sXG4gIFswLCAwLCAxXVxuXTtcblxuLy8gY3ViZVxuZXhwb3J0IGNvbnN0IGEyaVRyaWFuZ2xlQ29ubmVjdGlvblRhYmxlOiBWZWMxNltdID0gW1xuICBbLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgOCwgMywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgMSwgOSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMSwgOCwgMywgOSwgOCwgMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMSwgMiwgMTAsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDgsIDMsIDEsIDIsIDEwLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCAyLCAxMCwgMCwgMiwgOSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMiwgOCwgMywgMiwgMTAsIDgsIDEwLCA5LCA4LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFszLCAxMSwgMiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgMTEsIDIsIDgsIDExLCAwLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCA5LCAwLCAyLCAzLCAxMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMSwgMTEsIDIsIDEsIDksIDExLCA5LCA4LCAxMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMywgMTAsIDEsIDExLCAxMCwgMywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgMTAsIDEsIDAsIDgsIDEwLCA4LCAxMSwgMTAsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzMsIDksIDAsIDMsIDExLCA5LCAxMSwgMTAsIDksIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDgsIDEwLCAxMCwgOCwgMTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzQsIDcsIDgsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzQsIDMsIDAsIDcsIDMsIDQsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDEsIDksIDgsIDQsIDcsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzQsIDEsIDksIDQsIDcsIDEsIDcsIDMsIDEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDIsIDEwLCA4LCA0LCA3LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFszLCA0LCA3LCAzLCAwLCA0LCAxLCAyLCAxMCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbOSwgMiwgMTAsIDksIDAsIDIsIDgsIDQsIDcsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzIsIDEwLCA5LCAyLCA5LCA3LCAyLCA3LCAzLCA3LCA5LCA0LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs4LCA0LCA3LCAzLCAxMSwgMiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTEsIDQsIDcsIDExLCAyLCA0LCAyLCAwLCA0LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCAwLCAxLCA4LCA0LCA3LCAyLCAzLCAxMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNCwgNywgMTEsIDksIDQsIDExLCA5LCAxMSwgMiwgOSwgMiwgMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMywgMTAsIDEsIDMsIDExLCAxMCwgNywgOCwgNCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMSwgMTEsIDEwLCAxLCA0LCAxMSwgMSwgMCwgNCwgNywgMTEsIDQsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzQsIDcsIDgsIDksIDAsIDExLCA5LCAxMSwgMTAsIDExLCAwLCAzLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs0LCA3LCAxMSwgNCwgMTEsIDksIDksIDExLCAxMCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbOSwgNSwgNCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbOSwgNSwgNCwgMCwgOCwgMywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgNSwgNCwgMSwgNSwgMCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbOCwgNSwgNCwgOCwgMywgNSwgMywgMSwgNSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMSwgMiwgMTAsIDksIDUsIDQsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzMsIDAsIDgsIDEsIDIsIDEwLCA0LCA5LCA1LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs1LCAyLCAxMCwgNSwgNCwgMiwgNCwgMCwgMiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMiwgMTAsIDUsIDMsIDIsIDUsIDMsIDUsIDQsIDMsIDQsIDgsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDUsIDQsIDIsIDMsIDExLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCAxMSwgMiwgMCwgOCwgMTEsIDQsIDksIDUsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDUsIDQsIDAsIDEsIDUsIDIsIDMsIDExLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsyLCAxLCA1LCAyLCA1LCA4LCAyLCA4LCAxMSwgNCwgOCwgNSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTAsIDMsIDExLCAxMCwgMSwgMywgOSwgNSwgNCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNCwgOSwgNSwgMCwgOCwgMSwgOCwgMTAsIDEsIDgsIDExLCAxMCwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNSwgNCwgMCwgNSwgMCwgMTEsIDUsIDExLCAxMCwgMTEsIDAsIDMsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzUsIDQsIDgsIDUsIDgsIDEwLCAxMCwgOCwgMTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDcsIDgsIDUsIDcsIDksIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDMsIDAsIDksIDUsIDMsIDUsIDcsIDMsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDcsIDgsIDAsIDEsIDcsIDEsIDUsIDcsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDUsIDMsIDMsIDUsIDcsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDcsIDgsIDksIDUsIDcsIDEwLCAxLCAyLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxMCwgMSwgMiwgOSwgNSwgMCwgNSwgMywgMCwgNSwgNywgMywgLTEsIC0xLCAtMSwgLTFdLFxuICBbOCwgMCwgMiwgOCwgMiwgNSwgOCwgNSwgNywgMTAsIDUsIDIsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzIsIDEwLCA1LCAyLCA1LCAzLCAzLCA1LCA3LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs3LCA5LCA1LCA3LCA4LCA5LCAzLCAxMSwgMiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbOSwgNSwgNywgOSwgNywgMiwgOSwgMiwgMCwgMiwgNywgMTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzIsIDMsIDExLCAwLCAxLCA4LCAxLCA3LCA4LCAxLCA1LCA3LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxMSwgMiwgMSwgMTEsIDEsIDcsIDcsIDEsIDUsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDUsIDgsIDgsIDUsIDcsIDEwLCAxLCAzLCAxMCwgMywgMTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzUsIDcsIDAsIDUsIDAsIDksIDcsIDExLCAwLCAxLCAwLCAxMCwgMTEsIDEwLCAwLCAtMV0sXG4gIFsxMSwgMTAsIDAsIDExLCAwLCAzLCAxMCwgNSwgMCwgOCwgMCwgNywgNSwgNywgMCwgLTFdLFxuICBbMTEsIDEwLCA1LCA3LCAxMSwgNSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTAsIDYsIDUsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDgsIDMsIDUsIDEwLCA2LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCAwLCAxLCA1LCAxMCwgNiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMSwgOCwgMywgMSwgOSwgOCwgNSwgMTAsIDYsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDYsIDUsIDIsIDYsIDEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDYsIDUsIDEsIDIsIDYsIDMsIDAsIDgsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDYsIDUsIDksIDAsIDYsIDAsIDIsIDYsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzUsIDksIDgsIDUsIDgsIDIsIDUsIDIsIDYsIDMsIDIsIDgsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzIsIDMsIDExLCAxMCwgNiwgNSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTEsIDAsIDgsIDExLCAyLCAwLCAxMCwgNiwgNSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgMSwgOSwgMiwgMywgMTEsIDUsIDEwLCA2LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs1LCAxMCwgNiwgMSwgOSwgMiwgOSwgMTEsIDIsIDksIDgsIDExLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs2LCAzLCAxMSwgNiwgNSwgMywgNSwgMSwgMywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgOCwgMTEsIDAsIDExLCA1LCAwLCA1LCAxLCA1LCAxMSwgNiwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMywgMTEsIDYsIDAsIDMsIDYsIDAsIDYsIDUsIDAsIDUsIDksIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzYsIDUsIDksIDYsIDksIDExLCAxMSwgOSwgOCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNSwgMTAsIDYsIDQsIDcsIDgsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzQsIDMsIDAsIDQsIDcsIDMsIDYsIDUsIDEwLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCA5LCAwLCA1LCAxMCwgNiwgOCwgNCwgNywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTAsIDYsIDUsIDEsIDksIDcsIDEsIDcsIDMsIDcsIDksIDQsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzYsIDEsIDIsIDYsIDUsIDEsIDQsIDcsIDgsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDIsIDUsIDUsIDIsIDYsIDMsIDAsIDQsIDMsIDQsIDcsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzgsIDQsIDcsIDksIDAsIDUsIDAsIDYsIDUsIDAsIDIsIDYsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzcsIDMsIDksIDcsIDksIDQsIDMsIDIsIDksIDUsIDksIDYsIDIsIDYsIDksIC0xXSxcbiAgWzMsIDExLCAyLCA3LCA4LCA0LCAxMCwgNiwgNSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNSwgMTAsIDYsIDQsIDcsIDIsIDQsIDIsIDAsIDIsIDcsIDExLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCAxLCA5LCA0LCA3LCA4LCAyLCAzLCAxMSwgNSwgMTAsIDYsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDIsIDEsIDksIDExLCAyLCA5LCA0LCAxMSwgNywgMTEsIDQsIDUsIDEwLCA2LCAtMV0sXG4gIFs4LCA0LCA3LCAzLCAxMSwgNSwgMywgNSwgMSwgNSwgMTEsIDYsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzUsIDEsIDExLCA1LCAxMSwgNiwgMSwgMCwgMTEsIDcsIDExLCA0LCAwLCA0LCAxMSwgLTFdLFxuICBbMCwgNSwgOSwgMCwgNiwgNSwgMCwgMywgNiwgMTEsIDYsIDMsIDgsIDQsIDcsIC0xXSxcbiAgWzYsIDUsIDksIDYsIDksIDExLCA0LCA3LCA5LCA3LCAxMSwgOSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTAsIDQsIDksIDYsIDQsIDEwLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs0LCAxMCwgNiwgNCwgOSwgMTAsIDAsIDgsIDMsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEwLCAwLCAxLCAxMCwgNiwgMCwgNiwgNCwgMCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbOCwgMywgMSwgOCwgMSwgNiwgOCwgNiwgNCwgNiwgMSwgMTAsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDQsIDksIDEsIDIsIDQsIDIsIDYsIDQsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzMsIDAsIDgsIDEsIDIsIDksIDIsIDQsIDksIDIsIDYsIDQsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDIsIDQsIDQsIDIsIDYsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzgsIDMsIDIsIDgsIDIsIDQsIDQsIDIsIDYsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEwLCA0LCA5LCAxMCwgNiwgNCwgMTEsIDIsIDMsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDgsIDIsIDIsIDgsIDExLCA0LCA5LCAxMCwgNCwgMTAsIDYsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzMsIDExLCAyLCAwLCAxLCA2LCAwLCA2LCA0LCA2LCAxLCAxMCwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNiwgNCwgMSwgNiwgMSwgMTAsIDQsIDgsIDEsIDIsIDEsIDExLCA4LCAxMSwgMSwgLTFdLFxuICBbOSwgNiwgNCwgOSwgMywgNiwgOSwgMSwgMywgMTEsIDYsIDMsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzgsIDExLCAxLCA4LCAxLCAwLCAxMSwgNiwgMSwgOSwgMSwgNCwgNiwgNCwgMSwgLTFdLFxuICBbMywgMTEsIDYsIDMsIDYsIDAsIDAsIDYsIDQsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzYsIDQsIDgsIDExLCA2LCA4LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs3LCAxMCwgNiwgNywgOCwgMTAsIDgsIDksIDEwLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCA3LCAzLCAwLCAxMCwgNywgMCwgOSwgMTAsIDYsIDcsIDEwLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxMCwgNiwgNywgMSwgMTAsIDcsIDEsIDcsIDgsIDEsIDgsIDAsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEwLCA2LCA3LCAxMCwgNywgMSwgMSwgNywgMywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMSwgMiwgNiwgMSwgNiwgOCwgMSwgOCwgOSwgOCwgNiwgNywgLTEsIC0xLCAtMSwgLTFdLFxuICBbMiwgNiwgOSwgMiwgOSwgMSwgNiwgNywgOSwgMCwgOSwgMywgNywgMywgOSwgLTFdLFxuICBbNywgOCwgMCwgNywgMCwgNiwgNiwgMCwgMiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNywgMywgMiwgNiwgNywgMiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMiwgMywgMTEsIDEwLCA2LCA4LCAxMCwgOCwgOSwgOCwgNiwgNywgLTEsIC0xLCAtMSwgLTFdLFxuICBbMiwgMCwgNywgMiwgNywgMTEsIDAsIDksIDcsIDYsIDcsIDEwLCA5LCAxMCwgNywgLTFdLFxuICBbMSwgOCwgMCwgMSwgNywgOCwgMSwgMTAsIDcsIDYsIDcsIDEwLCAyLCAzLCAxMSwgLTFdLFxuICBbMTEsIDIsIDEsIDExLCAxLCA3LCAxMCwgNiwgMSwgNiwgNywgMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbOCwgOSwgNiwgOCwgNiwgNywgOSwgMSwgNiwgMTEsIDYsIDMsIDEsIDMsIDYsIC0xXSxcbiAgWzAsIDksIDEsIDExLCA2LCA3LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs3LCA4LCAwLCA3LCAwLCA2LCAzLCAxMSwgMCwgMTEsIDYsIDAsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzcsIDExLCA2LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs3LCA2LCAxMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMywgMCwgOCwgMTEsIDcsIDYsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDEsIDksIDExLCA3LCA2LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs4LCAxLCA5LCA4LCAzLCAxLCAxMSwgNywgNiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTAsIDEsIDIsIDYsIDExLCA3LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCAyLCAxMCwgMywgMCwgOCwgNiwgMTEsIDcsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzIsIDksIDAsIDIsIDEwLCA5LCA2LCAxMSwgNywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNiwgMTEsIDcsIDIsIDEwLCAzLCAxMCwgOCwgMywgMTAsIDksIDgsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzcsIDIsIDMsIDYsIDIsIDcsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzcsIDAsIDgsIDcsIDYsIDAsIDYsIDIsIDAsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzIsIDcsIDYsIDIsIDMsIDcsIDAsIDEsIDksIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDYsIDIsIDEsIDgsIDYsIDEsIDksIDgsIDgsIDcsIDYsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEwLCA3LCA2LCAxMCwgMSwgNywgMSwgMywgNywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTAsIDcsIDYsIDEsIDcsIDEwLCAxLCA4LCA3LCAxLCAwLCA4LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCAzLCA3LCAwLCA3LCAxMCwgMCwgMTAsIDksIDYsIDEwLCA3LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs3LCA2LCAxMCwgNywgMTAsIDgsIDgsIDEwLCA5LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs2LCA4LCA0LCAxMSwgOCwgNiwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMywgNiwgMTEsIDMsIDAsIDYsIDAsIDQsIDYsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzgsIDYsIDExLCA4LCA0LCA2LCA5LCAwLCAxLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCA0LCA2LCA5LCA2LCAzLCA5LCAzLCAxLCAxMSwgMywgNiwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNiwgOCwgNCwgNiwgMTEsIDgsIDIsIDEwLCAxLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCAyLCAxMCwgMywgMCwgMTEsIDAsIDYsIDExLCAwLCA0LCA2LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs0LCAxMSwgOCwgNCwgNiwgMTEsIDAsIDIsIDksIDIsIDEwLCA5LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxMCwgOSwgMywgMTAsIDMsIDIsIDksIDQsIDMsIDExLCAzLCA2LCA0LCA2LCAzLCAtMV0sXG4gIFs4LCAyLCAzLCA4LCA0LCAyLCA0LCA2LCAyLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCA0LCAyLCA0LCA2LCAyLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCA5LCAwLCAyLCAzLCA0LCAyLCA0LCA2LCA0LCAzLCA4LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCA5LCA0LCAxLCA0LCAyLCAyLCA0LCA2LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs4LCAxLCAzLCA4LCA2LCAxLCA4LCA0LCA2LCA2LCAxMCwgMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTAsIDEsIDAsIDEwLCAwLCA2LCA2LCAwLCA0LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs0LCA2LCAzLCA0LCAzLCA4LCA2LCAxMCwgMywgMCwgMywgOSwgMTAsIDksIDMsIC0xXSxcbiAgWzEwLCA5LCA0LCA2LCAxMCwgNCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNCwgOSwgNSwgNywgNiwgMTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDgsIDMsIDQsIDksIDUsIDExLCA3LCA2LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs1LCAwLCAxLCA1LCA0LCAwLCA3LCA2LCAxMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTEsIDcsIDYsIDgsIDMsIDQsIDMsIDUsIDQsIDMsIDEsIDUsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDUsIDQsIDEwLCAxLCAyLCA3LCA2LCAxMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNiwgMTEsIDcsIDEsIDIsIDEwLCAwLCA4LCAzLCA0LCA5LCA1LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs3LCA2LCAxMSwgNSwgNCwgMTAsIDQsIDIsIDEwLCA0LCAwLCAyLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFszLCA0LCA4LCAzLCA1LCA0LCAzLCAyLCA1LCAxMCwgNSwgMiwgMTEsIDcsIDYsIC0xXSxcbiAgWzcsIDIsIDMsIDcsIDYsIDIsIDUsIDQsIDksIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDUsIDQsIDAsIDgsIDYsIDAsIDYsIDIsIDYsIDgsIDcsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzMsIDYsIDIsIDMsIDcsIDYsIDEsIDUsIDAsIDUsIDQsIDAsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzYsIDIsIDgsIDYsIDgsIDcsIDIsIDEsIDgsIDQsIDgsIDUsIDEsIDUsIDgsIC0xXSxcbiAgWzksIDUsIDQsIDEwLCAxLCA2LCAxLCA3LCA2LCAxLCAzLCA3LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCA2LCAxMCwgMSwgNywgNiwgMSwgMCwgNywgOCwgNywgMCwgOSwgNSwgNCwgLTFdLFxuICBbNCwgMCwgMTAsIDQsIDEwLCA1LCAwLCAzLCAxMCwgNiwgMTAsIDcsIDMsIDcsIDEwLCAtMV0sXG4gIFs3LCA2LCAxMCwgNywgMTAsIDgsIDUsIDQsIDEwLCA0LCA4LCAxMCwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNiwgOSwgNSwgNiwgMTEsIDksIDExLCA4LCA5LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFszLCA2LCAxMSwgMCwgNiwgMywgMCwgNSwgNiwgMCwgOSwgNSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgMTEsIDgsIDAsIDUsIDExLCAwLCAxLCA1LCA1LCA2LCAxMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNiwgMTEsIDMsIDYsIDMsIDUsIDUsIDMsIDEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDIsIDEwLCA5LCA1LCAxMSwgOSwgMTEsIDgsIDExLCA1LCA2LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCAxMSwgMywgMCwgNiwgMTEsIDAsIDksIDYsIDUsIDYsIDksIDEsIDIsIDEwLCAtMV0sXG4gIFsxMSwgOCwgNSwgMTEsIDUsIDYsIDgsIDAsIDUsIDEwLCA1LCAyLCAwLCAyLCA1LCAtMV0sXG4gIFs2LCAxMSwgMywgNiwgMywgNSwgMiwgMTAsIDMsIDEwLCA1LCAzLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs1LCA4LCA5LCA1LCAyLCA4LCA1LCA2LCAyLCAzLCA4LCAyLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCA1LCA2LCA5LCA2LCAwLCAwLCA2LCAyLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCA1LCA4LCAxLCA4LCAwLCA1LCA2LCA4LCAzLCA4LCAyLCA2LCAyLCA4LCAtMV0sXG4gIFsxLCA1LCA2LCAyLCAxLCA2LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCAzLCA2LCAxLCA2LCAxMCwgMywgOCwgNiwgNSwgNiwgOSwgOCwgOSwgNiwgLTFdLFxuICBbMTAsIDEsIDAsIDEwLCAwLCA2LCA5LCA1LCAwLCA1LCA2LCAwLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCAzLCA4LCA1LCA2LCAxMCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTAsIDUsIDYsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzExLCA1LCAxMCwgNywgNSwgMTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzExLCA1LCAxMCwgMTEsIDcsIDUsIDgsIDMsIDAsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzUsIDExLCA3LCA1LCAxMCwgMTEsIDEsIDksIDAsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEwLCA3LCA1LCAxMCwgMTEsIDcsIDksIDgsIDEsIDgsIDMsIDEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzExLCAxLCAyLCAxMSwgNywgMSwgNywgNSwgMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgOCwgMywgMSwgMiwgNywgMSwgNywgNSwgNywgMiwgMTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDcsIDUsIDksIDIsIDcsIDksIDAsIDIsIDIsIDExLCA3LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs3LCA1LCAyLCA3LCAyLCAxMSwgNSwgOSwgMiwgMywgMiwgOCwgOSwgOCwgMiwgLTFdLFxuICBbMiwgNSwgMTAsIDIsIDMsIDUsIDMsIDcsIDUsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzgsIDIsIDAsIDgsIDUsIDIsIDgsIDcsIDUsIDEwLCAyLCA1LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCAwLCAxLCA1LCAxMCwgMywgNSwgMywgNywgMywgMTAsIDIsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDgsIDIsIDksIDIsIDEsIDgsIDcsIDIsIDEwLCAyLCA1LCA3LCA1LCAyLCAtMV0sXG4gIFsxLCAzLCA1LCAzLCA3LCA1LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCA4LCA3LCAwLCA3LCAxLCAxLCA3LCA1LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCAwLCAzLCA5LCAzLCA1LCA1LCAzLCA3LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCA4LCA3LCA1LCA5LCA3LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs1LCA4LCA0LCA1LCAxMCwgOCwgMTAsIDExLCA4LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs1LCAwLCA0LCA1LCAxMSwgMCwgNSwgMTAsIDExLCAxMSwgMywgMCwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgMSwgOSwgOCwgNCwgMTAsIDgsIDEwLCAxMSwgMTAsIDQsIDUsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEwLCAxMSwgNCwgMTAsIDQsIDUsIDExLCAzLCA0LCA5LCA0LCAxLCAzLCAxLCA0LCAtMV0sXG4gIFsyLCA1LCAxLCAyLCA4LCA1LCAyLCAxMSwgOCwgNCwgNSwgOCwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMCwgNCwgMTEsIDAsIDExLCAzLCA0LCA1LCAxMSwgMiwgMTEsIDEsIDUsIDEsIDExLCAtMV0sXG4gIFswLCAyLCA1LCAwLCA1LCA5LCAyLCAxMSwgNSwgNCwgNSwgOCwgMTEsIDgsIDUsIC0xXSxcbiAgWzksIDQsIDUsIDIsIDExLCAzLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsyLCA1LCAxMCwgMywgNSwgMiwgMywgNCwgNSwgMywgOCwgNCwgLTEsIC0xLCAtMSwgLTFdLFxuICBbNSwgMTAsIDIsIDUsIDIsIDQsIDQsIDIsIDAsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzMsIDEwLCAyLCAzLCA1LCAxMCwgMywgOCwgNSwgNCwgNSwgOCwgMCwgMSwgOSwgLTFdLFxuICBbNSwgMTAsIDIsIDUsIDIsIDQsIDEsIDksIDIsIDksIDQsIDIsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzgsIDQsIDUsIDgsIDUsIDMsIDMsIDUsIDEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzAsIDQsIDUsIDEsIDAsIDUsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzgsIDQsIDUsIDgsIDUsIDMsIDksIDAsIDUsIDAsIDMsIDUsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDQsIDUsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzQsIDExLCA3LCA0LCA5LCAxMSwgOSwgMTAsIDExLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCA4LCAzLCA0LCA5LCA3LCA5LCAxMSwgNywgOSwgMTAsIDExLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCAxMCwgMTEsIDEsIDExLCA0LCAxLCA0LCAwLCA3LCA0LCAxMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMywgMSwgNCwgMywgNCwgOCwgMSwgMTAsIDQsIDcsIDQsIDExLCAxMCwgMTEsIDQsIC0xXSxcbiAgWzQsIDExLCA3LCA5LCAxMSwgNCwgOSwgMiwgMTEsIDksIDEsIDIsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDcsIDQsIDksIDExLCA3LCA5LCAxLCAxMSwgMiwgMTEsIDEsIDAsIDgsIDMsIC0xXSxcbiAgWzExLCA3LCA0LCAxMSwgNCwgMiwgMiwgNCwgMCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMTEsIDcsIDQsIDExLCA0LCAyLCA4LCAzLCA0LCAzLCAyLCA0LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsyLCA5LCAxMCwgMiwgNywgOSwgMiwgMywgNywgNywgNCwgOSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbOSwgMTAsIDcsIDksIDcsIDQsIDEwLCAyLCA3LCA4LCA3LCAwLCAyLCAwLCA3LCAtMV0sXG4gIFszLCA3LCAxMCwgMywgMTAsIDIsIDcsIDQsIDEwLCAxLCAxMCwgMCwgNCwgMCwgMTAsIC0xXSxcbiAgWzEsIDEwLCAyLCA4LCA3LCA0LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs0LCA5LCAxLCA0LCAxLCA3LCA3LCAxLCAzLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs0LCA5LCAxLCA0LCAxLCA3LCAwLCA4LCAxLCA4LCA3LCAxLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs0LCAwLCAzLCA3LCA0LCAzLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs0LCA4LCA3LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFs5LCAxMCwgOCwgMTAsIDExLCA4LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFszLCAwLCA5LCAzLCA5LCAxMSwgMTEsIDksIDEwLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCAxLCAxMCwgMCwgMTAsIDgsIDgsIDEwLCAxMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMywgMSwgMTAsIDExLCAzLCAxMCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMSwgMiwgMTEsIDEsIDExLCA5LCA5LCAxMSwgOCwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTFdLFxuICBbMywgMCwgOSwgMywgOSwgMTEsIDEsIDIsIDksIDIsIDExLCA5LCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCAyLCAxMSwgOCwgMCwgMTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzMsIDIsIDExLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsyLCAzLCA4LCAyLCA4LCAxMCwgMTAsIDgsIDksIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzksIDEwLCAyLCAwLCA5LCAyLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsyLCAzLCA4LCAyLCA4LCAxMCwgMCwgMSwgOCwgMSwgMTAsIDgsIC0xLCAtMSwgLTEsIC0xXSxcbiAgWzEsIDEwLCAyLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFsxLCAzLCA4LCA5LCAxLCA4LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCA5LCAxLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFswLCAzLCA4LCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV0sXG4gIFstMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMV1cbl07XG5cbi8vIGN1YmVcbmV4cG9ydCBjb25zdCBhaUN1YmVFZGdlRmxhZ3MgPSBuZXcgSW50MzJBcnJheShbXG4gIDB4MDAwLCAweDEwOSwgMHgyMDMsIDB4MzBhLCAweDQwNiwgMHg1MGYsIDB4NjA1LCAweDcwYywgMHg4MGMsIDB4OTA1LCAweGEwZixcbiAgMHhiMDYsIDB4YzBhLCAweGQwMywgMHhlMDksIDB4ZjAwLCAweDE5MCwgMHgwOTksIDB4MzkzLCAweDI5YSwgMHg1OTYsIDB4NDlmLFxuICAweDc5NSwgMHg2OWMsIDB4OTljLCAweDg5NSwgMHhiOWYsIDB4YTk2LCAweGQ5YSwgMHhjOTMsIDB4Zjk5LCAweGU5MCwgMHgyMzAsXG4gIDB4MzM5LCAweDAzMywgMHgxM2EsIDB4NjM2LCAweDczZiwgMHg0MzUsIDB4NTNjLCAweGEzYywgMHhiMzUsIDB4ODNmLCAweDkzNixcbiAgMHhlM2EsIDB4ZjMzLCAweGMzOSwgMHhkMzAsIDB4M2EwLCAweDJhOSwgMHgxYTMsIDB4MGFhLCAweDdhNiwgMHg2YWYsIDB4NWE1LFxuICAweDRhYywgMHhiYWMsIDB4YWE1LCAweDlhZiwgMHg4YTYsIDB4ZmFhLCAweGVhMywgMHhkYTksIDB4Y2EwLCAweDQ2MCwgMHg1NjksXG4gIDB4NjYzLCAweDc2YSwgMHgwNjYsIDB4MTZmLCAweDI2NSwgMHgzNmMsIDB4YzZjLCAweGQ2NSwgMHhlNmYsIDB4ZjY2LCAweDg2YSxcbiAgMHg5NjMsIDB4YTY5LCAweGI2MCwgMHg1ZjAsIDB4NGY5LCAweDdmMywgMHg2ZmEsIDB4MWY2LCAweDBmZiwgMHgzZjUsIDB4MmZjLFxuICAweGRmYywgMHhjZjUsIDB4ZmZmLCAweGVmNiwgMHg5ZmEsIDB4OGYzLCAweGJmOSwgMHhhZjAsIDB4NjUwLCAweDc1OSwgMHg0NTMsXG4gIDB4NTVhLCAweDI1NiwgMHgzNWYsIDB4MDU1LCAweDE1YywgMHhlNWMsIDB4ZjU1LCAweGM1ZiwgMHhkNTYsIDB4YTVhLCAweGI1MyxcbiAgMHg4NTksIDB4OTUwLCAweDdjMCwgMHg2YzksIDB4NWMzLCAweDRjYSwgMHgzYzYsIDB4MmNmLCAweDFjNSwgMHgwY2MsIDB4ZmNjLFxuICAweGVjNSwgMHhkY2YsIDB4Y2M2LCAweGJjYSwgMHhhYzMsIDB4OWM5LCAweDhjMCwgMHg4YzAsIDB4OWM5LCAweGFjMywgMHhiY2EsXG4gIDB4Y2M2LCAweGRjZiwgMHhlYzUsIDB4ZmNjLCAweDBjYywgMHgxYzUsIDB4MmNmLCAweDNjNiwgMHg0Y2EsIDB4NWMzLCAweDZjOSxcbiAgMHg3YzAsIDB4OTUwLCAweDg1OSwgMHhiNTMsIDB4YTVhLCAweGQ1NiwgMHhjNWYsIDB4ZjU1LCAweGU1YywgMHgxNWMsIDB4MDU1LFxuICAweDM1ZiwgMHgyNTYsIDB4NTVhLCAweDQ1MywgMHg3NTksIDB4NjUwLCAweGFmMCwgMHhiZjksIDB4OGYzLCAweDlmYSwgMHhlZjYsXG4gIDB4ZmZmLCAweGNmNSwgMHhkZmMsIDB4MmZjLCAweDNmNSwgMHgwZmYsIDB4MWY2LCAweDZmYSwgMHg3ZjMsIDB4NGY5LCAweDVmMCxcbiAgMHhiNjAsIDB4YTY5LCAweDk2MywgMHg4NmEsIDB4ZjY2LCAweGU2ZiwgMHhkNjUsIDB4YzZjLCAweDM2YywgMHgyNjUsIDB4MTZmLFxuICAweDA2NiwgMHg3NmEsIDB4NjYzLCAweDU2OSwgMHg0NjAsIDB4Y2EwLCAweGRhOSwgMHhlYTMsIDB4ZmFhLCAweDhhNiwgMHg5YWYsXG4gIDB4YWE1LCAweGJhYywgMHg0YWMsIDB4NWE1LCAweDZhZiwgMHg3YTYsIDB4MGFhLCAweDFhMywgMHgyYTksIDB4M2EwLCAweGQzMCxcbiAgMHhjMzksIDB4ZjMzLCAweGUzYSwgMHg5MzYsIDB4ODNmLCAweGIzNSwgMHhhM2MsIDB4NTNjLCAweDQzNSwgMHg3M2YsIDB4NjM2LFxuICAweDEzYSwgMHgwMzMsIDB4MzM5LCAweDIzMCwgMHhlOTAsIDB4Zjk5LCAweGM5MywgMHhkOWEsIDB4YTk2LCAweGI5ZiwgMHg4OTUsXG4gIDB4OTljLCAweDY5YywgMHg3OTUsIDB4NDlmLCAweDU5NiwgMHgyOWEsIDB4MzkzLCAweDA5OSwgMHgxOTAsIDB4ZjAwLCAweGUwOSxcbiAgMHhkMDMsIDB4YzBhLCAweGIwNiwgMHhhMGYsIDB4OTA1LCAweDgwYywgMHg3MGMsIDB4NjA1LCAweDUwZiwgMHg0MDYsIDB4MzBhLFxuICAweDIwMywgMHgxMDksIDB4MDAwXG5dKTtcbiIsCiAgImltcG9ydCB7IFZlYzMgfSBmcm9tICcuL2ludGVybmFscy90eXBlcyc7XG5pbXBvcnQgKiBhcyB1dGlsaXRpZXMgZnJvbSAnLi9pbnRlcm5hbHMvdXRpbGl0aWVzJztcblxuaW1wb3J0IHtcbiAgYTJmVmVydGV4T2Zmc2V0LFxuICBPblZlcnRleENhbGxiYWNrLFxuICBJTWFyY2hpbmdBbGdvcml0aG0sXG4gIEFic3RyYWN0TWFyY2hpbmdBbGdvcml0aG0sXG4gIE9uU2FtcGxlQ2FsbGJhY2tcbn0gZnJvbSAnLi9pbnRlcm5hbHMvTWFyY2hpbmdBbGdvcml0aG0nO1xuXG5pbXBvcnQgKiBhcyBkYXRhIGZyb20gJy4vTWFyY2hpbmdDdWJlRGF0YSc7XG5cbmV4cG9ydCBjbGFzcyBNYXJjaGluZ0N1YmVcbiAgZXh0ZW5kcyBBYnN0cmFjdE1hcmNoaW5nQWxnb3JpdGhtXG4gIGltcGxlbWVudHMgSU1hcmNoaW5nQWxnb3JpdGhtXG57XG4gIHByaXZhdGUgX2FmQ3ViZVZhbHVlID0gbmV3IEZsb2F0MzJBcnJheShbMCwgMCwgMCwgMCwgMCwgMCwgMCwgMF0pO1xuICBwcml2YXRlIF9hc0VkZ2VWZXJ0ZXggPSBuZXcgRmxvYXQzMkFycmF5KDEyICogMyk7XG4gIHByaXZhdGUgX2FzRWRnZU5vcm0gPSBuZXcgRmxvYXQzMkFycmF5KDEyICogMyk7XG4gIGdlbmVyYXRlKFxuICAgIGluUG9zOiBWZWMzLFxuICAgIC8vIGluQ3ViZURhdGE6IHV0aWxpdGllcy5DdWJlRGF0YSxcbiAgICBvblZlcnRleENhbGxiYWNrOiBPblZlcnRleENhbGxiYWNrLFxuICAgIG9uU2FtcGxlQ2FsbGJhY2s6IE9uU2FtcGxlQ2FsbGJhY2tcbiAgKTogdm9pZCB7XG4gICAgdGhpcy5fb25WZXJ0ZXhDYWxsYmFjayA9IG9uVmVydGV4Q2FsbGJhY2s7XG4gICAgdGhpcy5fb25TYW1wbGVDYWxsYmFjayA9IG9uU2FtcGxlQ2FsbGJhY2s7XG4gICAgdGhpcy5fc3RlcFBvc1swXSA9IGluUG9zWzBdICogdGhpcy5fc3RlcFNpemU7XG4gICAgdGhpcy5fc3RlcFBvc1sxXSA9IGluUG9zWzFdICogdGhpcy5fc3RlcFNpemU7XG4gICAgdGhpcy5fc3RlcFBvc1syXSA9IGluUG9zWzJdICogdGhpcy5fc3RlcFNpemU7XG5cbiAgICBmb3IgKGxldCBpWCA9IDA7IGlYIDw9IHRoaXMuX2NodW5rU2l6ZTsgKytpWClcbiAgICAgIGZvciAobGV0IGlZID0gMDsgaVkgPD0gdGhpcy5fY2h1bmtTaXplOyArK2lZKVxuICAgICAgICBmb3IgKGxldCBpWiA9IDA7IGlaIDw9IHRoaXMuX2NodW5rU2l6ZTsgKytpWilcbiAgICAgICAgICB0aGlzLl9tYXJjaEN1YmVTaW5nbGUoaVgsIGlZLCBpWik7XG4gIH1cblxuICBwcml2YXRlIF9tYXJjaEN1YmVTaW5nbGUoaVg6IG51bWJlciwgaVk6IG51bWJlciwgaVo6IG51bWJlcik6IHZvaWQge1xuICAgIC8vLyBhZGQgY2h1bmsgcG9zIGhlcmVcbiAgICBjb25zdCBmWCA9IGlYICogdGhpcy5fc3RlcFNpemU7XG4gICAgY29uc3QgZlkgPSBpWSAqIHRoaXMuX3N0ZXBTaXplO1xuICAgIGNvbnN0IGZaID0gaVogKiB0aGlzLl9zdGVwU2l6ZTtcblxuICAgIC8vLyBNYWtlIGEgbG9jYWwgY29weSBvZiB0aGUgdmFsdWVzIGF0IHRoZSBjdWJlJ3MgY29ybmVyc1xuICAgIGZvciAobGV0IGlWZXJ0ZXggPSAwOyBpVmVydGV4IDwgODsgKytpVmVydGV4KSB7XG4gICAgICBjb25zdCBjdXJyT2Zmc2V0ID0gYTJmVmVydGV4T2Zmc2V0W2lWZXJ0ZXhdO1xuXG4gICAgICB0aGlzLl9hZkN1YmVWYWx1ZVtpVmVydGV4XSA9IHRoaXMuX2dldFNhbXBsZShcbiAgICAgICAgZlggKyBjdXJyT2Zmc2V0WzBdICogdGhpcy5fc3RlcFNpemUsXG4gICAgICAgIGZZICsgY3Vyck9mZnNldFsxXSAqIHRoaXMuX3N0ZXBTaXplLFxuICAgICAgICBmWiArIGN1cnJPZmZzZXRbMl0gKiB0aGlzLl9zdGVwU2l6ZVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvL0ZpbmQgd2hpY2ggdmVydGljZXMgYXJlIGluc2lkZSBvZiB0aGUgc3VyZmFjZSBhbmQgd2hpY2ggYXJlIG91dHNpZGVcbiAgICBsZXQgaUZsYWdJbmRleCA9IDAgfCAwO1xuICAgIGZvciAobGV0IGlWZXJ0ZXhUZXN0ID0gMCB8IDA7IGlWZXJ0ZXhUZXN0IDwgODsgKytpVmVydGV4VGVzdClcbiAgICAgIGlmICh0aGlzLl9hZkN1YmVWYWx1ZVtpVmVydGV4VGVzdF0gPD0gdGhpcy5fdGhyZXNob2xkKVxuICAgICAgICBpRmxhZ0luZGV4IHw9IDEgPDwgaVZlcnRleFRlc3Q7XG5cbiAgICAvL0ZpbmQgd2hpY2ggZWRnZXMgYXJlIGludGVyc2VjdGVkIGJ5IHRoZSBzdXJmYWNlXG4gICAgY29uc3QgaUVkZ2VGbGFncyA9IGRhdGEuYWlDdWJlRWRnZUZsYWdzW2lGbGFnSW5kZXhdO1xuXG4gICAgLy9JZiB0aGUgY3ViZSBpcyBlbnRpcmVseSBpbnNpZGUgb3Igb3V0c2lkZSBvZiB0aGUgc3VyZmFjZSwgdGhlbiB0aGVyZSB3aWxsIGJlIG5vIGludGVyc2VjdGlvbnNcbiAgICBpZiAoaUVkZ2VGbGFncyA9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy9GaW5kIHRoZSBwb2ludCBvZiBpbnRlcnNlY3Rpb24gb2YgdGhlIHN1cmZhY2Ugd2l0aCBlYWNoIGVkZ2VcbiAgICAvL1RoZW4gZmluZCB0aGUgbm9ybWFsIHRvIHRoZSBzdXJmYWNlIGF0IHRob3NlIHBvaW50c1xuICAgIGZvciAobGV0IGlFZGdlID0gMDsgaUVkZ2UgPCAxMjsgKytpRWRnZSkge1xuICAgICAgLy9pZiB0aGVyZSBpcyBhbiBpbnRlcnNlY3Rpb24gb24gdGhpcyBlZGdlXG4gICAgICBpZiAoaUVkZ2VGbGFncyAmICgxIDw8IGlFZGdlKSkge1xuICAgICAgICBjb25zdCBjdXJyRWRnZSA9IGRhdGEuYTJpRWRnZUNvbm5lY3Rpb25baUVkZ2VdO1xuXG4gICAgICAgIGNvbnN0IGZPZmZzZXQgPSB1dGlsaXRpZXMuZ2V0T2Zmc2V0KFxuICAgICAgICAgIHRoaXMuX2FmQ3ViZVZhbHVlW2N1cnJFZGdlWzBdXSxcbiAgICAgICAgICB0aGlzLl9hZkN1YmVWYWx1ZVtjdXJyRWRnZVsxXV0sXG4gICAgICAgICAgdGhpcy5fdGhyZXNob2xkXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgY3Vyck9mZnNldCA9IGEyZlZlcnRleE9mZnNldFtjdXJyRWRnZVswXV07XG4gICAgICAgIGNvbnN0IGN1cnJFZGdlRGlyID0gZGF0YS5hMmZFZGdlRGlyZWN0aW9uW2lFZGdlXTtcblxuICAgICAgICAvLyBjb25zdCBjdXJyVmVydGV4ID0gdGhpcy5fYXNFZGdlVmVydGV4W2lFZGdlXTtcbiAgICAgICAgLy8gY3VyclZlcnRleFswXSA9IGZYICsgKGN1cnJPZmZzZXRbMF0gKyBmT2Zmc2V0ICogY3VyckVkZ2VEaXJbMF0pICogdGhpcy5fc3RlcFNpemU7XG4gICAgICAgIC8vIGN1cnJWZXJ0ZXhbMV0gPSBmWSArIChjdXJyT2Zmc2V0WzFdICsgZk9mZnNldCAqIGN1cnJFZGdlRGlyWzFdKSAqIHRoaXMuX3N0ZXBTaXplO1xuICAgICAgICAvLyBjdXJyVmVydGV4WzJdID0gZlogKyAoY3Vyck9mZnNldFsyXSArIGZPZmZzZXQgKiBjdXJyRWRnZURpclsyXSkgKiB0aGlzLl9zdGVwU2l6ZTtcbiAgICAgICAgdGhpcy5fYXNFZGdlVmVydGV4W2lFZGdlICogMyArIDBdID1cbiAgICAgICAgICBmWCArIChjdXJyT2Zmc2V0WzBdICsgZk9mZnNldCAqIGN1cnJFZGdlRGlyWzBdKSAqIHRoaXMuX3N0ZXBTaXplO1xuICAgICAgICB0aGlzLl9hc0VkZ2VWZXJ0ZXhbaUVkZ2UgKiAzICsgMV0gPVxuICAgICAgICAgIGZZICsgKGN1cnJPZmZzZXRbMV0gKyBmT2Zmc2V0ICogY3VyckVkZ2VEaXJbMV0pICogdGhpcy5fc3RlcFNpemU7XG4gICAgICAgIHRoaXMuX2FzRWRnZVZlcnRleFtpRWRnZSAqIDMgKyAyXSA9XG4gICAgICAgICAgZlogKyAoY3Vyck9mZnNldFsyXSArIGZPZmZzZXQgKiBjdXJyRWRnZURpclsyXSkgKiB0aGlzLl9zdGVwU2l6ZTtcblxuICAgICAgICAvLyB0aGlzLl9hc0VkZ2VOb3JtW2lFZGdlXSA9IHRoaXMuX2dldE5vcm1hbChcbiAgICAgICAgLy8gICB0aGlzLl9hc0VkZ2VWZXJ0ZXhbaUVkZ2UgKiAzICsgMF0sXG4gICAgICAgIC8vICAgdGhpcy5fYXNFZGdlVmVydGV4W2lFZGdlICogMyArIDFdLFxuICAgICAgICAvLyAgIHRoaXMuX2FzRWRnZVZlcnRleFtpRWRnZSAqIDMgKyAyXVxuICAgICAgICAvLyApO1xuICAgICAgICB0aGlzLl9nZXROb3JtYWxUb0J1ZihcbiAgICAgICAgICB0aGlzLl9hc0VkZ2VWZXJ0ZXhbaUVkZ2UgKiAzICsgMF0sXG4gICAgICAgICAgdGhpcy5fYXNFZGdlVmVydGV4W2lFZGdlICogMyArIDFdLFxuICAgICAgICAgIHRoaXMuX2FzRWRnZVZlcnRleFtpRWRnZSAqIDMgKyAyXSxcbiAgICAgICAgICB0aGlzLl9hc0VkZ2VOb3JtLFxuICAgICAgICAgIGlFZGdlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgdmVydGV4OiBWZWMzID0gWzAsIDAsIDBdO1xuICAgIGNvbnN0IG5vcm1hbDogVmVjMyA9IFswLCAwLCAwXTtcblxuICAgIC8vRHJhdyB0aGUgdHJpYW5nbGVzIHRoYXQgd2VyZSBmb3VuZC4gVGhlcmUgY2FuIGJlIHVwIHRvIGZpdmUgcGVyIGN1YmVcbiAgICBmb3IgKGxldCBpVHJpYW5nbGUgPSAwOyBpVHJpYW5nbGUgPCA1OyArK2lUcmlhbmdsZSkge1xuICAgICAgY29uc3QgY3VyclRhYmxlID0gZGF0YS5hMmlUcmlhbmdsZUNvbm5lY3Rpb25UYWJsZVtpRmxhZ0luZGV4XTtcblxuICAgICAgaWYgKGN1cnJUYWJsZVszICogaVRyaWFuZ2xlXSA8IDApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGZvciAobGV0IGlDb3JuZXIgPSAwOyBpQ29ybmVyIDwgMzsgKytpQ29ybmVyKSB7XG4gICAgICAgIGNvbnN0IGlWZXJ0ZXggPSBjdXJyVGFibGVbMyAqIGlUcmlhbmdsZSArIGlDb3JuZXJdO1xuXG4gICAgICAgIC8vXG5cbiAgICAgICAgLy8gY29uc3QgdmVydGV4ID0gdGhpcy5fYXNFZGdlVmVydGV4W2lWZXJ0ZXhdO1xuICAgICAgICB2ZXJ0ZXhbMF0gPSB0aGlzLl9hc0VkZ2VWZXJ0ZXhbaVZlcnRleCAqIDMgKyAwXTtcbiAgICAgICAgdmVydGV4WzFdID0gdGhpcy5fYXNFZGdlVmVydGV4W2lWZXJ0ZXggKiAzICsgMV07XG4gICAgICAgIHZlcnRleFsyXSA9IHRoaXMuX2FzRWRnZVZlcnRleFtpVmVydGV4ICogMyArIDJdO1xuICAgICAgICAvLyBjb25zdCBub3JtYWwgPSB0aGlzLl9hc0VkZ2VOb3JtW2lWZXJ0ZXhdO1xuICAgICAgICBub3JtYWxbMF0gPSB0aGlzLl9hc0VkZ2VOb3JtW2lWZXJ0ZXggKiAzICsgMF07XG4gICAgICAgIG5vcm1hbFsxXSA9IHRoaXMuX2FzRWRnZU5vcm1baVZlcnRleCAqIDMgKyAxXTtcbiAgICAgICAgbm9ybWFsWzJdID0gdGhpcy5fYXNFZGdlTm9ybVtpVmVydGV4ICogMyArIDJdO1xuXG4gICAgICAgIC8vXG5cbiAgICAgICAgdGhpcy5fb25WZXJ0ZXhDYWxsYmFjayEodmVydGV4LCBub3JtYWwpO1xuICAgICAgfSAvLyBmb3IgKGlDb3JuZXIgPSBbLi4uXVxuICAgIH0gLy8gZm9yIChpVHJpYW5nbGUgPSBbLi4uXVxuICB9XG59XG4iLAogICJjb25zdCBrX2dyYWQzOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl1bXSA9IFtcbiAgWzEsIDEsIDBdLFxuICBbLTEsIDEsIDBdLFxuICBbMSwgLTEsIDBdLFxuICBbLTEsIC0xLCAwXSxcbiAgWzEsIDAsIDFdLFxuICBbLTEsIDAsIDFdLFxuICBbMSwgMCwgLTFdLFxuICBbLTEsIDAsIC0xXSxcbiAgWzAsIDEsIDFdLFxuICBbMCwgLTEsIDFdLFxuICBbMCwgMSwgLTFdLFxuICBbMCwgLTEsIC0xXVxuXTtcblxudHlwZSBHZXROb3JtYWxpemVkUmFuZG9tQ2FsbGJhY2sgPSAoKSA9PiBudW1iZXI7XG5cbmludGVyZmFjZSBJRGVmaW5pdGlvbiB7XG4gIHJhbmRvbUNhbGxiYWNrPzogR2V0Tm9ybWFsaXplZFJhbmRvbUNhbGxiYWNrO1xuICBvY3RhdmVzOiBudW1iZXI7XG4gIGZyZXF1ZW5jeTogbnVtYmVyO1xuICBhbXBsaXR1ZGU6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIENsYXNzaWNhbE5vaXNlIHtcbiAgcHJpdmF0ZSBfb2N0YXZlczogbnVtYmVyID0gMTtcbiAgcHJpdmF0ZSBfZnJlcXVlbmN5OiBudW1iZXIgPSAxLjA7XG4gIHByaXZhdGUgX2FtcGxpdHVkZTogbnVtYmVyID0gMC41O1xuICBwcml2YXRlIF9wZXJtOiBVaW50OEFycmF5O1xuXG4gIGNvbnN0cnVjdG9yKGRlZjogSURlZmluaXRpb24pIHtcbiAgICB0aGlzLl9vY3RhdmVzID0gZGVmLm9jdGF2ZXMgfHwgMTtcbiAgICB0aGlzLl9mcmVxdWVuY3kgPSBkZWYuZnJlcXVlbmN5IHx8IDE7XG4gICAgdGhpcy5fYW1wbGl0dWRlID0gZGVmLmFtcGxpdHVkZSB8fCAwLjU7XG5cbiAgICBjb25zdCByYW5kb21DYWxsYmFjayA9IGRlZi5yYW5kb21DYWxsYmFjayB8fCAoKCkgPT4gTWF0aC5yYW5kb20oKSk7XG5cbiAgICBjb25zdCBrX3NhbXBsZVNpemUgPSAyNTY7XG4gICAgY29uc3Qga19zYW1wbGVEb3VibGVTaXplID0ga19zYW1wbGVTaXplICogMjtcbiAgICBjb25zdCBpbml0aWFsUCA9IG5ldyBVaW50OEFycmF5KGtfc2FtcGxlU2l6ZSk7XG4gICAgZm9yIChsZXQgaWkgPSAwOyBpaSA8IGtfc2FtcGxlU2l6ZTsgKytpaSlcbiAgICAgIGluaXRpYWxQW2lpXSA9IE1hdGguZmxvb3IocmFuZG9tQ2FsbGJhY2soKSAqIGtfc2FtcGxlU2l6ZSkgfCAwO1xuXG4gICAgLy8gVG8gcmVtb3ZlIHRoZSBuZWVkIGZvciBpbmRleCB3cmFwcGluZywgZG91YmxlIHRoZSBwZXJtdXRhdGlvbiB0YWJsZSBsZW5ndGhcbiAgICB0aGlzLl9wZXJtID0gbmV3IFVpbnQ4QXJyYXkoa19zYW1wbGVEb3VibGVTaXplKTtcbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwga19zYW1wbGVEb3VibGVTaXplOyArK2lpKVxuICAgICAgdGhpcy5fcGVybVtpaV0gPSBpbml0aWFsUFtpaSAmIChrX3NhbXBsZVNpemUgLSAxKV0gfCAwO1xuICB9XG5cbiAgZ2V0Tm9pc2UoaW5YOiBudW1iZXIsIGluWTogbnVtYmVyLCBpblo6IG51bWJlcik6IG51bWJlciB7XG4gICAgbGV0IHJlc3VsdCA9IDAuMDtcbiAgICBsZXQgYW1wID0gdGhpcy5fYW1wbGl0dWRlO1xuXG4gICAgbGV0IHggPSBpblggKiB0aGlzLl9mcmVxdWVuY3k7XG4gICAgbGV0IHkgPSBpblkgKiB0aGlzLl9mcmVxdWVuY3k7XG4gICAgbGV0IHogPSBpblogKiB0aGlzLl9mcmVxdWVuY3k7XG5cbiAgICBmb3IgKGxldCBpaSA9IDA7IGlpIDwgdGhpcy5fb2N0YXZlczsgKytpaSkge1xuICAgICAgcmVzdWx0ICs9IHRoaXMuX25vaXNlKHgsIHksIHopICogYW1wO1xuXG4gICAgICB4ICo9IDIuMDtcbiAgICAgIHkgKj0gMi4wO1xuICAgICAgeiAqPSAyLjA7XG5cbiAgICAgIGFtcCAqPSAwLjU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHByaXZhdGUgX2RvdChpOiBudW1iZXIsIHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIpOiBudW1iZXIge1xuICAgIGNvbnN0IGcgPSBrX2dyYWQzW2ldO1xuICAgIHJldHVybiBnWzBdICogeCArIGdbMV0gKiB5ICsgZ1syXSAqIHo7XG4gIH1cblxuICBwcml2YXRlIF9taXgoYTogbnVtYmVyLCBiOiBudW1iZXIsIHQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuICgxIC0gdCkgKiBhICsgdCAqIGI7XG4gIH1cblxuICBwcml2YXRlIF9mYWRlKHQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIHQgKiB0ICogdCAqICh0ICogKHQgKiA2IC0gMTUpICsgMTApO1xuICB9XG5cbiAgcHJpdmF0ZSBfbm9pc2UoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcik6IG51bWJlciB7XG4gICAgLy8gRmluZCB1bml0IGdyaWQgY2VsbCBjb250YWluaW5nIHBvaW50XG4gICAgbGV0IFggPSBNYXRoLmZsb29yKHgpIHwgMDtcbiAgICBsZXQgWSA9IE1hdGguZmxvb3IoeSkgfCAwO1xuICAgIGxldCBaID0gTWF0aC5mbG9vcih6KSB8IDA7XG5cbiAgICAvLyBHZXQgcmVsYXRpdmUgeHl6IGNvb3JkaW5hdGVzIG9mIHBvaW50IHdpdGhpbiB0aGF0IGNlbGxcbiAgICB4ID0geCAtIFg7XG4gICAgeSA9IHkgLSBZO1xuICAgIHogPSB6IC0gWjtcblxuICAgIC8vIFdyYXAgdGhlIGludGVnZXIgY2VsbHMgYXQgMjU1IChzbWFsbGVyIGludGVnZXIgcGVyaW9kIGNhbiBiZSBpbnRyb2R1Y2VkIGhlcmUpXG4gICAgWCA9IChYICYgMjU1KSB8IDA7XG4gICAgWSA9IChZICYgMjU1KSB8IDA7XG4gICAgWiA9IChaICYgMjU1KSB8IDA7XG5cbiAgICAvLyBDYWxjdWxhdGUgYSBzZXQgb2YgZWlnaHQgaGFzaGVkIGdyYWRpZW50IGluZGljZXNcbiAgICBjb25zdCBnaTAwMCA9IHRoaXMuX3Blcm1bWCArIHRoaXMuX3Blcm1bWSArIHRoaXMuX3Blcm1bWl1dXSAlIDEyIHwgMDtcbiAgICBjb25zdCBnaTAwMSA9IHRoaXMuX3Blcm1bWCArIHRoaXMuX3Blcm1bWSArIHRoaXMuX3Blcm1bWiArIDFdXV0gJSAxMiB8IDA7XG4gICAgY29uc3QgZ2kwMTAgPSB0aGlzLl9wZXJtW1ggKyB0aGlzLl9wZXJtW1kgKyAxICsgdGhpcy5fcGVybVtaXV1dICUgMTIgfCAwO1xuICAgIGNvbnN0IGdpMDExID1cbiAgICAgIHRoaXMuX3Blcm1bWCArIHRoaXMuX3Blcm1bWSArIDEgKyB0aGlzLl9wZXJtW1ogKyAxXV1dICUgMTIgfCAwO1xuICAgIGNvbnN0IGdpMTAwID0gdGhpcy5fcGVybVtYICsgMSArIHRoaXMuX3Blcm1bWSArIHRoaXMuX3Blcm1bWl1dXSAlIDEyIHwgMDtcbiAgICBjb25zdCBnaTEwMSA9XG4gICAgICB0aGlzLl9wZXJtW1ggKyAxICsgdGhpcy5fcGVybVtZICsgdGhpcy5fcGVybVtaICsgMV1dXSAlIDEyIHwgMDtcbiAgICBjb25zdCBnaTExMCA9XG4gICAgICB0aGlzLl9wZXJtW1ggKyAxICsgdGhpcy5fcGVybVtZICsgMSArIHRoaXMuX3Blcm1bWl1dXSAlIDEyIHwgMDtcbiAgICBjb25zdCBnaTExMSA9XG4gICAgICB0aGlzLl9wZXJtW1ggKyAxICsgdGhpcy5fcGVybVtZICsgMSArIHRoaXMuX3Blcm1bWiArIDFdXV0gJSAxMiB8IDA7XG5cbiAgICAvLyBDYWxjdWxhdGUgbm9pc2UgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggb2YgdGhlIGVpZ2h0IGNvcm5lcnNcbiAgICBjb25zdCBuMDAwID0gdGhpcy5fZG90KGdpMDAwLCB4LCB5LCB6KTtcbiAgICBjb25zdCBuMTAwID0gdGhpcy5fZG90KGdpMTAwLCB4IC0gMSwgeSwgeik7XG4gICAgY29uc3QgbjAxMCA9IHRoaXMuX2RvdChnaTAxMCwgeCwgeSAtIDEsIHopO1xuICAgIGNvbnN0IG4xMTAgPSB0aGlzLl9kb3QoZ2kxMTAsIHggLSAxLCB5IC0gMSwgeik7XG4gICAgY29uc3QgbjAwMSA9IHRoaXMuX2RvdChnaTAwMSwgeCwgeSwgeiAtIDEpO1xuICAgIGNvbnN0IG4xMDEgPSB0aGlzLl9kb3QoZ2kxMDEsIHggLSAxLCB5LCB6IC0gMSk7XG4gICAgY29uc3QgbjAxMSA9IHRoaXMuX2RvdChnaTAxMSwgeCwgeSAtIDEsIHogLSAxKTtcbiAgICBjb25zdCBuMTExID0gdGhpcy5fZG90KGdpMTExLCB4IC0gMSwgeSAtIDEsIHogLSAxKTtcblxuICAgIC8vIENvbXB1dGUgdGhlIGZhZGUgY3VydmUgdmFsdWUgZm9yIGVhY2ggb2YgeCwgeSwgelxuICAgIGNvbnN0IHUgPSB0aGlzLl9mYWRlKHgpO1xuICAgIGNvbnN0IHYgPSB0aGlzLl9mYWRlKHkpO1xuICAgIGNvbnN0IHcgPSB0aGlzLl9mYWRlKHopO1xuXG4gICAgLy8gSW50ZXJwb2xhdGUgYWxvbmcgeCB0aGUgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggb2YgdGhlIGNvcm5lcnNcbiAgICBjb25zdCBueDAwID0gdGhpcy5fbWl4KG4wMDAsIG4xMDAsIHUpO1xuICAgIGNvbnN0IG54MDEgPSB0aGlzLl9taXgobjAwMSwgbjEwMSwgdSk7XG4gICAgY29uc3QgbngxMCA9IHRoaXMuX21peChuMDEwLCBuMTEwLCB1KTtcbiAgICBjb25zdCBueDExID0gdGhpcy5fbWl4KG4wMTEsIG4xMTEsIHUpO1xuXG4gICAgLy8gSW50ZXJwb2xhdGUgdGhlIGZvdXIgcmVzdWx0cyBhbG9uZyB5XG4gICAgY29uc3Qgbnh5MCA9IHRoaXMuX21peChueDAwLCBueDEwLCB2KTtcbiAgICBjb25zdCBueHkxID0gdGhpcy5fbWl4KG54MDEsIG54MTEsIHYpO1xuXG4gICAgLy8gSW50ZXJwb2xhdGUgdGhlIHR3byBsYXN0IHJlc3VsdHMgYWxvbmcgelxuICAgIGNvbnN0IG54eXogPSB0aGlzLl9taXgobnh5MCwgbnh5MSwgdyk7XG5cbiAgICByZXR1cm4gbnh5ejtcbiAgfVxufVxuIiwKICAiY29uc3QgUkFORF9NQVggPSAyMTQ3NDgzNjQ4IHwgMDtcblxuZXhwb3J0IGNsYXNzIERldGVybWluaXN0aWNSbmcge1xuICBwcml2YXRlIF9zZWVkOiBudW1iZXIgPSAxIHwgMDtcblxuICByYW5kb20oKTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5fc2VlZCA9PSAwKSB0aGlzLl9zZWVkID0gMTIzNDU5ODc2IHwgMDtcblxuICAgIGNvbnN0IGhpID0gKHRoaXMuX3NlZWQgLyAxMjc3NzMpIHwgMDtcbiAgICBjb25zdCBsbyA9IHRoaXMuX3NlZWQgJSAxMjc3NzMgfCAwO1xuICAgIGxldCB4ID0gKDE2ODA3ICogbG8gLSAyODM2ICogaGkpIHwgMDtcblxuICAgIGlmICh4IDwgMCkgeCArPSAweDdmZmZmZmZmIHwgMDtcblxuICAgIHRoaXMuX3NlZWQgPSB4O1xuXG4gICAgcmV0dXJuICh4ICUgKFJBTkRfTUFYICsgMSkpIC8gLVJBTkRfTUFYO1xuICB9XG5cbiAgc2V0U2VlZChpblNlZWQ6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuX3NlZWQgPSBpblNlZWQgfCAwO1xuICB9XG59XG4iLAogICJpbXBvcnQgeyBJTWVzc2FnZSwgVHlwZWRNZXNzYWdlRXZlbnQgfSBmcm9tICcuLi9fY29tbW9uJztcbmltcG9ydCAqIGFzIGNvbmZpZ3VyYXRpb24gZnJvbSAnLi4vbWFpbi9jb25maWd1cmF0aW9uJztcblxuaW1wb3J0IHtcbiAgSU1hcmNoaW5nQWxnb3JpdGhtLFxuICBPblZlcnRleENhbGxiYWNrLFxuICBNYXJjaGluZ0N1YmVcbn0gZnJvbSAnLi9tYXJjaGluZy1hbGdvcml0aG1zJztcblxuaW1wb3J0IHsgQ2xhc3NpY2FsTm9pc2UgfSBmcm9tICcuL2hlbHBlcnMvQ2xhc3NpY2FsTm9pc2UnO1xuaW1wb3J0IHsgRGV0ZXJtaW5pc3RpY1JuZyB9IGZyb20gJy4vaGVscGVycy9EZXRlcm1pbmlzdGljUm5nJztcblxudHlwZSBWZWMzID0gW251bWJlciwgbnVtYmVyLCBudW1iZXJdO1xuXG5jb25zdCB0bXBSbmcgPSBuZXcgRGV0ZXJtaW5pc3RpY1JuZygpO1xudG1wUm5nLnNldFNlZWQoMSk7XG5cbmNvbnN0IHNpbXBsZXhOb2lzZUluc3RhbmNlID0gbmV3IENsYXNzaWNhbE5vaXNlKHtcbiAgcmFuZG9tQ2FsbGJhY2s6ICgpID0+IHRtcFJuZy5yYW5kb20oKSxcbiAgb2N0YXZlczogMSxcbiAgZnJlcXVlbmN5OiAxLFxuICBhbXBsaXR1ZGU6IDAuNVxufSk7XG5cbmNvbnN0IF9jbGFtcCA9IChpblZhbDogbnVtYmVyLCBpbk1pbjogbnVtYmVyLCBpbk1heDogbnVtYmVyKSA9PiB7XG4gIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChpblZhbCwgaW5NaW4pLCBpbk1heCk7XG59O1xuXG5jb25zdCBfbGVycCA9IChpblZhbEE6IG51bWJlciwgaW5WYWxCOiBudW1iZXIsIGluUmF0aW86IG51bWJlcikgPT4ge1xuICByZXR1cm4gaW5WYWxBICsgKGluVmFsQiAtIGluVmFsQSkgKiBfY2xhbXAoaW5SYXRpbywgMCwgMSk7XG59O1xuXG5jb25zdCBfZ2V0TGVuZ3RoID0gKGluWDogbnVtYmVyLCBpblk6IG51bWJlciwgaW5aOiBudW1iZXIpID0+IHtcbiAgcmV0dXJuIE1hdGguc3FydChpblggKiBpblggKyBpblkgKiBpblkgKyBpblogKiBpblopO1xufTtcblxuY29uc3QgX2dldFJhZGl1cyA9IChcbiAgaW5YOiBudW1iZXIsXG4gIGluWTogbnVtYmVyLFxuICBpblo6IG51bWJlcixcbiAgaW5SYWRpdXM6IG51bWJlclxuKSA9PiB7XG4gIHJldHVybiBfZ2V0TGVuZ3RoKGluWCwgaW5ZLCBpblopIC8gaW5SYWRpdXM7XG59O1xuXG5jb25zdCBrX29yaWdpblJhZGl1cyA9IDEuMjU7XG5jb25zdCBrX29yaWdpblJhbmdlID0gMjtcblxuY29uc3Qgb25HZW5lcmljU2FtcGxlQ2FsbGJhY2sgPSAoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcikgPT4ge1xuICByZXR1cm4gc2ltcGxleE5vaXNlSW5zdGFuY2UuZ2V0Tm9pc2UoeCwgeSwgeikgKyAwLjU7IC8vIFswLi4xXVxufTtcblxuY29uc3Qgb25PcmlnaW5TYW1wbGVDYWxsYmFjayA9IChpblg6IG51bWJlciwgaW5ZOiBudW1iZXIsIGluWjogbnVtYmVyKSA9PiB7XG4gIGNvbnN0IG5vaXNlVmFsdWUgPSBvbkdlbmVyaWNTYW1wbGVDYWxsYmFjayhpblgsIGluWSwgaW5aKTtcblxuICBjb25zdCBsZXJwQ29lZiA9IDEgLSBfZ2V0UmFkaXVzKGluWCwgaW5ZLCBpblosIGtfb3JpZ2luUmFkaXVzKTtcblxuICByZXR1cm4gX2xlcnAobm9pc2VWYWx1ZSwgMCwgbGVycENvZWYpO1xufTtcblxuY29uc3QgbWFyY2hpbmdDdWJlSW5zdGFuY2U6IElNYXJjaGluZ0FsZ29yaXRobSA9IG5ldyBNYXJjaGluZ0N1YmUoXG4gIGNvbmZpZ3VyYXRpb24uY2h1bmtMb2dpY1NpemUsXG4gIGNvbmZpZ3VyYXRpb24uY2h1bmtUaHJlc2hvbGRcbik7XG5cbmNvbnN0IG15c2VsZiA9IHNlbGYgYXMgdW5rbm93biBhcyBXb3JrZXI7IC8vIHdlbGwsIHRoYXQncyBhcHBhcmVudGx5IG5lZWRlZC4uLlxuXG5jb25zdCBvbk1haW5TY3JpcHRNZXNzYWdlID0gKGV2ZW50OiBUeXBlZE1lc3NhZ2VFdmVudDxJTWVzc2FnZT4pID0+IHtcbiAgY29uc3Qge1xuICAgIGluZGV4UG9zaXRpb24sXG4gICAgcmVhbFBvc2l0aW9uLFxuICAgIGdlb21ldHJ5RmxvYXQzMmJ1ZmZlcixcbiAgICBnZW9tZXRyeUJ1ZmZlclNpemVcbiAgfSA9IGV2ZW50LmRhdGE7XG5cbiAgLy9cbiAgLy8gZ2VuZXJhdGVcblxuICBjb25zdCBsb2dpY09yaWdpbjogVmVjMyA9IFtcbiAgICBpbmRleFBvc2l0aW9uWzBdICogY29uZmlndXJhdGlvbi5jaHVua0xvZ2ljU2l6ZSxcbiAgICBpbmRleFBvc2l0aW9uWzFdICogY29uZmlndXJhdGlvbi5jaHVua0xvZ2ljU2l6ZSxcbiAgICBpbmRleFBvc2l0aW9uWzJdICogY29uZmlndXJhdGlvbi5jaHVua0xvZ2ljU2l6ZVxuICBdO1xuXG4gIGxldCBidWZJbmRleCA9IDA7XG5cbiAgY29uc3Qgb25WZXJ0ZXhDYWxsYmFjazogT25WZXJ0ZXhDYWxsYmFjayA9ICh2ZXJ0ZXg6IFZlYzMsIG5vcm1hbDogVmVjMykgPT4ge1xuICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4sIGJ1dCBqdXN0IGluIGNhc2VcbiAgICBpZiAoYnVmSW5kZXggKyA2ID4gZ2VvbWV0cnlCdWZmZXJTaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gY29udmVuaWVudGx5IHNldHRpbmcgdXAgdGhlIGJ1ZmZlciB0byB3b3JrIHdpdGggdGhlIHJlY2VpdmluZyBnZW9tZXRyeVxuXG4gICAgZ2VvbWV0cnlGbG9hdDMyYnVmZmVyW2J1ZkluZGV4KytdID0gdmVydGV4WzBdO1xuICAgIGdlb21ldHJ5RmxvYXQzMmJ1ZmZlcltidWZJbmRleCsrXSA9IHZlcnRleFsxXTtcbiAgICBnZW9tZXRyeUZsb2F0MzJidWZmZXJbYnVmSW5kZXgrK10gPSB2ZXJ0ZXhbMl07XG4gICAgZ2VvbWV0cnlGbG9hdDMyYnVmZmVyW2J1ZkluZGV4KytdID0gbm9ybWFsWzBdO1xuICAgIGdlb21ldHJ5RmxvYXQzMmJ1ZmZlcltidWZJbmRleCsrXSA9IG5vcm1hbFsxXTtcbiAgICBnZW9tZXRyeUZsb2F0MzJidWZmZXJbYnVmSW5kZXgrK10gPSBub3JtYWxbMl07XG4gIH07XG5cbiAgY29uc3QgaXNPdXRzaWRlVGhlT3JpZ2luID1cbiAgICBpbmRleFBvc2l0aW9uWzBdIDwgLWtfb3JpZ2luUmFuZ2UgfHxcbiAgICBpbmRleFBvc2l0aW9uWzBdID4gK2tfb3JpZ2luUmFuZ2UgfHxcbiAgICBpbmRleFBvc2l0aW9uWzFdIDwgLWtfb3JpZ2luUmFuZ2UgfHxcbiAgICBpbmRleFBvc2l0aW9uWzFdID4gK2tfb3JpZ2luUmFuZ2UgfHxcbiAgICBpbmRleFBvc2l0aW9uWzJdIDwgLWtfb3JpZ2luUmFuZ2UgfHxcbiAgICBpbmRleFBvc2l0aW9uWzJdID4gK2tfb3JpZ2luUmFuZ2U7XG5cbiAgY29uc3Qgb25TYW1wbGVDYWxsYmFjayA9IGlzT3V0c2lkZVRoZU9yaWdpblxuICAgID8gb25HZW5lcmljU2FtcGxlQ2FsbGJhY2tcbiAgICA6IG9uT3JpZ2luU2FtcGxlQ2FsbGJhY2s7XG5cbiAgbWFyY2hpbmdDdWJlSW5zdGFuY2UuZ2VuZXJhdGUoXG4gICAgbG9naWNPcmlnaW4sXG4gICAgb25WZXJ0ZXhDYWxsYmFjayxcbiAgICBvblNhbXBsZUNhbGxiYWNrXG4gICk7XG5cbiAgLy9cblxuICBjb25zdCB0b1NlbmQ6IElNZXNzYWdlID0ge1xuICAgIGluZGV4UG9zaXRpb24sXG4gICAgcmVhbFBvc2l0aW9uLFxuICAgIGdlb21ldHJ5RmxvYXQzMmJ1ZmZlcixcbiAgICBnZW9tZXRyeUJ1ZmZlclNpemUsXG4gICAgc2l6ZVVzZWQ6IGJ1ZkluZGV4LFxuICAgIHRpbWU6IGV2ZW50LmRhdGEudGltZVxuICB9O1xuXG4gIG15c2VsZi5wb3N0TWVzc2FnZSh0b1NlbmQsIFtcbiAgICAvLyB3ZSBub3cgdHJhbnNmZXIgdGhlIG93bmVyc2hpcCBvZiB0aGUgdmVydGljZXMgYnVmZmVyXG4gICAgZ2VvbWV0cnlGbG9hdDMyYnVmZmVyLmJ1ZmZlclxuICBdKTtcbn07XG5cbm15c2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25NYWluU2NyaXB0TWVzc2FnZSwgZmFsc2UpO1xuIgogIF0sCiAgIm1hcHBpbmdzIjogIjtBQUNPLElBQU0saUJBQWlCO0FBQ3ZCLElBQU0saUJBQWlCOzs7QUNBdkIsSUFBTSxZQUFZLENBQ3ZCLFNBQ0EsU0FDQSxrQkFDVztBQUNYLFFBQU0sU0FBUyxVQUFVO0FBRXpCLE1BQUksV0FBVztBQUFHLFdBQU87QUFFekIsVUFBUSxnQkFBZ0IsV0FBVztBQUFBO0FBRzlCLElBQU0sc0JBQXNCLENBQ2pDLEdBQ0EsR0FDQSxNQUNXO0FBQ1gsU0FBTyxLQUFLLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUM7QUFBQTs7O0FDZmpDLElBQU0sa0JBQTBCO0FBQUEsRUFDckMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdB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QUFBQSxFQUNMLENBQUMsR0FBRyxDQUFDO0FBQUEsRUFDTCxDQUFDLEdBQUcsQ0FBQztBQUFBLEVBQ0wsQ0FBQyxHQUFHLENBQUM7QUFDUDtBQUdPLElBQU0sbUJBQTJCO0FBQUEsRUFDdEMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsRUFBQyxHQUFJLEdBQUcsQ0FBQztBQUFBLEVBQ1QsQ0FBQyxJQUFHLEdBQUksQ0FBQztBQUFBLEVBQ1QsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsRUFBQyxHQUFJLEdBQUcsQ0FBQztBQUFBLEVBQ1QsQ0FBQyxJQUFHLEdBQUksQ0FBQztBQUFBLEVBQ1QsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQ1IsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNWO0FBR08sSUFBTSw2QkFBc0M7QUFBQSxFQUNqRCxFQUFDLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMvRCxDQUFDLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM3RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM3RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMzRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFHLENBQUU7QUFBQSxFQUNwRCxDQUFDLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNwRCxDQUFDLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM3RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMzRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNoRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFHLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNqRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMzRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFHLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNsRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNoRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFHLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNqRCxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM3RCxDQUFDLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM3RCxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMzRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNsRCxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMzRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNsRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNoRCxDQUFDLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNqRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNoRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNqRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM3RCxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLElBQUksR0FBRyxJQUFJLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNqRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNqRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNsRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNsRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN2RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksSUFBSSxJQUFHLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNuRCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLElBQUksR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNwRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLENBQUU7QUFBQSxFQUNsRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN0RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNuRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsSUFBSSxHQUFHLElBQUksSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMzRCxDQUFDLEdBQUcsR0FBRyxLQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM3RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN4RCxDQUFDLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUMxRCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUNyRCxDQUFDLEdBQUcsSUFBSSxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM3RCxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUN6RCxDQUFDLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxDQUFDLEdBQUcsR0FBRyxJQUFHLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFBQSxFQUM1RCxFQUFDLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUU7QUFDakU7QUFHTyxJQUFNLGtCQUFrQixJQUFJLFdBQVc7QUFBQSxFQUM1QztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUFPO0FBQUEsRUFBTztBQUFBLEVBQU87QUFBQSxFQUN0RTtBQUFBLEVBQU87QUFB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QUFLLE1BQU0sSUFBSSxLQUFLLE1BQU0sSUFBSSxLQUFLLE1BQU0sSUFBSSxPQUFPLEtBQUs7QUFDdkUsVUFBTSxRQUFRLEtBQUssTUFBTSxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxNQUFNLE9BQU8sS0FBSztBQUN2RSxVQUFNLFFBQ0osS0FBSyxNQUFNLElBQUksS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLE1BQU0sSUFBSSxPQUFPLEtBQUs7QUFDL0QsVUFBTSxRQUFRLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxNQUFNLElBQUksS0FBSyxNQUFNLE9BQU8sS0FBSztBQUN2RSxVQUFNLFFBQ0osS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLE1BQU0sSUFBSSxLQUFLLE1BQU0sSUFBSSxPQUFPLEtBQUs7QUFDL0QsVUFBTSxRQUNKLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxNQUFNLElBQUksSUFBSSxLQUFLLE1BQU0sT0FBTyxLQUFLO0FBQy9ELFVBQU0sUUFDSixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxNQUFNLElBQUksT0FBTyxLQUFLO0FBR25FLFVBQU0sT0FBTyxLQUFLLEtBQUssT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNyQyxVQUFNLE9BQU8sS0FBSyxLQUFLLE9BQU8sSUFBSSxHQUFHLEdBQUcsQ0FBQztBQUN6QyxVQUFNLE9BQU8sS0FBSyxLQUFLLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQztBQUN6QyxVQUFNLE9BQU8sS0FBSyxLQUFLLE9BQU8sSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDO0FBQzdDLFVBQU0sT0FBTyxLQUFLLEtBQUssT0FBTyxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ3pDLFVBQU0sT0FBTyxLQUFLLEtBQUssT0FBTyxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDN0MsVUFBTSxPQUFPLEtBQUssS0FBSyxPQUFPLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztBQUM3QyxVQUFNLE9BQU8sS0FBSyxLQUFLLE9B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QUFBQSxJQUNqQyxjQUFjLEtBQW1CO0FBQUEsRUFDbkM7QUFFQSxNQUFJLFdBQVc7QUFFZixRQUFNLG1CQUFxQyxDQUFDLFFBQWMsV0FBaUI7QUFFekUsUUFBSSxXQUFXLElBQUksb0JBQW9CO0FBQ3JDO0FBQUEsSUFDRjtBQUlBLDBCQUFzQixjQUFjLE9BQU87QUFDM0MsMEJBQXNCLGNBQWMsT0FBTztBQUMzQywwQkFBc0IsY0FBYyxPQUFPO0FBQzNDLDBCQUFzQixjQUFjLE9BQU87QUFDM0MsMEJBQXNCLGNBQWMsT0FBTztBQUMzQywwQkFBc0IsY0FBYyxPQUFPO0FBQUE7QUFHN0MsUUFBTSxxQkFDSixjQUFjLE1BQU0saUJBQ3BCLGNBQWMsTUFBTSxpQkFDcEIsY0FBYyxNQUFNLGlCQUNwQixjQUFjLE1BQU0saUJBQ3BCLGNBQWMsTUFBTSxpQkFDcEIsY0FBYyxNQUFNO0FBRXRCLFFBQU0sbUJBQW1CLHFCQUNyQiwwQkFDQTtBQUVKLHVCQUFxQixTQUNuQixhQUNBLGtCQUNBLGdCQUNGO0FBSUEsUUFBTSxTQUFtQjtBQUFBLElBQ3ZCO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQSxVQUFVO0FBQUEsSUFDVixNQUFNLE1BQU0sS0FBSztBQUFBLEVBQ25CO0FBRUEsU0FBTyxZQUFZLFFBQVE7QUFBQSxJQUV6QixzQkFBc0I7QUFBQSxFQUN4QixDQUFDO0FBQUE7QUFHSCxPQUFPLGlCQUFpQixXQUFXLHFCQUFxQixLQUFLOyIsCiAgImRlYnVnSWQiOiAiREY3REZGMkFBN0NGRTA3MDY0NzU2ZTIxNjQ3NTZlMjEiLAogICJuYW1lcyI6IFtdCn0=
