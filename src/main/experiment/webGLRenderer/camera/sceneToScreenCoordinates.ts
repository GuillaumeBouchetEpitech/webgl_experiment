
// https://www.opengl.org/wiki/GluProject_and_gluUnProject_code

import * as glm from 'gl-matrix';

type Vec2 = [number, number];
type Vec3 = [number, number, number];
type Viewport = [number, number, number, number];

const sceneToScreenCoordinates = (scenePos: Vec3, modelview: glm.mat4, projection: glm.mat4, arr_viewport: Viewport): Vec2 | null => {

    const inputVec4 = glm.vec4.fromValues(scenePos[0], scenePos[1], scenePos[2], 1);
    const composedMatrix = glm.mat4.create();
    const multipliedVec4 = glm.vec4.create();

    glm.mat4.multiply(composedMatrix, projection, modelview);
    glm.vec4.transformMat4(multipliedVec4, inputVec4, composedMatrix);

    //The result normalizes between -1 and 1
    if (multipliedVec4[3] === 0) //The w value
        return null;

    multipliedVec4[3] = 1 / multipliedVec4[3];
    // Perspective division
    multipliedVec4[0] *= multipliedVec4[3];
    multipliedVec4[1] *= multipliedVec4[3];
    multipliedVec4[2] *= multipliedVec4[3];

    // Window coordinates
    // Map x, y to range 0-1
    return [
        (multipliedVec4[0] * 0.5 + 0.5) * arr_viewport[2] + arr_viewport[0],
        (multipliedVec4[1] * 0.5 + 0.5) * arr_viewport[3] + arr_viewport[1]
    ];
}

export default sceneToScreenCoordinates;
