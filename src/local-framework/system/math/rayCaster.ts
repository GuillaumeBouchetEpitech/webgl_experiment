import * as glm from 'gl-matrix';

// Intersects ray r = p + td, |d| = 1, with sphere s and, if intersecting,
// returns t value of intersection and intersection point q
export const intersectRaySphere = (
  pos: glm.ReadonlyVec3,
  dir: glm.ReadonlyVec3,
  center: glm.ReadonlyVec3,
  radius: number
): glm.vec3 | null => {
  // Vector m = p - s.c;
  const m = glm.vec3.sub(glm.vec3.create(), pos, center);
  // float b = Dot(m, d);
  const b = glm.vec3.dot(m, dir);
  // float c = Dot(m, m) - s.r * s.r;
  const c = glm.vec3.dot(m, m) - radius * radius;

  // Exit if r’s origin outside s (c > 0) and r pointing away from s (b > 0)
  if (c > 0 && b > 0) {
    return null;
  }
  const discr = b * b - c;

  // A negative discriminant corresponds to ray missing sphere
  if (discr < 0) {
    return null;
  }

  // Ray now found to intersect sphere, compute smallest t value of intersection
  let t = -b - Math.sqrt(discr);

  // If t is negative, ray started inside sphere so clamp t to zero
  if (t < 0) {
    t = 0;
  }

  return glm.vec3.fromValues(
    pos[0] + t * dir[0],
    pos[1] + t * dir[1],
    pos[2] + t * dir[2]
  );
};
