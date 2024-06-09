// https://www.opengl.org/wiki/GluProject_and_gluUnProject_code

import * as glm from 'gl-matrix';

export const screenToSceneCoordinates = (
  allScreenPos: glm.ReadonlyVec3[],
  modelView: glm.ReadonlyMat4,
  projection: glm.ReadonlyMat4,
  viewport: glm.ReadonlyVec4
): glm.vec3[] => {
  const composedMatrix: glm.ReadonlyMat4 = glm.mat4.multiply(glm.mat4.create(), projection, modelView);
  return screenToSceneCoordinatesFromComposed(allScreenPos, composedMatrix, viewport);
};

export const screenToSceneCoordinatesFromComposed = (
  allScreenPos: glm.ReadonlyVec3[],
  composedMatrix: glm.ReadonlyMat4,
  viewport: glm.ReadonlyVec4
): glm.vec3[] => {
  const invertedComposedMatrix: glm.ReadonlyMat4 = glm.mat4.invert(glm.mat4.create(), composedMatrix);

  return screenToSceneCoordinatesFromInvComposed(allScreenPos, invertedComposedMatrix, viewport);
};

export const screenToSceneCoordinatesFromInvComposed = (
  allScreenPos: glm.ReadonlyVec3[],
  invertedComposedMatrix: glm.ReadonlyMat4,
  viewport: glm.ReadonlyVec4
): glm.vec3[] => {
  const results: glm.vec3[] = [];

  const multipliedVec4 = glm.vec4.create();

  allScreenPos.forEach((screenPos) => {
    multipliedVec4[0] = ((screenPos[0] - viewport[0]) / viewport[2]) * 2.0 - 1.0;
    multipliedVec4[1] = ((screenPos[1] - viewport[1]) / viewport[3]) * 2.0 - 1.0;
    multipliedVec4[2] = 2.0 * screenPos[2] - 1.0;
    multipliedVec4[3] = 1.0;

    glm.vec4.transformMat4(multipliedVec4, multipliedVec4, invertedComposedMatrix);

    //The result normalizes between -1 and 1
    if (multipliedVec4[3] === 0) {
      // The w value
      return;
    }

    multipliedVec4[3] = 1 / multipliedVec4[3];
    // Perspective division
    multipliedVec4[0] *= multipliedVec4[3];
    multipliedVec4[1] *= multipliedVec4[3];
    multipliedVec4[2] *= multipliedVec4[3];

    results.push(glm.vec3.copy(glm.vec3.create(), multipliedVec4 as glm.vec3));
  });

  return results;
};
