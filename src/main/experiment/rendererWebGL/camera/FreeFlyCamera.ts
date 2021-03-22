
"use strict"

import * as glm from 'gl-matrix';

import { KeyboardHandler, keyCodes } from './helpers/KeyboardHandler';
import handle_pointerLock from './helpers/pointerLock';

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

    constructor() {

        const canvasesdiv = document.getElementById("canvasesdiv") as HTMLElement;
        if (!canvasesdiv)
            throw new Error("canvasesdiv not found");

        ///
        /// MOUSE
        ///

        const callback_mousemove = (event: MouseEvent) => {

            const movementX = event.movementX || (event as any).mozMovementX || (event as any).webkitMovementX || 0;
            const movementY = event.movementY || (event as any).mozMovementY || (event as any).webkitMovementY || 0;

            // console.log('Mouse movement: ' + movementX + ',' + movementY);

            this._theta -= movementX / 5.0;
            this._phi   -= movementY / 5.0;
        };

        const callback_mouse_locked = () => {
            canvasesdiv.addEventListener('mousemove', callback_mousemove, false);
        };

        const callback_mouse_unlocked = () => {
            canvasesdiv.removeEventListener('mousemove', callback_mousemove, false);
        };

        //

        handle_pointerLock(canvasesdiv, callback_mouse_locked, callback_mouse_unlocked);

        ///
        /// /MOUSE
        ///



        ///
        /// TOUCH
        ///

        let previous_touch: Touch|null = null;
        let previous_distance: number|null = null;
        let saved_time: number|null = null;

        canvasesdiv.addEventListener('touchstart', (event) => {

            event.preventDefault();

            previous_touch = null;
            previous_distance = null;

            const tmp_time = Date.now();

            if (event.targetTouches.length == 1 &&
                saved_time &&
                (tmp_time - saved_time) < 250) {

                this._force_forward = true;
            }

            saved_time = tmp_time;
        });

        canvasesdiv.addEventListener('touchend', (event) => {

            event.preventDefault();

            previous_touch = null;
            previous_distance = null;

            // saved_time = null;
            this._force_forward = false;
        });

        canvasesdiv.addEventListener('touchmove', (event: TouchEvent) => {

            event.preventDefault();

            const touches = event.targetTouches;

            if (touches.length == 0 || touches.length > 2)
                return;

            if (touches.length == 2) {

                const x1 = touches[0].pageX-touches[1].pageX;
                const y1 = touches[0].pageY-touches[1].pageY;

                const length = Math.sqrt(x1*x1 + y1*y1);

                if (previous_distance)
                {
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
                    this._theta -= (step_x / 5.0);
                    this._phi   -= (step_y / 5.0);
                }

                previous_touch = touches[0];
            }
        });

        ///
        /// /TOUCH
        ///

    }

    update(elapsed_sec: number) {

        this.handleKeys();

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



    ///
    ///
    ///
    /// KEYBOARD

    handleKeys() {

        // forward
        if (this._keyboard_handler.isPressed( keyCodes.KEY_Z ) ||
            this._keyboard_handler.isPressed( keyCodes.KEY_W ))
            this._movement_flag |= 1<<0

        // backward
        if (this._keyboard_handler.isPressed( keyCodes.KEY_S ))
            this._movement_flag |= 1<<1

        // strafe left
        if (this._keyboard_handler.isPressed( keyCodes.KEY_A ) ||
            this._keyboard_handler.isPressed( keyCodes.KEY_Q ))
            this._movement_flag |= 1<<2

        // strafe right
        if (this._keyboard_handler.isPressed( keyCodes.KEY_D ))
            this._movement_flag |= 1<<3

        /// /// ///

        // look up
        if (this._keyboard_handler.isPressed( keyCodes.ARROW_UP ))
            this._phi++;

        // look down
        if (this._keyboard_handler.isPressed( keyCodes.ARROW_DOWN ))
            this._phi--;

        // look left
        if (this._keyboard_handler.isPressed( keyCodes.ARROW_LEFT ))
            this._theta++;

        // look right
        if (this._keyboard_handler.isPressed( keyCodes.ARROW_RIGHT ))
            this._theta--;

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
