
"use strict"

import chunk_size from '../constants';

import ChunkGenerator from './generation/ChunkGenerator';
import RendererWebGL from './rendererWebGL/RendererWebGL';

import 'fpsmeter'; // <- in window.FPSMeter

class WebGLExperiment {

    private _fps_meter: FPSMeter;
    private _rendererWebGL: RendererWebGL;
    private _chunkGenerator: ChunkGenerator;

    private _running: boolean;
    private _error_gcontext: boolean;

    private _touches: [number, number][] = [];

    constructor() {


        //
        // FPS METER

        const _fps_meter_elem = document.getElementById('fpsmeter');
        if (!_fps_meter_elem)
            throw new Error("fpsmeter not found");

        this._fps_meter = new FPSMeter(_fps_meter_elem, { theme: "transparent" });

        // FPS METER
        //


        const main_element = document.getElementById("canvasesdiv");
        if (!main_element)
            throw new Error("canvasesdiv not found");

        const canvas_element = document.getElementById("main-canvas") as HTMLCanvasElement;
        if (!canvas_element)
            throw new Error("main-canvas not found");



        this._rendererWebGL = new RendererWebGL(main_element, canvas_element);

        this._chunkGenerator = new ChunkGenerator({

            chunk_is_visible: (pos: [number, number, number]) => {
                return this._rendererWebGL.chunk_is_visible(pos);
            },
            point_is_visible: (pos: [number, number, number]) => {
                return this._rendererWebGL.point_is_visible(pos);
            },
            add_geom: (buffer) => {
                return this._rendererWebGL.add_geom(buffer);
            },
            update_geom: (geom, buffer) => {
                return this._rendererWebGL.update_geom(geom, buffer);
            },
        });

        //

        //













        //
        //
        // HUD (touch positions recorder)

        const update_touches = (event: TouchEvent) => {

            const touches = event.targetTouches;

            const viewport_size = this._rendererWebGL.getSize();

            this._touches.length = 0; // clear array
            for (let ii = 0; ii < touches.length; ++ii) {

                this._touches.push([

                    touches[ii].pageX,

                    // here we must inverse the Y coordinate
                    viewport_size[1] - touches[ii].pageY
                ]);
            }
        };

        main_element.addEventListener('touchstart', update_touches);
        main_element.addEventListener('touchend', update_touches);
        main_element.addEventListener('touchmove', update_touches);

        // HUD (touch positions recorder)
        //
        //




        //

        // const createRendererCanvas = require('./rendererCanvas/index.js');
        // this.RendererCanvas = new createRendererCanvas();

        //






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


    async start() {

        if (this.isRunning())
            return;

        await this._rendererWebGL.init();

        this._running = true;

        this._chunkGenerator.start();

        this._tick();
    }

    stop() {
        this._running = false;
        this._chunkGenerator.stop();
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

        this._chunkGenerator.update(camera_pos);

        ////// /generation
        //
        //



        this._rendererWebGL.update(this._chunkGenerator.getChunks());

        // for touch events rendering
        // g_data.force_forward = this._rendererWebGL.getFreeFlyCamera().getForceForward();



        //
        //
        ////// render 3d scene

        this._rendererWebGL.renderScene(this._chunkGenerator.getChunks());

        //
        //
        ////// HUD


        {
            const coordinates = [
                Math.floor(camera_pos[0] / chunk_size)|0,
                Math.floor(camera_pos[1] / chunk_size)|0,
                Math.floor(camera_pos[2] / chunk_size)|0
            ];

            const text = `coordinates: ${coordinates[0]}/${coordinates[1]}/${coordinates[2]}`;

            this._rendererWebGL.pushText(text, [0, 0], 1.0);
        }

        {
            const time_immobile = this._rendererWebGL.getFreeFlyCamera().getTimeImmobile();

            const minimum_time_immbile = 3;
            const text_fade_in_time = 2;

            if (time_immobile > minimum_time_immbile) {

                const scale = (time_immobile > (minimum_time_immbile + text_fade_in_time))
                                ? 1
                                : (time_immobile - minimum_time_immbile) / text_fade_in_time;

                const viewport_size = this._rendererWebGL.getSize();
                viewport_size[0] = viewport_size[0] * 0.75;

                const lines = [
                    "         *---*         ",
                    "         |W/Z|         ",
                    "         *---*         ",
                    "                       ",
                    "   *---* *---* *---*   ",
                    "   |A/Q| | S | | D |   ",
                    "   *---* *---* *---*   ",
                    "",
                    "        *----*         ",
                    "        | UP |         ",
                    "        *----*         ",
                    "                       ",
                    " *----* *----* *-----* ",
                    " |LEFT| |DOWN| |RIGHT| ",
                    " *----* *----* *-----* ",
                    "",
                    "   *---------------*   ",
                    "   |MOUSE SUPPORTED|   ",
                    "   *---------------*   ",
                    "",
                    "*---------------------*",
                    "|TOUCHSCREEN SUPPORTED|",
                    "*---------------------*",
                ];

                let width = 0;
                lines.forEach((item) => width = Math.max(width, item.length));
                width *= 16 * scale;

                const height = lines.length * 16 * scale;

                const text = lines.join("\n");

                const position = [
                    viewport_size[0] * 0.5 - width * 0.5,
                    viewport_size[1] * 0.5 + height * 0.5,
                ];

                this._rendererWebGL.pushText(text, position, scale);
            }
        }

        this._rendererWebGL.renderHUD(
                this._chunkGenerator.getChunks(),
                this._chunkGenerator.processing_pos,
                this._touches);

        // this.RendererCanvas.render();


        this._fps_meter.tick();
    }
};

export default WebGLExperiment;
