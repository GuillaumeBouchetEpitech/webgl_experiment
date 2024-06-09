// https://www.opengl.org/wiki/GluProject_and_gluUnProject_code

import * as glm from 'gl-matrix';

export const sceneToScreenCoordinates = (
  scenePos: glm.ReadonlyVec3[],
  modelView: glm.ReadonlyMat4,
  projection: glm.ReadonlyMat4,
  viewport: glm.ReadonlyVec4
): glm.vec3[] => {
  const composedMatrix = glm.mat4.create();

  glm.mat4.multiply(composedMatrix, projection, modelView);

  return sceneToScreenCoordsFromComposed(scenePos, composedMatrix, viewport);
};

export const sceneToScreenCoordsFromComposed = (
  allScenePos: glm.ReadonlyVec3[],
  composedMatrix: glm.ReadonlyMat4,
  viewport: glm.ReadonlyVec4
): glm.vec3[] => {
  const inputVec4 = glm.vec4.create();

  const multipliedVec4 = glm.vec4.create();

  const results: glm.vec3[] = [];

  allScenePos.forEach((scenePos) => {
    inputVec4[0] = scenePos[0];
    inputVec4[1] = scenePos[1];
    inputVec4[2] = scenePos[2];
    inputVec4[3] = 1;

    glm.vec4.transformMat4(multipliedVec4, inputVec4, composedMatrix);

    //The result normalizes between -1 and 1
    if (multipliedVec4[3] === 0) {
      //The w value
      return null;
    }

    multipliedVec4[3] = 1 / multipliedVec4[3];
    // Perspective division
    multipliedVec4[0] *= multipliedVec4[3];
    multipliedVec4[1] *= multipliedVec4[3];
    multipliedVec4[2] *= multipliedVec4[3];

    // Window coordinates
    // Map x, y to range 0-1
    (multipliedVec4[0] =
      (multipliedVec4[0] * 0.5 + 0.5) * viewport[2] + viewport[0]),
      (multipliedVec4[1] =
        (multipliedVec4[1] * 0.5 + 0.5) * viewport[3] + viewport[1]);

    results.push(glm.vec3.copy(glm.vec3.create(), multipliedVec4 as glm.vec3));
  });

  return results;
};
