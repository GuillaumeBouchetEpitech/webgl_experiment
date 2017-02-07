(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn, options) {
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp && exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            Function(['require','module','exports'], '(' + fn + ')(self)'),
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        Function(['require'], (
            // try to call default if defined to also support babel esmodule
            // exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);'
        )),
        scache
    ];

    var workerSources = {};
    resolveSources(skey);

    function resolveSources(key) {
        workerSources[key] = true;

        for (var depPath in sources[key][1]) {
            var depKey = sources[key][1][depPath];
            if (!workerSources[depKey]) {
                resolveSources(depKey);
            }
        }
    }

    var src = '(' + bundleFn + ')({'
        + Object.keys(workerSources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    var blob = new Blob([src], { type: 'text/javascript' });
    if (options && options.bare) { return blob; }
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
};

},{}],2:[function(require,module,exports){

require('./app/main');

},{"./app/main":17}],3:[function(require,module,exports){



var gl = require('../gl-context.js');

var glm = require('../../lib/webgl/gl-matrix-2.1.0');
var createKeyboardHandler = require('./helpers/keyboardHandler.js');
var handle_pointerLock = require('./helpers/pointerLock.js');



// define([

//           '../gl-context.js'

//         , 'webgl/gl-matrix-2.1.0'
// 		, './helpers/keyboardHandler.js'
//         , './helpers/pointerLock.js'

// 	], function(

// 		  gl

//         , glm
//         , createKeyboardHandler
//         , handle_pointerLock
// 	) {

	FreeFlyCamera = function () {

	    this._phi = 0;
	    this._theta = 0;

	    this._Forward = [1,0,0];
	    this._Left = [0,0,0];
	    this._Position = [0,0,0];
	    this._Target = [0,0,0];

	    this._movementFlag = 0;

	    this._keybrdHdl = new createKeyboardHandler();

	    this._force_forward = false;


	    var self = this;




		///
		/// MOUSE
		///

		var canvas = document.getElementById("canvasesdiv");
		handle_pointerLock(canvas, callback_mouse_locked, callback_mouse_unlocked);

		//

		function callback_mouse_locked() {
			canvas.addEventListener('mousemove', callback_mousemove, false);
		}

		function callback_mouse_unlocked() {
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



		///
		/// TOUCH
		///

		try {

			var elem = document.getElementById("canvasesdiv");

			var previous_touch = null;
			var previous_distance = null;

			var saved_time = null;

			elem.addEventListener('touchstart', function(e) { try{

				e.preventDefault();

				previous_touch = null;
				previous_distance = null;

				var tmp_time = Date.now();

				if (e.targetTouches.length == 1 &&
					saved_time &&
					(tmp_time - saved_time) < 250)
				{
					self._force_forward = true;
				}

				saved_time = tmp_time;

			}catch(e){alert(e);} });

			elem.addEventListener('touchend', function(e) { try{

				e.preventDefault();

				previous_touch = null;
				previous_distance = null;

				// saved_time = null;
				self._force_forward = false;

			}catch(e){alert(e);} });

			elem.addEventListener('touchmove', function (e) { try{

				e.preventDefault();

				var touches = e.targetTouches;

				if (touches.length == 0 || touches.length > 2)
					return;

				if (touches.length == 2)
				{
					var x1 = touches[0].pageX-touches[1].pageX;
					var y1 = touches[0].pageY-touches[1].pageY;

					var length = Math.sqrt(x1*x1 + y1*y1);

					if (previous_distance)
					{
						if (length > previous_distance)
							self._movementFlag |= 1<<0; // forward
						else
							self._movementFlag |= 1<<1; // backward
					}

					previous_distance = length;
				}
				else
				{
					if (previous_touch)
					{
						var step_x = previous_touch.pageX - touches[0].pageX;
						var step_y = previous_touch.pageY - touches[0].pageY;
						self._theta	-= (step_x / 5.0);
						self._phi	-= (step_y / 5.0);
					}

					previous_touch = touches[0];
				}

			}catch(e){alert(e);} });

			//			

		} catch (e) {
			alert('TOUCH='+JSON.stringify(e));
		}

		///
		/// /TOUCH
		///

	}

	//

	// FreeFlyCamera.prototype._degToRad = function (degrees) { return degrees * Math.PI / 180; }

	//

	FreeFlyCamera.prototype.update = function (elapsed_sec) {

		this.handleKeys();

		var speed = 16;

		if      (this._movementFlag & 1<<0 || this._force_forward == true)
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
		this._Position[0] = x;
		this._Position[1] = y;
		this._Position[2] = z;
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


// 	return FreeFlyCamera
// });

module.exports = FreeFlyCamera;

},{"../../lib/webgl/gl-matrix-2.1.0":21,"../gl-context.js":16,"./helpers/keyboardHandler.js":6,"./helpers/pointerLock.js":7}],4:[function(require,module,exports){

// define(function(){

	var FrustumCulling = function() {

		this.e_FrustumSide = { eRight : 0, eLeft : 1, eBottom : 2, eTop : 3, eBack : 4, eFront : 5 };
		this.e_PlaneData = { eA : 0, eB : 1, eC : 2, eD : 3 };
	    // this._Frustum = [ [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0], [0,0,0,0] ];
	    this._Frustum = new Float32Array(24); // 6 * 4 values
	}

	FrustumCulling.prototype.normalizePlane = function (side) {

		var index = side * 4;

		var	magnitude = Math.sqrt(
			this._Frustum[index + this.e_PlaneData.eA] * this._Frustum[index + this.e_PlaneData.eA] +
			this._Frustum[index + this.e_PlaneData.eB] * this._Frustum[index + this.e_PlaneData.eB] +
			this._Frustum[index + this.e_PlaneData.eC] * this._Frustum[index + this.e_PlaneData.eC]
		);

		this._Frustum[index + this.e_PlaneData.eA] /= magnitude;
		this._Frustum[index + this.e_PlaneData.eB] /= magnitude;
		this._Frustum[index + this.e_PlaneData.eC] /= magnitude;
		this._Frustum[index + this.e_PlaneData.eD] /= magnitude;
	}

	FrustumCulling.prototype.calculateFrustum = function ( proj, modl ) {

		var clip = new Float32Array(16);

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

		var index = this.e_FrustumSide.eRight * 4;
		this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] - clip[ 0];
		this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] - clip[ 4];
		this._Frustum[index + this.e_PlaneData.eC] = clip[11] - clip[ 8];
		this._Frustum[index + this.e_PlaneData.eD] = clip[15] - clip[12];
		this.normalizePlane(this.e_FrustumSide.eRight);

		var index = this.e_FrustumSide.eLeft * 4;
		this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] + clip[ 0];
		this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] + clip[ 4];
		this._Frustum[index + this.e_PlaneData.eC] = clip[11] + clip[ 8];
		this._Frustum[index + this.e_PlaneData.eD] = clip[15] + clip[12];
		this.normalizePlane(this.e_FrustumSide.eLeft);


		var index = this.e_FrustumSide.eBottom * 4;
		this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] + clip[ 1];
		this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] + clip[ 5];
		this._Frustum[index + this.e_PlaneData.eC] = clip[11] + clip[ 9];
		this._Frustum[index + this.e_PlaneData.eD] = clip[15] + clip[13];
		this.normalizePlane(this.e_FrustumSide.eBottom);

		var index = this.e_FrustumSide.eTop * 4;
		this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] - clip[ 1];
		this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] - clip[ 5];
		this._Frustum[index + this.e_PlaneData.eC] = clip[11] - clip[ 9];
		this._Frustum[index + this.e_PlaneData.eD] = clip[15] - clip[13];
		this.normalizePlane(this.e_FrustumSide.eTop);


		var index = this.e_FrustumSide.eBack * 4;
		this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] - clip[ 2];
		this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] - clip[ 6];
		this._Frustum[index + this.e_PlaneData.eC] = clip[11] - clip[10];
		this._Frustum[index + this.e_PlaneData.eD] = clip[15] - clip[14];
		this.normalizePlane(this.e_FrustumSide.eBack);

		var index = this.e_FrustumSide.eFront * 4;
		this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] + clip[ 2];
		this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] + clip[ 6];
		this._Frustum[index + this.e_PlaneData.eC] = clip[11] + clip[10];
		this._Frustum[index + this.e_PlaneData.eD] = clip[15] + clip[14];
		this.normalizePlane(this.e_FrustumSide.eFront);
	}

	FrustumCulling.prototype.pointInFrustum = function ( x, y, z )
	{
		for (var i = 0; i < 6; ++i)
			if (this._Frustum[i * 4 + this.e_PlaneData.eA] * x +
				this._Frustum[i * 4 + this.e_PlaneData.eB] * y +
				this._Frustum[i * 4 + this.e_PlaneData.eC] * z +
				this._Frustum[i * 4 + this.e_PlaneData.eD] <= 0)
				return false;

		return true;
	}

	FrustumCulling.prototype.sphereInFrustum = function ( x, y, z, radius )
	{
		for (var i = 0; i < 6; ++i)
			if (this._Frustum[i * 4 + this.e_PlaneData.eA] * x +
				this._Frustum[i * 4 + this.e_PlaneData.eB] * y +
				this._Frustum[i * 4 + this.e_PlaneData.eC] * z +
				this._Frustum[i * 4 + this.e_PlaneData.eD] <= 0)
				return false;

		return true;
	}


	FrustumCulling.prototype.cubeInFrustum = function ( x, y, z, size ) {

	    for (var i = 0; i < 6; ++i) {

	    	var index = i * 4;

	        if (this._Frustum[index + this.e_PlaneData.eA] * (x - size) +
	            this._Frustum[index + this.e_PlaneData.eB] * (y - size) +
	            this._Frustum[index + this.e_PlaneData.eC] * (z - size) +
	            this._Frustum[index + this.e_PlaneData.eD] > 0)
	            continue;

	        if (this._Frustum[index + this.e_PlaneData.eA] * (x + size) +
	            this._Frustum[index + this.e_PlaneData.eB] * (y - size) +
	            this._Frustum[index + this.e_PlaneData.eC] * (z - size) +
	            this._Frustum[index + this.e_PlaneData.eD] > 0)
	            continue;

	        if (this._Frustum[index + this.e_PlaneData.eA] * (x - size) +
	            this._Frustum[index + this.e_PlaneData.eB] * (y + size) +
	            this._Frustum[index + this.e_PlaneData.eC] * (z - size) +
	            this._Frustum[index + this.e_PlaneData.eD] > 0)
	            continue;

	        if (this._Frustum[index + this.e_PlaneData.eA] * (x + size) +
	            this._Frustum[index + this.e_PlaneData.eB] * (y + size) +
	            this._Frustum[index + this.e_PlaneData.eC] * (z - size) +
	            this._Frustum[index + this.e_PlaneData.eD] > 0)
	            continue;

	        ///

	        if (this._Frustum[index + this.e_PlaneData.eA] * (x - size) +
	            this._Frustum[index + this.e_PlaneData.eB] * (y - size) +
	            this._Frustum[index + this.e_PlaneData.eC] * (z + size) +
	            this._Frustum[index + this.e_PlaneData.eD] > 0)
	            continue;

	        if (this._Frustum[index + this.e_PlaneData.eA] * (x + size) +
	            this._Frustum[index + this.e_PlaneData.eB] * (y - size) +
	            this._Frustum[index + this.e_PlaneData.eC] * (z + size) +
	            this._Frustum[index + this.e_PlaneData.eD] > 0)
	            continue;

	        if (this._Frustum[index + this.e_PlaneData.eA] * (x - size) +
	            this._Frustum[index + this.e_PlaneData.eB] * (y + size) +
	            this._Frustum[index + this.e_PlaneData.eC] * (z + size) +
	            this._Frustum[index + this.e_PlaneData.eD] > 0)
	            continue;

	        if (this._Frustum[index + this.e_PlaneData.eA] * (x + size) +
	            this._Frustum[index + this.e_PlaneData.eB] * (y + size) +
	            this._Frustum[index + this.e_PlaneData.eC] * (z + size) +
	            this._Frustum[index + this.e_PlaneData.eD] > 0)
	            continue;

	        return false;
	    }

	    return true;
	}

// 	return FrustumCulling;
// });

