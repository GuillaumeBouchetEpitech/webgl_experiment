
"use strict"

import * as glm from 'gl-matrix';

import { KeyboardHandler, keyCodes } from './helpers/KeyboardHandler';
import PointerLockSetup from './helpers/PointerLockSetup';

class FreeFlyCamera {

    private _phi: number = 0;
    private _theta: number = 0;
    private _forward: [number, number, number] = [1,0,0];
    private _left: [number, number, number] = [0,0,0];
    private _position: [number, number, number] = [0,0,0];
    private _target: [number, number, number] = [0,0,0];
    private _movement_flag: number = 0;
    private _keyboard_handler = new KeyboardHandler();
    private _force_forward = false;

    private _time_immobile: number = 0;
    private _last_time: number = 0;

    constructor(main_element: HTMLElement) {

        this._last_time = Date.now();

        ///
        /// MOUSE
        ///

        const callback_mousemove = (event: MouseEvent) => {

            const movementX = event.movementX || (event as any).mozMovementX || (event as any).webkitMovementX || 0;
            const movementY = event.movementY || (event as any).mozMovementY || (event as any).webkitMovementY || 0;

            // console.log('Mouse movement: ' + movementX + ',' + movementY);

            this._theta -= movementX / 5.0;
            this._phi   -= movementY / 5.0;

            this._time_immobile = 0;
        };

        const callback_mouse_locked = () => {
            main_element.addEventListener('mousemove', callback_mousemove, false);
        };

        const callback_mouse_unlocked = () => {
            main_element.removeEventListener('mousemove', callback_mousemove, false);
        };

        //

        PointerLockSetup({
            target_element: main_element,
            cb_enabled: callback_mouse_locked,
            cb_disabled: callback_mouse_unlocked
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

        main_element.addEventListener('touchstart', (event: TouchEvent) => {

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

                this._force_forward = true;
            }

            saved_time = current_time;
        });

        main_element.addEventListener('touchend', (event: TouchEvent) => {

            event.preventDefault();

            previous_touch = null;
            previous_distance = null;

            this._force_forward = false;
        });

        main_element.addEventListener('touchmove', (event: TouchEvent) => {

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
                        this._movement_flag |= 1<<0; // forward
                    }
                    else {
                        this._movement_flag |= 1<<1; // backward
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

            this._time_immobile = 0;
        });

        ///
        /// /TOUCH
        ///

    }

    update(elapsed_sec: number) {

        this.handleKeys();


        const current_time = Date.now();

        this._time_immobile += elapsed_sec;

        // if not update for more than 3 seconds -> jump to 10sec of immobile time
        if ((current_time - this._last_time) > 3000)
            this._time_immobile = 10;

        this._last_time = current_time;


        if (this._force_forward)
            this._time_immobile = 0;


        const speed = 16;

        if (this._movement_flag & 1<<0 || this._force_forward == true) {
            for (let ii = 0; ii < 3; ++ii)
                this._position[ii] += this._forward[ii] * elapsed_sec * speed;
        }
        else if (this._movement_flag & 1<<1) {
            for (let ii = 0; ii < 3; ++ii)
                this._position[ii] -= this._forward[ii] * elapsed_sec * speed;
        }


        if (this._movement_flag & 1<<2) {
            for (let ii = 0; ii < 3; ++ii)
                this._position[ii] -= this._left[ii] * elapsed_sec * speed;
        }
        else if (this._movement_flag & 1<<3) {
            for (let ii = 0; ii < 3; ++ii)
                this._position[ii] += this._left[ii] * elapsed_sec * speed;
        }

        this._movement_flag = 0;



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
        return this._force_forward;
    }

    getTimeImmobile() {
        return this._time_immobile;
    }

    ///
    ///
    ///
    /// KEYBOARD

    handleKeys() {

        // forward
        if (this._keyboard_handler.isPressed( keyCodes.KEY_Z ) ||
            this._keyboard_handler.isPressed( keyCodes.KEY_W )) {

            this._movement_flag |= 1<<0;
            this._time_immobile = 0;
        }

        // backward
        if (this._keyboard_handler.isPressed( keyCodes.KEY_S )) {

            this._movement_flag |= 1<<1;
            this._time_immobile = 0;
        }

        // strafe left
        if (this._keyboard_handler.isPressed( keyCodes.KEY_A ) ||
            this._keyboard_handler.isPressed( keyCodes.KEY_Q )) {

            this._movement_flag |= 1<<2;
            this._time_immobile = 0;
        }

        // strafe right
        if (this._keyboard_handler.isPressed( keyCodes.KEY_D )) {

            this._movement_flag |= 1<<3;
            this._time_immobile = 0;
        }

        /// /// ///

        // look up
        if (this._keyboard_handler.isPressed( keyCodes.ARROW_UP )) {
            this._phi++;
            this._time_immobile = 0;
        }

        // look down
        if (this._keyboard_handler.isPressed( keyCodes.ARROW_DOWN )) {
            this._phi--;
            this._time_immobile = 0;
        }

        // look left
        if (this._keyboard_handler.isPressed( keyCodes.ARROW_LEFT )) {
            this._theta++;
            this._time_immobile = 0;
        }

        // look right
        if (this._keyboard_handler.isPressed( keyCodes.ARROW_RIGHT )) {
            this._theta--;
            this._time_immobile = 0;
        }

    }

    activate() {

        this._keyboard_handler.activate();
    }

    deactivate() {

        this._keyboard_handler.deactivate();
    }

    /// KEYBOARD
    ///
    ///
    ///
};

export default FreeFlyCamera;
