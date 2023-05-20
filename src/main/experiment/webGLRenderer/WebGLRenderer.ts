import { WebGLContext, ShaderProgram } from './wrappers';

import { FreeFlyController } from './controllers/FreeFlyController';

import { IFrustumCulling, FrustumCulling } from './camera/FrustumCulling';
import { Camera } from './camera/Camera';

import * as common from './renderers/common';
import * as scene from './renderers/scene';
import * as hud from './renderers/hud';

import { generateWireFrameFrustumVertices } from './utils';

import * as glm from 'gl-matrix';

import { Chunks } from '../generation/ChunkGenerator';

import { GlobalMouseManager, GlobalTouchManager } from '../inputManagers';
import { IStackRenderers, ITextRenderer } from './renderers/hud';
import { IChunksRenderer } from './renderers/scene';

import { renderTouchEvents } from './renderers/hud/widgets/renderTouchEvents';

//

interface IDefinition {
  canvasDomElement: HTMLCanvasElement;
  chunkSize: number;
  mouseSensibility: number;
  movingSpeed: number;
  keyboardSensibility: number;
  touchSensibility: number;
}

interface ICommon {
  wireFrameCubesRenderer: common.WireFrameCubesRenderer;
}

interface IScene {
  chunksRenderer: scene.ChunksRenderer;
}

interface IHud {
  textRenderer: hud.TextRenderer;
  stackRenderers: hud.StackRenderers;
}

export class WebGLRenderer {
  private _def: IDefinition;

  private _viewportSize = glm.vec2.create();

  private _freeFlyController: FreeFlyController;
  private _frustumCulling: FrustumCulling;

  private _mainCamera = new Camera();
  private _mainHudCamera = new Camera();
  private _miniMapHudCamera = new Camera();

  private onContextLost: (() => void) | null = null;
  private onContextRestored: (() => void) | null = null;

  private _common: ICommon;
  private _scene: IScene;
  private _hud: IHud;

  private _fpsMeterAngle: number = 0;
  private _fpsMeterSpeed: number = 0;

  private _offsetSceneOrigin: glm.vec3;

  constructor(def: IDefinition) {
    this._def = def;

    this.resize(
      this._def.canvasDomElement.width,
      this._def.canvasDomElement.height
    );

    WebGLContext.initialize(this._def.canvasDomElement);

    this._def.canvasDomElement.addEventListener(
      'webglcontextlost',
      (event: Event) => {
        event.preventDefault();
        console.log('context is lost');

        if (this.onContextLost) this.onContextLost();
      },
      false
    );

    this._def.canvasDomElement.addEventListener(
      'webglcontextrestored',
      () => {
        console.log('context is restored');

        WebGLContext.initialize(this._def.canvasDomElement);

        if (this.onContextRestored) this.onContextRestored();
      },
      false
    );

    this._freeFlyController = new FreeFlyController({
      position: glm.vec3.fromValues(0, 0, 0),
      coordinates: ['X', 'Y', 'Z'],
      theta: 0,
      phi: 0,
      mouseSensibility: this._def.mouseSensibility,
      keyboardSensibility: this._def.keyboardSensibility,
      touchSensibility: this._def.touchSensibility,
      movingSpeed: this._def.movingSpeed
    });

    this._frustumCulling = new FrustumCulling();

    this._offsetSceneOrigin = glm.vec3.fromValues(0, 0, 0);

    this._common = {
      wireFrameCubesRenderer: new common.WireFrameCubesRenderer()
    };

    this._scene = {
      chunksRenderer: new scene.ChunksRenderer()
    };

    this._hud = {
      textRenderer: new hud.TextRenderer(),
      stackRenderers: new hud.StackRenderers()
    };
  }

