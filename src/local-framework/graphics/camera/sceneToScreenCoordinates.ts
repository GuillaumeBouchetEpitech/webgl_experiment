// https://www.opengl.org/wiki/GluProject_and_gluUnProject_code

import * as glm from 'gl-matrix';

const sceneToScreenCoordinates = (
  scenePos: glm.ReadonlyVec3,
  modelView: glm.ReadonlyMat4,
  projection: glm.ReadonlyMat4,
  viewport: glm.ReadonlyVec4
): glm.ReadonlyVec2 | null => {
  const inputVec4 = glm.vec4.fromValues(
    scenePos[0],
    scenePos[1],
    scenePos[2],
    1
  );
  const composedMatrix = glm.mat4.create();
  const multipliedVec4 = glm.vec4.create();

  glm.mat4.multiply(composedMatrix, projection, modelView);
  glm.vec4.transformMat4(multipliedVec4, inputVec4, composedMatrix);

  //The result normalizes between -1 and 1
  if (multipliedVec4[3] === 0)
    //The w value
    return null;

  multipliedVec4[3] = 1 / multipliedVec4[3];
  // Perspective division
  multipliedVec4[0] *= multipliedVec4[3];
  multipliedVec4[1] *= multipliedVec4[3];
  multipliedVec4[2] *= multipliedVec4[3];

  // Window coordinates
  // Map x, y to range 0-1
  return [
    (multipliedVec4[0] * 0.5 + 0.5) * viewport[2] + viewport[0],
    (multipliedVec4[1] * 0.5 + 0.5) * viewport[3] + viewport[1]
  ];
};

export default sceneToScreenCoordinates;