module.exports = FrustumCulling;

},{}],5:[function(require,module,exports){

// https://www.opengl.org/wiki/GluProject_and_gluUnProject_code

// define(function(){

	function glhProject( objx, objy, objz, modelview, projection, arr_viewport )
	{
		//Transformation vectors
		var fTempo = [];

		//Modelview transform
		fTempo[0]=modelview[0]*objx+modelview[4]*objy+modelview[8]*objz+modelview[12];  //w is always 1
		fTempo[1]=modelview[1]*objx+modelview[5]*objy+modelview[9]*objz+modelview[13];
		fTempo[2]=modelview[2]*objx+modelview[6]*objy+modelview[10]*objz+modelview[14];
		fTempo[3]=modelview[3]*objx+modelview[7]*objy+modelview[11]*objz+modelview[15];

		//Projection transform, the final row of projection matrix is always [0 0 -1 0]
		//so we optimize for that.
		fTempo[4]=projection[0]*fTempo[0]+projection[4]*fTempo[1]+projection[8]*fTempo[2]+projection[12]*fTempo[3];
		fTempo[5]=projection[1]*fTempo[0]+projection[5]*fTempo[1]+projection[9]*fTempo[2]+projection[13]*fTempo[3];
		fTempo[6]=projection[2]*fTempo[0]+projection[6]*fTempo[1]+projection[10]*fTempo[2]+projection[14]*fTempo[3];
		fTempo[7]=-fTempo[2];

		//The result normalizes between -1 and 1
		if (fTempo[7]==0.0)	//The w value
			return null;

		fTempo[7]=1.0/fTempo[7];
		//Perspective division
		fTempo[4]*=fTempo[7];
		fTempo[5]*=fTempo[7];
		fTempo[6]*=fTempo[7];

		//Window coordinates
		//Map x, y to range 0-1
		return [
			(fTempo[4]*0.5+0.5)*arr_viewport[2]+arr_viewport[0],
			(fTempo[5]*0.5+0.5)*arr_viewport[3]+arr_viewport[1]
		];
	}

// 	return glhProject;
// });

module.exports = glhProject;

},{}],6:[function(require,module,exports){

// define(function() {

    function createKeyboardHandler(){

        this.keyCodes = {
              KEY_Z : 90, KEY_W : 87
            , KEY_S : 83
            , KEY_A : 65, KEY_Q : 81
            , KEY_D : 68

            , ARROW_LEFT  : 37
            , ARROW_RIGHT : 39
            , ARROW_UP    : 38
            , ARROW_DOWN  : 40
        };

        this._pressedKeys = {};       

        function handleKeyDown(event) {
            this._pressedKeys[event.keyCode] = true;
        }
        function handleKeyUp(event) {
            this._pressedKeys[event.keyCode] = false;
        }

        this._activated = false;
        this._handleKeyDown = handleKeyDown.bind(this);
        this._handleKeyUp   = handleKeyUp.bind(this);
    }

    //

    createKeyboardHandler.prototype.isPressed = function (code) {

        return this._pressedKeys[code];
    }

    //

    createKeyboardHandler.prototype.activate = function () {

        if (this._activated)
            return;

        document.addEventListener('keydown',    this._handleKeyDown);
        document.addEventListener('keyup',      this._handleKeyUp);

        this._activated = true;
    }

    createKeyboardHandler.prototype.deactivate = function () {

        if (!this._activated)
            return;

        document.removeEventListener('keydown',    this._handleKeyDown);
        document.removeEventListener('keyup',      this._handleKeyUp);

        this._activated = false;
    }

//     return createKeyboardHandler;
// });

module.exports = createKeyboardHandler;

},{}],7:[function(require,module,exports){


// define(function() {

	function handle_pointerLock (canvas, cb_enabled, cb_disabled, cb_error) {

		//
		//
		// // // POINTER LOCK

		canvas.requestPointerLock = canvas.requestPointerLock ||
									canvas.mozRequestPointerLock ||
									canvas.webkitRequestPointerLock;

		document.exitPointerLock =	document.exitPointerLock ||
									document.mozExitPointerLock ||
									document.webkitExitPointerLock;

		canvas.onclick = function() {
			canvas.requestPointerLock();
		}

		if ("onpointerlockchange" in document)
			document.addEventListener('pointerlockchange', lockChangeAlert, false);
		else if ("onmozpointerlockchange" in document)
			document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
		else if ("onwebkitpointerlockchange" in document)
			document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);

		if ("onpointerlockerror" in document)
			document.addEventListener('pointerlockerror', lockError, false);
		else if ("onmozpointerlockerror" in document)
			document.addEventListener('mozpointerlockerror', lockError, false);
		else if ("onwebkitpointerlockerror" in document)
			document.addEventListener('webkitpointerlockerror', lockError, false);

		function lockChangeAlert() {
			if (document.pointerLockElement === canvas ||
				document.mozPointerLockElement === canvas ||
				document.webkitPointerLockElement === canvas)
			{
				console.log('The pointer lock status is now locked');
				// Do something useful in response

				if (cb_enabled)
					cb_enabled();

			} else {
				console.log('The pointer lock status is now unlocked');      
				// Do something useful in response

				if (cb_disabled)
					cb_disabled();
			}
		}


		function lockError(e) {
			console.error("Pointer lock failed"); 

			if (cb_error)
				cb_error(e)
		}

		

		// // // POINTER LOCK
		//
		//

	}

// 	return handle_pointerLock;
// });

module.exports = handle_pointerLock;

},{}],8:[function(require,module,exports){

var gl = require('../gl-context.js');

var marchingCube = require('./helpers/marchingCube.js');
var pnoise = require('./helpers/pnoise.js');
var randomiser = require('./helpers/randomiser.js');

var createGeometryExperimental = require('../geometries/geometryExperimental.js');


var work = require('webworkify');


// define(
// 	[

// 		  '../gl-context.js'

// 		, './helpers/marchingCube.js'
// 		, './helpers/pnoise.js'
// 		, './helpers/randomiser.js'

//         // , '../geometries/geometryBCenter.js'
//         // , '../geometries/geometryLight.js'
//         , '../geometries/geometryExperimental.js'

// 	],function(

// 		  gl

// 		, marchingCube
// 		, pnoise
// 		, randomiser

//         // , createGeometryBCenter
//         // , createGeometryLight
//         , createGeometryExperimental

// 	)
// {

	//

	var chunkRenderer = function(chunk_size, shader, octaves, freq, amp, tetra) {

		this._shader = shader;
		this._chunks = [];
		this._chunk_queue = [];
		this._chunk_size = chunk_size;


		this._myWorker_buffer = new Float32Array(100000);


		this._myWorker = work(require('../../app_worker.js'));
	    this._myWorker_status = 0; // not ready
	    var self = this;
		this._myWorker.addEventListener('message', function (e) {
			if (e.data.ready)
			{
				console.log("self._myWorker_status=" + self._myWorker_status);
				self._myWorker_status = 1; // ready/available
			}
			else if (self._myWorker_status == 2) // working
			{
				// console.log("result from main script=" + self._myWorker_status);
				self._myWorker_status = 1; // ready/available

				var pos = e.data.pos;
				var vertices = e.data.vertices;

				// console.log("vertices.length=" + vertices.length);

				// var geom = new createGeometryExperimental(new Float32Array(vertices), self._shader, true);
				var geom = new createGeometryExperimental(vertices, self._shader, true);

				self._myWorker_buffer = vertices;

				// save

				self._chunks.push({
					  pos: pos
					, geom: geom
				});

				self.is_processing_chunk = false;

			}
		});

	  //   this._myWorker = new window.Worker("app_worker.js");
	  //   this._myWorker_status = 0; // not ready
	  //   var self = this;
   //      this._myWorker.onmessage = function(e) {
			// if (e.data.ready)
			// {
			// 	console.log("self._myWorker_status=" + self._myWorker_status);
			// 	self._myWorker_status = 1; // ready/available
			// }
			// else if (self._myWorker_status == 2) // working
			// {
			// 	// console.log("result from main script=" + self._myWorker_status);
			// 	self._myWorker_status = 1; // ready/available

			// 	var pos = e.data.pos;
			// 	var vertices = e.data.vertices;

			// 	// console.log("vertices.length=" + vertices.length);

			// 	// var geom = new createGeometryExperimental(new Float32Array(vertices), self._shader, true);
			// 	var geom = new createGeometryExperimental(vertices, self._shader, true);

			// 	self._myWorker_buffer = vertices;

			// 	// save

			// 	self._chunks.push({
			// 		  pos: pos
			// 		, geom: geom
			// 	});

			// 	self.is_processing_chunk = false;

			// }
	  //   }


		// var myRand = new Randomiser();

		// var myNoise2 = new ClassicalNoise(myRand, octaves, freq, amp);

		// this._marchingCube = new MarchinCube(chunk_size, 0.0, function(x, y, z) {

		// 	return myNoise2.noise_ex(x, y, z);
		// }, tetra);
	}

	//

	chunkRenderer.prototype.exclude = function(pos) {

		for (var i = 0; i < this._chunks.length; ++i)
			if (this._chunks[i].pos[0] === pos[0] &&
				this._chunks[i].pos[1] === pos[1] &&
				this._chunks[i].pos[2] === pos[2])
			{
				// gl.deleteBuffer(this._chunks[i].geom._vbuffer);
				console.log('dispose calling')
				this._chunks[i].geom.dispose();
				this._chunks.splice(i,1);
				break;
			}
	}

	//

	// chunkRenderer.prototype._partially_generate = function(pos) {

	// 	//
	// 	// generate

	// 	if (!this.chunk_vertices)
	// 		this.chunk_vertices = [];


	// 	var tmp_index = 0;
	// 	var arr_indexes = [ [1,0,0], [0,1,0], [0,0,1] ];

	// 	// this._marchingCube.marchCube(pos, marchCube_cb);

	// 	// while (!this._marchingCube.marchCube_step(3*50, pos, marchCube_cb))
	// 	// 	;


	// 	// var finished = this._marchingCube.marchCube_step( 3*150, pos, marchCube_cb );

	// 	var chunk_vertices = this.chunk_vertices;
	// 	function marchCube_cb(vertex, color, normal) {

	// 	    chunk_vertices.push( vertex[0], vertex[1], vertex[2] );
	// 	    chunk_vertices.push( color[0],  color[1],  color[2]  );
	// 	    chunk_vertices.push( normal[0], normal[1], normal[2] );


	// 	    var index = arr_indexes[tmp_index];
	// 	    tmp_index = (tmp_index + 1) % 3;

	// 	    chunk_vertices.push( index[0], index[1], index[2] );
	// 	}



	// 	var last_time = Date.now();

	// 	// while (true)
	// 	{
	// 		// finished = this._marchingCube.marchCube_step( 60, pos, marchCube_cb )
	// 		this._marchingCube.marchCube( pos, marchCube_cb )
	// 		finished = true;

	// 		// if (finished)
	// 		// 	break;

	// 		// if ((last_time - Date.now()) > 4)
	// 		// 	break;
	// 	}




	// 	// generate
	// 	//

	// 	if (finished)
	// 	{
	// 		var geom = new createGeometryExperimental(chunk_vertices, this._shader);

	// 		// this.chunk_vertices = [];
	// 		chunk_vertices.length = 0;

	// 		// save

	// 		this._chunks.push({
	// 			  pos: pos
	// 			, geom: geom
	// 		});

	// 		this.is_processing_chunk = false;
	// 	}

	// };

	//

	chunkRenderer.prototype.update = function(camera_pos, priority_cb) {

		// webworker ready/available?

		if (this._myWorker_status != 1)
			return;

		// are we already processing a chunk?

		// if (this.is_processing_chunk)
		// 	return this._partially_generate(this.processing_pos); // yes...

		// if (this.is_processing_chunk)
		// 	return;

		// no -> determine the next chunk to process

		// is there something to process?
		if (this._chunk_queue.length == 0)
			return; // no

		var pos = null;

		// if just 1 chunk left to process (or no priority callback)
		// -> just pop and process the last chunk in the queue
		if (!priority_cb || this._chunk_queue.length == 1)
		{
			pos = this._chunk_queue.pop();

			this.processing_pos = pos;

			this.is_processing_chunk = true;

			this._myWorker_status = 2; // working
	        this._myWorker.postMessage({
	        	pos: this.processing_pos,
	        	buf: this._myWorker_buffer
	        }
			, [
				this._myWorker_buffer.buffer
			]
	        );

			return;
		}

		var best_index = 0;

		//
		///

		function calc_length(in_x, in_y, in_z) {
			return Math.sqrt(in_x*in_x + in_y*in_y + in_z*in_z);
		}

		var chunks = this._chunks;
		function is_already_processed(pos) {
			for (var j = 0; j < chunks.length; ++j)
				if (chunks[j].pos[0] === pos[0] &&
					chunks[j].pos[1] === pos[1] &&
					chunks[j].pos[2] === pos[2])
				{
					return true;
				}
			return false;
		}

		var pos = this._chunk_queue[0];

		var chunk_center = [
			pos[0] * this._chunk_size + this._chunk_size / 2,
			pos[1] * this._chunk_size + this._chunk_size / 2,
			pos[2] * this._chunk_size + this._chunk_size / 2
		];

		var best_dist = calc_length(camera_pos[0] - chunk_center[0],
									camera_pos[1] - chunk_center[1],
									camera_pos[2] - chunk_center[2]);

		///
		//

		for (var i = 1; i < this._chunk_queue.length; ++i)
		{
			var best_pos = this._chunk_queue[best_index];
			var try_pos = this._chunk_queue[i];

			//
			/// already processed ?
			if (is_already_processed(try_pos)) // <- simply look if already a "live chunk"
			{
				this._chunk_queue.splice(i,1);
				--i;
				continue;
			}
			/// /already processed ?
			//

			if (priority_cb( try_pos, best_pos ))
			{
				var chunk_center = [
					try_pos[0] * this._chunk_size + this._chunk_size / 2,
					try_pos[1] * this._chunk_size + this._chunk_size / 2,
					try_pos[2] * this._chunk_size + this._chunk_size / 2
				];

				var dist = calc_length( camera_pos[0] - chunk_center[0],
										camera_pos[1] - chunk_center[1],
										camera_pos[2] - chunk_center[2] );

				if (best_dist < dist)
					continue;

				best_index = i;
				best_dist = dist;
			}
		}

		this.processing_pos = this._chunk_queue[best_index];
		this._chunk_queue.splice(best_index,1);

		this.is_processing_chunk = true;

		// this._myWorker_status = 2; // working
		// this._myWorker.postMessage({pos:this.processing_pos});
		this._myWorker_status = 2; // working
		this._myWorker.postMessage({
			pos: this.processing_pos,
			buf: this._myWorker_buffer
		}
		, [
			this._myWorker_buffer.buffer
		]
		);
	}



	//

	chunkRenderer.prototype.render = function(tmp_mvMatrix, tmp_pMatrix, tmp_freefly_pos, validation_callback) {

        gl.useProgram(this._shader);

        // send the texture to the shader
        gl.uniform1i(g_shaderProgram_experimental.uSampler, 0);

        gl.uniformMatrix4fv(this._shader.uMVMatrix, false, tmp_mvMatrix);
        gl.uniformMatrix4fv(this._shader.uPMatrix, false, tmp_pMatrix);

        var p = tmp_freefly_pos;
        gl.uniform3f(this._shader.uCameraPos, p[0],p[1],p[2]);


		if (validation_callback)
		{
			for (var i = 0; i < this._chunks.length; ++i)
				if (validation_callback(this._chunks[i].pos))
					this._chunks[i].geom.render();
		}
		else
		{
			for (var i = 0; i < this._chunks.length; ++i)
				this._chunks[i].geom.render();
		}
	};

	//

	// return chunkRenderer;
	module.exports = chunkRenderer

// })

},{"../../app_worker.js":18,"../geometries/geometryExperimental.js":15,"../gl-context.js":16,"./helpers/marchingCube.js":9,"./helpers/pnoise.js":10,"./helpers/randomiser.js":11,"webworkify":1}],9:[function(require,module,exports){

var MarchinCube = function(in_chunk_size, in_fTv, in_sample_cb, tetra) {

	this.chunk_size = in_chunk_size
	this.fTv = in_fTv;
	this.sample = in_sample_cb;

	this.tetra = tetra || false;


	this.current_index = 0;


	this.step_size = 1.0 / this.chunk_size;



	this.a2fVertexOffset = [
		[0,0,0],[1,0,0],[1,1,0],[0,1,0],
		[0,0,1],[1,0,1],[1,1,1],[0,1,1]
	];

	this.a2iEdgeConnection = [
		[0,1], [1,2], [2,3], [3,0],
		[4,5], [5,6], [6,7], [7,4],
		[0,4], [1,5], [2,6], [3,7]
	];

	this.a2fEdgeDirection = [
		[1,0,0],[0,1,0],[-1,0,0],[0,-1,0],
		[1,0,0],[0,1,0],[-1,0,0],[0,-1,0],
		[0,0,1],[0,0,1],[ 0,0,1],[0, 0,1]
	];

	this.a2iTetrahedronEdgeConnection = [
		[0,1], [1,2], [2,0], [0,3], [1,3], [2,3]
	];

	this.a2iTetrahedronsInACube = [
		[0,5,1,6], [0,1,2,6], [0,2,3,6],
		[0,3,7,6], [0,7,4,6], [0,4,5,6]
	];

	this.aiTetrahedronEdgeFlags = [
        0x00, 0x0d, 0x13, 0x1e, 0x26, 0x2b, 0x35, 0x38,
        0x38, 0x35, 0x2b, 0x26, 0x1e, 0x13, 0x0d, 0x00
	];

	this.a2iTetrahedronTriangles = [
        [-1, -1, -1, -1, -1, -1, -1],
        [ 0,  3,  2, -1, -1, -1, -1],
        [ 0,  1,  4, -1, -1, -1, -1],
        [ 1,  4,  2,  2,  4,  3, -1],

        [ 1,  2,  5, -1, -1, -1, -1],
        [ 0,  3,  5,  0,  5,  1, -1],
        [ 0,  2,  5,  0,  5,  4, -1],
        [ 5,  4,  3, -1, -1, -1, -1],

        [ 3,  4,  5, -1, -1, -1, -1],
        [ 4,  5,  0,  5,  2,  0, -1],
        [ 1,  5,  0,  5,  3,  0, -1],
        [ 5,  2,  1, -1, -1, -1, -1],

        [ 3,  4,  2,  2,  4,  1, -1],
        [ 4,  1,  0, -1, -1, -1, -1],
        [ 2,  3,  0, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1]
	];




	this.aiCubeEdgeFlags = [
		0x000, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
		0x190, 0x099, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
		0x230, 0x339, 0x033, 0x13a, 0x636, 0x73f, 0x435, 0x53c, 0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
		0x3a0, 0x2a9, 0x1a3, 0x0aa, 0x7a6, 0x6af, 0x5a5, 0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
		0x460, 0x569, 0x663, 0x76a, 0x066, 0x16f, 0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
		0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0x0ff, 0x3f5, 0x2fc, 0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
		0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x055, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
		0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0x0cc, 0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
		0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc, 0x0cc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
		0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c, 0x15c, 0x055, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
		0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5, 0x0ff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
		0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f, 0x066, 0x76a, 0x663, 0x569, 0x460,
		0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac, 0x4ac, 0x5a5, 0x6af, 0x7a6, 0x0aa, 0x1a3, 0x2a9, 0x3a0,
		0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x033, 0x339, 0x230,
		0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x099, 0x190,
		0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x000
	];

	this.a2iTriangleConnectionTable = [
		[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 1, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 8, 3, 9, 8, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8, 3, 1, 2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 2,10, 0, 2, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 2, 8, 3, 2,10, 8,10, 9, 8,-1,-1,-1,-1,-1,-1,-1],
		[ 3,11, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0,11, 2, 8,11, 0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 9, 0, 2, 3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1,11, 2, 1, 9,11, 9, 8,11,-1,-1,-1,-1,-1,-1,-1],
		[ 3,10, 1,11,10, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0,10, 1, 0, 8,10, 8,11,10,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 9, 0, 3,11, 9,11,10, 9,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 8,10,10, 8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 7, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 3, 0, 7, 3, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 1, 9, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 1, 9, 4, 7, 1, 7, 3, 1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2,10, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 4, 7, 3, 0, 4, 1, 2,10,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 2,10, 9, 0, 2, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1],
		[ 2,10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4,-1,-1,-1,-1],
		[ 8, 4, 7, 3,11, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[11, 4, 7,11, 2, 4, 2, 0, 4,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 0, 1, 8, 4, 7, 2, 3,11,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 7,11, 9, 4,11, 9,11, 2, 9, 2, 1,-1,-1,-1,-1],
		[ 3,10, 1, 3,11,10, 7, 8, 4,-1,-1,-1,-1,-1,-1,-1],
		[ 1,11,10, 1, 4,11, 1, 0, 4, 7,11, 4,-1,-1,-1,-1],
		[ 4, 7, 8, 9, 0,11, 9,11,10,11, 0, 3,-1,-1,-1,-1],
		[ 4, 7,11, 4,11, 9, 9,11,10,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 5, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 5, 4, 0, 8, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 5, 4, 1, 5, 0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 8, 5, 4, 8, 3, 5, 3, 1, 5,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2,10, 9, 5, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 0, 8, 1, 2,10, 4, 9, 5,-1,-1,-1,-1,-1,-1,-1],
		[ 5, 2,10, 5, 4, 2, 4, 0, 2,-1,-1,-1,-1,-1,-1,-1],
		[ 2,10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8,-1,-1,-1,-1],
		[ 9, 5, 4, 2, 3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0,11, 2, 0, 8,11, 4, 9, 5,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 5, 4, 0, 1, 5, 2, 3,11,-1,-1,-1,-1,-1,-1,-1],
		[ 2, 1, 5, 2, 5, 8, 2, 8,11, 4, 8, 5,-1,-1,-1,-1],
		[10, 3,11,10, 1, 3, 9, 5, 4,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 9, 5, 0, 8, 1, 8,10, 1, 8,11,10,-1,-1,-1,-1],
		[ 5, 4, 0, 5, 0,11, 5,11,10,11, 0, 3,-1,-1,-1,-1],
		[ 5, 4, 8, 5, 8,10,10, 8,11,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 7, 8, 5, 7, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 3, 0, 9, 5, 3, 5, 7, 3,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 7, 8, 0, 1, 7, 1, 5, 7,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 5, 3, 3, 5, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 7, 8, 9, 5, 7,10, 1, 2,-1,-1,-1,-1,-1,-1,-1],
		[10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3,-1,-1,-1,-1],
		[ 8, 0, 2, 8, 2, 5, 8, 5, 7,10, 5, 2,-1,-1,-1,-1],
		[ 2,10, 5, 2, 5, 3, 3, 5, 7,-1,-1,-1,-1,-1,-1,-1],
		[ 7, 9, 5, 7, 8, 9, 3,11, 2,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7,11,-1,-1,-1,-1],
		[ 2, 3,11, 0, 1, 8, 1, 7, 8, 1, 5, 7,-1,-1,-1,-1],
		[11, 2, 1,11, 1, 7, 7, 1, 5,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 5, 8, 8, 5, 7,10, 1, 3,10, 3,11,-1,-1,-1,-1],
		[ 5, 7, 0, 5, 0, 9, 7,11, 0, 1, 0,10,11,10, 0,-1],
		[11,10, 0,11, 0, 3,10, 5, 0, 8, 0, 7, 5, 7, 0,-1],
		[11,10, 5, 7,11, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[10, 6, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8, 3, 5,10, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 0, 1, 5,10, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 8, 3, 1, 9, 8, 5,10, 6,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 6, 5, 2, 6, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 6, 5, 1, 2, 6, 3, 0, 8,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 6, 5, 9, 0, 6, 0, 2, 6,-1,-1,-1,-1,-1,-1,-1],
		[ 5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8,-1,-1,-1,-1],
		[ 2, 3,11,10, 6, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[11, 0, 8,11, 2, 0,10, 6, 5,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 1, 9, 2, 3,11, 5,10, 6,-1,-1,-1,-1,-1,-1,-1],
		[ 5,10, 6, 1, 9, 2, 9,11, 2, 9, 8,11,-1,-1,-1,-1],
		[ 6, 3,11, 6, 5, 3, 5, 1, 3,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8,11, 0,11, 5, 0, 5, 1, 5,11, 6,-1,-1,-1,-1],
		[ 3,11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9,-1,-1,-1,-1],
		[ 6, 5, 9, 6, 9,11,11, 9, 8,-1,-1,-1,-1,-1,-1,-1],
		[ 5,10, 6, 4, 7, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 3, 0, 4, 7, 3, 6, 5,10,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 9, 0, 5,10, 6, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1],
		[10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4,-1,-1,-1,-1],
		[ 6, 1, 2, 6, 5, 1, 4, 7, 8,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7,-1,-1,-1,-1],
		[ 8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6,-1,-1,-1,-1],
		[ 7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9,-1],
		[ 3,11, 2, 7, 8, 4,10, 6, 5,-1,-1,-1,-1,-1,-1,-1],
		[ 5,10, 6, 4, 7, 2, 4, 2, 0, 2, 7,11,-1,-1,-1,-1],
		[ 0, 1, 9, 4, 7, 8, 2, 3,11, 5,10, 6,-1,-1,-1,-1],
		[ 9, 2, 1, 9,11, 2, 9, 4,11, 7,11, 4, 5,10, 6,-1],
		[ 8, 4, 7, 3,11, 5, 3, 5, 1, 5,11, 6,-1,-1,-1,-1],
		[ 5, 1,11, 5,11, 6, 1, 0,11, 7,11, 4, 0, 4,11,-1],
		[ 0, 5, 9, 0, 6, 5, 0, 3, 6,11, 6, 3, 8, 4, 7,-1],
		[ 6, 5, 9, 6, 9,11, 4, 7, 9, 7,11, 9,-1,-1,-1,-1],
		[10, 4, 9, 6, 4,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4,10, 6, 4, 9,10, 0, 8, 3,-1,-1,-1,-1,-1,-1,-1],
		[10, 0, 1,10, 6, 0, 6, 4, 0,-1,-1,-1,-1,-1,-1,-1],
		[ 8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1,10,-1,-1,-1,-1],
		[ 1, 4, 9, 1, 2, 4, 2, 6, 4,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4,-1,-1,-1,-1],
		[ 0, 2, 4, 4, 2, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 8, 3, 2, 8, 2, 4, 4, 2, 6,-1,-1,-1,-1,-1,-1,-1],
		[10, 4, 9,10, 6, 4,11, 2, 3,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8, 2, 2, 8,11, 4, 9,10, 4,10, 6,-1,-1,-1,-1],
		[ 3,11, 2, 0, 1, 6, 0, 6, 4, 6, 1,10,-1,-1,-1,-1],
		[ 6, 4, 1, 6, 1,10, 4, 8, 1, 2, 1,11, 8,11, 1,-1],
		[ 9, 6, 4, 9, 3, 6, 9, 1, 3,11, 6, 3,-1,-1,-1,-1],
		[ 8,11, 1, 8, 1, 0,11, 6, 1, 9, 1, 4, 6, 4, 1,-1],
		[ 3,11, 6, 3, 6, 0, 0, 6, 4,-1,-1,-1,-1,-1,-1,-1],
		[ 6, 4, 8,11, 6, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 7,10, 6, 7, 8,10, 8, 9,10,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 7, 3, 0,10, 7, 0, 9,10, 6, 7,10,-1,-1,-1,-1],
		[10, 6, 7, 1,10, 7, 1, 7, 8, 1, 8, 0,-1,-1,-1,-1],
		[10, 6, 7,10, 7, 1, 1, 7, 3,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7,-1,-1,-1,-1],
		[ 2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9,-1],
		[ 7, 8, 0, 7, 0, 6, 6, 0, 2,-1,-1,-1,-1,-1,-1,-1],
		[ 7, 3, 2, 6, 7, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 2, 3,11,10, 6, 8,10, 8, 9, 8, 6, 7,-1,-1,-1,-1],
		[ 2, 0, 7, 2, 7,11, 0, 9, 7, 6, 7,10, 9,10, 7,-1],
		[ 1, 8, 0, 1, 7, 8, 1,10, 7, 6, 7,10, 2, 3,11,-1],
		[11, 2, 1,11, 1, 7,10, 6, 1, 6, 7, 1,-1,-1,-1,-1],
		[ 8, 9, 6, 8, 6, 7, 9, 1, 6,11, 6, 3, 1, 3, 6,-1],
		[ 0, 9, 1,11, 6, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 7, 8, 0, 7, 0, 6, 3,11, 0,11, 6, 0,-1,-1,-1,-1],
		[ 7,11, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 7, 6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 0, 8,11, 7, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 1, 9,11, 7, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 8, 1, 9, 8, 3, 1,11, 7, 6,-1,-1,-1,-1,-1,-1,-1],
		[10, 1, 2, 6,11, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2,10, 3, 0, 8, 6,11, 7,-1,-1,-1,-1,-1,-1,-1],
		[ 2, 9, 0, 2,10, 9, 6,11, 7,-1,-1,-1,-1,-1,-1,-1],
		[ 6,11, 7, 2,10, 3,10, 8, 3,10, 9, 8,-1,-1,-1,-1],
		[ 7, 2, 3, 6, 2, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 7, 0, 8, 7, 6, 0, 6, 2, 0,-1,-1,-1,-1,-1,-1,-1],
		[ 2, 7, 6, 2, 3, 7, 0, 1, 9,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6,-1,-1,-1,-1],
		[10, 7, 6,10, 1, 7, 1, 3, 7,-1,-1,-1,-1,-1,-1,-1],
		[10, 7, 6, 1, 7,10, 1, 8, 7, 1, 0, 8,-1,-1,-1,-1],
		[ 0, 3, 7, 0, 7,10, 0,10, 9, 6,10, 7,-1,-1,-1,-1],
		[ 7, 6,10, 7,10, 8, 8,10, 9,-1,-1,-1,-1,-1,-1,-1],
		[ 6, 8, 4,11, 8, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 6,11, 3, 0, 6, 0, 4, 6,-1,-1,-1,-1,-1,-1,-1],
		[ 8, 6,11, 8, 4, 6, 9, 0, 1,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 4, 6, 9, 6, 3, 9, 3, 1,11, 3, 6,-1,-1,-1,-1],
		[ 6, 8, 4, 6,11, 8, 2,10, 1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2,10, 3, 0,11, 0, 6,11, 0, 4, 6,-1,-1,-1,-1],
		[ 4,11, 8, 4, 6,11, 0, 2, 9, 2,10, 9,-1,-1,-1,-1],
		[10, 9, 3,10, 3, 2, 9, 4, 3,11, 3, 6, 4, 6, 3,-1],
		[ 8, 2, 3, 8, 4, 2, 4, 6, 2,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 4, 2, 4, 6, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8,-1,-1,-1,-1],
		[ 1, 9, 4, 1, 4, 2, 2, 4, 6,-1,-1,-1,-1,-1,-1,-1],
		[ 8, 1, 3, 8, 6, 1, 8, 4, 6, 6,10, 1,-1,-1,-1,-1],
		[10, 1, 0,10, 0, 6, 6, 0, 4,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 6, 3, 4, 3, 8, 6,10, 3, 0, 3, 9,10, 9, 3,-1],
		[10, 9, 4, 6,10, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 9, 5, 7, 6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8, 3, 4, 9, 5,11, 7, 6,-1,-1,-1,-1,-1,-1,-1],
		[ 5, 0, 1, 5, 4, 0, 7, 6,11,-1,-1,-1,-1,-1,-1,-1],
		[11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5,-1,-1,-1,-1],
		[ 9, 5, 4,10, 1, 2, 7, 6,11,-1,-1,-1,-1,-1,-1,-1],
		[ 6,11, 7, 1, 2,10, 0, 8, 3, 4, 9, 5,-1,-1,-1,-1],
		[ 7, 6,11, 5, 4,10, 4, 2,10, 4, 0, 2,-1,-1,-1,-1],
		[ 3, 4, 8, 3, 5, 4, 3, 2, 5,10, 5, 2,11, 7, 6,-1],
		[ 7, 2, 3, 7, 6, 2, 5, 4, 9,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7,-1,-1,-1,-1],
		[ 3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0,-1,-1,-1,-1],
		[ 6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8,-1],
		[ 9, 5, 4,10, 1, 6, 1, 7, 6, 1, 3, 7,-1,-1,-1,-1],
		[ 1, 6,10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4,-1],
		[ 4, 0,10, 4,10, 5, 0, 3,10, 6,10, 7, 3, 7,10,-1],
		[ 7, 6,10, 7,10, 8, 5, 4,10, 4, 8,10,-1,-1,-1,-1],
		[ 6, 9, 5, 6,11, 9,11, 8, 9,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 6,11, 0, 6, 3, 0, 5, 6, 0, 9, 5,-1,-1,-1,-1],
		[ 0,11, 8, 0, 5,11, 0, 1, 5, 5, 6,11,-1,-1,-1,-1],
		[ 6,11, 3, 6, 3, 5, 5, 3, 1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2,10, 9, 5,11, 9,11, 8,11, 5, 6,-1,-1,-1,-1],
		[ 0,11, 3, 0, 6,11, 0, 9, 6, 5, 6, 9, 1, 2,10,-1],
		[11, 8, 5,11, 5, 6, 8, 0, 5,10, 5, 2, 0, 2, 5,-1],
		[ 6,11, 3, 6, 3, 5, 2,10, 3,10, 5, 3,-1,-1,-1,-1],
		[ 5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2,-1,-1,-1,-1],
		[ 9, 5, 6, 9, 6, 0, 0, 6, 2,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8,-1],
		[ 1, 5, 6, 2, 1, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 3, 6, 1, 6,10, 3, 8, 6, 5, 6, 9, 8, 9, 6,-1],
		[10, 1, 0,10, 0, 6, 9, 5, 0, 5, 6, 0,-1,-1,-1,-1],
		[ 0, 3, 8, 5, 6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[10, 5, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[11, 5,10, 7, 5,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[11, 5,10,11, 7, 5, 8, 3, 0,-1,-1,-1,-1,-1,-1,-1],
		[ 5,11, 7, 5,10,11, 1, 9, 0,-1,-1,-1,-1,-1,-1,-1],
		[10, 7, 5,10,11, 7, 9, 8, 1, 8, 3, 1,-1,-1,-1,-1],
		[11, 1, 2,11, 7, 1, 7, 5, 1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2,11,-1,-1,-1,-1],
		[ 9, 7, 5, 9, 2, 7, 9, 0, 2, 2,11, 7,-1,-1,-1,-1],
		[ 7, 5, 2, 7, 2,11, 5, 9, 2, 3, 2, 8, 9, 8, 2,-1],
		[ 2, 5,10, 2, 3, 5, 3, 7, 5,-1,-1,-1,-1,-1,-1,-1],
		[ 8, 2, 0, 8, 5, 2, 8, 7, 5,10, 2, 5,-1,-1,-1,-1],
		[ 9, 0, 1, 5,10, 3, 5, 3, 7, 3,10, 2,-1,-1,-1,-1],
		[ 9, 8, 2, 9, 2, 1, 8, 7, 2,10, 2, 5, 7, 5, 2,-1],
		[ 1, 3, 5, 3, 7, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8, 7, 0, 7, 1, 1, 7, 5,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 0, 3, 9, 3, 5, 5, 3, 7,-1,-1,-1,-1,-1,-1,-1],
		[ 9, 8, 7, 5, 9, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 5, 8, 4, 5,10, 8,10,11, 8,-1,-1,-1,-1,-1,-1,-1],
		[ 5, 0, 4, 5,11, 0, 5,10,11,11, 3, 0,-1,-1,-1,-1],
		[ 0, 1, 9, 8, 4,10, 8,10,11,10, 4, 5,-1,-1,-1,-1],
		[10,11, 4,10, 4, 5,11, 3, 4, 9, 4, 1, 3, 1, 4,-1],
		[ 2, 5, 1, 2, 8, 5, 2,11, 8, 4, 5, 8,-1,-1,-1,-1],
		[ 0, 4,11, 0,11, 3, 4, 5,11, 2,11, 1, 5, 1,11,-1],
		[ 0, 2, 5, 0, 5, 9, 2,11, 5, 4, 5, 8,11, 8, 5,-1],
		[ 9, 4, 5, 2,11, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 2, 5,10, 3, 5, 2, 3, 4, 5, 3, 8, 4,-1,-1,-1,-1],
		[ 5,10, 2, 5, 2, 4, 4, 2, 0,-1,-1,-1,-1,-1,-1,-1],
		[ 3,10, 2, 3, 5,10, 3, 8, 5, 4, 5, 8, 0, 1, 9,-1],
		[ 5,10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2,-1,-1,-1,-1],
		[ 8, 4, 5, 8, 5, 3, 3, 5, 1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 4, 5, 1, 0, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5,-1,-1,-1,-1],
		[ 9, 4, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4,11, 7, 4, 9,11, 9,10,11,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 8, 3, 4, 9, 7, 9,11, 7, 9,10,11,-1,-1,-1,-1],
		[ 1,10,11, 1,11, 4, 1, 4, 0, 7, 4,11,-1,-1,-1,-1],
		[ 3, 1, 4, 3, 4, 8, 1,10, 4, 7, 4,11,10,11, 4,-1],
		[ 4,11, 7, 9,11, 4, 9, 2,11, 9, 1, 2,-1,-1,-1,-1],
		[ 9, 7, 4, 9,11, 7, 9, 1,11, 2,11, 1, 0, 8, 3,-1],
		[11, 7, 4,11, 4, 2, 2, 4, 0,-1,-1,-1,-1,-1,-1,-1],
		[11, 7, 4,11, 4, 2, 8, 3, 4, 3, 2, 4,-1,-1,-1,-1],
		[ 2, 9,10, 2, 7, 9, 2, 3, 7, 7, 4, 9,-1,-1,-1,-1],
		[ 9,10, 7, 9, 7, 4,10, 2, 7, 8, 7, 0, 2, 0, 7,-1],
		[ 3, 7,10, 3,10, 2, 7, 4,10, 1,10, 0, 4, 0,10,-1],
		[ 1,10, 2, 8, 7, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 9, 1, 4, 1, 7, 7, 1, 3,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1,-1,-1,-1,-1],
		[ 4, 0, 3, 7, 4, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 4, 8, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 9,10, 8,10,11, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 0, 9, 3, 9,11,11, 9,10,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 1,10, 0,10, 8, 8,10,11,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 1,10,11, 3,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 2,11, 1,11, 9, 9,11, 8,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 0, 9, 3, 9,11, 1, 2, 9, 2,11, 9,-1,-1,-1,-1],
		[ 0, 2,11, 8, 0,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 3, 2,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 2, 3, 8, 2, 8,10,10, 8, 9,-1,-1,-1,-1,-1,-1,-1],
		[ 9,10, 2, 0, 9, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 2, 3, 8, 2, 8,10, 0, 1, 8, 1,10, 8,-1,-1,-1,-1],
		[ 1,10, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 1, 3, 8, 9, 1, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 9, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[ 0, 3, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
		[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
	];


}


///

function fgetOffset( fValue1, fValue2, fValueDesired ) {

	var fDelta = fValue2 - fValue1;

	if (fDelta == 0)
		return 0.5;

	return (fValueDesired - fValue1) / fDelta;
}

//vgetColor generates a color from a given position and normal of a point
function vgetColor( rfNormal ) {

	var fX = rfNormal[0];
	var fY = rfNormal[1];
	var fZ = rfNormal[2];

	return [
		  ( (fX > 0 ? fX : 0) + (fY < 0 ? -0.5 * fY : 0.0) + (fZ < 0 ? -0.5 * fZ : 0) )
		, ( (fY > 0 ? fY : 0) + (fZ < 0 ? -0.5 * fZ : 0.0) + (fX < 0 ? -0.5 * fX : 0) )
		, ( (fZ > 0 ? fZ : 0) + (fX < 0 ? -0.5 * fX : 0.0) + (fY < 0 ? -0.5 * fY : 0) )
	];
}

function vNormalizeVector( vec ) {

	var fOldLength = Math.sqrt( (vec[0] * vec[0]) + (vec[1] * vec[1]) + (vec[2] * vec[2]) );

	if (fOldLength == 0.0)
		return vec;

	var tmp_scale = 1.0 / fOldLength;

	return [
		vec[0] * tmp_scale,
		vec[1] * tmp_scale,
		vec[2] * tmp_scale
	];
}


MarchinCube.prototype.getNormal = function( fX, fY, fZ ) {

	var step_dec = this.step_size * 0.1;

	var vec = [
		this.sample( fX - step_dec, fY, fZ ) - this.sample( fX + step_dec, fY, fZ ),
		this.sample( fX, fY - step_dec, fZ ) - this.sample( fX, fY + step_dec, fZ ),
		this.sample( fX, fY, fZ - step_dec ) - this.sample( fX, fY, fZ + step_dec )
	];

	return vNormalizeVector( vec );
}

MarchinCube.prototype.getNormal2 = function( t1, t2, t3 ) {
 
	var Ux = t2[0] - t1[0];
	var Uy = t2[1] - t1[1];
	var Uz = t2[2] - t1[2];
	var Vx = t3[0] - t1[0];
	var Vy = t3[1] - t1[1];
	var Vz = t3[2] - t1[2];

	var normal2 = [
		Uy*Vz - Uz*Vy,
		Uz*Vx - Ux*Vz,
		Ux*Vy - Uy*Vx
	];

	var len = Math.sqrt(
		normal2[0]*normal2[0]+
		normal2[1]*normal2[1]+
		normal2[2]*normal2[2]
	);

	return normal2
}

MarchinCube.prototype.marchCube = function( pos, geom_callback ) {

	this.current_geom_callback = geom_callback;

	for (var iX = 0; iX < this.chunk_size; ++iX)
	for (var iY = 0; iY < this.chunk_size; ++iY)
	for (var iZ = 0; iZ < this.chunk_size; ++iZ)
		this.marchCube_single( pos[0] + iX, pos[1] + iY, pos[2] + iZ );

	this.current_geom_callback = null;
}

MarchinCube.prototype.marchCube_step = function( step, pos, geom_callback ) {

	this.current_geom_callback = geom_callback;

	var tmp_index = 0;

	for (var iX = 0; iX < this.chunk_size; ++iX)
	for (var iY = 0; iY < this.chunk_size; ++iY)
	for (var iZ = 0; iZ < this.chunk_size; ++iZ)
	{
		++tmp_index;

		if (tmp_index >= this.current_index &&
			tmp_index < this.current_index + step)
		{
			if (!this.tetra)
				this.marchCube_single( pos[0] + iX, pos[1] + iY, pos[2] + iZ );
			else
				this.vMarchCube2( pos[0] + iX, pos[1] + iY, pos[2] + iZ );
		}
	}

	this.current_index += step;

	this.current_geom_callback = null;

	if (this.current_index >= this.chunk_size*this.chunk_size*this.chunk_size)
	{
		this.current_index = 0;
		return true;
	}

	return false;
}

MarchinCube.prototype.marchCube_single = function( iX, iY, iZ ) {

	var iCorner,
		iVertex,
		iVertexTest,
		iEdge,
		iTriangle,
		iFlagIndex,
		iEdgeFlags;

	var fOffset = 0.0;
	var afCubeValue = [ 0.0,0.0,0.0,0.0, 0.0,0.0,0.0,0.0 ];
	var asEdgeVertex =  [
		[0,0,0], [0,0,0], [0,0,0], [0,0,0],
		[0,0,0], [0,0,0], [0,0,0], [0,0,0],
		[0,0,0], [0,0,0], [0,0,0], [0,0,0]
	];
	var asEdgeNorm =  [
		[0,0,0], [0,0,0], [0,0,0], [0,0,0],
		[0,0,0], [0,0,0], [0,0,0], [0,0,0],
		[0,0,0], [0,0,0], [0,0,0], [0,0,0]
	];

	/// add chunk pos here
	var fX = iX * this.step_size,
		fY = iY * this.step_size,
		fZ = iZ * this.step_size;

	/// Make a local copy of the values at the cube's corners
	for (iVertex = 0; iVertex < 8; ++iVertex)
		afCubeValue[iVertex] = this.sample( fX + this.a2fVertexOffset[iVertex][0] * this.step_size,
											fY + this.a2fVertexOffset[iVertex][1] * this.step_size,
											fZ + this.a2fVertexOffset[iVertex][2] * this.step_size );

	//Find which vertices are inside of the surface and which are outside
	iFlagIndex = 0|0;
	for (iVertexTest = 0|0; iVertexTest < 8; ++iVertexTest)
		if (afCubeValue[iVertexTest] <= this.fTv)
			iFlagIndex |= (1 << iVertexTest);

	//Find which edges are intersected by the surface
	iEdgeFlags = this.aiCubeEdgeFlags[iFlagIndex];

	//If the cube is entirely inside or outside of the surface, then there will be no intersections
	if (iEdgeFlags == 0)
		return;

	//Find the point of intersection of the surface with each edge
	//Then find the normal to the surface at those points
	for (iEdge = 0; iEdge < 12; ++iEdge) {

		//if there is an intersection on this edge
		if (iEdgeFlags & (1 << iEdge)) {

			fOffset = fgetOffset(
				afCubeValue[ this.a2iEdgeConnection[iEdge][0] ],
				afCubeValue[ this.a2iEdgeConnection[iEdge][1] ],
				this.fTv
			);

			asEdgeVertex[iEdge][0] = fX + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][0] + fOffset * this.a2fEdgeDirection[iEdge][0] ) * this.step_size;
			asEdgeVertex[iEdge][1] = fY + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][1] + fOffset * this.a2fEdgeDirection[iEdge][1] ) * this.step_size;
			asEdgeVertex[iEdge][2] = fZ + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][2] + fOffset * this.a2fEdgeDirection[iEdge][2] ) * this.step_size;

			asEdgeNorm[iEdge] = this.getNormal( asEdgeVertex[iEdge][0], asEdgeVertex[iEdge][1], asEdgeVertex[iEdge][2] );
		}
	}


	//Draw the triangles that were found.  There can be up to five per cube
	for (iTriangle = 0; iTriangle < 5; ++iTriangle) {

		if (this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle ] < 0)
			break;



		for (var iCorner = 0; iCorner < 3; ++iCorner) {

			iVertex = this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle + iCorner ];

			var color = vgetColor( asEdgeNorm[iVertex] );

			//

			var vertex = [
				asEdgeVertex[iVertex][0] * this.chunk_size,
				asEdgeVertex[iVertex][1] * this.chunk_size,
				asEdgeVertex[iVertex][2] * this.chunk_size
			];

			var normal = asEdgeNorm[iVertex];

			//

			if (this.current_geom_callback)
				this.current_geom_callback( vertex, color, normal );

		} // for (iCorner = [...]



		// var t_positions = [];
		// var t_colors = [];


		// for (var iCorner = 0; iCorner < 3; ++iCorner) {

		// 	iVertex = this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle + iCorner ];

		// 	// var color = vgetColor( asEdgeNorm[iVertex] );

		// 	//

		// 	var vertex = [
		// 		asEdgeVertex[iVertex][0] * this.chunk_size,
		// 		asEdgeVertex[iVertex][1] * this.chunk_size,
		// 		asEdgeVertex[iVertex][2] * this.chunk_size
		// 	];

		// 	//

		// 	t_positions.push(vertex)
		// 	// t_colors.push(color)

		// } // for (iCorner = [...]

		// var t_normal = this.getNormal2( t_positions[0], t_positions[1], t_positions[2] );
		// var t_color = vgetColor( t_normal );
		// // console.log(t_normal);

		// for (var i = 0; i < 3; ++i) {


		// 	if (this.current_geom_callback)
		// 		// this.current_geom_callback( t_positions[i], t_colors[i], t_normal );
		// 		this.current_geom_callback( t_positions[i], t_color, t_normal );

		// } // for (iCorner = [...]



	} // for (iTriangle = [...]

}




























MarchinCube.prototype.vMarchCube2 = function(iX, iY, iZ) {

	/// add chunk pos here
	var fX = iX * this.step_size,
		fY = iY * this.step_size,
		fZ = iZ * this.step_size;

	var asCubePosition = [
		[0,0,0],[0,0,0],[0,0,0],[0,0,0],
		[0,0,0],[0,0,0],[0,0,0],[0,0,0]
	];

	// Make a local copy of the cube's corner positions
	for (var iVertex = 0; iVertex < 8; iVertex++)
	{
		asCubePosition[iVertex][0] = fX + this.a2fVertexOffset[iVertex][0]*this.step_size;
		asCubePosition[iVertex][1] = fY + this.a2fVertexOffset[iVertex][1]*this.step_size;
		asCubePosition[iVertex][2] = fZ + this.a2fVertexOffset[iVertex][2]*this.step_size;
	}

	var  afCubeValue = [0,0,0,0,0,0,0,0];

	// Make a local copy of the cube's corner values
	for (var iVertex = 0; iVertex < 8; iVertex++)
		afCubeValue[iVertex] = this.sample( asCubePosition[iVertex][0],
											asCubePosition[iVertex][1],
											asCubePosition[iVertex][2]);

	var asTetrahedronPosition =  [ [0,0,0],[0,0,0],[0,0,0],[0,0,0] ];
	var afTetrahedronValue = [0,0,0,0];

	for (var iTetrahedron = 0; iTetrahedron < 6; iTetrahedron++)
	{
		for(var iVertex = 0; iVertex < 4; iVertex++)
		{
			var iVertexInACube = this.a2iTetrahedronsInACube[iTetrahedron][iVertex];

			asTetrahedronPosition[iVertex][0] = asCubePosition[iVertexInACube][0];
			asTetrahedronPosition[iVertex][1] = asCubePosition[iVertexInACube][1];
			asTetrahedronPosition[iVertex][2] = asCubePosition[iVertexInACube][2];

			afTetrahedronValue[iVertex] = afCubeValue[iVertexInACube];
		}

		this.vMarchTetrahedron( asTetrahedronPosition, afTetrahedronValue );
	}
}

MarchinCube.prototype.vMarchTetrahedron = function(pasTetrahedronPosition, pafTetrahedronValue) {

	var iEdge, iVert0, iVert1, iEdgeFlags, iTriangle, iCorner, iVertex, iFlagIndex = 0;
	var fOffset, fInvOffset, fValue = 0.0;
	var asEdgeVertex = [ [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0] ];
	var asEdgeNorm = [ [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0] ];
	var sColor = [0,0,0];

	//Find which vertices are inside of the surface and which are outside
	for (iVertex = 0; iVertex < 4; iVertex++)
	{
		if(pafTetrahedronValue[iVertex] <= this.fTv) 
			iFlagIndex |= 1<<iVertex;
	}

	//Find which edges are intersected by the surface
	iEdgeFlags = this.aiTetrahedronEdgeFlags[iFlagIndex];

	//If the tetrahedron is entirely inside or outside of the surface, then there will be no intersections
	if (iEdgeFlags == 0)
		return;

	for (iEdge = 0; iEdge < 6; iEdge++)
	{
		if (iEdgeFlags & (1<<iEdge))
		{
			iVert0 = this.a2iTetrahedronEdgeConnection[iEdge][0];
			iVert1 = this.a2iTetrahedronEdgeConnection[iEdge][1];
			fOffset = fgetOffset(
				pafTetrahedronValue[iVert0],
				pafTetrahedronValue[iVert1],
				this.fTv
			);
			fInvOffset = 1.0 - fOffset;

			asEdgeVertex[iEdge][0] = fInvOffset*pasTetrahedronPosition[iVert0][0]  +  fOffset*pasTetrahedronPosition[iVert1][0];
			asEdgeVertex[iEdge][1] = fInvOffset*pasTetrahedronPosition[iVert0][1]  +  fOffset*pasTetrahedronPosition[iVert1][1];
			asEdgeVertex[iEdge][2] = fInvOffset*pasTetrahedronPosition[iVert0][2]  +  fOffset*pasTetrahedronPosition[iVert1][2];

			asEdgeNorm[iEdge] = this.getNormal( asEdgeVertex[iEdge][0], asEdgeVertex[iEdge][1], asEdgeVertex[iEdge][2] );
		}
	}

	for (iTriangle = 0; iTriangle < 2; iTriangle++)
	{
		if (this.a2iTetrahedronTriangles[iFlagIndex][3*iTriangle] < 0)
			break;


		for (iCorner = 0; iCorner < 3; iCorner++)
		{
			iVertex = this.a2iTetrahedronTriangles[iFlagIndex][3*iTriangle+iCorner];

			var color = vgetColor( asEdgeNorm[iVertex] );

			var vertex = [
				asEdgeVertex[iVertex][0] * this.chunk_size,
				asEdgeVertex[iVertex][1] * this.chunk_size,
				asEdgeVertex[iVertex][2] * this.chunk_size
				// asEdgeVertex[iVertex][0],
				// asEdgeVertex[iVertex][1],
				// asEdgeVertex[iVertex][2]
			];

			var normal = asEdgeNorm[iVertex];

			if (this.current_geom_callback)
				this.current_geom_callback( vertex, color, normal );

		}
	}
}



module.exports = MarchinCube

},{}],10:[function(require,module,exports){

var ClassicalNoise = function(r, octaves, freq, amp) {

	this._octaves		= octaves || 1;
	this._frequency		= freq || 1.0;
	this._amplitude		= amp || 0.5;

	if (r == undefined) r = Math;

	this.grad3 = [ [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
				   [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
				   [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1] ];

	this.p = new Uint8Array(256);

	for (var i = 0; i < 256; ++i)
		this.p[i] = Math.floor(r.random()*256)|0;

	// To remove the need for index wrapping, double the permutation table length
	this.perm = new Uint8Array(512);
	for (var i = 0; i < 512; ++i)
		this.perm[i] = this.p[i & 255]|0;
};

///

ClassicalNoise.prototype.noise_ex = function(x2, y2, z2) { 

	var result = 0.0;
	var amp = this._amplitude;

	var x = x2 * this._frequency;
	var y = y2 * this._frequency;
	var z = z2 * this._frequency;

	for (var i = 0; i < this._octaves; ++i)
	{
		result += this.noise(x,y,z) * amp;

		x *= 2.0;
		y *= 2.0;
		z *= 2.0;

		amp *= 0.5;
	}

	return (result);
}

///

ClassicalNoise.prototype.dot = function(g, x, y, z) { return g[0]*x + g[1]*y + g[2]*z; }; 
ClassicalNoise.prototype.mix = function(a, b, t) { return (1.0-t)*a + t*b; };
ClassicalNoise.prototype.fade = function(t) {  return t*t*t*(t*(t*6.0-15.0)+10.0); };
 
// Classic Perlin noise, 3D version 
ClassicalNoise.prototype.noise = function(x, y, z) { 

	// Find unit grid cell containing point 
	var X = Math.floor(x)|0;
	var Y = Math.floor(y)|0;
	var Z = Math.floor(z)|0;

	// Get relative xyz coordinates of point within that cell 
	x = x - X;
	y = y - Y;
	z = z - Z;

	// Wrap the integer cells at 255 (smaller integer period can be introduced here) 
	X = (X & 255)|0; 
	Y = (Y & 255)|0; 
	Z = (Z & 255)|0;

	// Calculate a set of eight hashed gradient indices 
	var gi000 = (this.perm[X  +this.perm[Y  +this.perm[Z  ]]] % 12)|0;
	var gi001 = (this.perm[X  +this.perm[Y  +this.perm[Z+1]]] % 12)|0;
	var gi010 = (this.perm[X  +this.perm[Y+1+this.perm[Z  ]]] % 12)|0;
	var gi011 = (this.perm[X  +this.perm[Y+1+this.perm[Z+1]]] % 12)|0;
	var gi100 = (this.perm[X+1+this.perm[Y  +this.perm[Z  ]]] % 12)|0;
	var gi101 = (this.perm[X+1+this.perm[Y  +this.perm[Z+1]]] % 12)|0;
	var gi110 = (this.perm[X+1+this.perm[Y+1+this.perm[Z  ]]] % 12)|0;
	var gi111 = (this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12)|0;

	// Calculate noise contributions from each of the eight corners
	var n000 = this.dot(this.grad3[gi000], x  , y  , z  );
	var n100 = this.dot(this.grad3[gi100], x-1, y  , z  );
	var n010 = this.dot(this.grad3[gi010], x  , y-1, z  );
	var n110 = this.dot(this.grad3[gi110], x-1, y-1, z  );
	var n001 = this.dot(this.grad3[gi001], x  , y  , z-1);
	var n101 = this.dot(this.grad3[gi101], x-1, y  , z-1);
	var n011 = this.dot(this.grad3[gi011], x  , y-1, z-1);
	var n111 = this.dot(this.grad3[gi111], x-1, y-1, z-1);

	// Compute the fade curve value for each of x, y, z
	var u = this.fade(x);
	var v = this.fade(y);
	var w = this.fade(z);

	// Interpolate along x the contributions from each of the corners
	var nx00 = this.mix(n000, n100, u);
	var nx01 = this.mix(n001, n101, u);
	var nx10 = this.mix(n010, n110, u);
	var nx11 = this.mix(n011, n111, u);

	// Interpolate the four results along y
	var nxy0 = this.mix(nx00, nx10, v);
	var nxy1 = this.mix(nx01, nx11, v);

	// Interpolate the two last results along z
	var nxyz = this.mix(nxy0, nxy1, w);

	return nxyz;
};

///

module.exports = ClassicalNoise

},{}],11:[function(require,module,exports){

var Randomiser = function() {

	this.RAND_MAX = 2147483648|0;

	this.s_seed = 1|0;


	Randomiser.prototype.random = function() {

		var	hi,lo,x;

		if (this.s_seed == 0)
			this.s_seed = 123459876;

		hi = (this.s_seed / 127773)|0;
		lo = (this.s_seed % 127773)|0;
		x = (16807 * lo - 2836 * hi)|0;

		if (x < 0)
			x += 0x7fffffff;

		this.s_seed = x;

		var tmp_value = ( x % (this.RAND_MAX + 1) )|0;

		return (tmp_value / -this.RAND_MAX);
	};

	Randomiser.prototype.srandom = function(seed) {
		this.s_seed = seed|0;
	}
}

module.exports = Randomiser

},{}],12:[function(require,module,exports){

// define(function() {

    function createCubeVertices(size, arr_color, no_inside) {

        var outer_side = size / 2;
        var inner_side = size / 2.1;

        var vertices = [
             outer_side,  outer_side,  outer_side, // 0
            -outer_side,  outer_side,  outer_side,
             outer_side, -outer_side,  outer_side,
            -outer_side, -outer_side,  outer_side,

             outer_side,  outer_side, -outer_side, // 4
            -outer_side,  outer_side, -outer_side,
             outer_side, -outer_side, -outer_side,
            -outer_side, -outer_side, -outer_side,

             inner_side,  inner_side,  inner_side, // 8
            -inner_side,  inner_side,  inner_side,
             inner_side, -inner_side,  inner_side,
            -inner_side, -inner_side,  inner_side,

             inner_side,  inner_side, -inner_side, // 12
            -inner_side,  inner_side, -inner_side,
             inner_side, -inner_side, -inner_side,
            -inner_side, -inner_side, -inner_side
        ];

        //

        var indices = [
            0,1,  1,3,  3,2,  2,0,
            4,5,  5,7,  7,6,  6,4,
            0,4,  1,5,  3,7,  2,6,

             8, 9,   9,11,  11,10,  10, 8,
            12,13,  13,15,  15,14,  14,12,
             8,12,   9,13,  11,15,  10,14
        ];

        //

        if (no_inside)
            indices.length /= 2;

        //

        var fvertices = [];

        for (var i = 0; i < indices.length; ++i)
        {
            var curr_index = indices[i] * 3;

            for (var j = 0; j < 3; ++j)
                fvertices.push( vertices[curr_index + j] + outer_side );

            for (var j = 0; j < 3; ++j)
                fvertices.push( arr_color[j] );
        }

        return fvertices;
    }

//     return createCubeVertices;
// });

module.exports = createCubeVertices

},{}],13:[function(require,module,exports){

// define(function() {

    function createCubeVertices(fovY, aspect, zNear, zFar) {

        var left, right, bottom, top;


        var fovy = fovY;
        var nearval = zNear;
        var farval = zFar;


        var pi = 3.1415926;
        var fW, fH;

        fH = Math.tan( fovY / 360.0 * pi ) * zNear;
        fW = fH * aspect;

        left = -fW;
        right = +fW;

        top = +fH;
        bottom = -fH;

        var half_z = farval * Math.sin(fovy * 3.14 / 180.0);
        var half_y = half_z * aspect;

        var vertices = [

            nearval, left,  top,
            nearval, right, top,
            nearval, left,  bottom,
            nearval, right, bottom,

            farval, -half_y, +half_z,
            farval, +half_y, +half_z,
            farval, -half_y, -half_z,
            farval, +half_y, -half_z

            , farval, -half_y*1.66, -half_z
            , farval, -half_y*1.66, +half_z
        ];

        //

        var indices = [
            0,1,  1,3,  3,2,  2,0,
            0,4,  1,5,  2,6,  3,7,
            4,5,  5,7,  7,6,  6,4,
            8,9,
            7,8,
            5,9,
        ];

        //

        var fvertices = [];

        for (var i = 0; i < indices.length; ++i)
        {
            var curr_index = indices[i] * 3;

            for (var j = 0; j < 3; ++j)
                fvertices.push( vertices[curr_index + j] );

            fvertices.push( 1,1,1 );
        }

        return fvertices;
    }

//     return createCubeVertices;
// });

module.exports = createCubeVertices

},{}],14:[function(require,module,exports){


var gl = require('../gl-context.js');


// define(
// 	[

// 		  '../gl-context.js'

// 	],function(

// 		  gl
// 	)
// {

	//

	var createGeometryColor = function (vertices, primitive) {

		this._primitive = primitive;

		this._vbuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

		this._vbuffer.numItems = vertices.length / 6;



		//
		// tmp

		this._ext = gl.getExtension("OES_vertex_array_object");

		// /tmp
		//
	}

	//

	createGeometryColor.prototype.render = function(shader) {

		if (this._ext)
		{
			if (this._vao)
			{
				this._ext.bindVertexArrayOES( this._vao );

					gl.drawArrays( this._primitive, 0, this._vbuffer.numItems );

				this._ext.bindVertexArrayOES( null );
			}
			else
			{
				this._vao = this._ext.createVertexArrayOES();

				this._ext.bindVertexArrayOES( this._vao );

					this.render_backup(shader, true);

				this._ext.bindVertexArrayOES( null );
			}
		}
		else
		{
			this.render_backup(shader);
		}
	};

	//

	createGeometryColor.prototype.render_backup = function(shader, no_clear) {

		gl.enableVertexAttribArray(shader.aVertexPosition);
		gl.enableVertexAttribArray(shader.aVertexColor);

			var bpp = 4; // gl.FLOAT -> 4 bytes
			var stride = 6 * bpp;
			var index_pos    = 0 * bpp;
			var index_color  = 3 * bpp;

			gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);
			gl.vertexAttribPointer(shader.aVertexPosition,3,gl.FLOAT,false,stride,index_pos);
			gl.vertexAttribPointer(shader.aVertexColor,3,gl.FLOAT,false,stride,index_color);

			gl.drawArrays( this._primitive, 0, this._vbuffer.numItems );

		if (!no_clear)
		{
			gl.disableVertexAttribArray(shader.aVertexPosition);
			gl.disableVertexAttribArray(shader.aVertexColor);
		}
	};


	//

// 	return createGeometryColor;
// })

module.exports = createGeometryColor;

},{"../gl-context.js":16}],15:[function(require,module,exports){

var gl = require('../gl-context.js');

var createGeometryExperimental = function (vertices,shader, vertices_is_buffer) {

	this._vbuffer = gl.createBuffer();
	this._shader = shader;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

	if (!vertices_is_buffer)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	else
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	this._vbuffer.numItems = vertices.length / 12;

	// console.log('create called');


	//
	// tmp

	if (gl.getExtension)
		this._ext = gl.getExtension("OES_vertex_array_object");

	// /tmp
	//
}

//

createGeometryExperimental.prototype.dispose = function() {

	gl.deleteBuffer(this._vbuffer);

	if (this._vao)
		this._ext.deleteVertexArrayOES( this._vao );

	// console.log('dispose called');
}

//

createGeometryExperimental.prototype.render = function() {

	var shader = this._shader;

	if (this._ext)
	{
		if (this._vao)
		{
			this._ext.bindVertexArrayOES( this._vao );

				gl.drawArrays( gl.TRIANGLES, 0, this._vbuffer.numItems );

			this._ext.bindVertexArrayOES( null );
		}
		else
		{
			this._vao = this._ext.createVertexArrayOES();

			this._ext.bindVertexArrayOES( this._vao );

				this.render_backup(true);

			this._ext.bindVertexArrayOES( null );
		}
	}
	else
	{
		this.render_backup();
	}
};

//

createGeometryExperimental.prototype.render_backup = function(no_clear) {

	var shader = this._shader;

	gl.enableVertexAttribArray(shader.aVertexPosition);
	gl.enableVertexAttribArray(shader.aVertexColor);
	gl.enableVertexAttribArray(shader.aVertexNormal);
	gl.enableVertexAttribArray(shader.aVertexBCenter);

		var bpp = 4; // gl.FLOAT -> 4 bytes
		var stride = 12 * bpp;
		var index_pos    = 0 * bpp;
		var index_color  = 3 * bpp;
		var index_normal  = 6 * bpp;
		var index_bcenter  = 9 * bpp;

		gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);
		gl.vertexAttribPointer(shader.aVertexPosition,3,gl.FLOAT,false,stride,index_pos);
		gl.vertexAttribPointer(shader.aVertexColor,3,gl.FLOAT,false,stride,index_color);
		gl.vertexAttribPointer(shader.aVertexNormal,3,gl.FLOAT,false,stride,index_normal);
		gl.vertexAttribPointer(shader.aVertexBCenter,3,gl.FLOAT,false,stride,index_bcenter);

		gl.drawArrays( gl.TRIANGLES, 0, this._vbuffer.numItems );

	if (!no_clear)
	{
		gl.disableVertexAttribArray(shader.aVertexPosition);
		gl.disableVertexAttribArray(shader.aVertexColor);
		gl.disableVertexAttribArray(shader.aVertexNormal);
		gl.disableVertexAttribArray(shader.aVertexBCenter);
	}
};

module.exports = createGeometryExperimental;

},{"../gl-context.js":16}],16:[function(require,module,exports){

var WebGLUtils = require('../lib/webgl/WebGLUtils');

var canvas = document.getElementById("main-canvas");

console.log('document=' + document);
console.log('canvas=' + canvas);

gl = WebGLUtils.setupWebGL(canvas);

gl.viewportWidth = canvas.clientWidth;
gl.viewportHeight = canvas.clientHeight;

module.exports = gl;

},{"../lib/webgl/WebGLUtils":20}],17:[function(require,module,exports){


var gl = require('./gl-context.js');

var glm = require('../lib/webgl/gl-matrix-2.1.0.js');
var myShaders = require('../lib/webgl/myShaders.js');
var textureHelper = require('../lib/webgl/texture.js');

var unused_fpsmeter = require('../lib/fpsmeter.js');

var createGeometryColor = require('./geometries/geometryColor.js');
var createCubeVertices = require('./geometries/createCubeVertices.js');
var createFrustumVertices = require('./geometries/createFrustumVertices.js');

var createFreeFlyCamera = require('./camera/freeFlyCamera.js')
var createFrustumCulling = require('./camera/frustumCulling.js')
var glhProject = require('./camera/glhProject.js')

var chunkGenerator = require('./generation/chunkGenerator.js')



var createShaders = myShaders.createShaders

//
//
// shader

var shader_opt = {
    vs_id: "shader-vs-color",
    fs_id: "shader-fs-color",
    arr_attrib: ['aVertexPosition','aVertexColor'],
    arr_uniform: ['uMVMatrix','uPMatrix']
}
g_shaderProgram_color = new createShaders( gl, shader_opt );

//

var shader_opt = {
    vs_id: "shader-vs-experimental",
    fs_id: "shader-fs-experimental",
    arr_attrib: ['aVertexPosition','aVertexColor','aVertexNormal','aVertexBCenter'],
    arr_uniform: ['uMVMatrix','uPMatrix','uCameraPos','uSampler']
}
g_shaderProgram_experimental = new createShaders( gl, shader_opt );

//

var shader_color = g_shaderProgram_color;
var shader_exp = g_shaderProgram_experimental;

// shader
//
//

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.enable(gl.DEPTH_TEST);





//
// create axis geometry

var vertices = [];

var axis_size = 20;

vertices.push(0,0,0,  1,0,0,  axis_size,0,0,  1,0,0)
vertices.push(0,0,0,  0,1,0,  0,axis_size,0,  0,1,0)
vertices.push(0,0,0,  0,0,1,  0,0,axis_size,  0,0,1)

var axis_geom = new createGeometryColor(vertices, gl.LINES);

// create axis geometry
//



//
// create coss geometry

var vertices = [];

var cross_size = 5;

vertices.push(0-cross_size,0,0,  1,1,1);
vertices.push(0+cross_size*5,0,0,  1,1,1);
vertices.push(0,0-cross_size,0,  1,1,1);
vertices.push(0,0+cross_size,0,  1,1,1);
vertices.push(0,0,0-cross_size,  1,1,1);
vertices.push(0,0,0+cross_size,  1,1,1);

var cross_geom = new createGeometryColor(vertices, gl.LINES);

// create coss geometry
//










var k_chunk_size = 15;


var vertices = createCubeVertices(k_chunk_size,[1,0,0], true);
var cubeR_geom = new createGeometryColor(vertices, gl.LINES);

var vertices = createCubeVertices(k_chunk_size,[1,1,1]);
var cubeW_geom = new createGeometryColor(vertices, gl.LINES);

var vertices = createCubeVertices(k_chunk_size,[0,1,0], true);
var cubeG_geom = new createGeometryColor(vertices, gl.LINES);


var aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

var vertices = createFrustumVertices(70, aspectRatio, 0.1, 40);
var frustum_geom = new createGeometryColor(vertices, gl.LINES);



var my_chunkGenerator = new chunkGenerator( k_chunk_size, shader_exp );









//
//
// CAMERA

var time_last = 0

//

g_FreeFlyCamera = new createFreeFlyCamera();
g_FreeFlyCamera.activate();

g_FreeFlyCamera.setPosition(
    k_chunk_size/4*3,
    k_chunk_size/4*3,
    0
);


g_FrustumCulling = new createFrustumCulling();
function chunk_is_visible(pos) {

    return g_FrustumCulling.cubeInFrustum(
        pos[0] + k_chunk_size/2,
        pos[1] + k_chunk_size/2,
        pos[2] + k_chunk_size/2,
        k_chunk_size/2
    );
}

// CAMERA
//
//



// position used to detect a move in the current chunk
var saved_index = [1,0,0]; // <- currently 1/0/0 but any other value than 0/0/0 will work



//
//
// GUI (touch supported indicator)

if ('ontouchstart' in window) {
    document.getElementById("touch_id").innerHTML += 'Supported';
} else {
    document.getElementById("touch_id").innerHTML += 'Not Supported';
}

// GUI (touch supported indicator)
//
//



//
//
// GUI (fullscreen button)

var gui_fullscreen = document.getElementById("gui_fullscreen");
gui_fullscreen.addEventListener('click', function () {

    var elem = document.getElementById("canvasesdiv");

    // go full-screen
    if (elem.requestFullscreen)
        elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen)
        elem.webkitRequestFullscreen();
    else if (elem.mozRequestFullScreen)
        elem.mozRequestFullScreen();
    else if (elem.msRequestFullscreen)
        elem.msRequestFullscreen();
});

function on_fullscreen_change() {

    var elem = document.getElementById("canvasesdiv");
    var canvas = document.getElementById("main-canvas");
    var s_canvas = document.getElementById("second-canvas");

    var tmp_width = null;
    var tmp_height = null;

    if (document.fullscreen ||
        document.mozFullScreen ||
        document.webkitIsFullScreen ||
        document.msFullscreenElement)
    {
        elem.style.position = "absolute";

        tmp_width = window.innerWidth;
        tmp_height = window.innerHeight;
    }
    else
    {
        elem.style.position = "relative";

        tmp_width = 800;
        tmp_height = 600;
    }

    elem.style.left = "0px";
    elem.style.top = "0px";

    canvas.width = s_canvas.width = tmp_width;
    canvas.height = s_canvas.height = tmp_height;

    gl.viewportWidth = gl.canvas.clientWidth;
    gl.viewportHeight = gl.canvas.clientHeight;

    //

    aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

    var vertices = createFrustumVertices(70, aspectRatio, 0.1, 40);
    frustum_geom = new createGeometryColor(vertices, gl.LINES);
}

document.addEventListener('fullscreenchange',       on_fullscreen_change, false);
document.addEventListener('mozfullscreenchange',    on_fullscreen_change, false);
document.addEventListener('webkitfullscreenchange', on_fullscreen_change, false);
document.addEventListener('msfullscreenchange',     on_fullscreen_change, false);

// GUI (fullscreen button)
//
//



// //
// //
// // GUI (reset button)

// var gui_reset = document.getElementById("gui_reset");
// gui_reset.addEventListener('click', function () {

//     //
//     // reset all the chunks in use and queued

//     my_chunkGenerator._chunks.length = 0;
//     my_chunkGenerator._chunk_queue.length = 0;
//     my_chunkGenerator = null;

//     //
//     // retrieve the values

//     var tmp_octave = document.getElementById("range_octaves").value;
//     var tmp_frequency = document.getElementById("range_frequency").value / 100;
//     var tmp_amplitude = 0.5;

//     var tmp_tetra = document.getElementById("check_tetra").checked || false;

//     //
//     // set the new values

//     my_chunkGenerator = new chunkGenerator(
//         k_chunk_size, shader_exp,
//         tmp_octave, tmp_frequency, tmp_amplitude,
//         tmp_tetra
//     );

//     //
//     // this part is like saying "the user have moved, generate your stuff now"

//     var curr_index_x = Math.floor(g_FreeFlyCamera._Position[0] / k_chunk_size);
//     saved_index = [curr_index_x +1,0,0]
// })

// // GUI (reset button)
// //
// //



//
// FPS METER

// var myFpsmeter_elem = document.getElementById('canvasesdiv');
// var myFpsmeter = new window.FPSMeter(
//     myFpsmeter_elem,
//     window.FPSMeter.theme.transparent
// );


//
// FPS METER

var myFpsmeter_elem = document.getElementById('fpsmeter1');
var myFpsmeter = new window.FPSMeter(
    myFpsmeter_elem,
    window.FPSMeter.theme.transparent
);

var myFpsmeter2_elem = document.getElementById('fpsmeter2');
var myFpsmeter2 = new window.FPSMeter(
    myFpsmeter2_elem,
    window.FPSMeter.theme.transparent
);

// FPS METER
//


// FPS METER
//



//
//
// HUD (touch positions recorder)

var elem = document.getElementById("canvasesdiv");

var arr_touches = [];

function update_touches(e) { try{

    var touches = e.targetTouches;

    arr_touches.length = 0; // clear array
    for (var i = 0; i < touches.length; ++i)
        arr_touches.push({ x:touches[i].pageX, y:touches[i].pageY });

}catch(e){alert(e);} }

elem.addEventListener('touchstart', update_touches);
elem.addEventListener('touchend', function(e) {arr_touches.length = 0;}); // clear array
elem.addEventListener('touchmove', update_touches);

// HUD (touch positions recorder)
//
//



//
//
// CANVAS HUD

var second_canvas = document.getElementById("second-canvas");
var ctx = second_canvas.getContext("2d");

// CANVAS HUD
//
//



//
//
// TEXTURE (load and startup)


var crateImage = new Image();
var crateTexture = gl.createTexture();
crateImage.onload = function () {

    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // flip vertically the texture

    var buf = textureHelper.imageToUint8Array(crateImage);
    buf = textureHelper.flipYImageArray(buf, crateImage.width, crateImage.height);

    gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, crateTexture);
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, crateImage);
            // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buf);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, crateImage.width, crateImage.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, buf);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        // // send the texture to the shader
        // gl.uniform1i(g_shaderProgram_experimental.uSampler, 0);

    // starting point
    tick();
}

