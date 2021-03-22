
"use strict"

import g_data from './data/Data';

import ChunkGenerator from './generation/ChunkGenerator';
import RendererWebGL from './rendererWebGL/RendererWebGL';

import 'fpsmeter'; // <- in window.FPSMeter

class WebGLExperiment {

    private _fps_meter: FPSMeter;
    private _rendererWebGL: RendererWebGL;

    private _running: boolean;
    private _error_gcontext: boolean;

    constructor() {


        //
        // FPS METER

        const _fps_meter_elem = document.getElementById('fpsmeter');
        if (!_fps_meter_elem)
            throw new Error("fpsmeter not found");

        this._fps_meter = new FPSMeter(_fps_meter_elem, { theme: "transparent" });

        // FPS METER
        //


        g_data.logic.k_chunk_size = 15;
        g_data.logic.chunkGenerator = new ChunkGenerator();

        //

        //













        //
        //
        // HUD (touch positions recorder)

        // const elem = document.getElementById("canvasesdiv");
        // if (!elem)
        //     throw new Error("canvasesdiv not found");

        // const update_touches = (event: TouchEvent) => {

        //     const touches = event.targetTouches;

        //     g_data.arr_touches.length = 0; // clear array
        //     for (let ii = 0; ii < touches.length; ++ii)
        //         g_data.arr_touches.push({ x: touches[ii].pageX, y: touches[ii].pageY });
        // };

        // elem.addEventListener('touchstart', update_touches);
        // elem.addEventListener('touchend', () => { g_data.arr_touches.length = 0; }); // clear array
        // elem.addEventListener('touchmove', update_touches);

        // HUD (touch positions recorder)
        //
        //




        //

        // const createRendererCanvas = require('./rendererCanvas/index.js');
        // this.RendererCanvas = new createRendererCanvas();

        //

        this._rendererWebGL = new RendererWebGL();

        g_data.chunk_is_visible = (pos: [number, number, number]) => {

            return this._rendererWebGL.chunk_is_visible(pos);
        };

        g_data.point_is_visible = (pos: [number, number, number]) => {

            return this._rendererWebGL.point_is_visible(pos);
        };

        g_data.add_geom = (buffer) => {

            return this._rendererWebGL.add_geom(buffer);
        };

        g_data.update_geom = (geom, buffer) => {

            return this._rendererWebGL.update_geom(geom, buffer);
        };








        //
        //
        // GUI (fullscreen button)

        const gui_fullscreen = document.getElementById("gui_fullscreen");
        if (!gui_fullscreen)
            throw new Error("gui_fullscreen not found");

        gui_fullscreen.addEventListener('click', () => {

            const elem = document.getElementById("canvasesdiv");
            if (!elem)
                throw new Error("canvasesdiv not found");

            // go full-screen
            if (elem.requestFullscreen)
                elem.requestFullscreen();
            else if ((elem as any).webkitRequestFullscreen)
                (elem as any).webkitRequestFullscreen();
            else if ((elem as any).mozRequestFullScreen)
                (elem as any).mozRequestFullScreen();
            else if ((elem as any).msRequestFullscreen)
                (elem as any).msRequestFullscreen();
        });

        const on_fullscreen_change = () => {

            const elem = document.getElementById("canvasesdiv");
            if (!elem)
                throw new Error("canvasesdiv not found");

            const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
            if (!elem)
                throw new Error("main-canvas not found");

            // const s_canvas = document.getElementById("second-canvas");

            var tmp_width = null;
            var tmp_height = null;

            if (document.fullscreen ||
                (document as any).mozFullScreen ||
                (document as any).webkitIsFullScreen ||
                (document as any).msFullscreenElement) {

                elem.style.position = "absolute";

                tmp_width = window.innerWidth;
                tmp_height = window.innerHeight;
            }
            else {

                elem.style.position = "relative";

                tmp_width = 800;
                tmp_height = 600;
            }

            elem.style.left = "0px";
            elem.style.top = "0px";

            // canvas.width = s_canvas.width = tmp_width;
            // canvas.height = s_canvas.height = tmp_height;
            canvas.width = tmp_width;
            canvas.height = tmp_height;

            this._rendererWebGL.resize(tmp_width, tmp_height);
            // this.RendererCanvas.resize(tmp_width, tmp_height);
        };

        document.addEventListener('fullscreenchange',       on_fullscreen_change, false);
        document.addEventListener('mozfullscreenchange',    on_fullscreen_change, false);
        document.addEventListener('webkitfullscreenchange', on_fullscreen_change, false);
        document.addEventListener('msfullscreenchange',     on_fullscreen_change, false);

        // GUI (fullscreen button)
        //
        //






        this._running = false;
        this._error_gcontext = false;


        this._rendererWebGL.set_on_context_lost(() => {

            console.log('on_context_lost');

            this._error_gcontext = true;
            this.stop();
        });

        this._rendererWebGL.set_on_context_restored(() => {

            console.log('on_context_restored');

            this._error_gcontext = false;
            this.start();
        });

    }


    start() {

        if (this.isRunning())
            return;

        this._rendererWebGL.init(() => {

            this._running = true;

            g_data.logic.chunkGenerator.start();

            this._tick();
        });
    }

    stop() {
        this._running = false;
        g_data.logic.chunkGenerator.stop();
    }

    isRunning() {
        return (this._running && !this._error_gcontext);
    }

    //
    //
    //

    _tick() {

        const tick = () => {

            if (!this._running || this._error_gcontext)
                return;

            this._main_loop();

            // plan the next frame
            window.requestAnimationFrame( tick );
        };

        tick();
    }

    _main_loop() {

        this._fps_meter.tickStart();




        //
        //
        ////// generation

        const camera_pos = this._rendererWebGL.getCameraPosition();

        g_data.logic.chunkGenerator.update(camera_pos);

        ////// /generation
        //
        //



        this._rendererWebGL.update();

        // for touch events rendering
        g_data.force_forward = this._rendererWebGL.getFreeFlyCamera().getForceForward();



        //
        //
        ////// render 3d scene

        this._rendererWebGL.render();

        //
        //
        ////// HUD

        this._rendererWebGL.renderHUD();

        // this.RendererCanvas.render();


        this._fps_meter.tick();
    }
};

export default WebGLExperiment;
