(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn, options) {
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp && exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            'function(require,module,exports){' + fn + '(self); }',
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        'function(require,module,exports){' +
            // try to call default if defined to also support babel esmodule exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);' +
        '}',
        scache
    ];

    var workerSources = {};
    resolveSources(skey);

    function resolveSources(key) {
        workerSources[key] = true;

        for (var depPath in sources[key][1]) {
            var depKey = sources[key][1][depPath];
            if (!workerSources[depKey]) {
                resolveSources(depKey);
            }
        }
    }

    var src = '(' + bundleFn + ')({'
        + Object.keys(workerSources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    var blob = new Blob([src], { type: 'text/javascript' });
    if (options && options.bare) { return blob; }
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
};

},{}],2:[function(require,module,exports){

"use strict"

//

function Data () {}

//

module.exports = new Data(); // <- singleton

},{}],3:[function(require,module,exports){

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

},{"../data/index.js":2,"./ChunkGenerator_worker.js":4,"webworkify":1}],4:[function(require,module,exports){

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

},{"./helpers/ClassicalNoise.js":5,"./helpers/MarchingCube.js":6,"./helpers/Randomiser.js":7}],5:[function(require,module,exports){

"use strict"

var ClassicalNoise = function(r, octaves, freq, amp) {

    this._octaves       = octaves || 1;
    this._frequency     = freq || 1.0;
    this._amplitude     = amp || 0.5;

    if (r == undefined) r = Math;

    this.grad3 = [ [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
                   [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
                   [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1] ];

    this.p = new Uint8Array(256);

    for (var i = 0; i < 256; ++i)
        this.p[i] = Math.floor(r.random()*256)|0;

    // To remove the need for index wrapping, double the permutation table length
    this.perm = new Uint8Array(512);
    for (var i = 0; i < 512; ++i)
        this.perm[i] = this.p[i & 255]|0;
};

///

var proto = ClassicalNoise.prototype

proto.noise_ex = function(x2, y2, z2) { 

    var result = 0.0;
    var amp = this._amplitude;

    var x = x2 * this._frequency;
    var y = y2 * this._frequency;
    var z = z2 * this._frequency;

    for (var i = 0; i < this._octaves; ++i)
    {
        result += this.noise(x,y,z) * amp;

        x *= 2.0;
        y *= 2.0;
        z *= 2.0;

        amp *= 0.5;
    }

    return (result);
}

///

proto.dot = function(g, x, y, z) { return g[0]*x + g[1]*y + g[2]*z; }; 
proto.mix = function(a, b, t) { return (1.0-t)*a + t*b; };
proto.fade = function(t) {  return t*t*t*(t*(t*6.0-15.0)+10.0); };
 
// Classic Perlin noise, 3D version 
proto.noise = function(x, y, z) { 

    // Find unit grid cell containing point 
    var X = Math.floor(x)|0;
    var Y = Math.floor(y)|0;
    var Z = Math.floor(z)|0;

    // Get relative xyz coordinates of point within that cell 
    x = x - X;
    y = y - Y;
    z = z - Z;

    // Wrap the integer cells at 255 (smaller integer period can be introduced here) 
    X = (X & 255)|0; 
    Y = (Y & 255)|0; 
    Z = (Z & 255)|0;

    // Calculate a set of eight hashed gradient indices 
    var gi000 = (this.perm[X  +this.perm[Y  +this.perm[Z  ]]] % 12)|0;
    var gi001 = (this.perm[X  +this.perm[Y  +this.perm[Z+1]]] % 12)|0;
    var gi010 = (this.perm[X  +this.perm[Y+1+this.perm[Z  ]]] % 12)|0;
    var gi011 = (this.perm[X  +this.perm[Y+1+this.perm[Z+1]]] % 12)|0;
    var gi100 = (this.perm[X+1+this.perm[Y  +this.perm[Z  ]]] % 12)|0;
    var gi101 = (this.perm[X+1+this.perm[Y  +this.perm[Z+1]]] % 12)|0;
    var gi110 = (this.perm[X+1+this.perm[Y+1+this.perm[Z  ]]] % 12)|0;
    var gi111 = (this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12)|0;

    // Calculate noise contributions from each of the eight corners
    var n000 = this.dot(this.grad3[gi000], x  , y  , z  );
    var n100 = this.dot(this.grad3[gi100], x-1, y  , z  );
    var n010 = this.dot(this.grad3[gi010], x  , y-1, z  );
    var n110 = this.dot(this.grad3[gi110], x-1, y-1, z  );
    var n001 = this.dot(this.grad3[gi001], x  , y  , z-1);
    var n101 = this.dot(this.grad3[gi101], x-1, y  , z-1);
    var n011 = this.dot(this.grad3[gi011], x  , y-1, z-1);
    var n111 = this.dot(this.grad3[gi111], x-1, y-1, z-1);

    // Compute the fade curve value for each of x, y, z
    var u = this.fade(x);
    var v = this.fade(y);
    var w = this.fade(z);

    // Interpolate along x the contributions from each of the corners
    var nx00 = this.mix(n000, n100, u);
    var nx01 = this.mix(n001, n101, u);
    var nx10 = this.mix(n010, n110, u);
    var nx11 = this.mix(n011, n111, u);

    // Interpolate the four results along y
    var nxy0 = this.mix(nx00, nx10, v);
    var nxy1 = this.mix(nx01, nx11, v);

    // Interpolate the two last results along z
    var nxyz = this.mix(nxy0, nxy1, w);

    return nxyz;
};

///

module.exports = ClassicalNoise

},{}],6:[function(require,module,exports){

"use strict"

var MarchingCube = function(in_chunk_size, in_fTv, in_sample_cb, tetra) {

    this.chunk_size = in_chunk_size
    this.fTv = in_fTv;
    this.sample = in_sample_cb;

    // this.tetra = tetra || false;
    this.tetra = true;


    this.current_index = 0;


    this.step_size = 1.0 / this.chunk_size;



    this.a2fVertexOffset = [
        [0,0,0],[1,0,0],[1,1,0],[0,1,0],
        [0,0,1],[1,0,1],[1,1,1],[0,1,1]
    ];

    this.a2iEdgeConnection = [
        [0,1], [1,2], [2,3], [3,0],
        [4,5], [5,6], [6,7], [7,4],
        [0,4], [1,5], [2,6], [3,7]
    ];

    this.a2fEdgeDirection = [
        [1,0,0],[0,1,0],[-1,0,0],[0,-1,0],
        [1,0,0],[0,1,0],[-1,0,0],[0,-1,0],
        [0,0,1],[0,0,1],[ 0,0,1],[0, 0,1]
    ];

    this.a2iTetrahedronEdgeConnection = [
        [0,1], [1,2], [2,0], [0,3], [1,3], [2,3]
    ];

    this.a2iTetrahedronsInACube = [
        [0,5,1,6], [0,1,2,6], [0,2,3,6],
        [0,3,7,6], [0,7,4,6], [0,4,5,6]
    ];

    this.aiTetrahedronEdgeFlags = [
        0x00, 0x0d, 0x13, 0x1e, 0x26, 0x2b, 0x35, 0x38,
        0x38, 0x35, 0x2b, 0x26, 0x1e, 0x13, 0x0d, 0x00
    ];

    this.a2iTetrahedronTriangles = [
        [-1, -1, -1, -1, -1, -1, -1],
        [ 0,  3,  2, -1, -1, -1, -1],
        [ 0,  1,  4, -1, -1, -1, -1],
        [ 1,  4,  2,  2,  4,  3, -1],

        [ 1,  2,  5, -1, -1, -1, -1],
        [ 0,  3,  5,  0,  5,  1, -1],
        [ 0,  2,  5,  0,  5,  4, -1],
        [ 5,  4,  3, -1, -1, -1, -1],

        [ 3,  4,  5, -1, -1, -1, -1],
        [ 4,  5,  0,  5,  2,  0, -1],
        [ 1,  5,  0,  5,  3,  0, -1],
        [ 5,  2,  1, -1, -1, -1, -1],

        [ 3,  4,  2,  2,  4,  1, -1],
        [ 4,  1,  0, -1, -1, -1, -1],
        [ 2,  3,  0, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1]
    ];




    this.aiCubeEdgeFlags = [
        0x000, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
        0x190, 0x099, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
        0x230, 0x339, 0x033, 0x13a, 0x636, 0x73f, 0x435, 0x53c, 0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
        0x3a0, 0x2a9, 0x1a3, 0x0aa, 0x7a6, 0x6af, 0x5a5, 0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
        0x460, 0x569, 0x663, 0x76a, 0x066, 0x16f, 0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
        0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0x0ff, 0x3f5, 0x2fc, 0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
        0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x055, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
        0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0x0cc, 0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
        0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc, 0x0cc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
        0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c, 0x15c, 0x055, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
        0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5, 0x0ff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
        0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f, 0x066, 0x76a, 0x663, 0x569, 0x460,
        0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac, 0x4ac, 0x5a5, 0x6af, 0x7a6, 0x0aa, 0x1a3, 0x2a9, 0x3a0,
        0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x033, 0x339, 0x230,
        0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x099, 0x190,
        0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x000
    ];

    this.a2iTriangleConnectionTable = [
        [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 8, 3, 9, 8, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 1, 2,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 2,10, 0, 2, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 8, 3, 2,10, 8,10, 9, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 3,11, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0,11, 2, 8,11, 0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 9, 0, 2, 3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1,11, 2, 1, 9,11, 9, 8,11,-1,-1,-1,-1,-1,-1,-1],
        [ 3,10, 1,11,10, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0,10, 1, 0, 8,10, 8,11,10,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 9, 0, 3,11, 9,11,10, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 8,10,10, 8,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 7, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 3, 0, 7, 3, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1, 9, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 1, 9, 4, 7, 1, 7, 3, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 4, 7, 3, 0, 4, 1, 2,10,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 2,10, 9, 0, 2, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 2,10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4,-1,-1,-1,-1],
        [ 8, 4, 7, 3,11, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [11, 4, 7,11, 2, 4, 2, 0, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 0, 1, 8, 4, 7, 2, 3,11,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 7,11, 9, 4,11, 9,11, 2, 9, 2, 1,-1,-1,-1,-1],
        [ 3,10, 1, 3,11,10, 7, 8, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 1,11,10, 1, 4,11, 1, 0, 4, 7,11, 4,-1,-1,-1,-1],
        [ 4, 7, 8, 9, 0,11, 9,11,10,11, 0, 3,-1,-1,-1,-1],
        [ 4, 7,11, 4,11, 9, 9,11,10,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 4, 0, 8, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 5, 4, 1, 5, 0,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 5, 4, 8, 3, 5, 3, 1, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 9, 5, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 8, 1, 2,10, 4, 9, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 2,10, 5, 4, 2, 4, 0, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 2,10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8,-1,-1,-1,-1],
        [ 9, 5, 4, 2, 3,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0,11, 2, 0, 8,11, 4, 9, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 5, 4, 0, 1, 5, 2, 3,11,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 1, 5, 2, 5, 8, 2, 8,11, 4, 8, 5,-1,-1,-1,-1],
        [10, 3,11,10, 1, 3, 9, 5, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 9, 5, 0, 8, 1, 8,10, 1, 8,11,10,-1,-1,-1,-1],
        [ 5, 4, 0, 5, 0,11, 5,11,10,11, 0, 3,-1,-1,-1,-1],
        [ 5, 4, 8, 5, 8,10,10, 8,11,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 7, 8, 5, 7, 9,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 3, 0, 9, 5, 3, 5, 7, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 7, 8, 0, 1, 7, 1, 5, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 5, 3, 3, 5, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 7, 8, 9, 5, 7,10, 1, 2,-1,-1,-1,-1,-1,-1,-1],
        [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3,-1,-1,-1,-1],
        [ 8, 0, 2, 8, 2, 5, 8, 5, 7,10, 5, 2,-1,-1,-1,-1],
        [ 2,10, 5, 2, 5, 3, 3, 5, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 9, 5, 7, 8, 9, 3,11, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7,11,-1,-1,-1,-1],
        [ 2, 3,11, 0, 1, 8, 1, 7, 8, 1, 5, 7,-1,-1,-1,-1],
        [11, 2, 1,11, 1, 7, 7, 1, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 8, 8, 5, 7,10, 1, 3,10, 3,11,-1,-1,-1,-1],
        [ 5, 7, 0, 5, 0, 9, 7,11, 0, 1, 0,10,11,10, 0,-1],
        [11,10, 0,11, 0, 3,10, 5, 0, 8, 0, 7, 5, 7, 0,-1],
        [11,10, 5, 7,11, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [10, 6, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 5,10, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 0, 1, 5,10, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 8, 3, 1, 9, 8, 5,10, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 6, 5, 2, 6, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 6, 5, 1, 2, 6, 3, 0, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 6, 5, 9, 0, 6, 0, 2, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8,-1,-1,-1,-1],
        [ 2, 3,11,10, 6, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [11, 0, 8,11, 2, 0,10, 6, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1, 9, 2, 3,11, 5,10, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 5,10, 6, 1, 9, 2, 9,11, 2, 9, 8,11,-1,-1,-1,-1],
        [ 6, 3,11, 6, 5, 3, 5, 1, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8,11, 0,11, 5, 0, 5, 1, 5,11, 6,-1,-1,-1,-1],
        [ 3,11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9,-1,-1,-1,-1],
        [ 6, 5, 9, 6, 9,11,11, 9, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 5,10, 6, 4, 7, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 3, 0, 4, 7, 3, 6, 5,10,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 9, 0, 5,10, 6, 8, 4, 7,-1,-1,-1,-1,-1,-1,-1],
        [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4,-1,-1,-1,-1],
        [ 6, 1, 2, 6, 5, 1, 4, 7, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7,-1,-1,-1,-1],
        [ 8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6,-1,-1,-1,-1],
        [ 7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9,-1],
        [ 3,11, 2, 7, 8, 4,10, 6, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 5,10, 6, 4, 7, 2, 4, 2, 0, 2, 7,11,-1,-1,-1,-1],
        [ 0, 1, 9, 4, 7, 8, 2, 3,11, 5,10, 6,-1,-1,-1,-1],
        [ 9, 2, 1, 9,11, 2, 9, 4,11, 7,11, 4, 5,10, 6,-1],
        [ 8, 4, 7, 3,11, 5, 3, 5, 1, 5,11, 6,-1,-1,-1,-1],
        [ 5, 1,11, 5,11, 6, 1, 0,11, 7,11, 4, 0, 4,11,-1],
        [ 0, 5, 9, 0, 6, 5, 0, 3, 6,11, 6, 3, 8, 4, 7,-1],
        [ 6, 5, 9, 6, 9,11, 4, 7, 9, 7,11, 9,-1,-1,-1,-1],
        [10, 4, 9, 6, 4,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4,10, 6, 4, 9,10, 0, 8, 3,-1,-1,-1,-1,-1,-1,-1],
        [10, 0, 1,10, 6, 0, 6, 4, 0,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1,10,-1,-1,-1,-1],
        [ 1, 4, 9, 1, 2, 4, 2, 6, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4,-1,-1,-1,-1],
        [ 0, 2, 4, 4, 2, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 3, 2, 8, 2, 4, 4, 2, 6,-1,-1,-1,-1,-1,-1,-1],
        [10, 4, 9,10, 6, 4,11, 2, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 2, 2, 8,11, 4, 9,10, 4,10, 6,-1,-1,-1,-1],
        [ 3,11, 2, 0, 1, 6, 0, 6, 4, 6, 1,10,-1,-1,-1,-1],
        [ 6, 4, 1, 6, 1,10, 4, 8, 1, 2, 1,11, 8,11, 1,-1],
        [ 9, 6, 4, 9, 3, 6, 9, 1, 3,11, 6, 3,-1,-1,-1,-1],
        [ 8,11, 1, 8, 1, 0,11, 6, 1, 9, 1, 4, 6, 4, 1,-1],
        [ 3,11, 6, 3, 6, 0, 0, 6, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 6, 4, 8,11, 6, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 7,10, 6, 7, 8,10, 8, 9,10,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 7, 3, 0,10, 7, 0, 9,10, 6, 7,10,-1,-1,-1,-1],
        [10, 6, 7, 1,10, 7, 1, 7, 8, 1, 8, 0,-1,-1,-1,-1],
        [10, 6, 7,10, 7, 1, 1, 7, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7,-1,-1,-1,-1],
        [ 2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9,-1],
        [ 7, 8, 0, 7, 0, 6, 6, 0, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 3, 2, 6, 7, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 3,11,10, 6, 8,10, 8, 9, 8, 6, 7,-1,-1,-1,-1],
        [ 2, 0, 7, 2, 7,11, 0, 9, 7, 6, 7,10, 9,10, 7,-1],
        [ 1, 8, 0, 1, 7, 8, 1,10, 7, 6, 7,10, 2, 3,11,-1],
        [11, 2, 1,11, 1, 7,10, 6, 1, 6, 7, 1,-1,-1,-1,-1],
        [ 8, 9, 6, 8, 6, 7, 9, 1, 6,11, 6, 3, 1, 3, 6,-1],
        [ 0, 9, 1,11, 6, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 8, 0, 7, 0, 6, 3,11, 0,11, 6, 0,-1,-1,-1,-1],
        [ 7,11, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 8,11, 7, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1, 9,11, 7, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 1, 9, 8, 3, 1,11, 7, 6,-1,-1,-1,-1,-1,-1,-1],
        [10, 1, 2, 6,11, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 3, 0, 8, 6,11, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 9, 0, 2,10, 9, 6,11, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 6,11, 7, 2,10, 3,10, 8, 3,10, 9, 8,-1,-1,-1,-1],
        [ 7, 2, 3, 6, 2, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 7, 0, 8, 7, 6, 0, 6, 2, 0,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 7, 6, 2, 3, 7, 0, 1, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6,-1,-1,-1,-1],
        [10, 7, 6,10, 1, 7, 1, 3, 7,-1,-1,-1,-1,-1,-1,-1],
        [10, 7, 6, 1, 7,10, 1, 8, 7, 1, 0, 8,-1,-1,-1,-1],
        [ 0, 3, 7, 0, 7,10, 0,10, 9, 6,10, 7,-1,-1,-1,-1],
        [ 7, 6,10, 7,10, 8, 8,10, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 6, 8, 4,11, 8, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 6,11, 3, 0, 6, 0, 4, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 6,11, 8, 4, 6, 9, 0, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 4, 6, 9, 6, 3, 9, 3, 1,11, 3, 6,-1,-1,-1,-1],
        [ 6, 8, 4, 6,11, 8, 2,10, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 3, 0,11, 0, 6,11, 0, 4, 6,-1,-1,-1,-1],
        [ 4,11, 8, 4, 6,11, 0, 2, 9, 2,10, 9,-1,-1,-1,-1],
        [10, 9, 3,10, 3, 2, 9, 4, 3,11, 3, 6, 4, 6, 3,-1],
        [ 8, 2, 3, 8, 4, 2, 4, 6, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 4, 2, 4, 6, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8,-1,-1,-1,-1],
        [ 1, 9, 4, 1, 4, 2, 2, 4, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 1, 3, 8, 6, 1, 8, 4, 6, 6,10, 1,-1,-1,-1,-1],
        [10, 1, 0,10, 0, 6, 6, 0, 4,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 6, 3, 4, 3, 8, 6,10, 3, 0, 3, 9,10, 9, 3,-1],
        [10, 9, 4, 6,10, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 9, 5, 7, 6,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 4, 9, 5,11, 7, 6,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 0, 1, 5, 4, 0, 7, 6,11,-1,-1,-1,-1,-1,-1,-1],
        [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5,-1,-1,-1,-1],
        [ 9, 5, 4,10, 1, 2, 7, 6,11,-1,-1,-1,-1,-1,-1,-1],
        [ 6,11, 7, 1, 2,10, 0, 8, 3, 4, 9, 5,-1,-1,-1,-1],
        [ 7, 6,11, 5, 4,10, 4, 2,10, 4, 0, 2,-1,-1,-1,-1],
        [ 3, 4, 8, 3, 5, 4, 3, 2, 5,10, 5, 2,11, 7, 6,-1],
        [ 7, 2, 3, 7, 6, 2, 5, 4, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7,-1,-1,-1,-1],
        [ 3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0,-1,-1,-1,-1],
        [ 6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8,-1],
        [ 9, 5, 4,10, 1, 6, 1, 7, 6, 1, 3, 7,-1,-1,-1,-1],
        [ 1, 6,10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4,-1],
        [ 4, 0,10, 4,10, 5, 0, 3,10, 6,10, 7, 3, 7,10,-1],
        [ 7, 6,10, 7,10, 8, 5, 4,10, 4, 8,10,-1,-1,-1,-1],
        [ 6, 9, 5, 6,11, 9,11, 8, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 6,11, 0, 6, 3, 0, 5, 6, 0, 9, 5,-1,-1,-1,-1],
        [ 0,11, 8, 0, 5,11, 0, 1, 5, 5, 6,11,-1,-1,-1,-1],
        [ 6,11, 3, 6, 3, 5, 5, 3, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,10, 9, 5,11, 9,11, 8,11, 5, 6,-1,-1,-1,-1],
        [ 0,11, 3, 0, 6,11, 0, 9, 6, 5, 6, 9, 1, 2,10,-1],
        [11, 8, 5,11, 5, 6, 8, 0, 5,10, 5, 2, 0, 2, 5,-1],
        [ 6,11, 3, 6, 3, 5, 2,10, 3,10, 5, 3,-1,-1,-1,-1],
        [ 5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2,-1,-1,-1,-1],
        [ 9, 5, 6, 9, 6, 0, 0, 6, 2,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8,-1],
        [ 1, 5, 6, 2, 1, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 3, 6, 1, 6,10, 3, 8, 6, 5, 6, 9, 8, 9, 6,-1],
        [10, 1, 0,10, 0, 6, 9, 5, 0, 5, 6, 0,-1,-1,-1,-1],
        [ 0, 3, 8, 5, 6,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [10, 5, 6,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [11, 5,10, 7, 5,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [11, 5,10,11, 7, 5, 8, 3, 0,-1,-1,-1,-1,-1,-1,-1],
        [ 5,11, 7, 5,10,11, 1, 9, 0,-1,-1,-1,-1,-1,-1,-1],
        [10, 7, 5,10,11, 7, 9, 8, 1, 8, 3, 1,-1,-1,-1,-1],
        [11, 1, 2,11, 7, 1, 7, 5, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2,11,-1,-1,-1,-1],
        [ 9, 7, 5, 9, 2, 7, 9, 0, 2, 2,11, 7,-1,-1,-1,-1],
        [ 7, 5, 2, 7, 2,11, 5, 9, 2, 3, 2, 8, 9, 8, 2,-1],
        [ 2, 5,10, 2, 3, 5, 3, 7, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 2, 0, 8, 5, 2, 8, 7, 5,10, 2, 5,-1,-1,-1,-1],
        [ 9, 0, 1, 5,10, 3, 5, 3, 7, 3,10, 2,-1,-1,-1,-1],
        [ 9, 8, 2, 9, 2, 1, 8, 7, 2,10, 2, 5, 7, 5, 2,-1],
        [ 1, 3, 5, 3, 7, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 7, 0, 7, 1, 1, 7, 5,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 0, 3, 9, 3, 5, 5, 3, 7,-1,-1,-1,-1,-1,-1,-1],
        [ 9, 8, 7, 5, 9, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 8, 4, 5,10, 8,10,11, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 5, 0, 4, 5,11, 0, 5,10,11,11, 3, 0,-1,-1,-1,-1],
        [ 0, 1, 9, 8, 4,10, 8,10,11,10, 4, 5,-1,-1,-1,-1],
        [10,11, 4,10, 4, 5,11, 3, 4, 9, 4, 1, 3, 1, 4,-1],
        [ 2, 5, 1, 2, 8, 5, 2,11, 8, 4, 5, 8,-1,-1,-1,-1],
        [ 0, 4,11, 0,11, 3, 4, 5,11, 2,11, 1, 5, 1,11,-1],
        [ 0, 2, 5, 0, 5, 9, 2,11, 5, 4, 5, 8,11, 8, 5,-1],
        [ 9, 4, 5, 2,11, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 5,10, 3, 5, 2, 3, 4, 5, 3, 8, 4,-1,-1,-1,-1],
        [ 5,10, 2, 5, 2, 4, 4, 2, 0,-1,-1,-1,-1,-1,-1,-1],
        [ 3,10, 2, 3, 5,10, 3, 8, 5, 4, 5, 8, 0, 1, 9,-1],
        [ 5,10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2,-1,-1,-1,-1],
        [ 8, 4, 5, 8, 5, 3, 3, 5, 1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 4, 5, 1, 0, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5,-1,-1,-1,-1],
        [ 9, 4, 5,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4,11, 7, 4, 9,11, 9,10,11,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 8, 3, 4, 9, 7, 9,11, 7, 9,10,11,-1,-1,-1,-1],
        [ 1,10,11, 1,11, 4, 1, 4, 0, 7, 4,11,-1,-1,-1,-1],
        [ 3, 1, 4, 3, 4, 8, 1,10, 4, 7, 4,11,10,11, 4,-1],
        [ 4,11, 7, 9,11, 4, 9, 2,11, 9, 1, 2,-1,-1,-1,-1],
        [ 9, 7, 4, 9,11, 7, 9, 1,11, 2,11, 1, 0, 8, 3,-1],
        [11, 7, 4,11, 4, 2, 2, 4, 0,-1,-1,-1,-1,-1,-1,-1],
        [11, 7, 4,11, 4, 2, 8, 3, 4, 3, 2, 4,-1,-1,-1,-1],
        [ 2, 9,10, 2, 7, 9, 2, 3, 7, 7, 4, 9,-1,-1,-1,-1],
        [ 9,10, 7, 9, 7, 4,10, 2, 7, 8, 7, 0, 2, 0, 7,-1],
        [ 3, 7,10, 3,10, 2, 7, 4,10, 1,10, 0, 4, 0,10,-1],
        [ 1,10, 2, 8, 7, 4,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 9, 1, 4, 1, 7, 7, 1, 3,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1,-1,-1,-1,-1],
        [ 4, 0, 3, 7, 4, 3,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 4, 8, 7,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 9,10, 8,10,11, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 9, 3, 9,11,11, 9,10,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 1,10, 0,10, 8, 8,10,11,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 1,10,11, 3,10,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 2,11, 1,11, 9, 9,11, 8,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 0, 9, 3, 9,11, 1, 2, 9, 2,11, 9,-1,-1,-1,-1],
        [ 0, 2,11, 8, 0,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 3, 2,11,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 3, 8, 2, 8,10,10, 8, 9,-1,-1,-1,-1,-1,-1,-1],
        [ 9,10, 2, 0, 9, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 2, 3, 8, 2, 8,10, 0, 1, 8, 1,10, 8,-1,-1,-1,-1],
        [ 1,10, 2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 1, 3, 8, 9, 1, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 9, 1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [ 0, 3, 8,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]
    ];


}


///

function fgetOffset( fValue1, fValue2, fValueDesired ) {

    var fDelta = fValue2 - fValue1;

    if (fDelta == 0)
        return 0.5;

    return (fValueDesired - fValue1) / fDelta;
}

//vgetColor generates a color from a given position and normal of a point
function vgetColor( rfNormal ) {

    var fX = rfNormal[0];
    var fY = rfNormal[1];
    var fZ = rfNormal[2];

    return [
          ( (fX > 0 ? fX : 0) + (fY < 0 ? -0.5 * fY : 0.0) + (fZ < 0 ? -0.5 * fZ : 0) )
        , ( (fY > 0 ? fY : 0) + (fZ < 0 ? -0.5 * fZ : 0.0) + (fX < 0 ? -0.5 * fX : 0) )
        , ( (fZ > 0 ? fZ : 0) + (fX < 0 ? -0.5 * fX : 0.0) + (fY < 0 ? -0.5 * fY : 0) )
    ];
}

function vNormalizeVector( vec ) {

    var fOldLength = Math.sqrt( (vec[0] * vec[0]) + (vec[1] * vec[1]) + (vec[2] * vec[2]) );

    if (fOldLength == 0.0)
        return vec;

    var tmp_scale = 1.0 / fOldLength;

    return [
        vec[0] * tmp_scale,
        vec[1] * tmp_scale,
        vec[2] * tmp_scale
    ];
}

var proto = MarchingCube.prototype;

proto.getNormal = function( fX, fY, fZ ) {

    var step_dec = this.step_size * 0.1;

    var vec = [
        this.sample( fX - step_dec, fY, fZ ) - this.sample( fX + step_dec, fY, fZ ),
        this.sample( fX, fY - step_dec, fZ ) - this.sample( fX, fY + step_dec, fZ ),
        this.sample( fX, fY, fZ - step_dec ) - this.sample( fX, fY, fZ + step_dec )
    ];

    return vNormalizeVector( vec );
}

proto.getNormal2 = function( t1, t2, t3 ) {
 
    var Ux = t2[0] - t1[0];
    var Uy = t2[1] - t1[1];
    var Uz = t2[2] - t1[2];
    var Vx = t3[0] - t1[0];
    var Vy = t3[1] - t1[1];
    var Vz = t3[2] - t1[2];

    var normal2 = [
        Uy*Vz - Uz*Vy,
        Uz*Vx - Ux*Vz,
        Ux*Vy - Uy*Vx
    ];

    var len = Math.sqrt(
        normal2[0]*normal2[0]+
        normal2[1]*normal2[1]+
        normal2[2]*normal2[2]
    );

    return normal2
}

proto.marchCube = function( pos, geom_callback ) {

    this.current_geom_callback = geom_callback;

    for (var iX = 0; iX <= this.chunk_size; ++iX)
    for (var iY = 0; iY <= this.chunk_size; ++iY)
    for (var iZ = 0; iZ <= this.chunk_size; ++iZ)
        this.marchCube_single( pos[0] + iX, pos[1] + iY, pos[2] + iZ );
        // this.vMarchCube2( pos[0] + iX, pos[1] + iY, pos[2] + iZ );

    this.current_geom_callback = null;
}

proto.marchCube_single = function( iX, iY, iZ ) {

    var iCorner,
        iVertex,
        iVertexTest,
        iEdge,
        iTriangle,
        iFlagIndex,
        iEdgeFlags;

    var fOffset = 0.0;
    var afCubeValue = [ 0.0,0.0,0.0,0.0, 0.0,0.0,0.0,0.0 ];
    var asEdgeVertex =  [
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0]
    ];
    var asEdgeNorm =  [
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0]
    ];

    /// add chunk pos here
    var fX = iX * this.step_size,
        fY = iY * this.step_size,
        fZ = iZ * this.step_size;

    /// Make a local copy of the values at the cube's corners
    for (iVertex = 0; iVertex < 8; ++iVertex)
        afCubeValue[iVertex] = this.sample( fX + this.a2fVertexOffset[iVertex][0] * this.step_size,
                                            fY + this.a2fVertexOffset[iVertex][1] * this.step_size,
                                            fZ + this.a2fVertexOffset[iVertex][2] * this.step_size );

    //Find which vertices are inside of the surface and which are outside
    iFlagIndex = 0|0;
    for (iVertexTest = 0|0; iVertexTest < 8; ++iVertexTest)
        if (afCubeValue[iVertexTest] <= this.fTv)
            iFlagIndex |= (1 << iVertexTest);

    //Find which edges are intersected by the surface
    iEdgeFlags = this.aiCubeEdgeFlags[iFlagIndex];

    //If the cube is entirely inside or outside of the surface, then there will be no intersections
    if (iEdgeFlags == 0)
        return;

    //Find the point of intersection of the surface with each edge
    //Then find the normal to the surface at those points
    for (iEdge = 0; iEdge < 12; ++iEdge) {

        //if there is an intersection on this edge
        if (iEdgeFlags & (1 << iEdge)) {

            fOffset = fgetOffset(
                afCubeValue[ this.a2iEdgeConnection[iEdge][0] ],
                afCubeValue[ this.a2iEdgeConnection[iEdge][1] ],
                this.fTv
            );

            asEdgeVertex[iEdge][0] = fX + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][0] + fOffset * this.a2fEdgeDirection[iEdge][0] ) * this.step_size;
            asEdgeVertex[iEdge][1] = fY + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][1] + fOffset * this.a2fEdgeDirection[iEdge][1] ) * this.step_size;
            asEdgeVertex[iEdge][2] = fZ + ( this.a2fVertexOffset[ this.a2iEdgeConnection[iEdge][0] ][2] + fOffset * this.a2fEdgeDirection[iEdge][2] ) * this.step_size;

            asEdgeNorm[iEdge] = this.getNormal( asEdgeVertex[iEdge][0], asEdgeVertex[iEdge][1], asEdgeVertex[iEdge][2] );
        }
    }


    //Draw the triangles that were found.  There can be up to five per cube
    for (iTriangle = 0; iTriangle < 5; ++iTriangle) {

        if (this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle ] < 0)
            break;



        for (var iCorner = 0; iCorner < 3; ++iCorner) {

            iVertex = this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle + iCorner ];

            var color = vgetColor( asEdgeNorm[iVertex] );

            //

            var vertex = [
                asEdgeVertex[iVertex][0] * this.chunk_size,
                asEdgeVertex[iVertex][1] * this.chunk_size,
                asEdgeVertex[iVertex][2] * this.chunk_size
            ];

            var normal = asEdgeNorm[iVertex];

            //

            if (this.current_geom_callback)
                this.current_geom_callback( vertex, color, normal );

        } // for (iCorner = [...]



        // var t_positions = [];
        // var t_colors = [];


        // for (var iCorner = 0; iCorner < 3; ++iCorner) {

        //  iVertex = this.a2iTriangleConnectionTable[ iFlagIndex ][ 3 * iTriangle + iCorner ];

        //  // var color = vgetColor( asEdgeNorm[iVertex] );

        //  //

        //  var vertex = [
        //      asEdgeVertex[iVertex][0] * this.chunk_size,
        //      asEdgeVertex[iVertex][1] * this.chunk_size,
        //      asEdgeVertex[iVertex][2] * this.chunk_size
        //  ];

        //  //

        //  t_positions.push(vertex)
        //  // t_colors.push(color)

        // } // for (iCorner = [...]

        // var t_normal = this.getNormal2( t_positions[0], t_positions[1], t_positions[2] );
        // var t_color = vgetColor( t_normal );
        // // console.log(t_normal);

        // for (var i = 0; i < 3; ++i) {


        //  if (this.current_geom_callback)
        //      // this.current_geom_callback( t_positions[i], t_colors[i], t_normal );
        //      this.current_geom_callback( t_positions[i], t_color, t_normal );

        // } // for (iCorner = [...]



    } // for (iTriangle = [...]

}




























proto.vMarchCube2 = function(iX, iY, iZ) {

    /// add chunk pos here
    var fX = iX * this.step_size,
        fY = iY * this.step_size,
        fZ = iZ * this.step_size;

    var asCubePosition = [
        [0,0,0],[0,0,0],[0,0,0],[0,0,0],
        [0,0,0],[0,0,0],[0,0,0],[0,0,0]
    ];

    // Make a local copy of the cube's corner positions
    for (var iVertex = 0; iVertex < 8; iVertex++)
    {
        asCubePosition[iVertex][0] = fX + this.a2fVertexOffset[iVertex][0]*this.step_size;
        asCubePosition[iVertex][1] = fY + this.a2fVertexOffset[iVertex][1]*this.step_size;
        asCubePosition[iVertex][2] = fZ + this.a2fVertexOffset[iVertex][2]*this.step_size;
    }

    var  afCubeValue = [0,0,0,0,0,0,0,0];

    // Make a local copy of the cube's corner values
    for (var iVertex = 0; iVertex < 8; iVertex++)
        afCubeValue[iVertex] = this.sample( asCubePosition[iVertex][0],
                                            asCubePosition[iVertex][1],
                                            asCubePosition[iVertex][2]);

    var asTetrahedronPosition =  [ [0,0,0],[0,0,0],[0,0,0],[0,0,0] ];
    var afTetrahedronValue = [0,0,0,0];

    for (var iTetrahedron = 0; iTetrahedron < 6; iTetrahedron++)
    {
        for(var iVertex = 0; iVertex < 4; iVertex++)
        {
            var iVertexInACube = this.a2iTetrahedronsInACube[iTetrahedron][iVertex];

            asTetrahedronPosition[iVertex][0] = asCubePosition[iVertexInACube][0];
            asTetrahedronPosition[iVertex][1] = asCubePosition[iVertexInACube][1];
            asTetrahedronPosition[iVertex][2] = asCubePosition[iVertexInACube][2];

            afTetrahedronValue[iVertex] = afCubeValue[iVertexInACube];
        }

        this.vMarchTetrahedron( asTetrahedronPosition, afTetrahedronValue );
    }
}

proto.vMarchTetrahedron = function(pasTetrahedronPosition, pafTetrahedronValue) {

    var iEdge, iVert0, iVert1, iEdgeFlags, iTriangle, iCorner, iVertex, iFlagIndex = 0;
    var fOffset, fInvOffset, fValue = 0.0;
    var asEdgeVertex = [ [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0] ];
    var asEdgeNorm = [ [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0], [0,0,0] ];
    var sColor = [0,0,0];

    //Find which vertices are inside of the surface and which are outside
    for (iVertex = 0; iVertex < 4; iVertex++)
    {
        if(pafTetrahedronValue[iVertex] <= this.fTv) 
            iFlagIndex |= 1<<iVertex;
    }

    //Find which edges are intersected by the surface
    iEdgeFlags = this.aiTetrahedronEdgeFlags[iFlagIndex];

    //If the tetrahedron is entirely inside or outside of the surface, then there will be no intersections
    if (iEdgeFlags == 0)
        return;

    for (iEdge = 0; iEdge < 6; iEdge++)
    {
        if (iEdgeFlags & (1<<iEdge))
        {
            iVert0 = this.a2iTetrahedronEdgeConnection[iEdge][0];
            iVert1 = this.a2iTetrahedronEdgeConnection[iEdge][1];
            fOffset = fgetOffset(
                pafTetrahedronValue[iVert0],
                pafTetrahedronValue[iVert1],
                this.fTv
            );
            fInvOffset = 1.0 - fOffset;

            asEdgeVertex[iEdge][0] = fInvOffset*pasTetrahedronPosition[iVert0][0]  +  fOffset*pasTetrahedronPosition[iVert1][0];
            asEdgeVertex[iEdge][1] = fInvOffset*pasTetrahedronPosition[iVert0][1]  +  fOffset*pasTetrahedronPosition[iVert1][1];
            asEdgeVertex[iEdge][2] = fInvOffset*pasTetrahedronPosition[iVert0][2]  +  fOffset*pasTetrahedronPosition[iVert1][2];

            asEdgeNorm[iEdge] = this.getNormal( asEdgeVertex[iEdge][0], asEdgeVertex[iEdge][1], asEdgeVertex[iEdge][2] );
        }
    }

    for (iTriangle = 0; iTriangle < 2; iTriangle++)
    {
        if (this.a2iTetrahedronTriangles[iFlagIndex][3*iTriangle] < 0)
            break;


        for (iCorner = 0; iCorner < 3; iCorner++)
        {
            iVertex = this.a2iTetrahedronTriangles[iFlagIndex][3*iTriangle+iCorner];

            var color = vgetColor( asEdgeNorm[iVertex] );

            var vertex = [
                asEdgeVertex[iVertex][0] * this.chunk_size,
                asEdgeVertex[iVertex][1] * this.chunk_size,
                asEdgeVertex[iVertex][2] * this.chunk_size
                // asEdgeVertex[iVertex][0],
                // asEdgeVertex[iVertex][1],
                // asEdgeVertex[iVertex][2]
            ];

            var normal = asEdgeNorm[iVertex];

            if (this.current_geom_callback)
                this.current_geom_callback( vertex, color, normal );

        }
    }
}



module.exports = MarchingCube

},{}],7:[function(require,module,exports){

"use strict"

var Randomiser = function() {

    this.RAND_MAX = 2147483648|0;

    this.s_seed = 1|0;
}

//

var proto = Randomiser.prototype;

proto.random = function() {

    var hi,lo,x;

    if (this.s_seed == 0)
        this.s_seed = 123459876;

    hi = (this.s_seed / 127773)|0;
    lo = (this.s_seed % 127773)|0;
    x = (16807 * lo - 2836 * hi)|0;

    if (x < 0)
        x += 0x7fffffff;

    this.s_seed = x;

    var tmp_value = ( x % (this.RAND_MAX + 1) )|0;

    return (tmp_value / -this.RAND_MAX);
};

proto.srandom = function(seed) {
    this.s_seed = seed|0;
}

//

module.exports = Randomiser

},{}],8:[function(require,module,exports){

"use strict"

var g_data = require('./data/index.js');

require('./utils/fpsmeter.js'); // <- in window.FPSMeter

class WebGLExperiment {

    constructor() {

        var self = this;


        g_data.arr_touches = [];
        g_data.logic = {};

        g_data._force_forward = false;

        g_data.logic.k_chunk_size = 15;
        var createChunkGenerator = require('./generation/ChunkGenerator.js');
        g_data.logic.ChunkGenerator = new createChunkGenerator();

        //

        //







        //
        //
        // GUI (touch supported indicator)

        if ('ontouchstart' in window) {
            document.getElementById("touch_id").innerHTML += 'Supported';
        } else {
            document.getElementById("touch_id").innerHTML += 'Not Supported';
        }

        // GUI (touch supported indicator)
        //
        //





        //
        // FPS METER

        var myFpsmeter_elem = document.getElementById('fpsmeter');
        this.myFpsmeter = new window.FPSMeter(
            myFpsmeter_elem,
            window.FPSMeter.theme.transparent
        );

        // FPS METER
        //



        //
        //
        // HUD (touch positions recorder)

        var elem = document.getElementById("canvasesdiv");

        function update_touches(e) { try{

            var touches = e.targetTouches;

            g_data.arr_touches.length = 0; // clear array
            for (var i = 0; i < touches.length; ++i)
                g_data.arr_touches.push({ x:touches[i].pageX, y:touches[i].pageY });

        }catch(e){alert(e);} }

        elem.addEventListener('touchstart', update_touches);
        elem.addEventListener('touchend', function(e) {g_data.arr_touches.length = 0;}); // clear array
        elem.addEventListener('touchmove', update_touches);

        // HUD (touch positions recorder)
        //
        //




        //

        // const createRendererCanvas = require('./rendererCanvas/index.js');
        // this.RendererCanvas = new createRendererCanvas();

        //

        var createRendererWebGL = require('./rendererWebGL/index.js');

        this.RendererWebGL = new createRendererWebGL();

        g_data.chunk_is_visible = function(pos)
        {
            return self.RendererWebGL.chunk_is_visible(pos);
        }

        g_data.point_is_visible = function(pos)
        {
            return self.RendererWebGL.point_is_visible(pos);
        }

        g_data.add_geom = function(buffer)
        {
            return self.RendererWebGL.add_geom(buffer);
        }

        g_data.update_geom = function(geom, buffer)
        {
            return self.RendererWebGL.update_geom(geom, buffer);
        }








        //
        //
        // GUI (fullscreen button)

        var gui_fullscreen = document.getElementById("gui_fullscreen");
        gui_fullscreen.addEventListener('click', function () {

            // self.RendererWebGL.toggle_context_loss();

            var elem = document.getElementById("canvasesdiv");

            // go full-screen
            if (elem.requestFullscreen)
                elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen)
                elem.webkitRequestFullscreen();
            else if (elem.mozRequestFullScreen)
                elem.mozRequestFullScreen();
            else if (elem.msRequestFullscreen)
                elem.msRequestFullscreen();
        });

        function on_fullscreen_change() {

            var elem = document.getElementById("canvasesdiv");
            var canvas = document.getElementById("main-canvas");
            var s_canvas = document.getElementById("second-canvas");

            var tmp_width = null;
            var tmp_height = null;

            if (document.fullscreen ||
                document.mozFullScreen ||
                document.webkitIsFullScreen ||
                document.msFullscreenElement)
            {
                elem.style.position = "absolute";

                tmp_width = window.innerWidth;
                tmp_height = window.innerHeight;
            }
            else
            {
                elem.style.position = "relative";

                tmp_width = 800;
                tmp_height = 600;
            }

            elem.style.left = "0px";
            elem.style.top = "0px";

            canvas.width = s_canvas.width = tmp_width;
            canvas.height = s_canvas.height = tmp_height;

            self.RendererWebGL.resize(tmp_width, tmp_height);
            // self.RendererCanvas.resize(tmp_width, tmp_height);
        }

        document.addEventListener('fullscreenchange',       on_fullscreen_change, false);
        document.addEventListener('mozfullscreenchange',    on_fullscreen_change, false);
        document.addEventListener('webkitfullscreenchange', on_fullscreen_change, false);
        document.addEventListener('msfullscreenchange',     on_fullscreen_change, false);

        // GUI (fullscreen button)
        //
        //






        this._running = false;
        self._error_gcontext = false;


        this.RendererWebGL.set_on_context_lost(function ()
        {
            console.log('on_context_lost');

            self._error_gcontext = true;
            self.stop();
        });

        this.RendererWebGL.set_on_context_restored(function ()
        {
            console.log('on_context_restored');

            self._error_gcontext = false;
            self.start();
        });

    }


    start() {

        if (this.isRunning())
            return;

        var self = this;
        this.RendererWebGL.init(function()
        {
            self._running = true;

            g_data.logic.ChunkGenerator.start();

            self._tick();
        });
    }

    stop() {
        this._running = false;
        g_data.logic.ChunkGenerator.stop();
    }

    isRunning() {
        return (this._running && !this._error_gcontext);
    }

    //
    //
    //

    _tick() {
        var self = this;
        function tick()
        {
            if (!self._running || self._error_gcontext)
                return;

            self._main_loop();

            // plan the next frame
            window.requestAnimFrame( tick ); // webgl-utils.js
        }

        tick();
    }

    _main_loop() {

        this.myFpsmeter.tickStart();




        //
        //
        ////// generation

        var camera_pos = this.RendererWebGL.getCameraPosition();

        g_data.logic.ChunkGenerator.update(camera_pos);

        ////// /generation
        //
        //



        this.RendererWebGL.update();

        // for touch events rendering
        g_data._force_forward = this.RendererWebGL.FreeFlyCamera._force_forward;



        //
        //
        ////// render 3d scene

        this.RendererWebGL.render();

        //
        //
        ////// HUD

        this.RendererWebGL.renderHUD();

        // this.RendererCanvas.render();


        this.myFpsmeter.tick();
    }
};

module.exports = WebGLExperiment;

},{"./data/index.js":2,"./generation/ChunkGenerator.js":3,"./rendererWebGL/index.js":19,"./utils/fpsmeter.js":25}],9:[function(require,module,exports){

"use strict"

var glm = require('../utils/gl-matrix-2.3.2.min.js');
var createKeyboardHandler = require('./helpers/KeyboardHandler.js');
var handle_pointerLock = require('./helpers/pointerLock.js');


var FreeFlyCamera = function () {

    this._phi = 0;
    this._theta = 0;

    this._Forward = [1,0,0];
    this._Left = [0,0,0];
    this._Position = [0,0,0];
    this._Target = [0,0,0];

    this._movementFlag = 0;

    this._keybrdHdl = new createKeyboardHandler();

    this._force_forward = false;


    var self = this;




    ///
    /// MOUSE
    ///

    var canvas = document.getElementById("canvasesdiv");
    handle_pointerLock(canvas, callback_mouse_locked, callback_mouse_unlocked);

    //

    function callback_mouse_locked() {
        canvas.addEventListener('mousemove', callback_mousemove, false);
    }

    function callback_mouse_unlocked() {
        canvas.removeEventListener('mousemove', callback_mousemove, false);
    }

    function callback_mousemove(e) {

        var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        var movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

        // console.log('Mouse movement: ' + movementX + ',' + movementY);

        self._theta -= movementX / 5.0;
        self._phi   -= movementY / 5.0;
    }

    ///
    /// /MOUSE
    ///



    ///
    /// TOUCH
    ///

    try {

        var elem = document.getElementById("canvasesdiv");

        var previous_touch = null;
        var previous_distance = null;

        var saved_time = null;

        elem.addEventListener('touchstart', function(e) { try{

            e.preventDefault();

            previous_touch = null;
            previous_distance = null;

            var tmp_time = Date.now();

            if (e.targetTouches.length == 1 &&
                saved_time &&
                (tmp_time - saved_time) < 250)
            {
                self._force_forward = true;
            }

            saved_time = tmp_time;

        }catch(e){alert(e);} });

        elem.addEventListener('touchend', function(e) { try{

            e.preventDefault();

            previous_touch = null;
            previous_distance = null;

            // saved_time = null;
            self._force_forward = false;

        }catch(e){alert(e);} });

        elem.addEventListener('touchmove', function (e) { try{

            e.preventDefault();

            var touches = e.targetTouches;

            if (touches.length == 0 || touches.length > 2)
                return;

            if (touches.length == 2)
            {
                var x1 = touches[0].pageX-touches[1].pageX;
                var y1 = touches[0].pageY-touches[1].pageY;

                var length = Math.sqrt(x1*x1 + y1*y1);

                if (previous_distance)
                {
                    if (length > previous_distance)
                        self._movementFlag |= 1<<0; // forward
                    else
                        self._movementFlag |= 1<<1; // backward
                }

                previous_distance = length;
            }
            else
            {
                if (previous_touch)
                {
                    var step_x = previous_touch.pageX - touches[0].pageX;
                    var step_y = previous_touch.pageY - touches[0].pageY;
                    self._theta -= (step_x / 5.0);
                    self._phi   -= (step_y / 5.0);
                }

                previous_touch = touches[0];
            }

        }catch(e){alert(e);} });

        //          

    } catch (e) {
        alert('TOUCH='+JSON.stringify(e));
    }

    ///
    /// /TOUCH
    ///

}

//

var proto = FreeFlyCamera.prototype

proto.update = function (elapsed_sec) {

    this.handleKeys();

    var speed = 16;

    if      (this._movementFlag & 1<<0 || this._force_forward == true)
    {
        for (var i = 0; i < 3; ++i)
            this._Position[i] += this._Forward[i] * elapsed_sec * speed;
    }
    else if (this._movementFlag & 1<<1)
    {
        for (var i = 0; i < 3; ++i)
            this._Position[i] -= this._Forward[i] * elapsed_sec * speed;
    }


    if      (this._movementFlag & 1<<2)
    {
        for (var i = 0; i < 3; ++i)
            this._Position[i] -= this._Left[i] * elapsed_sec * speed;
    }
    else if (this._movementFlag & 1<<3)
    {
        for (var i = 0; i < 3; ++i)
            this._Position[i] += this._Left[i] * elapsed_sec * speed;
    }


    this._movementFlag = 0;



    

    this._phi = Math.max(Math.min(this._phi, 89), -89)

    var Up = [0,0,1];

    var upRadius = Math.cos((this._phi - 90) * 3.14 / 180);
    Up[2] = Math.sin( (this._phi - 90) * 3.14 / 180);
    Up[0] = upRadius * Math.cos(this._theta * 3.14 / 180);
    Up[1] = upRadius * Math.sin(this._theta * 3.14 / 180);

    var forwardRadius = Math.cos(this._phi * 3.14 / 180);
    this._Forward[2] = Math.sin(this._phi * 3.14 / 180);
    this._Forward[0] = forwardRadius * Math.cos(this._theta * 3.14 / 180);
    this._Forward[1] = forwardRadius * Math.sin(this._theta * 3.14 / 180);

    this._Left[0] = Up[1] * this._Forward[2] - Up[2] * this._Forward[1];
    this._Left[1] = Up[2] * this._Forward[0] - Up[0] * this._Forward[2];
    this._Left[2] = Up[0] * this._Forward[1] - Up[1] * this._Forward[0];

    this._Target[0] = this._Position[0] + this._Forward[0];
    this._Target[1] = this._Position[1] + this._Forward[1];
    this._Target[2] = this._Position[2] + this._Forward[2];

}

//

proto.updateViewMatrix = function (viewMatrix) {

    glm.mat4.lookAt( viewMatrix, this._Position, this._Target, [0,0,1] );
}

//

proto.setPosition = function (x, y, z) {
    this._Position[0] = x;
    this._Position[1] = y;
    this._Position[2] = z;
}



///
///
///
/// KEYBOARD

proto.handleKeys = function() { try{

    // forward
    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_Z ) ||
        this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_W ))
        this._movementFlag |= 1<<0

    // backward
    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_S ))
        this._movementFlag |= 1<<1

    // strafe left
    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_A ) ||
        this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_Q ))
        this._movementFlag |= 1<<2

    // strafe right
    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.KEY_D ))
        this._movementFlag |= 1<<3

    /// /// ///

    // look up
    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_UP ))
        this._phi++;

    // look down
    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_DOWN ))
        this._phi--;

    // look left
    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_LEFT ))
        this._theta++;

    // look right
    if (this._keybrdHdl.isPressed( this._keybrdHdl.keyCodes.ARROW_RIGHT ))
        this._theta--;

}catch(err){alert(err);} }


