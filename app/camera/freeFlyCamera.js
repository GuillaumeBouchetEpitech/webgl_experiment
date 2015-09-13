

define([

		  './keyboardHandler.js'
        , 'webgl/gl-matrix-2.1.0'
        , './helpers/pointerLock.js'

	], function(

          createKeyboardHandler
        , glm
        , handle_pointerLock
	) {

	FreeFlyCamera = function () {

	    // this._phi = -45;
	    // this._theta = 225;
	    this._phi = 0;
	    this._theta = 0;

	    this._old_phi = -40;
	    this._old_theta = 220;

	    this._Forward = [11,11,11];
	    this._Left = [0,0,0];
	    // this._Position = [10,10,10];
	    this._Position = [0,0,0];
	    this._Target = [0,0,0];

	    this._movementFlag = 0;

	    this._keybrdHdl = new createKeyboardHandler();


	    var self = this;




		///
		/// MOUSE
		///

		var canvas = document.getElementById("main-canvas");
		handle_pointerLock(canvas, callback_mouse_locked, callback_mouse_unlocked);

		//

		function callback_mouse_locked(movementX, movementY) {
			canvas.addEventListener('mousemove', callback_mousemove, false);
		}

		function callback_mouse_unlocked(movementX, movementY) {
			canvas.removeEventListener('mousemove', callback_mousemove, false);
		}

		function callback_mousemove(e) {

			var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
			var movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

			// console.log('Mouse movement: ' + movementX + ',' + movementY);

			self._theta	-= movementX / 5.0;
			self._phi	-= movementY / 5.0;
		}

		///
		/// /MOUSE
		///

	}

	//

	// FreeFlyCamera.prototype._degToRad = function (degrees) { return degrees * Math.PI / 180; }

	//

	FreeFlyCamera.prototype.update = function (elapsed_sec) {

		this.handleKeys();



		var speed = 8;

		if      (this._movementFlag & 1<<0)
		{
	        for (var i = 0; i < 3; ++i)
	            this._Position[i] += this._Forward[i] * elapsed_sec * speed;
		}
		else if (this._movementFlag & 1<<1)
		{
	        for (var i = 0; i < 3; ++i)
	            this._Position[i] -= this._Forward[i] * elapsed_sec * speed;
		}


		if      (this._movementFlag & 1<<2)
		{
	        for (var i = 0; i < 3; ++i)
	            this._Position[i] -= this._Left[i] * elapsed_sec * speed;
		}
		else if (this._movementFlag & 1<<3)
		{
	        for (var i = 0; i < 3; ++i)
	            this._Position[i] += this._Left[i] * elapsed_sec * speed;
		}


	    this._movementFlag = 0;



		

		this._phi = Math.max(Math.min(this._phi, 89), -89)

		// if (this._old_theta != this._theta ||
		// 	this._old_phi != this._phi)
		{
			// var tmp_radian_phi		= this._degToRad(this._phi),
			// 	tmp_radian_theta	= this._degToRad(this._theta),
			// 	tmp_radian_theta2	= this._degToRad(this._theta + 90);

			// var tmp_cos_phi = Math.cos( tmp_radian_phi );

			// this._forward[0] = tmp_cos_phi * Math.cos( tmp_radian_theta2 );
			// this._forward[2] = tmp_cos_phi * Math.sin( tmp_radian_theta2 );
			// this._forward[1] = Math.sin( tmp_radian_phi );

			// this._left[0] = Math.cos( tmp_radian_theta );
			// this._left[2] = Math.sin( tmp_radian_theta );

			// this._update_needed = false;


		    var Up = [0,0,1];

		    // if (_phi >= 89)         _phi = 89;
		    // else if (_phi <= -89)   _phi = -89;

		    // if (_theta > 360)       _theta -= 360;
		    // else if (_theta < 0)    _theta += 360;

		    var upRadius = Math.cos((this._phi - 90) * 3.14 / 180);
		    Up[2] = Math.sin( (this._phi - 90) * 3.14 / 180);
		    Up[0] = upRadius * Math.cos(this._theta * 3.14 / 180);
		    Up[1] = upRadius * Math.sin(this._theta * 3.14 / 180);

		    var forwardRadius = Math.cos(this._phi * 3.14 / 180);
		    this._Forward[2] = Math.sin(this._phi * 3.14 / 180);
		    this._Forward[0] = forwardRadius * Math.cos(this._theta * 3.14 / 180);
		    this._Forward[1] = forwardRadius * Math.sin(this._theta * 3.14 / 180);

		    this._Left[0] = Up[1] * this._Forward[2] - Up[2] * this._Forward[1];
		    this._Left[1] = Up[2] * this._Forward[0] - Up[0] * this._Forward[2];
		    this._Left[2] = Up[0] * this._Forward[1] - Up[1] * this._Forward[0];

		    this._Target[0] = this._Position[0] + this._Forward[0];
		    this._Target[1] = this._Position[1] + this._Forward[1];
		    this._Target[2] = this._Position[2] + this._Forward[2];


		}

		// this._position[0] -= (this._speed_f * this._forward[0] + this._speed_l * this._left[0]) * elapsed_sec;
		// this._position[2] -= (this._speed_f * this._forward[2] + this._speed_l * this._left[2]) * elapsed_sec;
		// this._position[1] -= (this._speed_f * this._forward[1]) * elapsed_sec;

		this._old_theta	= this._theta
		this._old_phi	= this._phi

		// this._speed_f = 0;
		// this._speed_l = 0;



	}

	//

	FreeFlyCamera.prototype.updateViewMatrix = function (viewMatrix) {

		// // reset modelview matrix
		// mat4.identity( viewMatrix );

		// // rotate modelview matrix
		// mat4.rotate( viewMatrix, this._degToRad(this._phi), [1, 0, 0] );
		// mat4.rotate( viewMatrix, this._degToRad(this._theta), [0, 1, 0] );


		// // translate modelview matrix
		// mat4.translate( viewMatrix, [ -this._position[0], -this._position[1], -this._position[2] ] );

        glm.mat4.lookAt( viewMatrix, this._Position, this._Target, [0,0,1] );
	}

	//

	FreeFlyCamera.prototype.setPosition	= function (x, y, z) {
		this._position[0] = x;
		this._position[1] = y;
		this._position[2] = z;
	}








	///
	///
	///
	/// KEYBOARD

	// function handleKeyDown(event)	{ alert(event.keyCode); }

	// FreeFlyCamera.prototype.handleKeyDown	= function (event)	{ this._currPressedKeys[event.keyCode] = true; }
	// FreeFlyCamera.prototype.handleKeyUp		= function (event)	{ this._currPressedKeys[event.keyCode] = false; }


	FreeFlyCamera.prototype.handleKeys = function() { try{

		// var move_f =  ( this._currPressedKeys[this.keyBoard.KEY_Z] ||
		// 				this._currPressedKeys[this.keyBoard.KEY_W] );
		// var move_b =  ( this._currPressedKeys[this.keyBoard.KEY_S] );

		// if      (move_f)	this.moveForward(); // Z || W
		// else if (move_b)	this.moveBackward(); // S

		// //

		// var move_l =  ( this._currPressedKeys[this.keyBoard.KEY_A] ||
		// 				this._currPressedKeys[this.keyBoard.KEY_Q] ); // A || Q
		// var move_r =  ( this._currPressedKeys[this.keyBoard.KEY_D] ); // D

		// if (move_l)			this.strafeLeft(); // A || Q
		// else if (move_r)	this.strafeRight(); // D

		// //

		// if (this._currPressedKeys[this.keyBoard.ARROW_LEFT])	this.lookLeft();	// Left cursor key
		// if (this._currPressedKeys[this.keyBoard.ARROW_RIGHT])	this.lookRight();	// Right cursor key
		// if (this._currPressedKeys[this.keyBoard.ARROW_UP])		this.lookUp();		// Up cursor key
		// if (this._currPressedKeys[this.keyBoard.ARROW_DOWN])	this.lookDown();	// Down cursor key


	    ///

	    ///

	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_Z ) ||
	        this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_W ))
	    {
	        // for (var i = 0; i < 3; ++i)
	        //     this._Position[i] += this._Forward[i] * 0.1;
			this._movementFlag |= 1<<0
	    }
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_S ))
	    {
	        // for (var i = 0; i < 3; ++i)
	        //     this._Position[i] -= this._Forward[i] * 0.1;
			this._movementFlag |= 1<<1
	    }

	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_A ) ||
	        this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_Q ))
	    {
	        // for (var i = 0; i < 3; ++i)
	        //     this._Position[i] -= this._Left[i] * 0.1;
			this._movementFlag |= 1<<2
	    }
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_D ))
	    {
	        // for (var i = 0; i < 3; ++i)
	        //     this._Position[i] += this._Left[i] * 0.1;
			this._movementFlag |= 1<<3
	    }


	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_UP ))
	        this._phi++;
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_DOWN ))
	        this._phi--;

	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_LEFT ))
	        this._theta++;
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_RIGHT ))
	        this._theta--;

	    ///

	    ///

	}catch(err){alert(err);} }


	FreeFlyCamera.prototype.activate	= function () {

	    this._keybrdHdl.activate();

		// this.handleKeyDown = function (event) { this._currPressedKeys[event.keyCode] = true; }.bind(this)
		// this.handleKeyUp = function (event) { this._currPressedKeys[event.keyCode] = false; }.bind(this)

		// // document.onkeydown = handleKeyDown;
		// // document.onkeyup = handleKeyUp;
		// document.addEventListener('keydown',	this.handleKeyDown);
		// document.addEventListener('keyup',		this.handleKeyUp);
	}

	FreeFlyCamera.prototype.deactivate	= function () {

	    this._keybrdHdl.deactivate();

		// // document.onkeydown = handleKeyDown;
		// // document.onkeyup = handleKeyUp;
		// document.removeEventListener('keydown',	this.handleKeyDown);
		// document.removeEventListener('keyup',	this.handleKeyUp);
	}


	/// KEYBOARD
	///
	///
	///


	return FreeFlyCamera
});
