import { IFrameProfiler } from '../../../../utils/FrameProfiler';
import { IStackRenderers } from '../stackRenderers/StackRenderers';
import { ITextRenderer } from '../textRenderer/TextRenderer';

import * as glm from 'gl-matrix';

export const renderFpsMeter = (
  inPos: glm.ReadonlyVec3,
  inSize: glm.ReadonlyVec2,
  inFrameProfiler: IFrameProfiler,
  inStackRenderers: IStackRenderers,
  inTextRenderer: ITextRenderer
) => {
  // fps meter

  const k_divider = 5;
  const k_verticalSize =
    Math.ceil(inFrameProfiler.maxDelta / k_divider) * k_divider;

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

    if (inFrameProfiler.framesDelta.length >= 2) {
      const widthStep = inSize[0] / inFrameProfiler.framesDelta.length;

      let prevDelta = inFrameProfiler.framesDelta[0];
      let prevCoordX = 0;
      let prevCoordY = (inSize[1] * prevDelta) / k_verticalSize;

      for (let ii = 1; ii < inFrameProfiler.framesDelta.length; ++ii) {
        const currDelta = inFrameProfiler.framesDelta[ii];
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

    const latestValue = 1000 / inFrameProfiler.averageDelta;
    const minFps = 1000 / inFrameProfiler.maxDelta;
    const maxFps = 1000 / inFrameProfiler.minDelta;

    const _getFpsStr = (inVal: number) => {
      if (inVal < 999) {
        return `${inVal.toFixed(0)}`.padStart(3, ' ');
      }
      return '???';
    };

    const text = [
      `~${_getFpsStr(latestValue)}fps`,
      `${_getFpsStr(minFps)}..${_getFpsStr(maxFps)}`
    ].join('\n');

    inTextRenderer.pushText(text, [inPos[0] + 7, inPos[1] - 8], 14);
  } // counter
};
