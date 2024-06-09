import * as glm from 'gl-matrix';

export const rad2Deg = (rad: number) => (rad / Math.PI) * 180;
export const deg2Rad = (deg: number) => (deg * Math.PI) / 180;

export const getEuler = (vector3: glm.ReadonlyVec3): [number, number] => {
  const theta = Math.atan2(vector3[1], vector3[0]);
  const magnitude = glm.vec2.length([vector3[0], vector3[1]]);
  const phi = Math.atan2(vector3[2], magnitude);
  return [theta, phi];
};
