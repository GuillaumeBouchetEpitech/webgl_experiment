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

          GlobalMouseManager.activate(document.body);
        } else {
          // g_logger.log('The pointer lock status is now unlocked');

          GlobalMouseManager.deactivate(document.body);

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

      throw new Error('WebGL2 context was lost');
    });

    // this._renderer.setOnContextRestored(() => {
    //   console.log('on_context_restored');
    // });
  }

  async init() {
    await this._renderer.init();
  }

  resize(inWidth: number, inHeight: number) {
    this._renderer.resize(inWidth, inHeight);
  }

  start() {
    if (this.isRunning()) {
      return;
    }

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
      if (!this._running || this._errorGraphicContext) {
        return;
      }

      // plan the next frame
      // window.requestAnimationFrame(tick);
      window.setTimeout(tick, 1000 / 60);

      this._mainLoop();
    };

    tick();
  }

  private _mainLoop() {
    const currentTime = Date.now();
    const elapsedTimeMsec = system.math.clamp(
      currentTime - this._currFrameTime,
      0,
      1000
    );
    this._currFrameTime = currentTime;
    this._frameProfiler.pushDelta(elapsedTimeMsec);

    const deltaTimeSec = elapsedTimeMsec / 1000;

    //
    //

    this._freeFlyController.update(deltaTimeSec);

    this._renderer.lookAt(
      this._freeFlyController.getPosition(),
      this._freeFlyController.getTarget(),
      this._freeFlyController.getUpAxis()
    );

    this._renderer.update();

    const eyePos = this._freeFlyController.getPosition();

    this._chunkGenerator.update(eyePos);

    let visibleChunks = 0;
    this._chunkGenerator.getChunks().forEach((chunk) => {
      if (chunk.isVisible) {
        ++visibleChunks;
      }
    });

    //
    //
    ////// render 3d scene

    this._renderer.multipleBuffering.captureScene(() => {
      this._renderer.renderScene(() => {
        //
        //
        //

        this._renderer.wireFrameCubesRenderer.clear();

        this._chunkGenerator.getChunks().forEach((chunk) => {
          if (!chunk.isVisible) {
            return;
          }

          this._renderer.triangleCubesRenderer.pushOriginBoundCube(
            chunk.realPosition,
            configuration.chunkGraphicSize,
            [1, 1, 1]
          );
        });

        this._renderer.triangleCubesRenderer.flush(this._renderer.mainCamera);

        this._renderer.chunksRenderer.render(
          this._renderer.mainCamera,
          this._renderer.frustumCulling,
          configuration.chunkGraphicSize
        );

        //
        //
        //
      });
    });

    //
    //
    ////// HUD

    this._renderer.renderHUD(() => {
      const gl = graphics.webgl2.WebGLContext.getContext();

      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // gl.clear(/*gl.COLOR_BUFFER_BIT |*/ gl.DEPTH_BUFFER_BIT);

      // the modern web browsers are already applying double buffering
      // -> so we're in fact triple buffering here
      // -> which is great -> more time for the WebGL queue to finish on time
      this._renderer.multipleBuffering.renderHud(
        this._renderer.hudCamera.getComposedMatrix()
      );

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

        graphics.renderers.widgets.addKeyStrokesWidgets(
          keyEventsPos,
          this._renderer.stackRenderers,
          this._renderer.textRenderer
        );
        graphics.renderers.widgets.addArrowStrokesWidgets(
          touchEventsPos,
          this._renderer.stackRenderers,
          this._renderer.textRenderer
        );
        graphics.renderers.widgets.addKeysTouchesWidgets(
          this._canvasElement,
          boardPos,
          this._renderer.stackRenderers,
          this._renderer.textRenderer
        );
      }

      graphics.renderers.widgets.renderFpsMeter(
        [10, this._canvasElement.height - 60, 0],
        [100, 50],
        this._frameProfiler,
        this._renderer.stackRenderers,
        this._renderer.textRenderer,
        true
      );

      graphics.renderers.widgets.renderFpsMeter(
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

      this._renderer.stackRenderers.clear();
      this._renderer.textRenderer.clear();

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

      this._renderer.flush();
    });
  }
}