// crateImage.src = "textures/texture.png";
crateImage.src = "data:image/png;base64,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";

// TEXTURE (load and startup)
//
//


// tick();

function tick(in_event) {

    // plan the next frame
    window.requestAnimFrame( tick ); // webgl-utils.js


        //
        // obtain the elapsed time

        var time_current = performance.now() || (new Date()).getTime();

        if (!time_last)
            time_last = time_current;

        var elapsed = time_current - time_last;

        time_last = time_current;

        // obtain the elapsed time
        //

    ///

        //
        // update the camera

        g_FreeFlyCamera.handleKeys();

        g_FreeFlyCamera.update( elapsed / 1000.0 );

        // update the camera
        //


    myFpsmeter.tickStart();


        //  check if move to ask chunks
        //      -> if yes
        //          exclude chunk out of range
        //          include chunk in range


    // compute the current chunk in use
    var curr_index = [
        Math.floor(g_FreeFlyCamera._Position[0] / k_chunk_size)|0,
        Math.floor(g_FreeFlyCamera._Position[1] / k_chunk_size)|0,
        Math.floor(g_FreeFlyCamera._Position[2] / k_chunk_size)|0
    ];

    // did we move to another chunk?
    if (curr_index[0] != saved_index[0] ||
        curr_index[1] != saved_index[1] ||
        curr_index[2] != saved_index[2])
    {
        // yes -> save as the new current chunk
        saved_index[0] = curr_index[0];
        saved_index[1] = curr_index[1];
        saved_index[2] = curr_index[2];

        // clear the generation queue
        my_chunkGenerator._chunk_queue.length = 0;

        // the range of chunk generation/exclusion
        var range = 3|0;

        var min_index = new Int32Array([
            (curr_index[0] - range)|0,
            (curr_index[1] - range)|0,
            (curr_index[2] - range)|0,
        ]);
        var max_index = new Int32Array([
            (curr_index[0] + range)|0,
            (curr_index[1] + range)|0,
            (curr_index[2] + range)|0,
        ]);

        //
        // exclude the chunks that are too far away

        for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
        {
            var curr_pos = [
                (my_chunkGenerator._chunks[i].pos[0]/k_chunk_size)|0,
                (my_chunkGenerator._chunks[i].pos[1]/k_chunk_size)|0,
                (my_chunkGenerator._chunks[i].pos[2]/k_chunk_size)|0
            ];

            if (curr_pos[0] < min_index[0] || curr_pos[0] > max_index[0] ||
                curr_pos[1] < min_index[1] || curr_pos[1] > max_index[1] ||
                curr_pos[2] < min_index[2] || curr_pos[2] > max_index[2])
            {
                my_chunkGenerator._chunks[i].geom.dispose();
                my_chunkGenerator._chunks.splice(i, 1);
                i--;
            }
        }

        //
        // include in the generation queue the close enough chunks

        for (var z = min_index[2]; z <= max_index[2]; ++z)
        for (var y = min_index[1]; y <= max_index[1]; ++y)
        for (var x = min_index[0]; x <= max_index[0]; ++x)
        {
            my_chunkGenerator._chunk_queue.push([
                x * k_chunk_size,
                y * k_chunk_size,
                z * k_chunk_size
            ]);
        }

    }






    //
    //
    ////// matrices

    // set the projection matrix

    var tmp_pMatrix = glm.mat4.create();
    glm.mat4.perspective(tmp_pMatrix, 70, aspectRatio, 0.1, 70);

    // set the modelview matrix

    var tmp_mvMatrix = glm.mat4.create();
    g_FreeFlyCamera.updateViewMatrix( tmp_mvMatrix );

    //

    g_FrustumCulling.calculateFrustum( tmp_pMatrix, tmp_mvMatrix );

    ////// /matrices
    //
    //





    //
    //
    ////// generation

    {
        var p = g_FreeFlyCamera._Position;
        var f = g_FreeFlyCamera._Forward;

        // here we do not use the true position of the camera but just a bit forward instead
        var camera_pos = [
            p[0],
            p[1],
            p[2]
        ];

        // this callback simply prioritise visible and unprocessed chunks
        function priority_callback (try_pos, best_pos) {

            if (chunk_is_visible(try_pos))
                return true;

            return false;
        }

        my_chunkGenerator.update(camera_pos, priority_callback);
    }

    ////// /generation
    //
    //


    myFpsmeter.tick();


    myFpsmeter2.tickStart();


    //
    //
    ////// render 3d scene

    gl.viewport(0, 0, gl.viewportWidth*0.75, gl.viewportHeight);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    /// render chunks

        var p = g_FreeFlyCamera._Position;

        // this part is already setting up a shader
        my_chunkGenerator.render(tmp_mvMatrix, tmp_pMatrix, p, chunk_is_visible);

    /// render cubes

    gl.useProgram(shader_color);

        gl.uniformMatrix4fv(shader_color.uPMatrix, false, tmp_pMatrix);
        gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix);

        axis_geom.render(shader_color);

        var tmp_mvMatrix2 = glm.mat4.create();

        for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
        {
            var pos = my_chunkGenerator._chunks[i].pos;

            glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, pos);

            gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);

            ///

            var visible = chunk_is_visible(pos);

            if (visible)
                cubeW_geom.render(shader_color);
            else
                cubeR_geom.render(shader_color);
        }

        if (my_chunkGenerator.is_processing_chunk)
        {
            var pos = my_chunkGenerator.processing_pos;

            glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, pos);

            gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);
            cubeG_geom.render(shader_color);
        }

    gl.useProgram(null);

    ////// /render 3d scene
    //
    //








    //
    //
    //
    // HUD

    gl.useProgram(shader_color);

    // rendered 3 times with a different viewport and point of view

    var w = gl.viewportWidth*0.25;
    var w2 = gl.viewportWidth*0.75;
    var h = gl.viewportHeight*0.33;

    render_hud( [w2,h*0,w,h], [1.0, 1.2, 1.0], [0,0,1] );
    render_hud( [w2,h*1,w,h], [0.0, 1.0, 0.0], [0,0,1] );
    render_hud( [w2,h*2,w,h], [0.0, 0.0, 1.0], [0,1,0] );

    //

    function render_hud(arr_viewport, arr_target, arr_up) {

        gl.viewport(arr_viewport[0], arr_viewport[1], arr_viewport[2], arr_viewport[3]);

        gl.clear(gl.DEPTH_BUFFER_BIT);

            var tmp_pMatrix = glm.mat4.create();
            var aspectRatio2 = arr_viewport[2]/arr_viewport[3];
            var ortho_size = 65;
            glm.mat4.ortho(tmp_pMatrix,
                -ortho_size*aspectRatio2,ortho_size*aspectRatio2,
                -ortho_size,ortho_size,
                -200,200);

            var cpos = g_FreeFlyCamera._Position;

            var tmp_mvMatrix = glm.mat4.create();
            glm.mat4.lookAt(
                tmp_mvMatrix,
                [   cpos[0]+arr_target[0],
                    cpos[1]+arr_target[1],
                    cpos[2]+arr_target[2] ],
                cpos,
                arr_up
            );


            gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix);
            gl.uniformMatrix4fv(shader_color.uPMatrix, false, tmp_pMatrix);

        axis_geom.render(shader_color)

            var tmp_mvMatrix2 = glm.mat4.create();

            for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
            {
                var pos = my_chunkGenerator._chunks[i].pos;

                ///

                var visible = chunk_is_visible(pos);

                ///

                glm.mat4.identity(tmp_mvMatrix2);

                if (visible)
                {
                    // render white cube

                    glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, pos);

                    gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);
                    cubeW_geom.render(shader_color);
                }
                else
                {
                    // render red cube (smaller -> scalled)

                    glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, [
                        pos[0] + k_chunk_size*0.15,
                        pos[1] + k_chunk_size*0.15,
                        pos[2] + k_chunk_size*0.15
                    ]);
                    glm.mat4.scale(tmp_mvMatrix2,tmp_mvMatrix2, [0.7,0.7,0.7]);

                    gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);
                    cubeR_geom.render(shader_color);
                }
            }

            if (my_chunkGenerator.is_processing_chunk)
            {
                var pos = my_chunkGenerator.processing_pos

                glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, [
                    pos[0] + k_chunk_size*0.2,
                    pos[1] + k_chunk_size*0.2,
                    pos[2] + k_chunk_size*0.2
                ]);
                glm.mat4.scale(tmp_mvMatrix2,tmp_mvMatrix2, [0.6,0.6,0.6]);

                gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix2);
                cubeG_geom.render(shader_color);
            }



                glm.mat4.translate(tmp_mvMatrix,tmp_mvMatrix, g_FreeFlyCamera._Position);
                glm.mat4.rotate(tmp_mvMatrix,tmp_mvMatrix, g_FreeFlyCamera._theta*3.14/180, [0,0,1]);
                glm.mat4.rotate(tmp_mvMatrix,tmp_mvMatrix, g_FreeFlyCamera._phi*3.14/180, [0,-1,0]);

                gl.uniformMatrix4fv(shader_color.uMVMatrix, false, tmp_mvMatrix);

            cross_geom.render(shader_color);
            frustum_geom.render(shader_color);

    }

    gl.useProgram(null);

    // HUD
    //
    //
    //



    //
    //
    //
    // CANVAS STUFF (in fact, this still the HUD...)

    ctx.clearRect(0, 0, second_canvas.width, second_canvas.height);

    //
    // make a rectangle around the viewport
    // -> was a debug for the fullscreen, but I still like it <3
    //

    ctx.beginPath();
    ctx.lineWidth="5";
    ctx.strokeStyle="green"; // Green path
    ctx.moveTo(0,0);
    ctx.lineTo(0,second_canvas.height);
    ctx.lineTo(second_canvas.width,second_canvas.height);
    ctx.lineTo(second_canvas.width,0);
    ctx.lineTo(0,0);
    ctx.stroke(); // Draw it

    //
    // render text
    //

    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";

    ctx.lineWidth="10";
    ctx.strokeStyle="green";

    for (var i = 0; i < my_chunkGenerator._chunks.length; ++i)
    {
        var pos = my_chunkGenerator._chunks[i].pos;

        // 

        if (!g_FrustumCulling.pointInFrustum(pos[0],pos[1],pos[2]))
            continue;

        // 

        var viewport = [0, 0, gl.viewportWidth*0.75, gl.viewportHeight];

        var tmp_2d_position = glhProject(
            pos[0],pos[1],pos[2],
            tmp_mvMatrix,
            tmp_pMatrix,
            viewport
        );

        // flip the 'y' value
        tmp_2d_position[1] = viewport[3] - tmp_2d_position[1];

        // 

        {
            var x = tmp_2d_position[0];
            var y = tmp_2d_position[1];
    
            ctx.beginPath();

            ctx.moveTo(x,y-15);
            ctx.lineTo(x,y+15);
            ctx.stroke();

            ctx.moveTo(x-15,y);
            ctx.lineTo(x+15,y);
            ctx.stroke();


            var str = '';
            str += pos[0]/k_chunk_size + '/'
            str += pos[1]/k_chunk_size + '/'
            str += pos[2]/k_chunk_size

            ctx.fillText(str,x,y);
        }
    }

    //
    // render touches
    //

    ctx.beginPath();
    ctx.lineWidth="5";
    ctx.strokeStyle="red";

    for (var i = 0; i < arr_touches.length; ++i)
    {
        var x = arr_touches[i].x;
        var y = arr_touches[i].y;

        ctx.moveTo(x,y-150);
        ctx.lineTo(x,y+150);
        ctx.stroke();

        ctx.moveTo(x-150,y);
        ctx.lineTo(x+150,y);
        ctx.stroke();

        if (g_FreeFlyCamera._force_forward)
        {
            ctx.moveTo(x-100,y-100);
            ctx.lineTo(x+100,y+100);
            ctx.stroke();

            ctx.moveTo(x-100,y+100);
            ctx.lineTo(x+100,y-100);
            ctx.stroke();
        }
    }

    ctx.stroke(); // Draw it

    // CANVAS STUFF (in fact, this still the HUD...)
    //
    //
    //

    myFpsmeter2.tick();

} // function tick(in_event)

},{"../lib/fpsmeter.js":19,"../lib/webgl/gl-matrix-2.1.0.js":21,"../lib/webgl/myShaders.js":22,"../lib/webgl/texture.js":23,"./camera/freeFlyCamera.js":3,"./camera/frustumCulling.js":4,"./camera/glhProject.js":5,"./generation/chunkGenerator.js":8,"./geometries/createCubeVertices.js":12,"./geometries/createFrustumVertices.js":13,"./geometries/geometryColor.js":14,"./gl-context.js":16}],18:[function(require,module,exports){

var MarchinCube = require("./app/generation/helpers/marchingCube.js");
var ClassicalNoise = require("./app/generation/helpers/pnoise.js");
var Randomiser = require("./app/generation/helpers/randomiser.js");


module.exports = function (self) {

	var chunk_size = 15;
	var tetra = false;

	var myRand = new Randomiser();

	var myNoise2 = new ClassicalNoise(myRand);

	var _marchingCube = new MarchinCube(chunk_size, 0.0, function(x, y, z) {

		return myNoise2.noise_ex(x, y, z);
	}, tetra);


	self.addEventListener('message',function (e) {

		var pos = e.data.pos;
		var buf = e.data.buf;

		var buf_inc = 0;

		//
		// generate

		var tmp_index = 0;
		var arr_indexes = [ [1,0,0], [0,1,0], [0,0,1] ];

		function marchCube_cb(vertex, color, normal) {

			buf[buf_inc++] = vertex[0];
			buf[buf_inc++] = vertex[1];
			buf[buf_inc++] = vertex[2];
			buf[buf_inc++] = color[0];
			buf[buf_inc++] = color[1];
			buf[buf_inc++] = color[2];
			buf[buf_inc++] = normal[0];
			buf[buf_inc++] = normal[1];
			buf[buf_inc++] = normal[2];


		    var index = arr_indexes[tmp_index];
		    tmp_index = (tmp_index + 1) % 3;

		    // chunk_vertices.push( index[0], index[1], index[2] );

			buf[buf_inc++] = index[0];
			buf[buf_inc++] = index[1];
			buf[buf_inc++] = index[2];			    
		}

		_marchingCube.marchCube( pos, marchCube_cb )

		//

		self.postMessage({
			pos:pos,
			// vertices:chunk_vertices
			vertices:buf
		}
		, [
			buf.buffer
		]
		);
	});

	self.postMessage({ready:true});
}

},{"./app/generation/helpers/marchingCube.js":9,"./app/generation/helpers/pnoise.js":10,"./app/generation/helpers/randomiser.js":11}],19:[function(require,module,exports){
/*!
 * FPSMeter 0.3.1 - 9th May 2013
 * https://github.com/Darsain/fpsmeter
 *
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 */
;(function (w, undefined) {
	'use strict';

	/**
	 * Create a new element.
	 *
	 * @param  {String} name Element type name.
	 *
	 * @return {Element}
	 */
	function newEl(name) {
		return document.createElement(name);
	}

	/**
	 * Apply theme CSS properties to element.
	 *
	 * @param  {Element} element DOM element.
	 * @param  {Object}  theme   Theme object.
	 *
	 * @return {Element}
	 */
	function applyTheme(element, theme) {
		for (var name in theme) {
			try {
				element.style[name] = theme[name];
			} catch (e) {}
		}
		return element;
	}

	/**
	 * Return type of the value.
	 *
	 * @param  {Mixed} value
	 *
	 * @return {String}
	 */
	function type(value) {
		if (value == null) {
			return String(value);
		}

		if (typeof value === 'object' || typeof value === 'function') {
			return Object.prototype.toString.call(value).match(/\s([a-z]+)/i)[1].toLowerCase() || 'object';
		}

		return typeof value;
	}

	/**
	 * Check whether the value is in an array.
	 *
	 * @param  {Mixed} value
	 * @param  {Array} array
	 *
	 * @return {Integer} Array index or -1 when not found.
	 */
	function inArray(value, array) {
		if (type(array) !== 'array') {
			return -1;
		}
		if (array.indexOf) {
			return array.indexOf(value);
		}
		for (var i = 0, l = array.length; i < l; i++) {
			if (array[i] === value) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Poor man's deep object extend.
	 *
	 * Example:
	 *   extend({}, defaults, options);
	 *
	 * @return {Void}
	 */
	function extend() {
		var args = arguments;
		for (var key in args[1]) {
			if (args[1].hasOwnProperty(key)) {
				switch (type(args[1][key])) {
					case 'object':
						args[0][key] = extend({}, args[0][key], args[1][key]);
						break;

					case 'array':
						args[0][key] = args[1][key].slice(0);
						break;

					default:
						args[0][key] = args[1][key];
				}
			}
		}
		return args.length > 2 ?
			extend.apply(null, [args[0]].concat(Array.prototype.slice.call(args, 2))) :
			args[0];
	}

	/**
	 * Convert HSL color to HEX string.
	 *
	 * @param  {Array} hsl Array with [hue, saturation, lightness].
	 *
	 * @return {Array} Array with [red, green, blue].
	 */
	function hslToHex(h, s, l) {
		var r, g, b;
		var v, min, sv, sextant, fract, vsf;

		if (l <= 0.5) {
			v = l * (1 + s);
		} else {
			v = l + s - l * s;
		}

		if (v === 0) {
			return '#000';
		} else {
			min = 2 * l - v;
			sv = (v - min) / v;
			h = 6 * h;
			sextant = Math.floor(h);
			fract = h - sextant;
			vsf = v * sv * fract;
			if (sextant === 0 || sextant === 6) {
				r = v;
				g = min + vsf;
				b = min;
			} else if (sextant === 1) {
				r = v - vsf;
				g = v;
				b = min;
			} else if (sextant === 2) {
				r = min;
				g = v;
				b = min + vsf;
			} else if (sextant === 3) {
				r = min;
				g = v - vsf;
				b = v;
			} else if (sextant === 4) {
				r = min + vsf;
				g = min;
				b = v;
			} else {
				r = v;
				g = min;
				b = v - vsf;
			}
			return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
		}
	}

	/**
	 * Helper function for hslToHex.
	 */
	function componentToHex(c) {
		c = Math.round(c * 255).toString(16);
		return c.length === 1 ? '0' + c : c;
	}

	/**
	 * Manage element event listeners.
	 *
	 * @param  {Node}     element
	 * @param  {Event}    eventName
	 * @param  {Function} handler
	 * @param  {Bool}     remove
	 *
	 * @return {Void}
	 */
	function listener(element, eventName, handler, remove) {
		if (element.addEventListener) {
			element[remove ? 'removeEventListener' : 'addEventListener'](eventName, handler, false);
		} else if (element.attachEvent) {
			element[remove ? 'detachEvent' : 'attachEvent']('on' + eventName, handler);
		}
	}

	// Preferred timing funtion
	var getTime;
	(function () {
		var perf = w.performance;
		if (perf && (perf.now || perf.webkitNow)) {
			var perfNow = perf.now ? 'now' : 'webkitNow';
			getTime = perf[perfNow].bind(perf);
		} else {
			getTime = function () {
				return +new Date();
			};
		}
	}());

	// Local WindowAnimationTiming interface polyfill
	var cAF = w.cancelAnimationFrame || w.cancelRequestAnimationFrame;
	var rAF = w.requestAnimationFrame;
	(function () {
		var vendors = ['moz', 'webkit', 'o'];
		var lastTime = 0;

		// For a more accurate WindowAnimationTiming interface implementation, ditch the native
		// requestAnimationFrame when cancelAnimationFrame is not present (older versions of Firefox)
		for (var i = 0, l = vendors.length; i < l && !cAF; ++i) {
			cAF = w[vendors[i]+'CancelAnimationFrame'] || w[vendors[i]+'CancelRequestAnimationFrame'];
			rAF = cAF && w[vendors[i]+'RequestAnimationFrame'];
		}

		if (!cAF) {
			rAF = function (callback) {
				var currTime = getTime();
				var timeToCall = Math.max(0, 16 - (currTime - lastTime));
				lastTime = currTime + timeToCall;
				return w.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
			};

			cAF = function (id) {
				clearTimeout(id);
			};
		}
	}());

	// Property name for assigning element text content
	var textProp = type(document.createElement('div').textContent) === 'string' ? 'textContent' : 'innerText';

	/**
	 * FPSMeter class.
	 *
	 * @param {Element} anchor  Element to append the meter to. Default is document.body.
	 * @param {Object}  options Object with options.
	 */
	function FPSMeter(anchor, options) {
		// Optional arguments
		if (type(anchor) === 'object' && anchor.nodeType === undefined) {
			options = anchor;
			anchor = document.body;
		}
		if (!anchor) {
			anchor = document.body;
		}

		// Private properties
		var self = this;
		var o = extend({}, FPSMeter.defaults, options || {});

		var el = {};
		var cols = [];
		var theme, heatmaps;
		var heatDepth = 100;
		var heating = [];

		var thisFrameTime = 0;
		var frameTime = o.threshold;
		var frameStart = 0;
		var lastLoop = getTime() - frameTime;
		var time;

		var fpsHistory = [];
		var durationHistory = [];

		var frameID, renderID;
		var showFps = o.show === 'fps';
		var graphHeight, count, i, j;

		// Exposed properties
		self.options = o;
		self.fps = 0;
		self.duration = 0;
		self.isPaused = 0;

		/**
		 * Tick start for measuring the actual rendering duration.
		 *
		 * @return {Void}
		 */
		self.tickStart = function () {
			frameStart = getTime();
		};

		/**
		 * FPS tick.
		 *
		 * @return {Void}
		 */
		self.tick = function () {
			time = getTime();
			thisFrameTime = time - lastLoop;
			frameTime += (thisFrameTime - frameTime) / o.smoothing;
			self.fps = 1000 / frameTime;
			self.duration = frameStart < lastLoop ? frameTime : time - frameStart;
			lastLoop = time;
		};

		/**
		 * Pause display rendering.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.pause = function () {
			if (frameID) {
				self.isPaused = 1;
				clearTimeout(frameID);
				cAF(frameID);
				cAF(renderID);
				frameID = renderID = 0;
			}
			return self;
		};

		/**
		 * Resume display rendering.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.resume = function () {
			if (!frameID) {
				self.isPaused = 0;
				requestRender();
			}
			return self;
		};

		/**
		 * Update options.
		 *
		 * @param {String} name  Option name.
		 * @param {Mixed}  value New value.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.set = function (name, value) {
			o[name] = value;
			showFps = o.show === 'fps';

			// Rebuild or reposition elements when specific option has been updated
			if (inArray(name, rebuilders) !== -1) {
				createMeter();
			}
			if (inArray(name, repositioners) !== -1) {
				positionMeter();
			}
			return self;
		};

		/**
		 * Change meter into rendering duration mode.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.showDuration = function () {
			self.set('show', 'ms');
			return self;
		};

		/**
		 * Change meter into FPS mode.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.showFps = function () {
			self.set('show', 'fps');
			return self;
		};

		/**
		 * Toggles between show: 'fps' and show: 'duration'.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.toggle = function () {
			self.set('show', showFps ? 'ms' : 'fps');
			return self;
		};

		/**
		 * Hide the FPSMeter. Also pauses the rendering.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.hide = function () {
			self.pause();
			el.container.style.display = 'none';
			return self;
		};

		/**
		 * Show the FPSMeter. Also resumes the rendering.
		 *
		 * @return {Object} FPSMeter instance.
		 */
		self.show = function () {
			self.resume();
			el.container.style.display = 'block';
			return self;
		};

		/**
		 * Check the current FPS and save it in history.
		 *
		 * @return {Void}
		 */
		function historyTick() {
			for (i = o.history; i--;) {
				fpsHistory[i] = i === 0 ? self.fps : fpsHistory[i-1];
				durationHistory[i] = i === 0 ? self.duration : durationHistory[i-1];
			}
		}

		/**
		 * Returns heat hex color based on values passed.
		 *
		 * @param  {Integer} heatmap
		 * @param  {Integer} value
		 * @param  {Integer} min
		 * @param  {Integer} max
		 *
		 * @return {Integer}
		 */
		function getHeat(heatmap, value, min, max) {
			return heatmaps[0|heatmap][Math.round(Math.min((value - min) / (max - min) * heatDepth, heatDepth))];
		}

		/**
		 * Update counter number and legend.
		 *
		 * @return {Void}
		 */
		function updateCounter() {
			// Update legend only when changed
			if (el.legend.fps !== showFps) {
				el.legend.fps = showFps;
				el.legend[textProp] = showFps ? 'FPS' : 'ms';
			}
			// Update counter with a nicely formated & readable number
			count = showFps ? self.fps : self.duration;
			el.count[textProp] = count > 999 ? '999+' : count.toFixed(count > 99 ? 0 : o.decimals);
		}

		/**
		 * Render current FPS state.
		 *
		 * @return {Void}
		 */
		function render() {
			time = getTime();
			// If renderer stopped reporting, do a simulated drop to 0 fps
			if (lastLoop < time - o.threshold) {
				self.fps -= self.fps / Math.max(1, o.smoothing * 60 / o.interval);
				self.duration = 1000 / self.fps;
			}

			historyTick();
			updateCounter();

			// Apply heat to elements
			if (o.heat) {
				if (heating.length) {
					for (i = heating.length; i--;) {
						heating[i].el.style[theme[heating[i].name].heatOn] = showFps ?
							getHeat(theme[heating[i].name].heatmap, self.fps, 0, o.maxFps) :
							getHeat(theme[heating[i].name].heatmap, self.duration, o.threshold, 0);
					}
				}

				if (el.graph && theme.column.heatOn) {
					for (i = cols.length; i--;) {
						cols[i].style[theme.column.heatOn] = showFps ?
							getHeat(theme.column.heatmap, fpsHistory[i], 0, o.maxFps) :
							getHeat(theme.column.heatmap, durationHistory[i], o.threshold, 0);
					}
				}
			}

			// Update graph columns height
			if (el.graph) {
				for (j = 0; j < o.history; j++) {
					cols[j].style.height = (showFps ?
						(fpsHistory[j] ? Math.round(graphHeight / o.maxFps * Math.min(fpsHistory[j], o.maxFps)) : 0) :
						(durationHistory[j] ? Math.round(graphHeight / o.threshold * Math.min(durationHistory[j], o.threshold)) : 0)
					) + 'px';
				}
			}
		}

		/**
		 * Request rendering loop.
		 *
		 * @return {Int} Animation frame index.
		 */
		function requestRender() {
			if (o.interval < 20) {
				frameID = rAF(requestRender);
				render();
			} else {
				frameID = setTimeout(requestRender, o.interval);
				renderID = rAF(render);
			}
		}

		/**
		 * Meter events handler.
		 *
		 * @return {Void}
		 */
		function eventHandler(event) {
			event = event || window.event;
			if (event.preventDefault) {
				event.preventDefault();
				event.stopPropagation();
			} else {
				event.returnValue = false;
				event.cancelBubble = true;
			}
			self.toggle();
		}

		/**
		 * Destroys the current FPSMeter instance.
		 *
		 * @return {Void}
		 */
		self.destroy = function () {
			// Stop rendering
			self.pause();
			// Remove elements
			removeMeter();
			// Stop listening
			self.tick = self.tickStart = function () {};
		};

		/**
		 * Remove meter element.
		 *
		 * @return {Void}
		 */
		function removeMeter() {
			// Unbind listeners
			if (o.toggleOn) {
				listener(el.container, o.toggleOn, eventHandler, 1);
			}
			// Detach element
			anchor.removeChild(el.container);
		}

		/**
		 * Sets the theme, and generates heatmaps when needed.
		 */
		function setTheme() {
			theme = FPSMeter.theme[o.theme];

			// Generate heatmaps
			heatmaps = theme.compiledHeatmaps || [];
			if (!heatmaps.length && theme.heatmaps.length) {
				for (j = 0; j < theme.heatmaps.length; j++) {
					heatmaps[j] = [];
					for (i = 0; i <= heatDepth; i++) {
						heatmaps[j][i] = hslToHex(0.33 / heatDepth * i, theme.heatmaps[j].saturation, theme.heatmaps[j].lightness);
					}
				}
				theme.compiledHeatmaps = heatmaps;
			}
		}

		/**
		 * Creates and attaches the meter element.
		 *
		 * @return {Void}
		 */
		function createMeter() {
			// Remove old meter if present
			if (el.container) {
				removeMeter();
			}

			// Set theme
			setTheme();

			// Create elements
			el.container = applyTheme(newEl('div'), theme.container);
			el.count = el.container.appendChild(applyTheme(newEl('div'), theme.count));
			el.legend = el.container.appendChild(applyTheme(newEl('div'), theme.legend));
			el.graph = o.graph ? el.container.appendChild(applyTheme(newEl('div'), theme.graph)) : 0;

			// Add elements to heating array
			heating.length = 0;
			for (var key in el) {
				if (el[key] && theme[key].heatOn) {
					heating.push({
						name: key,
						el: el[key]
					});
				}
			}

			// Graph
			cols.length = 0;
			if (el.graph) {
				// Create graph
				el.graph.style.width = (o.history * theme.column.width + (o.history - 1) * theme.column.spacing) + 'px';

				// Add columns
				for (i = 0; i < o.history; i++) {
					cols[i] = el.graph.appendChild(applyTheme(newEl('div'), theme.column));
					cols[i].style.position = 'absolute';
					cols[i].style.bottom = 0;
					cols[i].style.right = (i * theme.column.width + i * theme.column.spacing) + 'px';
					cols[i].style.width = theme.column.width + 'px';
					cols[i].style.height = '0px';
				}
			}

			// Set the initial state
			positionMeter();
			updateCounter();

			// Append container to anchor
			anchor.appendChild(el.container);

			// Retrieve graph height after it was appended to DOM
			if (el.graph) {
				graphHeight = el.graph.clientHeight;
			}

			// Add event listeners
			if (o.toggleOn) {
				if (o.toggleOn === 'click') {
					el.container.style.cursor = 'pointer';
				}
				listener(el.container, o.toggleOn, eventHandler);
			}
		}

		/**
		 * Positions the meter based on options.
		 *
		 * @return {Void}
		 */
		function positionMeter() {
			applyTheme(el.container, o);
		}

		/**
		 * Construct.
		 */
		(function () {
			// Create meter element
			createMeter();
			// Start rendering
			requestRender();
		}());
	}

	// Expose the extend function
	FPSMeter.extend = extend;

	// Expose the FPSMeter class
	window.FPSMeter = FPSMeter;

	// Default options
	FPSMeter.defaults = {
		interval:  100,     // Update interval in milliseconds.
		smoothing: 10,      // Spike smoothing strength. 1 means no smoothing.
		show:      'fps',   // Whether to show 'fps', or 'ms' = frame duration in milliseconds.
		toggleOn:  'click', // Toggle between show 'fps' and 'ms' on this event.
		decimals:  1,       // Number of decimals in FPS number. 1 = 59.9, 2 = 59.94, ...
		maxFps:    60,      // Max expected FPS value.
		threshold: 100,     // Minimal tick reporting interval in milliseconds.

		// Meter position
		position: 'absolute', // Meter position.
		zIndex:   10,         // Meter Z index.
		left:     '5px',      // Meter left offset.
		top:      '5px',      // Meter top offset.
		right:    'auto',     // Meter right offset.
		bottom:   'auto',     // Meter bottom offset.
		margin:   '0 0 0 0',  // Meter margin. Helps with centering the counter when left: 50%;

		// Theme
		theme: 'dark', // Meter theme. Build in: 'dark', 'light', 'transparent', 'colorful'.
		heat:  0,      // Allow themes to use coloring by FPS heat. 0 FPS = red, maxFps = green.

		// Graph
		graph:   0, // Whether to show history graph.
		history: 20 // How many history states to show in a graph.
	};

	// Option names that trigger FPSMeter rebuild or reposition when modified
	var rebuilders = [
		'toggleOn',
		'theme',
		'heat',
		'graph',
		'history'
	];
	var repositioners = [
		'position',
		'zIndex',
		'left',
		'top',
		'right',
		'bottom',
		'margin'
	];
}(window));
;(function (w, FPSMeter, undefined) {
	'use strict';

	// Themes object
	FPSMeter.theme = {};

	// Base theme with layout, no colors
	var base = FPSMeter.theme.base = {
		heatmaps: [],
		container: {
			// Settings
			heatOn: null,
			heatmap: null,

			// Styles
			padding: '5px',
			minWidth: '95px',
			height: '30px',
			lineHeight: '30px',
			textAlign: 'right',
			textShadow: 'none'
		},
		count: {
			// Settings
			heatOn: null,
			heatmap: null,

			// Styles
			position: 'absolute',
			top: 0,
			right: 0,
			padding: '5px 10px',
			height: '30px',
			fontSize: '24px',
			fontFamily: 'Consolas, Andale Mono, monospace',
			zIndex: 2
		},
		legend: {
			// Settings
			heatOn: null,
			heatmap: null,

			// Styles
			position: 'absolute',
			top: 0,
			left: 0,
			padding: '5px 10px',
			height: '30px',
			fontSize: '12px',
			lineHeight: '32px',
			fontFamily: 'sans-serif',
			textAlign: 'left',
			zIndex: 2
		},
		graph: {
			// Settings
			heatOn: null,
			heatmap: null,

			// Styles
			position: 'relative',
			boxSizing: 'padding-box',
			MozBoxSizing: 'padding-box',
			height: '100%',
			zIndex: 1
		},
		column: {
			// Settings
			width: 4,
			spacing: 1,
			heatOn: null,
			heatmap: null
		}
	};

	// Dark theme
	FPSMeter.theme.dark = FPSMeter.extend({}, base, {
		heatmaps: [{
			saturation: 0.8,
			lightness: 0.8
		}],
		container: {
			background: '#222',
			color: '#fff',
			border: '1px solid #1a1a1a',
			textShadow: '1px 1px 0 #222'
		},
		count: {
			heatOn: 'color'
		},
		column: {
			background: '#3f3f3f'
		}
	});

	// Light theme
	FPSMeter.theme.light = FPSMeter.extend({}, base, {
		heatmaps: [{
			saturation: 0.5,
			lightness: 0.5
		}],
		container: {
			color: '#666',
			background: '#fff',
			textShadow: '1px 1px 0 rgba(255,255,255,.5), -1px -1px 0 rgba(255,255,255,.5)',
			boxShadow: '0 0 0 1px rgba(0,0,0,.1)'
		},
		count: {
			heatOn: 'color'
		},
		column: {
			background: '#eaeaea'
		}
	});

	// Colorful theme
	FPSMeter.theme.colorful = FPSMeter.extend({}, base, {
		heatmaps: [{
			saturation: 0.5,
			lightness: 0.6
		}],
		container: {
			heatOn: 'backgroundColor',
			background: '#888',
			color: '#fff',
			textShadow: '1px 1px 0 rgba(0,0,0,.2)',
			boxShadow: '0 0 0 1px rgba(0,0,0,.1)'
		},
		column: {
			background: '#777',
			backgroundColor: 'rgba(0,0,0,.2)'
		}
	});

	// Transparent theme
	FPSMeter.theme.transparent = FPSMeter.extend({}, base, {
		heatmaps: [{
			saturation: 0.8,
			lightness: 0.5
		}],
		container: {
			padding: 0,
			color: '#fff',
			textShadow: '1px 1px 0 rgba(0,0,0,.5)'
		},
		count: {
			padding: '0 5px',
			height: '40px',
			lineHeight: '40px'
		},
		legend: {
			padding: '0 5px',
			height: '40px',
			lineHeight: '42px'
		},
		graph: {
			height: '40px'
		},
		column: {
			width: 5,
			background: '#999',
			heatOn: 'backgroundColor',
			opacity: 0.5
		}
	});
}(window, FPSMeter));
},{}],20:[function(require,module,exports){


/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {

	return	window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
				window.setTimeout(callback, 1000/60);
			};

})();


/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @param {function:(msg)} opt_onError An function to call
 *     if there is an error during creation.
 * @return {WebGLRenderingContext} The created context.
 */
var setupWebGL = function(canvas, opt_attribs, opt_onError) {

	if (canvas.addEventListener) {
		canvas.addEventListener("webglcontextcreationerror", function(e) {
			alert(e);
		}, false);
	}

	var context = create3DContext(canvas, opt_attribs);
	if (!context) {
		if (!window.WebGLRenderingContext) {
			alert("!window.WebGLRenderingContext");
		}
	}

	return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
var create3DContext = function(canvas, opt_attribs) {
	var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
	var context = null;
	for (var ii = 0; ii < names.length; ++ii) {

		try {
			context = canvas.getContext(names[ii], opt_attribs);
		} catch(e) {}

		if (context)
			break;
	}
	return context;
}


module.exports = {
	create3DContext: create3DContext,
	setupWebGL: setupWebGL
};

},{}],21:[function(require,module,exports){
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.1.0
 */

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


(function() {
  "use strict";

  var shim = {};
  if (typeof(exports) === 'undefined') {
    if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
      shim.exports = {};
      define(function() {
        return shim.exports;
      });
    } else {
      // gl-matrix lives in a browser, define its namespaces in global
      shim.exports = window;
    }    
  }
  else {
    // gl-matrix lives in commonjs, define its namespaces in exports
    shim.exports = exports;
  }

  (function(exports) {
    /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


if(!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
}

if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

/**
 * Sets the type of array used when creating new vectors and matricies
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    GLMAT_ARRAY_TYPE = type;
}

if(typeof(exports) !== 'undefined') {
    exports.glMatrix = glMatrix;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */

var vec2 = {};

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec2 = vec2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */

var vec3 = {};

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
vec3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
vec3.fromValues = function(x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
 * Subtracts two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
vec3.sub = vec3.subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
vec3.mul = vec3.multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
 * Alias for {@link vec3.divide}
 * @function
 */
vec3.div = vec3.divide;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.distance}
 * @function
 */
vec3.dist = vec3.distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
vec3.sqrDist = vec3.squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.length}
 * @function
 */
vec3.len = vec3.length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
vec3.sqrLen = vec3.squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
};

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
vec3.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec3 = vec3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */

var vec4 = {};

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
vec4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
vec4.fromValues = function(x, y, z, w) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
vec4.sub = vec4.subtract;

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
vec4.mul = vec4.multiply;

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
 * Alias for {@link vec4.divide}
 * @function
 */
vec4.div = vec4.divide;

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.distance}
 * @function
 */
vec4.dist = vec4.distance;

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
vec4.sqrDist = vec4.squaredDistance;

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.length}
 * @function
 */
vec4.len = vec4.length;

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
vec4.sqrLen = vec4.squaredLength;

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        out[3] = a[3] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec4 = vec4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x2 Matrix
 * @name mat2
 */

var mat2 = {};

var mat2Identity = new Float32Array([
    1, 0,
    0, 1
]);

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
mat2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
mat2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] =  a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] =  a0 * det;

    return out;
};

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] =  a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] =  a0;

    return out;
};

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a1 * b2;
    out[1] = a0 * b1 + a1 * b3;
    out[2] = a2 * b0 + a3 * b2;
    out[3] = a2 * b1 + a3 * b3;
    return out;
};

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
mat2.mul = mat2.multiply;

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a1 * s;
    out[1] = a0 * -s + a1 * c;
    out[2] = a2 *  c + a3 * s;
    out[3] = a2 * -s + a3 * c;
    return out;
};

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v1;
    out[2] = a2 * v0;
    out[3] = a3 * v1;
    return out;
};

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat2 = mat2;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x3 Matrix
 * @name mat2d
 * 
 * @description 
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b,
 *  c, d,
 *  tx,ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0
 *  c, d, 0
 *  tx,ty,1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */

