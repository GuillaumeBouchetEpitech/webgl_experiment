import * as glm from 'gl-matrix';

enum FrustumSide {
  Right = 0,
  Left = 1,
  Bottom = 2,
  Top = 3,
  Back = 4,
  Front = 5
}

enum PlaneData {
  A = 0,
  B = 1,
  C = 2,
  D = 3
}

export interface IFrustumCulling {
  calculateFrustum(proj: glm.ReadonlyMat4, view: glm.ReadonlyMat4): void;
  sphereInFrustum(x: number, y: number, z: number, radius: number): boolean;
  pointInFrustum(x: number, y: number, z: number): boolean;
  cubeInFrustum(inX: number, inY: number, inZ: number, inSize: number): boolean;
}

export class FrustumCulling implements IFrustumCulling {
  private _frustum = new Float32Array(24); // 6 * 4 values

  private _normalizePlane(side: FrustumSide) {
    const index = side * 4;

    const magnitude = Math.sqrt(
      this._frustum[index + PlaneData.A] * this._frustum[index + PlaneData.A] +
      this._frustum[index + PlaneData.B] * this._frustum[index + PlaneData.B] +
      this._frustum[index + PlaneData.C] * this._frustum[index + PlaneData.C]
    );

    if (magnitude === 0)
      return;

    this._frustum[index + PlaneData.A] /= magnitude;
    this._frustum[index + PlaneData.B] /= magnitude;
    this._frustum[index + PlaneData.C] /= magnitude;
    this._frustum[index + PlaneData.D] /= magnitude;
  }

  calculateFrustum(proj: glm.ReadonlyMat4, view: glm.ReadonlyMat4) {
    const clip = new Float32Array(16);

    clip[0] =
      view[0] * proj[0] +
      view[1] * proj[4] +
      view[2] * proj[8] +
      view[3] * proj[12];
    clip[1] =
      view[0] * proj[1] +
      view[1] * proj[5] +
      view[2] * proj[9] +
      view[3] * proj[13];
    clip[2] =
      view[0] * proj[2] +
      view[1] * proj[6] +
      view[2] * proj[10] +
      view[3] * proj[14];
    clip[3] =
      view[0] * proj[3] +
      view[1] * proj[7] +
      view[2] * proj[11] +
      view[3] * proj[15];

    clip[4] =
      view[4] * proj[0] +
      view[5] * proj[4] +
      view[6] * proj[8] +
      view[7] * proj[12];
    clip[5] =
      view[4] * proj[1] +
      view[5] * proj[5] +
      view[6] * proj[9] +
      view[7] * proj[13];
    clip[6] =
      view[4] * proj[2] +
      view[5] * proj[6] +
      view[6] * proj[10] +
      view[7] * proj[14];
    clip[7] =
      view[4] * proj[3] +
      view[5] * proj[7] +
      view[6] * proj[11] +
      view[7] * proj[15];

    clip[8] =
      view[8] * proj[0] +
      view[9] * proj[4] +
      view[10] * proj[8] +
      view[11] * proj[12];
    clip[9] =
      view[8] * proj[1] +
      view[9] * proj[5] +
      view[10] * proj[9] +
      view[11] * proj[13];
    clip[10] =
      view[8] * proj[2] +
      view[9] * proj[6] +
      view[10] * proj[10] +
      view[11] * proj[14];
    clip[11] =
      view[8] * proj[3] +
      view[9] * proj[7] +
      view[10] * proj[11] +
      view[11] * proj[15];

    clip[12] =
      view[12] * proj[0] +
      view[13] * proj[4] +
      view[14] * proj[8] +
      view[15] * proj[12];
    clip[13] =
      view[12] * proj[1] +
      view[13] * proj[5] +
      view[14] * proj[9] +
      view[15] * proj[13];
    clip[14] =
      view[12] * proj[2] +
      view[13] * proj[6] +
      view[14] * proj[10] +
      view[15] * proj[14];
    clip[15] =
      view[12] * proj[3] +
      view[13] * proj[7] +
      view[14] * proj[11] +
      view[15] * proj[15];

    ///

    let index = FrustumSide.Right * 4;
    this._frustum[index + PlaneData.A] = clip[3] - clip[0];
    this._frustum[index + PlaneData.B] = clip[7] - clip[4];
    this._frustum[index + PlaneData.C] = clip[11] - clip[8];
    this._frustum[index + PlaneData.D] = clip[15] - clip[12];
    this._normalizePlane(FrustumSide.Right);
    index = FrustumSide.Left * 4;
    this._frustum[index + PlaneData.A] = clip[3] + clip[0];
    this._frustum[index + PlaneData.B] = clip[7] + clip[4];
    this._frustum[index + PlaneData.C] = clip[11] + clip[8];
    this._frustum[index + PlaneData.D] = clip[15] + clip[12];
    this._normalizePlane(FrustumSide.Left);

    index = FrustumSide.Bottom * 4;
    this._frustum[index + PlaneData.A] = clip[3] + clip[1];
    this._frustum[index + PlaneData.B] = clip[7] + clip[5];
    this._frustum[index + PlaneData.C] = clip[11] + clip[9];
    this._frustum[index + PlaneData.D] = clip[15] + clip[13];
    this._normalizePlane(FrustumSide.Bottom);

    index = FrustumSide.Top * 4;
    this._frustum[index + PlaneData.A] = clip[3] - clip[1];
    this._frustum[index + PlaneData.B] = clip[7] - clip[5];
    this._frustum[index + PlaneData.C] = clip[11] - clip[9];
    this._frustum[index + PlaneData.D] = clip[15] - clip[13];
    this._normalizePlane(FrustumSide.Top);

    index = FrustumSide.Back * 4;
    this._frustum[index + PlaneData.A] = clip[3] - clip[2];
    this._frustum[index + PlaneData.B] = clip[7] - clip[6];
    this._frustum[index + PlaneData.C] = clip[11] - clip[10];
    this._frustum[index + PlaneData.D] = clip[15] - clip[14];
    this._normalizePlane(FrustumSide.Back);

    index = FrustumSide.Front * 4;
    this._frustum[index + PlaneData.A] = clip[3] + clip[2];
    this._frustum[index + PlaneData.B] = clip[7] + clip[6];
    this._frustum[index + PlaneData.C] = clip[11] + clip[10];
    this._frustum[index + PlaneData.D] = clip[15] + clip[14];
    this._normalizePlane(FrustumSide.Front);
  }

