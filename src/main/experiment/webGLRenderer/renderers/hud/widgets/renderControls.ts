
import { GlobalKeyboardManager, GlobalTouchManager, GlobalPointerLockManager } from '../../../../inputManagers';

import { IStackRenderers } from "../stackRenderers/StackRenderers"
import { ITextRenderer } from "../textRenderer/TextRenderer"

import * as glm from 'gl-matrix';

export const renderControls = (
  canvasElement: HTMLCanvasElement,
  stackRenderers: IStackRenderers,
  textRenderer: ITextRenderer,
) => {
  // help text

  type Indicator = {
    center: glm.ReadonlyVec2;
    size: glm.ReadonlyVec2;
    text?: string;
    lines?: {
      a: glm.ReadonlyVec2;
      b: glm.ReadonlyVec2;
      thickness: number;
      color: glm.ReadonlyVec3;
    }[];
    color: glm.ReadonlyVec3;
  };

  const allIndicator: Indicator[] = [];

  const defaultColor: glm.ReadonlyVec3 = [0.2, 0.2, 0.2];
  const activatedColor: glm.ReadonlyVec3 = [0.2, 0.6, 0.2];

  const indicator1: glm.ReadonlyVec2 = [30, 30];
  const indicator2: glm.ReadonlyVec2 = [30, 130];

  allIndicator.push({
    center: [indicator1[0], indicator1[1]],
    size: [40, 40],
    text: 'A\nQ',
    color: GlobalKeyboardManager.isPressed('A', 'Q')
      ? activatedColor
      : defaultColor
  });

  allIndicator.push({
    center: [indicator1[0] + 45 * 1, indicator1[1]],
    size: [40, 40],
    text: 'S',
    color: GlobalKeyboardManager.isPressed('S')
      ? activatedColor
      : defaultColor
  });

  allIndicator.push({
    center: [indicator1[0] + 45 * 1, indicator1[1] + 45],
    size: [40, 40],
    text: 'W\nZ',
    color: GlobalKeyboardManager.isPressed('W', 'Z')
      ? activatedColor
      : defaultColor
  });

  allIndicator.push({
    center: [indicator1[0] + 45 * 2, indicator1[1]],
    size: [40, 40],
    text: 'D',
    color: GlobalKeyboardManager.isPressed('D')
      ? activatedColor
      : defaultColor
  });

  // left
  allIndicator.push({
    center: [indicator2[0], indicator2[1]],
    size: [40, 40],
    lines: [
      { a: [15, 0], b: [-8, 0], thickness: 6, color: [1, 1, 1] },
      { a: [0, 10], b: [-12, -2], thickness: 6, color: [1, 1, 1] },
      { a: [0, -10], b: [-12, 2], thickness: 6, color: [1, 1, 1] }
    ],
    color: GlobalKeyboardManager.isPressed('ArrowLeft')
      ? activatedColor
      : defaultColor
  });

  // down
  allIndicator.push({
    center: [indicator2[0] + 45, indicator2[1]],
    size: [40, 40],
    lines: [
      { a: [0, 15], b: [0, -8], thickness: 6, color: [1, 1, 1] },
      { a: [10, 0], b: [-2, -12], thickness: 6, color: [1, 1, 1] },
      { a: [-10, 0], b: [2, -12], thickness: 6, color: [1, 1, 1] }
    ],
    color: GlobalKeyboardManager.isPressed('ArrowDown')
      ? activatedColor
      : defaultColor
  });

  // up
  allIndicator.push({
    center: [indicator2[0] + 45, indicator2[1] + 45],
    size: [40, 40],
    lines: [
      { a: [0, -15], b: [0, 8], thickness: 6, color: [1, 1, 1] },
      { a: [10, 0], b: [-2, 12], thickness: 6, color: [1, 1, 1] },
      { a: [-10, 0], b: [2, 12], thickness: 6, color: [1, 1, 1] }
    ],
    color: GlobalKeyboardManager.isPressed('ArrowUp')
      ? activatedColor
      : defaultColor
  });

  // right
  allIndicator.push({
    center: [indicator2[0] + 45 * 2, indicator2[1]],
    size: [40, 40],
    lines: [
      { a: [-15, 0], b: [8, 0], thickness: 6, color: [1, 1, 1] },
      { a: [0, 10], b: [12, -2], thickness: 6, color: [1, 1, 1] },
      { a: [0, -10], b: [12, 2], thickness: 6, color: [1, 1, 1] }
    ],
    color: GlobalKeyboardManager.isPressed('ArrowRight')
      ? activatedColor
      : defaultColor
  });

  if (GlobalTouchManager.isSupported()) {
    allIndicator.push({
      center: [120 + 140 * 1, 35],
      size: [230, 60],
      text: 'Touch Events\nSupported\n(double tap)',
      color: [0, 0.5, 0]
    });
  } else {
    allIndicator.push({
      center: [120 + 140 * 1, 35],
      size: [230, 60],
      text: 'Touch Events\nNot Supported',
      color: [0.5, 0, 0]
    });
  }

  if (GlobalPointerLockManager.canBePointerLocked(canvasElement)) {
    allIndicator.push({
      center: [350 + 140 * 1, 35],
      size: [210, 60],
      text: 'Mouse\nSupported',
      color: [0, 0.5, 0]
    });
  } else {
    allIndicator.push({
      center: [350 + 140 * 1, 35],
      size: [210, 60],
      text: 'Mouse Events\nNot Supported',
      color: [0.5, 0, 0]
    });
  }

  allIndicator.forEach((currIndicator) => {
    const { center } = currIndicator;

    stackRenderers.pushCenteredRectangle(
      glm.vec3.fromValues(center[0], center[1], -0.3),
      currIndicator.size,
      [0, 0, 0]
    );

    stackRenderers.pushCenteredRectangle(
      glm.vec3.fromValues(center[0], center[1], -0.2),
      [currIndicator.size[0] - 2, currIndicator.size[1] - 2],
      currIndicator.color
    );

    if (currIndicator.text) {
      textRenderer.pushCenteredText(
        currIndicator.text,
        center,
        16
      );
    }

    if (currIndicator.lines) {
      currIndicator.lines.forEach((currLine) => {
        stackRenderers.pushThickLine(
          [center[0] + currLine.a[0], center[1] + currLine.a[1], 0],
          [center[0] + currLine.b[0], center[1] + currLine.b[1], 0],
          currLine.thickness,
          currLine.color
        );
      });
    }
  });
} // help text
