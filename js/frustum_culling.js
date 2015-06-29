
var FrustumCulling = function() {

	this.e_FrustumSide = { eRight : 0, eLeft : 1, eBottom : 2, eTop : 3, eBack : 4, eFront : 5 };
	this.e_PlaneData = { eA : 0, eB : 1, eC : 2, eD : 3 };
    this._Frustum = [ [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0] ];
}

FrustumCulling.prototype.normalizePlane = function (side) {

	var	magnitude = Math.sqrt( this._Frustum[side][this.e_PlaneData.eA] * this._Frustum[side][this.e_PlaneData.eA] +
							   this._Frustum[side][this.e_PlaneData.eB] * this._Frustum[side][this.e_PlaneData.eB] +
							   this._Frustum[side][this.e_PlaneData.eC] * this._Frustum[side][this.e_PlaneData.eC] );

	this._Frustum[side][this.e_PlaneData.eA] /= magnitude;
	this._Frustum[side][this.e_PlaneData.eB] /= magnitude;
	this._Frustum[side][this.e_PlaneData.eC] /= magnitude;
	this._Frustum[side][this.e_PlaneData.eD] /= magnitude;
}

FrustumCulling.prototype.calculateFrustum = function ( proj, modl ) {

	var clip = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

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

	this._Frustum[this.e_FrustumSide.eRight][this.e_PlaneData.eA] = clip[ 3] - clip[ 0];
	this._Frustum[this.e_FrustumSide.eRight][this.e_PlaneData.eB] = clip[ 7] - clip[ 4];
	this._Frustum[this.e_FrustumSide.eRight][this.e_PlaneData.eC] = clip[11] - clip[ 8];
	this._Frustum[this.e_FrustumSide.eRight][this.e_PlaneData.eD] = clip[15] - clip[12];
	this.normalizePlane(this.e_FrustumSide.eRight);

	this._Frustum[this.e_FrustumSide.eLeft][this.e_PlaneData.eA] = clip[ 3] + clip[ 0];
	this._Frustum[this.e_FrustumSide.eLeft][this.e_PlaneData.eB] = clip[ 7] + clip[ 4];
	this._Frustum[this.e_FrustumSide.eLeft][this.e_PlaneData.eC] = clip[11] + clip[ 8];
	this._Frustum[this.e_FrustumSide.eLeft][this.e_PlaneData.eD] = clip[15] + clip[12];
	this.normalizePlane(this.e_FrustumSide.eLeft);


	this._Frustum[this.e_FrustumSide.eBottom][this.e_PlaneData.eA] = clip[ 3] + clip[ 1];
	this._Frustum[this.e_FrustumSide.eBottom][this.e_PlaneData.eB] = clip[ 7] + clip[ 5];
	this._Frustum[this.e_FrustumSide.eBottom][this.e_PlaneData.eC] = clip[11] + clip[ 9];
	this._Frustum[this.e_FrustumSide.eBottom][this.e_PlaneData.eD] = clip[15] + clip[13];
	this.normalizePlane(this.e_FrustumSide.eBottom);

	this._Frustum[this.e_FrustumSide.eTop][this.e_PlaneData.eA] = clip[ 3] - clip[ 1];
	this._Frustum[this.e_FrustumSide.eTop][this.e_PlaneData.eB] = clip[ 7] - clip[ 5];
	this._Frustum[this.e_FrustumSide.eTop][this.e_PlaneData.eC] = clip[11] - clip[ 9];
	this._Frustum[this.e_FrustumSide.eTop][this.e_PlaneData.eD] = clip[15] - clip[13];
	this.normalizePlane(this.e_FrustumSide.eTop);


	this._Frustum[this.e_FrustumSide.eBack][this.e_PlaneData.eA] = clip[ 3] - clip[ 2];
	this._Frustum[this.e_FrustumSide.eBack][this.e_PlaneData.eB] = clip[ 7] - clip[ 6];
	this._Frustum[this.e_FrustumSide.eBack][this.e_PlaneData.eC] = clip[11] - clip[10];
	this._Frustum[this.e_FrustumSide.eBack][this.e_PlaneData.eD] = clip[15] - clip[14];
	this.normalizePlane(this.e_FrustumSide.eBack);

	this._Frustum[this.e_FrustumSide.eFront][this.e_PlaneData.eA] = clip[ 3] + clip[ 2];
	this._Frustum[this.e_FrustumSide.eFront][this.e_PlaneData.eB] = clip[ 7] + clip[ 6];
	this._Frustum[this.e_FrustumSide.eFront][this.e_PlaneData.eC] = clip[11] + clip[10];
	this._Frustum[this.e_FrustumSide.eFront][this.e_PlaneData.eD] = clip[15] + clip[14];
	this.normalizePlane(this.e_FrustumSide.eFront);
}


FrustumCulling.prototype.cubeInFrustum = function ( x, y, z, size ) {

    for (var i = 0; i < 6; ++i) {

        if (this._Frustum[i][this.e_PlaneData.eA] * (x - size) +
            this._Frustum[i][this.e_PlaneData.eB] * (y - size) +
            this._Frustum[i][this.e_PlaneData.eC] * (z - size) +
            this._Frustum[i][this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[i][this.e_PlaneData.eA] * (x + size) +
            this._Frustum[i][this.e_PlaneData.eB] * (y - size) +
            this._Frustum[i][this.e_PlaneData.eC] * (z - size) +
            this._Frustum[i][this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[i][this.e_PlaneData.eA] * (x - size) +
            this._Frustum[i][this.e_PlaneData.eB] * (y + size) +
            this._Frustum[i][this.e_PlaneData.eC] * (z - size) +
            this._Frustum[i][this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[i][this.e_PlaneData.eA] * (x + size) +
            this._Frustum[i][this.e_PlaneData.eB] * (y + size) +
            this._Frustum[i][this.e_PlaneData.eC] * (z - size) +
            this._Frustum[i][this.e_PlaneData.eD] > 0)
            continue;

        ///

        if (this._Frustum[i][this.e_PlaneData.eA] * (x - size) +
            this._Frustum[i][this.e_PlaneData.eB] * (y - size) +
            this._Frustum[i][this.e_PlaneData.eC] * (z + size) +
            this._Frustum[i][this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[i][this.e_PlaneData.eA] * (x + size) +
            this._Frustum[i][this.e_PlaneData.eB] * (y - size) +
            this._Frustum[i][this.e_PlaneData.eC] * (z + size) +
            this._Frustum[i][this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[i][this.e_PlaneData.eA] * (x - size) +
            this._Frustum[i][this.e_PlaneData.eB] * (y + size) +
            this._Frustum[i][this.e_PlaneData.eC] * (z + size) +
            this._Frustum[i][this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[i][this.e_PlaneData.eA] * (x + size) +
            this._Frustum[i][this.e_PlaneData.eB] * (y + size) +
            this._Frustum[i][this.e_PlaneData.eC] * (z + size) +
            this._Frustum[i][this.e_PlaneData.eD] > 0)
            continue;

        return false;
    }

    return true;
}
