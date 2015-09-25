

define([

          'webgl/gl-matrix-2.1.0'
		, './helpers/keyboardHandler.js'
        , './helpers/pointerLock.js'

	], function(

          glm
        , createKeyboardHandler
        , handle_pointerLock
	) {

	FreeFlyCamera = function () {

	    this._phi = 0;
	    this._theta = 0;

	    this._Forward = [1,0,0];
	    this._Left = [0,0,0];
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

	    var Up = [0,0,1];

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

	//

	FreeFlyCamera.prototype.updateViewMatrix = function (viewMatrix) {

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

	FreeFlyCamera.prototype.handleKeys = function() { try{

	    // forward
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_Z ) ||
	        this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_W ))
			this._movementFlag |= 1<<0

	    // backward
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_S ))
			this._movementFlag |= 1<<1

		// strafe left
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_A ) ||
	        this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_Q ))
			this._movementFlag |= 1<<2

		// strafe right
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_D ))
			this._movementFlag |= 1<<3

		/// /// ///

		// look up
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_UP ))
	        this._phi++;

		// look down
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_DOWN ))
	        this._phi--;

		// look left
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_LEFT ))
	        this._theta++;

		// look right
	    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_RIGHT ))
	        this._theta--;

	}catch(err){alert(err);} }


	FreeFlyCamera.prototype.activate	= function () {

	    this._keybrdHdl.activate();
	}

	FreeFlyCamera.prototype.deactivate	= function () {

	    this._keybrdHdl.deactivate();
	}

	/// KEYBOARD
	///
	///
	///


	return FreeFlyCamera
});
