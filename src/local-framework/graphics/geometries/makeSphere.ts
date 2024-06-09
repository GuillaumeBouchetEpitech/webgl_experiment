import { IVertex } from './IVertex';

import * as glm from 'gl-matrix';

// export interface IVertex {
//   pos: glm.vec3;
//   normal: glm.vec3;
// }

const _drawSpherePatch = (
  vertices: IVertex[],
  quality: number,
  radius: number,
  v01: glm.ReadonlyVec3,
  v02: glm.ReadonlyVec3,
  v03: glm.ReadonlyVec3
) => {
  if (quality <= 0) {
    // hack: position = normal
    vertices.push({
      pos: glm.vec3.scale(glm.vec3.create(), v01, radius),
      normal: glm.vec3.copy(glm.vec3.create(), v01)
    });
    vertices.push({
      pos: glm.vec3.scale(glm.vec3.create(), v03, radius),
      normal: glm.vec3.copy(glm.vec3.create(), v03)
    });
    vertices.push({
      pos: glm.vec3.scale(glm.vec3.create(), v02, radius),
      normal: glm.vec3.copy(glm.vec3.create(), v02)
    });
  } else {
    const v12 = glm.vec3.normalize(glm.vec3.create(), glm.vec3.lerp(glm.vec3.create(), v01, v02, 0.5));
    const v23 = glm.vec3.normalize(glm.vec3.create(), glm.vec3.lerp(glm.vec3.create(), v02, v03, 0.5));
    const v31 = glm.vec3.normalize(glm.vec3.create(), glm.vec3.lerp(glm.vec3.create(), v03, v01, 0.5));

    quality -= 1;

    _drawSpherePatch(vertices, quality, radius, v01, v12, v31);
    _drawSpherePatch(vertices, quality, radius, v12, v02, v23);
    _drawSpherePatch(vertices, quality, radius, v31, v23, v03);
    _drawSpherePatch(vertices, quality, radius, v12, v23, v31);
  }
};

export const makeSphere = (
  quality: number,
  radius: number
  // modelMat4: glm.ReadonlyMat4
): IVertex[] => {
  const k_icx = 0.525731112119133606;
  const k_icz = 0.850650808352039932;

  const tmpVertices: glm.ReadonlyVec3[] = [
    [-k_icx, 0.0, +k_icz],
    [+k_icx, 0.0, +k_icz],
    [-k_icx, 0.0, -k_icz],
    [+k_icx, 0.0, -k_icz],
    [0.0, +k_icz, +k_icx],
    [0.0, +k_icz, -k_icx],
    [0.0, -k_icz, +k_icx],
    [0.0, -k_icz, -k_icx],
    [+k_icz, +k_icx, 0.0],
    [-k_icz, +k_icx, 0.0],
    [+k_icz, -k_icx, 0.0],
    [-k_icz, -k_icx, 0.0]
  ];

  const tmpIndices: glm.ReadonlyVec3[] = [
    [0, 4, 1],
    [0, 9, 4],
    [9, 5, 4],
    [4, 5, 8],
    [4, 8, 1],
    [8, 10, 1],
    [8, 3, 10],
    [5, 3, 8],
    [5, 2, 3],
    [2, 7, 3],
    [7, 10, 3],
    [7, 6, 10],
    [7, 11, 6],
    [11, 0, 6],
    [0, 1, 6],
    [6, 1, 10],
    [9, 0, 11],
    [9, 11, 2],
    [9, 2, 5],
    [7, 2, 11]
  ];

  const vertices: IVertex[] = [];

  for (const index of tmpIndices) {
    _drawSpherePatch(vertices, quality, radius, tmpVertices[index[0]], tmpVertices[index[1]], tmpVertices[index[2]]);
  }

  // const newPos = glm.vec3.create();
  // // const newNorm = glm.vec3.create();
  // // const modelMat3 = glm.mat3.fromMat4(glm.mat3.create(), modelMat4);

  // for (const vertex of vertices) {
  //   glm.vec3.transformMat4(newPos, vertex.pos, modelMat4);
  //   glm.vec3.copy(vertex.pos, newPos);
  // }

  return vertices;

  // return vertices.map((vertex) => {

  //   glm.vec3.transformMat4(newPos, vertex.pos, modelMat4);
  //   // glm.vec3.transformMat3(newNorm, vertex.normal, modelMat3);

  //   return {
  //     pos: glm.vec3.copy(glm.vec3.create(), newPos),
  //   }
  //   //   newPos[0],
  //   //   newPos[1],
  //   //   newPos[2],
  //   //   vertex.normal[0],
  //   //   vertex.normal[1],
  //   //   vertex.normal[2]
  //   // ];
  // })
  //   // .flat();
};
