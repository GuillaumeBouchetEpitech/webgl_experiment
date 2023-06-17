import * as hud from '../../../renderers/hud';

import * as glm from 'gl-matrix';

export const renderGenerationMetrics = (
  inViewportSize: glm.ReadonlyVec2,
  inChunksCreated: number,
  inChunksDiscarded: number,
  inVisibleChunks: number,
  inTextRenderer: hud.ITextRenderer
) => {
  const textsOrigin: glm.ReadonlyVec2 = [
    inViewportSize[0] - 10,
    inViewportSize[1] - 10
  ];

  const text: string = [
    `Chunks\nGenerated:\n${inChunksCreated} <`,
    '',
    `Chunks\nDiscarded:\n${inChunksDiscarded} <`,
    '',
    `Live\nChunks:\n${inChunksCreated - inChunksDiscarded} <`,
    '',
    `Visible\nChunks:\n${inVisibleChunks} <`
  ].join('\n');

  inTextRenderer
    .setTextScale(14)
    .setTextAlign('right', 'top')
    .pushText(text, textsOrigin);
};