var mat2d = {};

var mat2dIdentity = new Float32Array([
    1, 0,
    0, 1,
    0, 0
]);

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.create = function() {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.multiply = function (out, a, b) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5],
        ba = b[0], bb = b[1], bc = b[2], bd = b[3],
        btx = b[4], bty = b[5];

    out[0] = aa*ba + ab*bc;
    out[1] = aa*bb + ab*bd;
    out[2] = ac*ba + ad*bc;
    out[3] = ac*bb + ad*bd;
    out[4] = ba*atx + bc*aty + btx;
    out[5] = bb*atx + bd*aty + bty;
    return out;
};

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
mat2d.mul = mat2d.multiply;


/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.rotate = function (out, a, rad) {
    var aa = a[0],
        ab = a[1],
        ac = a[2],
        ad = a[3],
        atx = a[4],
        aty = a[5],
        st = Math.sin(rad),
        ct = Math.cos(rad);

    out[0] = aa*ct + ab*st;
    out[1] = -aa*st + ab*ct;
    out[2] = ac*ct + ad*st;
    out[3] = -ac*st + ct*ad;
    out[4] = ct*atx + st*aty;
    out[5] = ct*aty - st*atx;
    return out;
};

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {mat2d} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
mat2d.scale = function(out, a, v) {
    var vx = v[0], vy = v[1];
    out[0] = a[0] * vx;
    out[1] = a[1] * vy;
    out[2] = a[2] * vx;
    out[3] = a[3] * vy;
    out[4] = a[4] * vx;
    out[5] = a[5] * vy;
    return out;
};

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {mat2d} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
mat2d.translate = function(out, a, v) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4] + v[0];
    out[5] = a[5] + v[1];
    return out;
};

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat2d = mat2d;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3x3 Matrix
 * @name mat3
 */