  resize(width: number, height: number) {
    this._viewportSize[0] = width;
    this._viewportSize[1] = height;

    this._mainCamera.setViewportSize(
      this._viewportSize[0],
      this._viewportSize[1]
    );
    this._mainCamera.setAsPerspective({ fovy: 70, near: 0.1, far: 55 });

    this._mainHudCamera.setViewportSize(
      this._viewportSize[0],
      this._viewportSize[1]
    );
    this._mainHudCamera.setAsOrthogonal({
      left: -this._viewportSize[0] * 0.5,
      right: +this._viewportSize[0] * 0.5,
      top: -this._viewportSize[1] * 0.5,
      bottom: +this._viewportSize[1] * 0.5,
      near: -200,
      far: 200
    });
    this._mainHudCamera.setEye([+this._viewportSize[0] * 0.5, +this._viewportSize[1] * 0.5, 1]);
    this._mainHudCamera.setTarget([+this._viewportSize[0] * 0.5, +this._viewportSize[1] * 0.5, 0]);
    this._mainHudCamera.setUpAxis([0, 1, 0]);
    this._mainHudCamera.computeMatrices();

    const posX = this._viewportSize[0] * 0.75;
    this._miniMapHudCamera.setViewportPos(posX, 0);
    this._miniMapHudCamera.setViewportSize(
      this._viewportSize[0] * 0.25,
      this._viewportSize[1] * 0.33
    );
    const sizeCamSize = this._miniMapHudCamera.getViewportSize();
    const aspectRatio = sizeCamSize[0] / sizeCamSize[1];
    const orthoSizeH = 85;
    const orthoSizeW = orthoSizeH * aspectRatio;
    this._miniMapHudCamera.setAsOrthogonal({
      left: -orthoSizeW,
      right: +orthoSizeW,
      top: -orthoSizeH,
      bottom: +orthoSizeH,
      near: -200,
      far: 200
    });
    this._miniMapHudCamera.setUpAxis([0,0,1]);
  }

  //

  toggleContextLoss() {
    const gl = WebGLContext.getContext();
    const extensionLoseContext = WebGLContext.getExtensionLoseContext();

    if (extensionLoseContext) {
      if (gl.isContextLost()) {
        extensionLoseContext.restoreContext(); // restores the context
      } else {
        extensionLoseContext.loseContext(); // trigger a context loss
      }
    }
  }

  contextIsLost() {
    const gl = WebGLContext.getContext();

    return gl.isContextLost();
  }

  setOnContextLost(callback: () => void) {
    this.onContextLost = callback;
  }

  setOnContextRestored(callback: () => void) {
    this.onContextRestored = callback;
  }

  //

  async init() {
    const gl = WebGLContext.getContext();

    //
    //
    // init

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // gl.clearDepth(1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR);

    gl.disable(gl.CULL_FACE);

    gl.activeTexture(gl.TEXTURE0);

    gl.enable(gl.CULL_FACE);

    await this._scene.chunksRenderer.initialize();
  }

  getSize(): glm.ReadonlyVec2 {
    return this._viewportSize;
  }

  update(elapsedTime: number) {
    this._freeFlyController.update(elapsedTime);

    GlobalMouseManager.resetDelta();
    GlobalTouchManager.resetDeltas();

    this._mainCamera.setEye(this._freeFlyController.getPosition());
    this._mainCamera.setTarget(this._freeFlyController.getTarget());
    this._mainCamera.setUpAxis(this._freeFlyController.getUpAxis());
    this._mainCamera.computeMatrices();

    this._frustumCulling.calculateFrustum(
      this._mainCamera.getProjectionMatrix(),
      this._mainCamera.getViewMatrix()
    );

    const cameraPos = this._freeFlyController.getPosition();
    this._offsetSceneOrigin = glm.vec3.fromValues(
      Math.floor(cameraPos[0] / this._def.chunkSize) * this._def.chunkSize,
      Math.floor(cameraPos[1] / this._def.chunkSize) * this._def.chunkSize,
      Math.floor(cameraPos[2] / this._def.chunkSize) * this._def.chunkSize
    );
  }

  renderScene() {
    const gl = WebGLContext.getContext();

    const viewPos = this._mainCamera.getViewportPos();
    const viewSize = this._mainCamera.getViewportSize();
    gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //
    //
    //

    this._mainCamera.subOffset(this._offsetSceneOrigin);
    this._mainCamera.computeMatrices();

    this._scene.chunksRenderer.render(
      this._mainCamera,
      this._offsetSceneOrigin
    );

    this._mainCamera.addOffset(this._offsetSceneOrigin);
    this._mainCamera.computeMatrices();

    //
    //
    //

    this._common.wireFrameCubesRenderer.flush(this._mainCamera);
  }

  renderHUD(chunks: Chunks, processingPos: glm.ReadonlyVec3[]) {
    const gl = WebGLContext.getContext();

    // rendered 3 times with a different viewport and point of view

    gl.clear(gl.DEPTH_BUFFER_BIT);

    this._renderMainHud(chunks, processingPos);

    this._renderMiniMapHud(chunks, processingPos);

    ShaderProgram.unbind();
  }

  private _renderMainHud(chunks: Chunks, processingPos: glm.ReadonlyVec3[]) {
    const gl = WebGLContext.getContext();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    const viewPos = this._mainHudCamera.getViewportPos();
    const viewSize = this._mainHudCamera.getViewportSize();
    gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);

