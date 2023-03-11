import * as glm from 'gl-matrix';

export const generateWireFrameFrustumVertices = (
  fovY: number,
  aspect: number,
  zNear: number,
  zFar: number
): glm.ReadonlyVec3[] => {
  const fH = Math.tan((fovY / 360.0) * Math.PI) * zNear;
  const fW = fH * aspect;

  const left = -fW;
  const right = +fW;

  const top = +fH;
  const bottom = -fH;

  const half_z = zFar * Math.sin((fovY * Math.PI) / 180.0);
  const half_y = half_z * aspect;

  const tmpVertices: glm.ReadonlyVec3[] = [];

  tmpVertices.push([zNear, left, top]);
  tmpVertices.push([zNear, right, top]);
  tmpVertices.push([zNear, left, bottom]);
  tmpVertices.push([zNear, right, bottom]);

  tmpVertices.push([zFar, -half_y, +half_z]);
  tmpVertices.push([zFar, +half_y, +half_z]);
  tmpVertices.push([zFar, -half_y, -half_z]);
  tmpVertices.push([zFar, +half_y, -half_z]);

  tmpVertices.push([zFar, -half_y * 1.66, -half_z]);
  tmpVertices.push([zFar, -half_y * 1.66, +half_z]);

  //

  const indices = [];
  indices.push(0, 1, 1, 3, 3, 2, 2, 0);
  indices.push(0, 4, 1, 5, 2, 6, 3, 7);
  indices.push(4, 5, 5, 7, 7, 6, 6, 4);
  indices.push(8, 9);
  indices.push(7, 8);
  indices.push(5, 9);

  //

  const vertices: glm.ReadonlyVec3[] = [];

  for (let ii = 0; ii < indices.length; ++ii) {
    vertices.push(tmpVertices[indices[ii]]);
  }

  return vertices;
};
