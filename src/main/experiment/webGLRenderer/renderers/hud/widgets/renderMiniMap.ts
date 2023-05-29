
import { WebGLContext } from '../../../wrappers';
import { Camera, ICamera } from '../../../camera/Camera';

import { Chunks } from '../../../../generation/ChunkGenerator';

import * as hud from '../../hud';

import { renderPerspectiveFrustum } from './utils';

import * as glm from 'gl-matrix';

export const renderMiniMap = (
  inCamera: ICamera,
  chunks: Chunks,
  inChunkSize: number,
  viewportSize: glm.ReadonlyVec2,
  processingPos: glm.ReadonlyVec3[],
  inWireFrameCubesRenderer: hud.IWireFrameCubesRenderer,
  inStackRenderers: hud.IStackRenderers,
): void => {
  const gl = WebGLContext.getContext();

  //
  //

  const [width, height] = viewportSize;

  const miniMapHudCamera = new Camera();

  const k_miniMapMinSize = 200;
  const k_miniMapViewSize = 100;

  const minViewportSize = Math.min(width, height) * 0.5;

  const minimapWidth = Math.max(minViewportSize, k_miniMapMinSize);
  const minimapHeight = Math.max(minViewportSize, k_miniMapMinSize);

  const minimapPosX = width - minimapWidth;
  miniMapHudCamera.setViewportPos(minimapPosX, 0);

  miniMapHudCamera.setViewportSize(minimapWidth, minimapHeight);
  const aspectRatio = minimapWidth / minimapHeight;
  const orthoSizeH =
    aspectRatio >= 1.0 ? k_miniMapViewSize : k_miniMapViewSize * (1 / aspectRatio);
  const orthoSizeW = orthoSizeH * aspectRatio;
  miniMapHudCamera.setAsOrthogonal({
    left: -orthoSizeW,
    right: +orthoSizeW,
    top: -orthoSizeH,
    bottom: +orthoSizeH,
    near: -200,
    far: 200
  });
  miniMapHudCamera.setUpAxis([0, 0, 1]);

  //
  //

  const mainEyePos = inCamera.getEye();
  const targetPos = inCamera.getTarget();
  const diff = glm.vec3.sub(glm.vec3.create(), targetPos, mainEyePos);

  const forwardTheta = Math.atan2(diff[1], diff[0]);
  const forwardPhi = Math.atan2(diff[2], glm.vec2.length(glm.vec2.fromValues(diff[1], diff[0])));

  const upPhi = forwardPhi + Math.PI * 0.5;
  const inclinedTheta = forwardTheta - Math.PI * 0.25;

  const inclinedCosTheta = Math.cos(inclinedTheta);
  const inclinedSinTheta = Math.sin(inclinedTheta);

  const upAxisZ = Math.sin(upPhi);

  const miniMapEyePos = glm.vec3.copy(glm.vec3.create(), mainEyePos);
  miniMapEyePos[0] -= inclinedCosTheta * 20.0;
  miniMapEyePos[1] -= inclinedSinTheta * 20.0;
  miniMapEyePos[2] += upAxisZ * 10.0;

  miniMapHudCamera.setEye(miniMapEyePos);
  miniMapHudCamera.setTarget(mainEyePos);
  miniMapHudCamera.computeMatrices();

  const viewPos = miniMapHudCamera.getViewportPos();
  const viewSize = miniMapHudCamera.getViewportSize();
  gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);

  gl.clear(gl.DEPTH_BUFFER_BIT);

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);

  inWireFrameCubesRenderer.clear();

  const k_whiteColor = glm.vec3.fromValues(1, 1, 1);
  const k_redColor = glm.vec4.fromValues(1, 0, 0, 0.8);
  const k_greenColor = glm.vec3.fromValues(0, 1, 0);

  const hSize = inChunkSize * 0.5;

  const chunkCenter = glm.vec3.create();
  const chunkHalfSize = glm.vec3.fromValues(hSize, hSize, hSize);

  for (const currChunk of chunks) {

    glm.vec3.copy(chunkCenter, currChunk.realPosition);
    glm.vec3.add(chunkCenter, chunkCenter, chunkHalfSize);

    if (currChunk.isVisible) {
      // render white cubes

      inWireFrameCubesRenderer.pushCenteredCube(
        chunkCenter,
        hSize,
        k_whiteColor
      );
    } else {
      // render smaller red cubes

      inWireFrameCubesRenderer.pushCenteredCube(
        chunkCenter,
        hSize,
        k_redColor
      );
    }
  }

  if (processingPos.length > 0) {

    const extraSize = inChunkSize * 1.2;

    for (const currPos of processingPos) {
      // render green cubes (smaller -> scaled)

      glm.vec3.copy(chunkCenter, currPos);
      glm.vec3.add(chunkCenter, chunkCenter, chunkHalfSize);

      inWireFrameCubesRenderer.pushCenteredCube(
        chunkCenter,
        extraSize,
        k_greenColor
      );
    }
  }

  inWireFrameCubesRenderer.flush(miniMapHudCamera.getComposedMatrix());
  inStackRenderers.flush(miniMapHudCamera.getComposedMatrix());

  {
    const projData = inCamera.getPerspectiveData()!;

    renderPerspectiveFrustum(
      projData.fovy,
      projData.aspectRatio,
      projData.near,
      projData.far,
      mainEyePos,
      forwardTheta,
      forwardPhi,
      inStackRenderers
    );

    inStackRenderers.flush(miniMapHudCamera.getComposedMatrix());
  }

  gl.disable(gl.BLEND);
  gl.enable(gl.DEPTH_TEST);
}