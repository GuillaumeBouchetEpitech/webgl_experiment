import { GlobalKeyboardManager, GlobalMouseManager, GlobalTouchManager } from '../browser';

import { deg2Rad } from '../math/angles';

import * as glm from 'gl-matrix';

const AllAxises = {
  X: 0,
  Y: 1,
  Z: 2
};
type AxisType = keyof typeof AllAxises;
type Coordinates = [AxisType, AxisType, AxisType];

interface IFreeFlyControllerDef {
  position: glm.vec3;
  coordinates?: Coordinates;
  theta: number;
  phi: number;
  mouseSensibility: number;
  keyboardSensibility: number;
  touchSensibility: number;
  movingSpeed: number;
}

export class FreeFlyController {
  private _isActivated: boolean = false;
  private _theta: number = 0;
  private _phi: number = 0;

  private _mouseSensibility: number;
  private _keyboardSensibility: number;
  private _touchSensibility: number;
  private _movingSpeed: number;

  private _touchWasActive: boolean = false;
  private _touchStartTime: number = 0;
  private _touchMoveForward: boolean = false;

  private _axisIndices: [number, number, number];

  private _position = glm.vec3.fromValues(0, 0, 0);
  private _target = glm.vec3.fromValues(0, 0, 0);
  private _forwardAxis = glm.vec3.fromValues(1, 0, 0);
  private _leftAxis = glm.vec3.fromValues(0, 0, 1);
  private _upAxis = glm.vec3.fromValues(0, 1, 0);

  private _move_forwardAxis = glm.vec3.fromValues(1, 0, 0);
  private _move_leftAxis = glm.vec3.fromValues(0, 0, 1);
  private _move_upAxis = glm.vec3.fromValues(0, 1, 0);

  constructor(def: IFreeFlyControllerDef) {
    this._mouseSensibility = def.mouseSensibility;
    this._keyboardSensibility = def.keyboardSensibility;
    this._touchSensibility = def.touchSensibility;
    this._movingSpeed = def.movingSpeed;
    glm.vec3.copy(this._position, def.position);

    this._axisIndices = [
      def.coordinates ? AllAxises[def.coordinates[0]] : AllAxises.X,
      def.coordinates ? AllAxises[def.coordinates[1]] : AllAxises.Y,
      def.coordinates ? AllAxises[def.coordinates[2]] : AllAxises.Z
    ];

    this._theta = def.theta;
    this._phi = def.phi;
  }

  isActivated() {
    return this._isActivated;
  }

  activate() {
    this._isActivated = true;

    GlobalKeyboardManager.preventDefault('Z');
    GlobalKeyboardManager.preventDefault('W');
    GlobalKeyboardManager.preventDefault('S');
    GlobalKeyboardManager.preventDefault('A');
    GlobalKeyboardManager.preventDefault('Q');
    GlobalKeyboardManager.preventDefault('D');

    GlobalKeyboardManager.preventDefault('Shift');
    GlobalKeyboardManager.preventDefault('C');
    GlobalKeyboardManager.preventDefault('Space');

    GlobalKeyboardManager.preventDefault('ArrowUp');
    GlobalKeyboardManager.preventDefault('ArrowDown');
    GlobalKeyboardManager.preventDefault('ArrowLeft');
    GlobalKeyboardManager.preventDefault('ArrowRight');
  }

  deactivate() {
    this._isActivated = false;

    GlobalKeyboardManager.enableDefault('Z');
    GlobalKeyboardManager.enableDefault('W');
    GlobalKeyboardManager.enableDefault('S');
    GlobalKeyboardManager.enableDefault('A');
    GlobalKeyboardManager.enableDefault('Q');
    GlobalKeyboardManager.enableDefault('D');

    GlobalKeyboardManager.enableDefault('Shift');
    GlobalKeyboardManager.enableDefault('C');
    GlobalKeyboardManager.enableDefault('Space');

    GlobalKeyboardManager.enableDefault('ArrowUp');
    GlobalKeyboardManager.enableDefault('ArrowDown');
    GlobalKeyboardManager.enableDefault('ArrowLeft');
    GlobalKeyboardManager.enableDefault('ArrowRight');
  }

  isInteractedWith() {
    return (
      GlobalKeyboardManager.isPressed('Z', 'W', 'S', 'A', 'Q', 'D') ||
      GlobalKeyboardManager.isPressed('Shift', 'C', 'Space') ||
      GlobalKeyboardManager.isPressed('ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight')
    );
  }

