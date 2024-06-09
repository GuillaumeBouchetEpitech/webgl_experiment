import { system, graphics } from '@local-framework';

import * as scene from './renderers/scene';
import * as hud from './renderers/hud';

import * as glm from 'gl-matrix';

const { GlobalMouseManager, GlobalTouchManager } = system.browser;
const { WebGLContext, ShaderProgram } = graphics.webgl2;

//

interface IDefinition {
  canvasDomElement: HTMLCanvasElement;
}

interface IScene {
  chunksRenderer: scene.ChunksRenderer;
  triangleCubesRenderer: scene.TriangleCubesRenderer;
}

interface IHud {
  textRenderer: graphics.renderers.ITextRenderer;
  stackRenderers: graphics.renderers.IStackRenderers;
  wireFrameCubesRenderer: hud.WireFrameCubesRenderer;
  multipleBuffering: graphics.renderers.MultiBuffersRendering;
}

export class WebGLRenderer {
  private _def: IDefinition;

  private _viewportSize = glm.vec2.create();

  private _frustumCulling = new graphics.camera.FrustumCulling();

  private _mainCamera = new graphics.camera.Camera();
  private _mainHudCamera = new graphics.camera.Camera();

  private onContextLost: (() => void) | null = null;
  private onContextRestored: (() => void) | null = null;

  private _scene: IScene;
  private _hud: IHud;

  constructor(def: IDefinition) {
    this._def = def;

    WebGLContext.initialize(this._def.canvasDomElement);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      console.log('context is lost');

      if (this.onContextLost) {
        this.onContextLost();
      }
    };

    const onContextRestored = () => {
      console.log('context is restored');

      WebGLContext.initialize(this._def.canvasDomElement);

      if (this.onContextRestored) {
        this.onContextRestored();
      }
    };

    this._def.canvasDomElement.addEventListener(
      'webglcontextlost',
      onContextLost,
      false
    );
    this._def.canvasDomElement.addEventListener(
      'webglcontextrestored',
      onContextRestored,
      false
    );

    this._scene = {
      chunksRenderer: new scene.ChunksRenderer(),
      triangleCubesRenderer: new scene.TriangleCubesRenderer()
    };

    this._hud = {
      textRenderer: new graphics.renderers.TextRenderer(),
      stackRenderers: new graphics.renderers.StackRenderers(),
      wireFrameCubesRenderer: new hud.WireFrameCubesRenderer(),
      multipleBuffering: new graphics.renderers.MultiBuffersRendering(
        this._def.canvasDomElement.width,
        this._def.canvasDomElement.height
      )
    };

    this.resize(
      this._def.canvasDomElement.width,
      this._def.canvasDomElement.height
    );
  }

  resize(width: number, height: number) {
    this._viewportSize[0] = width;
    this._viewportSize[1] = height;

    this._mainCamera.setViewportSize(width, height);
    this._mainCamera.setAsPerspective({ fovy: 70, near: 0.1, far: 70 });

    this._mainHudCamera.setViewportSize(width, height);
    this._mainHudCamera.setAsOrthogonal({
      left: -width * 0.5,
      right: +width * 0.5,
      top: -height * 0.5,
      bottom: +height * 0.5,
      near: -200,
      far: 200
    });
    this._mainHudCamera.setEye([+width * 0.5, +height * 0.5, 1]);
    this._mainHudCamera.setTarget([+width * 0.5, +height * 0.5, 0]);
    this._mainHudCamera.setUpAxis([0, 1, 0]);
    this._mainHudCamera.computeMatrices();

    this._hud.multipleBuffering.resize(width, height);
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

  lookAt(
    inEye: glm.ReadonlyVec3,
    inTarget: glm.ReadonlyVec3,
    inUpAxis: glm.ReadonlyVec3
  ) {
    this._mainCamera.setEye(inEye);
    this._mainCamera.setTarget(inTarget);
    this._mainCamera.setUpAxis(inUpAxis);
    this._mainCamera.computeMatrices();
  }

  update() {
    GlobalMouseManager.resetDeltas();
    GlobalTouchManager.resetDeltas();

    this._frustumCulling.calculateFrustum(
      this._mainCamera.getProjectionMatrix(),
      this._mainCamera.getViewMatrix()
    );
  }

  renderScene(callback: () => void) {
    const gl = WebGLContext.getContext();

    const viewPos = this._mainCamera.getViewportPos();
    const viewSize = this._mainCamera.getViewportSize();
    gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //
    //
    //

    callback();
  }

  renderHUD(callback: () => void) {
    const gl = WebGLContext.getContext();

    const viewPos = this._mainHudCamera.getViewportPos();
    const viewSize = this._mainHudCamera.getViewportSize();
    gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);

    gl.clear(gl.DEPTH_BUFFER_BIT);

    ShaderProgram.unbind();

    callback();
  }

  flush() {
    const gl = graphics.webgl2.WebGLContext.getContext();
    gl.flush();
    // gl.finish();
  }

  get mainCamera(): Readonly<graphics.camera.ICamera> {
    return this._mainCamera;
  }
  get hudCamera(): Readonly<graphics.camera.ICamera> {
    return this._mainHudCamera;
  }
  get frustumCulling(): graphics.camera.IFrustumCulling {
    return this._frustumCulling;
  }

  get chunksRenderer(): scene.IChunksRenderer {
    return this._scene.chunksRenderer;
  }
  get triangleCubesRenderer(): scene.ITriangleCubesRenderer {
    return this._scene.triangleCubesRenderer;
  }

  get stackRenderers(): graphics.renderers.IStackRenderers {
    return this._hud.stackRenderers;
  }
  get wireFrameCubesRenderer(): hud.IWireFrameCubesRenderer {
    return this._hud.wireFrameCubesRenderer;
  }
  get textRenderer(): graphics.renderers.ITextRenderer {
    return this._hud.textRenderer;
  }
  get multipleBuffering(): graphics.renderers.MultiBuffersRendering {
    return this._hud.multipleBuffering;
  }
}

export { ILiveGeometry } from './renderers/scene/chunks-renderer/ChunksRenderer';
