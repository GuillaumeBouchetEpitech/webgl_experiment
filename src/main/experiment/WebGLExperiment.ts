import * as configuration from '../configuration';

import {
  GlobalPointerLockManager,
  GlobalKeyboardManager,
  GlobalMouseManager,
  GlobalTouchManager,
  GlobalFullScreenManager
} from './inputManagers';

import { FreeFlyController } from './controllers/FreeFlyController';
import { ChunkGenerator } from './generation/ChunkGenerator';
import { ILiveGeometry, WebGLRenderer } from './webGLRenderer/WebGLRenderer';
import { FrameProfiler } from './utils/FrameProfiler';

import * as widgets from './webGLRenderer/renderers/hud/widgets';

import * as glm from 'gl-matrix';

export class WebGLExperiment {
  private _canvasElement: HTMLCanvasElement;

  private _freeFlyController: FreeFlyController;

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

    this._freeFlyController = new FreeFlyController({
      position: glm.vec3.fromValues(0, 0, 0),
      coordinates: ['X', 'Y', 'Z'],
      theta: Math.PI * 0.125,
      phi: -Math.PI * 0.125,
      mouseSensibility: configuration.controllerMouseSensibility,
      movingSpeed: configuration.controllerMovingSpeed,
      keyboardSensibility: configuration.controllerKeyboardSensibility,
      touchSensibility: configuration.controllerTouchSensibility
    });

    this._renderer = new WebGLRenderer({
      canvasDomElement: canvasElement,
      chunkSize: configuration.chunkSize,
    });

    // put the camera outside the known chunk
    const camera_pos = glm.vec3.fromValues(
      (configuration.chunkSize / 4) * 3,
      (configuration.chunkSize / 4) * 3,
      0
    );

    this._freeFlyController.setPosition(camera_pos);

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

    this._freeFlyController.update(elapsedTime / 1000);

    this._renderer.lookAt(
      this._freeFlyController.getPosition(),
      this._freeFlyController.getTarget(),
      this._freeFlyController.getUpAxis()
    );

    this._renderer.update();

    const eyePos = this._freeFlyController.getPosition();

    this._chunkGenerator.update(eyePos);

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

    this._renderer.renderHUD();

    this._renderer.stackRenderers.clear();
    this._renderer.textRenderer.clear();

    // top right text
    widgets.renderGenerationMetrics(
      this._renderer.getSize(),
      this._chunksCreated,
      this._chunksDiscarded,
      visibleChunks,
      this._renderer.textRenderer,
    );

    // bottom left text
    widgets.renderCurrentCoordinates(
      this._renderer.getSize(),
      configuration.chunkSize,
      eyePos,
      this._renderer.textRenderer
    );

    widgets.renderControls(
      this._canvasElement,
      this._renderer.stackRenderers,
      this._renderer.textRenderer
    );

    widgets.renderFpsMeter(
      [10, this._canvasElement.height - 60, 0],
      [100, 50],
      this._frameProfiler,
      this._renderer.stackRenderers,
      this._renderer.textRenderer
    );

    widgets.renderTouchEvents(
      this._renderer.getSize(),
      this._renderer.stackRenderers,
      this._freeFlyController.getTouchMoveForward()
    );

    this._renderer.stackRenderers.flush(this._renderer.hudCamera.getComposedMatrix());
    this._renderer.textRenderer.flush(this._renderer.hudCamera.getComposedMatrix());

    widgets.renderMiniMap(
      this._renderer.mainCamera,
      this._chunkGenerator.getChunks(),
      configuration.chunkSize,
      this._renderer.getSize(),
      this._chunkGenerator.getProcessingRealPositions(),
      this._renderer.wireFrameCubesRenderer,
      this._renderer.stackRenderers,
    );
  }
}
