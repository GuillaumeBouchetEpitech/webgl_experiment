import { IStackRenderers } from '../stackRenderers/StackRenderers';
import { ITextRenderer } from '../textRenderer/TextRenderer';

import * as glm from 'gl-matrix';

export const renderFpsMeter = (
  inPos: glm.ReadonlyVec3,
  inSize: glm.ReadonlyVec2,
  inFramesDuration: number[],
  inStackRenderers: IStackRenderers,
  inTextRenderer: ITextRenderer
) => {
  // fps meter

  let maxDuration = 0;
  for (let ii = 0; ii < inFramesDuration.length; ++ii) {
    maxDuration = Math.max(maxDuration, inFramesDuration[ii]);
  }

  const k_divider = 5;
  const k_verticalSize = Math.ceil(maxDuration / k_divider) * k_divider;

  {
    // border

    inStackRenderers.pushOriginBoundRectangle(inPos, inSize, [0, 0, 0, 0.5]);

    const allVertices: [
      glm.ReadonlyVec3,
      glm.ReadonlyVec3,
      glm.ReadonlyVec3,
      glm.ReadonlyVec3
    ] = [
      [inPos[0] + inSize[0] * 0, inPos[1] + inSize[1] * 0, 0],
      [inPos[0] + inSize[0] * 1, inPos[1] + inSize[1] * 0, 0],
      [inPos[0] + inSize[0] * 1, inPos[1] + inSize[1] * 1, 0],
      [inPos[0] + inSize[0] * 0, inPos[1] + inSize[1] * 1, 0]
    ];

    inStackRenderers.pushLine(allVertices[0], allVertices[1], [1, 1, 1]);
    inStackRenderers.pushLine(allVertices[1], allVertices[2], [1, 1, 1]);
    inStackRenderers.pushLine(allVertices[2], allVertices[3], [1, 1, 1]);
    inStackRenderers.pushLine(allVertices[3], allVertices[0], [1, 1, 1]);
  } // border

  {
    // dividers

    for (
      let currDivider = k_divider;
      currDivider < k_verticalSize;
      currDivider += k_divider
    ) {
      const ratio = currDivider / k_verticalSize;

      const pointA: glm.ReadonlyVec3 = [
        inPos[0] + 0,
        inPos[1] + inSize[1] * ratio,
        0
      ];
      const pointB: glm.ReadonlyVec3 = [
        inPos[0] + inSize[0],
        inPos[1] + inSize[1] * ratio,
        0
      ];

      inStackRenderers.pushLine(pointA, pointB, [0.5, 0.5, 0.5]);
    }
  } // dividers

  {
    // curve

    if (inFramesDuration.length >= 2) {
      const widthStep = inSize[0] / inFramesDuration.length;

      let prevDelta = inFramesDuration[0];
      let prevCoordX = 0;
      let prevCoordY = (inSize[1] * prevDelta) / k_verticalSize;

      for (let ii = 1; ii < inFramesDuration.length; ++ii) {
        const currDelta = inFramesDuration[ii];
        const currCoordX = ii * widthStep;
        const currCoordY = (inSize[1] * currDelta) / k_verticalSize;

        const pointA: glm.ReadonlyVec3 = [
          inPos[0] + prevCoordX,
          inPos[1] + prevCoordY,
          0
        ];
        const pointB: glm.ReadonlyVec3 = [
          inPos[0] + currCoordX,
          inPos[1] + currCoordY,
          0
        ];

        inStackRenderers.pushLine(pointA, pointB, [1, 1, 1]);

        prevDelta = currDelta;
        prevCoordX = currCoordX;
        prevCoordY = currCoordY;
      }
    }
  } // curve

  {
    // counter

    let average = 0;
    for (const curr of inFramesDuration) average += curr;
    average /= inFramesDuration.length;

    const latestValue = 1000 / average;

    let str = '>999';
    if (latestValue < 999) str = `~${latestValue.toFixed(0)}`.padStart(4, ' ');

    inTextRenderer.pushText(`${str}fps`, [inPos[0] + 7, inPos[1] - 8], 14);
  } // counter
};
