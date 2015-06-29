



CreateHUD = function () {

	this.geom_square = {
		VertexPositionBuffer	:null,
		VertexColorBuffer		:null,
		VertexIndexBuffer		:null,
		VertexNormalBuffer		:null
	}

	//

	this.g_hud_vertices = [];
	this.g_framerate = [];

}

//

CreateHUD.prototype._initBuffers_square = function (gl, vertices, indices) {

	var side = 0.5;

	this.geom_square.VertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.geom_square.VertexPositionBuffer);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	this.geom_square.VertexPositionBuffer.itemSize = 3;
	this.geom_square.VertexPositionBuffer.numItems = vertices.length / 3;

	///

	this.geom_square.VertexColorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.geom_square.VertexColorBuffer);
	// colors = [
	// 	1,1,1,  1,0,0,  0,1,0,  0,0,1
	// ];

	var colors = [];

	for (var i = 0; i < vertices.length; ++i)
		colors.push(1);

	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW );
	this.geom_square.VertexColorBuffer.itemSize = 3;
	this.geom_square.VertexColorBuffer.numItems = colors.length / 3;

	///

	this.geom_square.VertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.geom_square.VertexNormalBuffer);
	// normals = [
	// 	1,0,0,  1,0,0,  1,0,0,  1,0,0
	// ];

	var normals = [];

	for (var i = 0; i < vertices.length; ++i)
		normals.push(1);

	gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW );
	this.geom_square.VertexNormalBuffer.itemSize = 3;
	this.geom_square.VertexNormalBuffer.numItems = normals.length / 3;

	///

	this.geom_square.VertexIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geom_square.VertexIndexBuffer);
	// var indices = [
	// 	0,1,  1,3,  3,2,  2,0
	// ];

	// var indices = [];

	// for (var i = 0; (i + 1) < vertices.length / 3; ++i)
	// {
	// 	indices.push(i);
	// 	indices.push(i + 1);
	// }

	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
	this.geom_square.VertexIndexBuffer.itemSize = 1;
	this.geom_square.VertexIndexBuffer.numItems = indices.length;
}

CreateHUD.prototype.draw = function ( gl, in_shaderProgram, elapsed_time ) {

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	gl.clear(gl.DEPTH_BUFFER_BIT);


	// set the projection matrix
	// mat4.perspective(70, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.ortho( -1,+1, -1,+1, -1,+1, pMatrix );

	gl.uniformMatrix4fv(in_shaderProgram.pMatrixUniform, false, pMatrix);





	// g_FreeFlyCamera.updateViewMatrix( mvMatrix );

	// // TODO : update modelview matrix
	// mvMatrix

	mat4.lookAt(
		vec3.create(0,0,-1),
		vec3.create(0,0,0),
		vec3.create(0,0,1),
		mvMatrix
	);




	// // set the normal matrix
	// mat4.identity(nMatrix);
	// nMatrix[ 0] = mvMatrix[ 0];
	// nMatrix[ 1] = mvMatrix[ 1];
	// nMatrix[ 2] = mvMatrix[ 2];

	// nMatrix[ 4] = mvMatrix[ 4];
	// nMatrix[ 5] = mvMatrix[ 5];
	// nMatrix[ 6] = mvMatrix[ 6];

	// nMatrix[ 8] = mvMatrix[ 8];
	// nMatrix[ 9] = mvMatrix[ 9];
	// nMatrix[10] = mvMatrix[10];

	// // send the normal matrix
	// gl.uniformMatrix4fv(in_shaderProgram.nMatrixUniform, false, nMatrix);


	gl.uniform4f( in_shaderProgram.uForcedRange, 0,0,0,0);
	gl.uniform4f( in_shaderProgram.uForcedRange2, 0,0,0,0);



	var hud_vertices_max = 60;


	this.g_framerate.push( elapsed_time );

	// fi
	while (this.g_framerate.length < hud_vertices_max)
		this.g_framerate.push( 0 );




	if (this.g_hud_vertices.length == 0)
	{
		this.g_hud_vertices.push(0.05);
		this.g_hud_vertices.push(0.2);
		this.g_hud_vertices.push(0.0);
	}

	var hud_fstep = (0.8 / hud_vertices_max);

	var start_x = 0.8 + hud_fstep;
	var start_y = 0.05 + (elapsed_time/ 100);

	this.g_hud_vertices.push(start_x);
	this.g_hud_vertices.push(start_y);
	this.g_hud_vertices.push(0.0);

	if ((this.g_hud_vertices.length / 3) > hud_vertices_max)
	{
		this.g_hud_vertices.shift();
		this.g_hud_vertices.shift();
		this.g_hud_vertices.shift();

		for (var i = 0; (i + 3) < this.g_hud_vertices.length; i += 3)
			this.g_hud_vertices[i] -= hud_fstep;
	}



	var indices = [];

	for (var i = 0; (i + 1) < this.g_hud_vertices.length / 3; ++i)
	{
		indices.push(i);
		indices.push(i + 1);
	}

	this._initBuffers_square(gl, this.g_hud_vertices, indices);





	// var side = 0.4;
	// var side2 = Math.random() * 0.4;

	// vertices = [
	// 	 side,  side,  side,
	// 	-side,  side2,  side,
	// 	 side, -side2,  side,
	// 	-side, -side,  side
	// ];
	// initBuffers_square(vertices);





	/// RENDER CUBES

	gl.uniform4f( in_shaderProgram.uForcedRange, 0,0,0,0 );
	gl.uniform4f( in_shaderProgram.uForcedRange2, 0,0,0,0 );

	// for (var geom_i = 0; geom_i < g_chunks.length; ++geom_i) {
	// for (geom_i in g_chunks) {

	// 	var curr_chunk = g_chunks[ geom_i ];

	// 	var pos = curr_chunk.pos;


		// no geom mean the chunk is a work in progress => show a green cube

		// if (!curr_chunk.geom)
		// 	gl.uniform4f( in_shaderProgram.uForcedColor, 0,1,0,1);
		// else
			gl.uniform4f( in_shaderProgram.uForcedColor, 1,1,1,1);

		// //

		// var axis = [
		// 	pos[0] * g_chunk_size + g_chunk_size / 2,
		// 	pos[1] * g_chunk_size + g_chunk_size / 2,
		// 	pos[2] * g_chunk_size + g_chunk_size / 2
		// ];

		// mvPushMatrix();

		// 	// translate the chunk were it belong
		// 	mat4.translate(mvMatrix, axis);

			// send the modelview matrix
			gl.uniformMatrix4fv(in_shaderProgram.mvMatrixUniform, false, mvMatrix);

			///

			gl.bindBuffer(gl.ARRAY_BUFFER, this.geom_square.VertexPositionBuffer);
			gl.vertexAttribPointer(in_shaderProgram.vertexPositionAttr, this.geom_square.VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.geom_square.VertexColorBuffer);
			gl.vertexAttribPointer(in_shaderProgram.vertexColorAttr, this.geom_square.VertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, this.geom_square.VertexNormalBuffer);
			gl.vertexAttribPointer(in_shaderProgram.vertexNormalAttr, this.geom_square.VertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);


			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.geom_square.VertexIndexBuffer);
			gl.drawElements(gl.LINES, this.geom_square.VertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

		// mvPopMatrix();

	// }



	// gl.uniformMatrix4fv(in_shaderProgram.mvMatrixUniform, false, mvMatrix);


	// /render

}
