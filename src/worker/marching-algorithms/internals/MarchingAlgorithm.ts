import { Vec3 } from './types';
import * as utilities from './utilities';

// common
export const a2fVertexOffset: Vec3[] = [
  [0, 0, 0],
  [1, 0, 0],
  [1, 1, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [1, 1, 1],
  [0, 1, 1]
];

export type OnSampleCallback = (x: number, y: number, z: number) => number;

export type OnVertexCallback = (vertex: Vec3, normal: Vec3) => void;

export interface IMarchingAlgorithm {
  generate(
    inPos: Vec3,
    onVertexCallback: OnVertexCallback,
    onSampleCallback: OnSampleCallback
  ): void;
}

export class AbstractMarchingAlgorithm {
  protected _chunkSize: number;
  protected _threshold: number;
  protected _onSampleCallback: OnSampleCallback | undefined;
  protected _stepSize: number;
  protected _onVertexCallback: OnVertexCallback | undefined;
  protected _stepPos: Vec3 = [0, 0, 0];

  constructor(inChunkSize: number, inThreshold: number) {
    this._chunkSize = inChunkSize;
    this._threshold = inThreshold;

    this._stepSize = 1.0 / this._chunkSize;
  }

  protected _getSample(x: number, y: number, z: number): number {
    return this._onSampleCallback!(
      this._stepPos[0] + x,
      this._stepPos[1] + y,
      this._stepPos[2] + z
    );
  }

  protected _getNormal(fX: number, fY: number, fZ: number): Vec3 {
    const offset = this._stepSize * 0.1;

    const nX = this._getSample(fX - offset, fY, fZ);
    const pX = this._getSample(fX + offset, fY, fZ);
    const nY = this._getSample(fX, fY - offset, fZ);
    const pY = this._getSample(fX, fY + offset, fZ);
    const nZ = this._getSample(fX, fY, fZ - offset);
    const pZ = this._getSample(fX, fY, fZ + offset);

    return utilities._getNormalizeVector(nX - pX, nY - pY, nZ - pZ);
  }

  protected _getNormalToBuf(
    fX: number,
    fY: number,
    fZ: number,
    inBuf: Float32Array,
    inIndex: number
  ): void {
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
    const length = utilities._getVectorMagnitude(normX, normY, normZ);
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
