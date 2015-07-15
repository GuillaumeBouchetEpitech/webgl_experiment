

FreeFlyCamera = function () {

	this._phi	= 0;
	this._theta	= 0;
	this._old_phi	= 0;
	this._old_theta	= 0;

	this._forward	= [0,0,1];
	this._left		= [1,0,0];

	this._speed		= 8;

	this._speed_f	= 0;
	this._speed_l	= 0;

	this._position	= [0,0,0];
}

//

FreeFlyCamera.prototype.moveForward		= function () { this._speed_f = +this._speed; }
FreeFlyCamera.prototype.moveBackward	= function () { this._speed_f = -this._speed; }

FreeFlyCamera.prototype.strafeLeft	= function () { this._speed_l = +this._speed; }
FreeFlyCamera.prototype.strafeRight	= function () { this._speed_l = -this._speed; }

FreeFlyCamera.prototype.lookLeft 	= function () { this._theta -= 2; }
FreeFlyCamera.prototype.lookRight	= function () { this._theta += 2; }
FreeFlyCamera.prototype.lookUp		= function () { this._phi -= 2; }
FreeFlyCamera.prototype.lookDown	= function () { this._phi += 2; }

//

FreeFlyCamera.prototype._degToRad = function (degrees) { return degrees * Math.PI / 180; }

//

FreeFlyCamera.prototype.update = function (elapsed_sec) {

	this._phi = Math.max(Math.min(this._phi, 89), -89)

	if (this._old_theta != this._theta ||
		this._old_phi != this._phi)
	{
		var tmp_radian_phi		= this._degToRad(this._phi),
			tmp_radian_theta	= this._degToRad(this._theta),
			tmp_radian_theta2	= this._degToRad(this._theta + 90);

		var tmp_cos_phi = Math.cos( tmp_radian_phi );

		this._forward[0] = tmp_cos_phi * Math.cos( tmp_radian_theta2 );
		this._forward[2] = tmp_cos_phi * Math.sin( tmp_radian_theta2 );
		this._forward[1] = Math.sin( tmp_radian_phi );

		this._left[0] = Math.cos( tmp_radian_theta );
		this._left[2] = Math.sin( tmp_radian_theta );

		this._update_needed = false;
	}

	this._position[0] -= (this._speed_f * this._forward[0] + this._speed_l * this._left[0]) * elapsed_sec;
	this._position[2] -= (this._speed_f * this._forward[2] + this._speed_l * this._left[2]) * elapsed_sec;
	this._position[1] -= (this._speed_f * this._forward[1]) * elapsed_sec;

	this._old_theta	= this._theta
	this._old_phi	= this._phi

	this._speed_f = 0;
	this._speed_l = 0;
}

FreeFlyCamera.prototype.updateViewMatrix = function (viewMatrix) {

	// reset modelview matrix
	mat4.identity( viewMatrix );

	// rotate modelview matrix
	mat4.rotate( viewMatrix, this._degToRad(this._phi), [1, 0, 0] );
	mat4.rotate( viewMatrix, this._degToRad(this._theta), [0, 1, 0] );

	// translate modelview matrix
	mat4.translate( viewMatrix, [ -this._position[0], -this._position[1], -this._position[2] ] );
}

//

FreeFlyCamera.prototype.setPosition	= function (x, y, z) {
	this._position[0] = x;
	this._position[1] = y;
	this._position[2] = z;
}
