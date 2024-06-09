import * as glm from 'gl-matrix';

export const intersectSegment = (
  A: glm.ReadonlyVec2,
  B: glm.ReadonlyVec2,
  I: glm.ReadonlyVec2,
  P: glm.ReadonlyVec2
): number => {
  const D = glm.vec2.fromValues(0, 0);
  const E = glm.vec2.fromValues(0, 0);
  D[0] = B[0] - A[0];
  D[1] = B[1] - A[1];
  E[0] = P[0] - I[0];
  E[1] = P[1] - I[1];
  const denom = D[0] * E[1] - D[1] * E[0];
  if (denom == 0) {
    return -1; // erreur, cas limite
  }
  const t = -(A[0] * E[1] - I[0] * E[1] - E[0] * A[1] + E[0] * I[1]) / denom;
  if (t < 0 || t >= 1) {
    return 0;
  }
  const u = -(-D[0] * A[1] + D[0] * I[1] + D[1] * A[0] - D[1] * I[0]) / denom;
  if (u < 0 || u >= 1) {
    return 0;
  }
  return 1;
};

export const collisionLinesStrip = (
  tab: ReadonlyArray<glm.ReadonlyVec2>,
  P: glm.vec2
): boolean => {
  const I = glm.vec2.fromValues(0, 0);
  I[0] = 10000 + Math.random() * 100; // 10000 + un nombre aléatoire entre 0 et 99
  I[1] = 10000 + Math.random() * 100;
  let nbIntersections = 0;
  for (let ii = 0; ii < tab.length; ++ii) {
    let jj = (ii + 1) % tab.length;

    const result = intersectSegment(tab[ii], tab[jj], I, P);
    if (result == -1) {
      return collisionLinesStrip(tab, P); // cas limite, on relance la fonction.
    }
    nbIntersections += result;
  }
  if (nbIntersections % 2 == 1) {
    // nbIntersections est-il impair ?
    return true;
  }
  return false;
};
