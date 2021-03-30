
"use strict"

enum keyCodes {
    KEY_Z = 'z',
    KEY_W = 'w',
    KEY_S = 's',
    KEY_A = 'a',
    KEY_Q = 'q',
    KEY_D = 'd',

    ARROW_LEFT  = 'ArrowLeft',
    ARROW_RIGHT = 'ArrowRight',
    ARROW_UP    = 'ArrowUp',
    ARROW_DOWN  = 'ArrowDown',
};

class KeyboardHandler {

    private _pressedKeys = new Map<string, boolean>();
    private _activated: boolean = false;
    private _handleKeyDown: (event: KeyboardEvent) => void;
    private _handleKeyUp: (event: KeyboardEvent) => void;

    constructor() {

        const keysToPrevent: string[] = [
            keyCodes.ARROW_LEFT,
            keyCodes.ARROW_RIGHT,
            keyCodes.ARROW_UP,
            keyCodes.ARROW_DOWN,
        ];

        const handleKeyDown = (event: KeyboardEvent) => {

            if (keysToPrevent.indexOf(event.key) != -1)
                event.preventDefault();

            this._pressedKeys.set(event.key, true);
        };
        const handleKeyUp = (event: KeyboardEvent) => {

            if (keysToPrevent.indexOf(event.key) != -1)
                event.preventDefault();

            this._pressedKeys.set(event.key, false);
        };

        this._activated = false;
        this._handleKeyDown = handleKeyDown.bind(this);
        this._handleKeyUp   = handleKeyUp.bind(this);
    }

    isPressed(code: string) {
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
