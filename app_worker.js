
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
