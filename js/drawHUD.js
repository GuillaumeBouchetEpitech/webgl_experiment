

var createLimitedArray = function (max_item) {

	var container = new Array();

	// fill with 0
	while (container.length < max_item)
		Array.prototype.push.call(container, 0);

	container.max_item = max_item;
	container.max_value = 0.0;

	//

	container.push = function(val) {

		Array.prototype.push.call(this, val);

		var need_search_max = false;

		while (this.length > this.max_item)
		{
			var first_value = this.shift();
			if (first_value == this.max_value)
				need_search_max = true;
		}


		if (val > this.max_value)
			this.max_value = val;
		else if (val != 0 && val == this.max_value)
			need_search_max = true;

		if (need_search_max)
		{
			this.max_value = 0;
			for (var i = 0; i < this.length; ++i)
				this.max_value = Math.max(this.max_value, this[i]);
		}
	};

	return container;
}



CreateHUD = function () {

	this.geom_square = {
		VertexPositionBuffer	:null,
		VertexIndexBuffer		:null
	}

	//

	this.g_hud_vertices = [];
	// this.g_framerate = [];
	this.g_framerate = new createLimitedArray(120);
}

//

CreateHUD.prototype._initBuffers_square = function (gl, vertices, indices) {

	this.geom_square.VertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.geom_square.VertexPositionBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
	this.geom_square.VertexPositionBuffer.itemSize = 3;
	this.geom_square.VertexPositionBuffer.numItems = vertices.length / 3;

	///

	this.geom_square.VertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geom_square.VertexIndexBuffer);

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
	this.geom_square.VertexIndexBuffer.itemSize = 1;
	this.geom_square.VertexIndexBuffer.numItems = indices.length;
}

CreateHUD.prototype.draw = function ( gl, in_shaderPrg, elapsed_time ) {


	gl.useProgram(in_shaderPrg);




	gl.viewport(600, 0, 200, gl.viewportHeight);

	gl.clear(gl.DEPTH_BUFFER_BIT);




	// set the projection matrix
	mat4.ortho( -1,+1, -4,+4, -1,+1, pMatrix );

	gl.uniformMatrix4fv(in_shaderPrg.pMatrixUniform, false, pMatrix);



	// update modelview matrix
	mat4.lookAt(
		vec3.create(0,0,-1),
		vec3.create(0,0,0),
		vec3.create(0,0,1),
		mvMatrix
	);

	// send the modelview matrix
	gl.uniformMatrix4fv(in_shaderPrg.mvMatrixUniform, false, mvMatrix);



	//
	// fps meter

	var hud_vertices_max = 120;
	var hud_fstep = (7.8 / hud_vertices_max);

	this.g_framerate.push( elapsed_time / 1000 ); // -> elapsed_time is in msec

	// this.g_framerate.push( elapsed_time / 1000 ); // -> elapsed_time is in msec

	// while (this.g_framerate.length < hud_vertices_max)
	// 	this.g_framerate.push( 0 );

	if (this.g_framerate.length < 2)
		return;

	// while (this.g_framerate.length > hud_vertices_max)
	// 	this.g_framerate.shift();

	// fps meter
	//




	//
	// hud geometry

	this.g_hud_vertices.length = 0;

	// find the biggest stored value

	// var tmp_max = 0;
	// for (index in this.g_framerate)
	// 	tmp_max = Math.max(tmp_max, this.g_framerate[index]);

	var tmp_max = this.g_framerate.max_value;

	// fps curve vertices

	for (index in this.g_framerate)
	{
		var tmp_ratio = this.g_framerate[index] / tmp_max;

		var start_x = -0.9 + tmp_ratio * 1.8;
		var start_y = -3.9 + hud_fstep * index;

		this.g_hud_vertices.push( start_x, start_y, 0.0 );
	}

	// fps curve indices

	var indices = [];

	var tmp_len = (this.g_hud_vertices.length / 3);

	for (var i = 0; (i + 1) < tmp_len; ++i)
		indices.push( i, i + 1 );



	this.g_hud_vertices.push( -0.9 + 0.000 / tmp_max, -3.9, 0.0 );
	this.g_hud_vertices.push( -0.9 + 0.000 / tmp_max, +3.9, 0.0 );

	this.g_hud_vertices.push( -0.9 + 0.025 / tmp_max, -3.9, 0.0 ); // 40fps line
	this.g_hud_vertices.push( -0.9 + 0.025 / tmp_max, +3.9, 0.0 );

	this.g_hud_vertices.push( -0.9 + 0.050 / tmp_max, -3.9, 0.0 ); // 20fps line
	this.g_hud_vertices.push( -0.9 + 0.050 / tmp_max, +3.9, 0.0 );

	indices.push(tmp_len + 0, tmp_len + 1);

	indices.push(tmp_len + 2, tmp_len + 3);

	indices.push(tmp_len + 4, tmp_len + 5);

	//

	this._initBuffers_square(gl, this.g_hud_vertices, indices);

	// hud geometry
	//





	/// RENDER

	gl.bindBuffer(gl.ARRAY_BUFFER, this.geom_square.VertexPositionBuffer);
	gl.vertexAttribPointer(in_shaderPrg.vertexPositionAttr, this.geom_square.VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geom_square.VertexIndexBuffer);
	gl.drawElements(gl.LINES, this.geom_square.VertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	// /render

}
