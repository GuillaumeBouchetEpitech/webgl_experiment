
"use strict"

var gl = require('../gl-context.js');

var createGeometryExperimental = require('../geometries/geometryExperimental.js');


var webworkify = require('webworkify');


var chunkRenderer = function(chunk_size, shader, octaves, freq, amp, tetra) {

    this._shader = shader; // shader used
    this._chunks = []; // live chunks
    this._chunk_queue = []; // 
    this._chunk_size = chunk_size;


    // massive buffer of 100k float32 that will act as a
    // common data between the the main script and the webworker
    this._myWorker_buffer = new Float32Array(100000);
    // the ownership of the buffer should be 'tranfered'
    // no copy involed, it should be as fast as a possible


    this._myWorker = webworkify(require('./chunkGenerator_worker.js'));
    this._myWorker_status = 1; // worker available
    var self = this;
    this._myWorker.addEventListener('message', function (e) {

        self._myWorker_status = 1; // worker available

        var pos = e.data.pos;
        self._myWorker_buffer = e.data.vertices; // we now own the vertices buffer

        var geom = new createGeometryExperimental(self._myWorker_buffer, self._shader, true);

        // save

        self._chunks.push({ pos: pos, geom: geom});

        self.is_processing_chunk = false;
    });
}

//

var proto = chunkRenderer.prototype;

proto.update = function(camera_pos, priority_cb) {

    // webworker available?

    if (this._myWorker_status != 1) // worker working
        return;

    // available -> determine the next chunk to process

    // is there something to process?
    if (this._chunk_queue.length == 0)
        return; // no

    // if just 1 chunk left to process (or no priority callback)
    // -> just pop and process the next/last chunk in the queue
    if (!priority_cb || this._chunk_queue.length == 1)
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

        for (var i = 1; i < this._chunk_queue.length; ++i)
        {
            var try_pos = this._chunk_queue[i];

            if (best_index == -1 || priority_cb( try_pos, best_pos ))
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

proto.render = function(tmp_mvMatrix, tmp_pMatrix, tmp_freefly_pos, validation_callback) {

    gl.useProgram(this._shader);

    // send the texture to the shader
    gl.uniform1i(this._shader.uSampler, 0);

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

module.exports = chunkRenderer
