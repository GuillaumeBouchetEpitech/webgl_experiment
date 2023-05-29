import { WebGLContext, ShaderProgram } from './wrappers';

import { FreeFlyController } from './controllers/FreeFlyController';

import { IFrustumCulling, FrustumCulling } from './camera/FrustumCulling';
import { Camera } from './camera/Camera';

import * as scene from './renderers/scene';
import * as hud from './renderers/hud';

import { renderPerspectiveFrustum } from './utils';

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

interface IScene {
  chunksRenderer: scene.ChunksRenderer;
  triangleCubesRenderer: scene.TriangleCubesRenderer;
}

interface IHud {
  textRenderer: hud.TextRenderer;
  stackRenderers: hud.StackRenderers;
  wireFrameCubesRenderer: hud.WireFrameCubesRenderer;
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

  private _scene: IScene;
  private _hud: IHud;

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

    this._scene = {
      chunksRenderer: new scene.ChunksRenderer(),
      triangleCubesRenderer: new scene.TriangleCubesRenderer(),
    };

    this._hud = {
      textRenderer: new hud.TextRenderer(),
      stackRenderers: new hud.StackRenderers(),
      wireFrameCubesRenderer: new hud.WireFrameCubesRenderer(),
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
    this._mainHudCamera.setEye([
      +this._viewportSize[0] * 0.5,
      +this._viewportSize[1] * 0.5,
      1
    ]);
    this._mainHudCamera.setTarget([
      +this._viewportSize[0] * 0.5,
      +this._viewportSize[1] * 0.5,
      0
    ]);
    this._mainHudCamera.setUpAxis([0, 1, 0]);
    this._mainHudCamera.computeMatrices();

    //

    const k_minSize = 200;
    const k_viewSize = 100;

    const minViewportSize = Math.min(
      this._viewportSize[0],
      this._viewportSize[1]
    );

    const minimapWidth = Math.max(minViewportSize * 0.5, k_minSize);
    const minimapHeight = Math.max(minViewportSize * 0.5, k_minSize);

    const minimapPosX = this._viewportSize[0] - minimapWidth;
    this._miniMapHudCamera.setViewportPos(minimapPosX, 0);

    this._miniMapHudCamera.setViewportSize(minimapWidth, minimapHeight);
    const aspectRatio = minimapWidth / minimapHeight;
    const orthoSizeH =
      aspectRatio >= 1.0 ? k_viewSize : k_viewSize * (1 / aspectRatio);
    const orthoSizeW = orthoSizeH * aspectRatio;
    this._miniMapHudCamera.setAsOrthogonal({
      left: -orthoSizeW,
      right: +orthoSizeW,
      top: -orthoSizeH,
      bottom: +orthoSizeH,
      near: -200,
      far: 200
    });
    this._miniMapHudCamera.setUpAxis([0, 0, 1]);
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

    gl.disable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR);

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

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
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

