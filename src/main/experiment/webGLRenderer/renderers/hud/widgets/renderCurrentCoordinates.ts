import { graphics } from '@local-framework';

import * as glm from 'gl-matrix';

export const renderCurrentCoordinates = (
  inViewportSize: glm.ReadonlyVec2,
  inChunkSize: number,
  inEyePos: glm.ReadonlyVec3,
  inTextRenderer: graphics.renderers.ITextRenderer
) => {
  const chunkCoord: glm.ReadonlyVec3 = [
    Math.floor(inEyePos[0] / inChunkSize),
    Math.floor(inEyePos[1] / inChunkSize),
    Math.floor(inEyePos[2] / inChunkSize)
  ];

  const allLines: string[] = [
    `Coordinates:`,
    `X: ${chunkCoord[0]}`,
    `Y: ${chunkCoord[1]}`,
    `Z: ${chunkCoord[2]}`
  ];

  const textsOrigin: glm.ReadonlyVec2 = [14, inViewportSize[1] - 200];

  inTextRenderer
    .setTextScale(14)
    .setTextAlign('left', 'top')
    .pushText(allLines.join('\n'), textsOrigin);
};