proto.activate    = function () {

    this._keybrdHdl.activate();
}

proto.deactivate  = function () {

    this._keybrdHdl.deactivate();
}

/// KEYBOARD
///
///
///

module.exports = FreeFlyCamera;

},{"../utils/gl-matrix-2.3.2.min.js":23,"./helpers/KeyboardHandler.js":12,"./helpers/pointerLock.js":13}],10:[function(require,module,exports){

"use strict"

var FrustumCulling = function() {

    this.e_FrustumSide = { eRight : 0, eLeft : 1, eBottom : 2, eTop : 3, eBack : 4, eFront : 5 };
    this.e_PlaneData = { eA : 0, eB : 1, eC : 2, eD : 3 };
    this._Frustum = new Float32Array(24); // 6 * 4 values
}

//

var proto = FrustumCulling.prototype;

proto.normalizePlane = function (side) {

    var index = side * 4;

    var magnitude = Math.sqrt(
        this._Frustum[index + this.e_PlaneData.eA] * this._Frustum[index + this.e_PlaneData.eA] +
        this._Frustum[index + this.e_PlaneData.eB] * this._Frustum[index + this.e_PlaneData.eB] +
        this._Frustum[index + this.e_PlaneData.eC] * this._Frustum[index + this.e_PlaneData.eC]
    );

    this._Frustum[index + this.e_PlaneData.eA] /= magnitude;
    this._Frustum[index + this.e_PlaneData.eB] /= magnitude;
    this._Frustum[index + this.e_PlaneData.eC] /= magnitude;
    this._Frustum[index + this.e_PlaneData.eD] /= magnitude;
}

proto.calculateFrustum = function ( proj, modl ) {

    var clip = new Float32Array(16);

    clip[ 0] = modl[ 0] * proj[ 0] + modl[ 1] * proj[ 4] + modl[ 2] * proj[ 8] + modl[ 3] * proj[12];
    clip[ 1] = modl[ 0] * proj[ 1] + modl[ 1] * proj[ 5] + modl[ 2] * proj[ 9] + modl[ 3] * proj[13];
    clip[ 2] = modl[ 0] * proj[ 2] + modl[ 1] * proj[ 6] + modl[ 2] * proj[10] + modl[ 3] * proj[14];
    clip[ 3] = modl[ 0] * proj[ 3] + modl[ 1] * proj[ 7] + modl[ 2] * proj[11] + modl[ 3] * proj[15];

    clip[ 4] = modl[ 4] * proj[ 0] + modl[ 5] * proj[ 4] + modl[ 6] * proj[ 8] + modl[ 7] * proj[12];
    clip[ 5] = modl[ 4] * proj[ 1] + modl[ 5] * proj[ 5] + modl[ 6] * proj[ 9] + modl[ 7] * proj[13];
    clip[ 6] = modl[ 4] * proj[ 2] + modl[ 5] * proj[ 6] + modl[ 6] * proj[10] + modl[ 7] * proj[14];
    clip[ 7] = modl[ 4] * proj[ 3] + modl[ 5] * proj[ 7] + modl[ 6] * proj[11] + modl[ 7] * proj[15];

    clip[ 8] = modl[ 8] * proj[ 0] + modl[ 9] * proj[ 4] + modl[10] * proj[ 8] + modl[11] * proj[12];
    clip[ 9] = modl[ 8] * proj[ 1] + modl[ 9] * proj[ 5] + modl[10] * proj[ 9] + modl[11] * proj[13];
    clip[10] = modl[ 8] * proj[ 2] + modl[ 9] * proj[ 6] + modl[10] * proj[10] + modl[11] * proj[14];
    clip[11] = modl[ 8] * proj[ 3] + modl[ 9] * proj[ 7] + modl[10] * proj[11] + modl[11] * proj[15];

    clip[12] = modl[12] * proj[ 0] + modl[13] * proj[ 4] + modl[14] * proj[ 8] + modl[15] * proj[12];
    clip[13] = modl[12] * proj[ 1] + modl[13] * proj[ 5] + modl[14] * proj[ 9] + modl[15] * proj[13];
    clip[14] = modl[12] * proj[ 2] + modl[13] * proj[ 6] + modl[14] * proj[10] + modl[15] * proj[14];
    clip[15] = modl[12] * proj[ 3] + modl[13] * proj[ 7] + modl[14] * proj[11] + modl[15] * proj[15];

    ///

    var index = this.e_FrustumSide.eRight * 4;
    this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] - clip[ 0];
    this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] - clip[ 4];
    this._Frustum[index + this.e_PlaneData.eC] = clip[11] - clip[ 8];
    this._Frustum[index + this.e_PlaneData.eD] = clip[15] - clip[12];
    this.normalizePlane(this.e_FrustumSide.eRight);

    var index = this.e_FrustumSide.eLeft * 4;
    this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] + clip[ 0];
    this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] + clip[ 4];
    this._Frustum[index + this.e_PlaneData.eC] = clip[11] + clip[ 8];
    this._Frustum[index + this.e_PlaneData.eD] = clip[15] + clip[12];
    this.normalizePlane(this.e_FrustumSide.eLeft);


    var index = this.e_FrustumSide.eBottom * 4;
    this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] + clip[ 1];
    this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] + clip[ 5];
    this._Frustum[index + this.e_PlaneData.eC] = clip[11] + clip[ 9];
    this._Frustum[index + this.e_PlaneData.eD] = clip[15] + clip[13];
    this.normalizePlane(this.e_FrustumSide.eBottom);

    var index = this.e_FrustumSide.eTop * 4;
    this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] - clip[ 1];
    this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] - clip[ 5];
    this._Frustum[index + this.e_PlaneData.eC] = clip[11] - clip[ 9];
    this._Frustum[index + this.e_PlaneData.eD] = clip[15] - clip[13];
    this.normalizePlane(this.e_FrustumSide.eTop);


    var index = this.e_FrustumSide.eBack * 4;
    this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] - clip[ 2];
    this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] - clip[ 6];
    this._Frustum[index + this.e_PlaneData.eC] = clip[11] - clip[10];
    this._Frustum[index + this.e_PlaneData.eD] = clip[15] - clip[14];
    this.normalizePlane(this.e_FrustumSide.eBack);

    var index = this.e_FrustumSide.eFront * 4;
    this._Frustum[index + this.e_PlaneData.eA] = clip[ 3] + clip[ 2];
    this._Frustum[index + this.e_PlaneData.eB] = clip[ 7] + clip[ 6];
    this._Frustum[index + this.e_PlaneData.eC] = clip[11] + clip[10];
    this._Frustum[index + this.e_PlaneData.eD] = clip[15] + clip[14];
    this.normalizePlane(this.e_FrustumSide.eFront);
}

