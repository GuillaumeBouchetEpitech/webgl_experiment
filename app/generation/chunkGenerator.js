define(
	[

		  '../gl-context.js'

		, './helpers/marchingCube.js'
		, './helpers/pnoise.js'
		, './helpers/randomiser.js'

        // , '../geometries/geometryBCenter.js'
        // , '../geometries/geometryLight.js'
        , '../geometries/geometryExperimental.js'

	],function(

		  gl

		, marchingCube
		, pnoise
		, randomiser

        // , createGeometryBCenter
        // , createGeometryLight
        , createGeometryExperimental

	)
{

	//

	var chunkRenderer = function(chunk_size, shader, octaves, freq, amp, tetra) {

		this._shader = shader;
		this._chunks = [];
		this._chunk_queue = [];
		this._chunk_size = chunk_size;

		var myRand = new Randomiser();

		var myNoise2 = new ClassicalNoise(myRand, octaves, freq, amp);

		this._marchingCube = new MarchinCube(chunk_size, 0.0, function(x, y, z) {

			return myNoise2.noise_ex(x, y, z);
		}, tetra);
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

	chunkRenderer.prototype._partially_generate = function(pos) {

		//
		// generate

		if (!this.chunk_vertices)
			this.chunk_vertices = [];


		var tmp_index = 0;
		var arr_indexes = [ [1,0,0], [0,1,0], [0,0,1] ];

		// this._marchingCube.marchCube(pos, marchCube_cb);

		// while (!this._marchingCube.marchCube_step(3*50, pos, marchCube_cb))
		// 	;


		// var finished = this._marchingCube.marchCube_step( 3*150, pos, marchCube_cb );

		var chunk_vertices = this.chunk_vertices;
		function marchCube_cb(vertex, color, normal) {

		    chunk_vertices.push( vertex[0], vertex[1], vertex[2] );
		    chunk_vertices.push( color[0],  color[1],  color[2]  );
		    chunk_vertices.push( normal[0], normal[1], normal[2] );


		    var index = arr_indexes[tmp_index];
		    tmp_index = (tmp_index + 1) % 3;

		    chunk_vertices.push( index[0], index[1], index[2] );
		}



		var last_time = Date.now();

		while (true)
		{
			finished = this._marchingCube.marchCube_step( 60, pos, marchCube_cb )

			if (finished)
				break;

			if ((last_time - Date.now()) > 4)
				break;
		}




		// generate
		//

		if (finished)
		{
			var geom = new createGeometryExperimental(chunk_vertices, this._shader);

			// this.chunk_vertices = [];
			chunk_vertices.length = 0;

			// save

			this._chunks.push({
				  pos: pos
				, geom: geom
			});

			this.is_processing_chunk = false;
		}

	};

	//

	chunkRenderer.prototype.update = function(camera_pos, priority_cb) {

		// are we already processing a chunk?

		if (this.is_processing_chunk)
			return this._partially_generate(this.processing_pos); // yes...

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

			return;
		}

		var best_index = 0;

		//
		///

		function calc_length(in_x, in_y, in_z) {
			return Math.sqrt(in_x*in_x + in_y*in_y + in_z*in_z);
		}

		// function compute_chunk_center(pos) {
		// 	return [
		// 		pos[0] * this._chunk_size + this._chunk_size / 2,
		// 		pos[1] * this._chunk_size + this._chunk_size / 2,
		// 		pos[2] * this._chunk_size + this._chunk_size / 2
		// 	];
		// }

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
	}



	//

	chunkRenderer.prototype.render = function(tmp_mvMatrix, tmp_pMatrix, tmp_freefly_pos, validation_callback) {

        gl.useProgram(this._shader);

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

	return chunkRenderer;
})