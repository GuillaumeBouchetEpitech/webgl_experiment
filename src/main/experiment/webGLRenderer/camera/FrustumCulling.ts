
import * as glm from 'gl-matrix';

enum FrustumSide {
    Right = 0,
    Left = 1,
    Bottom = 2,
    Top = 3,
    Back = 4,
    Front = 5
};

enum PlaneData {
    A = 0,
    B = 1,
    C = 2,
    D = 3
};

class FrustumCulling {

    private _frustum = new Float32Array(24); // 6 * 4 values

    normalizePlane(side: FrustumSide) {

        const index = side * 4;

        const magnitude = Math.sqrt(
            this._frustum[index + PlaneData.A] * this._frustum[index + PlaneData.A] +
            this._frustum[index + PlaneData.B] * this._frustum[index + PlaneData.B] +
            this._frustum[index + PlaneData.C] * this._frustum[index + PlaneData.C]
        );

        this._frustum[index + PlaneData.A] /= magnitude;
        this._frustum[index + PlaneData.B] /= magnitude;
        this._frustum[index + PlaneData.C] /= magnitude;
        this._frustum[index + PlaneData.D] /= magnitude;
    }

    calculateFrustum(proj: glm.mat4, modl: glm.mat4) {

        const clip = new Float32Array(16);

        clip[ 0] = modl[ 0] * proj[ 0] + modl[ 1] * proj[ 4] + modl[ 2] * proj[ 8] + modl[ 3] * proj[12];
        clip[ 1] = modl[ 0] * proj[ 1] + modl[ 1] * proj[ 5] + modl[ 2] * proj[ 9] + modl[ 3] * proj[13];
        clip[ 2] = modl[ 0] * proj[ 2] + modl[ 1] * proj[ 6] + modl[ 2] * proj[10] + modl[ 3] * proj[14];
        clip[ 3] = modl[ 0] * proj[ 3] + modl[ 1] * proj[ 7] + modl[ 2] * proj[11] + modl[ 3] * proj[15];

        clip[ 4] = modl[ 4] * proj[ 0] + modl[ 5] * proj[ 4] + modl[ 6] * proj[ 8] + modl[ 7] * proj[12];
        clip[ 5] = modl[ 4] * proj[ 1] + modl[ 5] * proj[ 5] + modl[ 6] * proj[ 9] + modl[ 7] * proj[13];
        clip[ 6] = modl[ 4] * proj[ 2] + modl[ 5] * proj[ 6] + modl[ 6] * proj[10] + modl[ 7] * proj[14];
        clip[ 7] = modl[ 4] * proj[ 3] + modl[ 5] * proj[ 7] + modl[ 6] * proj[11] + modl[ 7] * proj[15];

        clip[ 8] = modl[ 8] * proj[ 0] + modl[ 9] * proj[ 4] + modl[10] * proj[ 8] + modl[11] * proj[12];
        clip[ 9] = modl[ 8] * proj[ 1] + modl[ 9] * proj[ 5] + modl[10] * proj[ 9] + modl[11] * proj[13];
        clip[10] = modl[ 8] * proj[ 2] + modl[ 9] * proj[ 6] + modl[10] * proj[10] + modl[11] * proj[14];
        clip[11] = modl[ 8] * proj[ 3] + modl[ 9] * proj[ 7] + modl[10] * proj[11] + modl[11] * proj[15];

        clip[12] = modl[12] * proj[ 0] + modl[13] * proj[ 4] + modl[14] * proj[ 8] + modl[15] * proj[12];
        clip[13] = modl[12] * proj[ 1] + modl[13] * proj[ 5] + modl[14] * proj[ 9] + modl[15] * proj[13];
        clip[14] = modl[12] * proj[ 2] + modl[13] * proj[ 6] + modl[14] * proj[10] + modl[15] * proj[14];
        clip[15] = modl[12] * proj[ 3] + modl[13] * proj[ 7] + modl[14] * proj[11] + modl[15] * proj[15];

        ///

        let index = FrustumSide.Right * 4;
        this._frustum[index + PlaneData.A] = clip[ 3] - clip[ 0];
        this._frustum[index + PlaneData.B] = clip[ 7] - clip[ 4];
        this._frustum[index + PlaneData.C] = clip[11] - clip[ 8];
        this._frustum[index + PlaneData.D] = clip[15] - clip[12];
        this.normalizePlane(FrustumSide.Right);
        index = FrustumSide.Left * 4;
        this._frustum[index + PlaneData.A] = clip[ 3] + clip[ 0];
        this._frustum[index + PlaneData.B] = clip[ 7] + clip[ 4];
        this._frustum[index + PlaneData.C] = clip[11] + clip[ 8];
        this._frustum[index + PlaneData.D] = clip[15] + clip[12];
        this.normalizePlane(FrustumSide.Left);


        index = FrustumSide.Bottom * 4;
        this._frustum[index + PlaneData.A] = clip[ 3] + clip[ 1];
        this._frustum[index + PlaneData.B] = clip[ 7] + clip[ 5];
        this._frustum[index + PlaneData.C] = clip[11] + clip[ 9];
        this._frustum[index + PlaneData.D] = clip[15] + clip[13];
        this.normalizePlane(FrustumSide.Bottom);

        index = FrustumSide.Top * 4;
        this._frustum[index + PlaneData.A] = clip[ 3] - clip[ 1];
        this._frustum[index + PlaneData.B] = clip[ 7] - clip[ 5];
        this._frustum[index + PlaneData.C] = clip[11] - clip[ 9];
        this._frustum[index + PlaneData.D] = clip[15] - clip[13];
        this.normalizePlane(FrustumSide.Top);


        index = FrustumSide.Back * 4;
        this._frustum[index + PlaneData.A] = clip[ 3] - clip[ 2];
        this._frustum[index + PlaneData.B] = clip[ 7] - clip[ 6];
        this._frustum[index + PlaneData.C] = clip[11] - clip[10];
        this._frustum[index + PlaneData.D] = clip[15] - clip[14];
        this.normalizePlane(FrustumSide.Back);

        index = FrustumSide.Front * 4;
        this._frustum[index + PlaneData.A] = clip[ 3] + clip[ 2];
        this._frustum[index + PlaneData.B] = clip[ 7] + clip[ 6];
        this._frustum[index + PlaneData.C] = clip[11] + clip[10];
        this._frustum[index + PlaneData.D] = clip[15] + clip[14];
        this.normalizePlane(FrustumSide.Front);
    }

