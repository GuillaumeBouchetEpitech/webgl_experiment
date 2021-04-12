
"use strict"

import * as glm from 'gl-matrix';

import { KeyboardHandler, keyCodes } from './helpers/KeyboardHandler';
import PointerLockSetup from './helpers/PointerLockSetup';

enum Directions {
    forward     = (1 << 0),
    backward    = (1 << 1),
    left        = (1 << 2),
    right       = (1 << 3),
};

interface IDefinition {
    targetElement: HTMLElement;
    movingSpeed: number;
    mouseSensivity: number;
    keyboardSensivity: number;
};

class FreeFlyCamera {

    private _movingSpeed: number;
    private _mouseSensivity: number;
    private _keyboardSensivity: number;

    private _phi: number = 0;
    private _theta: number = 0;
    private _forward: [number, number, number] = [1,0,0];
    private _left: [number, number, number] = [0,0,0];
    private _position: [number, number, number] = [0,0,0];
    private _target: [number, number, number] = [0,0,0];
    private _movementFlag: number = 0;
    private _keyboardHandler = new KeyboardHandler();
    private _forceForward = false;

    private _timeImmobile: number = 0;
    private _lastTime: number = 0;

    constructor(def: IDefinition) {

        this._movingSpeed = def.movingSpeed;
        this._mouseSensivity = def.mouseSensivity;
        this._keyboardSensivity = def.keyboardSensivity;

        this._lastTime = Date.now();

        ///
        /// MOUSE
        ///

        const mouseMoveCallback = (event: MouseEvent) => {

            const movementX: number = event.movementX || (event as any).mozMovementX || (event as any).webkitMovementX || 0;
            const movementY: number = event.movementY || (event as any).mozMovementY || (event as any).webkitMovementY || 0;

            this._theta -= movementX * this._mouseSensivity;
            this._phi   -= movementY * this._mouseSensivity;

            this._timeImmobile = 0;
        };

        const mouseLockedCallback = () => {
            def.targetElement.addEventListener('mousemove', mouseMoveCallback, false);
        };

        const mouseUnlockedCallback = () => {
            def.targetElement.removeEventListener('mousemove', mouseMoveCallback, false);
        };

        //

        PointerLockSetup({
            targetElement: def.targetElement,
            enabledCallback: mouseLockedCallback,
            disabledCallback: mouseUnlockedCallback
        });

        ///
        /// /MOUSE
        ///



        ///
        /// TOUCH
        ///

        let previous_touch: Touch|null = null;
        let previous_distance: number|null = null;
        let saved_time: number = Date.now();

        def.targetElement.addEventListener('touchstart', (event: TouchEvent) => {

            event.preventDefault();

            previous_touch = null;
            previous_distance = null;

            //
            //
            // double tap detection (0.25sec) -> force forward movement

            const current_time = Date.now();

            if (// only one touch live
                event.targetTouches.length == 1 &&
                // second tap must happen before 0.25sec
                (current_time - saved_time) < 250) {

                this._forceForward = true;
            }

            saved_time = current_time;
        });

        def.targetElement.addEventListener('touchend', (event: TouchEvent) => {

            event.preventDefault();

            previous_touch = null;
            previous_distance = null;

            this._forceForward = false;
        });

        def.targetElement.addEventListener('touchmove', (event: TouchEvent) => {

            event.preventDefault();

            const touches = event.targetTouches;

            if (touches.length == 0 || touches.length > 2)
                return;

            if (touches.length == 2) {

                const x1 = touches[0].pageX-touches[1].pageX;
                const y1 = touches[0].pageY-touches[1].pageY;

                const length = Math.sqrt(x1*x1 + y1*y1);

                if (previous_distance) {

                    if (length > previous_distance) {
                        this._movementFlag |= Directions.forward;
                    }
                    else {
                        this._movementFlag |= Directions.backward;
                    }
                }

                previous_distance = length;
            }
            else {

                if (previous_touch) {

                    const step_x = previous_touch.pageX - touches[0].pageX;
                    const step_y = previous_touch.pageY - touches[0].pageY;
                    this._theta -= (step_x / 3.0);
                    this._phi   -= (step_y / 3.0);
                }

                previous_touch = touches[0];
            }

            this._timeImmobile = 0;
        });

        ///
        /// /TOUCH
        ///

    }

