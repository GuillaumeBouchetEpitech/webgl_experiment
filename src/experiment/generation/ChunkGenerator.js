
"use strict"

var g_data = require('../data/index.js');

// var gl = require('../gl-context.js');

// var createGeometryExperimental = require('./geometries/GeometryExperimental.js');
var webworkify = require('webworkify');

//

var ChunkGenerator = function()
{
    var self = this;

    this._running = false;

    this._chunks = []; // live chunks
    this._chunk_queue = []; // position to be processed

    this._geoms = []; // position to be processed

    // TODO: simplify
    // position used to detect a move in the current chunk
    this._saved_index = [1,0,0]; // <- currently 1/0/0 but any other value than 0/0/0 will work


    // massive buffer of 100k float32 that will act as a
    // common data between the the main script and the webworker
    this._myWorker_buffer = new Float32Array(100000);
    // the ownership of the buffer should be 'tranfered'
    // no copy involed, it should be as fast as a possible

    this._myWorker = webworkify(require('./ChunkGenerator_worker.js'));
    this._myWorker_status = 1; // worker available
    this._myWorker.addEventListener('message', function (e) {

        self._myWorker_buffer = e.data.vertices; // we now own the vertices buffer
        self._myWorker_status = 1; // worker available

        if (!self._running)
            return;

        var pos = e.data.pos;

        var geom = null;
        if (self._geoms.length == 0)
        {
            geom = g_data.add_geom(self._myWorker_buffer);
        }
        else
        {
            geom = self._geoms.pop();
            g_data.update_geom(geom, self._myWorker_buffer);
        }

        if (geom === null)
        {
            console.log('worker: processing the result -> invalid geom');
        }
        else
        {
            console.log('worker: processing the result -> valid geom');

            // save

            self._chunks.push({ pos: pos, geom: geom});

            self.is_processing_chunk = false;

            // launch again

            self._launch_worker();
        }
    });
}

//

var proto = ChunkGenerator.prototype;

proto.start = function()
{
    this._running = true;
}

proto.stop = function()
{
    if (!this._running)
        return;

    this._running = false;

    this._chunk_queue.length = 0;
    this._chunks.length = 0;
    this._geoms.length = 0;
}

proto.update = function(camera_pos)
{
    if (!this._running)
        return;

    //  check if move to ask chunks
    //      -> if yes
    //          reset chunk queue
    //          exclude chunk out of range
    //          include chunk in range

    this._camera_pos = camera_pos;

    var curr_index = [
        Math.floor(camera_pos[0] / g_data.logic.k_chunk_size)|0,
        Math.floor(camera_pos[1] / g_data.logic.k_chunk_size)|0,
        Math.floor(camera_pos[2] / g_data.logic.k_chunk_size)|0
    ];

    // did we move to another chunk?
    if (this._chunks.length == 0 ||
        curr_index[0] != this._saved_index[0] ||
        curr_index[1] != this._saved_index[1] ||
        curr_index[2] != this._saved_index[2])
    {
        // yes -> save as the new current chunk
        this._saved_index[0] = curr_index[0];
        this._saved_index[1] = curr_index[1];
        this._saved_index[2] = curr_index[2];

        //

        // clear the generation queue
        this._chunk_queue.length = 0;

        // the range of chunk generation/exclusion
        var range = 3|0;

        var min_index = new Int32Array([
            (curr_index[0] - range)|0,
            (curr_index[1] - range)|0,
            (curr_index[2] - range)|0,
        ]);
        var max_index = new Int32Array([
            (curr_index[0] + range)|0,
            (curr_index[1] + range)|0,
            (curr_index[2] + range)|0,
        ]);

        //
        // exclude the chunks that are too far away

        for (var i = 0; i < this._chunks.length; ++i)
        {
            var curr_pos = [
                (this._chunks[i].pos[0]/g_data.logic.k_chunk_size)|0,
                (this._chunks[i].pos[1]/g_data.logic.k_chunk_size)|0,
                (this._chunks[i].pos[2]/g_data.logic.k_chunk_size)|0
            ];

            if (curr_pos[0] < min_index[0] || curr_pos[0] > max_index[0] ||
                curr_pos[1] < min_index[1] || curr_pos[1] > max_index[1] ||
                curr_pos[2] < min_index[2] || curr_pos[2] > max_index[2])
            {
                // this._chunks[i].geom.dispose();
                this._geoms.push(this._chunks[i].geom);
                this._chunks.splice(i, 1);
                i--;
            }
        }

        //
        // include in the generation queue the close enough chunks

        for (var z = min_index[2]; z <= max_index[2]; ++z)
        for (var y = min_index[1]; y <= max_index[1]; ++y)
        for (var x = min_index[0]; x <= max_index[0]; ++x)
        {
            var pos = [
                x * g_data.logic.k_chunk_size,
                y * g_data.logic.k_chunk_size,
                z * g_data.logic.k_chunk_size
            ]

            /// already processed ?
            var found = false;
            for (var j = 0; j < this._chunks.length; ++j)
                if (this._chunks[j].pos[0] === pos[0] &&
                    this._chunks[j].pos[1] === pos[1] &&
                    this._chunks[j].pos[2] === pos[2])
                {
                    found = true;
                    break;
                }

            if (found) // is already processed
                continue;

            this._chunk_queue.push(pos);
        }

        //
        //

        this._launch_worker();
    }
}

proto._launch_worker = function()
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
                var dist = calc_length( this._camera_pos[0] - try_pos[0] - g_data.logic.k_chunk_size / 2,
                                        this._camera_pos[1] - try_pos[1] - g_data.logic.k_chunk_size / 2,
                                        this._camera_pos[2] - try_pos[2] - g_data.logic.k_chunk_size / 2 );

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