proto.pointInFrustum = function ( x, y, z )
{
    for (var i = 0; i < 6; ++i)
        if (this._Frustum[i * 4 + this.e_PlaneData.eA] * x +
            this._Frustum[i * 4 + this.e_PlaneData.eB] * y +
            this._Frustum[i * 4 + this.e_PlaneData.eC] * z +
            this._Frustum[i * 4 + this.e_PlaneData.eD] <= 0)
            return false;

    return true;
}

proto.sphereInFrustum = function ( x, y, z, radius )
{
    for (var i = 0; i < 6; ++i)
        if (this._Frustum[i * 4 + this.e_PlaneData.eA] * x +
            this._Frustum[i * 4 + this.e_PlaneData.eB] * y +
            this._Frustum[i * 4 + this.e_PlaneData.eC] * z +
            this._Frustum[i * 4 + this.e_PlaneData.eD] <= 0)
            return false;

    return true;
}


proto.cubeInFrustum = function ( x, y, z, size ) {

    for (var i = 0; i < 6; ++i) {

        var index = i * 4;

        if (this._Frustum[index + this.e_PlaneData.eA] * (x - size) +
            this._Frustum[index + this.e_PlaneData.eB] * (y - size) +
            this._Frustum[index + this.e_PlaneData.eC] * (z - size) +
            this._Frustum[index + this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[index + this.e_PlaneData.eA] * (x + size) +
            this._Frustum[index + this.e_PlaneData.eB] * (y - size) +
            this._Frustum[index + this.e_PlaneData.eC] * (z - size) +
            this._Frustum[index + this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[index + this.e_PlaneData.eA] * (x - size) +
            this._Frustum[index + this.e_PlaneData.eB] * (y + size) +
            this._Frustum[index + this.e_PlaneData.eC] * (z - size) +
            this._Frustum[index + this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[index + this.e_PlaneData.eA] * (x + size) +
            this._Frustum[index + this.e_PlaneData.eB] * (y + size) +
            this._Frustum[index + this.e_PlaneData.eC] * (z - size) +
            this._Frustum[index + this.e_PlaneData.eD] > 0)
            continue;

        ///

        if (this._Frustum[index + this.e_PlaneData.eA] * (x - size) +
            this._Frustum[index + this.e_PlaneData.eB] * (y - size) +
            this._Frustum[index + this.e_PlaneData.eC] * (z + size) +
            this._Frustum[index + this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[index + this.e_PlaneData.eA] * (x + size) +
            this._Frustum[index + this.e_PlaneData.eB] * (y - size) +
            this._Frustum[index + this.e_PlaneData.eC] * (z + size) +
            this._Frustum[index + this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[index + this.e_PlaneData.eA] * (x - size) +
            this._Frustum[index + this.e_PlaneData.eB] * (y + size) +
            this._Frustum[index + this.e_PlaneData.eC] * (z + size) +
            this._Frustum[index + this.e_PlaneData.eD] > 0)
            continue;

        if (this._Frustum[index + this.e_PlaneData.eA] * (x + size) +
            this._Frustum[index + this.e_PlaneData.eB] * (y + size) +
            this._Frustum[index + this.e_PlaneData.eC] * (z + size) +
            this._Frustum[index + this.e_PlaneData.eD] > 0)
            continue;

        return false;
    }

    return true;
}

module.exports = FrustumCulling;

},{}],11:[function(require,module,exports){

"use strict"

// https://www.opengl.org/wiki/GluProject_and_gluUnProject_code


function glhProject( objx, objy, objz, modelview, projection, arr_viewport )
{
    //Transformation vectors
    var fTempo = [];

    //Modelview transform
    fTempo[0]=modelview[0]*objx+modelview[4]*objy+modelview[8]*objz+modelview[12];  //w is always 1
    fTempo[1]=modelview[1]*objx+modelview[5]*objy+modelview[9]*objz+modelview[13];
    fTempo[2]=modelview[2]*objx+modelview[6]*objy+modelview[10]*objz+modelview[14];
    fTempo[3]=modelview[3]*objx+modelview[7]*objy+modelview[11]*objz+modelview[15];

    //Projection transform, the final row of projection matrix is always [0 0 -1 0]
    //so we optimize for that.
    fTempo[4]=projection[0]*fTempo[0]+projection[4]*fTempo[1]+projection[8]*fTempo[2]+projection[12]*fTempo[3];
    fTempo[5]=projection[1]*fTempo[0]+projection[5]*fTempo[1]+projection[9]*fTempo[2]+projection[13]*fTempo[3];
    fTempo[6]=projection[2]*fTempo[0]+projection[6]*fTempo[1]+projection[10]*fTempo[2]+projection[14]*fTempo[3];
    fTempo[7]=-fTempo[2];

    //The result normalizes between -1 and 1
    if (fTempo[7]==0.0) //The w value
        return null;

    fTempo[7]=1.0/fTempo[7];
    //Perspective division
    fTempo[4]*=fTempo[7];
    fTempo[5]*=fTempo[7];
    fTempo[6]*=fTempo[7];

    //Window coordinates
    //Map x, y to range 0-1
    return [
        (fTempo[4]*0.5+0.5)*arr_viewport[2]+arr_viewport[0],
        (fTempo[5]*0.5+0.5)*arr_viewport[3]+arr_viewport[1]
    ];
}

module.exports = glhProject;

},{}],12:[function(require,module,exports){

"use strict"

function KeyboardHandler(){

    this.keyCodes = {
          KEY_Z : 90, KEY_W : 87
        , KEY_S : 83
        , KEY_A : 65, KEY_Q : 81
        , KEY_D : 68

        , ARROW_LEFT  : 37
        , ARROW_RIGHT : 39
        , ARROW_UP    : 38
        , ARROW_DOWN  : 40
    };

    this._pressedKeys = {};       

    function handleKeyDown(event) {
        this._pressedKeys[event.keyCode] = true;
    }
    function handleKeyUp(event) {
        this._pressedKeys[event.keyCode] = false;
    }

    this._activated = false;
    this._handleKeyDown = handleKeyDown.bind(this);
    this._handleKeyUp   = handleKeyUp.bind(this);
}

//

var proto = KeyboardHandler.prototype;

proto.isPressed = function (code) {

    return this._pressedKeys[code];
}

//

proto.activate = function () {

    if (this._activated)
        return;

    document.addEventListener('keydown',    this._handleKeyDown);
    document.addEventListener('keyup',      this._handleKeyUp);

    this._activated = true;
}

proto.deactivate = function () {

    if (!this._activated)
        return;

    document.removeEventListener('keydown',    this._handleKeyDown);
    document.removeEventListener('keyup',      this._handleKeyUp);

    this._activated = false;
}

module.exports = KeyboardHandler;

},{}],13:[function(require,module,exports){

"use strict"

function handle_pointerLock (canvas, cb_enabled, cb_disabled, cb_error) {

    //
    //
    // // // POINTER LOCK

    canvas.requestPointerLock = canvas.requestPointerLock ||
                                canvas.mozRequestPointerLock ||
                                canvas.webkitRequestPointerLock;

    document.exitPointerLock =  document.exitPointerLock ||
                                document.mozExitPointerLock ||
                                document.webkitExitPointerLock;

    canvas.onclick = function() {
        if (canvas.requestPointerLock)
            canvas.requestPointerLock();
    }

    if ("onpointerlockchange" in document)
        document.addEventListener('pointerlockchange', lockChangeAlert, false);
    else if ("onmozpointerlockchange" in document)
        document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
    else if ("onwebkitpointerlockchange" in document)
        document.addEventListener('webkitpointerlockchange', lockChangeAlert, false);

    if ("onpointerlockerror" in document)
        document.addEventListener('pointerlockerror', lockError, false);
    else if ("onmozpointerlockerror" in document)
        document.addEventListener('mozpointerlockerror', lockError, false);
    else if ("onwebkitpointerlockerror" in document)
        document.addEventListener('webkitpointerlockerror', lockError, false);

    function lockChangeAlert() {
        if (document.pointerLockElement === canvas ||
            document.mozPointerLockElement === canvas ||
            document.webkitPointerLockElement === canvas)
        {
            console.log('The pointer lock status is now locked');
            // Do something useful in response

            if (cb_enabled)
                cb_enabled();

        } else {
            console.log('The pointer lock status is now unlocked');      
            // Do something useful in response

            if (cb_disabled)
                cb_disabled();
        }
    }


    function lockError(e) {
        console.error("Pointer lock failed"); 

        if (cb_error)
            cb_error(e)
    }

    

    // // // POINTER LOCK
    //
    //

}

module.exports = handle_pointerLock;

},{}],14:[function(require,module,exports){

"use strict"

var WebGLUtils = require('./utils/WebGLUtils');

var canvas = document.getElementById("main-canvas");

var gl = WebGLUtils.setupWebGL(canvas);

gl.viewportWidth = canvas.clientWidth;
gl.viewportHeight = canvas.clientHeight;

// METHODS

gl.recreate = function()
{
	console.log("gl.recreate");
	return WebGLUtils.setupWebGL(canvas);
}

// EXTENSIONS

if (gl.getExtension) {

    gl._extension_vao =
        gl.getExtension('OES_vertex_array_object') ||
        gl.getExtension('MOZ_OES_vertex_array_object') ||
        gl.getExtension('WEBKIT_OES_vertex_array_object');

    gl._extension_lose_context = gl.getExtension('WEBGL_lose_context');
}

module.exports = gl;

},{"./utils/WebGLUtils":22}],15:[function(require,module,exports){

"use strict"

var GeometryColor = function (gl, vertices, primitive) {

    this._primitive = primitive;

    this._vbuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    this._numItems = vertices.length / 6;
}

//

var proto = GeometryColor.prototype

proto.isValid = function()
{
    return (this._vbuffer && this._numItems > 0);
}

proto.update = function(gl, vertices)
{
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    this._numItems = vertices.length / 12;
}

proto.dispose = function(gl)
{
    gl.deleteBuffer(this._vbuffer);

    if (this._vao)
        gl._extension_vao.deleteVertexArrayOES( this._vao );
}

//

proto.render = function(gl, shader) {

    if (gl._extension_vao)
    {
        if (this._vao)
        {
            gl._extension_vao.bindVertexArrayOES( this._vao );

                gl.drawArrays( this._primitive, 0, this._numItems );

            gl._extension_vao.bindVertexArrayOES( null );
        }
        else
        {
            this._vao = gl._extension_vao.createVertexArrayOES();

            gl._extension_vao.bindVertexArrayOES( this._vao );

                this.render_backup(gl, shader, true);

            gl._extension_vao.bindVertexArrayOES( null );
        }
    }
    else
    {
        this.render_backup(shader);
    }
};

//

proto.render_backup = function(gl, shader, no_clear) {

    gl.enableVertexAttribArray(shader.aVertexPosition);
    gl.enableVertexAttribArray(shader.aVertexColor);

        var bpp = 4; // gl.FLOAT -> 4 bytes
        var stride = 6 * bpp;
        var index_pos    = 0 * bpp;
        var index_color  = 3 * bpp;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);
        gl.vertexAttribPointer(shader.aVertexPosition,3,gl.FLOAT,false,stride,index_pos);
        gl.vertexAttribPointer(shader.aVertexColor,3,gl.FLOAT,false,stride,index_color);

        gl.drawArrays( this._primitive, 0, this._numItems );

    if (!no_clear)
    {
        gl.disableVertexAttribArray(shader.aVertexPosition);
        gl.disableVertexAttribArray(shader.aVertexColor);
    }
};

//

module.exports = GeometryColor;

},{}],16:[function(require,module,exports){

"use strict"

var GeometryExperimental = function (gl, vertices, shader, vertices_is_buffer)
{
    this._vbuffer = gl.createBuffer();
    this._shader = shader;

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    if (this._vbuffer === null)
        console.log('_vbuffer is null');

    this._numItems = vertices.length / 12;
}

//

var proto = GeometryExperimental.prototype;

proto.isValid = function()
{
    return (this._vbuffer && this._numItems > 0);
}

proto.update = function(gl, vertices)
{

    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);

    this._numItems = vertices.length / 12;
}

proto.dispose = function(gl)
{

    gl.deleteBuffer(this._vbuffer);

    if (this._vao)
        gl._extension_vao.deleteVertexArrayOES( this._vao );
}

//

proto.render = function(gl)
{

    var shader = this._shader;

    if (gl._extension_vao)
    {
        if (this._vao)
        {
            gl._extension_vao.bindVertexArrayOES( this._vao );

                gl.drawArrays( gl.TRIANGLES, 0, this._numItems );

            gl._extension_vao.bindVertexArrayOES( null );
        }
        else
        {
            this._vao = gl._extension_vao.createVertexArrayOES();

            gl._extension_vao.bindVertexArrayOES( this._vao );

                this.render_backup(gl, true);

            gl._extension_vao.bindVertexArrayOES( null );
        }
    }
    else
    {
        this.render_backup();
    }
};

//

proto.render_backup = function(gl, no_clear)
{
    var shader = this._shader;

    gl.enableVertexAttribArray(shader.aVertexPosition);
    gl.enableVertexAttribArray(shader.aVertexColor);
    gl.enableVertexAttribArray(shader.aVertexNormal);
    gl.enableVertexAttribArray(shader.aVertexBCenter);

        var bpp = 4; // gl.FLOAT -> 4 bytes
        var stride = 12 * bpp;
        var index_pos    = 0 * bpp;
        var index_color  = 3 * bpp;
        var index_normal  = 6 * bpp;
        var index_bcenter  = 9 * bpp;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vbuffer);
        gl.vertexAttribPointer(shader.aVertexPosition,3,gl.FLOAT,false,stride,index_pos);
        gl.vertexAttribPointer(shader.aVertexColor,3,gl.FLOAT,false,stride,index_color);
        gl.vertexAttribPointer(shader.aVertexNormal,3,gl.FLOAT,false,stride,index_normal);
        gl.vertexAttribPointer(shader.aVertexBCenter,3,gl.FLOAT,false,stride,index_bcenter);

        gl.drawArrays( gl.TRIANGLES, 0, this._numItems );

    if (!no_clear)
    {
        gl.disableVertexAttribArray(shader.aVertexPosition);
        gl.disableVertexAttribArray(shader.aVertexColor);
        gl.disableVertexAttribArray(shader.aVertexNormal);
        gl.disableVertexAttribArray(shader.aVertexBCenter);
    }
}

//

module.exports = GeometryExperimental;

},{}],17:[function(require,module,exports){

"use strict"

function createCubeVertices(size, arr_color, no_inside)
{
    var outer_side = size / 2;
    var inner_side = size / 2.1;

    var vertices = [
         outer_side,  outer_side,  outer_side, // 0
        -outer_side,  outer_side,  outer_side,
         outer_side, -outer_side,  outer_side,
        -outer_side, -outer_side,  outer_side,

         outer_side,  outer_side, -outer_side, // 4
        -outer_side,  outer_side, -outer_side,
         outer_side, -outer_side, -outer_side,
        -outer_side, -outer_side, -outer_side,

         inner_side,  inner_side,  inner_side, // 8
        -inner_side,  inner_side,  inner_side,
         inner_side, -inner_side,  inner_side,
        -inner_side, -inner_side,  inner_side,

         inner_side,  inner_side, -inner_side, // 12
        -inner_side,  inner_side, -inner_side,
         inner_side, -inner_side, -inner_side,
        -inner_side, -inner_side, -inner_side
    ];

    //

    var indices = [
        0,1,  1,3,  3,2,  2,0,
        4,5,  5,7,  7,6,  6,4,
        0,4,  1,5,  3,7,  2,6,

         8, 9,   9,11,  11,10,  10, 8,
        12,13,  13,15,  15,14,  14,12,
         8,12,   9,13,  11,15,  10,14
    ];

    //

    if (no_inside)
        indices.length /= 2;

    //

    var fvertices = [];

    for (var i = 0; i < indices.length; ++i)
    {
        var curr_index = indices[i] * 3;

        for (var j = 0; j < 3; ++j)
            fvertices.push( vertices[curr_index + j] + outer_side );

        for (var j = 0; j < 3; ++j)
            fvertices.push( arr_color[j] );
    }

    return fvertices;
}

module.exports = createCubeVertices

},{}],18:[function(require,module,exports){

"use strict"

function createCubeVertices(fovY, aspect, zNear, zFar)
{
    var left, right, bottom, top;


    var fovy = fovY;
    var nearval = zNear;
    var farval = zFar;


    var pi = 3.1415926;
    var fW, fH;

    fH = Math.tan( fovY / 360.0 * pi ) * zNear;
    fW = fH * aspect;

    left = -fW;
    right = +fW;

    top = +fH;
    bottom = -fH;

    var half_z = farval * Math.sin(fovy * 3.14 / 180.0);
    var half_y = half_z * aspect;

    var vertices = [

        nearval, left,  top,
        nearval, right, top,
        nearval, left,  bottom,
        nearval, right, bottom,

        farval, -half_y, +half_z,
        farval, +half_y, +half_z,
        farval, -half_y, -half_z,
        farval, +half_y, -half_z

        , farval, -half_y*1.66, -half_z
        , farval, -half_y*1.66, +half_z
    ];

    //

    var indices = [
        0,1,  1,3,  3,2,  2,0,
        0,4,  1,5,  2,6,  3,7,
        4,5,  5,7,  7,6,  6,4,
        8,9,
        7,8,
        5,9,
    ];

    //

    var fvertices = [];

    for (var i = 0; i < indices.length; ++i)
    {
        var curr_index = indices[i] * 3;

        for (var j = 0; j < 3; ++j)
            fvertices.push( vertices[curr_index + j] );

        fvertices.push( 1,1,0 );
    }

    return fvertices;
}

module.exports = createCubeVertices

},{}],19:[function(require,module,exports){

"use strict"

var g_data = require('../data/index.js');

var gl = require('./context.js');

var createFreeFlyCamera = require('./camera/FreeFlyCamera.js')
var createFrustumCulling = require('./camera/FrustumCulling.js')
var glm = require('./utils/gl-matrix-2.3.2.min.js');

var ShaderProgram = require('./utils/ShaderProgram.js');
var myTexture = require('./utils/myTexture.js');

var shaderSrc = require('./shaderSrc.js');

var createGeometryColor = require('./geometries/GeometryColor.js');
var createGeometryExperimental = require('./geometries/GeometryExperimental.js');
var createCubeVertices = require('./geometries/createCubeVertices.js');
var createFrustumVertices = require('./geometries/createFrustumVertices.js');


var glhProject = require('./camera/glhProject.js')


//

function RendererWebGL ()
{
	this.FreeFlyCamera = new createFreeFlyCamera();
	this.FreeFlyCamera.activate();
	this.FreeFlyCamera.setPosition( g_data.logic.k_chunk_size/4*3, g_data.logic.k_chunk_size/4*3, 0 );

	this.FrustumCulling = new createFrustumCulling();

	this.pMatrix = glm.mat4.create();
	this.mvMatrix = glm.mat4.create();

    gl.canvas.addEventListener('webglcontextlost', function(event)
    {
        event.preventDefault();
        console.log('context is lost');

        if (self.on_context_lost)
            self.on_context_lost();
    }, false);

    self = this;
    gl.canvas.addEventListener('webglcontextrestored', function()
    {
        console.log('context is restored');

        gl = gl.recreate();

        if (self.on_context_restored)
            self.on_context_restored();
    }, false);
}

//

var proto = RendererWebGL.prototype;

proto.chunk_is_visible = function (pos)
{
    var hsize = g_data.logic.k_chunk_size / 2;

    return this.FrustumCulling.cubeInFrustum( pos[0]+hsize, pos[1]+hsize, pos[2]+hsize, hsize );
}

proto.point_is_visible = function (pos)
{
    return this.FrustumCulling.pointInFrustum( pos[0], pos[1], pos[2] );
}

proto.add_geom = function (buffer)
{
    var geom = new createGeometryExperimental(gl, buffer, this.shader_exp);

    return (geom.isValid() ? geom : null);
}

proto.update_geom = function (geom, buffer)
{
    geom.update(gl, buffer);
}


proto.getCameraPosition = function ()
{
	return [
        this.FreeFlyCamera._Position[0],
        this.FreeFlyCamera._Position[1],
        this.FreeFlyCamera._Position[2]
	];
}

proto.resize = function (width, height)
{
    gl.viewportWidth = width;
    gl.viewportHeight = height;

    this.aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

    if (this.geom_frustum && this.geom_frustum.isValid())
        this.geom_frustum.dispose(gl);
    var vertices = createFrustumVertices(70, this.aspectRatio, 0.1, 40);
    this.geom_frustum = new createGeometryColor(gl, vertices, gl.LINES);
}

//

proto.toggle_context_loss = function ()
{
    if (gl._extension_lose_context)
    {
        if (gl.isContextLost())
            gl._extension_lose_context.restoreContext(); // restores the context
        else
            gl._extension_lose_context.loseContext(); // trigger a context loss
    }
}

proto.context_is_lost = function ()
{
    return gl.isContextLost();
}

proto.set_on_context_lost = function (callback)
{
    this.on_context_lost = callback;
}

proto.set_on_context_restored = function (callback)
{
    this.on_context_restored = callback;
}

//

proto.init = function (onFinish)
{
	//
	//
	// shaders

	this.shader_color = new ShaderProgram( gl, {
	    vs_src: shaderSrc.color.vertex,
	    fs_src: shaderSrc.color.fragment,
	    arr_attrib: ['aVertexPosition','aVertexColor'],
	    arr_uniform: ['uMVMatrix','uPMatrix']
	} );

	this.shader_exp = new ShaderProgram( gl, {
	    vs_src: shaderSrc.experimental.vertex,
	    fs_src: shaderSrc.experimental.fragment,
	    arr_attrib: ['aVertexPosition','aVertexColor','aVertexNormal','aVertexBCenter'],
	    arr_uniform: ['uMVMatrix','uPMatrix','uCameraPos','uSampler']
	} );

	//
	//
	// create axis geometry

	var vertices = [];

	var axis_size = 20;

	vertices.push(0,0,0,  1,0,0,  axis_size,0,0,  1,0,0)
	vertices.push(0,0,0,  0,1,0,  0,axis_size,0,  0,1,0)
	vertices.push(0,0,0,  0,0,1,  0,0,axis_size,  0,0,1)

	this.geom_axis = new createGeometryColor(gl, vertices, gl.LINES);

	//
	//
	// create coss geometry

	var vertices = [];

	var cross_size = 5;

	vertices.push(0-cross_size,0,0,  1,1,1);
	vertices.push(0+cross_size*5,0,0,  1,1,1);
	vertices.push(0,0-cross_size,0,  1,1,1);
	vertices.push(0,0+cross_size,0,  1,1,1);
	vertices.push(0,0,0-cross_size,  1,1,1);
	vertices.push(0,0,0+cross_size,  1,1,1);

	this.geom_cross = new createGeometryColor(gl, vertices, gl.LINES);

	//
	//
	// geoms

	var vertices = createCubeVertices(g_data.logic.k_chunk_size, [1,0,0]);
	this.geom_cubeR = new createGeometryColor(gl, vertices, gl.LINES);

	var vertices = createCubeVertices(g_data.logic.k_chunk_size, [1,1,1]);
	this.geom_cubeW = new createGeometryColor(gl, vertices, gl.LINES);

	var vertices = createCubeVertices(g_data.logic.k_chunk_size, [0,1,0]);
	this.geom_cubeG = new createGeometryColor(gl, vertices, gl.LINES);


	this.aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

	var vertices = createFrustumVertices(35, this.aspectRatio, 0.1, 40);
	this.geom_frustum = new createGeometryColor(gl, vertices, gl.LINES);

	//
	//
	// init

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST);


	var img_texture = new Image();
	var crateTexture = gl.createTexture();
	img_texture.onload = function ()
	{
		var buf_texture = myTexture.imageToUint8Array(img_texture);
		buf_texture = myTexture.flipYImageArray(buf_texture, img_texture.width, img_texture.height);

	    gl.useProgram(this.shader_exp);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, crateTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, img_texture.width, img_texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, buf_texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

	    gl.useProgram(null);

		// starting point
		onFinish();
	}

	// TODO : handle the an onerror on the texture loading here

	img_texture.src = "textures/texture.png";
}

proto.update = function ()
{
    this.FreeFlyCamera.handleKeys();
    this.FreeFlyCamera.update( 1.0 / 60.0 );

    glm.mat4.perspective( this.pMatrix, 70, this.aspectRatio, 0.1, 70);

    this.FreeFlyCamera.updateViewMatrix( this.mvMatrix );
    this.FrustumCulling.calculateFrustum( this.pMatrix, this.mvMatrix );

	var viewport = [0, 0, gl.viewportWidth*0.75, gl.viewportHeight];

	var arr_chunks = g_data.logic.ChunkGenerator._chunks;

    for (var i = 0; i < arr_chunks.length; ++i)
    {
    	var pos = arr_chunks[i].pos;

        arr_chunks[i].visible = this.chunk_is_visible(pos);

        if (!this.point_is_visible(pos))
        	continue;

		var tmp_2d_position = glhProject(
		    pos[0],pos[1],pos[2],
		    this.mvMatrix,
		    this.pMatrix,
		    viewport
		);

		// flip the 'y' value
		tmp_2d_position[1] = viewport[3] - tmp_2d_position[1];

        arr_chunks[i].coord2d = tmp_2d_position;
    }
}

proto.render = function ()
{
	var arr_chunks = g_data.logic.ChunkGenerator._chunks;

	gl.viewport(0, 0, gl.viewportWidth*0.75, gl.viewportHeight);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(this.shader_exp);

	    // send the texture to the shader
	    gl.uniform1i(this.shader_exp.uSampler, 0);

	    gl.uniformMatrix4fv(this.shader_exp.uMVMatrix, false, this.mvMatrix);
	    gl.uniformMatrix4fv(this.shader_exp.uPMatrix, false, this.pMatrix);

	    var p = this.FreeFlyCamera._Position;
	    gl.uniform3f(this.shader_exp.uCameraPos, p[0],p[1],p[2]);

	    for (var i = 0; i < arr_chunks.length; ++i)
	        if (arr_chunks[i].visible)
	            arr_chunks[i].geom.render(gl);


    gl.useProgram(this.shader_color);

        gl.uniformMatrix4fv(this.shader_color.uPMatrix, false, this.pMatrix);
        gl.uniformMatrix4fv(this.shader_color.uMVMatrix, false, this.mvMatrix);

        // this.geom_axis.render(this.shader_color);

        var tmp_mvMatrix2 = glm.mat4.create();

        for (var i = 0; i < arr_chunks.length; ++i)
        {
	        if (!arr_chunks[i].visible)
                continue;

            var pos = arr_chunks[i].pos;

            glm.mat4.translate(tmp_mvMatrix2, this.mvMatrix, pos);

            gl.uniformMatrix4fv(this.shader_color.uMVMatrix, false, tmp_mvMatrix2);

            ///

            this.geom_cubeW.render(gl, this.shader_color);
        }

    gl.useProgram(null);
}

proto.renderHUD = function ()
{
	var arr_chunks = g_data.logic.ChunkGenerator._chunks;

    gl.useProgram(this.shader_color);

	    // rendered 3 times with a different viewport and point of view

	    var w = gl.viewportWidth*0.25;
	    var w2 = gl.viewportWidth*0.75;
	    var h = gl.viewportHeight*0.33;

	    gl.clear(gl.DEPTH_BUFFER_BIT);

	    var self = this;
	    render_hud( [w2,h*0,w,h], [1.0, 1.2, 1.0], [0,0,1] );
	    render_hud( [w2,h*1,w,h], [0.0, 1.0, 0.0], [0,0,1] );
	    render_hud( [w2,h*2,w,h], [0.0, 0.0, 1.0], [0,1,0] );

    //

    function render_hud(arr_viewport, arr_target, arr_up)
    {
        gl.viewport(arr_viewport[0], arr_viewport[1], arr_viewport[2], arr_viewport[3]);

            var tmp_pMatrix = glm.mat4.create();
            var aspectRatio2 = arr_viewport[2]/arr_viewport[3];
            var ortho_size = 65;
            glm.mat4.ortho(tmp_pMatrix,
                -ortho_size*aspectRatio2,ortho_size*aspectRatio2,
                -ortho_size,ortho_size,
                -200,200);

            var cpos = self.FreeFlyCamera._Position;

            var tmp_mvMatrix = glm.mat4.create();
            glm.mat4.lookAt(
                tmp_mvMatrix,
                [   cpos[0]+arr_target[0],
                    cpos[1]+arr_target[1],
                    cpos[2]+arr_target[2] ],
                cpos,
                arr_up
            );


            gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix);
            gl.uniformMatrix4fv(self.shader_color.uPMatrix, false, tmp_pMatrix);

        self.geom_axis.render(gl, self.shader_color)

            var tmp_mvMatrix2 = glm.mat4.create();

            for (var i = 0; i < arr_chunks.length; ++i)
            {
                var pos = arr_chunks[i].pos;

                ///

                glm.mat4.identity(tmp_mvMatrix2);

                if (arr_chunks[i].visible)
                {
                    // render white cube

                    glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, pos);

                    gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix2);
                    self.geom_cubeW.render(gl, self.shader_color);
                }
                else
                {
                    // render red cube (smaller -> scalled)

                    glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, [
                        pos[0] + g_data.logic.k_chunk_size*0.15,
                        pos[1] + g_data.logic.k_chunk_size*0.15,
                        pos[2] + g_data.logic.k_chunk_size*0.15
                    ]);
                    glm.mat4.scale(tmp_mvMatrix2,tmp_mvMatrix2, [0.7,0.7,0.7]);

                    gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix2);
                    self.geom_cubeR.render(gl, self.shader_color);
                }
            }

            if (g_data.logic.ChunkGenerator.is_processing_chunk)
            {
                var pos = g_data.logic.ChunkGenerator.processing_pos

                glm.mat4.translate(tmp_mvMatrix2,tmp_mvMatrix, [
                    pos[0] + g_data.logic.k_chunk_size*0.2,
                    pos[1] + g_data.logic.k_chunk_size*0.2,
                    pos[2] + g_data.logic.k_chunk_size*0.2
                ]);
                glm.mat4.scale(tmp_mvMatrix2,tmp_mvMatrix2, [0.6,0.6,0.6]);

                gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix2);
                self.geom_cubeG.render(gl, self.shader_color);
            }



                glm.mat4.translate(tmp_mvMatrix,tmp_mvMatrix, self.FreeFlyCamera._Position);
                glm.mat4.rotate(tmp_mvMatrix,tmp_mvMatrix, self.FreeFlyCamera._theta*3.14/180, [0,0,1]);
                glm.mat4.rotate(tmp_mvMatrix,tmp_mvMatrix, self.FreeFlyCamera._phi*3.14/180, [0,-1,0]);

                gl.uniformMatrix4fv(self.shader_color.uMVMatrix, false, tmp_mvMatrix);

            self.geom_cross.render(gl, self.shader_color);
            // gl.lineWidth(3);
            self.geom_frustum.render(gl, self.shader_color);
            // gl.lineWidth(1);

    }

    gl.useProgram(null);
}

