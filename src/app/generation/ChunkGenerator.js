
"use strict"

var g_data = require('../data/index.js');

// var gl = require('../gl-context.js');

// var createGeometryExperimental = require('./geometries/GeometryExperimental.js');
var webworkify = require('webworkify');

//

var ChunkGenerator = function()
{
    this._chunks = []; // live chunks
    this._chunk_queue = []; // position to be processed

    this._geoms = []; // position to be processed


    // massive buffer of 100k float32 that will act as a
    // common data between the the main script and the webworker
    this._myWorker_buffer = new Float32Array(100000);
    // the ownership of the buffer should be 'tranfered'
    // no copy involed, it should be as fast as a possible


    this._myWorker = webworkify(require('./ChunkGenerator_worker.js'));
    this._myWorker_status = 1; // worker available
    var self = this;
    this._myWorker.addEventListener('message', function (e) {

        self._myWorker_status = 1; // worker available

        var pos = e.data.pos;
        self._myWorker_buffer = e.data.vertices; // we now own the vertices buffer

        var geom = null;
        if (self._geoms.length == 0)
        {
            geom = g_data.add_geom(self._myWorker_buffer);
        }
        else
        {
            geom = self._geoms.pop();
            geom.update(self._myWorker_buffer);
        }

        // save

        self._chunks.push({ pos: pos, geom: geom});

        self.is_processing_chunk = false;
    });
}

//

var proto = ChunkGenerator.prototype;

proto.update = function(camera_pos)
{
    // webworker available?

    if (this._myWorker_status != 1) // worker working
        return;

    // available -> determine the next chunk to process

    // is there something to process?
    if (this._chunk_queue.length == 0)
        return; // no

    // if just 1 chunk left to process (or no priority callback)
    // -> just pop and process the next/last chunk in the queue
    if (this._chunk_queue.length == 1)
    {
        this.processing_pos = this._chunk_queue.pop();
    }
    else
    {
        // from here, we determine the next bext chunk to process

        function calc_length(in_x, in_y, in_z) {
            return Math.sqrt(in_x*in_x + in_y*in_y + in_z*in_z);
        }

        var best_index = -1;
        var best_dist = 9999;
        var best_pos = null;

        for (var i = 0; i < this._chunk_queue.length; ++i)
        {
            var try_pos = this._chunk_queue[i];

            if (best_index == -1 || g_data.chunk_is_visible(try_pos))
            {
                var dist = calc_length( camera_pos[0] - try_pos[0] - g_data.logic.k_chunk_size / 2,
                                        camera_pos[1] - try_pos[1] - g_data.logic.k_chunk_size / 2,
                                        camera_pos[2] - try_pos[2] - g_data.logic.k_chunk_size / 2 );

                if (best_dist < dist)
                    continue;

                best_index = i;
                best_dist = dist;

                best_pos = this._chunk_queue[best_index];
            }
        }

        this._chunk_queue.splice(best_index,1);

        this.processing_pos = best_pos;
    }

    this.is_processing_chunk = true;

    this._myWorker_status = 2; // working
    this._myWorker.postMessage({
        pos: this.processing_pos,
        buf: this._myWorker_buffer
    }, [ this._myWorker_buffer.buffer ]); // we now transfer the ownership of the vertices buffer

}

//

module.exports = ChunkGenerator
