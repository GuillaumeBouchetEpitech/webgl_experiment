
"use strict"

var g_data = require('./data/index.js');

require('./utils/fpsmeter.js'); // <- in window.FPSMeter

function WebGLExperiment ()
{
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

    var createRendererCanvas = require('./rendererCanvas/index.js');

    this.RendererCanvas = new createRendererCanvas();

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
        self.RendererCanvas.resize(tmp_width, tmp_height);
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

var proto = WebGLExperiment.prototype;

proto.start = function()
{
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

proto.stop = function()
{
    this._running = false;
    g_data.logic.ChunkGenerator.stop();
}

proto.isRunning = function()
{
    return (this._running && !this._error_gcontext);
}

//
//
//

proto._tick = function()
{
    var self = this;
    function tick()
    {
        if (!self._running || self._error_gcontext)
            return;

        // plan the next frame
        window.requestAnimFrame( tick ); // webgl-utils.js

        self._main_loop();
    }

    tick();
}

proto._main_loop = function()
{
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

    this.RendererCanvas.render();


    this.myFpsmeter.tick();
}

module.exports = WebGLExperiment;
