

import { IStackRenderers } from "../stackRenderers/StackRenderers"
import { ITextRenderer } from "../textRenderer/TextRenderer"

import * as glm from 'gl-matrix';

export const renderFpsMeter = (
  inPos: glm.ReadonlyVec3,
  inSize: glm.ReadonlyVec2,
  framesDuration: number[],
  stackRenderers: IStackRenderers,
  textRenderer: ITextRenderer,
) => {
  // fps meter

  const maxValue = 1 / 30;

  {
    // border

    stackRenderers.pushOriginBoundRectangle(
      inPos,
      inSize,
      [0, 0, 0, 0.5]
    );

    const allVertices: [
      glm.ReadonlyVec3,
      glm.ReadonlyVec3,
      glm.ReadonlyVec3,
      glm.ReadonlyVec3
    ] = [
      [
        inPos[0] + inSize[0] * 0,
        inPos[1] + inSize[1] * 0,
        0
      ],
      [
        inPos[0] + inSize[0] * 1,
        inPos[1] + inSize[1] * 0,
        0
      ],
      [
        inPos[0] + inSize[0] * 1,
        inPos[1] + inSize[1] * 1,
        0
      ],
      [
        inPos[0] + inSize[0] * 0,
        inPos[1] + inSize[1] * 1,
        0
      ]
    ];

    stackRenderers.pushLine(
      allVertices[0],
      allVertices[1],
      [1, 1, 1]
    );
    stackRenderers.pushLine(
      allVertices[1],
      allVertices[2],
      [1, 1, 1]
    );
    stackRenderers.pushLine(
      allVertices[2],
      allVertices[3],
      [1, 1, 1]
    );
    stackRenderers.pushLine(
      allVertices[3],
      allVertices[0],
      [1, 1, 1]
    );
  } // border

  {
    // curve

    for (let ii = 1; ii < framesDuration.length; ++ii) {
      const prevCoefficient = (ii - 1) / framesDuration.length;
      const currCoefficient = ii / framesDuration.length;
      const prevValue =
        Math.min(framesDuration[ii - 1], maxValue) / maxValue;
      const currValue = Math.min(framesDuration[ii], maxValue) / maxValue;

      const pointA: glm.ReadonlyVec3 = [
        inPos[0] + inSize[0] * prevCoefficient,
        inPos[1] + inSize[1] * prevValue,
        0
      ];
      const pointB: glm.ReadonlyVec3 = [
        inPos[0] + inSize[0] * currCoefficient,
        inPos[1] + inSize[1] * currValue,
        0
      ];

      stackRenderers.pushLine(pointA, pointB, [1, 1, 1]);
    }
  } // curve

  {
    // counter

    let average = 0;
    for (const curr of framesDuration) average += curr;
    average /= framesDuration.length;

    const latestValue = 1 / average;

    let str = '999';
    if (latestValue < 999) str = latestValue.toFixed(0).padStart(3, ' ');

    textRenderer.pushText(
      `${str}fps`,
      [inPos[0] + 7, inPos[1] - 8],
      14
    );
  } // counter

};
