
define(
	[

		  '../gl-context.js'

	],function(

		  gl
	)
{

	//

	var createGeometryColor = function (vertices, primitive) {

		this._primitive = primitive;

		this._vbuffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

		this._vbuffer.numItems = vertices.length / 6;
	}

	//

	createGeometryColor.prototype.render = function(shader) {

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

	    gl.disableVertexAttribArray(shader.aVertexPosition);
	    gl.disableVertexAttribArray(shader.aVertexColor);
	};

	//

	return createGeometryColor;
})