    update(elapsedTime: number) {

        this._handleKeys(elapsedTime);


        const current_time = Date.now();

        this._timeImmobile += elapsedTime;

        // if not update for more than 3 seconds -> jump to 10sec of immobile time
        if ((current_time - this._lastTime) > 3000)
            this._timeImmobile = 10;

        this._lastTime = current_time;


        if (this._forceForward)
            this._timeImmobile = 0;


        if (this._movementFlag & Directions.forward || this._forceForward == true) {
            for (let ii = 0; ii < 3; ++ii)
                this._position[ii] += this._forward[ii] * elapsedTime * this._movingSpeed;
        }
        else if (this._movementFlag & Directions.backward) {
            for (let ii = 0; ii < 3; ++ii)
                this._position[ii] -= this._forward[ii] * elapsedTime * this._movingSpeed;
        }


        if (this._movementFlag & Directions.left) {
            for (let ii = 0; ii < 3; ++ii)
                this._position[ii] -= this._left[ii] * elapsedTime * this._movingSpeed;
        }
        else if (this._movementFlag & Directions.right) {
            for (let ii = 0; ii < 3; ++ii)
                this._position[ii] += this._left[ii] * elapsedTime * this._movingSpeed;
        }

        this._movementFlag = 0;



        const verticalLimit = 89;

        this._phi = Math.min(Math.max(this._phi, -verticalLimit), +verticalLimit)

        const Up = [0,0,1];

        const upRadius = Math.cos((this._phi - 90) * 3.14 / 180);
        Up[2] = Math.sin( (this._phi - 90) * 3.14 / 180);
        Up[0] = upRadius * Math.cos(this._theta * 3.14 / 180);
        Up[1] = upRadius * Math.sin(this._theta * 3.14 / 180);

        const forwardRadius = Math.cos(this._phi * 3.14 / 180);
        this._forward[2] = Math.sin(this._phi * 3.14 / 180);
        this._forward[0] = forwardRadius * Math.cos(this._theta * 3.14 / 180);
        this._forward[1] = forwardRadius * Math.sin(this._theta * 3.14 / 180);

        this._left[0] = Up[1] * this._forward[2] - Up[2] * this._forward[1];
        this._left[1] = Up[2] * this._forward[0] - Up[0] * this._forward[2];
        this._left[2] = Up[0] * this._forward[1] - Up[1] * this._forward[0];

        this._target[0] = this._position[0] + this._forward[0];
        this._target[1] = this._position[1] + this._forward[1];
        this._target[2] = this._position[2] + this._forward[2];
    }

    updateViewMatrix(viewMatrix: glm.mat4) {

        glm.mat4.lookAt(
            viewMatrix,
            [this._position[0], this._position[1], this._position[2]],
            [this._target[0], this._target[1], this._target[2]],
            [0,0,1]
        );
    }

    setPosition(x: number, y: number, z: number) {
        this._position[0] = x;
        this._position[1] = y;
        this._position[2] = z;
    }

    getPosition(): [number, number, number] {
        return [
            this._position[0],
            this._position[1],
            this._position[2],
        ];
    }

    getTheta(): number {
        return this._theta;
    }

    getPhi(): number {
        return this._phi;
    }

    getForceForward() {
        return this._forceForward;
    }

    getTimeImmobile() {
        return this._timeImmobile;
    }

    ///
    ///
    ///
    /// KEYBOARD

    activate() {

        this._keyboardHandler.activate();
    }

    deactivate() {

        this._keyboardHandler.deactivate();
    }

    private _handleKeys(elapsedTime: number) {

        const oldMovementFlag = this._movementFlag;
        const oldPhi = this._phi;
        const oldTheta = this._theta;

        // forward
        if (this._keyboardHandler.isPressed( keyCodes.KEY_Z ) ||
            this._keyboardHandler.isPressed( keyCodes.KEY_W )) {

            this._movementFlag |= Directions.forward;
        }

        // backward
        if (this._keyboardHandler.isPressed( keyCodes.KEY_S )) {

            this._movementFlag |= Directions.backward;
        }

        // strafe left
        if (this._keyboardHandler.isPressed( keyCodes.KEY_A ) ||
            this._keyboardHandler.isPressed( keyCodes.KEY_Q )) {

            this._movementFlag |= Directions.left;
        }

        // strafe right
        if (this._keyboardHandler.isPressed( keyCodes.KEY_D )) {

            this._movementFlag |= Directions.right;
        }

        /// /// ///

        // look up
        if (this._keyboardHandler.isPressed( keyCodes.ARROW_UP )) {
            this._phi += this._keyboardSensivity * elapsedTime;
        }

        // look down
        if (this._keyboardHandler.isPressed( keyCodes.ARROW_DOWN )) {
            this._phi -= this._keyboardSensivity * elapsedTime;
        }

        // look left
        if (this._keyboardHandler.isPressed( keyCodes.ARROW_LEFT )) {
            this._theta += this._keyboardSensivity * elapsedTime;
        }

        // look right
        if (this._keyboardHandler.isPressed( keyCodes.ARROW_RIGHT )) {
            this._theta -= this._keyboardSensivity * elapsedTime;
        }

        if (oldMovementFlag != this._movementFlag ||
            oldPhi != this._phi ||
            oldTheta != this._theta) {

            this._timeImmobile = 0;
        }
    }

    /// KEYBOARD
    ///
    ///
    ///
};

export default FreeFlyCamera;
