
"use strict"

import chunk_size from '../constants';

import ChunkGenerator from './generation/ChunkGenerator';
import WebGLRenderer from './webGLRenderer/WebGLRenderer';
import GeometryWrapper from './webGLRenderer/wrappers/Geometry';

class WebGLExperiment {

    private _renderer: WebGLRenderer;
    private _chunkGenerator: ChunkGenerator<GeometryWrapper.Geometry>;

    private _running: boolean;
    private _errorGraphicContext: boolean;

    private _touches: [number, number][] = [];

    private _chunksCreated: number = 0;
    private _chunksDiscarded: number = 0;

    private _currFrameTime: number = -1;
    private _framesDuration: number[] = [];

    constructor() {

        const canvasElement = document.getElementById("main-canvas") as HTMLCanvasElement;
        if (!canvasElement)
            throw new Error("main-canvas not found");

        this._renderer = new WebGLRenderer(canvasElement);

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

        canvasElement.addEventListener('touchstart', update_touches);
        canvasElement.addEventListener('touchend', update_touches);
        canvasElement.addEventListener('touchmove', update_touches);

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

            // go full-screen
            if (canvasElement.requestFullscreen)
                canvasElement.requestFullscreen();
            else if ((canvasElement as any).webkitRequestFullscreen)
                (canvasElement as any).webkitRequestFullscreen();
            else if ((canvasElement as any).mozRequestFullScreen)
                (canvasElement as any).mozRequestFullScreen();
            else if ((canvasElement as any).msRequestFullscreen)
                (canvasElement as any).msRequestFullscreen();
        });

        const on_fullscreen_change = () => {

            let tmp_width = null;
            let tmp_height = null;

            if (document.fullscreen ||
                (document as any).mozFullScreen ||
                (document as any).webkitIsFullScreen ||
                (document as any).msFullscreenElement) {

                canvasElement.style.position = "absolute";

                tmp_width = window.innerWidth;
                tmp_height = window.innerHeight;
            }
            else {

                canvasElement.style.position = "relative";

                tmp_width = 800;
                tmp_height = 600;
            }

            canvasElement.style.left = "0px";
            canvasElement.style.top = "0px";

            canvasElement.width = tmp_width;
            canvasElement.height = tmp_height;

            this._renderer.resize(tmp_width, tmp_height);
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


        this._renderer.setOnContextLost(() => {

            console.log('on_context_lost');

            this._errorGraphicContext = true;
            this.stop();
        });

        this._renderer.setOnContextRestored(() => {

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

        if (this._currFrameTime > 0) {

            const currentTime = Date.now();
            const elapsedTime = currentTime - this._currFrameTime;
            this._currFrameTime = currentTime;

            this._framesDuration.push(elapsedTime / 1000);
        }




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



        //
        //
        ////// render 3d scene

        this._renderer.renderScene(chunks);

        //
        //
        ////// HUD


        { // bottom left text

            const chunkCoord = [
                Math.floor(camera_pos[0] / chunk_size),
                Math.floor(camera_pos[1] / chunk_size),
                Math.floor(camera_pos[2] / chunk_size)
            ];

            let visibleChunks = 0;
            for (const chunk of chunks)
                if (chunk.visible)
                    ++visibleChunks;

            const textsOrigin = [10, 10];

            const allTextLines = [
                `Chunks:`,
                `>Generated: ${this._chunksCreated}`,
                `>Discarded: ${this._chunksDiscarded}`,
                `>Live:      ${this._chunksCreated - this._chunksDiscarded}`,
                `>Visible:   ${visibleChunks}`,
                "",
                `Coordinates: ${chunkCoord[0]}/${chunkCoord[1]}/${chunkCoord[2]}`,
            ];

            const characterSize = this._renderer.getCharacterSize();

            for (let ii = 0; ii < allTextLines.length; ++ii)
                this._renderer.pushText(allTextLines[ii], [textsOrigin[0], textsOrigin[1] + characterSize * (6 - ii)], 1);

        } // bottom left text

        { // help text

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
                width *= this._renderer.getCharacterSize() * scale;

                const height = lines.length * this._renderer.getCharacterSize() * scale;

                const text = lines.join("\n");

                const position = [
                    viewport_size[0] * 0.5 - width * 0.5,
                    viewport_size[1] * 0.5 + height * 0.5,
                ];

                this._renderer.pushText(text, position, scale);
            }

        } // help text

        this._renderer.renderHUD(
            this._chunkGenerator.getChunks(),
            this._chunkGenerator.getProcessingPositions(),
            this._touches,
            this._framesDuration);


        this._currFrameTime = Date.now();
        if (this._framesDuration.length > 100)
            this._framesDuration.splice(0, this._framesDuration.length - 100);
    }
};

export default WebGLExperiment;
