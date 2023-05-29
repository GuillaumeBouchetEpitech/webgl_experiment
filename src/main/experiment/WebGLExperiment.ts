import * as configuration from '../configuration';

import {
  GlobalPointerLockManager,
  GlobalKeyboardManager,
  GlobalMouseManager,
  GlobalTouchManager,
  GlobalFullScreenManager
} from './inputManagers';

import { ChunkGenerator } from './generation/ChunkGenerator';
import { ILiveGeometry, WebGLRenderer } from './webGLRenderer/WebGLRenderer';
import { renderControls } from './webGLRenderer/renderers/hud/widgets/renderControls';
import { renderFpsMeter } from './webGLRenderer/renderers/hud/widgets/renderFpsMeter';
import { FrameProfiler } from './utils/FrameProfiler';

import * as glm from 'gl-matrix';

export class WebGLExperiment {
  private _canvasElement: HTMLCanvasElement;

  private _renderer: WebGLRenderer;
  private _chunkGenerator: ChunkGenerator;

  private _running: boolean;
  private _errorGraphicContext: boolean;

  private _chunksCreated: number = 0;
  private _chunksDiscarded: number = 0;

  private _currFrameTime: number = 0;
  private _frameProfiler = new FrameProfiler();

  constructor(canvasElement: HTMLCanvasElement) {
    this._canvasElement = canvasElement;

    this._renderer = new WebGLRenderer({
      canvasDomElement: canvasElement,
      chunkSize: configuration.chunkSize,
      mouseSensibility: configuration.controllerMouseSensibility,
      movingSpeed: configuration.controllerMovingSpeed,
      keyboardSensibility: configuration.controllerKeyboardSensibility,
      touchSensibility: configuration.controllerTouchSensibility
    });

    // put the camera outside the known chunk
    const camera_pos = glm.vec3.fromValues(
      (configuration.chunkSize / 4) * 3,
      (configuration.chunkSize / 4) * 3,
      0
    );

    this._renderer.freeFlyController.setPosition(camera_pos);

    this._chunkGenerator = new ChunkGenerator({
      chunkSize: configuration.chunkSize,
      chunkRange: configuration.chunkRange,

      workerTotal: configuration.workerTotal,
      workerFile: configuration.workerFile,
      workerBufferSize: configuration.workerBufferSize,

      chunkIsVisible: (pos: glm.ReadonlyVec3) => {
        const hSize = configuration.chunkSize * 0.5;

        return this._renderer.frustumCulling.cubeInFrustum(
          pos[0] + hSize,
          pos[1] + hSize,
          pos[2] + hSize,
          hSize
        );
      },
      acquireGeometry: () => {
        return this._renderer.chunksRenderer.acquireGeometry(
          configuration.workerBufferSize
        );
      },
      releaseGeometry: (inGeom: ILiveGeometry) => {
        this._renderer.chunksRenderer.releaseGeometry(inGeom);
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

    {
      GlobalKeyboardManager.activate();
      GlobalTouchManager.activate(this._canvasElement);

      GlobalPointerLockManager.allowPointerLockedOnClickEvent(canvasElement);
      GlobalPointerLockManager.addOnLockChange(() => {
        const isLocked =
          GlobalPointerLockManager.isPointerLocked(canvasElement);

        if (isLocked) {
          // g_logger.log('The pointer lock status is now locked');

          GlobalMouseManager.activate();
        } else {
          // g_logger.log('The pointer lock status is now unlocked');

          GlobalMouseManager.deactivate();

          GlobalPointerLockManager.allowPointerLockedOnClickEvent(
            canvasElement
          );
        }
      });

      GlobalPointerLockManager.addOnLockError((event) => {
        // g_logger.log(
        //   `The pointer lock sent an error, event: "${JSON.stringify(event)}"`
        // );
      });
    }

    //
    //
    // GUI (fullscreen button)

    const guiFullscreen = document.getElementById('gui_fullscreen');
    if (!guiFullscreen) throw new Error('guiFullscreen not found');

    guiFullscreen.addEventListener('click', () => {
      GlobalFullScreenManager.requestFullScreen(canvasElement);
    });

    GlobalFullScreenManager.addOnFullScreenChange(() => {
      let currentWidth = 800;
      let currentHeight = 600;

      if (GlobalFullScreenManager.isFullScreen(canvasElement)) {
        canvasElement.style.position = 'absolute';

        currentWidth = window.innerWidth;
        currentHeight = window.innerHeight;
      } else {
        canvasElement.style.position = 'relative';
      }

      canvasElement.style.left = '0px';
      canvasElement.style.top = '0px';
      canvasElement.style.width = `${currentWidth}px`;
      canvasElement.style.height = `${currentHeight}px`;
      canvasElement.width = currentWidth;
      canvasElement.height = currentHeight;

      this._renderer.resize(currentWidth, currentHeight);
    });

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
    if (this.isRunning()) return;

    this._running = true;

    this._chunkGenerator.start();

    this._tick();
  }

  stop() {
    this._running = false;
    this._chunkGenerator.stop();
  }

  isRunning() {
    return this._running && !this._errorGraphicContext;
  }

  //
  //
  //

  private _tick() {
    const tick = () => {
      if (!this._running || this._errorGraphicContext) return;

      // plan the next frame
      window.requestAnimationFrame(tick);

      this._mainLoop();
    };

    tick();
  }

  private _mainLoop() {
    const currentTime = Date.now();
    const elapsedTime = Math.min(currentTime - this._currFrameTime, 30);
    this._currFrameTime = currentTime;
    this._frameProfiler.pushDelta(elapsedTime);

    //
    //

    this._renderer.update(elapsedTime / 1000);

    const camera_pos = this._renderer.freeFlyController.getPosition();

    this._chunkGenerator.update(camera_pos);

    //
    //
    ////// render 3d scene

    let visibleChunks = 0;

    this._renderer.wireFrameCubesRenderer.clear();

    this._chunkGenerator.getChunks().forEach((chunk) => {
      if (!chunk.isVisible) return;

      ++visibleChunks;

      this._renderer.triangleCubesRenderer.pushOriginBoundCube(
        chunk.realPosition,
        configuration.chunkSize,
        [1, 1, 1]
      );
    });

    this._renderer.renderScene();

    //
    //
    ////// HUD

    this._renderer.stackRenderers.clear();
    this._renderer.textRenderer.clear();

    {
      // top right text

      const textsOrigin: glm.ReadonlyVec2 = [
        this._canvasElement.width - 10,
        this._canvasElement.height - 10
      ];

      const text: string = [
        `Chunks\nGenerated:\n${this._chunksCreated} <`,
        '',
        `Chunks\nDiscarded:\n${this._chunksDiscarded} <`,
        '',
        `Live\nChunks:\n${this._chunksCreated - this._chunksDiscarded} <`,
        '',
        `Visible\nChunks:\n${visibleChunks} <`
      ].join('\n');

      this._renderer.textRenderer.pushRightAlignedText(text, textsOrigin, 14);
    } // top right text

    {
      // bottom left text

      const chunkCoord: glm.ReadonlyVec3 = [
        Math.floor(camera_pos[0] / configuration.chunkSize),
        Math.floor(camera_pos[1] / configuration.chunkSize),
        Math.floor(camera_pos[2] / configuration.chunkSize)
      ];

      const allLines: string[] = [
        `Coordinates:`,
        `X: ${chunkCoord[0]}`,
        `Y: ${chunkCoord[1]}`,
        `Z: ${chunkCoord[2]}`
      ];

      const textsOrigin: glm.ReadonlyVec2 = [
        14,
        this._canvasElement.height - 150
      ];

      this._renderer.textRenderer.pushText(
        allLines.join('\n'),
        textsOrigin,
        14
      );
    } // bottom left text

    renderControls(
      this._canvasElement,
      this._renderer.stackRenderers,
      this._renderer.textRenderer
    );

    renderFpsMeter(
      [10, this._canvasElement.height - 60, 0],
      [100, 50],
      this._frameProfiler,
      this._renderer.stackRenderers,
      this._renderer.textRenderer
    );

    this._renderer.renderHUD(
      this._chunkGenerator.getChunks(),
      this._chunkGenerator.getProcessingRealPositions()
    );
  }
}
