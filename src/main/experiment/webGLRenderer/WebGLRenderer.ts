import { WebGLContext, ShaderProgram } from './wrappers';

import { FreeFlyController } from './controllers/FreeFlyController';
import { IFrustumCulling, FrustumCulling } from './camera/FrustumCulling';
import sceneToScreenCoordinates from './camera/sceneToScreenCoordinates';

import * as common from './renderers/common';
import * as scene from './renderers/scene';
import * as hud from './renderers/hud';

import { generateWireFrameFrustumVertices } from './utils';

import * as glm from 'gl-matrix';

import { Chunks } from '../generation/ChunkGenerator';

import { GlobalMouseManager, GlobalTouchManager } from '../inputManagers';
import { IStackRenderers, ITextRenderer } from './renderers/hud';
import { IChunksRenderer } from './renderers/scene';

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

  private _viewportSize: glm.vec2;

  private _freeFlyController: FreeFlyController;
  private _frustumCulling: FrustumCulling;

  private _projectionMatrix: glm.mat4;
  private _viewMatrix: glm.mat4;
  private _composedMatrix: glm.mat4;

  private _aspectRatio: number;

  private onContextLost: (() => void) | null = null;
  private onContextRestored: (() => void) | null = null;

  // private _textRenderer: TextRenderer;
  // private _wireFrameCubesRenderer: WireFrameCubesRenderer;
  // private _stackRenderers: StackRenderers;
  // private _chunksRenderer: ChunksRenderer;

  private _common: ICommon;
  private _scene: IScene;
  private _hud: IHud;

  private _fpsMeterAngle: number = 0;
  private _fpsMeterSpeed: number = 0;
  private _touchesAngleMap = new Map<number, number>();

  constructor(def: IDefinition) {
    this._def = def;

    this._viewportSize = [
      this._def.canvasDomElement.width,
      this._def.canvasDomElement.height
    ];

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

    this._projectionMatrix = glm.mat4.create();
    this._viewMatrix = glm.mat4.create();
    this._composedMatrix = glm.mat4.create();

    this._aspectRatio = (this._viewportSize[0] * 0.75) / this._viewportSize[1];

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

    this._aspectRatio = (this._viewportSize[0] * 0.75) / this._viewportSize[1];
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

    const fovy = 70;
    const near = 0.1;
    const far = 70;
    glm.mat4.perspective(
      this._projectionMatrix,
      fovy,
      this._aspectRatio,
      near,
      far
    );

    glm.mat4.lookAt(
      this._viewMatrix,
      this._freeFlyController.getPosition(),
      this._freeFlyController.getTarget(),
      this._freeFlyController.getUpAxis()
    );

    glm.mat4.multiply(
      this._composedMatrix,
      this._projectionMatrix,
      this._viewMatrix
    );

    this._frustumCulling.calculateFrustum(
      this._projectionMatrix,
      this._viewMatrix
    );
  }

  renderScene() {
    const gl = WebGLContext.getContext();

    gl.viewport(0, 0, this._viewportSize[0] * 0.75, this._viewportSize[1]);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //
    //
    //

    const cameraPos = this._freeFlyController.getPosition();

    this._scene.chunksRenderer.render(
      this._viewMatrix,
      this._projectionMatrix,
      cameraPos
    );

    //
    //
    //

    this._common.wireFrameCubesRenderer.flush(this._composedMatrix);
  }

  renderHUD(chunks: Chunks, processingPos: glm.ReadonlyVec3[]) {
    const gl = WebGLContext.getContext();

    // rendered 3 times with a different viewport and point of view

    gl.clear(gl.DEPTH_BUFFER_BIT);

    this._renderMainHud(chunks, processingPos);

    const hudWidth = this._viewportSize[0] * 0.25;
    const hudHeight = this._viewportSize[1] * 0.33;
    const hudPosX = this._viewportSize[0] * 0.75;

    this._renderSideHud(
      chunks,
      processingPos,
      [hudPosX, hudHeight * 0, hudWidth, hudHeight],
      [1.0, 1.2, 1.0],
      [0, 0, 1]
    );
    this._renderSideHud(
      chunks,
      processingPos,
      [hudPosX, hudHeight * 1, hudWidth, hudHeight],
      [0.0, 1.0, 0.0],
      [0, 0, 1]
    );
    this._renderSideHud(
      chunks,
      processingPos,
      [hudPosX, hudHeight * 2, hudWidth, hudHeight],
      [0.0, 0.0, 1.0],
      [0, 1, 0]
    );

    ShaderProgram.unbind();
  }

  private _renderMainHud(chunks: Chunks, processingPos: glm.ReadonlyVec3[]) {
    const gl = WebGLContext.getContext();

    gl.clear(gl.DEPTH_BUFFER_BIT);

    const width = this._viewportSize[0] * 0.75;
    const height = this._viewportSize[1];

    gl.viewport(0, 0, width, height);

    const hudProjectionMatrix = glm.mat4.create();
    glm.mat4.ortho(
      hudProjectionMatrix,
      -width * 0.5,
      +width * 0.5,
      -height * 0.5,
      +height * 0.5,
      -200,
      200
    );

    const hudViewMatrix = glm.mat4.create();
    glm.mat4.lookAt(
      hudViewMatrix,
      [+width * 0.5, +height * 0.5, 1],
      [+width * 0.5, +height * 0.5, 0],
      [0, 1, 0]
    );

    const hudComposedMatrix = glm.mat4.create();
    glm.mat4.multiply(hudComposedMatrix, hudProjectionMatrix, hudViewMatrix);

    gl.clear(gl.DEPTH_BUFFER_BIT);

    const widgetSize: glm.ReadonlyVec2 = [100, 50];
    const widgetPos: glm.ReadonlyVec3 = [
      10,
      this._viewportSize[1] - 10 - widgetSize[1],
      0
    ];

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

      {
        // touches

        const allTouchData = GlobalTouchManager.getTouchData();

        if (allTouchData.length === 0) {
          this._touchesAngleMap.clear();
        } else {
          const latestTouchIds = new Set<number>();

          const redColor: glm.ReadonlyVec3 = [1, 0, 0];
          const greenColor: glm.ReadonlyVec3 = [0, 1, 0];
          const color = allTouchData.length > 1 ? redColor : greenColor;

          allTouchData.forEach((currTouch) => {
            latestTouchIds.add(currTouch.id);

            // get or set
            let angle = this._touchesAngleMap.get(currTouch.id);
            if (angle === undefined) {
              angle = 0;
              this._touchesAngleMap.set(currTouch.id, angle);
            }

            const angles = [0.0, 0.5];
            if (this._freeFlyController.getTouchMoveForward())
              angles.push(0.25, 0.75);

            for (const offsetAngle of angles) {
              const finalAngle = angle + offsetAngle * Math.PI;

              const position: glm.ReadonlyVec3 = [
                currTouch.positionX,
                this._viewportSize[1] - currTouch.positionY,
                0
              ];

              this._hud.stackRenderers.pushRotatedLine(
                position,
                finalAngle,
                150,
                15,
                color
              );
            }

            // update the angle
            angle += 0.1;
            this._touchesAngleMap.set(currTouch.id, angle);
          });

          const idNotInUse = new Set<number>();

          this._touchesAngleMap.forEach((value, key) => {
            if (!latestTouchIds.has(key)) idNotInUse.add(key);
          });

          idNotInUse.forEach((value) => {
            this._touchesAngleMap.delete(value);
          });
        }
      } // touches
    } // thick lines

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_ALPHA);

    this._hud.stackRenderers.flush(hudComposedMatrix);
    this._hud.textRenderer.flush(hudComposedMatrix);

    gl.disable(gl.BLEND);
  }

  private _renderSideHud(
    chunks: Chunks,
    processingPos: glm.ReadonlyVec3[],
    viewport: glm.ReadonlyVec4,
    target: glm.ReadonlyVec3,
    up: glm.ReadonlyVec3
  ) {
    const gl = WebGLContext.getContext();

    gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);

    const projectionMatrix = glm.mat4.create();
    const aspectRatio = viewport[2] / viewport[3];
    const orthoSize = 65;

    glm.mat4.ortho(
      projectionMatrix,
      -orthoSize * aspectRatio,
      orthoSize * aspectRatio,
      -orthoSize,
      orthoSize,
      -200,
      200
    );

    const cameraPos = this._freeFlyController.getPosition();

    const lookAtViewMatrix = glm.mat4.create();
    glm.mat4.lookAt(
      lookAtViewMatrix,
      [
        cameraPos[0] + target[0],
        cameraPos[1] + target[1],
        cameraPos[2] + target[2]
      ],
      cameraPos,
      up
    );

    const composedMatrix = glm.mat4.create();
    glm.mat4.multiply(composedMatrix, projectionMatrix, lookAtViewMatrix);

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

      this._hud.stackRenderers.flush(composedMatrix);
    }

    this._common.wireFrameCubesRenderer.clear();

    for (const currChunk of chunks) {
      ///

      if (currChunk.isVisible) {
        // render white cubes

        this._common.wireFrameCubesRenderer.pushOriginBoundCube(
          currChunk.position,
          15,
          [1, 1, 1]
        );
      } else {
        // render red cubes (smaller -> scaled)

        const chunkCenter: glm.ReadonlyVec3 = [
          currChunk.position[0] + 15 * 0.5,
          currChunk.position[1] + 15 * 0.5,
          currChunk.position[2] + 15 * 0.5
        ];

        this._common.wireFrameCubesRenderer.pushCenteredCube(
          chunkCenter,
          15 * 0.7,
          [1, 0, 0]
        );
      }
    }

    if (processingPos.length > 0) {
      for (const currPos of processingPos) {
        // render green cubes (smaller -> scaled)

        const chunkCenter: glm.ReadonlyVec3 = [
          currPos[0] + 15 * 0.5,
          currPos[1] + 15 * 0.5,
          currPos[2] + 15 * 0.5
        ];

        this._common.wireFrameCubesRenderer.pushCenteredCube(
          chunkCenter,
          15 * 0.6,
          [0, 1, 0]
        );
      }
    }

    this._common.wireFrameCubesRenderer.flush(composedMatrix);

    glm.mat4.translate(
      lookAtViewMatrix,
      lookAtViewMatrix,
      this._freeFlyController.getPosition()
    );
    glm.mat4.rotate(
      lookAtViewMatrix,
      lookAtViewMatrix,
      this._freeFlyController.getTheta(),
      [0, 0, 1]
    );
    glm.mat4.rotate(
      lookAtViewMatrix,
      lookAtViewMatrix,
      this._freeFlyController.getPhi(),
      [0, -1, 0]
    );

    glm.mat4.multiply(composedMatrix, projectionMatrix, lookAtViewMatrix);

    {
      const cross_size = 5;

      const crossVertices: glm.ReadonlyVec3[] = [
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

      const vertices2 = generateWireFrameFrustumVertices(
        70,
        this._aspectRatio,
        0.1,
        40
      );
      for (let ii = 0; ii < vertices2.length; ii += 2) {
        const vertexA = vertices2[ii + 0];
        const vertexB = vertices2[ii + 1];
        this._hud.stackRenderers.pushLine(vertexA, vertexB, [1, 1, 0]);
      }

      this._hud.stackRenderers.flush(composedMatrix);
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
