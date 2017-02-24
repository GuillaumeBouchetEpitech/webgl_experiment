
"use strict"

var g_data = require('./data/index.js');

require('./utils/fpsmeter.js'); // <- in window.FPSMeter

function WebGLExperiment ()
{

    g_data.arr_touches = [];
    g_data.logic = {};

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
    var myFpsmeter = new window.FPSMeter(
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

    g_data.update_geom = function(geom, buffer)
    {
        return RendererWebGL.update_geom(geom, buffer);
    }








    //
    //
    // GUI (fullscreen button)

    var gui_fullscreen = document.getElementById("gui_fullscreen");
    gui_fullscreen.addEventListener('click', function () {

        // RendererWebGL.toggle_context_loss()

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

        RendererWebGL.resize(tmp_width, tmp_height);
        RendererCanvas.resize(tmp_width, tmp_height)
    }

    document.addEventListener('fullscreenchange',       on_fullscreen_change, false);
    document.addEventListener('mozfullscreenchange',    on_fullscreen_change, false);
    document.addEventListener('webkitfullscreenchange', on_fullscreen_change, false);
    document.addEventListener('msfullscreenchange',     on_fullscreen_change, false);

    // GUI (fullscreen button)
    //
    //








    var time_last = 0

    // TODO : this need refractor
    RendererWebGL.set_on_context_lost(function ()
    {
        console.log('on_context_lost');

        g_data.logic.ChunkGenerator.clear();
    });

    // TODO : this need refractor
    RendererWebGL.set_on_context_restored(function ()
    {
        console.log('on_context_restored');
        RendererWebGL.init(function()
        {
            console.log('on_context_restored init');
            tick();
        });
    })

    RendererWebGL.init(function()
    {
        tick();
    });

    function tick(in_event) {

        if (RendererWebGL.context_is_lost())
        {
            console.log("context_is_lost => main loop stopped");
            return;
        }

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

        var camera_pos = RendererWebGL.getCameraPosition();

        g_data.logic.ChunkGenerator.update(camera_pos);

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


        myFpsmeter.tick();

    } // function tick(in_event)
}

module.exports = WebGLExperiment;