    sphereInFrustum(x: number, y: number, z: number, radius: number) {

        for (let ii = 0; ii < 6; ++ii) {

            if (this._frustum[ii * 4 + PlaneData.A] * x +
                this._frustum[ii * 4 + PlaneData.B] * y +
                this._frustum[ii * 4 + PlaneData.C] * z +
                this._frustum[ii * 4 + PlaneData.D] <= radius) {

                return false;
            }
        }

        return true;
    }

    pointInFrustum(x: number, y: number, z: number) {

        // sphere of radius 0 => point
        return this.sphereInFrustum(x, y, z, 0);
    }

    cubeInFrustum(x: number, y: number, z: number, size: number) {

        for (let ii = 0; ii < 6; ++ii) {

            const index = ii * 4;

            if (this._frustum[index + PlaneData.A] * (x - size) +
                this._frustum[index + PlaneData.B] * (y - size) +
                this._frustum[index + PlaneData.C] * (z - size) +
                this._frustum[index + PlaneData.D] > 0)
                continue;

            if (this._frustum[index + PlaneData.A] * (x + size) +
                this._frustum[index + PlaneData.B] * (y - size) +
                this._frustum[index + PlaneData.C] * (z - size) +
                this._frustum[index + PlaneData.D] > 0)
                continue;

            if (this._frustum[index + PlaneData.A] * (x - size) +
                this._frustum[index + PlaneData.B] * (y + size) +
                this._frustum[index + PlaneData.C] * (z - size) +
                this._frustum[index + PlaneData.D] > 0)
                continue;

            if (this._frustum[index + PlaneData.A] * (x + size) +
                this._frustum[index + PlaneData.B] * (y + size) +
                this._frustum[index + PlaneData.C] * (z - size) +
                this._frustum[index + PlaneData.D] > 0)
                continue;

            ///

            if (this._frustum[index + PlaneData.A] * (x - size) +
                this._frustum[index + PlaneData.B] * (y - size) +
                this._frustum[index + PlaneData.C] * (z + size) +
                this._frustum[index + PlaneData.D] > 0)
                continue;

            if (this._frustum[index + PlaneData.A] * (x + size) +
                this._frustum[index + PlaneData.B] * (y - size) +
                this._frustum[index + PlaneData.C] * (z + size) +
                this._frustum[index + PlaneData.D] > 0)
                continue;

            if (this._frustum[index + PlaneData.A] * (x - size) +
                this._frustum[index + PlaneData.B] * (y + size) +
                this._frustum[index + PlaneData.C] * (z + size) +
                this._frustum[index + PlaneData.D] > 0)
                continue;

            if (this._frustum[index + PlaneData.A] * (x + size) +
                this._frustum[index + PlaneData.B] * (y + size) +
                this._frustum[index + PlaneData.C] * (z + size) +
                this._frustum[index + PlaneData.D] > 0)
                continue;

            return false;
        }

        return true;
    }
};

export default FrustumCulling;
