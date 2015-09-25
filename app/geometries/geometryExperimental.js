
define(
	[

		  '../gl-context.js'

	],function(

		  gl
	)
{

	//

	var createGeometryLight = function (vertices,shader) {

		this._vbuffer = gl.createBuffer();
		this._shader = shader;

		gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

		this._vbuffer.numItems = vertices.length / 12;

		console.log('create called');
	}

	//

	createGeometryLight.prototype.dispose = function() {

		gl.deleteBuffer(this._vbuffer);

		console.log('dispose called');
	}

	//

	createGeometryLight.prototype.render = function() {

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

	    gl.disableVertexAttribArray(shader.aVertexPosition);
	    gl.disableVertexAttribArray(shader.aVertexColor);
	    gl.disableVertexAttribArray(shader.aVertexNormal);
	    gl.disableVertexAttribArray(shader.aVertexBCenter);
	};

	//

	return createGeometryLight;
})
