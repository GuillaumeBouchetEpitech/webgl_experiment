import * as browser from '../../../system/browser';
import * as renderers from '../../../graphics/renderers';

import * as glm from 'gl-matrix';

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

const _renderIndicator = (
  currIndicator: Indicator,
  stackRenderers: renderers.IStackRenderers,
  textRenderer: renderers.ITextRenderer
) => {
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
};

export const addKeyStrokesWidgets = (
  inPos: glm.ReadonlyVec2,
  stackRenderers: renderers.IStackRenderers,
  textRenderer: renderers.ITextRenderer
) => {
  _renderIndicator(
    {
      center: [inPos[0], inPos[1]],
      size: [40, 40],
      text: 'A\nQ',
      color: browser.GlobalKeyboardManager.isPressed('A', 'Q')
        ? activatedColor
        : defaultColor
    },
    stackRenderers,
    textRenderer
  );

  _renderIndicator(
    {
      center: [inPos[0] + 45 * 1, inPos[1]],
      size: [40, 40],
      text: 'S',
      color: browser.GlobalKeyboardManager.isPressed('S')
        ? activatedColor
        : defaultColor
    },
    stackRenderers,
    textRenderer
  );

  _renderIndicator(
    {
      center: [inPos[0] + 45 * 1, inPos[1] + 45],
      size: [40, 40],
      text: 'W\nZ',
      color: browser.GlobalKeyboardManager.isPressed('W', 'Z')
        ? activatedColor
        : defaultColor
    },
    stackRenderers,
    textRenderer
  );

  _renderIndicator(
    {
      center: [inPos[0] + 45 * 2, inPos[1]],
      size: [40, 40],
      text: 'D',
      color: browser.GlobalKeyboardManager.isPressed('D')
        ? activatedColor
        : defaultColor
    },
    stackRenderers,
    textRenderer
  );
};

export const addArrowStrokesWidgets = (
  inPos: glm.ReadonlyVec2,
  stackRenderers: renderers.IStackRenderers,
  textRenderer: renderers.ITextRenderer
) => {
  // arrow left
  _renderIndicator(
    {
      center: [inPos[0], inPos[1]],
      size: [40, 40],
      lines: [
        { a: [15, 0], b: [-8, 0], thickness: 6, color: [1, 1, 1] },
        { a: [0, 10], b: [-12, -2], thickness: 6, color: [1, 1, 1] },
        { a: [0, -10], b: [-12, 2], thickness: 6, color: [1, 1, 1] }
      ],
      color: browser.GlobalKeyboardManager.isPressed('ArrowLeft')
        ? activatedColor
        : defaultColor
    },
    stackRenderers,
    textRenderer
  );

  // arrow down
  _renderIndicator(
    {
      center: [inPos[0] + 45, inPos[1]],
      size: [40, 40],
      lines: [
        { a: [0, 15], b: [0, -8], thickness: 6, color: [1, 1, 1] },
        { a: [10, 0], b: [-2, -12], thickness: 6, color: [1, 1, 1] },
        { a: [-10, 0], b: [2, -12], thickness: 6, color: [1, 1, 1] }
      ],
      color: browser.GlobalKeyboardManager.isPressed('ArrowDown')
        ? activatedColor
        : defaultColor
    },
    stackRenderers,
    textRenderer
  );

  // arrow up
  _renderIndicator(
    {
      center: [inPos[0] + 45, inPos[1] + 45],
      size: [40, 40],
      lines: [
        { a: [0, -15], b: [0, 8], thickness: 6, color: [1, 1, 1] },
        { a: [10, 0], b: [-2, 12], thickness: 6, color: [1, 1, 1] },
        { a: [-10, 0], b: [2, 12], thickness: 6, color: [1, 1, 1] }
      ],
      color: browser.GlobalKeyboardManager.isPressed('ArrowUp')
        ? activatedColor
        : defaultColor
    },
    stackRenderers,
    textRenderer
  );

  // arrow right
  _renderIndicator(
    {
      center: [inPos[0] + 45 * 2, inPos[1]],
      size: [40, 40],
      lines: [
        { a: [-15, 0], b: [8, 0], thickness: 6, color: [1, 1, 1] },
        { a: [0, 10], b: [12, -2], thickness: 6, color: [1, 1, 1] },
        { a: [0, -10], b: [12, 2], thickness: 6, color: [1, 1, 1] }
      ],
      color: browser.GlobalKeyboardManager.isPressed('ArrowRight')
        ? activatedColor
        : defaultColor
    },
    stackRenderers,
    textRenderer
  );
};

export const addKeysTouchesWidgets = (
  inCanvasElement: HTMLCanvasElement,
  inPos: glm.ReadonlyVec2,
  stackRenderers: renderers.IStackRenderers,
  textRenderer: renderers.ITextRenderer
) => {
  if (browser.GlobalTouchManager.isSupported(inCanvasElement)) {
    _renderIndicator(
      {
        center: [inPos[0] + 115, inPos[1]],
        size: [230, 60],
        text: 'Touch Events\nSupported\n(double tap)',
        color: [0, 0.5, 0]
      },
      stackRenderers,
      textRenderer
    );
  } else {
    _renderIndicator(
      {
        center: [inPos[0] + 115, inPos[1]],
        size: [230, 60],
        text: 'Touch Events\nNot Supported',
        color: [0.5, 0, 0]
      },
      stackRenderers,
      textRenderer
    );
  }

  if (browser.GlobalPointerLockManager.canBePointerLocked(inCanvasElement)) {
    _renderIndicator(
      {
        center: [inPos[0] + 105, inPos[1] + 70],
        size: [210, 60],
        text: 'Mouse\nSupported',
        color: [0, 0.5, 0]
      },
      stackRenderers,
      textRenderer
    );
  } else {
    _renderIndicator(
      {
        center: [inPos[0] + 105, inPos[1] + 70],
        size: [210, 60],
        text: 'Mouse Events\nNot Supported',
        color: [0.5, 0, 0]
      },
      stackRenderers,
      textRenderer
    );
  }
};

// export const renderControls = (
//   inCanvasElement: HTMLCanvasElement,
//   stackRenderers: renderers.IStackRenderers,
//   textRenderer: renderers.ITextRenderer
// ) => {
//   // const allIndicator: Indicator[] = [];

//   const keyEventsPos: glm.ReadonlyVec2 = [7 + 20, 165];
//   const touchEventsPos: glm.ReadonlyVec2 = [7 + 20, 260];
//   const boardPos: glm.ReadonlyVec2 = [7, 35];

//   addKeyStrokesWidgets(keyEventsPos, stackRenderers, textRenderer);
//   addArrowStrokesWidgets(touchEventsPos, stackRenderers, textRenderer);
//   addKeysTouchesWidgets(inCanvasElement, boardPos, stackRenderers, textRenderer);
// };