    this._scene.triangleCubesRenderer.flush(this._mainCamera);
  }

  renderHUD(chunks: Chunks, processingPos: glm.ReadonlyVec3[]) {
    const gl = WebGLContext.getContext();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    this._renderMainHud(chunks, processingPos);

    this._renderMiniMapHud(chunks, processingPos);

    ShaderProgram.unbind();
  }

  private _renderMainHud(chunks: Chunks, processingPos: glm.ReadonlyVec3[]) {
    const gl = WebGLContext.getContext();

    const viewPos = this._mainHudCamera.getViewportPos();
    const viewSize = this._mainHudCamera.getViewportSize();
    gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);

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

      renderTouchEvents(
        this._viewportSize,
        this._hud.stackRenderers,
        this._freeFlyController
      );
    } // thick lines

    gl.clear(gl.DEPTH_BUFFER_BIT);

    this._hud.stackRenderers.flush(this._mainHudCamera);
    this._hud.textRenderer.flush(this._mainHudCamera.getComposedMatrix());
  }

  private _renderMiniMapHud(chunks: Chunks, processingPos: glm.ReadonlyVec3[]) {
    const gl = WebGLContext.getContext();

    const cameraPos = this._freeFlyController.getPosition();

    const forwardPhi = this._freeFlyController.getPhi();
    const upPhi = forwardPhi + Math.PI * 0.5;
    const forwardTheta = this._freeFlyController.getTheta();
    const rightTheta = forwardTheta - Math.PI * 0.25;

    const rightCosTheta = Math.cos(rightTheta);
    const rightSinTheta = Math.sin(rightTheta);
    const forwardCosTheta = Math.cos(forwardTheta);
    const forwardSinTheta = Math.sin(forwardTheta);

    const upRadius = Math.cos(upPhi);
    const upAxisX = upRadius * forwardCosTheta;
    const upAxisY = upRadius * forwardSinTheta;
    const upAxisZ = Math.sin(upPhi);

    const forwardRadius = Math.cos(forwardPhi);
    const forwardAxisX = forwardRadius * rightCosTheta;
    const forwardAxisY = forwardRadius * rightSinTheta;
    const forwardAxisZ = Math.sin(forwardPhi);

    const tmpEyePos = glm.vec3.fromValues(0, 0, 0);
    tmpEyePos[0] = cameraPos[0] - forwardAxisX * 20.0 + upAxisX * 0.0;
    tmpEyePos[1] = cameraPos[1] - forwardAxisY * 20.0 + upAxisY * 0.0;
    tmpEyePos[2] = cameraPos[2] - forwardAxisZ * 0.0 + upAxisZ * 10.0;

    this._miniMapHudCamera.setEye(tmpEyePos);
    this._miniMapHudCamera.setTarget(cameraPos);
    this._miniMapHudCamera.computeMatrices();

    const viewPos = this._miniMapHudCamera.getViewportPos();
    const viewSize = this._miniMapHudCamera.getViewportSize();
    gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);

    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);

    this._hud.wireFrameCubesRenderer.clear();

    const hSize = this._def.chunkSize * 0.5;

    for (const currChunk of chunks) {
      ///

      const chunkCenter: glm.ReadonlyVec3 = [
        currChunk.realPosition[0] + hSize,
        currChunk.realPosition[1] + hSize,
        currChunk.realPosition[2] + hSize
      ];

      if (currChunk.isVisible) {
        // render white cubes

        this._hud.wireFrameCubesRenderer.pushCenteredCube(
          chunkCenter,
          this._def.chunkSize * 0.5,
          [1, 1, 1]
        );
      } else {
        // render smaller red cubes

        this._hud.wireFrameCubesRenderer.pushCenteredCube(
          chunkCenter,
          this._def.chunkSize * 0.5,
          [1, 0, 0, 0.8]
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

        this._hud.wireFrameCubesRenderer.pushCenteredCube(
          chunkCenter,
          this._def.chunkSize * 1.2,
          [0, 1, 0]
        );
      }
    }

    this._hud.wireFrameCubesRenderer.flush(this._miniMapHudCamera);
    this._hud.stackRenderers.flush(this._miniMapHudCamera);

    {
      const projData = this._mainCamera.getPerspectiveData()!;

      renderPerspectiveFrustum(
        projData.fovy,
        projData.aspectRatio,
        projData.near,
        projData.far,
        this._freeFlyController,
        this._hud.stackRenderers
      );

      this._hud.stackRenderers.flush(this._miniMapHudCamera);
    }

    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
  }

  get freeFlyController() {
    return this._freeFlyController;
  }

  get wireFrameCubesRenderer(): hud.IWireFrameCubesRenderer {
    return this._hud.wireFrameCubesRenderer;
  }
  get triangleCubesRenderer(): scene.ITriangleCubesRenderer {
    return this._scene.triangleCubesRenderer;
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
