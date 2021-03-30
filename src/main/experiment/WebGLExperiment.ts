
"use strict"

import chunk_size from '../constants';

import ChunkGenerator from './generation/ChunkGenerator';
import WebGLRenderer from './webGLRenderer/WebGLRenderer';
import GeometryWrapper from './webGLRenderer/wrappers/Geometry';

import 'fpsmeter'; // <- in window.FPSMeter

class WebGLExperiment {

    private _fpsMeter: FPSMeter;
    private _renderer: WebGLRenderer;
    private _chunkGenerator: ChunkGenerator<GeometryWrapper.Geometry>;

    private _running: boolean;
    private _errorGraphicContext: boolean;

    private _touches: [number, number][] = [];

    private _chunksCreated: number = 0;
    private _chunksDiscarded: number = 0;

    constructor() {


        //
        // FPS METER

        const fpsMeterElem = document.getElementById('fpsmeter');
        if (!fpsMeterElem)
            throw new Error("fpsmeter not found");

        this._fpsMeter = new FPSMeter(fpsMeterElem, { theme: "transparent" });

        // FPS METER
        //


        const main_element = document.getElementById("canvasesdiv");
        if (!main_element)
            throw new Error("canvasesdiv not found");

        const canvas_element = document.getElementById("main-canvas") as HTMLCanvasElement;
        if (!canvas_element)
            throw new Error("main-canvas not found");



        this._renderer = new WebGLRenderer(main_element, canvas_element);

        this._chunkGenerator = new ChunkGenerator({
            chunkIsVisible: (pos: [number, number, number]) => {
                return this._renderer.chunkIsVisible(pos);
            },
            pointIsVisible: (pos: [number, number, number]) => {
                return this._renderer.pointIsVisible(pos);
            },
            addGeometry: (buffer) => {
                return this._renderer.addGeometry(buffer);
            },
            updateGeometry: (geom, buffer) => {
                this._renderer.updateGeometry(geom, buffer);
            },
            onChunkCreated: () => {
                ++this._chunksCreated;
            },
            onChunkDiscarded: () => {
                ++this._chunksDiscarded;
            }
        });

        //

        //













        //
        //
        // HUD (touch positions recorder)

        const update_touches = (event: TouchEvent) => {

            const touches = event.targetTouches;

            const viewport_size = this._renderer.getSize();

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

            let tmp_width = null;
            let tmp_height = null;

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

            this._renderer.resize(tmp_width, tmp_height);
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
        this._errorGraphicContext = false;


        this._renderer.set_on_context_lost(() => {

            console.log('on_context_lost');

            this._errorGraphicContext = true;
            this.stop();
        });

        this._renderer.set_on_context_restored(() => {

            console.log('on_context_restored');

            this._errorGraphicContext = false;
            this.start();
        });

    }

    async init() {
        await this._renderer.init();
    }

    start() {

        if (this.isRunning())
            return;

        this._running = true;

        this._chunkGenerator.start();

        this._tick();
    }

    stop() {
        this._running = false;
        this._chunkGenerator.stop();
    }

    isRunning() {
        return (this._running && !this._errorGraphicContext);
    }

    //
    //
    //

    _tick() {

        const tick = () => {

            if (!this._running || this._errorGraphicContext)
                return;

            this._main_loop();

            // plan the next frame
            window.requestAnimationFrame( tick );
        };

        tick();
    }

    _main_loop() {

        this._fpsMeter.tickStart();




        //
        //
        ////// generation

        const camera_pos = this._renderer.getCameraPosition();

        this._chunkGenerator.update(camera_pos);

        ////// /generation
        //
        //



        const chunks = this._chunkGenerator.getChunks()



        this._renderer.update(chunks);

        // for touch events rendering
        // g_data.force_forward = this._renderer.getFreeFlyCamera().getForceForward();



        //
        //
        ////// render 3d scene

        this._renderer.renderScene(chunks);

        //
        //
        ////// HUD


        {
            const coord = [
                Math.floor(camera_pos[0] / chunk_size),
                Math.floor(camera_pos[1] / chunk_size),
                Math.floor(camera_pos[2] / chunk_size)
            ];

            const text = `Coordinates: ${coord[0]}/${coord[1]}/${coord[2]}`;

            let visibleChunks = 0;
            for (const chunk of chunks)
                if (chunk.visible)
                    ++visibleChunks;

            this._renderer.pushText(text, [0, 0], 1.0);

            this._renderer.pushText(`Chunks:`, [0, 16 * 6], 1.0);
            this._renderer.pushText(`>Generated: ${this._chunksCreated}`, [0, 16 * 5], 1.0);
            this._renderer.pushText(`>Discarded: ${this._chunksDiscarded}`, [0, 16 * 4], 1.0);
            this._renderer.pushText(`>Live:      ${this._chunksCreated - this._chunksDiscarded}`, [0, 16 * 3], 1.0);
            this._renderer.pushText(`>Visible:   ${visibleChunks}`, [0, 16 * 2], 1.0);
        }

        {
            const time_immobile = this._renderer.getFreeFlyCamera().getTimeImmobile();

            const minimum_time_immbile = 3;
            const text_fade_in_time = 2;

            if (time_immobile > minimum_time_immbile) {

                const scale = (time_immobile > (minimum_time_immbile + text_fade_in_time))
                                ? 1
                                : (time_immobile - minimum_time_immbile) / text_fade_in_time;

                const viewport_size = this._renderer.getSize();
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

                this._renderer.pushText(text, position, scale);
            }
        }

        this._renderer.renderHUD(
            this._chunkGenerator.getChunks(),
            this._chunkGenerator.getProcessingPositions(),
            this._touches);

        this._fpsMeter.tick();
    }
};

export default WebGLExperiment;