var mat3 = {};

var mat3Identity = new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
]);

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[2];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;

    out[3] = xy - wz;
    out[4] = 1 - (xx + zz);
    out[5] = yz + wx;

    out[6] = xz + wy;
    out[7] = yz - wx;
    out[8] = 1 - (xx + yy);

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat3 = mat3;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4x4 Matrix
 * @name mat4
 */

var mat4 = {};

var mat4Identity = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]);

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
mat4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
mat4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
 * Multiplies two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
mat4.mul = mat4.multiply;

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Rotates a mat4 by the given angle
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < GLMAT_EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};

/**
* Calculates a 4x4 matrix from the given quaternion
*
* @param {mat4} out mat4 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat4} out
*/
mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;

    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;

    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
        Math.abs(eyey - centery) < GLMAT_EPSILON &&
        Math.abs(eyez - centerz) < GLMAT_EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat4 = mat4;
}
;
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class Quaternion
 * @name quat
 */

var quat = {};

var quatIdentity = new Float32Array([0, 0, 0, 1]);

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
quat.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
quat.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
quat.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
quat.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
quat.set = vec4.set;

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
quat.add = vec4.add;

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
 * Alias for {@link quat.multiply}
 * @function
 */
quat.mul = quat.multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
quat.scale = vec4.scale;