    gl.clear(gl.DEPTH_BUFFER_BIT);

    const widgetSize = glm.vec2.fromValues(100, 50);
    const widgetPos = glm.vec2.fromValues(
      10,
      this._viewportSize[1] - 10 - widgetSize[1]
    );

    {
      // wireFrame
      // //
      // //
      // // not mature as it is
      // for (let ii = 0; ii < chunks.length; ++ii) {
      //     if (!chunks[ii].visible)
      //         continue;
      //     const coord2d = chunks[ii].coord2d;
      //     if (!coord2d)
      //         continue;
      //     const cross_hsize = 20;
      //     vertices.push(coord2d[0]-cross_hsize,coord2d[1]-cross_hsize,0, 1,1,1);
      //     vertices.push(coord2d[0]+cross_hsize,coord2d[1]+cross_hsize,0, 1,1,1);
      //     vertices.push(coord2d[0]+cross_hsize,coord2d[1]-cross_hsize,0, 1,1,1);
      //     vertices.push(coord2d[0]-cross_hsize,coord2d[1]+cross_hsize,0, 1,1,1);
      // }
      // // not mature as it is
      // //
      // //
      // this._stackRenderers.flush(hudComposedMatrix);
    } // wireFrame

    {
      // thick lines

      {
        // rotating wheels

        if (processingPos.length > 0) {
          this._fpsMeterSpeed += 0.0005;
          if (this._fpsMeterSpeed > 0.02) this._fpsMeterSpeed = 0.02;
        } else {
          this._fpsMeterSpeed -= 0.0005;
          if (this._fpsMeterSpeed < 0) this._fpsMeterSpeed = 0;
        }

        this._fpsMeterAngle += this._fpsMeterSpeed;

        const positionA: glm.ReadonlyVec3 = [
          widgetPos[0] + widgetSize[0] + widgetSize[1] * 0.6,
          widgetPos[1] + widgetSize[1] * 0.5,
          0
        ];
        const positionB: glm.ReadonlyVec3 = [
          widgetPos[0] + widgetSize[0] + widgetSize[1] * 1.3,
          widgetPos[1] + widgetSize[1] * 0.5,
          0
        ];

        const allRotatedLines: { position: glm.ReadonlyVec3; angle: number }[] =
          [
            {
              position: positionA,
              angle: this._fpsMeterAngle
            },
            {
              position: positionA,
              angle: this._fpsMeterAngle + 0.5 * Math.PI
            },
            {
              position: positionB,
              angle: -this._fpsMeterAngle + 0.25 * Math.PI
            },
            {
              position: positionB,
              angle: -this._fpsMeterAngle + 0.75 * Math.PI
            }
          ];

        const length = widgetSize[1] * 0.45;
        const thickness = 10;
        const color: glm.ReadonlyVec3 = [1, 1, 1];

        allRotatedLines.forEach((rotatedLine) => {
          this._hud.stackRenderers.pushRotatedLine(
            rotatedLine.position,
            rotatedLine.angle,
            length,
            thickness,
            color
          );
        });
      } // rotating wheels

      renderTouchEvents(
        this._viewportSize,
        this._hud.stackRenderers,
        this._freeFlyController
      );
    } // thick lines

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);

    this._hud.stackRenderers.flush(this._mainHudCamera);
    this._hud.textRenderer.flush(this._mainHudCamera.getComposedMatrix());

    gl.disable(gl.BLEND);
  }

  private _renderMiniMapHud(
    chunks: Chunks,
    processingPos: glm.ReadonlyVec3[]
  ) {
    const gl = WebGLContext.getContext();

    const cameraPos = this._freeFlyController.getPosition();

    const eyeOffset = glm.vec3.fromValues(1.0, 1.2, 1.0);

    const tmpPos = glm.vec3.create();
    glm.vec3.add(tmpPos, cameraPos, eyeOffset);

    this._miniMapHudCamera.setEye(tmpPos);
    this._miniMapHudCamera.setTarget(cameraPos);
    this._miniMapHudCamera.computeMatrices();

    const viewPos = this._miniMapHudCamera.getViewportPos();
    const viewSize = this._miniMapHudCamera.getViewportSize();
    gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);

    {
      const axis_size = 20;

      this._hud.stackRenderers.pushLine(
        [0, 0, 0],
        [0 + axis_size, 0, 0],
        [1, 0, 0]
      );

      this._hud.stackRenderers.pushLine(
        [0, 0, 0],
        [0, 0 + axis_size, 0],
        [0, 1, 0]
      );

      this._hud.stackRenderers.pushLine(
        [0, 0, 0],
        [0, 0, 0 + axis_size],
        [0, 0, 1]
      );

      this._hud.stackRenderers.flush(this._miniMapHudCamera);
    }

    this._common.wireFrameCubesRenderer.clear();

    const hSize = this._def.chunkSize * 0.5;

    for (const currChunk of chunks) {
      ///

      if (currChunk.isVisible) {
        // render white cubes

        this._common.wireFrameCubesRenderer.pushOriginBoundCube(
          currChunk.realPosition,
          this._def.chunkSize,
          [1, 1, 1]
        );
      } else {
        // render red crosses

        const chunkCenter: glm.ReadonlyVec3 = [
          currChunk.realPosition[0] + hSize,
          currChunk.realPosition[1] + hSize,
          currChunk.realPosition[2] + hSize
        ];

        this._hud.stackRenderers.pushCross(
          chunkCenter,
          this._def.chunkSize * 0.25,
          [1, 0, 0]
        );
      }
    }

    if (processingPos.length > 0) {
      for (const currPos of processingPos) {
        // render green cubes (smaller -> scaled)

        const chunkCenter: glm.ReadonlyVec3 = [
          currPos[0] + hSize,
          currPos[1] + hSize,
          currPos[2] + hSize
        ];

        this._common.wireFrameCubesRenderer.pushCenteredCube(
          chunkCenter,
          this._def.chunkSize * 1.2,
          [0, 1, 0]
        );
      }
    }

    this._common.wireFrameCubesRenderer.flush(this._miniMapHudCamera);
    this._hud.stackRenderers.flush(this._miniMapHudCamera);

    const tmpViewMatrix = glm.mat4.copy(
      glm.mat4.create(),
      this._miniMapHudCamera.getViewMatrix()
    );

    glm.mat4.translate(
      tmpViewMatrix,
      tmpViewMatrix,
      this._freeFlyController.getPosition()
    );
    glm.mat4.rotate(
      tmpViewMatrix,
      tmpViewMatrix,
      this._freeFlyController.getTheta(),
      [0, 0, 1]
    );
    glm.mat4.rotate(
      tmpViewMatrix,
      tmpViewMatrix,
      this._freeFlyController.getPhi(),
      [0, -1, 0]
    );

    this._miniMapHudCamera.setViewMatrix(tmpViewMatrix);
    this._miniMapHudCamera.computeComposedMatrix();

    {
      const cross_size = 5;

      const crossVertices: glm.vec3[] = [
        [0 - cross_size, 0, 0],
        [0 + cross_size * 100, 0, 0],
        [0, 0 - cross_size, 0],
        [0, 0 + cross_size, 0],
        [0, 0, 0 - cross_size],
        [0, 0, 0 + cross_size]
      ];
      const crossIndices: number[] = [0, 1, 2, 3, 4, 5];

      for (let ii = 0; ii < crossIndices.length; ii += 2) {
        const vertexA = crossVertices[ii + 0];
        const vertexB = crossVertices[ii + 1];
        this._hud.stackRenderers.pushLine(vertexA, vertexB, [1, 1, 1]);
      }

      const projData = this._mainCamera.getPerspectiveData()!;

      const color: glm.ReadonlyVec3 = [1, 1, 0];

      const tmpVertices = generateWireFrameFrustumVertices(
        projData.fovy,
        projData.aspectRatio,
        projData.near,
        projData.far
      );
      for (let ii = 0; ii < tmpVertices.length; ii += 2) {
        const vertexA = tmpVertices[ii + 0];
        const vertexB = tmpVertices[ii + 1];
        this._hud.stackRenderers.pushLine(vertexA, vertexB, color);
      }

      this._hud.stackRenderers.flush(this._miniMapHudCamera);
    }
  }

  get freeFlyController() {
    return this._freeFlyController;
  }

  get wireFrameCubesRenderer(): common.IWireFrameCubesRenderer {
    return this._common.wireFrameCubesRenderer;
  }
  get stackRenderers(): IStackRenderers {
    return this._hud.stackRenderers;
  }
  get textRenderer(): ITextRenderer {
    return this._hud.textRenderer;
  }
  get frustumCulling(): IFrustumCulling {
    return this._frustumCulling;
  }
  get chunksRenderer(): IChunksRenderer {
    return this._scene.chunksRenderer;
  }
}

export { ILiveGeometry } from './renderers/scene/chunksRenderer/ChunksRenderer';
