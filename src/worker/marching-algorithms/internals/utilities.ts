import { Vec3 } from './types';

export const getOffset = (
  fValue1: number,
  fValue2: number,
  fValueDesired: number
): number => {
  const fDelta = fValue2 - fValue1;

  if (fDelta === 0) return 0.5;

  return (fValueDesired - fValue1) / fDelta;
};

export const _getVectorMagnitude = (
  x: number,
  y: number,
  z: number
): number => {
  return Math.sqrt(x * x + y * y + z * z);
};

export const getVectorMagnitude = (vec: Vec3): number => {
  return _getVectorMagnitude(vec[0], vec[1], vec[2]);
};

export const _getNormalizeVector = (x: number, y: number, z: number): Vec3 => {
  const length = _getVectorMagnitude(x, y, z);

  if (length === 0) {
    return [x, y, z];
  }

  const scale = 1 / length;

  return [x * scale, y * scale, z * scale];
};

export const getNormalizeVector = (vec: Vec3): Vec3 => {
  return _getNormalizeVector(vec[0], vec[1], vec[2]);
};

export const computeTriangleNormal = (t1: Vec3, t2: Vec3, t3: Vec3): Vec3 => {
  const Ux = t2[0] - t1[0];
  const Uy = t2[1] - t1[1];
  const Uz = t2[2] - t1[2];
  const Vx = t3[0] - t1[0];
  const Vy = t3[1] - t1[1];
  const Vz = t3[2] - t1[2];

  const normX = Uy * Vz - Uz * Vy;
  const normY = Uz * Vx - Ux * Vz;
  const normZ = Ux * Vy - Uy * Vx;

  return _getNormalizeVector(normX, normY, normZ);
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

export class CubeData {
  private _size: number;
  private _buffer: Float32Array;

  constructor(inBuffer: Float32Array, inSize: number) {
    this._size = inSize;
    this._buffer = inBuffer;
  }

  set(inX: number, inY: number, inZ: number, inValue: number) {
    this._buffer[this._getIndex(inX, inY, inZ)] = inValue;
  }

  get(inX: number, inY: number, inZ: number): number {
    return this._buffer[this._getIndex(inX, inY, inZ)];
  }

  private _getIndex(inX: number, inY: number, inZ: number) {
    return inZ * this._size * this._size + inY * this._size + inX;
  }
}