  update(deltaMsTime: number, fpsControls: boolean = false) {
    let moveForward = false;
    let moveBackward = false;
    let strafeLeft = false;
    let strafeRight = false;
    let isRunning = false;
    let isDiving = false;
    let isRising = false;
    let lookDeltaX = 0;
    let lookDeltaY = 0;

    //
    // mouse
    //

    {
      const deltaX = GlobalMouseManager.deltaX() * this._mouseSensibility;
      const deltaY = GlobalMouseManager.deltaY() * this._mouseSensibility;

      lookDeltaX -= deg2Rad(deltaX) * deltaMsTime;
      lookDeltaY -= deg2Rad(deltaY) * deltaMsTime;
    }

    //
    // mouse
    //

    //
    // touch
    //

    const isTouched = GlobalTouchManager.getTouchData().length > 0;

    if (isTouched) {
      if (!this._touchWasActive) {
        const currTime = Date.now();
        const elapsed = (currTime - this._touchStartTime) / 1000;
        if (elapsed < 0.25) {
          this._touchMoveForward = true;
        } else {
          this._touchStartTime = currTime;
        }
      }

      const firstTouch = GlobalTouchManager.getTouchData()[0];

      const deltaX = firstTouch.deltaX * this._touchSensibility;
      const deltaY = firstTouch.deltaY * this._touchSensibility;

      lookDeltaX -= deg2Rad(deltaX) * deltaMsTime;
      lookDeltaY -= deg2Rad(deltaY) * deltaMsTime;
    } else {
      this._touchMoveForward = false;
    }

    this._touchWasActive = isTouched;

    if (this._touchMoveForward) {
      moveForward = true;
    }

    //
    // touch
    //

    //
    // keyboard
    //

    // forward
    if (GlobalKeyboardManager.isPressed('Z', 'W')) {
      moveForward = true;
    }

    // backward
    if (GlobalKeyboardManager.isPressed('S')) {
      moveBackward = true;
    }

    // strafe left
    if (GlobalKeyboardManager.isPressed('A', 'Q')) {
      strafeLeft = true;
    }

    // strafe right
    if (GlobalKeyboardManager.isPressed('D')) {
      strafeRight = true;
    }

    // run
    if (GlobalKeyboardManager.isPressed('Shift')) {
      isRunning = true;
    }

    if (!fpsControls) {
      // dive
      if (GlobalKeyboardManager.isPressed('C')) {
        isDiving = true;
      }

      // rise
      if (GlobalKeyboardManager.isPressed('Space')) {
        isRising = true;
      }
    }

    const currentLinearSpeed = this._movingSpeed * (isRunning ? 4 : 1) * deltaMsTime;

    //
    //

    const currentAngularSpeed = this._keyboardSensibility * deltaMsTime;

    if (GlobalKeyboardManager.isPressed('ArrowUp')) {
      lookDeltaY += currentAngularSpeed;
    } else if (GlobalKeyboardManager.isPressed('ArrowDown')) {
      lookDeltaY -= currentAngularSpeed;
    }

    if (GlobalKeyboardManager.isPressed('ArrowLeft')) {
      lookDeltaX += currentAngularSpeed;
    } else if (GlobalKeyboardManager.isPressed('ArrowRight')) {
      lookDeltaX -= currentAngularSpeed;
    }

    //
    // keyboard
    //

    //
    // internals
    //

    this._theta += lookDeltaX;
    this._phi += lookDeltaY;

    const hPi = Math.PI * 0.5;
    const verticalLimit = hPi * 0.95;

    this._phi = Math.min(Math.max(this._phi, -verticalLimit), +verticalLimit);

    const cosTheta = Math.cos(this._theta);
    const sinTheta = Math.sin(this._theta);

    const [axisX, axisY, axisZ] = this._axisIndices;

    const upRadius = Math.cos(this._phi + hPi);
    this._upAxis[axisX] = upRadius * cosTheta;
    this._upAxis[axisY] = upRadius * sinTheta;
    this._upAxis[axisZ] = Math.sin(this._phi + hPi);

    const forwardRadius = Math.cos(this._phi);
    this._forwardAxis[axisX] = forwardRadius * cosTheta;
    this._forwardAxis[axisY] = forwardRadius * sinTheta;
    this._forwardAxis[axisZ] = Math.sin(this._phi);

    glm.vec3.cross(this._leftAxis, this._upAxis, this._forwardAxis);

    if (fpsControls) {
      this._move_forwardAxis[axisX] = cosTheta;
      this._move_forwardAxis[axisY] = sinTheta;
      this._move_forwardAxis[axisZ] = 0;

      this._move_leftAxis[axisX] = -sinTheta;
      this._move_leftAxis[axisY] = cosTheta;
      this._move_leftAxis[axisZ] = 0;

      this._move_upAxis[axisX] = 0;
      this._move_upAxis[axisY] = 0;
      this._move_upAxis[axisZ] = 1;
    } else {
      glm.vec3.copy(this._move_forwardAxis, this._forwardAxis);
      glm.vec3.copy(this._move_leftAxis, this._leftAxis);
      glm.vec3.copy(this._move_upAxis, this._upAxis);
    }

    //
    //
    //

    const scaledForward = glm.vec3.fromValues(0, 0, 0);
    glm.vec3.scale(scaledForward, this._move_forwardAxis, currentLinearSpeed);
    const scaledLeft = glm.vec3.fromValues(0, 0, 0);
    glm.vec3.scale(scaledLeft, this._move_leftAxis, currentLinearSpeed);
    const scaledUp = glm.vec3.fromValues(0, 0, 0);
    glm.vec3.scale(scaledUp, this._move_upAxis, currentLinearSpeed);

    //
    //
    //

    if (moveForward) {
      glm.vec3.add(this._position, this._position, scaledForward);
    } else if (moveBackward) {
      glm.vec3.sub(this._position, this._position, scaledForward);
    }

    if (strafeLeft) {
      glm.vec3.add(this._position, this._position, scaledLeft);
    } else if (strafeRight) {
      glm.vec3.sub(this._position, this._position, scaledLeft);
    }

    if (isRising) {
      glm.vec3.add(this._position, this._position, scaledUp);
    } else if (isDiving) {
      glm.vec3.sub(this._position, this._position, scaledUp);
    }

    glm.vec3.add(this._target, this._position, this._forwardAxis);

    //
    // internals
    //
  }

  getPosition(): glm.ReadonlyVec3 {
    return this._position;
  }

  setPosition(inPos: glm.ReadonlyVec3) {
    glm.vec3.copy(this._position, inPos);
    glm.vec3.add(this._target, this._position, this._forwardAxis);
  }

  getTarget(): glm.ReadonlyVec3 {
    return this._target;
  }

  getUpAxis(): glm.ReadonlyVec3 {
    return this._upAxis;
  }

  getTheta(): number {
    return this._theta;
  }

  getPhi(): number {
    return this._phi;
  }

  getTouchMoveForward(): boolean {
    return this._touchMoveForward;
  }
}
