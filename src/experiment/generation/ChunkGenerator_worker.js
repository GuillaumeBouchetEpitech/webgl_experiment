
var createMarchinCube = require("./helpers/MarchingCube.js");
var createClassicalNoise = require("./helpers/ClassicalNoise.js");
var createRandomiser = require("./helpers/Randomiser.js");


module.exports = function (self)
{
    var chunk_size = 15;

    var myRand = new createRandomiser();
    var myNoise = new createClassicalNoise(myRand);

    function sample_cb (x, y, z) {
        return myNoise.noise_ex(x, y, z);
    }

    var myMarchingCube = new createMarchinCube(chunk_size, 0.0, sample_cb);

    self.addEventListener('message',function (e)
    {
        var pos = e.data.pos;
        var buf = e.data.buf; // we now own the vertices buffer

        var buf_inc = 0;

        //
        // generate

        var curr_index = 0;
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

            var index = arr_indexes[curr_index];
            curr_index = (curr_index + 1) % 3;

            buf[buf_inc++] = index[0];
            buf[buf_inc++] = index[1];
            buf[buf_inc++] = index[2];              
        }

        myMarchingCube.marchCube( pos, marchCube_cb );

        //

        self.postMessage({
            pos:pos,
            vertices:buf
        }, [ buf.buffer ]); // we now transfer the ownership of the vertices buffer
    });
}
