
"use strict"

var g_data = require('./data/index.js');

g_data.logic = {};

g_data.logic.k_chunk_size = 15;
var createChunkGenerator = require('./generation/ChunkGenerator.js');
g_data.logic.ChunkGenerator = new createChunkGenerator();

//

//

require('./utils/fpsmeter.js'); // <- in window.FPSMeter


var time_last = 0




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



// //
// //
// // GUI (fullscreen button)

// var gui_fullscreen = document.getElementById("gui_fullscreen");
// gui_fullscreen.addEventListener('click', function () {

//     var elem = document.getElementById("canvasesdiv");

//     // go full-screen
//     if (elem.requestFullscreen)
//         elem.requestFullscreen();
//     else if (elem.webkitRequestFullscreen)
//         elem.webkitRequestFullscreen();
//     else if (elem.mozRequestFullScreen)
//         elem.mozRequestFullScreen();
//     else if (elem.msRequestFullscreen)
//         elem.msRequestFullscreen();
// });

// function on_fullscreen_change() {

//     var elem = document.getElementById("canvasesdiv");
//     var canvas = document.getElementById("main-canvas");
//     var s_canvas = document.getElementById("second-canvas");

//     var tmp_width = null;
//     var tmp_height = null;

//     if (document.fullscreen ||
//         document.mozFullScreen ||
//         document.webkitIsFullScreen ||
//         document.msFullscreenElement)
//     {
//         elem.style.position = "absolute";

//         tmp_width = window.innerWidth;
//         tmp_height = window.innerHeight;
//     }
//     else
//     {
//         elem.style.position = "relative";

//         tmp_width = 800;
//         tmp_height = 600;
//     }

//     elem.style.left = "0px";
//     elem.style.top = "0px";

//     canvas.width = s_canvas.width = tmp_width;
//     canvas.height = s_canvas.height = tmp_height;

//     gl.viewportWidth = gl.canvas.clientWidth;
//     gl.viewportHeight = gl.canvas.clientHeight;

//     //

//     aspectRatio = gl.viewportWidth * 0.75 / gl.viewportHeight;

//     var vertices = createFrustumVertices(70, aspectRatio, 0.1, 40);
//     frustum_geom = new createGeometryColor(vertices, gl.LINES);
// }

// document.addEventListener('fullscreenchange',       on_fullscreen_change, false);
// document.addEventListener('mozfullscreenchange',    on_fullscreen_change, false);
// document.addEventListener('webkitfullscreenchange', on_fullscreen_change, false);
// document.addEventListener('msfullscreenchange',     on_fullscreen_change, false);

// // GUI (fullscreen button)
// //
// //


//
// FPS METER

var myFpsmeter_elem = document.getElementById('fpsmeter');
var myFpsmeter = new window.FPSMeter(
    myFpsmeter_elem,
    window.FPSMeter.theme.transparent
);

// FPS METER
//



// //
// //
// // HUD (touch positions recorder)

// var elem = document.getElementById("canvasesdiv");

// var arr_touches = [];

// function update_touches(e) { try{

//     var touches = e.targetTouches;

//     arr_touches.length = 0; // clear array
//     for (var i = 0; i < touches.length; ++i)
//         arr_touches.push({ x:touches[i].pageX, y:touches[i].pageY });

// }catch(e){alert(e);} }

// elem.addEventListener('touchstart', update_touches);
// elem.addEventListener('touchend', function(e) {arr_touches.length = 0;}); // clear array
// elem.addEventListener('touchmove', update_touches);

// // HUD (touch positions recorder)
// //
// //



// position used to detect a move in the current chunk
var saved_index = [1,0,0]; // <- currently 1/0/0 but any other value than 0/0/0 will work





//

var createRendererCanvas = require('./rendererCanvas/index.js');

var RendererCanvas = new createRendererCanvas();

//

var createRendererWebGL = require('./rendererWebGL/index.js');

var RendererWebGL = new createRendererWebGL();

g_data.chunk_is_visible = function(pos)
{
    return RendererWebGL.chunk_is_visible(pos);
}

g_data.point_is_visible = function(pos)
{
    return RendererWebGL.point_is_visible(pos);
}

g_data.add_geom = function(buffer)
{
    return RendererWebGL.add_geom(buffer);
}



RendererWebGL.init(function()
{
    tick();
});


// tick();