/**
 * Rotates a quaternion by the given angle around the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle around the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle around the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var cosHalfTheta = ax * bx + ay * by + az * bz + aw * bw,
        halfTheta,
        sinHalfTheta,
        ratioA,
        ratioB;

    if (Math.abs(cosHalfTheta) >= 1.0) {
        if (out !== a) {
            out[0] = ax;
            out[1] = ay;
            out[2] = az;
            out[3] = aw;
        }
        return out;
    }

    halfTheta = Math.acos(cosHalfTheta);
    sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    if (Math.abs(sinHalfTheta) < 0.001) {
        out[0] = (ax * 0.5 + bx * 0.5);
        out[1] = (ay * 0.5 + by * 0.5);
        out[2] = (az * 0.5 + bz * 0.5);
        out[3] = (aw * 0.5 + bw * 0.5);
        return out;
    }

    ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    out[0] = (ax * ratioA + bx * ratioB);
    out[1] = (ay * ratioA + by * ratioB);
    out[2] = (az * ratioA + bz * ratioB);
    out[3] = (aw * ratioA + bw * ratioB);

    return out;
};

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = (function() {
    var s_iNext = [1,2,0];
    return function(out, m) {
        // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
        // article "Quaternion Calculus and Fast Animation".
        var fTrace = m[0] + m[4] + m[8];
        var fRoot;

        if ( fTrace > 0.0 ) {
            // |w| > 1/2, may as well choose w > 1/2
            fRoot = Math.sqrt(fTrace + 1.0);  // 2w
            out[3] = 0.5 * fRoot;
            fRoot = 0.5/fRoot;  // 1/(4w)
            out[0] = (m[7]-m[5])*fRoot;
            out[1] = (m[2]-m[6])*fRoot;
            out[2] = (m[3]-m[1])*fRoot;
        } else {
            // |w| <= 1/2
            var i = 0;
            if ( m[4] > m[0] )
              i = 1;
            if ( m[8] > m[i*3+i] )
              i = 2;
            var j = s_iNext[i];
            var k = s_iNext[j];
            
            fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
            out[i] = 0.5 * fRoot;
            fRoot = 0.5 / fRoot;
            out[3] = (m[k*3+j] - m[j*3+k]) * fRoot;
            out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
            out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
        }
        
        return out;
    };
})();

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.quat = quat;
}
;













  })(shim.exports);
})();

},{}],22:[function(require,module,exports){

function createShaders(gl, opt) {

	if (!opt.vs_id)
		throw new Error('no vertex shader id');

	if (!opt.fs_id)
		throw new Error('no fragment shader id');

	//

	var vertexShader = getShader(gl, opt.vs_id);

	if (!vertexShader)
		throw new Error("Could not initialise vertexShader");

	//

	var fragmentShader = getShader(gl, opt.fs_id);

	if (!fragmentShader)
		throw new Error("Could not initialise fragmentShader");

	//

	this.shaderProgram = gl.createProgram();
	gl.attachShader(this.shaderProgram, vertexShader);
	gl.attachShader(this.shaderProgram, fragmentShader);
	gl.linkProgram(this.shaderProgram);

	if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS))
	{
		// An error occurred while linking
		var lastError = gl.getProgramInfoLog(this.shaderProgram);

		throw new Error("Failed to initialised shaders, Error linking:" + lastError);
	}


    getAttribAndLocation(gl, this.shaderProgram, opt.arr_attrib, opt.arr_uniform);

	return this.shaderProgram;

	//

	function getAttribAndLocation(gl, shader, arr_attrib, arr_uniform) {

	    gl.useProgram(shader);

		if (arr_attrib)
			for (var i = 0; i < arr_attrib.length; ++i)
				shader[arr_attrib[i]] = gl.getAttribLocation(shader, arr_attrib[i]);

		if (arr_uniform)
			for (var i = 0; i < arr_uniform.length; ++i)
				shader[arr_uniform[i]] = gl.getUniformLocation(shader, arr_uniform[i]);

	    gl.useProgram(null);
	}

	//

	function getShader(gl, id) {

		var shaderScript = document.getElementById(id);

		if (!shaderScript) {
			throw new Error('unknown element id');
			return null;
		}

		var str = "";
		var k = shaderScript.firstChild;
		while (k) {
			if (k.nodeType == 3)
				str += k.textContent;

			k = k.nextSibling;
		}

		var shader;
		if (shaderScript.type == "x-shader/x-fragment")
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		else if (shaderScript.type == "x-shader/x-vertex")
			shader = gl.createShader(gl.VERTEX_SHADER);
		else {
			throw new Error('unknown shader type');
			return null;
		}

		gl.shaderSource(shader, str);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(gl.getShaderInfoLog(shader));
			return null;
		}

		return shader;
	}
}

module.exports = {
	createShaders: createShaders
}

},{}],23:[function(require,module,exports){

function imageToUint8Array(image) {
	var canvas = document.createElement('canvas'),
	ctx = canvas.getContext('2d');
	canvas.width = image.width,
	canvas.height = image.height;
	ctx.drawImage(image, 0, 0);
	var imageData = ctx.getImageData(0, 0, image.width, image.height);
	var buff = new Uint8Array(imageData.data.buffer);
	return buff;
}

function flipYImageArray(image, width, height) {
	var buff = new Uint8Array(image.length);
	var i = 0;
	for (var y = height - 1; y >= 0; y--) {
		for (var x = 0; x < width * 4; x += 4) {
			for (var c = 0; c < 4; c++) {
				buff[i] = image[width * 4 * y + x + c];
				i++;
			}
		}
	}
	return buff;
}

module.exports = {
	imageToUint8Array: imageToUint8Array,
	flipYImageArray: flipYImageArray
};

},{}]},{},[2]);
