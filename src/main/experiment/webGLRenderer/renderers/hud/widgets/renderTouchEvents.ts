import { GlobalTouchManager } from '../../../../inputManagers';

import { IStackRenderers } from '../stackRenderers/StackRenderers';

import * as glm from 'gl-matrix';

const _touchesAngleMap = new Map<number, number>();

export const renderTouchEvents = (
  viewportSize: glm.ReadonlyVec2,
  stackRenderers: IStackRenderers,
  isMovingForward: boolean
) => {
  // touches

  const allTouchData = GlobalTouchManager.getTouchData();

  if (allTouchData.length === 0) {
    _touchesAngleMap.clear();
  } else {
    const latestTouchIds = new Set<number>();

    const redColor: glm.ReadonlyVec3 = [1, 0, 0];
    const greenColor: glm.ReadonlyVec3 = [0, 1, 0];
    const color = allTouchData.length > 1 ? redColor : greenColor;

    allTouchData.forEach((currTouch) => {
      latestTouchIds.add(currTouch.id);

      // get or set
      let angle = _touchesAngleMap.get(currTouch.id);
      if (angle === undefined) {
        angle = 0;
        _touchesAngleMap.set(currTouch.id, angle);
      }

      const angles = [0.0, 0.5];
      if (isMovingForward) angles.push(0.25, 0.75);

      for (const offsetAngle of angles) {
        const finalAngle = angle + offsetAngle * Math.PI;

        const position: glm.ReadonlyVec3 = [
          currTouch.positionX,
          viewportSize[1] - currTouch.positionY,
          0
        ];

        stackRenderers.pushRotatedLine(position, finalAngle, 150, 15, color);
      }

      // update the angle
      angle += 0.1;
      _touchesAngleMap.set(currTouch.id, angle);
    });

    const idNotInUse = new Set<number>();

    _touchesAngleMap.forEach((value, key) => {
      if (!latestTouchIds.has(key)) idNotInUse.add(key);
    });

    idNotInUse.forEach((value) => {
      _touchesAngleMap.delete(value);
    });
  }
}; // touches
