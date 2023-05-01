
export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

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

export namespace utilities {
  export const getOffset = (
    fValue1: number,
    fValue2: number,
    fValueDesired: number
  ): number => {
    const fDelta = fValue2 - fValue1;

    if (fDelta == 0) return 0.5;

    return (fValueDesired - fValue1) / fDelta;
  };

  export const normalizeVector = (vec: Vec3): Vec3 => {
    const length = Math.sqrt(
      vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]
    );

    if (length == 0) return vec;

    const tmp_scale = 1 / length;

    return [vec[0] * tmp_scale, vec[1] * tmp_scale, vec[2] * tmp_scale];
  };
}

export type SampleCallback = (x: number, y: number, z: number) => number;

export type OnVertexCallback = (vertex: Vec3, normal: Vec3) => void;

export interface IMarchingAlgorithm {

  generate(pos: Vec3, onVertexCallback: OnVertexCallback): void;
}

export class AbstractMarchingAlgorithm {
  protected _chunkSize: number;
  protected _limit: number;
  protected _sampleCallback: SampleCallback;
  protected _stepSize: number;
  protected _onVertexCallback: OnVertexCallback | undefined;

  constructor(chunkSize: number, limit: number, sampleCallback: SampleCallback) {

    this._chunkSize = chunkSize;
    this._limit = limit;
    this._sampleCallback = sampleCallback;

    this._stepSize = 1.0 / this._chunkSize;
  }


  getNormal(fX: number, fY: number, fZ: number): Vec3 {
    const offset = this._stepSize * 0.1;

    return utilities.normalizeVector([
      this._sampleCallback(fX - offset, fY, fZ) - this._sampleCallback(fX + offset, fY, fZ),
      this._sampleCallback(fX, fY - offset, fZ) - this._sampleCallback(fX, fY + offset, fZ),
      this._sampleCallback(fX, fY, fZ - offset) - this._sampleCallback(fX, fY, fZ + offset)
    ]);
  }

  getNormal2(t1: Vec3, t2: Vec3, t3: Vec3): Vec3 {
    const Ux = t2[0] - t1[0];
    const Uy = t2[1] - t1[1];
    const Uz = t2[2] - t1[2];
    const Vx = t3[0] - t1[0];
    const Vy = t3[1] - t1[1];
    const Vz = t3[2] - t1[2];

    return [Uy * Vz - Uz * Vy, Uz * Vx - Ux * Vz, Ux * Vy - Uy * Vx];
  }

}