function tick(in_event) {

    // plan the next frame
    window.requestAnimFrame( tick ); // webgl-utils.js


        //
        // obtain the elapsed time

        var time_current = performance.now() || (new Date()).getTime();

        if (!time_last)
            time_last = time_current;

        var elapsed = time_current - time_last;

        time_last = time_current;

        // obtain the elapsed time
        //

    ///



    myFpsmeter.tickStart();




    //
    //
    ////// generation

    //  check if move to ask chunks
    //      -> if yes
    //          exclude chunk out of range
    //          include chunk in range

    // compute the current chunk in use

    var camera_pos = RendererWebGL.getCameraPosition();

    var curr_index = [
        Math.floor(camera_pos[0] / g_data.logic.k_chunk_size)|0,
        Math.floor(camera_pos[1] / g_data.logic.k_chunk_size)|0,
        Math.floor(camera_pos[2] / g_data.logic.k_chunk_size)|0
    ];

    // did we move to another chunk?
    if (curr_index[0] != saved_index[0] ||
        curr_index[1] != saved_index[1] ||
        curr_index[2] != saved_index[2])
    {
        // yes -> save as the new current chunk
        saved_index[0] = curr_index[0];
        saved_index[1] = curr_index[1];
        saved_index[2] = curr_index[2];

        // clear the generation queue
        g_data.logic.ChunkGenerator._chunk_queue.length = 0;

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

        for (var i = 0; i < g_data.logic.ChunkGenerator._chunks.length; ++i)
        {
            var curr_pos = [
                (g_data.logic.ChunkGenerator._chunks[i].pos[0]/g_data.logic.k_chunk_size)|0,
                (g_data.logic.ChunkGenerator._chunks[i].pos[1]/g_data.logic.k_chunk_size)|0,
                (g_data.logic.ChunkGenerator._chunks[i].pos[2]/g_data.logic.k_chunk_size)|0
            ];

            if (curr_pos[0] < min_index[0] || curr_pos[0] > max_index[0] ||
                curr_pos[1] < min_index[1] || curr_pos[1] > max_index[1] ||
                curr_pos[2] < min_index[2] || curr_pos[2] > max_index[2])
            {
                // g_data.logic.ChunkGenerator._chunks[i].geom.dispose();
                g_data.logic.ChunkGenerator._geoms.push(g_data.logic.ChunkGenerator._chunks[i].geom);
                g_data.logic.ChunkGenerator._chunks.splice(i, 1);
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
            for (var j = 0; j < g_data.logic.ChunkGenerator._chunks.length; ++j)
                if (g_data.logic.ChunkGenerator._chunks[j].pos[0] === pos[0] &&
                    g_data.logic.ChunkGenerator._chunks[j].pos[1] === pos[1] &&
                    g_data.logic.ChunkGenerator._chunks[j].pos[2] === pos[2])
                {
                    found = true;
                    break;
                }

            if (found) // is already processed
                continue;

            g_data.logic.ChunkGenerator._chunk_queue.push(pos);
        }

    }

    {
        g_data.logic.ChunkGenerator.update(camera_pos);
    }

    ////// /generation
    //
    //



    RendererWebGL.update(elapsed);



    //
    //
    ////// render 3d scene

    RendererWebGL.render();

    //
    //
    ////// HUD

    RendererWebGL.renderHUD();


    RendererCanvas.render();


    // //
    // //
    // //
    // // CANVAS STUFF (in fact, this still the HUD...)


    //
    // render touches
    //

    // ctx.beginPath();
    // ctx.lineWidth="5";
    // ctx.strokeStyle="red";

    // for (var i = 0; i < arr_touches.length; ++i)
    // {
    //     var x = arr_touches[i].x;
    //     var y = arr_touches[i].y;

    //     ctx.moveTo(x,y-150);
    //     ctx.lineTo(x,y+150);
    //     ctx.stroke();

    //     ctx.moveTo(x-150,y);
    //     ctx.lineTo(x+150,y);
    //     ctx.stroke();

    //     if (g_data.FreeFlyCamera._force_forward)
    //     {
    //         ctx.moveTo(x-100,y-100);
    //         ctx.lineTo(x+100,y+100);
    //         ctx.stroke();

    //         ctx.moveTo(x-100,y+100);
    //         ctx.lineTo(x+100,y-100);
    //         ctx.stroke();
    //     }
    // }

    // ctx.stroke(); // Draw it

    // CANVAS STUFF (in fact, this still the HUD...)
    //
    //
    //

    myFpsmeter.tick();

} // function tick(in_event)