//

module.exports = RendererWebGL;

},{"../data/index.js":2,"./camera/FreeFlyCamera.js":9,"./camera/FrustumCulling.js":10,"./camera/glhProject.js":11,"./context.js":14,"./geometries/GeometryColor.js":15,"./geometries/GeometryExperimental.js":16,"./geometries/createCubeVertices.js":17,"./geometries/createFrustumVertices.js":18,"./shaderSrc.js":20,"./utils/ShaderProgram.js":21,"./utils/gl-matrix-2.3.2.min.js":23,"./utils/myTexture.js":24}],20:[function(require,module,exports){

const color_vert = `

attribute vec3 aVertexPosition;
attribute vec3 aVertexColor;

varying vec4 vColor;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

void main(void)
{
    vColor = vec4(aVertexColor,1.0);

    gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}
`;

const color_frag = `

precision mediump float;

varying vec4 vColor;

void main(void)
{
    gl_FragColor = vColor;
}
`;

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

const experimental_vert = `

attribute vec3 aVertexPosition, aVertexColor, aVertexNormal, aVertexBCenter;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec3 uCameraPos;

varying vec3 vColor;
varying vec3 vBCenter;

varying vec3 vNormalInterp;
varying vec3 vVertPos;
varying float vDistance;

varying vec3 vPureVertexPos;
varying vec3 vPureNormalInterp;

const float k_range_min = 20.0;
const float k_range_max = 23.0;


void main(void)
{
    vec4 vertPos4 = uMVMatrix * vec4(aVertexPosition, 1.0);
    vVertPos = vec3(vertPos4) / vertPos4.w;
    vNormalInterp = vec3( uMVMatrix * vec4(aVertexNormal, 0.0) );

    vPureVertexPos = aVertexPosition;
    vPureNormalInterp = aVertexNormal;

    //

    float tmp_dist = length( aVertexPosition - uCameraPos );

    vDistance = tmp_dist;

    vColor = aVertexColor;
    vBCenter = aVertexBCenter;

    if (tmp_dist < k_range_min ||
        tmp_dist > k_range_max)
    {
        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
    }
    else
    {
        // bump effect -> bump in the direction of the normal

        gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition + aVertexNormal, 1.0);
    }

    //

}
`;

const experimental_frag = `

precision mediump float;

uniform sampler2D uSampler;

varying vec3 vColor;
varying vec3 vBCenter;

varying vec3 vNormalInterp;
varying vec3 vVertPos;
varying float vDistance;

varying vec3 vPureVertexPos;
varying vec3 vPureNormalInterp;

const vec3 k_lightPos = vec3(0.0,0.0,0.0);
const vec3 k_specColor = vec3(1.0, 1.0, 1.0);

const float k_range_min = 20.0;
const float k_range_max = 23.0;

void main(void)
{

    { // wireframe

        if (gl_FrontFacing)
        {
            // "bumped wireframe" effect on the front facing

            if (vDistance > k_range_min &&
                vDistance < k_range_max)
            {

                if (all(greaterThan(vBCenter, vec3(0.03))) &&
                    any(lessThan(vBCenter, vec3(0.08))))
                {
                    gl_FragColor = vec4(vColor, 1.0);
                    return;
                }

            }

        }
        else
        {
            // normal wireframe effect on the back facing

            if (any(lessThan(vBCenter, vec3(0.06))))
            {
                gl_FragColor = vec4(1);
                return;
            }
        }

        // wireframe only for the backface
        if (!gl_FrontFacing)
            discard;

    } // /wireframe

    vec3 tmp_color = vColor;

    { // texture

        // current 3d texture coordinate
        vec3 flooredPos = vec3(
            vPureVertexPos.x - floor(vPureVertexPos.x),
            vPureVertexPos.y - floor(vPureVertexPos.y),
            vPureVertexPos.z - floor(vPureVertexPos.z)
        );

        vec3 blend_weights = abs( normalize( vPureNormalInterp.xyz ) );
        blend_weights = max( ( blend_weights - 0.2 ) * 7., 0. );
        blend_weights /= ( blend_weights.x + blend_weights.y + blend_weights.z );

        // horizontal texture coordinates -> shoudl be a wall
        vec2 texcoord1 = flooredPos.yz * 0.5 + 0.5;
        vec2 texcoord2 = flooredPos.xz * 0.5 + 0.5;
        // vertical texture coord -> should be green grass
        vec2 texcoord3 = flooredPos.xy * 0.5;

        if (vPureNormalInterp.z < 0.0)
            texcoord3.y += 0.5; // switch the texture Y -> dirt on the ceilling instead of grass

        // horizontal color
        vec3 texColor1 = texture2D( uSampler, texcoord1 ).rgb;
        vec3 texColor2 = texture2D( uSampler, texcoord2 ).rgb;
        // vertical color
        vec3 texColor3 = texture2D( uSampler, texcoord3 ).rgb;

        tmp_color = texColor1 * blend_weights.xxx +
                    texColor2 * blend_weights.yyy +
                    texColor3 * blend_weights.zzz;

    } // texture

    { // lighting

        vec3 normal = normalize(vNormalInterp);
        vec3 lightDir = normalize(k_lightPos - vVertPos);

        float lambertian = max(dot(lightDir,vNormalInterp.xyz), 0.0);
        float specular = 0.0;

        // lighting specular
        if (lambertian > 0.0)
        {
            vec3 reflectDir = reflect(-lightDir, normal);
            vec3 viewDir = normalize(-vVertPos);

            float specAngle = max(dot(reflectDir, viewDir), 0.0);
            specular = pow(specAngle, 16.0);
        }

        // lighting output
        tmp_color = tmp_color.xyz*0.05 + tmp_color.xyz*lambertian + specular*k_specColor;

    } // lighting

    gl_FragColor = vec4(tmp_color, 1.0);
}
`;

/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////

module.exports = {
    color: {
        vertex: color_vert,
        fragment: color_frag,
    },
    experimental: {
        vertex: experimental_vert,
        fragment: experimental_frag,
    }
};

},{}],21:[function(require,module,exports){

"use strict"

class ShaderProgram {

    constructor(gl, opt) {

        if (!opt.vs_src)
            throw new Error('no vertex shader id');

        if (!opt.fs_src)
            throw new Error('no fragment shader id');

        //

        var vertexShader = this._getShader(gl, opt.vs_src, gl.VERTEX_SHADER);

        if (!vertexShader)
            throw new Error("Could not initialise vertexShader");

        //

        var fragmentShader = this._getShader(gl, opt.fs_src, gl.FRAGMENT_SHADER);

        if (!fragmentShader)
            throw new Error("Could not initialise fragmentShader");

        //

        this.shaderProgram = gl.createProgram();
        gl.attachShader(this.shaderProgram, vertexShader);
        gl.attachShader(this.shaderProgram, fragmentShader);
        gl.linkProgram(this.shaderProgram);

        if (!gl.getProgramParameter(this.shaderProgram, gl.LINK_STATUS))
        {
            // An error occurred while linking
            var lastError = gl.getProgramInfoLog(this.shaderProgram);

            throw new Error("Failed to initialised shaders, Error linking:" + lastError);
        }


        this._getAttribAndLocation(gl, this.shaderProgram, opt.arr_attrib, opt.arr_uniform);

        return this.shaderProgram;
    }

    _getAttribAndLocation(gl, shader, arr_attrib, arr_uniform) {

        gl.useProgram(shader);

        if (arr_attrib)
            for (var i = 0; i < arr_attrib.length; ++i)
                shader[arr_attrib[i]] = gl.getAttribLocation(shader, arr_attrib[i]);

        if (arr_uniform)
            for (var i = 0; i < arr_uniform.length; ++i)
                shader[arr_uniform[i]] = gl.getUniformLocation(shader, arr_uniform[i]);

        gl.useProgram(null);
    }

    //

    _getShader(gl, src, type) {

        const shader = gl.createShader(type);

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }

        return shader;
    }
};

module.exports = ShaderProgram;

},{}],22:[function(require,module,exports){

"use strict"

/**
 * Provides requestAnimationFrame in a cross browser way.
 */
window.requestAnimFrame = (function() {

    return  window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(/* function FrameRequestCallback */ callback, /* DOMElement Element */ element) {
                window.setTimeout(callback, 1000/60);
            };

})();


/**
 * Creates a webgl context. If creation fails it will
 * change the contents of the container of the <canvas>
 * tag to an error message with the correct links for WebGL.
 * @param {Element} canvas. The canvas element to create a
 *     context from.
 * @param {WebGLContextCreationAttirbutes} opt_attribs Any
 *     creation attributes you want to pass in.
 * @param {function:(msg)} opt_onError An function to call
 *     if there is an error during creation.
 * @return {WebGLRenderingContext} The created context.
 */
var setupWebGL = function(canvas, opt_attribs, opt_onError) {

    if (canvas.addEventListener) {
        canvas.addEventListener("webglcontextcreationerror", function(e) {
            alert(e);
        }, false);
    }

    var context = create3DContext(canvas, opt_attribs);
    if (!context) {
        if (!window.WebGLRenderingContext) {
            alert("!window.WebGLRenderingContext");
        }
    }

    return context;
};

/**
 * Creates a webgl context.
 * @param {!Canvas} canvas The canvas tag to get context
 *     from. If one is not passed in one will be created.
 * @return {!WebGLContext} The created context.
 */
var create3DContext = function(canvas, opt_attribs) {
    var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {

        try {
            context = canvas.getContext(names[ii], opt_attribs);
        } catch(e) {}

        if (context)
            break;
    }
    return context;
}


module.exports = {
    create3DContext: create3DContext,
    setupWebGL: setupWebGL
};

},{}],23:[function(require,module,exports){
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.3.2
 */

/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

!function(t,a){if("object"==typeof exports&&"object"==typeof module)module.exports=a();else if("function"==typeof define&&define.amd)define([],a);else{var n=a();for(var r in n)("object"==typeof exports?exports:t)[r]=n[r]}}(this,function(){return function(t){function a(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return t[r].call(o.exports,o,o.exports,a),o.loaded=!0,o.exports}var n={};return a.m=t,a.c=n,a.p="",a(0)}([function(t,a,n){a.glMatrix=n(1),a.mat2=n(2),a.mat2d=n(3),a.mat3=n(4),a.mat4=n(5),a.quat=n(6),a.vec2=n(9),a.vec3=n(7),a.vec4=n(8)},function(t,a){var n={};n.EPSILON=1e-6,n.ARRAY_TYPE="undefined"!=typeof Float32Array?Float32Array:Array,n.RANDOM=Math.random,n.ENABLE_SIMD=!1,n.SIMD_AVAILABLE=n.ARRAY_TYPE===this.Float32Array&&"SIMD"in this,n.USE_SIMD=n.ENABLE_SIMD&&n.SIMD_AVAILABLE,n.setMatrixArrayType=function(t){n.ARRAY_TYPE=t};var r=Math.PI/180;n.toRadian=function(t){return t*r},n.equals=function(t,a){return Math.abs(t-a)<=n.EPSILON*Math.max(1,Math.abs(t),Math.abs(a))},t.exports=n},function(t,a,n){var r=n(1),o={};o.create=function(){var t=new r.ARRAY_TYPE(4);return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t},o.clone=function(t){var a=new r.ARRAY_TYPE(4);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a},o.copy=function(t,a){return t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t},o.identity=function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t},o.fromValues=function(t,a,n,o){var u=new r.ARRAY_TYPE(4);return u[0]=t,u[1]=a,u[2]=n,u[3]=o,u},o.set=function(t,a,n,r,o){return t[0]=a,t[1]=n,t[2]=r,t[3]=o,t},o.transpose=function(t,a){if(t===a){var n=a[1];t[1]=a[2],t[2]=n}else t[0]=a[0],t[1]=a[2],t[2]=a[1],t[3]=a[3];return t},o.invert=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=n*u-o*r;return l?(l=1/l,t[0]=u*l,t[1]=-r*l,t[2]=-o*l,t[3]=n*l,t):null},o.adjoint=function(t,a){var n=a[0];return t[0]=a[3],t[1]=-a[1],t[2]=-a[2],t[3]=n,t},o.determinant=function(t){return t[0]*t[3]-t[2]*t[1]},o.multiply=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=n[0],M=n[1],s=n[2],i=n[3];return t[0]=r*e+u*M,t[1]=o*e+l*M,t[2]=r*s+u*i,t[3]=o*s+l*i,t},o.mul=o.multiply,o.rotate=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=Math.sin(n),M=Math.cos(n);return t[0]=r*M+u*e,t[1]=o*M+l*e,t[2]=r*-e+u*M,t[3]=o*-e+l*M,t},o.scale=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=n[0],M=n[1];return t[0]=r*e,t[1]=o*e,t[2]=u*M,t[3]=l*M,t},o.fromRotation=function(t,a){var n=Math.sin(a),r=Math.cos(a);return t[0]=r,t[1]=n,t[2]=-n,t[3]=r,t},o.fromScaling=function(t,a){return t[0]=a[0],t[1]=0,t[2]=0,t[3]=a[1],t},o.str=function(t){return"mat2("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+")"},o.frob=function(t){return Math.sqrt(Math.pow(t[0],2)+Math.pow(t[1],2)+Math.pow(t[2],2)+Math.pow(t[3],2))},o.LDU=function(t,a,n,r){return t[2]=r[2]/r[0],n[0]=r[0],n[1]=r[1],n[3]=r[3]-t[2]*n[1],[t,a,n]},o.add=function(t,a,n){return t[0]=a[0]+n[0],t[1]=a[1]+n[1],t[2]=a[2]+n[2],t[3]=a[3]+n[3],t},o.subtract=function(t,a,n){return t[0]=a[0]-n[0],t[1]=a[1]-n[1],t[2]=a[2]-n[2],t[3]=a[3]-n[3],t},o.sub=o.subtract,o.exactEquals=function(t,a){return t[0]===a[0]&&t[1]===a[1]&&t[2]===a[2]&&t[3]===a[3]},o.equals=function(t,a){var n=t[0],o=t[1],u=t[2],l=t[3],e=a[0],M=a[1],s=a[2],i=a[3];return Math.abs(n-e)<=r.EPSILON*Math.max(1,Math.abs(n),Math.abs(e))&&Math.abs(o-M)<=r.EPSILON*Math.max(1,Math.abs(o),Math.abs(M))&&Math.abs(u-s)<=r.EPSILON*Math.max(1,Math.abs(u),Math.abs(s))&&Math.abs(l-i)<=r.EPSILON*Math.max(1,Math.abs(l),Math.abs(i))},o.multiplyScalar=function(t,a,n){return t[0]=a[0]*n,t[1]=a[1]*n,t[2]=a[2]*n,t[3]=a[3]*n,t},o.multiplyScalarAndAdd=function(t,a,n,r){return t[0]=a[0]+n[0]*r,t[1]=a[1]+n[1]*r,t[2]=a[2]+n[2]*r,t[3]=a[3]+n[3]*r,t},t.exports=o},function(t,a,n){var r=n(1),o={};o.create=function(){var t=new r.ARRAY_TYPE(6);return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t[4]=0,t[5]=0,t},o.clone=function(t){var a=new r.ARRAY_TYPE(6);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a[4]=t[4],a[5]=t[5],a},o.copy=function(t,a){return t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t[4]=a[4],t[5]=a[5],t},o.identity=function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t[4]=0,t[5]=0,t},o.fromValues=function(t,a,n,o,u,l){var e=new r.ARRAY_TYPE(6);return e[0]=t,e[1]=a,e[2]=n,e[3]=o,e[4]=u,e[5]=l,e},o.set=function(t,a,n,r,o,u,l){return t[0]=a,t[1]=n,t[2]=r,t[3]=o,t[4]=u,t[5]=l,t},o.invert=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=a[4],e=a[5],M=n*u-r*o;return M?(M=1/M,t[0]=u*M,t[1]=-r*M,t[2]=-o*M,t[3]=n*M,t[4]=(o*e-u*l)*M,t[5]=(r*l-n*e)*M,t):null},o.determinant=function(t){return t[0]*t[3]-t[1]*t[2]},o.multiply=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=n[0],i=n[1],c=n[2],h=n[3],S=n[4],I=n[5];return t[0]=r*s+u*i,t[1]=o*s+l*i,t[2]=r*c+u*h,t[3]=o*c+l*h,t[4]=r*S+u*I+e,t[5]=o*S+l*I+M,t},o.mul=o.multiply,o.rotate=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=Math.sin(n),i=Math.cos(n);return t[0]=r*i+u*s,t[1]=o*i+l*s,t[2]=r*-s+u*i,t[3]=o*-s+l*i,t[4]=e,t[5]=M,t},o.scale=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=n[0],i=n[1];return t[0]=r*s,t[1]=o*s,t[2]=u*i,t[3]=l*i,t[4]=e,t[5]=M,t},o.translate=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=n[0],i=n[1];return t[0]=r,t[1]=o,t[2]=u,t[3]=l,t[4]=r*s+u*i+e,t[5]=o*s+l*i+M,t},o.fromRotation=function(t,a){var n=Math.sin(a),r=Math.cos(a);return t[0]=r,t[1]=n,t[2]=-n,t[3]=r,t[4]=0,t[5]=0,t},o.fromScaling=function(t,a){return t[0]=a[0],t[1]=0,t[2]=0,t[3]=a[1],t[4]=0,t[5]=0,t},o.fromTranslation=function(t,a){return t[0]=1,t[1]=0,t[2]=0,t[3]=1,t[4]=a[0],t[5]=a[1],t},o.str=function(t){return"mat2d("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+", "+t[4]+", "+t[5]+")"},o.frob=function(t){return Math.sqrt(Math.pow(t[0],2)+Math.pow(t[1],2)+Math.pow(t[2],2)+Math.pow(t[3],2)+Math.pow(t[4],2)+Math.pow(t[5],2)+1)},o.add=function(t,a,n){return t[0]=a[0]+n[0],t[1]=a[1]+n[1],t[2]=a[2]+n[2],t[3]=a[3]+n[3],t[4]=a[4]+n[4],t[5]=a[5]+n[5],t},o.subtract=function(t,a,n){return t[0]=a[0]-n[0],t[1]=a[1]-n[1],t[2]=a[2]-n[2],t[3]=a[3]-n[3],t[4]=a[4]-n[4],t[5]=a[5]-n[5],t},o.sub=o.subtract,o.multiplyScalar=function(t,a,n){return t[0]=a[0]*n,t[1]=a[1]*n,t[2]=a[2]*n,t[3]=a[3]*n,t[4]=a[4]*n,t[5]=a[5]*n,t},o.multiplyScalarAndAdd=function(t,a,n,r){return t[0]=a[0]+n[0]*r,t[1]=a[1]+n[1]*r,t[2]=a[2]+n[2]*r,t[3]=a[3]+n[3]*r,t[4]=a[4]+n[4]*r,t[5]=a[5]+n[5]*r,t},o.exactEquals=function(t,a){return t[0]===a[0]&&t[1]===a[1]&&t[2]===a[2]&&t[3]===a[3]&&t[4]===a[4]&&t[5]===a[5]},o.equals=function(t,a){var n=t[0],o=t[1],u=t[2],l=t[3],e=t[4],M=t[5],s=a[0],i=a[1],c=a[2],h=a[3],S=a[4],I=a[5];return Math.abs(n-s)<=r.EPSILON*Math.max(1,Math.abs(n),Math.abs(s))&&Math.abs(o-i)<=r.EPSILON*Math.max(1,Math.abs(o),Math.abs(i))&&Math.abs(u-c)<=r.EPSILON*Math.max(1,Math.abs(u),Math.abs(c))&&Math.abs(l-h)<=r.EPSILON*Math.max(1,Math.abs(l),Math.abs(h))&&Math.abs(e-S)<=r.EPSILON*Math.max(1,Math.abs(e),Math.abs(S))&&Math.abs(M-I)<=r.EPSILON*Math.max(1,Math.abs(M),Math.abs(I))},t.exports=o},function(t,a,n){var r=n(1),o={};o.create=function(){var t=new r.ARRAY_TYPE(9);return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},o.fromMat4=function(t,a){return t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[4],t[4]=a[5],t[5]=a[6],t[6]=a[8],t[7]=a[9],t[8]=a[10],t},o.clone=function(t){var a=new r.ARRAY_TYPE(9);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a[4]=t[4],a[5]=t[5],a[6]=t[6],a[7]=t[7],a[8]=t[8],a},o.copy=function(t,a){return t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t[4]=a[4],t[5]=a[5],t[6]=a[6],t[7]=a[7],t[8]=a[8],t},o.fromValues=function(t,a,n,o,u,l,e,M,s){var i=new r.ARRAY_TYPE(9);return i[0]=t,i[1]=a,i[2]=n,i[3]=o,i[4]=u,i[5]=l,i[6]=e,i[7]=M,i[8]=s,i},o.set=function(t,a,n,r,o,u,l,e,M,s){return t[0]=a,t[1]=n,t[2]=r,t[3]=o,t[4]=u,t[5]=l,t[6]=e,t[7]=M,t[8]=s,t},o.identity=function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},o.transpose=function(t,a){if(t===a){var n=a[1],r=a[2],o=a[5];t[1]=a[3],t[2]=a[6],t[3]=n,t[5]=a[7],t[6]=r,t[7]=o}else t[0]=a[0],t[1]=a[3],t[2]=a[6],t[3]=a[1],t[4]=a[4],t[5]=a[7],t[6]=a[2],t[7]=a[5],t[8]=a[8];return t},o.invert=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=a[4],e=a[5],M=a[6],s=a[7],i=a[8],c=i*l-e*s,h=-i*u+e*M,S=s*u-l*M,I=n*c+r*h+o*S;return I?(I=1/I,t[0]=c*I,t[1]=(-i*r+o*s)*I,t[2]=(e*r-o*l)*I,t[3]=h*I,t[4]=(i*n-o*M)*I,t[5]=(-e*n+o*u)*I,t[6]=S*I,t[7]=(-s*n+r*M)*I,t[8]=(l*n-r*u)*I,t):null},o.adjoint=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=a[4],e=a[5],M=a[6],s=a[7],i=a[8];return t[0]=l*i-e*s,t[1]=o*s-r*i,t[2]=r*e-o*l,t[3]=e*M-u*i,t[4]=n*i-o*M,t[5]=o*u-n*e,t[6]=u*s-l*M,t[7]=r*M-n*s,t[8]=n*l-r*u,t},o.determinant=function(t){var a=t[0],n=t[1],r=t[2],o=t[3],u=t[4],l=t[5],e=t[6],M=t[7],s=t[8];return a*(s*u-l*M)+n*(-s*o+l*e)+r*(M*o-u*e)},o.multiply=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=a[6],i=a[7],c=a[8],h=n[0],S=n[1],I=n[2],f=n[3],x=n[4],D=n[5],F=n[6],m=n[7],d=n[8];return t[0]=h*r+S*l+I*s,t[1]=h*o+S*e+I*i,t[2]=h*u+S*M+I*c,t[3]=f*r+x*l+D*s,t[4]=f*o+x*e+D*i,t[5]=f*u+x*M+D*c,t[6]=F*r+m*l+d*s,t[7]=F*o+m*e+d*i,t[8]=F*u+m*M+d*c,t},o.mul=o.multiply,o.translate=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=a[6],i=a[7],c=a[8],h=n[0],S=n[1];return t[0]=r,t[1]=o,t[2]=u,t[3]=l,t[4]=e,t[5]=M,t[6]=h*r+S*l+s,t[7]=h*o+S*e+i,t[8]=h*u+S*M+c,t},o.rotate=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=a[6],i=a[7],c=a[8],h=Math.sin(n),S=Math.cos(n);return t[0]=S*r+h*l,t[1]=S*o+h*e,t[2]=S*u+h*M,t[3]=S*l-h*r,t[4]=S*e-h*o,t[5]=S*M-h*u,t[6]=s,t[7]=i,t[8]=c,t},o.scale=function(t,a,n){var r=n[0],o=n[1];return t[0]=r*a[0],t[1]=r*a[1],t[2]=r*a[2],t[3]=o*a[3],t[4]=o*a[4],t[5]=o*a[5],t[6]=a[6],t[7]=a[7],t[8]=a[8],t},o.fromTranslation=function(t,a){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=1,t[5]=0,t[6]=a[0],t[7]=a[1],t[8]=1,t},o.fromRotation=function(t,a){var n=Math.sin(a),r=Math.cos(a);return t[0]=r,t[1]=n,t[2]=0,t[3]=-n,t[4]=r,t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},o.fromScaling=function(t,a){return t[0]=a[0],t[1]=0,t[2]=0,t[3]=0,t[4]=a[1],t[5]=0,t[6]=0,t[7]=0,t[8]=1,t},o.fromMat2d=function(t,a){return t[0]=a[0],t[1]=a[1],t[2]=0,t[3]=a[2],t[4]=a[3],t[5]=0,t[6]=a[4],t[7]=a[5],t[8]=1,t},o.fromQuat=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=n+n,e=r+r,M=o+o,s=n*l,i=r*l,c=r*e,h=o*l,S=o*e,I=o*M,f=u*l,x=u*e,D=u*M;return t[0]=1-c-I,t[3]=i-D,t[6]=h+x,t[1]=i+D,t[4]=1-s-I,t[7]=S-f,t[2]=h-x,t[5]=S+f,t[8]=1-s-c,t},o.normalFromMat4=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=a[4],e=a[5],M=a[6],s=a[7],i=a[8],c=a[9],h=a[10],S=a[11],I=a[12],f=a[13],x=a[14],D=a[15],F=n*e-r*l,m=n*M-o*l,d=n*s-u*l,b=r*M-o*e,v=r*s-u*e,z=o*s-u*M,p=i*f-c*I,w=i*x-h*I,E=i*D-S*I,A=c*x-h*f,P=c*D-S*f,L=h*D-S*x,q=F*L-m*P+d*A+b*E-v*w+z*p;return q?(q=1/q,t[0]=(e*L-M*P+s*A)*q,t[1]=(M*E-l*L-s*w)*q,t[2]=(l*P-e*E+s*p)*q,t[3]=(o*P-r*L-u*A)*q,t[4]=(n*L-o*E+u*w)*q,t[5]=(r*E-n*P-u*p)*q,t[6]=(f*z-x*v+D*b)*q,t[7]=(x*d-I*z-D*m)*q,t[8]=(I*v-f*d+D*F)*q,t):null},o.str=function(t){return"mat3("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+", "+t[4]+", "+t[5]+", "+t[6]+", "+t[7]+", "+t[8]+")"},o.frob=function(t){return Math.sqrt(Math.pow(t[0],2)+Math.pow(t[1],2)+Math.pow(t[2],2)+Math.pow(t[3],2)+Math.pow(t[4],2)+Math.pow(t[5],2)+Math.pow(t[6],2)+Math.pow(t[7],2)+Math.pow(t[8],2))},o.add=function(t,a,n){return t[0]=a[0]+n[0],t[1]=a[1]+n[1],t[2]=a[2]+n[2],t[3]=a[3]+n[3],t[4]=a[4]+n[4],t[5]=a[5]+n[5],t[6]=a[6]+n[6],t[7]=a[7]+n[7],t[8]=a[8]+n[8],t},o.subtract=function(t,a,n){return t[0]=a[0]-n[0],t[1]=a[1]-n[1],t[2]=a[2]-n[2],t[3]=a[3]-n[3],t[4]=a[4]-n[4],t[5]=a[5]-n[5],t[6]=a[6]-n[6],t[7]=a[7]-n[7],t[8]=a[8]-n[8],t},o.sub=o.subtract,o.multiplyScalar=function(t,a,n){return t[0]=a[0]*n,t[1]=a[1]*n,t[2]=a[2]*n,t[3]=a[3]*n,t[4]=a[4]*n,t[5]=a[5]*n,t[6]=a[6]*n,t[7]=a[7]*n,t[8]=a[8]*n,t},o.multiplyScalarAndAdd=function(t,a,n,r){return t[0]=a[0]+n[0]*r,t[1]=a[1]+n[1]*r,t[2]=a[2]+n[2]*r,t[3]=a[3]+n[3]*r,t[4]=a[4]+n[4]*r,t[5]=a[5]+n[5]*r,t[6]=a[6]+n[6]*r,t[7]=a[7]+n[7]*r,t[8]=a[8]+n[8]*r,t},o.exactEquals=function(t,a){return t[0]===a[0]&&t[1]===a[1]&&t[2]===a[2]&&t[3]===a[3]&&t[4]===a[4]&&t[5]===a[5]&&t[6]===a[6]&&t[7]===a[7]&&t[8]===a[8]},o.equals=function(t,a){var n=t[0],o=t[1],u=t[2],l=t[3],e=t[4],M=t[5],s=t[6],i=t[7],c=t[8],h=a[0],S=a[1],I=a[2],f=a[3],x=a[4],D=a[5],F=t[6],m=a[7],d=a[8];return Math.abs(n-h)<=r.EPSILON*Math.max(1,Math.abs(n),Math.abs(h))&&Math.abs(o-S)<=r.EPSILON*Math.max(1,Math.abs(o),Math.abs(S))&&Math.abs(u-I)<=r.EPSILON*Math.max(1,Math.abs(u),Math.abs(I))&&Math.abs(l-f)<=r.EPSILON*Math.max(1,Math.abs(l),Math.abs(f))&&Math.abs(e-x)<=r.EPSILON*Math.max(1,Math.abs(e),Math.abs(x))&&Math.abs(M-D)<=r.EPSILON*Math.max(1,Math.abs(M),Math.abs(D))&&Math.abs(s-F)<=r.EPSILON*Math.max(1,Math.abs(s),Math.abs(F))&&Math.abs(i-m)<=r.EPSILON*Math.max(1,Math.abs(i),Math.abs(m))&&Math.abs(c-d)<=r.EPSILON*Math.max(1,Math.abs(c),Math.abs(d))},t.exports=o},function(t,a,n){var r=n(1),o={scalar:{},SIMD:{}};o.create=function(){var t=new r.ARRAY_TYPE(16);return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},o.clone=function(t){var a=new r.ARRAY_TYPE(16);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a[4]=t[4],a[5]=t[5],a[6]=t[6],a[7]=t[7],a[8]=t[8],a[9]=t[9],a[10]=t[10],a[11]=t[11],a[12]=t[12],a[13]=t[13],a[14]=t[14],a[15]=t[15],a},o.copy=function(t,a){return t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t[4]=a[4],t[5]=a[5],t[6]=a[6],t[7]=a[7],t[8]=a[8],t[9]=a[9],t[10]=a[10],t[11]=a[11],t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15],t},o.fromValues=function(t,a,n,o,u,l,e,M,s,i,c,h,S,I,f,x){var D=new r.ARRAY_TYPE(16);return D[0]=t,D[1]=a,D[2]=n,D[3]=o,D[4]=u,D[5]=l,D[6]=e,D[7]=M,D[8]=s,D[9]=i,D[10]=c,D[11]=h,D[12]=S,D[13]=I,D[14]=f,D[15]=x,D},o.set=function(t,a,n,r,o,u,l,e,M,s,i,c,h,S,I,f,x){return t[0]=a,t[1]=n,t[2]=r,t[3]=o,t[4]=u,t[5]=l,t[6]=e,t[7]=M,t[8]=s,t[9]=i,t[10]=c,t[11]=h,t[12]=S,t[13]=I,t[14]=f,t[15]=x,t},o.identity=function(t){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},o.scalar.transpose=function(t,a){if(t===a){var n=a[1],r=a[2],o=a[3],u=a[6],l=a[7],e=a[11];t[1]=a[4],t[2]=a[8],t[3]=a[12],t[4]=n,t[6]=a[9],t[7]=a[13],t[8]=r,t[9]=u,t[11]=a[14],t[12]=o,t[13]=l,t[14]=e}else t[0]=a[0],t[1]=a[4],t[2]=a[8],t[3]=a[12],t[4]=a[1],t[5]=a[5],t[6]=a[9],t[7]=a[13],t[8]=a[2],t[9]=a[6],t[10]=a[10],t[11]=a[14],t[12]=a[3],t[13]=a[7],t[14]=a[11],t[15]=a[15];return t},o.SIMD.transpose=function(t,a){var n,r,o,u,l,e,M,s,i,c;return n=SIMD.Float32x4.load(a,0),r=SIMD.Float32x4.load(a,4),o=SIMD.Float32x4.load(a,8),u=SIMD.Float32x4.load(a,12),l=SIMD.Float32x4.shuffle(n,r,0,1,4,5),e=SIMD.Float32x4.shuffle(o,u,0,1,4,5),M=SIMD.Float32x4.shuffle(l,e,0,2,4,6),s=SIMD.Float32x4.shuffle(l,e,1,3,5,7),SIMD.Float32x4.store(t,0,M),SIMD.Float32x4.store(t,4,s),l=SIMD.Float32x4.shuffle(n,r,2,3,6,7),e=SIMD.Float32x4.shuffle(o,u,2,3,6,7),i=SIMD.Float32x4.shuffle(l,e,0,2,4,6),c=SIMD.Float32x4.shuffle(l,e,1,3,5,7),SIMD.Float32x4.store(t,8,i),SIMD.Float32x4.store(t,12,c),t},o.transpose=r.USE_SIMD?o.SIMD.transpose:o.scalar.transpose,o.scalar.invert=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=a[4],e=a[5],M=a[6],s=a[7],i=a[8],c=a[9],h=a[10],S=a[11],I=a[12],f=a[13],x=a[14],D=a[15],F=n*e-r*l,m=n*M-o*l,d=n*s-u*l,b=r*M-o*e,v=r*s-u*e,z=o*s-u*M,p=i*f-c*I,w=i*x-h*I,E=i*D-S*I,A=c*x-h*f,P=c*D-S*f,L=h*D-S*x,q=F*L-m*P+d*A+b*E-v*w+z*p;return q?(q=1/q,t[0]=(e*L-M*P+s*A)*q,t[1]=(o*P-r*L-u*A)*q,t[2]=(f*z-x*v+D*b)*q,t[3]=(h*v-c*z-S*b)*q,t[4]=(M*E-l*L-s*w)*q,t[5]=(n*L-o*E+u*w)*q,t[6]=(x*d-I*z-D*m)*q,t[7]=(i*z-h*d+S*m)*q,t[8]=(l*P-e*E+s*p)*q,t[9]=(r*E-n*P-u*p)*q,t[10]=(I*v-f*d+D*F)*q,t[11]=(c*d-i*v-S*F)*q,t[12]=(e*w-l*A-M*p)*q,t[13]=(n*A-r*w+o*p)*q,t[14]=(f*m-I*b-x*F)*q,t[15]=(i*b-c*m+h*F)*q,t):null},o.SIMD.invert=function(t,a){var n,r,o,u,l,e,M,s,i,c,h=SIMD.Float32x4.load(a,0),S=SIMD.Float32x4.load(a,4),I=SIMD.Float32x4.load(a,8),f=SIMD.Float32x4.load(a,12);return l=SIMD.Float32x4.shuffle(h,S,0,1,4,5),r=SIMD.Float32x4.shuffle(I,f,0,1,4,5),n=SIMD.Float32x4.shuffle(l,r,0,2,4,6),r=SIMD.Float32x4.shuffle(r,l,1,3,5,7),l=SIMD.Float32x4.shuffle(h,S,2,3,6,7),u=SIMD.Float32x4.shuffle(I,f,2,3,6,7),o=SIMD.Float32x4.shuffle(l,u,0,2,4,6),u=SIMD.Float32x4.shuffle(u,l,1,3,5,7),l=SIMD.Float32x4.mul(o,u),l=SIMD.Float32x4.swizzle(l,1,0,3,2),e=SIMD.Float32x4.mul(r,l),M=SIMD.Float32x4.mul(n,l),l=SIMD.Float32x4.swizzle(l,2,3,0,1),e=SIMD.Float32x4.sub(SIMD.Float32x4.mul(r,l),e),M=SIMD.Float32x4.sub(SIMD.Float32x4.mul(n,l),M),M=SIMD.Float32x4.swizzle(M,2,3,0,1),l=SIMD.Float32x4.mul(r,o),l=SIMD.Float32x4.swizzle(l,1,0,3,2),e=SIMD.Float32x4.add(SIMD.Float32x4.mul(u,l),e),i=SIMD.Float32x4.mul(n,l),l=SIMD.Float32x4.swizzle(l,2,3,0,1),e=SIMD.Float32x4.sub(e,SIMD.Float32x4.mul(u,l)),i=SIMD.Float32x4.sub(SIMD.Float32x4.mul(n,l),i),i=SIMD.Float32x4.swizzle(i,2,3,0,1),l=SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(r,2,3,0,1),u),l=SIMD.Float32x4.swizzle(l,1,0,3,2),o=SIMD.Float32x4.swizzle(o,2,3,0,1),e=SIMD.Float32x4.add(SIMD.Float32x4.mul(o,l),e),s=SIMD.Float32x4.mul(n,l),l=SIMD.Float32x4.swizzle(l,2,3,0,1),e=SIMD.Float32x4.sub(e,SIMD.Float32x4.mul(o,l)),s=SIMD.Float32x4.sub(SIMD.Float32x4.mul(n,l),s),s=SIMD.Float32x4.swizzle(s,2,3,0,1),l=SIMD.Float32x4.mul(n,r),l=SIMD.Float32x4.swizzle(l,1,0,3,2),s=SIMD.Float32x4.add(SIMD.Float32x4.mul(u,l),s),i=SIMD.Float32x4.sub(SIMD.Float32x4.mul(o,l),i),l=SIMD.Float32x4.swizzle(l,2,3,0,1),s=SIMD.Float32x4.sub(SIMD.Float32x4.mul(u,l),s),i=SIMD.Float32x4.sub(i,SIMD.Float32x4.mul(o,l)),l=SIMD.Float32x4.mul(n,u),l=SIMD.Float32x4.swizzle(l,1,0,3,2),M=SIMD.Float32x4.sub(M,SIMD.Float32x4.mul(o,l)),s=SIMD.Float32x4.add(SIMD.Float32x4.mul(r,l),s),l=SIMD.Float32x4.swizzle(l,2,3,0,1),M=SIMD.Float32x4.add(SIMD.Float32x4.mul(o,l),M),s=SIMD.Float32x4.sub(s,SIMD.Float32x4.mul(r,l)),l=SIMD.Float32x4.mul(n,o),l=SIMD.Float32x4.swizzle(l,1,0,3,2),M=SIMD.Float32x4.add(SIMD.Float32x4.mul(u,l),M),i=SIMD.Float32x4.sub(i,SIMD.Float32x4.mul(r,l)),l=SIMD.Float32x4.swizzle(l,2,3,0,1),M=SIMD.Float32x4.sub(M,SIMD.Float32x4.mul(u,l)),i=SIMD.Float32x4.add(SIMD.Float32x4.mul(r,l),i),c=SIMD.Float32x4.mul(n,e),c=SIMD.Float32x4.add(SIMD.Float32x4.swizzle(c,2,3,0,1),c),c=SIMD.Float32x4.add(SIMD.Float32x4.swizzle(c,1,0,3,2),c),l=SIMD.Float32x4.reciprocalApproximation(c),c=SIMD.Float32x4.sub(SIMD.Float32x4.add(l,l),SIMD.Float32x4.mul(c,SIMD.Float32x4.mul(l,l))),(c=SIMD.Float32x4.swizzle(c,0,0,0,0))?(SIMD.Float32x4.store(t,0,SIMD.Float32x4.mul(c,e)),SIMD.Float32x4.store(t,4,SIMD.Float32x4.mul(c,M)),SIMD.Float32x4.store(t,8,SIMD.Float32x4.mul(c,s)),SIMD.Float32x4.store(t,12,SIMD.Float32x4.mul(c,i)),t):null},o.invert=r.USE_SIMD?o.SIMD.invert:o.scalar.invert,o.scalar.adjoint=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=a[4],e=a[5],M=a[6],s=a[7],i=a[8],c=a[9],h=a[10],S=a[11],I=a[12],f=a[13],x=a[14],D=a[15];return t[0]=e*(h*D-S*x)-c*(M*D-s*x)+f*(M*S-s*h),t[1]=-(r*(h*D-S*x)-c*(o*D-u*x)+f*(o*S-u*h)),t[2]=r*(M*D-s*x)-e*(o*D-u*x)+f*(o*s-u*M),t[3]=-(r*(M*S-s*h)-e*(o*S-u*h)+c*(o*s-u*M)),t[4]=-(l*(h*D-S*x)-i*(M*D-s*x)+I*(M*S-s*h)),t[5]=n*(h*D-S*x)-i*(o*D-u*x)+I*(o*S-u*h),t[6]=-(n*(M*D-s*x)-l*(o*D-u*x)+I*(o*s-u*M)),t[7]=n*(M*S-s*h)-l*(o*S-u*h)+i*(o*s-u*M),t[8]=l*(c*D-S*f)-i*(e*D-s*f)+I*(e*S-s*c),t[9]=-(n*(c*D-S*f)-i*(r*D-u*f)+I*(r*S-u*c)),t[10]=n*(e*D-s*f)-l*(r*D-u*f)+I*(r*s-u*e),t[11]=-(n*(e*S-s*c)-l*(r*S-u*c)+i*(r*s-u*e)),t[12]=-(l*(c*x-h*f)-i*(e*x-M*f)+I*(e*h-M*c)),t[13]=n*(c*x-h*f)-i*(r*x-o*f)+I*(r*h-o*c),t[14]=-(n*(e*x-M*f)-l*(r*x-o*f)+I*(r*M-o*e)),t[15]=n*(e*h-M*c)-l*(r*h-o*c)+i*(r*M-o*e),t},o.SIMD.adjoint=function(t,a){var n,r,o,u,l,e,M,s,i,c,h,S,I;return n=SIMD.Float32x4.load(a,0),r=SIMD.Float32x4.load(a,4),o=SIMD.Float32x4.load(a,8),u=SIMD.Float32x4.load(a,12),i=SIMD.Float32x4.shuffle(n,r,0,1,4,5),e=SIMD.Float32x4.shuffle(o,u,0,1,4,5),l=SIMD.Float32x4.shuffle(i,e,0,2,4,6),e=SIMD.Float32x4.shuffle(e,i,1,3,5,7),i=SIMD.Float32x4.shuffle(n,r,2,3,6,7),s=SIMD.Float32x4.shuffle(o,u,2,3,6,7),M=SIMD.Float32x4.shuffle(i,s,0,2,4,6),s=SIMD.Float32x4.shuffle(s,i,1,3,5,7),i=SIMD.Float32x4.mul(M,s),i=SIMD.Float32x4.swizzle(i,1,0,3,2),c=SIMD.Float32x4.mul(e,i),h=SIMD.Float32x4.mul(l,i),i=SIMD.Float32x4.swizzle(i,2,3,0,1),c=SIMD.Float32x4.sub(SIMD.Float32x4.mul(e,i),c),h=SIMD.Float32x4.sub(SIMD.Float32x4.mul(l,i),h),h=SIMD.Float32x4.swizzle(h,2,3,0,1),i=SIMD.Float32x4.mul(e,M),i=SIMD.Float32x4.swizzle(i,1,0,3,2),c=SIMD.Float32x4.add(SIMD.Float32x4.mul(s,i),c),I=SIMD.Float32x4.mul(l,i),i=SIMD.Float32x4.swizzle(i,2,3,0,1),c=SIMD.Float32x4.sub(c,SIMD.Float32x4.mul(s,i)),I=SIMD.Float32x4.sub(SIMD.Float32x4.mul(l,i),I),I=SIMD.Float32x4.swizzle(I,2,3,0,1),i=SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(e,2,3,0,1),s),i=SIMD.Float32x4.swizzle(i,1,0,3,2),M=SIMD.Float32x4.swizzle(M,2,3,0,1),c=SIMD.Float32x4.add(SIMD.Float32x4.mul(M,i),c),S=SIMD.Float32x4.mul(l,i),i=SIMD.Float32x4.swizzle(i,2,3,0,1),c=SIMD.Float32x4.sub(c,SIMD.Float32x4.mul(M,i)),S=SIMD.Float32x4.sub(SIMD.Float32x4.mul(l,i),S),S=SIMD.Float32x4.swizzle(S,2,3,0,1),i=SIMD.Float32x4.mul(l,e),i=SIMD.Float32x4.swizzle(i,1,0,3,2),S=SIMD.Float32x4.add(SIMD.Float32x4.mul(s,i),S),I=SIMD.Float32x4.sub(SIMD.Float32x4.mul(M,i),I),i=SIMD.Float32x4.swizzle(i,2,3,0,1),S=SIMD.Float32x4.sub(SIMD.Float32x4.mul(s,i),S),I=SIMD.Float32x4.sub(I,SIMD.Float32x4.mul(M,i)),i=SIMD.Float32x4.mul(l,s),i=SIMD.Float32x4.swizzle(i,1,0,3,2),h=SIMD.Float32x4.sub(h,SIMD.Float32x4.mul(M,i)),S=SIMD.Float32x4.add(SIMD.Float32x4.mul(e,i),S),i=SIMD.Float32x4.swizzle(i,2,3,0,1),h=SIMD.Float32x4.add(SIMD.Float32x4.mul(M,i),h),S=SIMD.Float32x4.sub(S,SIMD.Float32x4.mul(e,i)),i=SIMD.Float32x4.mul(l,M),i=SIMD.Float32x4.swizzle(i,1,0,3,2),h=SIMD.Float32x4.add(SIMD.Float32x4.mul(s,i),h),I=SIMD.Float32x4.sub(I,SIMD.Float32x4.mul(e,i)),i=SIMD.Float32x4.swizzle(i,2,3,0,1),h=SIMD.Float32x4.sub(h,SIMD.Float32x4.mul(s,i)),I=SIMD.Float32x4.add(SIMD.Float32x4.mul(e,i),I),SIMD.Float32x4.store(t,0,c),SIMD.Float32x4.store(t,4,h),SIMD.Float32x4.store(t,8,S),SIMD.Float32x4.store(t,12,I),t},o.adjoint=r.USE_SIMD?o.SIMD.adjoint:o.scalar.adjoint,o.determinant=function(t){var a=t[0],n=t[1],r=t[2],o=t[3],u=t[4],l=t[5],e=t[6],M=t[7],s=t[8],i=t[9],c=t[10],h=t[11],S=t[12],I=t[13],f=t[14],x=t[15],D=a*l-n*u,F=a*e-r*u,m=a*M-o*u,d=n*e-r*l,b=n*M-o*l,v=r*M-o*e,z=s*I-i*S,p=s*f-c*S,w=s*x-h*S,E=i*f-c*I,A=i*x-h*I,P=c*x-h*f;return D*P-F*A+m*E+d*w-b*p+v*z},o.SIMD.multiply=function(t,a,n){var r=SIMD.Float32x4.load(a,0),o=SIMD.Float32x4.load(a,4),u=SIMD.Float32x4.load(a,8),l=SIMD.Float32x4.load(a,12),e=SIMD.Float32x4.load(n,0),M=SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(e,0,0,0,0),r),SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(e,1,1,1,1),o),SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(e,2,2,2,2),u),SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(e,3,3,3,3),l))));SIMD.Float32x4.store(t,0,M);var s=SIMD.Float32x4.load(n,4),i=SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(s,0,0,0,0),r),SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(s,1,1,1,1),o),SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(s,2,2,2,2),u),SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(s,3,3,3,3),l))));SIMD.Float32x4.store(t,4,i);var c=SIMD.Float32x4.load(n,8),h=SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(c,0,0,0,0),r),SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(c,1,1,1,1),o),SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(c,2,2,2,2),u),SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(c,3,3,3,3),l))));SIMD.Float32x4.store(t,8,h);var S=SIMD.Float32x4.load(n,12),I=SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(S,0,0,0,0),r),SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(S,1,1,1,1),o),SIMD.Float32x4.add(SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(S,2,2,2,2),u),SIMD.Float32x4.mul(SIMD.Float32x4.swizzle(S,3,3,3,3),l))));return SIMD.Float32x4.store(t,12,I),t},o.scalar.multiply=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=a[6],i=a[7],c=a[8],h=a[9],S=a[10],I=a[11],f=a[12],x=a[13],D=a[14],F=a[15],m=n[0],d=n[1],b=n[2],v=n[3];return t[0]=m*r+d*e+b*c+v*f,t[1]=m*o+d*M+b*h+v*x,t[2]=m*u+d*s+b*S+v*D,t[3]=m*l+d*i+b*I+v*F,m=n[4],d=n[5],b=n[6],v=n[7],t[4]=m*r+d*e+b*c+v*f,t[5]=m*o+d*M+b*h+v*x,t[6]=m*u+d*s+b*S+v*D,t[7]=m*l+d*i+b*I+v*F,m=n[8],d=n[9],b=n[10],v=n[11],t[8]=m*r+d*e+b*c+v*f,t[9]=m*o+d*M+b*h+v*x,t[10]=m*u+d*s+b*S+v*D,t[11]=m*l+d*i+b*I+v*F,m=n[12],d=n[13],b=n[14],v=n[15],t[12]=m*r+d*e+b*c+v*f,t[13]=m*o+d*M+b*h+v*x,t[14]=m*u+d*s+b*S+v*D,t[15]=m*l+d*i+b*I+v*F,t},o.multiply=r.USE_SIMD?o.SIMD.multiply:o.scalar.multiply,o.mul=o.multiply,o.scalar.translate=function(t,a,n){var r,o,u,l,e,M,s,i,c,h,S,I,f=n[0],x=n[1],D=n[2];return a===t?(t[12]=a[0]*f+a[4]*x+a[8]*D+a[12],t[13]=a[1]*f+a[5]*x+a[9]*D+a[13],t[14]=a[2]*f+a[6]*x+a[10]*D+a[14],t[15]=a[3]*f+a[7]*x+a[11]*D+a[15]):(r=a[0],o=a[1],u=a[2],l=a[3],e=a[4],M=a[5],s=a[6],i=a[7],c=a[8],h=a[9],S=a[10],I=a[11],t[0]=r,t[1]=o,t[2]=u,t[3]=l,t[4]=e,t[5]=M,t[6]=s,t[7]=i,t[8]=c,t[9]=h,t[10]=S,t[11]=I,t[12]=r*f+e*x+c*D+a[12],t[13]=o*f+M*x+h*D+a[13],t[14]=u*f+s*x+S*D+a[14],t[15]=l*f+i*x+I*D+a[15]),t},o.SIMD.translate=function(t,a,n){var r=SIMD.Float32x4.load(a,0),o=SIMD.Float32x4.load(a,4),u=SIMD.Float32x4.load(a,8),l=SIMD.Float32x4.load(a,12),e=SIMD.Float32x4(n[0],n[1],n[2],0);a!==t&&(t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t[4]=a[4],t[5]=a[5],t[6]=a[6],t[7]=a[7],t[8]=a[8],t[9]=a[9],t[10]=a[10],t[11]=a[11]),r=SIMD.Float32x4.mul(r,SIMD.Float32x4.swizzle(e,0,0,0,0)),o=SIMD.Float32x4.mul(o,SIMD.Float32x4.swizzle(e,1,1,1,1)),u=SIMD.Float32x4.mul(u,SIMD.Float32x4.swizzle(e,2,2,2,2));var M=SIMD.Float32x4.add(r,SIMD.Float32x4.add(o,SIMD.Float32x4.add(u,l)));return SIMD.Float32x4.store(t,12,M),t},o.translate=r.USE_SIMD?o.SIMD.translate:o.scalar.translate,o.scalar.scale=function(t,a,n){var r=n[0],o=n[1],u=n[2];return t[0]=a[0]*r,t[1]=a[1]*r,t[2]=a[2]*r,t[3]=a[3]*r,t[4]=a[4]*o,t[5]=a[5]*o,t[6]=a[6]*o,t[7]=a[7]*o,t[8]=a[8]*u,t[9]=a[9]*u,t[10]=a[10]*u,t[11]=a[11]*u,t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15],t},o.SIMD.scale=function(t,a,n){var r,o,u,l=SIMD.Float32x4(n[0],n[1],n[2],0);return r=SIMD.Float32x4.load(a,0),SIMD.Float32x4.store(t,0,SIMD.Float32x4.mul(r,SIMD.Float32x4.swizzle(l,0,0,0,0))),o=SIMD.Float32x4.load(a,4),SIMD.Float32x4.store(t,4,SIMD.Float32x4.mul(o,SIMD.Float32x4.swizzle(l,1,1,1,1))),u=SIMD.Float32x4.load(a,8),SIMD.Float32x4.store(t,8,SIMD.Float32x4.mul(u,SIMD.Float32x4.swizzle(l,2,2,2,2))),t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15],t},o.scale=r.USE_SIMD?o.SIMD.scale:o.scalar.scale,o.rotate=function(t,a,n,o){var u,l,e,M,s,i,c,h,S,I,f,x,D,F,m,d,b,v,z,p,w,E,A,P,L=o[0],q=o[1],R=o[2],N=Math.sqrt(L*L+q*q+R*R);return Math.abs(N)<r.EPSILON?null:(N=1/N,L*=N,q*=N,R*=N,u=Math.sin(n),l=Math.cos(n),e=1-l,M=a[0],s=a[1],i=a[2],c=a[3],h=a[4],S=a[5],I=a[6],f=a[7],x=a[8],D=a[9],F=a[10],m=a[11],d=L*L*e+l,b=q*L*e+R*u,v=R*L*e-q*u,z=L*q*e-R*u,p=q*q*e+l,w=R*q*e+L*u,E=L*R*e+q*u,A=q*R*e-L*u,P=R*R*e+l,t[0]=M*d+h*b+x*v,t[1]=s*d+S*b+D*v,t[2]=i*d+I*b+F*v,t[3]=c*d+f*b+m*v,t[4]=M*z+h*p+x*w,t[5]=s*z+S*p+D*w,t[6]=i*z+I*p+F*w,t[7]=c*z+f*p+m*w,t[8]=M*E+h*A+x*P,t[9]=s*E+S*A+D*P,t[10]=i*E+I*A+F*P,t[11]=c*E+f*A+m*P,a!==t&&(t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15]),t)},o.scalar.rotateX=function(t,a,n){var r=Math.sin(n),o=Math.cos(n),u=a[4],l=a[5],e=a[6],M=a[7],s=a[8],i=a[9],c=a[10],h=a[11];return a!==t&&(t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15]),t[4]=u*o+s*r,t[5]=l*o+i*r,t[6]=e*o+c*r,t[7]=M*o+h*r,t[8]=s*o-u*r,t[9]=i*o-l*r,t[10]=c*o-e*r,t[11]=h*o-M*r,t},o.SIMD.rotateX=function(t,a,n){var r=SIMD.Float32x4.splat(Math.sin(n)),o=SIMD.Float32x4.splat(Math.cos(n));a!==t&&(t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15]);var u=SIMD.Float32x4.load(a,4),l=SIMD.Float32x4.load(a,8);return SIMD.Float32x4.store(t,4,SIMD.Float32x4.add(SIMD.Float32x4.mul(u,o),SIMD.Float32x4.mul(l,r))),SIMD.Float32x4.store(t,8,SIMD.Float32x4.sub(SIMD.Float32x4.mul(l,o),SIMD.Float32x4.mul(u,r))),t},o.rotateX=r.USE_SIMD?o.SIMD.rotateX:o.scalar.rotateX,o.scalar.rotateY=function(t,a,n){var r=Math.sin(n),o=Math.cos(n),u=a[0],l=a[1],e=a[2],M=a[3],s=a[8],i=a[9],c=a[10],h=a[11];return a!==t&&(t[4]=a[4],t[5]=a[5],t[6]=a[6],t[7]=a[7],t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15]),t[0]=u*o-s*r,t[1]=l*o-i*r,t[2]=e*o-c*r,t[3]=M*o-h*r,t[8]=u*r+s*o,t[9]=l*r+i*o,t[10]=e*r+c*o,t[11]=M*r+h*o,t},o.SIMD.rotateY=function(t,a,n){var r=SIMD.Float32x4.splat(Math.sin(n)),o=SIMD.Float32x4.splat(Math.cos(n));a!==t&&(t[4]=a[4],t[5]=a[5],t[6]=a[6],t[7]=a[7],t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15]);var u=SIMD.Float32x4.load(a,0),l=SIMD.Float32x4.load(a,8);return SIMD.Float32x4.store(t,0,SIMD.Float32x4.sub(SIMD.Float32x4.mul(u,o),SIMD.Float32x4.mul(l,r))),SIMD.Float32x4.store(t,8,SIMD.Float32x4.add(SIMD.Float32x4.mul(u,r),SIMD.Float32x4.mul(l,o))),t},o.rotateY=r.USE_SIMD?o.SIMD.rotateY:o.scalar.rotateY,o.scalar.rotateZ=function(t,a,n){var r=Math.sin(n),o=Math.cos(n),u=a[0],l=a[1],e=a[2],M=a[3],s=a[4],i=a[5],c=a[6],h=a[7];return a!==t&&(t[8]=a[8],t[9]=a[9],t[10]=a[10],t[11]=a[11],t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15]),t[0]=u*o+s*r,t[1]=l*o+i*r,t[2]=e*o+c*r,t[3]=M*o+h*r,t[4]=s*o-u*r,t[5]=i*o-l*r,t[6]=c*o-e*r,t[7]=h*o-M*r,t},o.SIMD.rotateZ=function(t,a,n){var r=SIMD.Float32x4.splat(Math.sin(n)),o=SIMD.Float32x4.splat(Math.cos(n));a!==t&&(t[8]=a[8],t[9]=a[9],t[10]=a[10],t[11]=a[11],t[12]=a[12],t[13]=a[13],t[14]=a[14],t[15]=a[15]);var u=SIMD.Float32x4.load(a,0),l=SIMD.Float32x4.load(a,4);return SIMD.Float32x4.store(t,0,SIMD.Float32x4.add(SIMD.Float32x4.mul(u,o),SIMD.Float32x4.mul(l,r))),SIMD.Float32x4.store(t,4,SIMD.Float32x4.sub(SIMD.Float32x4.mul(l,o),SIMD.Float32x4.mul(u,r))),t},o.rotateZ=r.USE_SIMD?o.SIMD.rotateZ:o.scalar.rotateZ,o.fromTranslation=function(t,a){return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=a[0],t[13]=a[1],t[14]=a[2],t[15]=1,t},o.fromScaling=function(t,a){return t[0]=a[0],t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=a[1],t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=a[2],t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},o.fromRotation=function(t,a,n){var o,u,l,e=n[0],M=n[1],s=n[2],i=Math.sqrt(e*e+M*M+s*s);return Math.abs(i)<r.EPSILON?null:(i=1/i,e*=i,M*=i,s*=i,o=Math.sin(a),u=Math.cos(a),l=1-u,t[0]=e*e*l+u,t[1]=M*e*l+s*o,t[2]=s*e*l-M*o,t[3]=0,t[4]=e*M*l-s*o,t[5]=M*M*l+u,t[6]=s*M*l+e*o,t[7]=0,t[8]=e*s*l+M*o,t[9]=M*s*l-e*o,t[10]=s*s*l+u,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t)},o.fromXRotation=function(t,a){var n=Math.sin(a),r=Math.cos(a);return t[0]=1,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=r,t[6]=n,t[7]=0,t[8]=0,t[9]=-n,t[10]=r,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},o.fromYRotation=function(t,a){var n=Math.sin(a),r=Math.cos(a);return t[0]=r,t[1]=0,t[2]=-n,t[3]=0,t[4]=0,t[5]=1,t[6]=0,t[7]=0,t[8]=n,t[9]=0,t[10]=r,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},o.fromZRotation=function(t,a){var n=Math.sin(a),r=Math.cos(a);return t[0]=r,t[1]=n,t[2]=0,t[3]=0,t[4]=-n,t[5]=r,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=1,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},o.fromRotationTranslation=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=r+r,M=o+o,s=u+u,i=r*e,c=r*M,h=r*s,S=o*M,I=o*s,f=u*s,x=l*e,D=l*M,F=l*s;return t[0]=1-(S+f),t[1]=c+F,t[2]=h-D,t[3]=0,t[4]=c-F,t[5]=1-(i+f),t[6]=I+x,t[7]=0,t[8]=h+D,t[9]=I-x,t[10]=1-(i+S),t[11]=0,t[12]=n[0],t[13]=n[1],t[14]=n[2],t[15]=1,t},o.getTranslation=function(t,a){return t[0]=a[12],t[1]=a[13],t[2]=a[14],t},o.getRotation=function(t,a){var n=a[0]+a[5]+a[10],r=0;return n>0?(r=2*Math.sqrt(n+1),t[3]=.25*r,t[0]=(a[6]-a[9])/r,t[1]=(a[8]-a[2])/r,t[2]=(a[1]-a[4])/r):a[0]>a[5]&a[0]>a[10]?(r=2*Math.sqrt(1+a[0]-a[5]-a[10]),t[3]=(a[6]-a[9])/r,t[0]=.25*r,t[1]=(a[1]+a[4])/r,t[2]=(a[8]+a[2])/r):a[5]>a[10]?(r=2*Math.sqrt(1+a[5]-a[0]-a[10]),t[3]=(a[8]-a[2])/r,t[0]=(a[1]+a[4])/r,t[1]=.25*r,t[2]=(a[6]+a[9])/r):(r=2*Math.sqrt(1+a[10]-a[0]-a[5]),t[3]=(a[1]-a[4])/r,t[0]=(a[8]+a[2])/r,t[1]=(a[6]+a[9])/r,t[2]=.25*r),t},o.fromRotationTranslationScale=function(t,a,n,r){var o=a[0],u=a[1],l=a[2],e=a[3],M=o+o,s=u+u,i=l+l,c=o*M,h=o*s,S=o*i,I=u*s,f=u*i,x=l*i,D=e*M,F=e*s,m=e*i,d=r[0],b=r[1],v=r[2];return t[0]=(1-(I+x))*d,t[1]=(h+m)*d,t[2]=(S-F)*d,t[3]=0,t[4]=(h-m)*b,t[5]=(1-(c+x))*b,t[6]=(f+D)*b,t[7]=0,t[8]=(S+F)*v,t[9]=(f-D)*v,t[10]=(1-(c+I))*v,t[11]=0,t[12]=n[0],t[13]=n[1],t[14]=n[2],t[15]=1,t},o.fromRotationTranslationScaleOrigin=function(t,a,n,r,o){
var u=a[0],l=a[1],e=a[2],M=a[3],s=u+u,i=l+l,c=e+e,h=u*s,S=u*i,I=u*c,f=l*i,x=l*c,D=e*c,F=M*s,m=M*i,d=M*c,b=r[0],v=r[1],z=r[2],p=o[0],w=o[1],E=o[2];return t[0]=(1-(f+D))*b,t[1]=(S+d)*b,t[2]=(I-m)*b,t[3]=0,t[4]=(S-d)*v,t[5]=(1-(h+D))*v,t[6]=(x+F)*v,t[7]=0,t[8]=(I+m)*z,t[9]=(x-F)*z,t[10]=(1-(h+f))*z,t[11]=0,t[12]=n[0]+p-(t[0]*p+t[4]*w+t[8]*E),t[13]=n[1]+w-(t[1]*p+t[5]*w+t[9]*E),t[14]=n[2]+E-(t[2]*p+t[6]*w+t[10]*E),t[15]=1,t},o.fromQuat=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=n+n,e=r+r,M=o+o,s=n*l,i=r*l,c=r*e,h=o*l,S=o*e,I=o*M,f=u*l,x=u*e,D=u*M;return t[0]=1-c-I,t[1]=i+D,t[2]=h-x,t[3]=0,t[4]=i-D,t[5]=1-s-I,t[6]=S+f,t[7]=0,t[8]=h+x,t[9]=S-f,t[10]=1-s-c,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t},o.frustum=function(t,a,n,r,o,u,l){var e=1/(n-a),M=1/(o-r),s=1/(u-l);return t[0]=2*u*e,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=2*u*M,t[6]=0,t[7]=0,t[8]=(n+a)*e,t[9]=(o+r)*M,t[10]=(l+u)*s,t[11]=-1,t[12]=0,t[13]=0,t[14]=l*u*2*s,t[15]=0,t},o.perspective=function(t,a,n,r,o){var u=1/Math.tan(a/2),l=1/(r-o);return t[0]=u/n,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=u,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=(o+r)*l,t[11]=-1,t[12]=0,t[13]=0,t[14]=2*o*r*l,t[15]=0,t},o.perspectiveFromFieldOfView=function(t,a,n,r){var o=Math.tan(a.upDegrees*Math.PI/180),u=Math.tan(a.downDegrees*Math.PI/180),l=Math.tan(a.leftDegrees*Math.PI/180),e=Math.tan(a.rightDegrees*Math.PI/180),M=2/(l+e),s=2/(o+u);return t[0]=M,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=s,t[6]=0,t[7]=0,t[8]=-((l-e)*M*.5),t[9]=(o-u)*s*.5,t[10]=r/(n-r),t[11]=-1,t[12]=0,t[13]=0,t[14]=r*n/(n-r),t[15]=0,t},o.ortho=function(t,a,n,r,o,u,l){var e=1/(a-n),M=1/(r-o),s=1/(u-l);return t[0]=-2*e,t[1]=0,t[2]=0,t[3]=0,t[4]=0,t[5]=-2*M,t[6]=0,t[7]=0,t[8]=0,t[9]=0,t[10]=2*s,t[11]=0,t[12]=(a+n)*e,t[13]=(o+r)*M,t[14]=(l+u)*s,t[15]=1,t},o.lookAt=function(t,a,n,u){var l,e,M,s,i,c,h,S,I,f,x=a[0],D=a[1],F=a[2],m=u[0],d=u[1],b=u[2],v=n[0],z=n[1],p=n[2];return Math.abs(x-v)<r.EPSILON&&Math.abs(D-z)<r.EPSILON&&Math.abs(F-p)<r.EPSILON?o.identity(t):(h=x-v,S=D-z,I=F-p,f=1/Math.sqrt(h*h+S*S+I*I),h*=f,S*=f,I*=f,l=d*I-b*S,e=b*h-m*I,M=m*S-d*h,f=Math.sqrt(l*l+e*e+M*M),f?(f=1/f,l*=f,e*=f,M*=f):(l=0,e=0,M=0),s=S*M-I*e,i=I*l-h*M,c=h*e-S*l,f=Math.sqrt(s*s+i*i+c*c),f?(f=1/f,s*=f,i*=f,c*=f):(s=0,i=0,c=0),t[0]=l,t[1]=s,t[2]=h,t[3]=0,t[4]=e,t[5]=i,t[6]=S,t[7]=0,t[8]=M,t[9]=c,t[10]=I,t[11]=0,t[12]=-(l*x+e*D+M*F),t[13]=-(s*x+i*D+c*F),t[14]=-(h*x+S*D+I*F),t[15]=1,t)},o.str=function(t){return"mat4("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+", "+t[4]+", "+t[5]+", "+t[6]+", "+t[7]+", "+t[8]+", "+t[9]+", "+t[10]+", "+t[11]+", "+t[12]+", "+t[13]+", "+t[14]+", "+t[15]+")"},o.frob=function(t){return Math.sqrt(Math.pow(t[0],2)+Math.pow(t[1],2)+Math.pow(t[2],2)+Math.pow(t[3],2)+Math.pow(t[4],2)+Math.pow(t[5],2)+Math.pow(t[6],2)+Math.pow(t[7],2)+Math.pow(t[8],2)+Math.pow(t[9],2)+Math.pow(t[10],2)+Math.pow(t[11],2)+Math.pow(t[12],2)+Math.pow(t[13],2)+Math.pow(t[14],2)+Math.pow(t[15],2))},o.add=function(t,a,n){return t[0]=a[0]+n[0],t[1]=a[1]+n[1],t[2]=a[2]+n[2],t[3]=a[3]+n[3],t[4]=a[4]+n[4],t[5]=a[5]+n[5],t[6]=a[6]+n[6],t[7]=a[7]+n[7],t[8]=a[8]+n[8],t[9]=a[9]+n[9],t[10]=a[10]+n[10],t[11]=a[11]+n[11],t[12]=a[12]+n[12],t[13]=a[13]+n[13],t[14]=a[14]+n[14],t[15]=a[15]+n[15],t},o.subtract=function(t,a,n){return t[0]=a[0]-n[0],t[1]=a[1]-n[1],t[2]=a[2]-n[2],t[3]=a[3]-n[3],t[4]=a[4]-n[4],t[5]=a[5]-n[5],t[6]=a[6]-n[6],t[7]=a[7]-n[7],t[8]=a[8]-n[8],t[9]=a[9]-n[9],t[10]=a[10]-n[10],t[11]=a[11]-n[11],t[12]=a[12]-n[12],t[13]=a[13]-n[13],t[14]=a[14]-n[14],t[15]=a[15]-n[15],t},o.sub=o.subtract,o.multiplyScalar=function(t,a,n){return t[0]=a[0]*n,t[1]=a[1]*n,t[2]=a[2]*n,t[3]=a[3]*n,t[4]=a[4]*n,t[5]=a[5]*n,t[6]=a[6]*n,t[7]=a[7]*n,t[8]=a[8]*n,t[9]=a[9]*n,t[10]=a[10]*n,t[11]=a[11]*n,t[12]=a[12]*n,t[13]=a[13]*n,t[14]=a[14]*n,t[15]=a[15]*n,t},o.multiplyScalarAndAdd=function(t,a,n,r){return t[0]=a[0]+n[0]*r,t[1]=a[1]+n[1]*r,t[2]=a[2]+n[2]*r,t[3]=a[3]+n[3]*r,t[4]=a[4]+n[4]*r,t[5]=a[5]+n[5]*r,t[6]=a[6]+n[6]*r,t[7]=a[7]+n[7]*r,t[8]=a[8]+n[8]*r,t[9]=a[9]+n[9]*r,t[10]=a[10]+n[10]*r,t[11]=a[11]+n[11]*r,t[12]=a[12]+n[12]*r,t[13]=a[13]+n[13]*r,t[14]=a[14]+n[14]*r,t[15]=a[15]+n[15]*r,t},o.exactEquals=function(t,a){return t[0]===a[0]&&t[1]===a[1]&&t[2]===a[2]&&t[3]===a[3]&&t[4]===a[4]&&t[5]===a[5]&&t[6]===a[6]&&t[7]===a[7]&&t[8]===a[8]&&t[9]===a[9]&&t[10]===a[10]&&t[11]===a[11]&&t[12]===a[12]&&t[13]===a[13]&&t[14]===a[14]&&t[15]===a[15]},o.equals=function(t,a){var n=t[0],o=t[1],u=t[2],l=t[3],e=t[4],M=t[5],s=t[6],i=t[7],c=t[8],h=t[9],S=t[10],I=t[11],f=t[12],x=t[13],D=t[14],F=t[15],m=a[0],d=a[1],b=a[2],v=a[3],z=a[4],p=a[5],w=a[6],E=a[7],A=a[8],P=a[9],L=a[10],q=a[11],R=a[12],N=a[13],O=a[14],Y=a[15];return Math.abs(n-m)<=r.EPSILON*Math.max(1,Math.abs(n),Math.abs(m))&&Math.abs(o-d)<=r.EPSILON*Math.max(1,Math.abs(o),Math.abs(d))&&Math.abs(u-b)<=r.EPSILON*Math.max(1,Math.abs(u),Math.abs(b))&&Math.abs(l-v)<=r.EPSILON*Math.max(1,Math.abs(l),Math.abs(v))&&Math.abs(e-z)<=r.EPSILON*Math.max(1,Math.abs(e),Math.abs(z))&&Math.abs(M-p)<=r.EPSILON*Math.max(1,Math.abs(M),Math.abs(p))&&Math.abs(s-w)<=r.EPSILON*Math.max(1,Math.abs(s),Math.abs(w))&&Math.abs(i-E)<=r.EPSILON*Math.max(1,Math.abs(i),Math.abs(E))&&Math.abs(c-A)<=r.EPSILON*Math.max(1,Math.abs(c),Math.abs(A))&&Math.abs(h-P)<=r.EPSILON*Math.max(1,Math.abs(h),Math.abs(P))&&Math.abs(S-L)<=r.EPSILON*Math.max(1,Math.abs(S),Math.abs(L))&&Math.abs(I-q)<=r.EPSILON*Math.max(1,Math.abs(I),Math.abs(q))&&Math.abs(f-R)<=r.EPSILON*Math.max(1,Math.abs(f),Math.abs(R))&&Math.abs(x-N)<=r.EPSILON*Math.max(1,Math.abs(x),Math.abs(N))&&Math.abs(D-O)<=r.EPSILON*Math.max(1,Math.abs(D),Math.abs(O))&&Math.abs(F-Y)<=r.EPSILON*Math.max(1,Math.abs(F),Math.abs(Y))},t.exports=o},function(t,a,n){var r=n(1),o=n(4),u=n(7),l=n(8),e={};e.create=function(){var t=new r.ARRAY_TYPE(4);return t[0]=0,t[1]=0,t[2]=0,t[3]=1,t},e.rotationTo=function(){var t=u.create(),a=u.fromValues(1,0,0),n=u.fromValues(0,1,0);return function(r,o,l){var M=u.dot(o,l);return-.999999>M?(u.cross(t,a,o),u.length(t)<1e-6&&u.cross(t,n,o),u.normalize(t,t),e.setAxisAngle(r,t,Math.PI),r):M>.999999?(r[0]=0,r[1]=0,r[2]=0,r[3]=1,r):(u.cross(t,o,l),r[0]=t[0],r[1]=t[1],r[2]=t[2],r[3]=1+M,e.normalize(r,r))}}(),e.setAxes=function(){var t=o.create();return function(a,n,r,o){return t[0]=r[0],t[3]=r[1],t[6]=r[2],t[1]=o[0],t[4]=o[1],t[7]=o[2],t[2]=-n[0],t[5]=-n[1],t[8]=-n[2],e.normalize(a,e.fromMat3(a,t))}}(),e.clone=l.clone,e.fromValues=l.fromValues,e.copy=l.copy,e.set=l.set,e.identity=function(t){return t[0]=0,t[1]=0,t[2]=0,t[3]=1,t},e.setAxisAngle=function(t,a,n){n=.5*n;var r=Math.sin(n);return t[0]=r*a[0],t[1]=r*a[1],t[2]=r*a[2],t[3]=Math.cos(n),t},e.getAxisAngle=function(t,a){var n=2*Math.acos(a[3]),r=Math.sin(n/2);return 0!=r?(t[0]=a[0]/r,t[1]=a[1]/r,t[2]=a[2]/r):(t[0]=1,t[1]=0,t[2]=0),n},e.add=l.add,e.multiply=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3],e=n[0],M=n[1],s=n[2],i=n[3];return t[0]=r*i+l*e+o*s-u*M,t[1]=o*i+l*M+u*e-r*s,t[2]=u*i+l*s+r*M-o*e,t[3]=l*i-r*e-o*M-u*s,t},e.mul=e.multiply,e.scale=l.scale,e.rotateX=function(t,a,n){n*=.5;var r=a[0],o=a[1],u=a[2],l=a[3],e=Math.sin(n),M=Math.cos(n);return t[0]=r*M+l*e,t[1]=o*M+u*e,t[2]=u*M-o*e,t[3]=l*M-r*e,t},e.rotateY=function(t,a,n){n*=.5;var r=a[0],o=a[1],u=a[2],l=a[3],e=Math.sin(n),M=Math.cos(n);return t[0]=r*M-u*e,t[1]=o*M+l*e,t[2]=u*M+r*e,t[3]=l*M-o*e,t},e.rotateZ=function(t,a,n){n*=.5;var r=a[0],o=a[1],u=a[2],l=a[3],e=Math.sin(n),M=Math.cos(n);return t[0]=r*M+o*e,t[1]=o*M-r*e,t[2]=u*M+l*e,t[3]=l*M-u*e,t},e.calculateW=function(t,a){var n=a[0],r=a[1],o=a[2];return t[0]=n,t[1]=r,t[2]=o,t[3]=Math.sqrt(Math.abs(1-n*n-r*r-o*o)),t},e.dot=l.dot,e.lerp=l.lerp,e.slerp=function(t,a,n,r){var o,u,l,e,M,s=a[0],i=a[1],c=a[2],h=a[3],S=n[0],I=n[1],f=n[2],x=n[3];return u=s*S+i*I+c*f+h*x,0>u&&(u=-u,S=-S,I=-I,f=-f,x=-x),1-u>1e-6?(o=Math.acos(u),l=Math.sin(o),e=Math.sin((1-r)*o)/l,M=Math.sin(r*o)/l):(e=1-r,M=r),t[0]=e*s+M*S,t[1]=e*i+M*I,t[2]=e*c+M*f,t[3]=e*h+M*x,t},e.sqlerp=function(){var t=e.create(),a=e.create();return function(n,r,o,u,l,M){return e.slerp(t,r,l,M),e.slerp(a,o,u,M),e.slerp(n,t,a,2*M*(1-M)),n}}(),e.invert=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=n*n+r*r+o*o+u*u,e=l?1/l:0;return t[0]=-n*e,t[1]=-r*e,t[2]=-o*e,t[3]=u*e,t},e.conjugate=function(t,a){return t[0]=-a[0],t[1]=-a[1],t[2]=-a[2],t[3]=a[3],t},e.length=l.length,e.len=e.length,e.squaredLength=l.squaredLength,e.sqrLen=e.squaredLength,e.normalize=l.normalize,e.fromMat3=function(t,a){var n,r=a[0]+a[4]+a[8];if(r>0)n=Math.sqrt(r+1),t[3]=.5*n,n=.5/n,t[0]=(a[5]-a[7])*n,t[1]=(a[6]-a[2])*n,t[2]=(a[1]-a[3])*n;else{var o=0;a[4]>a[0]&&(o=1),a[8]>a[3*o+o]&&(o=2);var u=(o+1)%3,l=(o+2)%3;n=Math.sqrt(a[3*o+o]-a[3*u+u]-a[3*l+l]+1),t[o]=.5*n,n=.5/n,t[3]=(a[3*u+l]-a[3*l+u])*n,t[u]=(a[3*u+o]+a[3*o+u])*n,t[l]=(a[3*l+o]+a[3*o+l])*n}return t},e.str=function(t){return"quat("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+")"},e.exactEquals=l.exactEquals,e.equals=l.equals,t.exports=e},function(t,a,n){var r=n(1),o={};o.create=function(){var t=new r.ARRAY_TYPE(3);return t[0]=0,t[1]=0,t[2]=0,t},o.clone=function(t){var a=new r.ARRAY_TYPE(3);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a},o.fromValues=function(t,a,n){var o=new r.ARRAY_TYPE(3);return o[0]=t,o[1]=a,o[2]=n,o},o.copy=function(t,a){return t[0]=a[0],t[1]=a[1],t[2]=a[2],t},o.set=function(t,a,n,r){return t[0]=a,t[1]=n,t[2]=r,t},o.add=function(t,a,n){return t[0]=a[0]+n[0],t[1]=a[1]+n[1],t[2]=a[2]+n[2],t},o.subtract=function(t,a,n){return t[0]=a[0]-n[0],t[1]=a[1]-n[1],t[2]=a[2]-n[2],t},o.sub=o.subtract,o.multiply=function(t,a,n){return t[0]=a[0]*n[0],t[1]=a[1]*n[1],t[2]=a[2]*n[2],t},o.mul=o.multiply,o.divide=function(t,a,n){return t[0]=a[0]/n[0],t[1]=a[1]/n[1],t[2]=a[2]/n[2],t},o.div=o.divide,o.ceil=function(t,a){return t[0]=Math.ceil(a[0]),t[1]=Math.ceil(a[1]),t[2]=Math.ceil(a[2]),t},o.floor=function(t,a){return t[0]=Math.floor(a[0]),t[1]=Math.floor(a[1]),t[2]=Math.floor(a[2]),t},o.min=function(t,a,n){return t[0]=Math.min(a[0],n[0]),t[1]=Math.min(a[1],n[1]),t[2]=Math.min(a[2],n[2]),t},o.max=function(t,a,n){return t[0]=Math.max(a[0],n[0]),t[1]=Math.max(a[1],n[1]),t[2]=Math.max(a[2],n[2]),t},o.round=function(t,a){return t[0]=Math.round(a[0]),t[1]=Math.round(a[1]),t[2]=Math.round(a[2]),t},o.scale=function(t,a,n){return t[0]=a[0]*n,t[1]=a[1]*n,t[2]=a[2]*n,t},o.scaleAndAdd=function(t,a,n,r){return t[0]=a[0]+n[0]*r,t[1]=a[1]+n[1]*r,t[2]=a[2]+n[2]*r,t},o.distance=function(t,a){var n=a[0]-t[0],r=a[1]-t[1],o=a[2]-t[2];return Math.sqrt(n*n+r*r+o*o)},o.dist=o.distance,o.squaredDistance=function(t,a){var n=a[0]-t[0],r=a[1]-t[1],o=a[2]-t[2];return n*n+r*r+o*o},o.sqrDist=o.squaredDistance,o.length=function(t){var a=t[0],n=t[1],r=t[2];return Math.sqrt(a*a+n*n+r*r)},o.len=o.length,o.squaredLength=function(t){var a=t[0],n=t[1],r=t[2];return a*a+n*n+r*r},o.sqrLen=o.squaredLength,o.negate=function(t,a){return t[0]=-a[0],t[1]=-a[1],t[2]=-a[2],t},o.inverse=function(t,a){return t[0]=1/a[0],t[1]=1/a[1],t[2]=1/a[2],t},o.normalize=function(t,a){var n=a[0],r=a[1],o=a[2],u=n*n+r*r+o*o;return u>0&&(u=1/Math.sqrt(u),t[0]=a[0]*u,t[1]=a[1]*u,t[2]=a[2]*u),t},o.dot=function(t,a){return t[0]*a[0]+t[1]*a[1]+t[2]*a[2]},o.cross=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=n[0],e=n[1],M=n[2];return t[0]=o*M-u*e,t[1]=u*l-r*M,t[2]=r*e-o*l,t},o.lerp=function(t,a,n,r){var o=a[0],u=a[1],l=a[2];return t[0]=o+r*(n[0]-o),t[1]=u+r*(n[1]-u),t[2]=l+r*(n[2]-l),t},o.hermite=function(t,a,n,r,o,u){var l=u*u,e=l*(2*u-3)+1,M=l*(u-2)+u,s=l*(u-1),i=l*(3-2*u);return t[0]=a[0]*e+n[0]*M+r[0]*s+o[0]*i,t[1]=a[1]*e+n[1]*M+r[1]*s+o[1]*i,t[2]=a[2]*e+n[2]*M+r[2]*s+o[2]*i,t},o.bezier=function(t,a,n,r,o,u){var l=1-u,e=l*l,M=u*u,s=e*l,i=3*u*e,c=3*M*l,h=M*u;return t[0]=a[0]*s+n[0]*i+r[0]*c+o[0]*h,t[1]=a[1]*s+n[1]*i+r[1]*c+o[1]*h,t[2]=a[2]*s+n[2]*i+r[2]*c+o[2]*h,t},o.random=function(t,a){a=a||1;var n=2*r.RANDOM()*Math.PI,o=2*r.RANDOM()-1,u=Math.sqrt(1-o*o)*a;return t[0]=Math.cos(n)*u,t[1]=Math.sin(n)*u,t[2]=o*a,t},o.transformMat4=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=n[3]*r+n[7]*o+n[11]*u+n[15];return l=l||1,t[0]=(n[0]*r+n[4]*o+n[8]*u+n[12])/l,t[1]=(n[1]*r+n[5]*o+n[9]*u+n[13])/l,t[2]=(n[2]*r+n[6]*o+n[10]*u+n[14])/l,t},o.transformMat3=function(t,a,n){var r=a[0],o=a[1],u=a[2];return t[0]=r*n[0]+o*n[3]+u*n[6],t[1]=r*n[1]+o*n[4]+u*n[7],t[2]=r*n[2]+o*n[5]+u*n[8],t},o.transformQuat=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=n[0],e=n[1],M=n[2],s=n[3],i=s*r+e*u-M*o,c=s*o+M*r-l*u,h=s*u+l*o-e*r,S=-l*r-e*o-M*u;return t[0]=i*s+S*-l+c*-M-h*-e,t[1]=c*s+S*-e+h*-l-i*-M,t[2]=h*s+S*-M+i*-e-c*-l,t},o.rotateX=function(t,a,n,r){var o=[],u=[];return o[0]=a[0]-n[0],o[1]=a[1]-n[1],o[2]=a[2]-n[2],u[0]=o[0],u[1]=o[1]*Math.cos(r)-o[2]*Math.sin(r),u[2]=o[1]*Math.sin(r)+o[2]*Math.cos(r),t[0]=u[0]+n[0],t[1]=u[1]+n[1],t[2]=u[2]+n[2],t},o.rotateY=function(t,a,n,r){var o=[],u=[];return o[0]=a[0]-n[0],o[1]=a[1]-n[1],o[2]=a[2]-n[2],u[0]=o[2]*Math.sin(r)+o[0]*Math.cos(r),u[1]=o[1],u[2]=o[2]*Math.cos(r)-o[0]*Math.sin(r),t[0]=u[0]+n[0],t[1]=u[1]+n[1],t[2]=u[2]+n[2],t},o.rotateZ=function(t,a,n,r){var o=[],u=[];return o[0]=a[0]-n[0],o[1]=a[1]-n[1],o[2]=a[2]-n[2],u[0]=o[0]*Math.cos(r)-o[1]*Math.sin(r),u[1]=o[0]*Math.sin(r)+o[1]*Math.cos(r),u[2]=o[2],t[0]=u[0]+n[0],t[1]=u[1]+n[1],t[2]=u[2]+n[2],t},o.forEach=function(){var t=o.create();return function(a,n,r,o,u,l){var e,M;for(n||(n=3),r||(r=0),M=o?Math.min(o*n+r,a.length):a.length,e=r;M>e;e+=n)t[0]=a[e],t[1]=a[e+1],t[2]=a[e+2],u(t,t,l),a[e]=t[0],a[e+1]=t[1],a[e+2]=t[2];return a}}(),o.angle=function(t,a){var n=o.fromValues(t[0],t[1],t[2]),r=o.fromValues(a[0],a[1],a[2]);o.normalize(n,n),o.normalize(r,r);var u=o.dot(n,r);return u>1?0:Math.acos(u)},o.str=function(t){return"vec3("+t[0]+", "+t[1]+", "+t[2]+")"},o.exactEquals=function(t,a){return t[0]===a[0]&&t[1]===a[1]&&t[2]===a[2]},o.equals=function(t,a){var n=t[0],o=t[1],u=t[2],l=a[0],e=a[1],M=a[2];return Math.abs(n-l)<=r.EPSILON*Math.max(1,Math.abs(n),Math.abs(l))&&Math.abs(o-e)<=r.EPSILON*Math.max(1,Math.abs(o),Math.abs(e))&&Math.abs(u-M)<=r.EPSILON*Math.max(1,Math.abs(u),Math.abs(M))},t.exports=o},function(t,a,n){var r=n(1),o={};o.create=function(){var t=new r.ARRAY_TYPE(4);return t[0]=0,t[1]=0,t[2]=0,t[3]=0,t},o.clone=function(t){var a=new r.ARRAY_TYPE(4);return a[0]=t[0],a[1]=t[1],a[2]=t[2],a[3]=t[3],a},o.fromValues=function(t,a,n,o){var u=new r.ARRAY_TYPE(4);return u[0]=t,u[1]=a,u[2]=n,u[3]=o,u},o.copy=function(t,a){return t[0]=a[0],t[1]=a[1],t[2]=a[2],t[3]=a[3],t},o.set=function(t,a,n,r,o){return t[0]=a,t[1]=n,t[2]=r,t[3]=o,t},o.add=function(t,a,n){return t[0]=a[0]+n[0],t[1]=a[1]+n[1],t[2]=a[2]+n[2],t[3]=a[3]+n[3],t},o.subtract=function(t,a,n){return t[0]=a[0]-n[0],t[1]=a[1]-n[1],t[2]=a[2]-n[2],t[3]=a[3]-n[3],t},o.sub=o.subtract,o.multiply=function(t,a,n){return t[0]=a[0]*n[0],t[1]=a[1]*n[1],t[2]=a[2]*n[2],t[3]=a[3]*n[3],t},o.mul=o.multiply,o.divide=function(t,a,n){return t[0]=a[0]/n[0],t[1]=a[1]/n[1],t[2]=a[2]/n[2],t[3]=a[3]/n[3],t},o.div=o.divide,o.ceil=function(t,a){return t[0]=Math.ceil(a[0]),t[1]=Math.ceil(a[1]),t[2]=Math.ceil(a[2]),t[3]=Math.ceil(a[3]),t},o.floor=function(t,a){return t[0]=Math.floor(a[0]),t[1]=Math.floor(a[1]),t[2]=Math.floor(a[2]),t[3]=Math.floor(a[3]),t},o.min=function(t,a,n){return t[0]=Math.min(a[0],n[0]),t[1]=Math.min(a[1],n[1]),t[2]=Math.min(a[2],n[2]),t[3]=Math.min(a[3],n[3]),t},o.max=function(t,a,n){return t[0]=Math.max(a[0],n[0]),t[1]=Math.max(a[1],n[1]),t[2]=Math.max(a[2],n[2]),t[3]=Math.max(a[3],n[3]),t},o.round=function(t,a){return t[0]=Math.round(a[0]),t[1]=Math.round(a[1]),t[2]=Math.round(a[2]),t[3]=Math.round(a[3]),t},o.scale=function(t,a,n){return t[0]=a[0]*n,t[1]=a[1]*n,t[2]=a[2]*n,t[3]=a[3]*n,t},o.scaleAndAdd=function(t,a,n,r){return t[0]=a[0]+n[0]*r,t[1]=a[1]+n[1]*r,t[2]=a[2]+n[2]*r,t[3]=a[3]+n[3]*r,t},o.distance=function(t,a){var n=a[0]-t[0],r=a[1]-t[1],o=a[2]-t[2],u=a[3]-t[3];return Math.sqrt(n*n+r*r+o*o+u*u)},o.dist=o.distance,o.squaredDistance=function(t,a){var n=a[0]-t[0],r=a[1]-t[1],o=a[2]-t[2],u=a[3]-t[3];return n*n+r*r+o*o+u*u},o.sqrDist=o.squaredDistance,o.length=function(t){var a=t[0],n=t[1],r=t[2],o=t[3];return Math.sqrt(a*a+n*n+r*r+o*o)},o.len=o.length,o.squaredLength=function(t){var a=t[0],n=t[1],r=t[2],o=t[3];return a*a+n*n+r*r+o*o},o.sqrLen=o.squaredLength,o.negate=function(t,a){return t[0]=-a[0],t[1]=-a[1],t[2]=-a[2],t[3]=-a[3],t},o.inverse=function(t,a){return t[0]=1/a[0],t[1]=1/a[1],t[2]=1/a[2],t[3]=1/a[3],t},o.normalize=function(t,a){var n=a[0],r=a[1],o=a[2],u=a[3],l=n*n+r*r+o*o+u*u;return l>0&&(l=1/Math.sqrt(l),t[0]=n*l,t[1]=r*l,t[2]=o*l,t[3]=u*l),t},o.dot=function(t,a){return t[0]*a[0]+t[1]*a[1]+t[2]*a[2]+t[3]*a[3]},o.lerp=function(t,a,n,r){var o=a[0],u=a[1],l=a[2],e=a[3];return t[0]=o+r*(n[0]-o),t[1]=u+r*(n[1]-u),t[2]=l+r*(n[2]-l),t[3]=e+r*(n[3]-e),t},o.random=function(t,a){return a=a||1,t[0]=r.RANDOM(),t[1]=r.RANDOM(),t[2]=r.RANDOM(),t[3]=r.RANDOM(),o.normalize(t,t),o.scale(t,t,a),t},o.transformMat4=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=a[3];return t[0]=n[0]*r+n[4]*o+n[8]*u+n[12]*l,t[1]=n[1]*r+n[5]*o+n[9]*u+n[13]*l,t[2]=n[2]*r+n[6]*o+n[10]*u+n[14]*l,t[3]=n[3]*r+n[7]*o+n[11]*u+n[15]*l,t},o.transformQuat=function(t,a,n){var r=a[0],o=a[1],u=a[2],l=n[0],e=n[1],M=n[2],s=n[3],i=s*r+e*u-M*o,c=s*o+M*r-l*u,h=s*u+l*o-e*r,S=-l*r-e*o-M*u;return t[0]=i*s+S*-l+c*-M-h*-e,t[1]=c*s+S*-e+h*-l-i*-M,t[2]=h*s+S*-M+i*-e-c*-l,t[3]=a[3],t},o.forEach=function(){var t=o.create();return function(a,n,r,o,u,l){var e,M;for(n||(n=4),r||(r=0),M=o?Math.min(o*n+r,a.length):a.length,e=r;M>e;e+=n)t[0]=a[e],t[1]=a[e+1],t[2]=a[e+2],t[3]=a[e+3],u(t,t,l),a[e]=t[0],a[e+1]=t[1],a[e+2]=t[2],a[e+3]=t[3];return a}}(),o.str=function(t){return"vec4("+t[0]+", "+t[1]+", "+t[2]+", "+t[3]+")"},o.exactEquals=function(t,a){return t[0]===a[0]&&t[1]===a[1]&&t[2]===a[2]&&t[3]===a[3]},o.equals=function(t,a){var n=t[0],o=t[1],u=t[2],l=t[3],e=a[0],M=a[1],s=a[2],i=a[3];return Math.abs(n-e)<=r.EPSILON*Math.max(1,Math.abs(n),Math.abs(e))&&Math.abs(o-M)<=r.EPSILON*Math.max(1,Math.abs(o),Math.abs(M))&&Math.abs(u-s)<=r.EPSILON*Math.max(1,Math.abs(u),Math.abs(s))&&Math.abs(l-i)<=r.EPSILON*Math.max(1,Math.abs(l),Math.abs(i))},t.exports=o},function(t,a,n){var r=n(1),o={};o.create=function(){var t=new r.ARRAY_TYPE(2);return t[0]=0,t[1]=0,t},o.clone=function(t){var a=new r.ARRAY_TYPE(2);return a[0]=t[0],a[1]=t[1],a},o.fromValues=function(t,a){var n=new r.ARRAY_TYPE(2);return n[0]=t,n[1]=a,n},o.copy=function(t,a){return t[0]=a[0],t[1]=a[1],t},o.set=function(t,a,n){return t[0]=a,t[1]=n,t},o.add=function(t,a,n){return t[0]=a[0]+n[0],t[1]=a[1]+n[1],t},o.subtract=function(t,a,n){return t[0]=a[0]-n[0],t[1]=a[1]-n[1],t},o.sub=o.subtract,o.multiply=function(t,a,n){return t[0]=a[0]*n[0],t[1]=a[1]*n[1],t},o.mul=o.multiply,o.divide=function(t,a,n){return t[0]=a[0]/n[0],t[1]=a[1]/n[1],t},o.div=o.divide,o.ceil=function(t,a){return t[0]=Math.ceil(a[0]),t[1]=Math.ceil(a[1]),t},o.floor=function(t,a){return t[0]=Math.floor(a[0]),t[1]=Math.floor(a[1]),t},o.min=function(t,a,n){return t[0]=Math.min(a[0],n[0]),t[1]=Math.min(a[1],n[1]),t},o.max=function(t,a,n){return t[0]=Math.max(a[0],n[0]),t[1]=Math.max(a[1],n[1]),t},o.round=function(t,a){return t[0]=Math.round(a[0]),t[1]=Math.round(a[1]),t},o.scale=function(t,a,n){return t[0]=a[0]*n,t[1]=a[1]*n,t},o.scaleAndAdd=function(t,a,n,r){return t[0]=a[0]+n[0]*r,t[1]=a[1]+n[1]*r,t},o.distance=function(t,a){var n=a[0]-t[0],r=a[1]-t[1];return Math.sqrt(n*n+r*r)},o.dist=o.distance,o.squaredDistance=function(t,a){var n=a[0]-t[0],r=a[1]-t[1];return n*n+r*r},o.sqrDist=o.squaredDistance,o.length=function(t){var a=t[0],n=t[1];return Math.sqrt(a*a+n*n)},o.len=o.length,o.squaredLength=function(t){var a=t[0],n=t[1];return a*a+n*n},o.sqrLen=o.squaredLength,o.negate=function(t,a){return t[0]=-a[0],t[1]=-a[1],t},o.inverse=function(t,a){return t[0]=1/a[0],t[1]=1/a[1],t},o.normalize=function(t,a){var n=a[0],r=a[1],o=n*n+r*r;return o>0&&(o=1/Math.sqrt(o),t[0]=a[0]*o,t[1]=a[1]*o),t},o.dot=function(t,a){return t[0]*a[0]+t[1]*a[1]},o.cross=function(t,a,n){var r=a[0]*n[1]-a[1]*n[0];return t[0]=t[1]=0,t[2]=r,t},o.lerp=function(t,a,n,r){var o=a[0],u=a[1];return t[0]=o+r*(n[0]-o),t[1]=u+r*(n[1]-u),t},o.random=function(t,a){a=a||1;var n=2*r.RANDOM()*Math.PI;return t[0]=Math.cos(n)*a,t[1]=Math.sin(n)*a,t},o.transformMat2=function(t,a,n){var r=a[0],o=a[1];return t[0]=n[0]*r+n[2]*o,t[1]=n[1]*r+n[3]*o,t},o.transformMat2d=function(t,a,n){var r=a[0],o=a[1];return t[0]=n[0]*r+n[2]*o+n[4],t[1]=n[1]*r+n[3]*o+n[5],t},o.transformMat3=function(t,a,n){var r=a[0],o=a[1];return t[0]=n[0]*r+n[3]*o+n[6],t[1]=n[1]*r+n[4]*o+n[7],t},o.transformMat4=function(t,a,n){var r=a[0],o=a[1];return t[0]=n[0]*r+n[4]*o+n[12],t[1]=n[1]*r+n[5]*o+n[13],t},o.forEach=function(){var t=o.create();return function(a,n,r,o,u,l){var e,M;for(n||(n=2),r||(r=0),M=o?Math.min(o*n+r,a.length):a.length,e=r;M>e;e+=n)t[0]=a[e],t[1]=a[e+1],u(t,t,l),a[e]=t[0],a[e+1]=t[1];return a}}(),o.str=function(t){return"vec2("+t[0]+", "+t[1]+")"},o.exactEquals=function(t,a){return t[0]===a[0]&&t[1]===a[1]},o.equals=function(t,a){var n=t[0],o=t[1],u=a[0],l=a[1];return Math.abs(n-u)<=r.EPSILON*Math.max(1,Math.abs(n),Math.abs(u))&&Math.abs(o-l)<=r.EPSILON*Math.max(1,Math.abs(o),Math.abs(l))},t.exports=o}])});
},{}],24:[function(require,module,exports){

"use strict"

function imageToUint8Array(image) {
    var canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d');
    canvas.width = image.width,
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, image.width, image.height);
    var buff = new Uint8Array(imageData.data.buffer);
    return buff;
}

function flipYImageArray(image, width, height) {
    var buff = new Uint8Array(image.length);
    var i = 0;
    for (var y = height - 1; y >= 0; y--) {
        for (var x = 0; x < width * 4; x += 4) {
            for (var c = 0; c < 4; c++) {
                buff[i] = image[width * 4 * y + x + c];
                i++;
            }
        }
    }
    return buff;
}

module.exports = {
    imageToUint8Array: imageToUint8Array,
    flipYImageArray: flipYImageArray
};

},{}],25:[function(require,module,exports){
/*!
 * FPSMeter 0.3.1 - 9th May 2013
 * https://github.com/Darsain/fpsmeter
 *
 * Licensed under the MIT license.
 * http://opensource.org/licenses/MIT
 */
;(function (w, undefined) {
    'use strict';

    /**
     * Create a new element.
     *
     * @param  {String} name Element type name.
     *
     * @return {Element}
     */
    function newEl(name) {
        return document.createElement(name);
    }

    /**
     * Apply theme CSS properties to element.
     *
     * @param  {Element} element DOM element.
     * @param  {Object}  theme   Theme object.
     *
     * @return {Element}
     */
    function applyTheme(element, theme) {
        for (var name in theme) {
            try {
                element.style[name] = theme[name];
            } catch (e) {}
        }
        return element;
    }

    /**
     * Return type of the value.
     *
     * @param  {Mixed} value
     *
     * @return {String}
     */
    function type(value) {
        if (value == null) {
            return String(value);
        }

        if (typeof value === 'object' || typeof value === 'function') {
            return Object.prototype.toString.call(value).match(/\s([a-z]+)/i)[1].toLowerCase() || 'object';
        }

        return typeof value;
    }

    /**
     * Check whether the value is in an array.
     *
     * @param  {Mixed} value
     * @param  {Array} array
     *
     * @return {Integer} Array index or -1 when not found.
     */
    function inArray(value, array) {
        if (type(array) !== 'array') {
            return -1;
        }
        if (array.indexOf) {
            return array.indexOf(value);
        }
        for (var i = 0, l = array.length; i < l; i++) {
            if (array[i] === value) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Poor man's deep object extend.
     *
     * Example:
     *   extend({}, defaults, options);
     *
     * @return {Void}
     */
    function extend() {
        var args = arguments;
        for (var key in args[1]) {
            if (args[1].hasOwnProperty(key)) {
                switch (type(args[1][key])) {
                    case 'object':
                        args[0][key] = extend({}, args[0][key], args[1][key]);
                        break;

                    case 'array':
                        args[0][key] = args[1][key].slice(0);
                        break;

                    default:
                        args[0][key] = args[1][key];
                }
            }
        }
        return args.length > 2 ?
            extend.apply(null, [args[0]].concat(Array.prototype.slice.call(args, 2))) :
            args[0];
    }

    /**
     * Convert HSL color to HEX string.
     *
     * @param  {Array} hsl Array with [hue, saturation, lightness].
     *
     * @return {Array} Array with [red, green, blue].
     */
    function hslToHex(h, s, l) {
        var r, g, b;
        var v, min, sv, sextant, fract, vsf;

        if (l <= 0.5) {
            v = l * (1 + s);
        } else {
            v = l + s - l * s;
        }

        if (v === 0) {
            return '#000';
        } else {
            min = 2 * l - v;
            sv = (v - min) / v;
            h = 6 * h;
            sextant = Math.floor(h);
            fract = h - sextant;
            vsf = v * sv * fract;
            if (sextant === 0 || sextant === 6) {
                r = v;
                g = min + vsf;
                b = min;
            } else if (sextant === 1) {
                r = v - vsf;
                g = v;
                b = min;
            } else if (sextant === 2) {
                r = min;
                g = v;
                b = min + vsf;
            } else if (sextant === 3) {
                r = min;
                g = v - vsf;
                b = v;
            } else if (sextant === 4) {
                r = min + vsf;
                g = min;
                b = v;
            } else {
                r = v;
                g = min;
                b = v - vsf;
            }
            return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }
    }

    /**
     * Helper function for hslToHex.
     */
    function componentToHex(c) {
        c = Math.round(c * 255).toString(16);
        return c.length === 1 ? '0' + c : c;
    }

    /**
     * Manage element event listeners.
     *
     * @param  {Node}     element
     * @param  {Event}    eventName
     * @param  {Function} handler
     * @param  {Bool}     remove
     *
     * @return {Void}
     */
    function listener(element, eventName, handler, remove) {
        if (element.addEventListener) {
            element[remove ? 'removeEventListener' : 'addEventListener'](eventName, handler, false);
        } else if (element.attachEvent) {
            element[remove ? 'detachEvent' : 'attachEvent']('on' + eventName, handler);
        }
    }

    // Preferred timing funtion
    var getTime;
    (function () {
        var perf = w.performance;
        if (perf && (perf.now || perf.webkitNow)) {
            var perfNow = perf.now ? 'now' : 'webkitNow';
            getTime = perf[perfNow].bind(perf);
        } else {
            getTime = function () {
                return +new Date();
            };
        }
    }());

    // Local WindowAnimationTiming interface polyfill
    var cAF = w.cancelAnimationFrame || w.cancelRequestAnimationFrame;
    var rAF = w.requestAnimationFrame;
    (function () {
        var vendors = ['moz', 'webkit', 'o'];
        var lastTime = 0;

        // For a more accurate WindowAnimationTiming interface implementation, ditch the native
        // requestAnimationFrame when cancelAnimationFrame is not present (older versions of Firefox)
        for (var i = 0, l = vendors.length; i < l && !cAF; ++i) {
            cAF = w[vendors[i]+'CancelAnimationFrame'] || w[vendors[i]+'CancelRequestAnimationFrame'];
            rAF = cAF && w[vendors[i]+'RequestAnimationFrame'];
        }

        if (!cAF) {
            rAF = function (callback) {
                var currTime = getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                lastTime = currTime + timeToCall;
                return w.setTimeout(function () { callback(currTime + timeToCall); }, timeToCall);
            };

            cAF = function (id) {
                clearTimeout(id);
            };
        }
    }());

    // Property name for assigning element text content
    var textProp = type(document.createElement('div').textContent) === 'string' ? 'textContent' : 'innerText';

    /**
     * FPSMeter class.
     *
     * @param {Element} anchor  Element to append the meter to. Default is document.body.
     * @param {Object}  options Object with options.
     */
    function FPSMeter(anchor, options) {
        // Optional arguments
        if (type(anchor) === 'object' && anchor.nodeType === undefined) {
            options = anchor;
            anchor = document.body;
        }
        if (!anchor) {
            anchor = document.body;
        }

        // Private properties
        var self = this;
        var o = extend({}, FPSMeter.defaults, options || {});

        var el = {};
        var cols = [];
        var theme, heatmaps;
        var heatDepth = 100;
        var heating = [];

        var thisFrameTime = 0;
        var frameTime = o.threshold;
        var frameStart = 0;
        var lastLoop = getTime() - frameTime;
        var time;

        var fpsHistory = [];
        var durationHistory = [];

        var frameID, renderID;
        var showFps = o.show === 'fps';
        var graphHeight, count, i, j;

        // Exposed properties
        self.options = o;
        self.fps = 0;
        self.duration = 0;
        self.isPaused = 0;

        /**
         * Tick start for measuring the actual rendering duration.
         *
         * @return {Void}
         */
        self.tickStart = function () {
            frameStart = getTime();
        };

        /**
         * FPS tick.
         *
         * @return {Void}
         */
        self.tick = function () {
            time = getTime();
            thisFrameTime = time - lastLoop;
            frameTime += (thisFrameTime - frameTime) / o.smoothing;
            self.fps = 1000 / frameTime;
            self.duration = frameStart < lastLoop ? frameTime : time - frameStart;
            lastLoop = time;
        };

        /**
         * Pause display rendering.
         *
         * @return {Object} FPSMeter instance.
         */
        self.pause = function () {
            if (frameID) {
                self.isPaused = 1;
                clearTimeout(frameID);
                cAF(frameID);
                cAF(renderID);
                frameID = renderID = 0;
            }
            return self;
        };

        /**
         * Resume display rendering.
         *
         * @return {Object} FPSMeter instance.
         */
        self.resume = function () {
            if (!frameID) {
                self.isPaused = 0;
                requestRender();
            }
            return self;
        };

        /**
         * Update options.
         *
         * @param {String} name  Option name.
         * @param {Mixed}  value New value.
         *
         * @return {Object} FPSMeter instance.
         */
        self.set = function (name, value) {
            o[name] = value;
            showFps = o.show === 'fps';

            // Rebuild or reposition elements when specific option has been updated
            if (inArray(name, rebuilders) !== -1) {
                createMeter();
            }
            if (inArray(name, repositioners) !== -1) {
                positionMeter();
            }
            return self;
        };

        /**
         * Change meter into rendering duration mode.
         *
         * @return {Object} FPSMeter instance.
         */
        self.showDuration = function () {
            self.set('show', 'ms');
            return self;
        };

        /**
         * Change meter into FPS mode.
         *
         * @return {Object} FPSMeter instance.
         */
        self.showFps = function () {
            self.set('show', 'fps');
            return self;
        };

        /**
         * Toggles between show: 'fps' and show: 'duration'.
         *
         * @return {Object} FPSMeter instance.
         */
        self.toggle = function () {
            self.set('show', showFps ? 'ms' : 'fps');
            return self;
        };

        /**
         * Hide the FPSMeter. Also pauses the rendering.
         *
         * @return {Object} FPSMeter instance.
         */
        self.hide = function () {
            self.pause();
            el.container.style.display = 'none';
            return self;
        };

        /**
         * Show the FPSMeter. Also resumes the rendering.
         *
         * @return {Object} FPSMeter instance.
         */
        self.show = function () {
            self.resume();
            el.container.style.display = 'block';
            return self;
        };

        /**
         * Check the current FPS and save it in history.
         *
         * @return {Void}
         */
        function historyTick() {
            for (i = o.history; i--;) {
                fpsHistory[i] = i === 0 ? self.fps : fpsHistory[i-1];
                durationHistory[i] = i === 0 ? self.duration : durationHistory[i-1];
            }
        }

        /**
         * Returns heat hex color based on values passed.
         *
         * @param  {Integer} heatmap
         * @param  {Integer} value
         * @param  {Integer} min
         * @param  {Integer} max
         *
         * @return {Integer}
         */
        function getHeat(heatmap, value, min, max) {
            return heatmaps[0|heatmap][Math.round(Math.min((value - min) / (max - min) * heatDepth, heatDepth))];
        }

        /**
         * Update counter number and legend.
         *
         * @return {Void}
         */
        function updateCounter() {
            // Update legend only when changed
            if (el.legend.fps !== showFps) {
                el.legend.fps = showFps;
                el.legend[textProp] = showFps ? 'FPS' : 'ms';
            }
            // Update counter with a nicely formated & readable number
            count = showFps ? self.fps : self.duration;
            el.count[textProp] = count > 999 ? '999+' : count.toFixed(count > 99 ? 0 : o.decimals);
        }

        /**
         * Render current FPS state.
         *
         * @return {Void}
         */
        function render() {
            time = getTime();
            // If renderer stopped reporting, do a simulated drop to 0 fps
            if (lastLoop < time - o.threshold) {
                self.fps -= self.fps / Math.max(1, o.smoothing * 60 / o.interval);
                self.duration = 1000 / self.fps;
            }

            historyTick();
            updateCounter();

            // Apply heat to elements
            if (o.heat) {
                if (heating.length) {
                    for (i = heating.length; i--;) {
                        heating[i].el.style[theme[heating[i].name].heatOn] = showFps ?
                            getHeat(theme[heating[i].name].heatmap, self.fps, 0, o.maxFps) :
                            getHeat(theme[heating[i].name].heatmap, self.duration, o.threshold, 0);
                    }
                }

                if (el.graph && theme.column.heatOn) {
                    for (i = cols.length; i--;) {
                        cols[i].style[theme.column.heatOn] = showFps ?
                            getHeat(theme.column.heatmap, fpsHistory[i], 0, o.maxFps) :
                            getHeat(theme.column.heatmap, durationHistory[i], o.threshold, 0);
                    }
                }
            }

            // Update graph columns height
            if (el.graph) {
                for (j = 0; j < o.history; j++) {
                    cols[j].style.height = (showFps ?
                        (fpsHistory[j] ? Math.round(graphHeight / o.maxFps * Math.min(fpsHistory[j], o.maxFps)) : 0) :
                        (durationHistory[j] ? Math.round(graphHeight / o.threshold * Math.min(durationHistory[j], o.threshold)) : 0)
                    ) + 'px';
                }
            }
        }

        /**
         * Request rendering loop.
         *
         * @return {Int} Animation frame index.
         */
        function requestRender() {
            if (o.interval < 20) {
                frameID = rAF(requestRender);
                render();
            } else {
                frameID = setTimeout(requestRender, o.interval);
                renderID = rAF(render);
            }
        }

        /**
         * Meter events handler.
         *
         * @return {Void}
         */
        function eventHandler(event) {
            event = event || window.event;
            if (event.preventDefault) {
                event.preventDefault();
                event.stopPropagation();
            } else {
                event.returnValue = false;
                event.cancelBubble = true;
            }
            self.toggle();
        }

        /**
         * Destroys the current FPSMeter instance.
         *
         * @return {Void}
         */
        self.destroy = function () {
            // Stop rendering
            self.pause();
            // Remove elements
            removeMeter();
            // Stop listening
            self.tick = self.tickStart = function () {};
        };

        /**
         * Remove meter element.
         *
         * @return {Void}
         */
        function removeMeter() {
            // Unbind listeners
            if (o.toggleOn) {
                listener(el.container, o.toggleOn, eventHandler, 1);
            }
            // Detach element
            anchor.removeChild(el.container);
        }

        /**
         * Sets the theme, and generates heatmaps when needed.
         */
        function setTheme() {
            theme = FPSMeter.theme[o.theme];

            // Generate heatmaps
            heatmaps = theme.compiledHeatmaps || [];
            if (!heatmaps.length && theme.heatmaps.length) {
                for (j = 0; j < theme.heatmaps.length; j++) {
                    heatmaps[j] = [];
                    for (i = 0; i <= heatDepth; i++) {
                        heatmaps[j][i] = hslToHex(0.33 / heatDepth * i, theme.heatmaps[j].saturation, theme.heatmaps[j].lightness);
                    }
                }
                theme.compiledHeatmaps = heatmaps;
            }
        }

        /**
         * Creates and attaches the meter element.
         *
         * @return {Void}
         */
        function createMeter() {
            // Remove old meter if present
            if (el.container) {
                removeMeter();
            }

            // Set theme
            setTheme();

            // Create elements
            el.container = applyTheme(newEl('div'), theme.container);
            el.count = el.container.appendChild(applyTheme(newEl('div'), theme.count));
            el.legend = el.container.appendChild(applyTheme(newEl('div'), theme.legend));
            el.graph = o.graph ? el.container.appendChild(applyTheme(newEl('div'), theme.graph)) : 0;

            // Add elements to heating array
            heating.length = 0;
            for (var key in el) {
                if (el[key] && theme[key].heatOn) {
                    heating.push({
                        name: key,
                        el: el[key]
                    });
                }
            }

            // Graph
            cols.length = 0;
            if (el.graph) {
                // Create graph
                el.graph.style.width = (o.history * theme.column.width + (o.history - 1) * theme.column.spacing) + 'px';

                // Add columns
                for (i = 0; i < o.history; i++) {
                    cols[i] = el.graph.appendChild(applyTheme(newEl('div'), theme.column));
                    cols[i].style.position = 'absolute';
                    cols[i].style.bottom = 0;
                    cols[i].style.right = (i * theme.column.width + i * theme.column.spacing) + 'px';
                    cols[i].style.width = theme.column.width + 'px';
                    cols[i].style.height = '0px';
                }
            }

            // Set the initial state
            positionMeter();
            updateCounter();

            // Append container to anchor
            anchor.appendChild(el.container);

            // Retrieve graph height after it was appended to DOM
            if (el.graph) {
                graphHeight = el.graph.clientHeight;
            }

            // Add event listeners
            if (o.toggleOn) {
                if (o.toggleOn === 'click') {
                    el.container.style.cursor = 'pointer';
                }
                listener(el.container, o.toggleOn, eventHandler);
            }
        }

        /**
         * Positions the meter based on options.
         *
         * @return {Void}
         */
        function positionMeter() {
            applyTheme(el.container, o);
        }

        /**
         * Construct.
         */
        (function () {
            // Create meter element
            createMeter();
            // Start rendering
            requestRender();
        }());
    }

    // Expose the extend function
    FPSMeter.extend = extend;

    // Expose the FPSMeter class
    window.FPSMeter = FPSMeter;

    // Default options
    FPSMeter.defaults = {
        interval:  100,     // Update interval in milliseconds.
        smoothing: 10,      // Spike smoothing strength. 1 means no smoothing.
        show:      'fps',   // Whether to show 'fps', or 'ms' = frame duration in milliseconds.
        toggleOn:  'click', // Toggle between show 'fps' and 'ms' on this event.
        decimals:  1,       // Number of decimals in FPS number. 1 = 59.9, 2 = 59.94, ...
        maxFps:    60,      // Max expected FPS value.
        threshold: 100,     // Minimal tick reporting interval in milliseconds.

        // Meter position
        position: 'absolute', // Meter position.
        zIndex:   10,         // Meter Z index.
        left:     '5px',      // Meter left offset.
        top:      '5px',      // Meter top offset.
        right:    'auto',     // Meter right offset.
        bottom:   'auto',     // Meter bottom offset.
        margin:   '0 0 0 0',  // Meter margin. Helps with centering the counter when left: 50%;

        // Theme
        theme: 'dark', // Meter theme. Build in: 'dark', 'light', 'transparent', 'colorful'.
        heat:  0,      // Allow themes to use coloring by FPS heat. 0 FPS = red, maxFps = green.

        // Graph
        graph:   0, // Whether to show history graph.
        history: 20 // How many history states to show in a graph.
    };

    // Option names that trigger FPSMeter rebuild or reposition when modified
    var rebuilders = [
        'toggleOn',
        'theme',
        'heat',
        'graph',
        'history'
    ];
    var repositioners = [
        'position',
        'zIndex',
        'left',
        'top',
        'right',
        'bottom',
        'margin'
    ];
}(window));
;(function (w, FPSMeter, undefined) {
    'use strict';

    // Themes object
    FPSMeter.theme = {};

    // Base theme with layout, no colors
    var base = FPSMeter.theme.base = {
        heatmaps: [],
        container: {
            // Settings
            heatOn: null,
            heatmap: null,

            // Styles
            padding: '5px',
            minWidth: '95px',
            height: '30px',
            lineHeight: '30px',
            textAlign: 'right',
            textShadow: 'none'
        },
        count: {
            // Settings
            heatOn: null,
            heatmap: null,

            // Styles
            position: 'absolute',
            top: 0,
            right: 0,
            padding: '5px 10px',
            height: '30px',
            fontSize: '24px',
            fontFamily: 'Consolas, Andale Mono, monospace',
            zIndex: 2
        },
        legend: {
            // Settings
            heatOn: null,
            heatmap: null,

            // Styles
            position: 'absolute',
            top: 0,
            left: 0,
            padding: '5px 10px',
            height: '30px',
            fontSize: '12px',
            lineHeight: '32px',
            fontFamily: 'sans-serif',
            textAlign: 'left',
            zIndex: 2
        },
        graph: {
            // Settings
            heatOn: null,
            heatmap: null,

            // Styles
            position: 'relative',
            boxSizing: 'padding-box',
            MozBoxSizing: 'padding-box',
            height: '100%',
            zIndex: 1
        },
        column: {
            // Settings
            width: 4,
            spacing: 1,
            heatOn: null,
            heatmap: null
        }
    };

    // Dark theme
    FPSMeter.theme.dark = FPSMeter.extend({}, base, {
        heatmaps: [{
            saturation: 0.8,
            lightness: 0.8
        }],
        container: {
            background: '#222',
            color: '#fff',
            border: '1px solid #1a1a1a',
            textShadow: '1px 1px 0 #222'
        },
        count: {
            heatOn: 'color'
        },
        column: {
            background: '#3f3f3f'
        }
    });

    // Light theme
    FPSMeter.theme.light = FPSMeter.extend({}, base, {
        heatmaps: [{
            saturation: 0.5,
            lightness: 0.5
        }],
        container: {
            color: '#666',
            background: '#fff',
            textShadow: '1px 1px 0 rgba(255,255,255,.5), -1px -1px 0 rgba(255,255,255,.5)',
            boxShadow: '0 0 0 1px rgba(0,0,0,.1)'
        },
        count: {
            heatOn: 'color'
        },
        column: {
            background: '#eaeaea'
        }
    });

    // Colorful theme
    FPSMeter.theme.colorful = FPSMeter.extend({}, base, {
        heatmaps: [{
            saturation: 0.5,
            lightness: 0.6
        }],
        container: {
            heatOn: 'backgroundColor',
            background: '#888',
            color: '#fff',
            textShadow: '1px 1px 0 rgba(0,0,0,.2)',
            boxShadow: '0 0 0 1px rgba(0,0,0,.1)'
        },
        column: {
            background: '#777',
            backgroundColor: 'rgba(0,0,0,.2)'
        }
    });

    // Transparent theme
    FPSMeter.theme.transparent = FPSMeter.extend({}, base, {
        heatmaps: [{
            saturation: 0.8,
            lightness: 0.5
        }],
        container: {
            padding: 0,
            color: '#fff',
            textShadow: '1px 1px 0 rgba(0,0,0,.5)'
        },
        count: {
            padding: '0 5px',
            height: '40px',
            lineHeight: '40px'
        },
        legend: {
            padding: '0 5px',
            height: '40px',
            lineHeight: '42px'
        },
        graph: {
            height: '40px'
        },
        column: {
            width: 5,
            background: '#999',
            heatOn: 'backgroundColor',
            opacity: 0.5
        }
    });
}(window, FPSMeter));
},{}],26:[function(require,module,exports){

window.onerror = function()
{
	alert(JSON.stringify(arguments));
}

var createWebGLExperiment = require('./experiment/index.js');

var WebGLExperiment = new createWebGLExperiment();

WebGLExperiment.start();

var gui_toggle_start = document.getElementById("gui_toggle_start");
gui_toggle_start.addEventListener('click', function ()
{
	console.log('toggle_start');

	if (WebGLExperiment.isRunning())
		WebGLExperiment.stop();
	else
		WebGLExperiment.start();
});

},{"./experiment/index.js":8}]},{},[26]);
