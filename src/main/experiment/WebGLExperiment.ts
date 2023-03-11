import * as configuration from '../configuration';

import {
  GlobalPointerLockManager,
  GlobalKeyboardManager,
  GlobalMouseManager,
  GlobalTouchManager
} from './inputManagers';

import { ChunkGenerator } from './generation/ChunkGenerator';
import { WebGLRenderer } from './webGLRenderer/WebGLRenderer';
import { GeometryWrapper } from './webGLRenderer/wrappers';

import * as glm from 'gl-matrix';

export class WebGLExperiment {
  private _canvasElement: HTMLCanvasElement;
  private _helperTextCountDown: number;

  private _renderer: WebGLRenderer;
  private _chunkGenerator: ChunkGenerator<GeometryWrapper.Geometry>;

  private _running: boolean;
  private _errorGraphicContext: boolean;

  private _chunksCreated: number = 0;
  private _chunksDiscarded: number = 0;

  private _currFrameTime: number = 0;
  private _framesDuration: number[] = [];

  constructor(canvasElement: HTMLCanvasElement) {
    this._canvasElement = canvasElement;
    this._helperTextCountDown = 4000;

    this._renderer = new WebGLRenderer({
      canvasDomElement: canvasElement,
      chunkSize: configuration.chunkSize,
      mouseSensibility: configuration.controllerMouseSensibility,
      movingSpeed: configuration.controllerMovingSpeed,
      keyboardSensibility: configuration.controllerKeyboardSensibility,
      touchSensibility: configuration.controllerTouchSensibility
    });

    // put the camera outside the known chunk
    this._renderer
      .freeFlyController
      .setPosition(
        glm.vec3.fromValues(
          (configuration.chunkSize / 4) * 3,
          (configuration.chunkSize / 4) * 3,
          0
        )
      );

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
      pointIsVisible: (pos: glm.ReadonlyVec3) => {
        return this._renderer.frustumCulling.pointInFrustum(pos[0], pos[1], pos[2]);
      },
      addGeometry: (buffer) => {
        return this._renderer.chunksRenderer.buildGeometry(buffer);
      },
      updateGeometry: (geom, buffer) => {
        geom.updateBuffer(0, buffer);
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
      GlobalTouchManager.activate();

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
      // go full-screen
      if (canvasElement.requestFullscreen) canvasElement.requestFullscreen();
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

      const isInFullScreen =
        document.fullscreenElement !== null ||
        (document as any).mozFullScreen ||
        (document as any).webkitIsFullScreen ||
        (document as any).msFullscreenElement;

      if (isInFullScreen) {
        canvasElement.style.position = 'absolute';

        currentWidth = window.innerWidth;
        currentHeight = window.innerHeight;
      } else {
        canvasElement.style.position = 'relative';

        currentWidth = 800;
        currentHeight = 600;
      }

      canvasElement.style.left = '0px';
      canvasElement.style.top = '0px';

      canvasElement.width = currentWidth;
      canvasElement.height = currentHeight;

      this._renderer.resize(currentWidth, currentHeight);
    };

    document.addEventListener(
      'fullscreenchange',
      onFullScreenChangeCallback,
      false
    );
    document.addEventListener(
      'mozfullscreenchange',
      onFullScreenChangeCallback,
      false
    );
    document.addEventListener(
      'webkitfullscreenchange',
      onFullScreenChangeCallback,
      false
    );
    document.addEventListener(
      'msfullscreenchange',
      onFullScreenChangeCallback,
      false
    );

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

      this._mainLoop();

      // plan the next frame
      window.requestAnimationFrame(tick);
    };

