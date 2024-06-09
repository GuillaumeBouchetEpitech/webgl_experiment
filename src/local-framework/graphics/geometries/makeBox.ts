import { IVertex } from './IVertex';

import * as glm from 'gl-matrix';

// export interface IVertex {
//   pos: glm.vec3;
//   normal: glm.vec3;
// }

export const makeBox = (inSize: glm.ReadonlyVec3): IVertex[] => {
  const hSizeX = inSize[0] * 0.5;
  const hSizeY = inSize[1] * 0.5;
  const hSizeZ = inSize[2] * 0.5;

  const allNormals: glm.ReadonlyVec3[] = [];
  allNormals.push([-1, 0, 0]); // 0
  allNormals.push([+1, 0, 0]); // 1
  allNormals.push([0, -1, 0]); // 2
  allNormals.push([0, +1, 0]); // 3
  allNormals.push([0, 0, -1]); // 4
  allNormals.push([0, 0, +1]); // 5

  const allVertices: glm.ReadonlyVec3[] = [];
  allVertices.push([-hSizeX, -hSizeY, -hSizeZ]); // 0
  allVertices.push([+hSizeX, -hSizeY, -hSizeZ]); // 1
  allVertices.push([-hSizeX, +hSizeY, -hSizeZ]); // 2
  allVertices.push([+hSizeX, +hSizeY, -hSizeZ]); // 3
  allVertices.push([-hSizeX, -hSizeY, +hSizeZ]); // 4
  allVertices.push([+hSizeX, -hSizeY, +hSizeZ]); // 5
  allVertices.push([-hSizeX, +hSizeY, +hSizeZ]); // 6
  allVertices.push([+hSizeX, +hSizeY, +hSizeZ]); // 7

  //

  const allIndices: glm.ReadonlyVec4[] = [];

  // -z 0123
  allIndices.push([0, 2, 1, /*normal => */ 4]);
  allIndices.push([2, 3, 1, /*normal => */ 4]);
  // +z 4567
  allIndices.push([4, 5, 6, /*normal => */ 5]);
  allIndices.push([6, 5, 7, /*normal => */ 5]);

  // +x 1357
  allIndices.push([1, 3, 5, /*normal => */ 1]);
  allIndices.push([5, 3, 7, /*normal => */ 1]);
  // -x 0246
  allIndices.push([0, 4, 2, /*normal => */ 0]);
  allIndices.push([4, 6, 2, /*normal => */ 0]);

  // +y 2367
  allIndices.push([2, 6, 3, /*normal => */ 3]);
  allIndices.push([6, 7, 3, /*normal => */ 3]);
  // -y 0145
  allIndices.push([0, 1, 4, /*normal => */ 2]);
  allIndices.push([4, 1, 5, /*normal => */ 2]);

  // const finalVertices: number[] = [];
  const vertices: IVertex[] = [];

  for (const index of allIndices) {
    vertices.push({
      pos: glm.vec3.copy([0, 0, 0], allVertices[index[0]]),
      normal: glm.vec3.copy([0, 0, 0], allNormals[index[3]])
    });
    vertices.push({
      pos: glm.vec3.copy([0, 0, 0], allVertices[index[1]]),
      normal: glm.vec3.copy([0, 0, 0], allNormals[index[3]])
    });
    vertices.push({
      pos: glm.vec3.copy([0, 0, 0], allVertices[index[2]]),
      normal: glm.vec3.copy([0, 0, 0], allNormals[index[3]])
    });

    // finalVertices.push(allVertices[index[0]][0]);
    // finalVertices.push(allVertices[index[0]][1]);
    // finalVertices.push(allVertices[index[0]][2]);

    // if (inAddNormals) {
    //   finalVertices.push(allNormals[index[3]][0]);
    //   finalVertices.push(allNormals[index[3]][1]);
    //   finalVertices.push(allNormals[index[3]][2]);
    // }

    // finalVertices.push(allVertices[index[1]][0]);
    // finalVertices.push(allVertices[index[1]][1]);
    // finalVertices.push(allVertices[index[1]][2]);

    // if (inAddNormals) {
    //   finalVertices.push(allNormals[index[3]][0]);
    //   finalVertices.push(allNormals[index[3]][1]);
    //   finalVertices.push(allNormals[index[3]][2]);
    // }

    // finalVertices.push(allVertices[index[2]][0]);
    // finalVertices.push(allVertices[index[2]][1]);
    // finalVertices.push(allVertices[index[2]][2]);

    // if (inAddNormals) {
    //   finalVertices.push(allNormals[index[3]][0]);
    //   finalVertices.push(allNormals[index[3]][1]);
    //   finalVertices.push(allNormals[index[3]][2]);
    // }
  }

  return vertices;
};
