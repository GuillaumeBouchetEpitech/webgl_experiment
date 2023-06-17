type Vec3 = [number, number, number];

export const loop3dimensions = (
  inMin: Readonly<Vec3>,
  inMax: Readonly<Vec3>,
  inCallback: (inPos: Readonly<Vec3>) => void
): void => {
  const currPos: Vec3 = [0, 0, 0];
  for (currPos[2] = inMin[2]; currPos[2] <= inMax[2]; ++currPos[2]) {
    for (currPos[1] = inMin[1]; currPos[1] <= inMax[1]; ++currPos[1]) {
      for (currPos[0] = inMin[0]; currPos[0] <= inMax[0]; ++currPos[0]) {
        inCallback(currPos);
      }
    }
  }
};
