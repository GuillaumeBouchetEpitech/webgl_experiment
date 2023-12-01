import { system } from '@local-framework';

import { IStackRenderers } from '../stack-renderers/StackRenderers';
import { ITextRenderer } from '../text-renderer/TextRenderer';

import * as glm from 'gl-matrix';

const { GlobalKeyboardManager, GlobalTouchManager, GlobalPointerLockManager } =
  system.browser;

interface Indicator {
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
}

const defaultColor: glm.ReadonlyVec3 = [0.2, 0.2, 0.2];
const activatedColor: glm.ReadonlyVec3 = [0.2, 0.6, 0.2];

const _addKeyStrokesWidgets = (
  inAllIndicator: Indicator[],
  inPos: glm.ReadonlyVec2
) => {
  inAllIndicator.push({
    center: [inPos[0], inPos[1]],
    size: [40, 40],
    text: 'A\nQ',
    color: GlobalKeyboardManager.isPressed('A', 'Q')
      ? activatedColor
      : defaultColor
  });

  inAllIndicator.push({
    center: [inPos[0] + 45 * 1, inPos[1]],
    size: [40, 40],
    text: 'S',
    color: GlobalKeyboardManager.isPressed('S') ? activatedColor : defaultColor
  });

  inAllIndicator.push({
    center: [inPos[0] + 45 * 1, inPos[1] + 45],
    size: [40, 40],
    text: 'W\nZ',
    color: GlobalKeyboardManager.isPressed('W', 'Z')
      ? activatedColor
      : defaultColor
  });

  inAllIndicator.push({
    center: [inPos[0] + 45 * 2, inPos[1]],
    size: [40, 40],
    text: 'D',
    color: GlobalKeyboardManager.isPressed('D') ? activatedColor : defaultColor
  });
};

const _addArrowStrokesWidgets = (
  inAllIndicator: Indicator[],
  inPos: glm.ReadonlyVec2
) => {
  // arrow left
  inAllIndicator.push({
    center: [inPos[0], inPos[1]],
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

  // arrow down
  inAllIndicator.push({
    center: [inPos[0] + 45, inPos[1]],
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

  // arrow up
  inAllIndicator.push({
    center: [inPos[0] + 45, inPos[1] + 45],
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

  // arrow right
  inAllIndicator.push({
    center: [inPos[0] + 45 * 2, inPos[1]],
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
};

const _addKeysTouchesWidgets = (
  inAllIndicator: Indicator[],
  inCanvasElement: HTMLCanvasElement,
  inPos: glm.ReadonlyVec2
) => {
  if (GlobalTouchManager.isSupported(inCanvasElement)) {
    inAllIndicator.push({
      center: [inPos[0] + 115, inPos[1]],
      size: [230, 60],
      text: 'Touch Events\nSupported\n(double tap)',
      color: [0, 0.5, 0]
    });
  } else {
    inAllIndicator.push({
      center: [inPos[0] + 115, inPos[1]],
      size: [230, 60],
      text: 'Touch Events\nNot Supported',
      color: [0.5, 0, 0]
    });
  }

  if (GlobalPointerLockManager.canBePointerLocked(inCanvasElement)) {
    inAllIndicator.push({
      center: [inPos[0] + 105, inPos[1] + 70],
      size: [210, 60],
      text: 'Mouse\nSupported',
      color: [0, 0.5, 0]
    });
  } else {
    inAllIndicator.push({
      center: [inPos[0] + 105, inPos[1] + 70],
      size: [210, 60],
      text: 'Mouse Events\nNot Supported',
      color: [0.5, 0, 0]
    });
  }
};

export const renderControls = (
  inCanvasElement: HTMLCanvasElement,
  stackRenderers: IStackRenderers,
  textRenderer: ITextRenderer
) => {
  const allIndicator: Indicator[] = [];

  const keyEventsPos: glm.ReadonlyVec2 = [7 + 20, 165];
  const touchEventsPos: glm.ReadonlyVec2 = [7 + 20, 260];
  const boardPos: glm.ReadonlyVec2 = [7, 35];

  _addKeyStrokesWidgets(allIndicator, keyEventsPos);
  _addArrowStrokesWidgets(allIndicator, touchEventsPos);
  _addKeysTouchesWidgets(allIndicator, inCanvasElement, boardPos);

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
      textRenderer
        .setTextScale(16)
        .setTextAlign('centered', 'centered')
        .pushText(currIndicator.text, center)
        .setTextAlign('left', 'top');
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
};