    tick();
  }

  private _mainLoop() {
    const currentTime = Date.now();
    const elapsedTime = Math.min(currentTime - this._currFrameTime, 30);
    this._currFrameTime = currentTime;
    this._framesDuration.push(elapsedTime / 1000);

    if (this._helperTextCountDown > 0) {
      this._helperTextCountDown -= elapsedTime;
      if (this._helperTextCountDown < 0) this._helperTextCountDown = 0;
    }

    //
    //
    ////// generation

    const camera_pos = this._renderer.freeFlyController.getPosition();

    this._chunkGenerator.update(camera_pos);

    ////// /generation
    //
    //

    const chunks = this._chunkGenerator.getChunks();

    this._renderer.update(elapsedTime / 1000, chunks);

    //
    //
    ////// render 3d scene

    this._renderer.renderScene(chunks);

    //
    //
    ////// HUD

    {
      // top right text

      let visibleChunks = 0;
      chunks.forEach((chunk) => {
        if (chunk.visible) ++visibleChunks;
      });

      const textsOrigin: glm.ReadonlyVec2 = [590, 590];

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

      let visibleChunks = 0;
      chunks.forEach((chunk) => {
        if (chunk.visible) ++visibleChunks;
      });

      const allLines: string[] = [
        `Coordinates:`,
        `X: ${chunkCoord[0]}`,
        `Y: ${chunkCoord[1]}`,
        `Z: ${chunkCoord[2]}`
      ];

      const textsOrigin: glm.ReadonlyVec2 = [14, 500];

      this._renderer.textRenderer.pushText(allLines.join('\n'), textsOrigin, 14);
    } // bottom left text

    {
      // help text

      type Indicator = {
        center: glm.ReadonlyVec2;
        size: glm.ReadonlyVec2;
        text?: string;
        lines?: {
          a: glm.ReadonlyVec2;
          b: glm.ReadonlyVec2;
          thickness: number;
          color: glm.ReadonlyVec3;
        }[];
        color: glm.ReadonlyVec3;
      };

      const allIndicator: Indicator[] = [];

      const defaultColor: glm.ReadonlyVec3 = [0.2, 0.2, 0.2];
      const activatedColor: glm.ReadonlyVec3 = [0.2, 0.6, 0.2];

      allIndicator.push({
        center: [480, 125],
        size: [40, 40],
        text: 'A\nQ',
        color: GlobalKeyboardManager.isPressed('A', 'Q')
          ? activatedColor
          : defaultColor
      });

      allIndicator.push({
        center: [480 + 45 * 1, 125],
        size: [40, 40],
        text: 'S',
        color: GlobalKeyboardManager.isPressed('S')
          ? activatedColor
          : defaultColor
      });

      allIndicator.push({
        center: [480 + 45 * 1, 125 + 45],
        size: [40, 40],
        text: 'W\nZ',
        color: GlobalKeyboardManager.isPressed('W', 'Z')
          ? activatedColor
          : defaultColor
      });

      allIndicator.push({
        center: [480 + 45 * 2, 125],
        size: [40, 40],
        text: 'D',
        color: GlobalKeyboardManager.isPressed('D')
          ? activatedColor
          : defaultColor
      });

      // left
      allIndicator.push({
        center: [480, 25],
        size: [40, 40],
        lines: [
          { a: [15, 0], b: [-8, 0], thickness: 6, color: [1, 1, 1] },
          { a: [0, 10], b: [-12, -2], thickness: 6, color: [1, 1, 1] },
          { a: [0, -10], b: [-12, 2], thickness: 6, color: [1, 1, 1] }
        ],
        color: GlobalKeyboardManager.isPressed('ArrowLeft')
          ? activatedColor
          : defaultColor
      });

      // down
      allIndicator.push({
        center: [480 + 45, 25],
        size: [40, 40],
        lines: [
          { a: [0, 15], b: [0, -8], thickness: 6, color: [1, 1, 1] },
          { a: [10, 0], b: [-2, -12], thickness: 6, color: [1, 1, 1] },
          { a: [-10, 0], b: [2, -12], thickness: 6, color: [1, 1, 1] }
        ],
        color: GlobalKeyboardManager.isPressed('ArrowDown')
          ? activatedColor
          : defaultColor
      });

      // up
      allIndicator.push({
        center: [480 + 45, 25 + 45],
        size: [40, 40],
        lines: [
          { a: [0, -15], b: [0, 8], thickness: 6, color: [1, 1, 1] },
          { a: [10, 0], b: [-2, 12], thickness: 6, color: [1, 1, 1] },
          { a: [-10, 0], b: [2, 12], thickness: 6, color: [1, 1, 1] }
        ],
        color: GlobalKeyboardManager.isPressed('ArrowUp')
          ? activatedColor
          : defaultColor
      });

      // right
      allIndicator.push({
        center: [480 + 45 * 2, 25],
        size: [40, 40],
        lines: [
          { a: [-15, 0], b: [8, 0], thickness: 6, color: [1, 1, 1] },
          { a: [0, 10], b: [12, -2], thickness: 6, color: [1, 1, 1] },
          { a: [0, -10], b: [12, 2], thickness: 6, color: [1, 1, 1] }
        ],
        color: GlobalKeyboardManager.isPressed('ArrowRight')
          ? activatedColor
          : defaultColor
      });

      if (GlobalTouchManager.isSupported()) {
        allIndicator.push({
          center: [120, 35],
          size: [230, 60],
          text: 'Touch Events\nSupported\n(double tap)',
          color: [0, 0.5, 0]
        });
      } else {
        allIndicator.push({
          center: [120, 35],
          size: [230, 60],
          text: 'Touch Events\nNot Supported',
          color: [0.5, 0, 0]
        });
      }

      if (GlobalPointerLockManager.canBePointerLocked(this._canvasElement)) {
        allIndicator.push({
          center: [350, 35],
          size: [210, 60],
          text: 'Mouse\nSupported',
          color: [0, 0.5, 0]
        });
      } else {
        allIndicator.push({
          center: [350, 35],
          size: [210, 60],
          text: 'Mouse Events\nNot Supported',
          color: [0.5, 0, 0]
        });
      }

      allIndicator.forEach((currIndicator) => {
        const { center } = currIndicator;

        this._renderer.stackRenderers.pushCenteredRectangle(
          glm.vec3.fromValues(center[0], center[1], -0.3),
          currIndicator.size,
          [0, 0, 0]
        );

        this._renderer.stackRenderers.pushCenteredRectangle(
          glm.vec3.fromValues(center[0], center[1], -0.2),
          [currIndicator.size[0] - 2, currIndicator.size[1] - 2],
          currIndicator.color
        );

        if (currIndicator.text) {
          this._renderer.textRenderer.pushCenteredText(currIndicator.text, center, 16);
        }

        if (currIndicator.lines) {
          currIndicator.lines.forEach((currLine) => {
            this._renderer.stackRenderers.pushThickLine(
              [center[0] + currLine.a[0], center[1] + currLine.a[1], 0],
              [center[0] + currLine.b[0], center[1] + currLine.b[1], 0],
              currLine.thickness,
              currLine.color
            );
          });
        }
      });
    } // help text

    this._renderer.renderHUD(
      this._chunkGenerator.getChunks(),
      this._chunkGenerator.getProcessingPositions(),
      this._framesDuration
    );

    if (this._framesDuration.length > 100)
      this._framesDuration.splice(0, this._framesDuration.length - 100);
  }
}
