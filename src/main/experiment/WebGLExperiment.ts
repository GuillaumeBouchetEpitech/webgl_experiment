
"use strict"

import * as configuration from "../configuration";

import ChunkGenerator from "./generation/ChunkGenerator";
import WebGLRenderer, { ITouchData } from "./webGLRenderer/WebGLRenderer";
import GeometryWrapper from "./webGLRenderer/wrappers/Geometry";

class WebGLExperiment {

    private _renderer: WebGLRenderer;
    private _chunkGenerator: ChunkGenerator<GeometryWrapper.Geometry>;

    private _running: boolean;
    private _errorGraphicContext: boolean;

    private _touches: ITouchData[] = [];

    private _chunksCreated: number = 0;
    private _chunksDiscarded: number = 0;

    private _currFrameTime: number = -1;
    private _framesDuration: number[] = [];

    constructor() {

        const canvasElement = document.getElementById("main-canvas") as HTMLCanvasElement;
        if (!canvasElement)
            throw new Error("main-canvas not found");

        this._renderer = new WebGLRenderer({
            canvasDomElement: canvasElement,
            chunkSize: configuration.chunkSize,
            mouseSensitivity: configuration.controllerMouseSensitivity,
            movingSpeed: configuration.controllerMovingSpeed,
            keyboardSensitivity: configuration.controllerKeyboardSensitivity,
        });

        // put the camera outside the known chunk
        this._renderer.getFreeFlyCamera().setPosition( configuration.chunkSize/4*3, configuration.chunkSize/4*3, 0 );

        this._chunkGenerator = new ChunkGenerator({

            chunkSize: configuration.chunkSize,
            chunkRange: configuration.chunkRange,

            workerTotal: configuration.workerTotal,
            workerFile: configuration.workerFile,
            workerBufferSize: configuration.workerBufferSize,

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

            const viewportSize = this._renderer.getSize();

            this._touches.length = 0; // clear array
            for (let ii = 0; ii < touches.length; ++ii) {

                this._touches.push({
                    id: touches[ii].identifier,
                    x: touches[ii].pageX,
                    // here we must inverse the Y coordinate
                    y: viewportSize[1] - touches[ii].pageY
                });
            }
        };

        canvasElement.addEventListener("touchstart", update_touches);
        canvasElement.addEventListener("touchend", update_touches);
        canvasElement.addEventListener("touchmove", update_touches);

        // HUD (touch positions recorder)
        //
        //

        //
        //
        // GUI (fullscreen button)

        const guiFullscreen = document.getElementById("gui_fullscreen");
        if (!guiFullscreen)
            throw new Error("guiFullscreen not found");

        guiFullscreen.addEventListener("click", () => {

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

        const onFullScreenChangeCallback = () => {

            let currentWidth = null;
            let currentHeight = null;

            const isInFullScreen = (
                document.fullscreenElement !== null ||
                (document as any).mozFullScreen ||
                (document as any).webkitIsFullScreen ||
                (document as any).msFullscreenElement
            );

            if (isInFullScreen) {

                canvasElement.style.position = "absolute";

                currentWidth = window.innerWidth;
                currentHeight = window.innerHeight;
            }
            else {

                canvasElement.style.position = "relative";

                currentWidth = 800;
                currentHeight = 600;
            }

            canvasElement.style.left = "0px";
            canvasElement.style.top = "0px";

            canvasElement.width = currentWidth;
            canvasElement.height = currentHeight;

            this._renderer.resize(currentWidth, currentHeight);
        };

        document.addEventListener("fullscreenchange",       onFullScreenChangeCallback, false);
        document.addEventListener("mozfullscreenchange",    onFullScreenChangeCallback, false);
        document.addEventListener("webkitfullscreenchange", onFullScreenChangeCallback, false);
        document.addEventListener("msfullscreenchange",     onFullScreenChangeCallback, false);

        // GUI (fullscreen button)
        //
        //






        this._running = false;
        this._errorGraphicContext = false;


        this._renderer.setOnContextLost(() => {

            console.log("on_context_lost");

            this._errorGraphicContext = true;
            this.stop();
        });

        this._renderer.setOnContextRestored(() => {

            console.log("on_context_restored");

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

    private _tick() {

        const tick = () => {

            if (!this._running || this._errorGraphicContext)
                return;

            this._mainLoop();

            // plan the next frame
            window.requestAnimationFrame( tick );
        };

        tick();
    }

    private _mainLoop() {

        const currentTime = Date.now();
        const elapsedTime = currentTime - this._currFrameTime;
        this._currFrameTime = currentTime;
        this._framesDuration.push(elapsedTime / 1000);




        //
        //
        ////// generation

        const camera_pos = this._renderer.getCameraPosition();

        this._chunkGenerator.update(camera_pos);

        ////// /generation
        //
        //



        const chunks = this._chunkGenerator.getChunks()



        this._renderer.update(elapsedTime / 1000, chunks);



        //
        //
        ////// render 3d scene

        this._renderer.renderScene(chunks);

        //
        //
        ////// HUD


        { // bottom left text

            const chunkCoord = [
                Math.floor(camera_pos[0] / configuration.chunkSize),
                Math.floor(camera_pos[1] / configuration.chunkSize),
                Math.floor(camera_pos[2] / configuration.chunkSize)
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

            const timeImmobile = this._renderer.getFreeFlyCamera().getTimeImmobile();

            const minimumTimeImmbile = 3;
            const textFadeInTime = 2;

            if (timeImmobile > minimumTimeImmbile) {

                const scale = (timeImmobile > (minimumTimeImmbile + textFadeInTime))
                                ? 1
                                : (timeImmobile - minimumTimeImmbile) / textFadeInTime;

                const viewportSize = this._renderer.getSize();
                viewportSize[0] = viewportSize[0] * 0.75;

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
                    viewportSize[0] * 0.5 - width * 0.5,
                    viewportSize[1] * 0.5 + height * 0.5,
                ];

                this._renderer.pushText(text, position, scale);
            }

        } // help text

        this._renderer.renderHUD(
            this._chunkGenerator.getChunks(),
            this._chunkGenerator.getProcessingPositions(),
            this._touches,
            this._framesDuration);

        if (this._framesDuration.length > 100)
            this._framesDuration.splice(0, this._framesDuration.length - 100);
    }
};

export default WebGLExperiment;
