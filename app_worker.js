
self.importScripts('lib/require.js');

// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: 'lib',
    paths: {
        app: '../app'
    },
    waitSeconds: 20
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(
	[
		  './app/generation/helpers/marchingCube.js'
		, './app/generation/helpers/pnoise.js'
		, './app/generation/helpers/randomiser.js'
	]
	, function
	(
		  marchingCube
		, pnoise
		, randomiser
	)
	{
		var chunk_size = 15;
		var tetra = false;

		var myRand = new Randomiser();

		var myNoise2 = new ClassicalNoise(myRand);

		this._marchingCube = new MarchinCube(chunk_size, 0.0, function(x, y, z) {

			return myNoise2.noise_ex(x, y, z);
		}, tetra);


		self.onmessage = function(e) {
			// console.log('2, Message received from main script');

			var pos = e.data.pos;
			var buf = e.data.buf;

			var buf_inc = 0;

			//
			// generate

			var tmp_index = 0;
			var arr_indexes = [ [1,0,0], [0,1,0], [0,0,1] ];

			// var chunk_vertices = [];
			function marchCube_cb(vertex, color, normal) {

			    // chunk_vertices.push( vertex[0], vertex[1], vertex[2] );
			    // chunk_vertices.push( color[0],  color[1],  color[2]  );
			    // chunk_vertices.push( normal[0], normal[1], normal[2] );

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

			this._marchingCube.marchCube( pos, marchCube_cb )

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
		}

		self.postMessage({ready:true});

		console.log("2.0 intialised");
	}
);

console.log("0. intialised");
