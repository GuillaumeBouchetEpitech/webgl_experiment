
"use strict"

const keyCodes = {

      KEY_Z : 90, KEY_W : 87
    , KEY_S : 83
    , KEY_A : 65, KEY_Q : 81
    , KEY_D : 68

    , ARROW_LEFT  : 37
    , ARROW_RIGHT : 39
    , ARROW_UP    : 38
    , ARROW_DOWN  : 40
};

class KeyboardHandler {

    private _pressedKeys = new Map<number, boolean>();
    private _activated: boolean = false;
    private _handleKeyDown: (event: KeyboardEvent) => void;
    private _handleKeyUp: (event: KeyboardEvent) => void;

    constructor() {


        const handleKeyDown = (event: KeyboardEvent) => {
            this._pressedKeys.set(event.keyCode, true);
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            this._pressedKeys.set(event.keyCode, false);
        };

        this._activated = false;
        this._handleKeyDown = handleKeyDown.bind(this);
        this._handleKeyUp   = handleKeyUp.bind(this);
    }

    isPressed(code: number) {
        return this._pressedKeys.get(code) || false;
    }

    activate() {

        if (this._activated)
            return;

        document.addEventListener('keydown',    this._handleKeyDown);
        document.addEventListener('keyup',      this._handleKeyUp);

        this._activated = true;
    }

    deactivate() {

        if (!this._activated)
            return;

        document.removeEventListener('keydown',    this._handleKeyDown);
        document.removeEventListener('keyup',      this._handleKeyUp);

        this._activated = false;
    }
}

export {
    keyCodes,
    KeyboardHandler,
};
