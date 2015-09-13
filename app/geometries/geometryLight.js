
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

		this._vbuffer.numItems = vertices.length / 9;
	}

	//

	createGeometryLight.prototype.render = function() {

		var shader = this._shader;

	    gl.enableVertexAttribArray(shader.aVertexPosition);
	    gl.enableVertexAttribArray(shader.aVertexColor);
	    gl.enableVertexAttribArray(shader.aVertexNormal);

			var bpp = 4; // gl.FLOAT -> 4 bytes
			var stride = 9 * bpp;
			var index_pos    = 0 * bpp;
			var index_color  = 3 * bpp;
			var index_normal  = 6 * bpp;

			gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);
			gl.vertexAttribPointer(shader.aVertexPosition,3,gl.FLOAT,false,stride,index_pos);
			gl.vertexAttribPointer(shader.aVertexColor,3,gl.FLOAT,false,stride,index_color);
			gl.vertexAttribPointer(shader.aVertexNormal,3,gl.FLOAT,false,stride,index_normal);

			gl.drawArrays( gl.TRIANGLES, 0, this._vbuffer.numItems );

	    gl.disableVertexAttribArray(shader.aVertexPosition);
	    gl.disableVertexAttribArray(shader.aVertexColor);
	    gl.disableVertexAttribArray(shader.aVertexNormal);
	};

	//

	return createGeometryLight;
})