  sphereInFrustum(x: number, y: number, z: number, radius: number) {
    for (let index = 0; index < 6; ++index) {
      if (
        this._frustum[index * 4 + PlaneData.A] * x +
          this._frustum[index * 4 + PlaneData.B] * y +
          this._frustum[index * 4 + PlaneData.C] * z +
          this._frustum[index * 4 + PlaneData.D] <=
        radius
      ) {
        return false;
      }
    }

    return true;
  }

  pointInFrustum(x: number, y: number, z: number) {
    // sphere of radius 0 => point
    return this.sphereInFrustum(x, y, z, 0);
  }

  cubeInFrustum(inX: number, inY: number, inZ: number, inSize: number) {
    const minX = inX - inSize;
    const minY = inY - inSize;
    const minZ = inZ - inSize;
    const maxX = inX + inSize;
    const maxY = inY + inSize;
    const maxZ = inZ + inSize;

    for (let index = 0; index < 6; ++index) {
      const planDataA = this._frustum[index * 4 + PlaneData.A];
      const planDataB = this._frustum[index * 4 + PlaneData.B];
      const planDataC = this._frustum[index * 4 + PlaneData.C];
      const planDataD = this._frustum[index * 4 + PlaneData.D];

      if (
        planDataA * minX + planDataB * minY + planDataC * minZ + planDataD >
        0
      ) {
        continue;
      }

      if (
        planDataA * maxX + planDataB * minY + planDataC * minZ + planDataD >
        0
      ) {
        continue;
      }

      if (
        planDataA * minX + planDataB * maxY + planDataC * minZ + planDataD >
        0
      ) {
        continue;
      }

      if (
        planDataA * maxX + planDataB * maxY + planDataC * minZ + planDataD >
        0
      ) {
        continue;
      }

      ///

      if (
        planDataA * minX + planDataB * minY + planDataC * maxZ + planDataD >
        0
      ) {
        continue;
      }

      if (
        planDataA * maxX + planDataB * minY + planDataC * maxZ + planDataD >
        0
      ) {
        continue;
      }

      if (
        planDataA * minX + planDataB * maxY + planDataC * maxZ + planDataD >
        0
      ) {
        continue;
      }

      if (
        planDataA * maxX + planDataB * maxY + planDataC * maxZ + planDataD >
        0
      ) {
        continue;
      }

      return false;
    }

    return true;
  }
}
