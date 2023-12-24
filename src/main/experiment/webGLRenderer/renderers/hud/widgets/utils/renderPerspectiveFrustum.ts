import * as glm from 'gl-matrix';
import { graphics } from '@local-framework';

export const renderPerspectiveFrustum = (
  inFovY: number,
  inAspect: number,
  inNear: number,
  inFar: number,
  eyePos: glm.ReadonlyVec3,
  theta: number,
  phi: number,
  inStackRenderers: graphics.renderers.IStackRenderers
): void => {
  const fH = Math.tan((inFovY / 360.0) * Math.PI) * inNear;
  const fW = fH * inAspect;

  const nearLeft = -fW;
  const nearRight = +fW;

  const nearTop = +fH;
  const nearBottom = -fH;

  const farHalfZ = inFar * Math.sin((inFovY * Math.PI) / 180.0);
  const farHalfY = farHalfZ * inAspect;

  const tmpVertices: glm.vec3[] = [];

  tmpVertices.push([inNear, nearLeft, nearTop]);
  tmpVertices.push([inNear, nearRight, nearTop]);
  tmpVertices.push([inNear, nearLeft, nearBottom]);
  tmpVertices.push([inNear, nearRight, nearBottom]); // 3

  tmpVertices.push([inFar, -farHalfY, +farHalfZ]); // 4
  tmpVertices.push([inFar, +farHalfY, +farHalfZ]);
  tmpVertices.push([inFar, -farHalfY, -farHalfZ]);
  tmpVertices.push([inFar, +farHalfY, -farHalfZ]); // 7

  tmpVertices.push([0, 0, 0]); // 8
  tmpVertices.push([100, 0, 0]);
  tmpVertices.push([0, 100, 0]);
  tmpVertices.push([0, 0, 100]); // 11

  //

  {
    const tmpMatrix = glm.mat4.identity(glm.mat4.create());

    glm.mat4.translate(tmpMatrix, tmpMatrix, eyePos);
    glm.mat4.rotate(tmpMatrix, tmpMatrix, theta, [0, 0, 1]);
    glm.mat4.rotate(tmpMatrix, tmpMatrix, phi, [0, -1, 0]);

    for (let ii = 0; ii < tmpVertices.length; ++ii) {
      tmpVertices[ii] = glm.vec3.transformMat4(
        tmpVertices[ii],
        tmpVertices[ii],
        tmpMatrix
      );
    }
  }

  //

  {
    const indices = [];
    indices.push(0, 1, 1, 3, 3, 2, 2, 0);
    indices.push(0, 4, 1, 5, 2, 6, 3, 7);
    indices.push(4, 5, 5, 7, 7, 6, 6, 4);

    const colorTop: glm.ReadonlyVec3 = [1, 1, 0];
    for (let ii = 0; ii < indices.length; ii += 2) {
      const posA = tmpVertices[indices[ii + 0]];
      const posB = tmpVertices[indices[ii + 1]];
      inStackRenderers.pushLine(posA, posB, colorTop);
    }

    {
      const posA = tmpVertices[8];
      const posB1 = tmpVertices[9];
      const posB2 = tmpVertices[10];
      const posB3 = tmpVertices[11];
      inStackRenderers.pushLine(posA, posB1, [1, 0, 0]);
      inStackRenderers.pushLine(posA, posB2, [0, 1, 0]);
      inStackRenderers.pushLine(posA, posB3, [0, 0, 1]);
    }
  }
};
