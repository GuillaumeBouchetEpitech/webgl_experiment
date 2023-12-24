import * as configuration from '../configuration';

import { graphics, system } from '@local-framework';

import { ChunkGenerator } from './generation/ChunkGenerator';
import { ILiveGeometry, WebGLRenderer } from './webGLRenderer/WebGLRenderer';

import * as widgets from './webGLRenderer/renderers/hud/widgets';

import * as glm from 'gl-matrix';

const {
  GlobalKeyboardManager,
  GlobalTouchManager,
  GlobalMouseManager,
  GlobalPointerLockManager
} = system.browser;

export class WebGLExperiment {
  private _canvasElement: HTMLCanvasElement;

  private _freeFlyController: system.controllers.FreeFlyController;

  private _renderer: WebGLRenderer;
  private _chunkGenerator: ChunkGenerator;

  private _running: boolean;
  private _errorGraphicContext: boolean;

  private _chunksCreated: number = 0;
  private _chunksDiscarded: number = 0;

  private _currFrameTime: number = 0;
  private _frameProfiler = new system.metrics.FrameProfiler();

  constructor(canvasElement: HTMLCanvasElement) {
    this._canvasElement = canvasElement;

    this._freeFlyController = new system.controllers.FreeFlyController({
      position: glm.vec3.fromValues(0, 0, 0),
      coordinates: ['X', 'Y', 'Z'],
      theta: 0,
      phi: 0,
      mouseSensibility: configuration.controllerMouseSensibility,
      movingSpeed: configuration.controllerMovingSpeed,
      keyboardSensibility: configuration.controllerKeyboardSensibility,
      touchSensibility: configuration.controllerTouchSensibility
    });

    this._renderer = new WebGLRenderer({
      canvasDomElement: canvasElement
    });

    this._chunkGenerator = new ChunkGenerator({
      chunkGraphicSize: configuration.chunkGraphicSize,
      chunkGenerationRange: configuration.chunkRange,
      chunkLogicSize: configuration.chunkLogicSize,

      workerTotal: configuration.workerTotal,
      workerFile: configuration.workerFile,

      chunkIsVisible: (pos: glm.ReadonlyVec3) => {
        const k_size = configuration.chunkGraphicSize;
        const k_hSize = k_size * 0.5;

        return this._renderer.frustumCulling.cubeInFrustum(
          pos[0] + k_hSize,
          pos[1] + k_hSize,
          pos[2] + k_hSize,
          k_size
        );
      },
      acquireGeometry: (inSize: number) => {
        return this._renderer.chunksRenderer.acquireGeometry(inSize);
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

  resize(inWidth: number, inHeight: number, inIsFullScreen: boolean) {
    let currentWidth = inWidth;
    let currentHeight = inHeight;

    if (inIsFullScreen) {
      this._canvasElement.style.position = 'absolute';
      currentWidth = window.innerWidth;
      currentHeight = window.innerHeight;
    } else {
      this._canvasElement.style.position = 'relative';
    }

    this._canvasElement.style.left = '0px';
    this._canvasElement.style.top = '0px';
    this._canvasElement.style.width = `${currentWidth}px`;
    this._canvasElement.style.height = `${currentHeight}px`;
    this._canvasElement.width = currentWidth;
    this._canvasElement.height = currentHeight;

    this._renderer.resize(currentWidth, currentHeight);
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
        configuration.chunkGraphicSize,
        [1, 1, 1]
      );
    });

    this._renderer.renderScene(configuration.chunkGraphicSize);

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
      this._renderer.textRenderer
    );

    // bottom left text
    widgets.renderCurrentCoordinates(
      this._renderer.getSize(),
      configuration.chunkGraphicSize,
      eyePos,
      this._renderer.textRenderer
    );

    {
      const keyEventsPos: glm.ReadonlyVec2 = [7 + 20, 165];
      const touchEventsPos: glm.ReadonlyVec2 = [7 + 20, 260];
      const boardPos: glm.ReadonlyVec2 = [7, 35];

      graphics.renderers.addKeyStrokesWidgets(keyEventsPos, this._renderer.stackRenderers, this._renderer.textRenderer);
      graphics.renderers.addArrowStrokesWidgets(touchEventsPos, this._renderer.stackRenderers, this._renderer.textRenderer);
      graphics.renderers.addKeysTouchesWidgets(this._canvasElement, boardPos, this._renderer.stackRenderers, this._renderer.textRenderer);
    }

    graphics.renderers.renderFpsMeter(
      [10, this._canvasElement.height - 60, 0],
      [100, 50],
      this._frameProfiler,
      this._renderer.stackRenderers,
      this._renderer.textRenderer,
      true
    );

    graphics.renderers.renderFpsMeter(
      [10, this._canvasElement.height - 150, 0],
      [100, 50],
      this._chunkGenerator.getFrameProfiler(),
      this._renderer.stackRenderers,
      this._renderer.textRenderer
    );

    widgets.renderTouchEvents(
      this._renderer.getSize(),
      this._renderer.stackRenderers,
      this._freeFlyController.getTouchMoveForward()
    );

    this._renderer.stackRenderers.flush(
      this._renderer.hudCamera.getComposedMatrix()
    );
    this._renderer.textRenderer.flush(
      this._renderer.hudCamera.getComposedMatrix()
    );

    const k_minScreenSize = 300;
    const k_minViewSize = 150;

    widgets.renderMiniMap(
      this._renderer.mainCamera,
      k_minScreenSize,
      k_minViewSize,
      this._chunkGenerator.getChunks(),
      configuration.chunkGraphicSize,
      this._renderer.getSize(),
      this._chunkGenerator.getProcessingRealPositions(),
      this._renderer.wireFrameCubesRenderer,
      this._renderer.stackRenderers
    );
  }
}
