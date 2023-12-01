import { system, graphics } from '../../..';

import * as glm from 'gl-matrix';

export const renderFpsMeter = (
  inPos: glm.ReadonlyVec3,
  inSize: glm.ReadonlyVec2,
  inFrameProfiler: system.metrics.IFrameProfiler,
  inStackRenderers: graphics.renderers.IStackRenderers,
  inTextRenderer: graphics.renderers.ITextRenderer,
  inShowFps = false
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

    const k_textScale = 14;
    const k_textHScale = k_textScale * 0.5;

    const averageValue = inFrameProfiler.averageDelta;
    const maxValue = inFrameProfiler.maxDelta;
    const minValue = inFrameProfiler.minDelta;

    let averageStr = `~${averageValue.toFixed(0)}ms`;
    let maxStr = `<${maxValue}ms`;
    let minStr = `>${minValue}ms`;

    if (inShowFps === true) {
      const _getFpsStr = (inVal: number) =>
        inVal < 999 ? inVal.toFixed(0) : '???';

      averageStr += `\n~${_getFpsStr(1000 / averageValue)}fps`;
      maxStr += `\n<${_getFpsStr(1000 / maxValue)}fps`;
      minStr += `\n>${_getFpsStr(1000 / minValue)}fps`;
    }

    inTextRenderer
      .setTextScale(k_textScale)
      .setTextAlign('left', 'top')
      .setTextColor(1.0, 1.0, 0.75)
      .pushText(averageStr, [inPos[0] + 7, inPos[1] - 8])
      .setTextAlign('left', 'centered')
      .setTextColor(1.0, 0.75, 0.75)
      .pushText(maxStr, [
        inPos[0] + inSize[0] + k_textHScale,
        inPos[1] + inSize[1] - k_textHScale * 1
      ])
      .setTextColor(0.75, 1.0, 0.75)
      .pushText(minStr, [
        inPos[0] + inSize[0] + k_textHScale,
        inPos[1] + k_textHScale * 1
      ])
      .setTextColor(1.0, 1.0, 1.0);
  } // counter
};
