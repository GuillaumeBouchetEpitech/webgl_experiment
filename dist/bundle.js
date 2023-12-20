'use strict';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

const allRequestEvents$1 = [
    'requestFullscreen',
    'webkitRequestFullscreen',
    'mozRequestFullScreen',
    'msRequestFullscreen'
];
const allChangeEvents$1 = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'msfullscreenchange'
];
class FullScreenManager {
    constructor() {
        this._onFullScreenChangeCallbacks = [];
        this._isInitialized = false;
    }
    _initialize() {
        if (this._isInitialized) {
            return;
        }
        this._isInitialized = true;
        const onLockChange = () => {
            this._onFullScreenChangeCallbacks.forEach((callback) => callback());
        };
        for (const currEvent of allChangeEvents$1)
            document.addEventListener(currEvent, onLockChange, false);
    }
    //
    isCompatible(inTargetElement) {
        for (const currEvent of allRequestEvents$1) {
            if (currEvent in inTargetElement) {
                return true;
            }
        }
        return false;
    }
    //
    isFullScreen(inTargetElement) {
        return document.fullscreenElement === inTargetElement;
    }
    //
    requestFullScreen(inTargetElement) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isFullScreen(inTargetElement)) {
                return { success: false, message: 'element already in full screen' };
            }
            this._initialize();
            for (const currEvent of allRequestEvents$1) {
                if (currEvent in inTargetElement) {
                    inTargetElement[currEvent]();
                    return { success: true, message: 'request for full screen done' };
                }
            }
            return { success: false, message: 'unsupported request for full screen' };
        });
    }
    //
    addOnFullScreenChange(inCallback) {
        this._onFullScreenChangeCallbacks.push(inCallback);
    }
    removeOnFullScreenChange(inCallback) {
        const index = this._onFullScreenChangeCallbacks.indexOf(inCallback);
        if (index < 0) {
            return;
        }
        this._onFullScreenChangeCallbacks.splice(index, 1);
    }
    removeAllCallbacks() {
        this._onFullScreenChangeCallbacks.length = 0;
    }
}
const GlobalFullScreenManager$1 = new FullScreenManager();

const AllKeyCodes = {
    // Numbers and letters
    Num0: 48,
    Num1: 49,
    Num2: 50,
    Num3: 51,
    Num4: 52,
    Num5: 53,
    Num6: 54,
    Num7: 55,
    Num8: 56,
    Num9: 57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    // Punctuations keys in US layout
    Semicolon: 186,
    Equal: 187,
    Comma: 188,
    Minus: 189,
    Period: 190,
    BackQuote: 192,
    BracketLeft: 219,
    Backslash: 220,
    BracketRight: 221,
    Quote: 222,
    // Modifier keys
    Shift: 16,
    Ctrl: 17,
    Alt: 18,
    CapsLock: 20,
    // Control keys
    Tab: 9,
    Enter: 13,
    Pause: 19,
    Escape: 27,
    Space: 32,
    PageUp: 33,
    PageDown: 34,
    End: 35,
    Home: 36,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
    PrintScreen: 44,
    Insert: 45,
    Delete: 46,
    ContextMenu: 93,
    ScrollLock: 145,
    // Function keys
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    F13: 124,
    F14: 125,
    F15: 126,
    F16: 127,
    F17: 128,
    F18: 129,
    F19: 130,
    F20: 131,
    F21: 132,
    F22: 133,
    F23: 134,
    F24: 135,
    // Numpad keys
    NumPad0: 96,
    NumPad1: 97,
    NumPad2: 98,
    NumPad3: 99,
    NumPad4: 100,
    NumPad5: 101,
    NumPad6: 102,
    NumPad7: 103,
    NumPad8: 104,
    NumPad9: 105,
    NumPadMultiply: 106,
    NumPadAdd: 107,
    NumPadSubtract: 109,
    NumPadDecimal: 110,
    NumPadDivide: 111,
    NumLock: 144,
    NumPadComma: 194,
    NumPadEqual: 12
};
const isLetter = (key) => {
    return key >= AllKeyCodes.A && key <= AllKeyCodes.Z;
};
const isNumber = (key) => {
    return ((key >= AllKeyCodes.Num0 && key <= AllKeyCodes.Num9) ||
        (key >= AllKeyCodes.NumPad0 && key <= AllKeyCodes.NumPad9));
};
const isAlphanumeric = (key) => {
    return isNumber(key) || isLetter(key);
};

class KeyboardManager {
    constructor() {
        this._pressedKeysSet = new Set();
        this._preventDefaultKeysSet = new Set();
        this._activated = false;
        const handleKeyDown = (event) => {
            const { keyCode } = event;
            if (this._preventDefaultKeysSet.has(keyCode))
                event.preventDefault();
            this._pressedKeysSet.add(keyCode);
        };
        const handleKeyUp = (event) => {
            const { keyCode } = event;
            if (this._preventDefaultKeysSet.has(keyCode))
                event.preventDefault();
            this._pressedKeysSet.delete(keyCode);
        };
        this._activated = false;
        this._handleKeyDown = handleKeyDown.bind(this);
        this._handleKeyUp = handleKeyUp.bind(this);
    }
    isPressed(...inKeys) {
        for (const key of inKeys) {
            if (this._pressedKeysSet.has(AllKeyCodes[key])) {
                return true;
            }
        }
        return false;
    }
    preventDefault(inKey) {
        this._preventDefaultKeysSet.add(AllKeyCodes[inKey]);
    }
    enableDefault(inKey) {
        this._preventDefaultKeysSet.delete(AllKeyCodes[inKey]);
    }
    activate() {
        if (this._activated) {
            return;
        }
        this._pressedKeysSet.clear();
        document.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('keyup', this._handleKeyUp);
        this._activated = true;
    }
    deactivate() {
        if (!this._activated) {
            return;
        }
        this._pressedKeysSet.clear();
        document.removeEventListener('keydown', this._handleKeyDown);
        document.removeEventListener('keyup', this._handleKeyUp);
        this._activated = false;
    }
}
//
//
//
const GlobalKeyboardManager$3 = new KeyboardManager();

const AllMouseButtons = {
    Left: 0,
    Middle: 1,
    Right: 2
};
class MouseManager {
    constructor() {
        this._pressedButtonsSet = new Set();
        this._activated = false;
        // private _positionX = 0;
        // private _positionY = 0;
        this._deltaX = 0;
        this._deltaY = 0;
        const handleMouseDown = (event) => {
            this._pressedButtonsSet.add(event.button);
        };
        const handleMouseUp = (event) => {
            this._pressedButtonsSet.delete(event.button);
        };
        const handleMouseMove = (event) => {
            this._deltaX +=
                event.movementX ||
                    event.mozMovementX ||
                    event.webkitMovementX ||
                    0;
            this._deltaY +=
                event.movementY ||
                    event.mozMovementY ||
                    event.webkitMovementY ||
                    0;
        };
        this._activated = false;
        this._handleMouseDown = handleMouseDown.bind(this);
        this._handleMouseUp = handleMouseUp.bind(this);
        this._handleMouseMove = handleMouseMove.bind(this);
    }
    activate() {
        if (this._activated) {
            return;
        }
        this._pressedButtonsSet.clear();
        document.addEventListener('mousedown', this._handleMouseDown);
        document.addEventListener('mouseup', this._handleMouseUp);
        document.addEventListener('mousemove', this._handleMouseMove);
        this._activated = true;
    }
    deactivate() {
        if (!this._activated) {
            return;
        }
        this._pressedButtonsSet.clear();
        document.removeEventListener('mousedown', this._handleMouseDown);
        document.removeEventListener('mouseup', this._handleMouseUp);
        document.removeEventListener('mousemove', this._handleMouseMove);
        this._activated = false;
    }
    isButtonPressed(inKey) {
        return this._pressedButtonsSet.has(AllMouseButtons[inKey]);
    }
    deltaX() {
        return this._deltaX;
    }
    deltaY() {
        return this._deltaY;
    }
    resetDeltas() {
        this._deltaX = 0;
        this._deltaY = 0;
    }
}
//
//
//
const GlobalMouseManager$3 = new MouseManager();

const allRequestEvents = [
    'requestPointerLock',
    'mozRequestPointerLock',
    'webkitRequestPointerLock'
];
const allExitEvents = [
    'exitPointerLock',
    'mozExitPointerLock',
    'webkitExitPointerLock'
];
const allStateEvents = [
    'pointerLockElement',
    'mozPointerLockElement',
    'webkitPointerLockElement'
];
const allChangeEvents = [
    { methodName: 'onpointerlockchange', propertyName: 'pointerlockchange' },
    {
        methodName: 'onmozpointerlockchange',
        propertyName: 'mozpointerlockchange'
    },
    {
        methodName: 'onwebkitpointerlockchange',
        propertyName: 'webkitpointerlockchange'
    }
];
const allErrorEvents = [
    { methodName: 'onpointerlockerror', propertyName: 'pointerlockerror' },
    { methodName: 'onmozpointerlockerror', propertyName: 'mozpointerlockerror' },
    {
        methodName: 'onwebkitpointerlockerror',
        propertyName: 'webkitpointerlockerror'
    }
];
class PointerLockManager {
    constructor() {
        this._onLockChangeCallbacks = [];
        this._onLockErrorCallbacks = [];
        this._timeSinceLastLockChange = 0;
        this._isInitialized = false;
    }
    // constructor() {}
    _initialize() {
        if (this._isInitialized) {
            return;
        }
        this._isInitialized = true;
        const onLockChange = () => {
            this._timeSinceLastLockChange = Date.now();
            // console.log("timer reset");
            this._onLockChangeCallbacks.forEach((callback) => callback());
        };
        const onLockError = (event) => {
            this._timeSinceLastLockChange = Date.now();
            // console.log("timer reset");
            this._onLockErrorCallbacks.forEach((callback) => callback(event));
        };
        for (const currEvent of allChangeEvents) {
            if (currEvent.methodName in document) {
                document.addEventListener(currEvent.propertyName, onLockChange, false);
                break;
            }
        }
        for (const currEvent of allErrorEvents) {
            if (currEvent.methodName in document) {
                document.addEventListener(currEvent.propertyName, onLockError, false);
                break;
            }
        }
    }
    //
    canBePointerLocked(inTargetElement) {
        for (const currEvent of allRequestEvents) {
            if (currEvent in inTargetElement) {
                return true;
            }
        }
        return false;
    }
    //
    isPointerLocked(inTargetElement) {
        for (const currEvent of allStateEvents) {
            if (currEvent in document) {
                return document[currEvent] === inTargetElement;
            }
        }
        return false;
    }
    //
    requestPointerLock(inTargetElement) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isPointerLocked(inTargetElement)) {
                return { success: false, message: 'element already locked' };
            }
            this._initialize();
            if (this._timeSinceLastLockChange > 0) {
                const elapsedSecTime = (Date.now() - this._timeSinceLastLockChange) / 1000;
                // console.log("elapsedSecTime 1", elapsedSecTime);
                if (elapsedSecTime < 1.1) {
                    return {
                        success: false,
                        message: `request for lock was too early, time to wait: ${elapsedSecTime.toFixed(2)}sec`
                    };
                }
            }
            this._timeSinceLastLockChange = Date.now();
            for (const currEvent of allRequestEvents) {
                if (currEvent in inTargetElement) {
                    const options = {
                        // more accurate by disabling OS-level adjusted mouse movements
                        unadjustedMovement: false
                    };
                    try {
                        // console.log("actual request");
                        yield inTargetElement[currEvent](options);
                    }
                    catch (err) {
                        // console.log("ERR", err);
                        const elapsedSecTime = (Date.now() - this._timeSinceLastLockChange) / 1000;
                        // console.log("elapsedSecTime 2", elapsedSecTime);
                        return {
                            success: false,
                            message: `request for lock was too early, time to wait: ${elapsedSecTime.toFixed(2)}sec`
                        };
                    }
                    this._timeSinceLastLockChange = Date.now();
                    // console.log("timer reset");
                    return { success: true, message: 'request for lock done' };
                }
            }
            return { success: false, message: 'unsupported request for lock' };
        });
    }
    //
    allowPointerLockedOnClickEvent(inTargetElement) {
        if (inTargetElement === this._latestRequestHtmlElement) {
            return;
        }
        this._latestRequestHtmlElement = inTargetElement;
        const onClick = () => __awaiter(this, void 0, void 0, function* () {
            inTargetElement.removeEventListener('click', onClick);
            const result = yield this.requestPointerLock(inTargetElement);
            this._latestRequestHtmlElement = undefined;
            if (!result.success) {
                this.allowPointerLockedOnClickEvent(inTargetElement);
            }
        });
        inTargetElement.addEventListener('click', onClick);
    }
    //
    exitPointerLock() {
        for (const currEvent of allExitEvents) {
            if (currEvent in document) {
                document[currEvent]();
                break;
            }
        }
    }
    //
    addOnLockChange(inCallback) {
        this._onLockChangeCallbacks.push(inCallback);
    }
    removeOnLockChange(inCallback) {
        const index = this._onLockChangeCallbacks.indexOf(inCallback);
        if (index < 0) {
            return;
        }
        this._onLockChangeCallbacks.splice(index, 1);
    }
    //
    addOnLockError(inCallback) {
        this._onLockErrorCallbacks.push(inCallback);
    }
    removeOnLockError(inCallback) {
        const index = this._onLockErrorCallbacks.indexOf(inCallback);
        if (index < 0) {
            return;
        }
        this._onLockErrorCallbacks.splice(index, 1);
    }
    //
    removeAllCallbacks() {
        this._onLockChangeCallbacks.length = 0;
        this._onLockErrorCallbacks.length = 0;
    }
}
const GlobalPointerLockManager$2 = new PointerLockManager();

class TouchData {
    constructor(id, positionX, positionY) {
        this.createdAt = Date.now();
        this.deltaX = 0;
        this.deltaY = 0;
        this.id = id;
        this.positionX = positionX;
        this.positionY = positionY;
    }
    resetDelta() {
        this.deltaX = 0;
        this.deltaY = 0;
    }
}
class TouchManager {
    constructor() {
        this._activated = false;
        this._allTouchDataMap = new Map();
        this._allCachedTouchDataArray = [];
        const handleTouchStart = (event) => {
            event.preventDefault();
            for (let ii = 0; ii < event.changedTouches.length; ++ii) {
                const { identifier, pageX, pageY } = event.changedTouches[ii];
                const newData = new TouchData(identifier, pageX, pageY);
                this._allTouchDataMap.set(`${identifier}`, newData);
                this._allCachedTouchDataArray.length = 0;
            }
        };
        const handleTouchEnd = (event) => {
            event.preventDefault();
            for (let ii = 0; ii < event.changedTouches.length; ++ii) {
                const { identifier } = event.changedTouches[ii];
                this._allTouchDataMap.delete(`${identifier}`);
                this._allCachedTouchDataArray.length = 0;
            }
        };
        const handleTouchMove = (event) => {
            event.preventDefault();
            for (let ii = 0; ii < event.changedTouches.length; ++ii) {
                const { identifier, pageX, pageY } = event.changedTouches[ii];
                const currData = this._allTouchDataMap.get(`${identifier}`);
                if (!currData) {
                    continue;
                }
                const deltaX = pageX - currData.positionX;
                const deltaY = pageY - currData.positionY;
                currData.deltaX += deltaX;
                currData.deltaY += deltaY;
                currData.positionX = pageX;
                currData.positionY = pageY;
            }
        };
        this._activated = false;
        this._handleTouchStart = handleTouchStart.bind(this);
        this._handleTouchEnd = handleTouchEnd.bind(this);
        this._handleTouchMove = handleTouchMove.bind(this);
    }
    isSupported(inTargetElement) {
        return 'ontouchstart' in inTargetElement;
    }
    activate(inTargetElement) {
        if (!this.isSupported(inTargetElement)) {
            return;
        }
        if (this._activated) {
            return;
        }
        this._allTouchDataMap.clear();
        this._allCachedTouchDataArray.length = 0;
        inTargetElement.addEventListener('touchstart', this._handleTouchStart);
        inTargetElement.addEventListener('touchend', this._handleTouchEnd);
        inTargetElement.addEventListener('touchcancel', this._handleTouchEnd);
        inTargetElement.addEventListener('touchmove', this._handleTouchMove, {
            passive: false
        });
        this._activated = true;
    }
    deactivate(inTargetElement) {
        if (!this._activated) {
            return;
        }
        this._allTouchDataMap.clear();
        this._allCachedTouchDataArray.length = 0;
        inTargetElement.removeEventListener('touchstart', this._handleTouchStart);
        inTargetElement.removeEventListener('touchend', this._handleTouchEnd);
        inTargetElement.removeEventListener('touchcancel', this._handleTouchEnd);
        inTargetElement.removeEventListener('touchmove', this._handleTouchMove);
        this._activated = false;
    }
    _refreshCache() {
        if (this._allCachedTouchDataArray.length === 0) {
            this._allCachedTouchDataArray = [...this._allTouchDataMap.values()];
        }
    }
    getTouchData() {
        this._refreshCache();
        return this._allCachedTouchDataArray;
    }
    resetDeltas() {
        this._refreshCache();
        this._allCachedTouchDataArray.forEach((item) => item.resetDelta());
    }
}
//
//
//
const GlobalTouchManager$5 = new TouchManager();

class VisibilityManager {
    constructor() {
        this._activated = false;
        this._onVisibilityChangeCallbacks = [];
        const handleVisibilityChange = () => {
            const isVisible = this.isVisible();
            this._onVisibilityChangeCallbacks.forEach((callback) => callback(isVisible));
        };
        this._handleVisibilityChange = handleVisibilityChange.bind(this);
    }
    activate() {
        if (!this.isSupported()) {
            return;
        }
        if (this._activated) {
            return;
        }
        document.addEventListener('visibilitychange', this._handleVisibilityChange, false);
        this._activated = true;
    }
    deactivate() {
        if (!this._activated) {
            return;
        }
        document.removeEventListener('visibilitychange', this._handleVisibilityChange, false);
        this._activated = false;
    }
    //
    isSupported() {
        return 'onvisibilitychange' in document;
    }
    //
    isVisible() {
        return document.visibilityState === 'visible';
    }
    //
    addVisibilityChange(inCallback) {
        this._onVisibilityChangeCallbacks.push(inCallback);
    }
    removeVisibilityChange(inCallback) {
        const index = this._onVisibilityChangeCallbacks.indexOf(inCallback);
        if (index < 0) {
            return;
        }
        this._onVisibilityChangeCallbacks.splice(index, 1);
    }
    //
    removeAllCallbacks() {
        this._onVisibilityChangeCallbacks.length = 0;
    }
}
const GlobalVisibilityManager = new VisibilityManager();

const isWebWorkerSupported$1 = () => {
    return !!window.Worker;
};

const isWebGL2Supported$1 = () => {
    return !!window.WebGL2RenderingContext;
};

var index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    AllKeyCodes: AllKeyCodes,
    GlobalFullScreenManager: GlobalFullScreenManager$1,
    GlobalKeyboardManager: GlobalKeyboardManager$3,
    GlobalMouseManager: GlobalMouseManager$3,
    GlobalPointerLockManager: GlobalPointerLockManager$2,
    GlobalTouchManager: GlobalTouchManager$5,
    GlobalVisibilityManager: GlobalVisibilityManager,
    isAlphanumeric: isAlphanumeric,
    isLetter: isLetter,
    isNumber: isNumber,
    isWebGL2Supported: isWebGL2Supported$1,
    isWebWorkerSupported: isWebWorkerSupported$1
});

/**
 * Common utilities
 * @module glMatrix
 */
// Configuration Constants
var EPSILON = 0.000001;
var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
if (!Math.hypot) Math.hypot = function () {
  var y = 0,
      i = arguments.length;

  while (i--) {
    y += arguments[i] * arguments[i];
  }

  return Math.sqrt(y);
};

/**
 * 3x3 Matrix
 * @module mat3
 */

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */

function create$5() {
  var out = new ARRAY_TYPE(9);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
  }

  out[0] = 1;
  out[4] = 1;
  out[8] = 1;
  return out;
}

/**
 * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
 * @module mat4
 */

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */

function create$4() {
  var out = new ARRAY_TYPE(16);

  if (ARRAY_TYPE != Float32Array) {
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
  }

  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}
/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the source matrix
 * @returns {mat4} out
 */

function copy$1(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  out[3] = a[3];
  out[4] = a[4];
  out[5] = a[5];
  out[6] = a[6];
  out[7] = a[7];
  out[8] = a[8];
  out[9] = a[9];
  out[10] = a[10];
  out[11] = a[11];
  out[12] = a[12];
  out[13] = a[13];
  out[14] = a[14];
  out[15] = a[15];
  return out;
}
/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */

function identity(out) {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
}
/**
 * Multiplies two mat4s
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the first operand
 * @param {ReadonlyMat4} b the second operand
 * @returns {mat4} out
 */

function multiply(out, a, b) {
  var a00 = a[0],
      a01 = a[1],
      a02 = a[2],
      a03 = a[3];
  var a10 = a[4],
      a11 = a[5],
      a12 = a[6],
      a13 = a[7];
  var a20 = a[8],
      a21 = a[9],
      a22 = a[10],
      a23 = a[11];
  var a30 = a[12],
      a31 = a[13],
      a32 = a[14],
      a33 = a[15]; // Cache only the current line of the second matrix

  var b0 = b[0],
      b1 = b[1],
      b2 = b[2],
      b3 = b[3];
  out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[4];
  b1 = b[5];
  b2 = b[6];
  b3 = b[7];
  out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[8];
  b1 = b[9];
  b2 = b[10];
  b3 = b[11];
  out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  b0 = b[12];
  b1 = b[13];
  b2 = b[14];
  b3 = b[15];
  out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
  out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
  out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
  out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
  return out;
}
/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to translate
 * @param {ReadonlyVec3} v vector to translate by
 * @returns {mat4} out
 */

function translate(out, a, v) {
  var x = v[0],
      y = v[1],
      z = v[2];
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;

  if (a === out) {
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
  } else {
    a00 = a[0];
    a01 = a[1];
    a02 = a[2];
    a03 = a[3];
    a10 = a[4];
    a11 = a[5];
    a12 = a[6];
    a13 = a[7];
    a20 = a[8];
    a21 = a[9];
    a22 = a[10];
    a23 = a[11];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a03;
    out[4] = a10;
    out[5] = a11;
    out[6] = a12;
    out[7] = a13;
    out[8] = a20;
    out[9] = a21;
    out[10] = a22;
    out[11] = a23;
    out[12] = a00 * x + a10 * y + a20 * z + a[12];
    out[13] = a01 * x + a11 * y + a21 * z + a[13];
    out[14] = a02 * x + a12 * y + a22 * z + a[14];
    out[15] = a03 * x + a13 * y + a23 * z + a[15];
  }

  return out;
}
/**
 * Rotates a mat4 by the given angle around the given axis
 *
 * @param {mat4} out the receiving matrix
 * @param {ReadonlyMat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {ReadonlyVec3} axis the axis to rotate around
 * @returns {mat4} out
 */

function rotate(out, a, rad, axis) {
  var x = axis[0],
      y = axis[1],
      z = axis[2];
  var len = Math.hypot(x, y, z);
  var s, c, t;
  var a00, a01, a02, a03;
  var a10, a11, a12, a13;
  var a20, a21, a22, a23;
  var b00, b01, b02;
  var b10, b11, b12;
  var b20, b21, b22;

  if (len < EPSILON) {
    return null;
  }

  len = 1 / len;
  x *= len;
  y *= len;
  z *= len;
  s = Math.sin(rad);
  c = Math.cos(rad);
  t = 1 - c;
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11]; // Construct the elements of the rotation matrix

  b00 = x * x * t + c;
  b01 = y * x * t + z * s;
  b02 = z * x * t - y * s;
  b10 = x * y * t - z * s;
  b11 = y * y * t + c;
  b12 = z * y * t + x * s;
  b20 = x * z * t + y * s;
  b21 = y * z * t - x * s;
  b22 = z * z * t + c; // Perform rotation-specific matrix multiplication

  out[0] = a00 * b00 + a10 * b01 + a20 * b02;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22;

  if (a !== out) {
    // If the source and destination differ, copy the unchanged last row
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
  }

  return out;
}
/**
 * Generates a perspective projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 * Passing null/undefined/no value for far will generate infinite projection matrix.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum, can be null or Infinity
 * @returns {mat4} out
 */

function perspectiveNO(out, fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2),
      nf;
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[15] = 0;

  if (far != null && far !== Infinity) {
    nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }

  return out;
}
/**
 * Alias for {@link mat4.perspectiveNO}
 * @function
 */

var perspective = perspectiveNO;
/**
 * Generates a orthogonal projection matrix with the given bounds.
 * The near/far clip planes correspond to a normalized device coordinate Z range of [-1, 1],
 * which matches WebGL/OpenGL's clip volume.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */

function orthoNO(out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right);
  var bt = 1 / (bottom - top);
  var nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
}
/**
 * Alias for {@link mat4.orthoNO}
 * @function
 */

var ortho = orthoNO;
/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis.
 * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {ReadonlyVec3} eye Position of the viewer
 * @param {ReadonlyVec3} center Point the viewer is looking at
 * @param {ReadonlyVec3} up vec3 pointing up
 * @returns {mat4} out
 */

function lookAt(out, eye, center, up) {
  var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  var eyex = eye[0];
  var eyey = eye[1];
  var eyez = eye[2];
  var upx = up[0];
  var upy = up[1];
  var upz = up[2];
  var centerx = center[0];
  var centery = center[1];
  var centerz = center[2];

  if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
    return identity(out);
  }

  z0 = eyex - centerx;
  z1 = eyey - centery;
  z2 = eyez - centerz;
  len = 1 / Math.hypot(z0, z1, z2);
  z0 *= len;
  z1 *= len;
  z2 *= len;
  x0 = upy * z2 - upz * z1;
  x1 = upz * z0 - upx * z2;
  x2 = upx * z1 - upy * z0;
  len = Math.hypot(x0, x1, x2);

  if (!len) {
    x0 = 0;
    x1 = 0;
    x2 = 0;
  } else {
    len = 1 / len;
    x0 *= len;
    x1 *= len;
    x2 *= len;
  }

  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  len = Math.hypot(y0, y1, y2);

  if (!len) {
    y0 = 0;
    y1 = 0;
    y2 = 0;
  } else {
    len = 1 / len;
    y0 *= len;
    y1 *= len;
    y2 *= len;
  }

  out[0] = x0;
  out[1] = y0;
  out[2] = z0;
  out[3] = 0;
  out[4] = x1;
  out[5] = y1;
  out[6] = z1;
  out[7] = 0;
  out[8] = x2;
  out[9] = y2;
  out[10] = z2;
  out[11] = 0;
  out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
  out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
  out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
  out[15] = 1;
  return out;
}

/**
 * 3 Dimensional Vector
 * @module vec3
 */

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */

function create$3() {
  var out = new ARRAY_TYPE(3);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  return out;
}
/**
 * Calculates the length of a vec3
 *
 * @param {ReadonlyVec3} a vector to calculate length of
 * @returns {Number} length of a
 */

function length$1(a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  return Math.hypot(x, y, z);
}
/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */

function fromValues$2(x, y, z) {
  var out = new ARRAY_TYPE(3);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}
/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the source vector
 * @returns {vec3} out
 */

function copy(out, a) {
  out[0] = a[0];
  out[1] = a[1];
  out[2] = a[2];
  return out;
}
/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function add(out, a, b) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
  return out;
}
/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function subtract(out, a, b) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
  return out;
}
/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */

function scale(out, a, b) {
  out[0] = a[0] * b;
  out[1] = a[1] * b;
  out[2] = a[2] * b;
  return out;
}
/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} distance between a and b
 */

function distance(a, b) {
  var x = b[0] - a[0];
  var y = b[1] - a[1];
  var z = b[2] - a[2];
  return Math.hypot(x, y, z);
}
/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a vector to normalize
 * @returns {vec3} out
 */

function normalize$2(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var len = x * x + y * y + z * z;

  if (len > 0) {
    //TODO: evaluate use of glm_invsqrt here?
    len = 1 / Math.sqrt(len);
  }

  out[0] = a[0] * len;
  out[1] = a[1] * len;
  out[2] = a[2] * len;
  return out;
}
/**
 * Calculates the dot product of two vec3's
 *
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {Number} dot product of a and b
 */

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the first operand
 * @param {ReadonlyVec3} b the second operand
 * @returns {vec3} out
 */

function cross(out, a, b) {
  var ax = a[0],
      ay = a[1],
      az = a[2];
  var bx = b[0],
      by = b[1],
      bz = b[2];
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  return out;
}
/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {ReadonlyVec3} a the vector to transform
 * @param {ReadonlyMat4} m matrix to transform with
 * @returns {vec3} out
 */

function transformMat4(out, a, m) {
  var x = a[0],
      y = a[1],
      z = a[2];
  var w = m[3] * x + m[7] * y + m[11] * z + m[15];
  w = w || 1.0;
  out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
  out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
  return out;
}
/**
 * Returns whether or not the vectors have exactly the same elements in the same position (when compared with ===)
 *
 * @param {ReadonlyVec3} a The first vector.
 * @param {ReadonlyVec3} b The second vector.
 * @returns {Boolean} True if the vectors are equal, false otherwise.
 */

function exactEquals(a, b) {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
/**
 * Alias for {@link vec3.subtract}
 * @function
 */

var sub = subtract;
/**
 * Alias for {@link vec3.length}
 * @function
 */

var len = length$1;
/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$3();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 3;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
    }

    return a;
  };
})();

/**
 * 4 Dimensional Vector
 * @module vec4
 */

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */

function create$2() {
  var out = new ARRAY_TYPE(4);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
  }

  return out;
}
/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */

function fromValues$1(x, y, z, w) {
  var out = new ARRAY_TYPE(4);
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
}
/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {ReadonlyVec4} a vector to normalize
 * @returns {vec4} out
 */

function normalize$1(out, a) {
  var x = a[0];
  var y = a[1];
  var z = a[2];
  var w = a[3];
  var len = x * x + y * y + z * z + w * w;

  if (len > 0) {
    len = 1 / Math.sqrt(len);
  }

  out[0] = x * len;
  out[1] = y * len;
  out[2] = z * len;
  out[3] = w * len;
  return out;
}
/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create$2();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 4;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      vec[2] = a[i + 2];
      vec[3] = a[i + 3];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
      a[i + 2] = vec[2];
      a[i + 3] = vec[3];
    }

    return a;
  };
})();

/**
 * Quaternion
 * @module quat
 */

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */

function create$1() {
  var out = new ARRAY_TYPE(4);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
  }

  out[3] = 1;
  return out;
}
/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyVec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/

function setAxisAngle(out, axis, rad) {
  rad = rad * 0.5;
  var s = Math.sin(rad);
  out[0] = s * axis[0];
  out[1] = s * axis[1];
  out[2] = s * axis[2];
  out[3] = Math.cos(rad);
  return out;
}
/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */

function slerp(out, a, b, t) {
  // benchmarks:
  //    http://jsperf.com/quaternion-slerp-implementations
  var ax = a[0],
      ay = a[1],
      az = a[2],
      aw = a[3];
  var bx = b[0],
      by = b[1],
      bz = b[2],
      bw = b[3];
  var omega, cosom, sinom, scale0, scale1; // calc cosine

  cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

  if (cosom < 0.0) {
    cosom = -cosom;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  } // calculate coefficients


  if (1.0 - cosom > EPSILON) {
    // standard case (slerp)
    omega = Math.acos(cosom);
    sinom = Math.sin(omega);
    scale0 = Math.sin((1.0 - t) * omega) / sinom;
    scale1 = Math.sin(t * omega) / sinom;
  } else {
    // "from" and "to" quaternions are very close
    //  ... so we can do a linear interpolation
    scale0 = 1.0 - t;
    scale1 = t;
  } // calculate final values


  out[0] = scale0 * ax + scale1 * bx;
  out[1] = scale0 * ay + scale1 * by;
  out[2] = scale0 * az + scale1 * bz;
  out[3] = scale0 * aw + scale1 * bw;
  return out;
}
/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * NOTE: The resultant quaternion is not normalized, so you should be sure
 * to renormalize the quaternion yourself where necessary.
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyMat3} m rotation matrix
 * @returns {quat} out
 * @function
 */

function fromMat3(out, m) {
  // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
  // article "Quaternion Calculus and Fast Animation".
  var fTrace = m[0] + m[4] + m[8];
  var fRoot;

  if (fTrace > 0.0) {
    // |w| > 1/2, may as well choose w > 1/2
    fRoot = Math.sqrt(fTrace + 1.0); // 2w

    out[3] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot; // 1/(4w)

    out[0] = (m[5] - m[7]) * fRoot;
    out[1] = (m[6] - m[2]) * fRoot;
    out[2] = (m[1] - m[3]) * fRoot;
  } else {
    // |w| <= 1/2
    var i = 0;
    if (m[4] > m[0]) i = 1;
    if (m[8] > m[i * 3 + i]) i = 2;
    var j = (i + 1) % 3;
    var k = (i + 2) % 3;
    fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
    out[i] = 0.5 * fRoot;
    fRoot = 0.5 / fRoot;
    out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
    out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
    out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
  }

  return out;
}
/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */

var normalize = normalize$1;
/**
 * Sets a quaternion to represent the shortest rotation from one
 * vector to another.
 *
 * Both vectors are assumed to be unit length.
 *
 * @param {quat} out the receiving quaternion.
 * @param {ReadonlyVec3} a the initial vector
 * @param {ReadonlyVec3} b the destination vector
 * @returns {quat} out
 */

(function () {
  var tmpvec3 = create$3();
  var xUnitVec3 = fromValues$2(1, 0, 0);
  var yUnitVec3 = fromValues$2(0, 1, 0);
  return function (out, a, b) {
    var dot$1 = dot(a, b);

    if (dot$1 < -0.999999) {
      cross(tmpvec3, xUnitVec3, a);
      if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
      normalize$2(tmpvec3, tmpvec3);
      setAxisAngle(out, tmpvec3, Math.PI);
      return out;
    } else if (dot$1 > 0.999999) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 1;
      return out;
    } else {
      cross(tmpvec3, a, b);
      out[0] = tmpvec3[0];
      out[1] = tmpvec3[1];
      out[2] = tmpvec3[2];
      out[3] = 1 + dot$1;
      return normalize(out, out);
    }
  };
})();
/**
 * Performs a spherical linear interpolation with two control points
 *
 * @param {quat} out the receiving quaternion
 * @param {ReadonlyQuat} a the first operand
 * @param {ReadonlyQuat} b the second operand
 * @param {ReadonlyQuat} c the third operand
 * @param {ReadonlyQuat} d the fourth operand
 * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
 * @returns {quat} out
 */

(function () {
  var temp1 = create$1();
  var temp2 = create$1();
  return function (out, a, b, c, d, t) {
    slerp(temp1, a, d, t);
    slerp(temp2, b, c, t);
    slerp(out, temp1, temp2, 2 * t * (1 - t));
    return out;
  };
})();
/**
 * Sets the specified quaternion with values corresponding to the given
 * axes. Each axis is a vec3 and is expected to be unit length and
 * perpendicular to all other specified axes.
 *
 * @param {ReadonlyVec3} view  the vector representing the viewing direction
 * @param {ReadonlyVec3} right the vector representing the local "right" direction
 * @param {ReadonlyVec3} up    the vector representing the local "up" direction
 * @returns {quat} out
 */

(function () {
  var matr = create$5();
  return function (out, view, right, up) {
    matr[0] = right[0];
    matr[3] = right[1];
    matr[6] = right[2];
    matr[1] = up[0];
    matr[4] = up[1];
    matr[7] = up[2];
    matr[2] = -view[0];
    matr[5] = -view[1];
    matr[8] = -view[2];
    return normalize(out, fromMat3(out, matr));
  };
})();

/**
 * 2 Dimensional Vector
 * @module vec2
 */

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */

function create() {
  var out = new ARRAY_TYPE(2);

  if (ARRAY_TYPE != Float32Array) {
    out[0] = 0;
    out[1] = 0;
  }

  return out;
}
/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */

function fromValues(x, y) {
  var out = new ARRAY_TYPE(2);
  out[0] = x;
  out[1] = y;
  return out;
}
/**
 * Calculates the length of a vec2
 *
 * @param {ReadonlyVec2} a vector to calculate length of
 * @returns {Number} length of a
 */

function length(a) {
  var x = a[0],
      y = a[1];
  return Math.hypot(x, y);
}
/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */

(function () {
  var vec = create();
  return function (a, stride, offset, count, fn, arg) {
    var i, l;

    if (!stride) {
      stride = 2;
    }

    if (!offset) {
      offset = 0;
    }

    if (count) {
      l = Math.min(count * stride + offset, a.length);
    } else {
      l = a.length;
    }

    for (i = offset; i < l; i += stride) {
      vec[0] = a[i];
      vec[1] = a[i + 1];
      fn(vec, vec, arg);
      a[i] = vec[0];
      a[i + 1] = vec[1];
    }

    return a;
  };
})();

var ProjectionType$1;
(function (ProjectionType) {
    ProjectionType[ProjectionType["perspective"] = 0] = "perspective";
    ProjectionType[ProjectionType["orthogonal"] = 1] = "orthogonal";
})(ProjectionType$1 || (ProjectionType$1 = {}));

var FrustumSide$1;
(function (FrustumSide) {
    FrustumSide[FrustumSide["Right"] = 0] = "Right";
    FrustumSide[FrustumSide["Left"] = 1] = "Left";
    FrustumSide[FrustumSide["Bottom"] = 2] = "Bottom";
    FrustumSide[FrustumSide["Top"] = 3] = "Top";
    FrustumSide[FrustumSide["Back"] = 4] = "Back";
    FrustumSide[FrustumSide["Front"] = 5] = "Front";
})(FrustumSide$1 || (FrustumSide$1 = {}));

let WebGLContext$2 = class WebGLContext {
    static initialize(canvas) {
        const renderingContextAttribs = {
            // Boolean that indicates if the canvas contains an alpha buffer.
            alpha: false,
            // Boolean that indicates whether or not to perform anti-aliasing.
            antialias: false,
            // Boolean that indicates that the drawing buffer has a depth
            // buffer of at least 16 bits.
            depth: true,
            // Boolean that indicates if a context will be created if the
            // system performance is low.
            failIfMajorPerformanceCaveat: false,
            // A hint to the user agent indicating what configuration of GPU is
            // suitable for the WebGL context. Possible values are:
            // "default":
            //     Let the user agent decide which GPU configuration is most
            //     suitable. This is the default value.
            // "high-performance":
            //     Prioritizes rendering performance over power consumption.
            // "low-power":
            //     Prioritizes power saving over rendering performance.
            powerPreference: 'high-performance',
            // Boolean that indicates that the page compositor will assume the
            // drawing buffer contains colors with pre-multiplied alpha.
            premultipliedAlpha: true, // slower framerate when false
            // If the value is true the buffers will not be cleared and will
            // preserve their values until cleared or overwritten by the author.
            preserveDrawingBuffer: true,
            // Boolean that indicates that the drawing buffer has a
            // stencil buffer of at least 8 bits.
            stencil: false
        };
        WebGLContext._gl = canvas.getContext('webgl2', renderingContextAttribs);
        if (!WebGLContext._gl)
            throw new Error('could not create webgl context');
        WebGLContext._extensionLoseContext =
            WebGLContext._gl.getExtension('WEBGL_lose_context');
        WebGLContext._gl.getExtension('EXT_color_buffer_float');
        WebGLContext._gl.getExtension('EXT_float_blend');
    }
    //
    //
    //
    static getContext() {
        if (!WebGLContext._gl)
            throw new Error('webgl context not initialized');
        return WebGLContext._gl;
    }
    //
    //
    //
    static getExtensionLoseContext() {
        return WebGLContext._extensionLoseContext;
    }
    static getExtensionLoseContextStrict() {
        if (!WebGLContext._extensionLoseContext)
            throw new Error('lose context extension not available');
        return WebGLContext._extensionLoseContext;
    }
};
WebGLContext$2._gl = null;
WebGLContext$2._extensionLoseContext = null;

var CubeMapType;
(function (CubeMapType) {
    CubeMapType[CubeMapType["positiveX"] = 0] = "positiveX";
    CubeMapType[CubeMapType["negativeX"] = 1] = "negativeX";
    CubeMapType[CubeMapType["positiveY"] = 2] = "positiveY";
    CubeMapType[CubeMapType["negativeY"] = 3] = "negativeY";
    CubeMapType[CubeMapType["positiveZ"] = 4] = "positiveZ";
    CubeMapType[CubeMapType["negativeZ"] = 5] = "negativeZ";
})(CubeMapType || (CubeMapType = {}));
const getCubeMapType = (inType) => {
    const gl = WebGLContext$2.getContext();
    switch (inType) {
        case CubeMapType.positiveX:
            return gl.TEXTURE_CUBE_MAP_POSITIVE_X;
        case CubeMapType.negativeX:
            return gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
        case CubeMapType.positiveY:
            return gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
        case CubeMapType.negativeY:
            return gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
        case CubeMapType.positiveZ:
            return gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
        case CubeMapType.negativeZ:
            return gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
    }
    // throw new Error('cube map: invalid type');
};
class CubeMap {
    constructor() {
        this._width = 0;
        this._height = 0;
        this._minBufferSize = 0;
        this._texture = null;
    }
    initialize(width, height) {
        if (width < 1)
            throw new Error(`cube map: width is < 1, input: ${width}`);
        if (height < 1)
            throw new Error(`cube map: height is < 1, input: ${height}`);
        const gl = WebGLContext$2.getContext();
        this._texture = gl.createTexture();
        this._width = width;
        this._height = height;
        this._minBufferSize = this._width * this._height * 4;
    }
    rawBind() {
        if (!this._texture)
            throw new Error('cube map: not initialized');
        const gl = WebGLContext$2.getContext();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this._texture);
    }
    bind(inCallback) {
        this.rawBind();
        inCallback(this);
        CubeMap.unbind();
    }
    static unbind() {
        const gl = WebGLContext$2.getContext();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    loadFromMemory(inType, inPixels) {
        if (!this._texture)
            throw new Error('cube map: not initialized');
        if (inPixels.length < this._minBufferSize)
            throw new Error(`cube map: miss-matching pixels buffer size, input: ${inPixels.length}`);
        const gl = WebGLContext$2.getContext();
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(getCubeMapType(inType), level, internalFormat, this._width, this._height, border, srcFormat, srcType, inPixels);
    }
    allocate() {
        const gl = WebGLContext$2.getContext();
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixels = new Uint8Array(this._width * this._height * 4);
        [
            CubeMapType.negativeX,
            CubeMapType.negativeY,
            CubeMapType.negativeZ,
            CubeMapType.positiveX,
            CubeMapType.positiveY,
            CubeMapType.positiveZ
        ].forEach((type) => {
            gl.texImage2D(getCubeMapType(type), level, internalFormat, this._width, this._height, border, srcFormat, srcType, pixels);
        });
    }
    complete() {
        const gl = WebGLContext$2.getContext();
        gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }
    getWidth() {
        if (!this._texture)
            throw new Error('cube map: not initialized');
        return this._width;
    }
    getHeight() {
        if (!this._texture)
            throw new Error('cube map: not initialized');
        return this._height;
    }
    getRawObject() {
        if (!this._texture)
            throw new Error('texture not initialized');
        // TODO: this is ugly
        return this._texture;
    }
}

class DataTexture {
    constructor() {
        this._texture = null;
    }
    // initialize(data: number[] = [], numComponents: number = 1) {
    initialize(data = []) {
        if (this._texture)
            throw new Error('data texture already initialized');
        const gl = WebGLContext$2.getContext();
        this._texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        // make it possible to use a non-power-of-2 texture + we don't need any filtering
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        // this.update(data, numComponents);
        this.update(data);
    }
    // update(data: number[], numComponents: number = 1) {
    update(data) {
        if (!this._texture)
            throw new Error('data texture not initialized');
        const gl = WebGLContext$2.getContext();
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
        const expandedData = new Float32Array(data);
        // // expand the data to 4 values per pixel.
        // const numElements = data.length / numComponents;
        // const expandedData = new Float32Array(numElements * 4);
        // for (let ii = 0; ii < numElements; ++ii) {
        //   const srcOffset = ii * numComponents;
        //   const dstOffset = ii * 4;
        //   for (let jj = 0; jj < numComponents; ++jj)
        //     expandedData[dstOffset + jj] = data[srcOffset + jj];
        // }
        const level = 0;
        // const internalFormat = gl.RGBA;
        // const internalFormat = gl.RGBA32F;
        const internalFormat = gl.R32F;
        // const width = numElements;
        const width = data.length;
        const height = 1;
        const border = 0;
        // const format = gl.RGBA;
        const format = gl.RED;
        // const type = gl.UNSIGNED_BYTE;
        const type = gl.FLOAT;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, expandedData);
    }
    rawBind() {
        if (!this._texture)
            throw new Error('data texture not initialized');
        const gl = WebGLContext$2.getContext();
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
    }
    preBind(inCallback) {
        this.rawBind();
        inCallback(this);
    }
    bind(inCallback) {
        this.preBind(inCallback);
        DataTexture.unbind();
    }
    static unbind() {
        const gl = WebGLContext$2.getContext();
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}

class FrameBuffer {
    constructor() {
        const gl = WebGLContext$2.getContext();
        const tmpFbo = gl.createFramebuffer();
        if (tmpFbo === null)
            throw new Error('null frame buffer object');
        this._frameBuffer = tmpFbo;
    }
    rawBind() {
        const gl = WebGLContext$2.getContext();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
    }
    bind(inCallback) {
        this.rawBind();
        inCallback(this);
        FrameBuffer.unbind();
    }
    static unbind() {
        const gl = WebGLContext$2.getContext();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    attachTexture(texture) {
        const gl = WebGLContext$2.getContext();
        // gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        // texture.rawBind();
        const mipmapLevel = 0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture.getRawObject(), mipmapLevel);
    }
    attachCubeMap(texture, type) {
        const gl = WebGLContext$2.getContext();
        // gl.bindFramebuffer(gl.FRAMEBUFFER, this._frameBuffer);
        // texture.rawBind();
        const mipmapLevel = 0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, getCubeMapType(type), texture.getRawObject(), mipmapLevel);
    }
    getPixels(x, y, width, height, outDst) {
        const gl = WebGLContext$2.getContext();
        gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, outDst);
    }
}

const BytesPerPixel = 4; // float (float32 = 4 bytes)
var AttributeType;
(function (AttributeType) {
    AttributeType[AttributeType["float"] = 0] = "float";
    AttributeType[AttributeType["vec2f"] = 1] = "vec2f";
    AttributeType[AttributeType["vec3f"] = 2] = "vec3f";
    AttributeType[AttributeType["vec4f"] = 3] = "vec4f";
    AttributeType[AttributeType["mat3f"] = 4] = "mat3f";
    AttributeType[AttributeType["mat4f"] = 5] = "mat4f";
})(AttributeType || (AttributeType = {}));
const getAttrTypeSize = (inType) => {
    switch (inType) {
        case AttributeType.float:
            return 1;
        case AttributeType.vec2f:
            return 2;
        case AttributeType.vec3f:
            return 3;
        case AttributeType.vec4f:
            return 4;
        case AttributeType.mat3f:
            return 9;
        case AttributeType.mat4f:
            return 16;
    }
};
var PrimitiveType;
(function (PrimitiveType) {
    PrimitiveType[PrimitiveType["lines"] = 0] = "lines";
    PrimitiveType[PrimitiveType["triangles"] = 1] = "triangles";
    PrimitiveType[PrimitiveType["triangleStrip"] = 2] = "triangleStrip";
})(PrimitiveType || (PrimitiveType = {}));
class Geometry {
    constructor(shader, def) {
        this._primitiveStart = 0;
        this._primitiveCount = 0;
        this._instanceCount = 0;
        this._isInstanced = false;
        const gl = WebGLContext$2.getContext();
        if (def.vbos.length === 0) {
            throw new Error('empty vbo definition');
        }
        for (const vbo of def.vbos) {
            if (vbo.attrs.length === 0) {
                throw new Error('empty vbo attribute definition');
            }
            for (const attr of vbo.attrs) {
                if (!shader.hasAttribute(attr.name)) {
                    throw new Error(`attribute not found, name="${attr.name}"`);
                }
            }
        }
        this._def = def;
        switch (def.primitiveType) {
            case PrimitiveType.lines:
                this._primitiveType = gl.LINES;
                break;
            case PrimitiveType.triangles:
                this._primitiveType = gl.TRIANGLES;
                break;
            case PrimitiveType.triangleStrip:
                this._primitiveType = gl.TRIANGLE_STRIP;
                break;
            default:
                throw new Error('primitive type not found');
        }
        const newVao = gl.createVertexArray();
        if (!newVao) {
            throw new Error('fail o create a vao unit');
        }
        this._vao = newVao;
        gl.bindVertexArray(this._vao);
        //
        this._vbos = [];
        for (const vboDef of this._def.vbos) {
            const newVbo = gl.createBuffer();
            if (!newVbo) {
                throw new Error('fail o create a vbo unit');
            }
            this._vbos.push({
                object: newVbo,
                maxSize: 0,
                dynamic: vboDef.dynamic || false
            });
            gl.bindBuffer(gl.ARRAY_BUFFER, newVbo);
            let stride = vboDef.stride || 0;
            if (!stride) {
                // auto determine stride value
                for (const attr of vboDef.attrs) {
                    switch (attr.type) {
                        case AttributeType.float:
                            stride += 1;
                            break;
                        case AttributeType.vec2f:
                            stride += 2;
                            break;
                        case AttributeType.vec3f:
                            stride += 3;
                            break;
                        case AttributeType.vec4f:
                            stride += 4;
                            break;
                        case AttributeType.mat3f:
                            stride += 9;
                            break;
                        case AttributeType.mat4f:
                            stride += 16;
                            break;
                    }
                }
                stride *= BytesPerPixel;
            }
            for (const attr of vboDef.attrs) {
                let rowSize = 1;
                let totalRows = 1;
                switch (attr.type) {
                    case AttributeType.float:
                        rowSize = 1;
                        totalRows = 1;
                        break;
                    case AttributeType.vec2f:
                        rowSize = 2;
                        totalRows = 1;
                        break;
                    case AttributeType.vec3f:
                        rowSize = 3;
                        totalRows = 1;
                        break;
                    case AttributeType.vec4f:
                        rowSize = 4;
                        totalRows = 1;
                        break;
                    case AttributeType.mat3f:
                        rowSize = 3;
                        totalRows = 3;
                        break;
                    case AttributeType.mat4f:
                        rowSize = 4;
                        totalRows = 4;
                        break;
                }
                const attrLocation = shader.getAttribute(attr.name);
                // TODO: check if the index is 0 on k>0 and assert/throw on it
                for (let ii = 0; ii < totalRows; ++ii) {
                    const attrId = attrLocation + ii;
                    const rowIndex = (attr.index + ii * rowSize) * BytesPerPixel;
                    gl.enableVertexAttribArray(attrId);
                    gl.vertexAttribPointer(attrId, rowSize, gl.FLOAT, false, stride, rowIndex);
                    if (vboDef.instanced === true) {
                        gl.vertexAttribDivisor(attrId, 1);
                        this._isInstanced = true;
                    }
                }
            }
        }
        //
        gl.bindVertexArray(null);
    }
    dispose() {
        const gl = WebGLContext$2.getContext();
        for (const vbo of this._vbos)
            gl.deleteBuffer(vbo.object);
        this._vbos.length = 0;
        gl.deleteVertexArray(this._vao);
    }
    setBufferSize(index, inSize) {
        if (index < 0 || index >= this._vbos.length) {
            throw new Error('no buffer available to that index');
        }
        if (inSize <= 0) {
            return;
        }
        const currVbo = this._vbos[index];
        if (inSize < currVbo.maxSize) {
            return;
        }
        currVbo.maxSize = inSize;
        const gl = WebGLContext$2.getContext();
        const usage = currVbo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
        gl.bindBuffer(gl.ARRAY_BUFFER, currVbo.object);
        gl.bufferData(gl.ARRAY_BUFFER, inSize, usage);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    setFloatBufferSize(index, inSize) {
        this.setBufferSize(index, inSize * 4);
    }
    updateBuffer(index, vertices, inSize) {
        if (index < 0 || index >= this._vbos.length) {
            throw new Error('no buffer available to that index');
        }
        if (inSize <= 0) {
            return;
        }
        const gl = WebGLContext$2.getContext();
        const buffer = vertices instanceof Float32Array ? vertices : new Float32Array(vertices);
        const currVbo = this._vbos[index];
        gl.bindBuffer(gl.ARRAY_BUFFER, currVbo.object);
        if (inSize > currVbo.maxSize) {
            currVbo.maxSize = inSize;
            const usage = currVbo.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
            gl.bufferData(gl.ARRAY_BUFFER, buffer, usage, 0, inSize);
        }
        else {
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, buffer, 0, inSize);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    render() {
        if (this._primitiveCount == 0) {
            return;
        }
        if (this._isInstanced && this._instanceCount == 0) {
            return;
        }
        const gl = WebGLContext$2.getContext();
        gl.bindVertexArray(this._vao);
        if (this._isInstanced === true) {
            gl.drawArraysInstanced(this._primitiveType, this._primitiveStart, this._primitiveCount, this._instanceCount);
        }
        else {
            gl.drawArrays(this._primitiveType, this._primitiveStart, this._primitiveCount);
        }
        gl.bindVertexArray(null);
    }
    setPrimitiveStart(start) {
        this._primitiveStart = start;
    }
    setPrimitiveCount(count) {
        this._primitiveCount = count;
    }
    setInstancedCount(count) {
        this._instanceCount = count;
    }
}
class GeometryBuilder {
    constructor() {
        this._def = {
            vbos: [],
            primitiveType: PrimitiveType.lines
        };
    }
    reset() {
        this._def = {
            vbos: [],
            primitiveType: PrimitiveType.lines
        };
        return this;
    }
    getDef() {
        return this._def;
    }
    setPrimitiveType(inPrimitive) {
        this._def.primitiveType = PrimitiveType[inPrimitive];
        return this;
    }
    addVbo() {
        this._def.vbos.push({
            attrs: [],
            // stride: 0,
            instanced: false
            // dynamic: false,
        });
        return this;
    }
    setVboAsInstanced() {
        this._getLastVbo().instanced = true;
        return this;
    }
    setVboAsDynamic() {
        this._getLastVbo().dynamic = true;
        return this;
    }
    setStride(inStride) {
        this._getLastVbo().stride = inStride;
        return this;
    }
    addVboAttribute(inName, inType) {
        const currVbo = this._getLastVbo();
        const lastAttr = currVbo.attrs.length > 0 ? currVbo.attrs[currVbo.attrs.length - 1] : null;
        currVbo.attrs.push({
            name: inName,
            type: AttributeType[inType],
            index: lastAttr ? lastAttr.index + getAttrTypeSize(lastAttr.type) : 0
        });
        return this;
    }
    _getLastVbo() {
        if (this._def.vbos.length === 0) {
            throw new Error('no VBO setup');
        }
        return this._def.vbos[this._def.vbos.length - 1];
    }
}

var GeometryWrapper$7 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get AttributeType () { return AttributeType; },
    BytesPerPixel: BytesPerPixel,
    Geometry: Geometry,
    GeometryBuilder: GeometryBuilder,
    get PrimitiveType () { return PrimitiveType; }
});

let ShaderProgram$6 = class ShaderProgram {
    constructor(inName, opt) {
        this._attributes = new Map();
        this._uniforms = new Map();
        this._name = inName;
        const gl = WebGLContext$2.getContext();
        const vertexShader = this._getShader(opt.vertexSrc, gl.VERTEX_SHADER);
        const fragmentShader = this._getShader(opt.fragmentSrc, gl.FRAGMENT_SHADER);
        //
        const program = gl.createProgram();
        if (!program)
            throw new Error('could not create a shader program');
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.deleteShader(vertexShader); // free up now unused memory
        gl.deleteShader(fragmentShader); // free up now unused memory
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            // An error occurred while linking
            const lastError = gl.getProgramInfoLog(program);
            throw new Error('Failed to initialized shaders, Error linking:' + lastError);
        }
        this._program = program;
        // this._getAttribAndLocation(opt.attributes, opt.uniforms);
        // this.rawBind();
        this.bind(() => {
            this._getAttributes(opt.attributes);
            this._getUniforms(opt.uniforms);
        });
        // ShaderProgram.unbind();
    }
    // rawBind() {
    //   const gl = WebGLContext.getContext();
    //   gl.useProgram(this._program);
    // }
    bind(inCallback) {
        if (ShaderProgram._isBound !== null) {
            throw new Error(`Double shader binding (bound: ${ShaderProgram._isBound._name}, binding: ${this._name})`);
        }
        ShaderProgram._isBound = this;
        // this.rawBind();
        const gl = WebGLContext$2.getContext();
        gl.useProgram(this._program);
        inCallback(this);
        ShaderProgram.unbind();
    }
    static unbind() {
        const gl = WebGLContext$2.getContext();
        gl.useProgram(null);
        ShaderProgram._isBound = null;
    }
    isBound() {
        return ShaderProgram._isBound === this;
    }
    hasAttribute(name) {
        return this._attributes.has(name);
    }
    getAttribute(name) {
        const attribute = this._attributes.get(name);
        if (attribute === undefined)
            throw new Error(`attribute not found: ${name}`);
        return attribute;
    }
    getUniform(name) {
        const uniform = this._uniforms.get(name);
        if (uniform === undefined)
            throw new Error(`uniform not found: ${name}`);
        return uniform;
    }
    setTextureUniform(inName, inTexture, inIndex) {
        const gl = WebGLContext$2.getContext();
        gl.activeTexture(gl.TEXTURE0 + inIndex);
        gl.uniform1i(this.getUniform(inName), inIndex);
        inTexture.rawBind();
    }
    setInteger1Uniform(inName, inValue) {
        const gl = WebGLContext$2.getContext();
        gl.uniform1i(this.getUniform(inName), inValue);
    }
    setInteger2Uniform(inName, inValueX, inValueY) {
        const gl = WebGLContext$2.getContext();
        gl.uniform2i(this.getUniform(inName), inValueX, inValueY);
    }
    setInteger3Uniform(inName, inValueX, inValueY, inValueZ) {
        const gl = WebGLContext$2.getContext();
        gl.uniform3i(this.getUniform(inName), inValueX, inValueY, inValueZ);
    }
    setFloat1Uniform(inName, inValue) {
        const gl = WebGLContext$2.getContext();
        gl.uniform1f(this.getUniform(inName), inValue);
    }
    setFloat2Uniform(inName, inValueX, inValueY) {
        const gl = WebGLContext$2.getContext();
        gl.uniform2f(this.getUniform(inName), inValueX, inValueY);
    }
    setFloat3Uniform(inName, inValueX, inValueY, inValueZ) {
        const gl = WebGLContext$2.getContext();
        gl.uniform3f(this.getUniform(inName), inValueX, inValueY, inValueZ);
    }
    setMatrix4Uniform(inName, inMatrix) {
        const gl = WebGLContext$2.getContext();
        gl.uniformMatrix4fv(this.getUniform(inName), false, inMatrix);
    }
    _getAttributes(attributes) {
        const gl = WebGLContext$2.getContext();
        for (let ii = 0; ii < attributes.length; ++ii) {
            const value = gl.getAttribLocation(this._program, attributes[ii]);
            if (value < 0)
                throw new Error(`attribute not found => ${attributes[ii]}`);
            this._attributes.set(attributes[ii], value);
        }
    }
    _getUniforms(uniforms) {
        const gl = WebGLContext$2.getContext();
        for (let ii = 0; ii < uniforms.length; ++ii) {
            const value = gl.getUniformLocation(this._program, uniforms[ii]);
            if (value === null)
                throw new Error(`uniform not found => ${uniforms[ii]}`);
            this._uniforms.set(uniforms[ii], value);
        }
    }
    //
    _getShader(src, type) {
        const gl = WebGLContext$2.getContext();
        const shader = gl.createShader(type);
        if (!shader)
            throw new Error('could not create a shader');
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            let error_str = gl.getShaderInfoLog(shader);
            if (!error_str)
                error_str = 'failed to compile a shader';
            throw new Error(error_str);
        }
        return shader;
    }
};
ShaderProgram$6._isBound = null;

let Texture$2 = class Texture {
    constructor() {
        this._width = 0;
        this._height = 0;
        this._texture = null;
    }
    initialize() {
        if (this._texture)
            throw new Error('texture: already initialized');
        const gl = WebGLContext$2.getContext();
        this._texture = gl.createTexture();
    }
    rawBind() {
        if (!this._texture)
            throw new Error('texture: not initialized');
        const gl = WebGLContext$2.getContext();
        gl.bindTexture(gl.TEXTURE_2D, this._texture);
    }
    preBind(inCallback) {
        this.rawBind();
        inCallback(this);
    }
    bind(inCallback) {
        this.preBind(inCallback);
        Texture.unbind();
    }
    static unbind() {
        const gl = WebGLContext$2.getContext();
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    load(inImage) {
        if (!this._texture)
            throw new Error('texture: not initialized');
        const gl = WebGLContext$2.getContext();
        this._width = inImage.width;
        this._height = inImage.height;
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, inImage);
    }
    loadFromMemory(inWidth, inHeight, inPixels) {
        this._allocate(inWidth, inHeight, inPixels);
    }
    allocate(inWidth, inHeight) {
        this._allocate(inWidth, inHeight);
    }
    resize(inWidth, inHeight) {
        this._allocate(inWidth, inHeight);
    }
    _allocate(inWidth, inHeight, inPixels = null) {
        if (!this._texture)
            throw new Error('texture: not initialized');
        const gl = WebGLContext$2.getContext();
        this._width = inWidth;
        this._height = inHeight;
        // wrapping to clamp to edge
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        const level = 0;
        const internalFormat = gl.RGBA;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, inWidth, inHeight, border, srcFormat, srcType, inPixels);
    }
    getWidth() {
        if (!this._texture)
            throw new Error('texture not initialized');
        return this._width;
    }
    getHeight() {
        if (!this._texture)
            throw new Error('texture not initialized');
        return this._height;
    }
    getRawObject() {
        if (!this._texture)
            throw new Error('texture not initialized');
        // TODO: this is ugly
        return this._texture;
    }
    static getImageFromUrl(url) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onerror = reject;
            image.onload = () => {
                resolve(image);
            };
            image.src = url;
        });
    }
};

var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CubeMap: CubeMap,
    get CubeMapType () { return CubeMapType; },
    DataTexture: DataTexture,
    FrameBuffer: FrameBuffer,
    GeometryWrapper: GeometryWrapper$7,
    ShaderProgram: ShaderProgram$6,
    Texture: Texture$2,
    WebGLContext: WebGLContext$2,
    getCubeMapType: getCubeMapType
});

const chunkGraphicSize = 20;
const chunkLogicSize = 10;
const chunkRange = 3;
const controllerMovingSpeed = 32;
const controllerMouseSensibility = 0.1;
const controllerKeyboardSensibility = Math.PI * 0.45;
const controllerTouchSensibility = 0.3;
const workerFile = './dist/worker.js';
const workerTotal = 2;

const { GlobalMouseManager: GlobalMouseManager$2, GlobalTouchManager: GlobalTouchManager$4, GlobalKeyboardManager: GlobalKeyboardManager$2 } = index$1;
const AllAxises = {
    X: 0,
    Y: 1,
    Z: 2
};
class FreeFlyController {
    constructor(def) {
        this._isActivated = false;
        this._theta = 0;
        this._phi = 0;
        this._touchWasActive = false;
        this._touchStartTime = 0;
        this._touchMoveForward = false;
        this._position = fromValues$2(0, 0, 0);
        this._target = fromValues$2(0, 0, 0);
        this._forwardAxis = fromValues$2(1, 0, 0);
        this._leftAxis = fromValues$2(0, 0, 1);
        this._upAxis = fromValues$2(0, 1, 0);
        this._mouseSensibility = def.mouseSensibility;
        this._keyboardSensibility = def.keyboardSensibility;
        this._touchSensibility = def.touchSensibility;
        this._movingSpeed = def.movingSpeed;
        copy(this._position, def.position);
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
    update(elapsedTime, inCollideCallback) {
        let moveForward = false;
        let moveBackward = false;
        let strafeLeft = false;
        let strafeRight = false;
        let lookDeltaX = 0;
        let lookDeltaY = 0;
        //
        // mouse
        //
        const toRadians = Math.PI / 180;
        {
            const deltaX = GlobalMouseManager$2.deltaX() * this._mouseSensibility;
            const deltaY = GlobalMouseManager$2.deltaY() * this._mouseSensibility;
            lookDeltaX -= deltaX * toRadians;
            lookDeltaY -= deltaY * toRadians;
        }
        //
        // mouse
        //
        //
        // touch
        //
        const isTouched = GlobalTouchManager$4.getTouchData().length > 0;
        if (isTouched) {
            if (!this._touchWasActive) {
                const currTime = Date.now();
                const elapsed = (currTime - this._touchStartTime) / 1000;
                if (elapsed < 0.25) {
                    this._touchMoveForward = true;
                }
                else {
                    this._touchStartTime = currTime;
                }
            }
            const firstTouch = GlobalTouchManager$4.getTouchData()[0];
            const deltaX = firstTouch.deltaX * this._touchSensibility;
            const deltaY = firstTouch.deltaY * this._touchSensibility;
            lookDeltaX -= deltaX * toRadians;
            lookDeltaY -= deltaY * toRadians;
        }
        else {
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
        const currentLinearSpeed = this._movingSpeed * elapsedTime;
        const scaledForward = fromValues$2(0, 0, 0);
        scale(scaledForward, this._forwardAxis, currentLinearSpeed);
        const scaledLeft = fromValues$2(0, 0, 0);
        scale(scaledLeft, this._leftAxis, currentLinearSpeed);
        // forward
        if (GlobalKeyboardManager$2.isPressed('Z', 'W')) {
            moveForward = true;
        }
        // backward
        if (GlobalKeyboardManager$2.isPressed('S')) {
            moveBackward = true;
        }
        // strafe left
        if (GlobalKeyboardManager$2.isPressed('A', 'Q')) {
            strafeLeft = true;
        }
        // strafe right
        if (GlobalKeyboardManager$2.isPressed('D')) {
            strafeRight = true;
        }
        //
        //
        const currentAngularSpeed = this._keyboardSensibility * elapsedTime;
        if (GlobalKeyboardManager$2.isPressed('ArrowUp')) {
            lookDeltaY += currentAngularSpeed;
        }
        else if (GlobalKeyboardManager$2.isPressed('ArrowDown')) {
            lookDeltaY -= currentAngularSpeed;
        }
        if (GlobalKeyboardManager$2.isPressed('ArrowLeft')) {
            lookDeltaX += currentAngularSpeed;
        }
        else if (GlobalKeyboardManager$2.isPressed('ArrowRight')) {
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
        cross(this._leftAxis, this._upAxis, this._forwardAxis);
        {
            if (moveForward) {
                add(this._position, this._position, scaledForward);
            }
            else if (moveBackward) {
                sub(this._position, this._position, scaledForward);
            }
            if (strafeLeft) {
                add(this._position, this._position, scaledLeft);
            }
            else if (strafeRight) {
                sub(this._position, this._position, scaledLeft);
            }
        }
        // update target
        add(this._target, this._position, this._forwardAxis);
        //
        // internals
        //
    }
    getPosition() {
        return this._position;
    }
    setPosition(inPos) {
        copy(this._position, inPos);
    }
    getTarget() {
        return this._target;
    }
    getForwardAxis() {
        return this._forwardAxis;
    }
    getLeftAxis() {
        return this._leftAxis;
    }
    getUpAxis() {
        return this._upAxis;
    }
    getTheta() {
        return this._theta;
    }
    getPhi() {
        return this._phi;
    }
    getTouchMoveForward() {
        return this._touchMoveForward;
    }
}

class Vec3HashSet {
    constructor() {
        this._hashSet = new Set();
    }
    clear() {
        this._hashSet.clear();
    }
    add(inVec3) {
        this._hashSet.add(Vec3HashSet._getName(inVec3));
    }
    delete(inVec3) {
        this._hashSet.delete(Vec3HashSet._getName(inVec3));
    }
    has(inVec3) {
        this._hashSet.has(Vec3HashSet._getName(inVec3));
    }
    static _getName(inVec3) {
        return `${inVec3[0]}/${inVec3[1]}/${inVec3[2]}`;
    }
}

class WorkerManager {
    constructor(inOnWorkerResult) {
        this._unusedWorkers = [];
        this._inUseWorkers = [];
        this._onWorkerResult = inOnWorkerResult;
    }
    areAllWorkerAvailable() {
        return this._inUseWorkers.length === 0;
    }
    isWorkerAvailable() {
        return this._unusedWorkers.length > 0;
    }
    getInUseWorkersData() {
        return this._inUseWorkers.map((worker) => worker.data);
    }
    pushTask(inCallback) {
        if (!this.isWorkerAvailable()) {
            return false;
        }
        //
        // set worker as "in use"
        //
        const currentWorker = this._unusedWorkers.pop();
        this._inUseWorkers.push(currentWorker);
        //
        // start
        //
        inCallback(currentWorker.data, (inPayload, inTransfer) => {
            currentWorker.instance.postMessage(inPayload, inTransfer);
        });
        return true;
    }
    addOneWorker(inWorkerFile, inWorkerData) {
        const newWorker = {
            instance: new Worker(inWorkerFile),
            data: inWorkerData
        };
        this._unusedWorkers.push(newWorker);
        const onWorkerMessage = (event) => {
            //
            // set worker as "unused"
            //
            const index = this._inUseWorkers.indexOf(newWorker);
            if (index >= 0) {
                this._unusedWorkers.push(newWorker);
                this._inUseWorkers.splice(index, 1);
            }
            //
            // process response
            //
            this._onWorkerResult(newWorker.data, event.data);
        };
        newWorker.instance.addEventListener('message', onWorkerMessage, false);
    }
}

class ChunkManager {
    constructor(inDef) {
        this._cameraPosition = fromValues$2(0, 0, 0);
        this._chunkPositionQueue = []; // position to be processed
        this._savedIndex = [999, 999, 999]; // any other value than 0/0/0 will work
        this._unusedChunks = []; // live chunks
        this._usedChunks = []; // live chunks
        this._usedSet = new Vec3HashSet();
        this._def = inDef;
    }
    clear() {
        this._chunkPositionQueue.length = 0;
        this._unusedChunks.forEach((chunk) => this._def.releaseGeometry(chunk.geometry));
        this._unusedChunks.length = 0;
        this._usedChunks.forEach((chunk) => this._def.releaseGeometry(chunk.geometry));
        this._usedChunks.length = 0;
        this._usedSet.clear();
    }
    isEmpty() {
        return this._usedChunks.length === 0;
    }
    isNotDone() {
        return this._chunkPositionQueue.length > 0;
    }
    getChunks() {
        return this._usedChunks;
    }
    pushNew(indexPosition, realPosition, geometryFloat32buffer, inGeometryBufferSize, 
    // dataFloat32buffer: Readonly<Float32Array>,
    geometryBufferSizeUsed) {
        const geometry = this._def.acquireGeometry(inGeometryBufferSize);
        // geometry.update(
        //   realPosition,
        //   geometryFloat32buffer,
        //   geometryBufferSizeUsed
        // );
        // save
        if (this._unusedChunks.length === 0) {
            this._usedChunks.push({
                realPosition: [...realPosition],
                indexPosition: [...indexPosition],
                geometry,
                isVisible: false,
                isDirty: true,
                geometryFloat32buffer: new Float32Array(geometryFloat32buffer.slice(0, geometryBufferSizeUsed)),
                geometryBufferSizeUsed: geometryBufferSizeUsed
            });
        }
        else {
            const reused = this._unusedChunks.pop();
            reused.realPosition = [...realPosition];
            reused.indexPosition = [...indexPosition];
            reused.isVisible = false;
            reused.isDirty = true;
            (reused.geometryFloat32buffer = new Float32Array(geometryFloat32buffer.slice(0, geometryBufferSizeUsed))),
                (reused.geometryBufferSizeUsed = geometryBufferSizeUsed);
            this._usedChunks.push(reused);
        }
        this._usedSet.add(indexPosition);
        this._def.onChunkCreated();
    }
    update(cameraPosition, inWorkerManager) {
        this._updateGeneration(cameraPosition, inWorkerManager);
        for (const currChunk of this._usedChunks) {
            const isVisible = this._def.chunkIsVisible(currChunk.realPosition);
            currChunk.isVisible = isVisible;
        }
        for (const currChunk of this._usedChunks) {
            if (!currChunk.isVisible || !currChunk.isDirty)
                continue;
            currChunk.geometry.update(currChunk.realPosition, this._def.chunkGraphicSize, currChunk.geometryFloat32buffer, currChunk.geometryBufferSizeUsed);
            currChunk.isDirty = false;
            break;
        }
    }
    _updateGeneration(inCameraPosition, inWorkerManager) {
        //  check if moved enough to justify asking for new chunks
        //      -> if yes
        //          reset chunk queue
        //          exclude chunk out of range
        //          include chunk in range
        copy(this._cameraPosition, inCameraPosition);
        const currIndex = [
            Math.floor(inCameraPosition[0] / this._def.chunkGraphicSize),
            Math.floor(inCameraPosition[1] / this._def.chunkGraphicSize),
            Math.floor(inCameraPosition[2] / this._def.chunkGraphicSize)
        ];
        let needRefresh = false;
        // first time, no chunks yet?
        if (this._usedChunks.length === 0 &&
            inWorkerManager.areAllWorkerAvailable()) {
            needRefresh = true;
        }
        // still in the same chunk?
        if (!needRefresh && !exactEquals(currIndex, this._savedIndex)) {
            needRefresh = true;
        }
        if (needRefresh === false) {
            return;
        }
        // yes -> save as the new current chunk
        copy(this._savedIndex, currIndex);
        //
        // clear the generation queue
        this._chunkPositionQueue.length = 0;
        // the range of chunk generation/exclusion
        const { chunkGenerationRange } = this._def;
        const minChunkPos = [
            Math.floor(currIndex[0] - chunkGenerationRange),
            Math.floor(currIndex[1] - chunkGenerationRange),
            Math.floor(currIndex[2] - chunkGenerationRange)
        ];
        const maxChunkPos = [
            Math.floor(currIndex[0] + chunkGenerationRange),
            Math.floor(currIndex[1] + chunkGenerationRange),
            Math.floor(currIndex[2] + chunkGenerationRange)
        ];
        //
        // exclude the chunks that are too far away
        for (let ii = 0; ii < this._usedChunks.length;) {
            const { indexPosition } = this._usedChunks[ii];
            const isOutOfRange = indexPosition[0] < minChunkPos[0] ||
                indexPosition[0] > maxChunkPos[0] ||
                indexPosition[1] < minChunkPos[1] ||
                indexPosition[1] > maxChunkPos[1] ||
                indexPosition[2] < minChunkPos[2] ||
                indexPosition[2] > maxChunkPos[2];
            if (isOutOfRange) {
                // remove chunk
                this._def.releaseGeometry(this._usedChunks[ii].geometry);
                const removedChunks = this._usedChunks.splice(ii, 1);
                this._unusedChunks.push(removedChunks[0]);
                this._usedSet.delete(indexPosition);
                this._def.onChunkDiscarded();
            }
            else {
                ++ii;
            }
        }
        //
        // include in the generation queue the close enough chunks
        const currPos = [0, 0, 0];
        for (currPos[2] = minChunkPos[2]; currPos[2] <= maxChunkPos[2]; ++currPos[2]) {
            for (currPos[1] = minChunkPos[1]; currPos[1] <= maxChunkPos[1]; ++currPos[1]) {
                for (currPos[0] = minChunkPos[0]; currPos[0] <= maxChunkPos[0]; ++currPos[0]) {
                    {
                        const tmpIndex = this._usedChunks.findIndex((currChunk) => {
                            return this._usedSet.has(currChunk.indexPosition);
                        });
                        if (tmpIndex >= 0) {
                            return; // already processed
                        }
                    }
                    {
                        const tmpIndex = inWorkerManager
                            .getInUseWorkersData()
                            .findIndex((currWorker) => {
                            return exactEquals(currWorker.processing.indexPosition, currPos);
                        });
                        if (tmpIndex >= 0) {
                            return; // already processing
                        }
                    }
                    this._chunkPositionQueue.push({
                        indexPosition: [...currPos],
                        realPosition: [
                            currPos[0] * this._def.chunkGraphicSize,
                            currPos[1] * this._def.chunkGraphicSize,
                            currPos[2] * this._def.chunkGraphicSize
                        ]
                    });
                }
            }
        }
    }
    getBestNextChunkPosition() {
        if (this._chunkPositionQueue.length === 0) {
            return undefined;
        }
        // from here, we determine the next best chunk to process
        const _getDistanceToCamera = (chunkPosition) => {
            const chunkHSize = this._def.chunkGraphicSize * 0.5;
            const chunkCenter = [
                this._cameraPosition[0] - (chunkPosition[0] + chunkHSize),
                this._cameraPosition[1] - (chunkPosition[1] + chunkHSize),
                this._cameraPosition[2] - (chunkPosition[2] + chunkHSize)
            ];
            return length$1(chunkCenter);
        };
        let bestIndex = -1;
        let bestMagnitude = -1;
        for (let ii = 0; ii < this._chunkPositionQueue.length; ++ii) {
            const { realPosition } = this._chunkPositionQueue[ii];
            if (!this._def.chunkIsVisible(realPosition)) {
                continue;
            }
            const magnitude = _getDistanceToCamera(realPosition);
            if (bestMagnitude >= 0 && bestMagnitude < magnitude) {
                continue;
            }
            bestIndex = ii;
            bestMagnitude = magnitude;
        }
        if (bestIndex < 0) {
            return undefined;
        }
        // removal
        return this._chunkPositionQueue.splice(bestIndex, 1)[0];
    }
}

class FrameProfiler {
    constructor() {
        this._framesDelta = [];
        this._averageDelta = 0;
        this._minDelta = 0;
        this._maxDelta = 0;
    }
    pushDelta(inDelta) {
        if (this._framesDelta.length >= 100) {
            this._framesDelta.shift();
        }
        this._framesDelta.push(inDelta);
        //
        //
        //
        this._minDelta = +999999999;
        this._maxDelta = -999999999;
        this._averageDelta = 0;
        for (const currDelta of this._framesDelta) {
            this._minDelta = Math.min(this._minDelta, currDelta);
            this._maxDelta = Math.max(this._maxDelta, currDelta);
            this._averageDelta += currDelta;
        }
        this._averageDelta /= this._framesDelta.length;
    }
    get framesDelta() {
        return this._framesDelta;
    }
    get averageDelta() {
        return this._averageDelta;
    }
    get minDelta() {
        return this._minDelta;
    }
    get maxDelta() {
        return this._maxDelta;
    }
}

class ChunkGenerator {
    constructor(def) {
        this._running = false;
        this._frameProfiler = new FrameProfiler();
        this._def = def;
        this._chunkManager = new ChunkManager({
            chunkGraphicSize: def.chunkGraphicSize,
            chunkGenerationRange: def.chunkGenerationRange,
            chunkLogicSize: def.chunkLogicSize,
            chunkIsVisible: def.chunkIsVisible,
            acquireGeometry: def.acquireGeometry,
            releaseGeometry: def.releaseGeometry,
            onChunkCreated: def.onChunkCreated,
            onChunkDiscarded: def.onChunkDiscarded
        });
        const onWorkerResult = (inWorkerData, inMessageData) => {
            //
            // process response
            //
            const { indexPosition, realPosition, geometryFloat32buffer, // memory ownership transfer
            geometryBufferSize, sizeUsed } = inMessageData;
            const currTime = Date.now();
            const delta = currTime - inMessageData.time;
            this._frameProfiler.pushDelta(delta);
            inWorkerData.geometryFloat32buffer = geometryFloat32buffer;
            inWorkerData.processing = undefined;
            if (!this._running) {
                return;
            }
            //
            // process next
            //
            this._chunkManager.pushNew(indexPosition, realPosition, inWorkerData.geometryFloat32buffer, geometryBufferSize, sizeUsed);
            // launch again
            this._launchWorker();
        };
        this._workerManager = new WorkerManager(onWorkerResult);
        this._dataBufferSize = Math.pow(this._def.chunkLogicSize + 1 + 1, 3); // TODO: check size
        this._geometryBufferSize = this._dataBufferSize * 20 * 6 * 3; // 20 triangles (3 vertices, 6 floats each)
        for (let ii = 0; ii < this._def.workerTotal; ++ii) {
            this._workerManager.addOneWorker(this._def.workerFile, {
                geometryFloat32buffer: new Float32Array(this._geometryBufferSize)
            });
        }
    }
    start() {
        this._running = true;
    }
    stop() {
        if (!this._running)
            return;
        this._running = false;
        this._chunkManager.clear();
    }
    update(cameraPosition) {
        if (!this._running)
            return;
        //
        //
        this._chunkManager.update(cameraPosition, this._workerManager);
        //
        //
        this._launchWorker();
    }
    _launchWorker() {
        // determine the next chunk to process
        while (
        // is there something to process?
        this._chunkManager.isNotDone() &&
            // is there an unused worker?
            this._workerManager.isWorkerAvailable()) {
            //
            // find the "best" chunk to generate
            //
            const nextPositionData = this._chunkManager.getBestNextChunkPosition();
            if (!nextPositionData) {
                break;
            }
            //
            // set worker as "in use"
            //
            this._workerManager.pushTask((inWorkerData, inPushTask) => {
                inWorkerData.processing = nextPositionData;
                const payload = {
                    realPosition: nextPositionData.realPosition,
                    indexPosition: nextPositionData.indexPosition,
                    geometryFloat32buffer: inWorkerData.geometryFloat32buffer,
                    geometryBufferSize: this._geometryBufferSize,
                    sizeUsed: 0,
                    time: Date.now()
                };
                const transferable = [
                    inWorkerData.geometryFloat32buffer.buffer // memory ownership transfer
                ];
                inPushTask(payload, transferable);
            });
        }
    }
    getChunks() {
        return this._chunkManager.getChunks();
    }
    getFrameProfiler() {
        return this._frameProfiler;
    }
    getProcessingRealPositions() {
        return this._workerManager
            .getInUseWorkersData()
            .map((workerData) => workerData.processing.realPosition);
    }
}

var FrustumSide;
(function (FrustumSide) {
    FrustumSide[FrustumSide["Right"] = 0] = "Right";
    FrustumSide[FrustumSide["Left"] = 1] = "Left";
    FrustumSide[FrustumSide["Bottom"] = 2] = "Bottom";
    FrustumSide[FrustumSide["Top"] = 3] = "Top";
    FrustumSide[FrustumSide["Back"] = 4] = "Back";
    FrustumSide[FrustumSide["Front"] = 5] = "Front";
})(FrustumSide || (FrustumSide = {}));
class FrustumCulling {
    constructor() {
        this._frustum = new Float32Array(24); // 6 * 4 values
    }
    _setPlane(side, left, right, coef) {
        const index = side * 4;
        this._frustum[index + 0] = left[0] + right[0] * coef;
        this._frustum[index + 1] = left[1] + right[1] * coef;
        this._frustum[index + 2] = left[2] + right[2] * coef;
        this._frustum[index + 3] = left[3] + right[3] * coef;
        const magnitude = Math.sqrt(this._frustum[index + 0] * this._frustum[index + 0] +
            this._frustum[index + 1] * this._frustum[index + 1] +
            this._frustum[index + 2] * this._frustum[index + 2]);
        if (magnitude === 0)
            return;
        this._frustum[index + 0] /= magnitude;
        this._frustum[index + 1] /= magnitude;
        this._frustum[index + 2] /= magnitude;
        this._frustum[index + 3] /= magnitude;
    }
    calculateFrustum(proj, view) {
        const clip = multiply(create$4(), proj, view);
        ///
        const row0 = fromValues$1(clip[0], clip[4], clip[8], clip[12]);
        const row1 = fromValues$1(clip[1], clip[5], clip[9], clip[13]);
        const row2 = fromValues$1(clip[2], clip[6], clip[10], clip[14]);
        const row3 = fromValues$1(clip[3], clip[7], clip[11], clip[15]);
        this._setPlane(FrustumSide.Right, row3, row0, -1);
        this._setPlane(FrustumSide.Left, row3, row0, +1);
        this._setPlane(FrustumSide.Bottom, row3, row1, +1);
        this._setPlane(FrustumSide.Top, row3, row1, -1);
        this._setPlane(FrustumSide.Back, row3, row2, -1);
        this._setPlane(FrustumSide.Front, row3, row2, +1);
    }
    sphereInFrustum(x, y, z, radius) {
        for (let ii = 0; ii < 6; ++ii) {
            const index = ii * 4;
            if (this._frustum[index + 0] * x +
                this._frustum[index + 1] * y +
                this._frustum[index + 2] * z +
                this._frustum[index + 3] <=
                -radius) {
                return false;
            }
        }
        return true;
    }
    pointInFrustum(x, y, z) {
        // sphere of radius 0 => point
        return this.sphereInFrustum(x, y, z, 0);
    }
    cubeInFrustumVec3(center, inSize) {
        return this.cubeInFrustum(center[0], center[1], center[2], inSize);
    }
    cubeInFrustum(inX, inY, inZ, inSize) {
        const hSize = inSize * 0.5;
        const minX = inX - hSize;
        const minY = inY - hSize;
        const minZ = inZ - hSize;
        const maxX = inX + hSize;
        const maxY = inY + hSize;
        const maxZ = inZ + hSize;
        for (let ii = 0; ii < 6; ++ii) {
            const index = ii * 4;
            const planA = this._frustum[index + 0];
            const planB = this._frustum[index + 1];
            const planC = this._frustum[index + 2];
            const planD = this._frustum[index + 3];
            if (planA * minX + planB * minY + planC * minZ + planD > 0 ||
                planA * maxX + planB * minY + planC * minZ + planD > 0 ||
                planA * minX + planB * maxY + planC * minZ + planD > 0 ||
                planA * maxX + planB * maxY + planC * minZ + planD > 0 ||
                planA * minX + planB * minY + planC * maxZ + planD > 0 ||
                planA * maxX + planB * minY + planC * maxZ + planD > 0 ||
                planA * minX + planB * maxY + planC * maxZ + planD > 0 ||
                planA * maxX + planB * maxY + planC * maxZ + planD > 0) {
                continue;
            }
            return false;
        }
        return true;
    }
}

const _degreeToRad = (angle) => (angle * Math.PI) / 180;
var ProjectionType;
(function (ProjectionType) {
    ProjectionType[ProjectionType["perspective"] = 0] = "perspective";
    ProjectionType[ProjectionType["orthogonal"] = 1] = "orthogonal";
})(ProjectionType || (ProjectionType = {}));
class Camera {
    constructor() {
        this._projectionType = ProjectionType.perspective;
        this._viewportPos = fromValues(0, 0);
        this._viewportSize = fromValues(0, 0);
        this._projectionMatrix = create$4();
        this._viewMatrix = create$4();
        this._composedMatrix = create$4();
        this._eye = fromValues$2(0, 0, 0);
        this._target = fromValues$2(0, 0, 0);
        this._upAxis = fromValues$2(0, 0, 0);
    }
    //
    setAsPerspective(inData) {
        this._projectionType = ProjectionType.perspective;
        let aspectRatio = inData.aspectRatio;
        if (aspectRatio === undefined) {
            aspectRatio = this._viewportSize[0] / this._viewportSize[1];
        }
        this._perspectiveData = {
            fovy: inData.fovy,
            aspectRatio,
            near: inData.near,
            far: inData.far
        };
    }
    setAsOrthogonal(inData) {
        this._projectionType = ProjectionType.orthogonal;
        this._orthogonalData = Object.assign({}, inData);
    }
    //
    setViewportPos(width, height) {
        this._viewportPos[0] = width;
        this._viewportPos[1] = height;
    }
    getViewportPos() {
        return this._viewportPos;
    }
    //
    setViewportSize(width, height) {
        this._viewportSize[0] = width;
        this._viewportSize[1] = height;
        if (this._projectionType !== ProjectionType.perspective &&
            this._perspectiveData) {
            this._perspectiveData.aspectRatio =
                this._viewportSize[0] / this._viewportSize[1];
        }
    }
    getViewportSize() {
        return this._viewportSize;
    }
    //
    lookAt(inEye, inTarget, inUpAxis) {
        copy(this._eye, inEye);
        copy(this._target, inTarget);
        copy(this._upAxis, inUpAxis);
    }
    //
    setEye(inEye) {
        copy(this._eye, inEye);
    }
    setTarget(inTarget) {
        copy(this._target, inTarget);
    }
    setUpAxis(inUpAxis) {
        copy(this._upAxis, inUpAxis);
    }
    getEye() {
        return this._eye;
    }
    getTarget() {
        return this._target;
    }
    getUpAxis() {
        return this._upAxis;
    }
    //
    computeMatrices() {
        if (this._projectionType === ProjectionType.perspective) {
            const { fovy, aspectRatio, near, far } = this._perspectiveData;
            perspective(this._projectionMatrix, _degreeToRad(fovy), aspectRatio, near, far);
        }
        else if (this._projectionType === ProjectionType.orthogonal) {
            const { left, right, top, bottom, near, far } = this._orthogonalData;
            ortho(this._projectionMatrix, left, right, top, bottom, near, far);
        }
        lookAt(this._viewMatrix, this._eye, this._target, this._upAxis);
        this.computeComposedMatrix();
    }
    computeComposedMatrix() {
        multiply(this._composedMatrix, this._projectionMatrix, this._viewMatrix);
    }
    setProjectionMatrix(inMat4) {
        copy$1(this._projectionMatrix, inMat4);
    }
    setViewMatrix(inMat4) {
        copy$1(this._viewMatrix, inMat4);
    }
    setComposedMatrix(inMat4) {
        copy$1(this._composedMatrix, inMat4);
    }
    getProjectionMatrix() {
        return this._projectionMatrix;
    }
    getViewMatrix() {
        return this._viewMatrix;
    }
    getComposedMatrix() {
        return this._composedMatrix;
    }
    //
    getPerspectiveData() {
        if (this._projectionType !== ProjectionType.perspective) {
            throw new Error('not a perspective projection');
        }
        return this._perspectiveData;
    }
    getOrthogonalData() {
        if (this._projectionType !== ProjectionType.orthogonal) {
            throw new Error('not an orthogonal projection');
        }
        return this._orthogonalData;
    }
}

var chunksRendererVertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;
uniform float u_sceneScale;
uniform float u_tileRepeat;

in vec3 a_vertex_position;
in vec3 a_vertex_normal;
in vec3 a_offset_origin;

out vec3 v_chunkSpacePosition;
out vec3 v_worldSpacePosition;
out vec3 v_worldSpaceNormal;

void main(void)
{
  vec3 chunkSpacePosition = a_vertex_position * u_sceneScale;

  v_chunkSpacePosition = a_vertex_position * u_tileRepeat;
  v_worldSpacePosition = a_offset_origin + chunkSpacePosition;
  v_worldSpaceNormal = a_vertex_normal;

  gl_Position = u_composedMatrix * vec4(v_worldSpacePosition, 1.0);
}
`.trim();

var chunksRendererFragment = `
#version 300 es

precision lowp float;

const float k_ambiantCoef = 0.1;
const vec3 k_specColor = vec3(1.0, 1.0, 1.0);

uniform sampler2D u_texture_dirt;
uniform sampler2D u_texture_grass;
uniform sampler2D u_texture_stoneWall;
uniform sampler2D u_texture_stoneWallBump;
uniform vec3 u_eyePosition;

in vec3 v_chunkSpacePosition;
in vec3 v_worldSpacePosition;
in vec3 v_worldSpaceNormal;

out vec4 o_color;

vec4 _getColorValue()
{

  // current 3d texture coordinate
  vec3 flooredPos = vec3(
    v_chunkSpacePosition.x - floor(v_chunkSpacePosition.x),
    v_chunkSpacePosition.y - floor(v_chunkSpacePosition.y),
    v_chunkSpacePosition.z - floor(v_chunkSpacePosition.z)
  );

  vec3 blendWeights = abs( normalize( v_worldSpaceNormal.xyz ) );
  blendWeights = max( ( blendWeights - 0.2 ) * 7.0, 0.0 );
  blendWeights /= ( blendWeights.x + blendWeights.y + blendWeights.z );

  // horizontal texture coordinates -> should be a wall
  vec2 texCoordX = vec2(flooredPos.y, flooredPos.z);
  vec2 texCoordY = vec2(flooredPos.x, flooredPos.z);

  // vertical texture coord -> should be green grass
  vec2 texCoordZ = vec2(flooredPos.x, flooredPos.y);

  // horizontal color
  vec3 texColorX = texture( u_texture_stoneWall, texCoordX ).rgb;
  vec3 texColorY = texture( u_texture_stoneWall, texCoordY ).rgb;

  float specularRatioX = texture( u_texture_stoneWallBump, texCoordX ).r * blendWeights.x;
  float specularRatioY = texture( u_texture_stoneWallBump, texCoordY ).r * blendWeights.y;
  float specularRatio = max( specularRatioX, specularRatioY );

  // vertical color
  vec3 texColorZ = vec3(0.0);
  if (v_worldSpaceNormal.z < 0.0)
  {
    texColorZ = texture( u_texture_dirt, texCoordZ ).rgb;
  }
  else
  {
    texColorZ = texture( u_texture_grass, texCoordZ ).rgb;
  }

  return vec4(
    texColorX * blendWeights.xxx +
    texColorY * blendWeights.yyy +
    texColorZ * blendWeights.zzz,
    specularRatio
  );
}

vec3 _getLightColor(vec4 currentColor)
{
  vec3 normal = normalize(v_worldSpaceNormal);
  vec3 lightDir = normalize(u_eyePosition - v_worldSpacePosition);

  float diffuseCoef = max(dot(lightDir,v_worldSpaceNormal.xyz), 0.0);
  float specularCoef = 0.0;

  if (diffuseCoef > 0.0)
  {
    // specular

    vec3 reflectDir = reflect(-lightDir, normal);
    vec3 viewDir = normalize(u_eyePosition - v_worldSpacePosition);

    float specAngle = max(dot(reflectDir, viewDir), 0.0);
    specularCoef = pow(specAngle, 16.0);
  }

  vec3 diffuseColor = currentColor.rgb * (k_ambiantCoef + diffuseCoef);
  vec3 specularColor = k_specColor * specularCoef * currentColor.a;

  return diffuseColor + specularColor;
}

void main(void)
{
  o_color = vec4(_getLightColor(_getColorValue()), 1.0);
}
`.trim();

const { GeometryWrapper: GeometryWrapper$6, ShaderProgram: ShaderProgram$5, Texture: Texture$1 } = index;
class LiveGeometry {
    constructor(inShader, inGeometryDefinition, preAllocatedSize) {
        this._origin = fromValues$2(0, 0, 0);
        this._size = 0;
        this._geometry = new GeometryWrapper$6.Geometry(inShader, inGeometryDefinition);
        this._geometry.setFloatBufferSize(0, preAllocatedSize);
    }
    update(inOrigin, inSize, inBuffer, inBufferLength) {
        copy(this._origin, inOrigin);
        this._size = inSize;
        this._geometry.updateBuffer(0, inBuffer, inBufferLength);
        this._geometry.setPrimitiveCount(inBufferLength / 6);
        const newBuffer = new Float32Array([inOrigin[0], inOrigin[1], inOrigin[2]]);
        this._geometry.updateBuffer(1, newBuffer, newBuffer.length);
        this._geometry.setInstancedCount(1);
    }
    render() {
        this._geometry.render();
    }
    getOrigin() {
        return this._origin;
    }
    getSize() {
        return this._size;
    }
}
class ChunksRenderer {
    constructor() {
        this._textureDirt = new Texture$1();
        this._textureGrass = new Texture$1();
        this._textureStoneWall = new Texture$1();
        this._textureStoneWallBump = new Texture$1();
        this._unusedGeometries = [];
        this._inUseGeometries = [];
        this._shader = new ShaderProgram$5('ChunksRenderer', {
            vertexSrc: chunksRendererVertex,
            fragmentSrc: chunksRendererFragment,
            attributes: ['a_vertex_position', 'a_vertex_normal', 'a_offset_origin'],
            uniforms: [
                'u_composedMatrix',
                'u_eyePosition',
                'u_sceneScale',
                'u_tileRepeat',
                'u_texture_dirt',
                'u_texture_grass',
                'u_texture_stoneWall',
                'u_texture_stoneWallBump'
            ]
        });
        const geoBuilder = new GeometryWrapper$6.GeometryBuilder();
        geoBuilder
            .reset()
            .setPrimitiveType('triangles')
            .addVbo()
            .addVboAttribute('a_vertex_position', 'vec3f')
            .addVboAttribute('a_vertex_normal', 'vec3f')
            .setStride(6 * 4)
            .addVbo()
            .setVboAsDynamic()
            .setVboAsInstanced()
            .addVboAttribute('a_offset_origin', 'vec3f')
            .setStride(3 * 4);
        this._geometryDefinition = geoBuilder.getDef();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            const images = yield Promise.all([
                Texture$1.getImageFromUrl('assets/dirt.png'),
                Texture$1.getImageFromUrl('assets/grass.png'),
                Texture$1.getImageFromUrl('assets/stone-wall.png'),
                Texture$1.getImageFromUrl('assets/stone-wall-bump.png')
            ]);
            this._textureDirt.initialize();
            this._textureGrass.initialize();
            this._textureStoneWall.initialize();
            this._textureStoneWallBump.initialize();
            this._textureDirt.bind((bound) => bound.load(images[0]));
            this._textureGrass.bind((bound) => bound.load(images[1]));
            this._textureStoneWall.bind((bound) => bound.load(images[2]));
            this._textureStoneWallBump.bind((bound) => bound.load(images[3]));
        });
    }
    acquireGeometry(inSize) {
        if (this._unusedGeometries.length > 0) {
            const reusedGeom = this._unusedGeometries.pop();
            this._inUseGeometries.push(reusedGeom);
            return reusedGeom;
        }
        const newGeom = new LiveGeometry(this._shader, this._geometryDefinition, inSize);
        this._inUseGeometries.push(newGeom);
        return newGeom;
    }
    releaseGeometry(geom) {
        const index = this._inUseGeometries.indexOf(geom);
        if (index < 0)
            return;
        this._unusedGeometries.push(geom);
        this._inUseGeometries.splice(index, 1);
    }
    render(inCamera, inFrustumCulling, inChunkSize) {
        const eyePos = inCamera.getEye();
        this._shader.bind((boundShader) => {
            boundShader.setMatrix4Uniform('u_composedMatrix', inCamera.getComposedMatrix());
            boundShader.setFloat3Uniform('u_eyePosition', eyePos[0], eyePos[1], eyePos[2]);
            boundShader.setFloat1Uniform('u_sceneScale', inChunkSize);
            boundShader.setFloat1Uniform('u_tileRepeat', 2);
            boundShader.setTextureUniform('u_texture_dirt', this._textureDirt, 0);
            boundShader.setTextureUniform('u_texture_grass', this._textureGrass, 1);
            boundShader.setTextureUniform('u_texture_stoneWall', this._textureStoneWall, 2);
            boundShader.setTextureUniform('u_texture_stoneWallBump', this._textureStoneWallBump, 3);
            const toRender = this._inUseGeometries
                .map((geometry) => {
                const k_size = geometry.getSize();
                const k_hSize = k_size * 0.5;
                const centerX = geometry.getOrigin()[0] + k_hSize;
                const centerY = geometry.getOrigin()[1] + k_hSize;
                const centerZ = geometry.getOrigin()[2] + k_hSize;
                return {
                    geometry,
                    center: [centerX, centerY, centerZ],
                    distance: 0
                };
            })
                .filter(({ center, geometry }) => inFrustumCulling.cubeInFrustumVec3(center, geometry.getSize()))
                .map((sortableGeo) => {
                sortableGeo.distance = distance(sortableGeo.center, inCamera.getEye());
                return sortableGeo;
            })
                .sort((a, b) => a.distance - b.distance);
            toRender.forEach((sortableGeo) => sortableGeo.geometry.render());
            // this._inUseGeometries.forEach((geometry) => geometry.render());
        });
    }
}

var triangleCubesRendererVertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec3  a_vertex_position;

in vec3  a_offset_center;
in float a_offset_scale;
in vec4  a_offset_color;

flat out vec4 v_color;

void main(void)
{
  vec3 position = a_offset_center + a_vertex_position * a_offset_scale;

  gl_Position = u_composedMatrix * vec4(position, 1.0);

  v_color = a_offset_color;
}
`.trim();

var triangleCubesRendererFragment = `
#version 300 es

precision lowp float;

flat in vec4 v_color;

out vec4 out_color;

void main(void)
{
  out_color = v_color;
}
`.trim();

const { ShaderProgram: ShaderProgram$4, GeometryWrapper: GeometryWrapper$5 } = index;
const generateCubeVertices = (inOrigin, inSize) => {
    const vertices = [];
    const hSizeX = inSize[0] * 0.5;
    const hSizeY = inSize[1] * 0.5;
    const hSizeZ = inSize[2] * 0.5;
    const tmpVertices = [
        [inOrigin[0] - hSizeX, inOrigin[1] - hSizeY, inOrigin[2] - hSizeZ], // 0
        [inOrigin[0] + hSizeX, inOrigin[1] - hSizeY, inOrigin[2] - hSizeZ], // 1
        [inOrigin[0] - hSizeX, inOrigin[1] + hSizeY, inOrigin[2] - hSizeZ], // 2
        [inOrigin[0] + hSizeX, inOrigin[1] + hSizeY, inOrigin[2] - hSizeZ], // 3
        [inOrigin[0] - hSizeX, inOrigin[1] - hSizeY, inOrigin[2] + hSizeZ], // 4
        [inOrigin[0] + hSizeX, inOrigin[1] - hSizeY, inOrigin[2] + hSizeZ], // 5
        [inOrigin[0] - hSizeX, inOrigin[1] + hSizeY, inOrigin[2] + hSizeZ], // 6
        [inOrigin[0] + hSizeX, inOrigin[1] + hSizeY, inOrigin[2] + hSizeZ] // 7
    ];
    const indices = [];
    // -z 0123
    indices.push(0, 2, 1);
    indices.push(2, 3, 1);
    // +z 4567
    indices.push(4, 5, 6);
    indices.push(6, 5, 7);
    // +x 1357
    indices.push(1, 3, 5);
    indices.push(5, 3, 7);
    // -x 0246
    indices.push(0, 4, 2);
    indices.push(4, 6, 2);
    // +y 2367
    indices.push(2, 6, 3);
    indices.push(6, 7, 3);
    // -y 0145
    indices.push(0, 1, 4);
    indices.push(4, 1, 5);
    for (const index of indices) {
        vertices.push(tmpVertices[index]);
    }
    return vertices;
};
const generateWireFrameCubeVertices$1 = (inSize) => {
    const rectSize = 1 / 512;
    const rectPos = 0.5 - rectSize * 0.5;
    const vertices = [
        ...generateCubeVertices([inSize * -rectPos, inSize * -rectPos, 0], [rectSize, rectSize, 1.0]),
        ...generateCubeVertices([inSize * +rectPos, inSize * -rectPos, 0], [rectSize, rectSize, 1.0]),
        ...generateCubeVertices([inSize * +rectPos, inSize * +rectPos, 0], [rectSize, rectSize, 1.0]),
        ...generateCubeVertices([inSize * -rectPos, inSize * +rectPos, 0], [rectSize, rectSize, 1.0]),
        ...generateCubeVertices([inSize * -rectPos, 0, inSize * -rectPos], [rectSize, 1.0, rectSize]),
        ...generateCubeVertices([inSize * +rectPos, 0, inSize * -rectPos], [rectSize, 1.0, rectSize]),
        ...generateCubeVertices([inSize * +rectPos, 0, inSize * +rectPos], [rectSize, 1.0, rectSize]),
        ...generateCubeVertices([inSize * -rectPos, 0, inSize * +rectPos], [rectSize, 1.0, rectSize]),
        ...generateCubeVertices([0, inSize * -rectPos, inSize * -rectPos], [1.0, rectSize, rectSize]),
        ...generateCubeVertices([0, inSize * +rectPos, inSize * -rectPos], [1.0, rectSize, rectSize]),
        ...generateCubeVertices([0, inSize * +rectPos, inSize * +rectPos], [1.0, rectSize, rectSize]),
        ...generateCubeVertices([0, inSize * -rectPos, inSize * +rectPos], [1.0, rectSize, rectSize])
    ];
    const finalVertices = [];
    vertices.forEach((vertex) => {
        finalVertices.push(vertex[0], vertex[1], vertex[2]);
    });
    return finalVertices;
};
const k_bufferSize$4 = 8 * 1024 * 4;
class TriangleCubesRenderer {
    constructor() {
        this._buffer = new Float32Array(k_bufferSize$4);
        this._currentSize = 0;
        this._shader = new ShaderProgram$4('TriangleCubesRenderer', {
            vertexSrc: triangleCubesRendererVertex,
            fragmentSrc: triangleCubesRendererFragment,
            attributes: [
                'a_vertex_position',
                'a_offset_center',
                'a_offset_scale',
                'a_offset_color'
            ],
            uniforms: ['u_composedMatrix']
        });
        const geoBuilder = new GeometryWrapper$5.GeometryBuilder();
        geoBuilder
            .reset()
            .setPrimitiveType('triangles')
            .addVbo()
            .addVboAttribute('a_vertex_position', 'vec3f')
            .setStride(3 * 4)
            .addVbo()
            .setVboAsDynamic()
            .setVboAsInstanced()
            .addVboAttribute('a_offset_center', 'vec3f')
            .addVboAttribute('a_offset_scale', 'float')
            .addVboAttribute('a_offset_color', 'vec4f')
            .setStride(8 * 4);
        const vertices = generateWireFrameCubeVertices$1(1);
        this._geometry = new GeometryWrapper$5.Geometry(this._shader, geoBuilder.getDef());
        this._geometry.updateBuffer(0, vertices, vertices.length);
        this._geometry.setPrimitiveCount(vertices.length / 3);
        this._geometry.setFloatBufferSize(1, k_bufferSize$4);
    }
    pushCenteredCube(inCenter, inScale, inColor) {
        if (this._currentSize + 8 >= this._buffer.length) {
            return;
        }
        this._buffer[this._currentSize++] = inCenter[0];
        this._buffer[this._currentSize++] = inCenter[1];
        this._buffer[this._currentSize++] = inCenter[2];
        this._buffer[this._currentSize++] = inScale;
        this._buffer[this._currentSize++] = inColor[0];
        this._buffer[this._currentSize++] = inColor[1];
        this._buffer[this._currentSize++] = inColor[2];
        this._buffer[this._currentSize++] = inColor[3] || 1;
    }
    pushOriginBoundCube(inOrigin, inScale, inColor) {
        if (this._currentSize + 8 >= this._buffer.length) {
            return;
        }
        const hScale = inScale * 0.5;
        this._buffer[this._currentSize++] = inOrigin[0] + hScale;
        this._buffer[this._currentSize++] = inOrigin[1] + hScale;
        this._buffer[this._currentSize++] = inOrigin[2] + hScale;
        this._buffer[this._currentSize++] = inScale;
        this._buffer[this._currentSize++] = inColor[0];
        this._buffer[this._currentSize++] = inColor[1];
        this._buffer[this._currentSize++] = inColor[2];
        this._buffer[this._currentSize++] = inColor[3] || 1;
    }
    flush(inCamera) {
        if (this._currentSize <= 0) {
            return;
        }
        this._shader.bind((boundShader) => {
            boundShader.setMatrix4Uniform('u_composedMatrix', inCamera.getComposedMatrix());
            this._geometry.updateBuffer(1, this._buffer, this._currentSize);
            this._geometry.setInstancedCount(this._currentSize / 8);
            this._geometry.render();
        });
        this.clear();
    }
    clear() {
        // reset vertices
        this._currentSize = 0;
    }
}

var stackRendererVertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec3 a_vertex_position;
in vec4 a_vertex_color;

flat out vec4 v_color;

void main(void)
{
  gl_Position = u_composedMatrix * vec4(a_vertex_position, 1.0);

  v_color = a_vertex_color;
}
`.trim();

var stackRendererFragment = `
#version 300 es

precision lowp float;

flat in vec4 v_color;

out vec4 o_color;

void main(void)
{
  o_color = v_color;
}
`.trim();

const { GeometryWrapper: GeometryWrapper$4 } = index;
const k_bufferSize$3 = 14 * 1024;
class WireFramesStackRenderer {
    constructor(inShader, inGeometryDef) {
        this._buffer = new Float32Array(k_bufferSize$3);
        this._currentSize = 0;
        const geometryDef = Object.assign(Object.assign({}, inGeometryDef), { primitiveType: GeometryWrapper$4.PrimitiveType.lines });
        this._geometry = new GeometryWrapper$4.Geometry(inShader, geometryDef);
        this._geometry.setFloatBufferSize(0, k_bufferSize$3);
    }
    pushLine(inPointA, inPointB, inColor) {
        var _a;
        if (this._currentSize + 7 * 2 >= this._buffer.length)
            return;
        const alphaValue = (_a = inColor[3]) !== null && _a !== void 0 ? _a : 1;
        this._buffer[this._currentSize + 0] = inPointA[0];
        this._buffer[this._currentSize + 1] = inPointA[1];
        this._buffer[this._currentSize + 2] = inPointA[2];
        this._buffer[this._currentSize + 3] = inColor[0];
        this._buffer[this._currentSize + 4] = inColor[1];
        this._buffer[this._currentSize + 5] = inColor[2];
        this._buffer[this._currentSize + 6] = alphaValue;
        this._currentSize += 7;
        this._buffer[this._currentSize + 0] = inPointB[0];
        this._buffer[this._currentSize + 1] = inPointB[1];
        this._buffer[this._currentSize + 2] = inPointB[2];
        this._buffer[this._currentSize + 3] = inColor[0];
        this._buffer[this._currentSize + 4] = inColor[1];
        this._buffer[this._currentSize + 5] = inColor[2];
        this._buffer[this._currentSize + 6] = alphaValue;
        this._currentSize += 7;
    }
    canRender() {
        return this._currentSize > 0;
    }
    flush() {
        if (!this.canRender())
            return;
        this._geometry.updateBuffer(0, this._buffer, this._currentSize);
        this._geometry.setPrimitiveCount(this._currentSize / 7);
        this._geometry.render();
        this.clear();
    }
    clear() {
        // reset vertices
        this._currentSize = 0;
    }
}

const { GeometryWrapper: GeometryWrapper$3 } = index;
const k_bufferSize$2 = 7 * 1024;
class TrianglesStackRenderer {
    constructor(inShader, inGeometryDef) {
        this._buffer = new Float32Array(k_bufferSize$2);
        this._currentSize = 0;
        const geometryDef = Object.assign(Object.assign({}, inGeometryDef), { primitiveType: GeometryWrapper$3.PrimitiveType.triangles });
        this._geometry = new GeometryWrapper$3.Geometry(inShader, geometryDef);
        this._geometry.setFloatBufferSize(0, k_bufferSize$2);
    }
    pushTriangle(inPointA, inPointB, inPointC, inColor) {
        var _a;
        if (this._currentSize + 7 * 6 >= this._buffer.length) {
            return;
        }
        const alphaValue = (_a = inColor[3]) !== null && _a !== void 0 ? _a : 1;
        // 0
        this._buffer[this._currentSize + 0] = inPointA[0];
        this._buffer[this._currentSize + 1] = inPointA[1];
        this._buffer[this._currentSize + 2] = inPointA[2];
        this._buffer[this._currentSize + 3] = inColor[0];
        this._buffer[this._currentSize + 4] = inColor[1];
        this._buffer[this._currentSize + 5] = inColor[2];
        this._buffer[this._currentSize + 6] = alphaValue;
        this._currentSize += 7;
        // 2
        this._buffer[this._currentSize + 0] = inPointB[0];
        this._buffer[this._currentSize + 1] = inPointB[1];
        this._buffer[this._currentSize + 2] = inPointB[2];
        this._buffer[this._currentSize + 3] = inColor[0];
        this._buffer[this._currentSize + 4] = inColor[1];
        this._buffer[this._currentSize + 5] = inColor[2];
        this._buffer[this._currentSize + 6] = alphaValue;
        this._currentSize += 7;
        // 3
        this._buffer[this._currentSize + 0] = inPointC[0];
        this._buffer[this._currentSize + 1] = inPointC[1];
        this._buffer[this._currentSize + 2] = inPointC[2];
        this._buffer[this._currentSize + 3] = inColor[0];
        this._buffer[this._currentSize + 4] = inColor[1];
        this._buffer[this._currentSize + 5] = inColor[2];
        this._buffer[this._currentSize + 6] = alphaValue;
        this._currentSize += 7;
    }
    pushLine(inPointA, inPointB, thickness, inColor) {
        if (this._currentSize + 7 * 6 >= this._buffer.length) {
            return;
        }
        const diffX = inPointB[0] - inPointA[0];
        const diffY = inPointB[1] - inPointA[1];
        const angle = Math.atan2(diffY, diffX) + Math.PI * 0.5;
        const stepX = Math.cos(angle) * thickness * 0.5;
        const stepY = Math.sin(angle) * thickness * 0.5;
        this.pushTriangle([inPointA[0] - stepX, inPointA[1] - stepY, inPointA[2]], [inPointB[0] - stepX, inPointB[1] - stepY, inPointB[2]], [inPointB[0] + stepX, inPointB[1] + stepY, inPointB[2]], inColor);
        this.pushTriangle([inPointA[0] - stepX, inPointA[1] - stepY, inPointA[2]], [inPointB[0] + stepX, inPointB[1] + stepY, inPointB[2]], [inPointA[0] + stepX, inPointA[1] + stepY, inPointA[2]], inColor);
    }
    pushRotatedLine(center, angle, length, thickness, color) {
        this.pushLine([
            center[0] - length * Math.cos(angle),
            center[1] - length * Math.sin(angle),
            center[2]
        ], [
            center[0] + length * Math.cos(angle),
            center[1] + length * Math.sin(angle),
            center[2]
        ], thickness, color);
    }
    pushOriginBoundRectangle(inOrigin, inSize, inColor) {
        if (this._currentSize + 7 * 6 >= this._buffer.length) {
            return;
        }
        const maxCoord = [
            inOrigin[0] + inSize[0],
            inOrigin[1] + inSize[1]
        ];
        this.pushTriangle([inOrigin[0], inOrigin[1], inOrigin[2]], [maxCoord[0], maxCoord[1], inOrigin[2]], [inOrigin[0], maxCoord[1], inOrigin[2]], inColor);
        this.pushTriangle([inOrigin[0], inOrigin[1], inOrigin[2]], [maxCoord[0], inOrigin[1], inOrigin[2]], [maxCoord[0], maxCoord[1], inOrigin[2]], inColor);
    }
    pushCenteredRectangle(inCenter, inSize, inColor) {
        const origin = [
            inCenter[0] - inSize[0] * 0.5,
            inCenter[1] - inSize[1] * 0.5,
            inCenter[2]
        ];
        this.pushOriginBoundRectangle(origin, inSize, inColor);
    }
    canRender() {
        return this._currentSize > 0;
    }
    flush() {
        if (!this.canRender()) {
            return;
        }
        this._geometry.updateBuffer(0, this._buffer, this._currentSize);
        this._geometry.setPrimitiveCount(this._currentSize / 7);
        this._geometry.render();
        this.clear();
    }
    clear() {
        // reset vertices
        this._currentSize = 0;
    }
}

const { ShaderProgram: ShaderProgram$3, GeometryWrapper: GeometryWrapper$2 } = index;
class StackRenderers {
    constructor() {
        this._shader = new ShaderProgram$3('StackRenderers', {
            vertexSrc: stackRendererVertex,
            fragmentSrc: stackRendererFragment,
            attributes: ['a_vertex_position', 'a_vertex_color'],
            uniforms: ['u_composedMatrix']
        });
        const geoBuilder = new GeometryWrapper$2.GeometryBuilder();
        geoBuilder
            .reset()
            .setPrimitiveType('lines')
            .addVbo()
            .addVboAttribute('a_vertex_position', 'vec3f')
            .addVboAttribute('a_vertex_color', 'vec4f')
            .setStride(7 * 4);
        this._wireFramesStackRenderer = new WireFramesStackRenderer(this._shader, geoBuilder.getDef());
        this._trianglesStackRenderer = new TrianglesStackRenderer(this._shader, geoBuilder.getDef());
    }
    pushLine(inPointA, inPointB, inColor) {
        this._wireFramesStackRenderer.pushLine(inPointA, inPointB, inColor);
    }
    pushCross(inCenter, inSize, inColor) {
        const crossVertices = [
            [inCenter[0] - inSize, inCenter[1], inCenter[2]],
            [inCenter[0] + inSize, inCenter[1], inCenter[2]],
            [inCenter[0], inCenter[1] - inSize, inCenter[2]],
            [inCenter[0], inCenter[1] + inSize, inCenter[2]],
            [inCenter[0], inCenter[1], inCenter[2] - inSize],
            [inCenter[0], inCenter[1], inCenter[2] + inSize]
        ];
        const crossIndices = [0, 1, 2, 3, 4, 5];
        for (let ii = 0; ii < crossIndices.length; ii += 2) {
            const vertexA = crossVertices[ii + 0];
            const vertexB = crossVertices[ii + 1];
            this._wireFramesStackRenderer.pushLine(vertexA, vertexB, inColor);
        }
    }
    pushThickLine(inPointA, inPointB, thickness, inColor) {
        this._trianglesStackRenderer.pushLine(inPointA, inPointB, thickness, inColor);
    }
    pushRotatedLine(center, angle, length, thickness, color) {
        this._trianglesStackRenderer.pushRotatedLine(center, angle, length, thickness, color);
    }
    pushOriginBoundRectangle(inOrigin, inSize, inColor) {
        this._trianglesStackRenderer.pushOriginBoundRectangle(inOrigin, inSize, inColor);
    }
    pushCenteredRectangle(inCenter, inSize, inColor) {
        this._trianglesStackRenderer.pushCenteredRectangle(inCenter, inSize, inColor);
    }
    pushTriangle(inPosA, inPosB, inPosC, inColor) {
        this._trianglesStackRenderer.pushTriangle(inPosA, inPosB, inPosC, inColor);
    }
    flush(composedMatrix) {
        if (!this._wireFramesStackRenderer.canRender() &&
            !this._trianglesStackRenderer.canRender()) {
            return;
        }
        this._shader.bind((boundShader) => {
            boundShader.setMatrix4Uniform('u_composedMatrix', composedMatrix);
            this._wireFramesStackRenderer.flush();
            this._trianglesStackRenderer.flush();
        });
    }
    clear() {
        this._wireFramesStackRenderer.clear();
        this._trianglesStackRenderer.clear();
    }
}

var textRendererVertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec2 a_vertex_position;
in vec2 a_vertex_texCoord;
in vec3 a_offset_position;
in vec2 a_offset_texCoord;
in vec3 a_offset_color;
in float a_offset_scale;

out vec2 v_texCoord;
flat out vec3 v_color;

void main(void)
{
  vec3 position = vec3(a_vertex_position, 0.0) * a_offset_scale + a_offset_position;

  gl_Position = u_composedMatrix * vec4(position, 1.0);

  v_texCoord = a_vertex_texCoord + a_offset_texCoord;
  v_color = a_offset_color;
}
`.trim();

var textRendererFragment = `
#version 300 es

precision mediump float;

uniform sampler2D u_texture;

in vec2 v_texCoord;
flat in vec3 v_color;

out vec4 o_color;

void main(void)
{
  vec4 textureColor = texture(u_texture, v_texCoord);
  if (textureColor.a < 0.5)
  {
    discard;
  }
  else
  {
    o_color = vec4(v_color, textureColor.a);
  }
}
`.trim();

const asciiTextureHex = '7e7e28fd03fd07fe04fe0aff02ff7e4dfd0cfd03fd07fe04fe0aff02ff1afc0dfd10fc08fc0ffe55ff15fb0bfd03fd07fe04fe08f707fd04ff07fe02fe0cfd0ffd0cfd0aff03fe03ff0afe44fe15fb0bfd03fd04f204f607fd03fe07fe02fe0cfd0efd0efd0aff02fe02ff0bfe43fd15fb0cfe03fe05f204fe01ff02ff0afd02fd07fe02fe0bfd0efd10fd0afa0cfe42fd16fb1bfe04fe07fe01ff02ff0efd09fc1cfd12fd09fa0cfe41fd17fb1bfe04fe07f70bfd0afc04ff17fd12fd06f405f616f61cfd19fd1cfe04fe08f709fd0bfb02fe17fd12fd06f405f616f61bfd1afd1cfe04fe0aff02ff01fe08fd0bfe02fa17fd12fd09fa0cfe3efd37f207ff02ff01fe07fd02fd07fe03fc19fd10fd0afa0cfe3dfd38f204f607fe03fd07fe03fd1bfd0efd0aff02fe02ff0bfe0cfd1dfd0dfd1dfd1cfe04fe07f708ff04fd07fe02fb1bfd0cfd0aff03fe03ff0afe0cfd1dfd0cfd1efd1cfe04fe0aff02ff1afb02fe1bfc08fc0ffe1cfd1dfd0bfd1ffd1cfe04fe0aff02ff7afd7e7e7e7e7e7e0efd17fd10fc0af80bfe0bf909f90dfd08f609fb08f506f808f82cfd19fd0df807fd04fd0afe0afd03fd07fd03fd0bfc08fd0ffd0bfd05fd05fd04fd06fd04fd2afd1bfd0bfc02fc06fd03fc09fd0afd04fd06fd04fd09fb08fd0efd0cfd05fd05fd04fd06fd04fd09fd0cfd0efd1dfd0afe05fd06fd02fb06fa11fd0dfd08fe01fd08fd0dfd0dfd05fd05fd04fd06fd04fd09fd0cfd0dfd0af409fd10fd06fd02fb06fa10fd0dfd08fe02fd08fd0dfd15fd05fb02fd06fd04fd09fd0cfd0cfd0bf40afd0efd07fd01fe01fd09fd0ffd0bfb08fe03fd08f808f70efd08fa08f626fd23fd0cfd08fd01fe01fd09fd0efd0cfb08f606f707f60cfd09fa09f726fd23fd0bfd09fb02fd09fd0dfd10fd07f60cfc06fd04fd0bfd08fd02fb0dfd09fd0cfd0cfd0bf40afd0cfd09fb02fd09fd0cfd12fd0bfd0ffd06fd04fd0afd09fd04fd0dfd09fd0cfd0dfd0af409fd19fc03fd09fd0bfd03fd06fd04fd0bfd08fd04fd06fd04fd09fd0afd04fd0cfd0afd0cfd0efd1dfd1afd04fd09fd0afd04fd06fd03fd0cfd08fd03fd07fd04fd09fd0afd04fd0bfd19fd10fd1bfd0ffd0af807f707f607f90bf907f909f80afd0bf809fb2efd19fd10fd7e51fd17fd11fd7e7e7e7e13f87e78fd05fd08fc09f709f907f808f606f608f907fd03fd07f90df905fc03fd06fb0bfd05fd05fd05fd08fb08fd05fd07fa09fd03fd07fd03fd07fd02fd08fd04fe07fd04fe07fd03fd06fd03fd09fd11fd08fd03fd07fd0cfc03fc05fd05fd07fd01fd07fd05fd06fd02fd08fd03fd06fd04fd07fd03fd07fd05ff07fd05ff06fd04fd06fd03fd09fd11fd08fd02fd08fd0cfb01fb05fc04fd06fd03fd06fd05fd05fd04fd07fd03fd06fd0efd03fd07fd0dfd0cfd04fd06fd03fd09fd11fd08fd01fd09fd0cf505fb03fd05fd05fd05fd02fa05fd04fd07fd03fd06fd0efd03fd07fd03fe08fd03fe07fd0dfd03fd09fd11fd08fa0afd0cf505fa02fd05fd05fd05fd02fa05fd04fd07f807fd0efd03fd07f808f807fd0df709fd11fd08fb0bfd0cfd01fd01fd05fd01fd01fd05fd05fd05fd02fa05fd04fd07f807fd0efd03fd07f808f807fd0df709fd11fd08fb0bfd0cfd02ff02fd05fd02fa05fd05fd05fd02fa05f607fd03fd06fd0efd03fd07fd03fe08fd03fe07fd02fb06fd03fd09fd0bfd03fd08fa0afd0cfd05fd05fd03fb05fd05fd05fd0dfd04fd07fd03fd06fd0efd03fd07fd0dfd0cfd04fd06fd03fd09fd0bfd03fd08fd01fd09fd05ff06fd05fd05fd04fc05fd05fd05fd0dfd04fd07fd03fd06fd04fd07fd03fd07fd05ff07fd0cfd04fd06fd03fd09fd0bfd03fd08fd02fd08fd04fe06fd05fd05fd05fd06fd03fd06fd0dfd04fd07fd03fd07fd03fd07fd02fd08fd04fe07fd0dfd03fd06fd03fd09fd0bfd03fd08fd03fd07fd03fd06fd05fd05fd05fd07fd01fd07fd0dfd04fd06f709f907f808f606fb0df806fd03fd07f90af908fc03fd06f606fd05fd05fd05fd08fb0af87e7e7e7e7e7e7e68fe1af70afb08f708f807f505fd03fd07fd03fd07fd05fd05fd03fd07fd03fd07f608f907ff11f90afc1afd03fd07fc01fc07fd03fd06fd04fd06fe02fd02fe05fd03fd07fd03fd07fd05fd05fd03fd07fd03fd07fd04fd08fd0bfe14fd09fa19fd03fd07fd03fd07fd03fd06fd04fd06ff03fd03ff05fd03fd07fd03fd07fd05fd05fd03fd07fd03fd07fe05fd08fd0bfd13fd08fd02fd18fd03fd06fd05fd06fd03fd06fd04fd0afd09fd03fd07fd03fd07fd05fd06fd01fd08fd03fd07ff05fd09fd0cfd12fd07fd04fd17fd03fd06fd05fd06fd03fd06fd11fd09fd03fd07fd03fd07fd05fd07fb09fd03fd0cfd0afd0dfd11fd28f807fd05fd06f808f90cfd09fd03fd07fd03fd07fd02ff02fd08fd0bfd01fd0cfd0bfd0efd10fd28f807fd05fd06f809f90bfd09fd03fd07fd03fd07fd02ff02fd08fd0cfb0cfd0cfd0ffd0ffd28fd0cfd03fb06fd02fd0efd0afd09fd03fd07fd03fd07fd02ff02fd07fb0cfd0cfd0dfd10fd0efd28fd0cfd02fa06fd03fd06fd04fd0afd09fd03fd07fd03fd08f707fd01fd0bfd0bfd05ff08fd11fd0dfd28fd0df707fd03fd06fd04fd0afd09fd03fd08fd01fd09fc01fc06fd03fd0afd0afd05fe08fd12fd0cfd28fd0df707fd03fd06fd04fd0afd09fd03fd09fb0bfd01fd07fd03fd0afd0afd04fd08fd13fd0bfd27fb12fd06fc03fd07f809f908f90bfd0cfd01fd07fd03fd08f908f608f910fd06f93cfa7e54f07e72f07e7e7e7e0bfd1dfc21fb19fb18fc10fd0ffd07fc0dfa39fd1efd22fd19fd01fd18fd10fd0ffd08fd10fd3bfd1cfd22fd19fd01fd18fd10fd0ffd08fd10fd3bfd1cfd22fd19fd1cfd2dfd10fd4af909f808f909f808f90afd0cfb02fe07fd01fc08fa0cfa08fd03fd0afd09f606f809f91efd08fd03fd06fd03fd07fd03fd07fd03fd07f808fd03fd08fc02fd0afd0ffd08fd02fd0bfd09fd02ff02fd05fd03fd07fd03fd1dfd08fd03fd06fd03fd07fd03fd07fd03fd07f808fd03fd08fc02fd0afd0ffd08fd01fd0cfd09fd02ff02fd05fd03fd07fd03fd18f808fd03fd06fd0dfd03fd07f709fd0bfd03fd08fd03fd0afd0ffd08fa0dfd09fd02ff02fd05fd03fd07fd03fd17fd03fd08fd03fd06fd0dfd03fd07fd0ffd0bfd03fd08fd03fd0afd0ffd08fd01fd0cfd09fd02ff02fd05fd03fd07fd03fd17fd03fd08fd03fd06fd03fd07fd03fd07fd03fd09fd0cf808fd03fd0afd0ffd08fd02fd0bfd09fd02ff02fd05fd03fd07fd03fd17fd03fd08fd03fd06fd03fd07fd03fd07fd03fd09fd0df908fd03fd0afd0ffd08fd03fd0afd09fd02ff02fd05fd03fd07fd03fd18fb02fe06fe02fb08f909fb02fe07f908f90ffd07fc03fd07f706fd03fd07fc03fd07f706fd05fd05fd03fd08f978fd03fd27fd03fd7e4af92afa7e7e7e7e7e7e18fa09fc09fa1efe4eff6efd0dfc0dfd1cfc4cfe6efd0dfc0dfd1bfa4afd6efd0dfc0dfd1afd02fd07fe02fb07fb02fe07fc02fd08f908f707fd03fd07fd03fd07fd05fd05fd02fd09fd03fd06f80afd0efc0efd08fb03fd05fd04fd07fd03fd05fd03fd09f706fd04fe09fd0bfd03fd07fd03fd07fd05fd05fd02fd09fd03fd06fe03fd08fd24fd05fd01fd02fd05fe06fe07fd03fd05fd03fd09fc02fd06fd04fe09fd0bfd03fd07fd03fd07fd05fd06fa0afd03fd06ff03fd09fd24fd05fd02fd01fd05fe06fe07fd03fd05fd03fd09fd0dfb0cfd0bfd03fd07fd03fd07fd02ff02fd07fc0bfd03fd09fd0cfd0efc0efd07fd03fb06fe06fe07fd03fd05fd03fd09fd0ffb0afd0bfd03fd07fd03fd07fd02ff02fd07fc0bfd03fd08fd0efd0dfc0dfd19fe06fe07fd03fd05fd03fd09fd0cfe04fd09fd01fd07fd03fd08fd01fd09fc01fc07fa0bf908fd03ff0bfd0dfc0dfd19fe06fe07f807f809fd0cfe04fd09fd01fd07fd03fd09fb0bfd01fd07fd02fd0bfb08fd03fe0bfd0dfc0dfd19f607fd11fd08fb0cf90bfb09fb02fe09fd0cfd01fd07fd02fd0dfd08f80cfa09fc09fa1af607fd11fd7cfd69fb0ffb77fa';

const { GeometryWrapper: GeometryWrapper$1, ShaderProgram: ShaderProgram$2, Texture } = index;
const k_gridSize = [16, 6];
const k_texCoord = [1 / k_gridSize[0], 1 / k_gridSize[1]];
const k_bufferSize$1 = 9 * 1024 * 4;
class TextRenderer {
    constructor() {
        this._texture = new Texture();
        this._buffer = new Float32Array(k_bufferSize$1);
        this._currentSize = 0;
        this._textScale = 14;
        this._textColor = [1, 1, 1];
        this._horizontalTextAlign = 'left';
        this._verticalTextAlign = 'top';
        this._shader = new ShaderProgram$2('TextRenderer', {
            vertexSrc: textRendererVertex,
            fragmentSrc: textRendererFragment,
            attributes: [
                'a_vertex_position',
                'a_vertex_texCoord',
                'a_offset_position',
                'a_offset_texCoord',
                'a_offset_color',
                'a_offset_scale'
            ],
            uniforms: ['u_composedMatrix', 'u_texture']
        });
        const geoBuilder = new GeometryWrapper$1.GeometryBuilder();
        geoBuilder
            .reset()
            .setPrimitiveType('triangles')
            .addVbo()
            .addVboAttribute('a_vertex_position', 'vec2f')
            .addVboAttribute('a_vertex_texCoord', 'vec2f')
            .setStride(4 * 4)
            .addVbo()
            .setVboAsDynamic()
            .setVboAsInstanced()
            .addVboAttribute('a_offset_position', 'vec3f')
            .addVboAttribute('a_offset_texCoord', 'vec2f')
            .addVboAttribute('a_offset_color', 'vec3f')
            .addVboAttribute('a_offset_scale', 'float')
            .setStride(9 * 4);
        this._geometry = new GeometryWrapper$1.Geometry(this._shader, geoBuilder.getDef());
        const vertices = [
            {
                position: [+0.5, -0.5],
                texCoord: [k_texCoord[0] * 1, k_texCoord[1] * 1]
            },
            {
                position: [-0.5, -0.5],
                texCoord: [k_texCoord[0] * 0, k_texCoord[1] * 1]
            },
            {
                position: [+0.5, +0.5],
                texCoord: [k_texCoord[0] * 1, k_texCoord[1] * 0]
            },
            {
                position: [-0.5, +0.5],
                texCoord: [k_texCoord[0] * 0, k_texCoord[1] * 0]
            }
        ];
        const indices = [1, 0, 2, 1, 2, 3];
        const letterVertices = [];
        for (const index of indices) {
            const vertex = vertices[index];
            letterVertices.push(vertex.position[0], vertex.position[1], vertex.texCoord[0], vertex.texCoord[1]);
        }
        this._geometry.updateBuffer(0, letterVertices, letterVertices.length);
        this._geometry.setPrimitiveCount(letterVertices.length / 4);
        this._geometry.setFloatBufferSize(1, k_bufferSize$1);
        this._texCoordMap = new Map([
            [' ', [0 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['!', [1 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['"', [2 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['#', [3 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['$', [4 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['%', [5 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['&', [6 * k_texCoord[0], 0 * k_texCoord[1]]],
            ["'", [7 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['(', [8 * k_texCoord[0], 0 * k_texCoord[1]]],
            [')', [9 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['*', [10 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['+', [11 * k_texCoord[0], 0 * k_texCoord[1]]],
            [',', [12 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['-', [13 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['.', [14 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['/', [15 * k_texCoord[0], 0 * k_texCoord[1]]],
            ['0', [0 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['1', [1 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['2', [2 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['3', [3 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['4', [4 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['5', [5 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['6', [6 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['7', [7 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['8', [8 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['9', [9 * k_texCoord[0], 1 * k_texCoord[1]]],
            [':', [10 * k_texCoord[0], 1 * k_texCoord[1]]],
            [';', [11 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['<', [12 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['=', [13 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['>', [14 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['?', [15 * k_texCoord[0], 1 * k_texCoord[1]]],
            ['@', [0 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['A', [1 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['B', [2 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['C', [3 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['D', [4 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['E', [5 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['F', [6 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['G', [7 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['H', [8 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['I', [9 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['J', [10 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['K', [11 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['L', [12 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['M', [13 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['N', [14 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['O', [15 * k_texCoord[0], 2 * k_texCoord[1]]],
            ['P', [0 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['Q', [1 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['R', [2 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['S', [3 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['T', [4 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['U', [5 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['V', [6 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['W', [7 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['X', [8 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['Y', [9 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['Z', [10 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['[', [11 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['\\', [12 * k_texCoord[0], 3 * k_texCoord[1]]],
            [']', [13 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['^', [14 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['_', [15 * k_texCoord[0], 3 * k_texCoord[1]]],
            ['`', [0 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['a', [1 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['b', [2 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['c', [3 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['d', [4 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['e', [5 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['f', [6 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['g', [7 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['h', [8 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['i', [9 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['j', [10 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['k', [11 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['l', [12 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['m', [13 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['n', [14 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['o', [15 * k_texCoord[0], 4 * k_texCoord[1]]],
            ['p', [0 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['q', [1 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['r', [2 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['s', [3 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['t', [4 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['u', [5 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['v', [6 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['w', [7 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['x', [8 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['y', [9 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['z', [10 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['{', [11 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['|', [12 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['}', [13 * k_texCoord[0], 5 * k_texCoord[1]]],
            ['~', [14 * k_texCoord[0], 5 * k_texCoord[1]]]
        ]);
        const width = 256;
        const height = 96;
        const imagePixels = new Uint8Array(width * height * 4);
        {
            let index = 0;
            for (let ii = 0; ii < asciiTextureHex.length; ii += 2) {
                let currSize = parseInt(`${asciiTextureHex.substring(ii, ii + 2)}000000`, 16) >> 24;
                let currVal = 0;
                if (currSize < 0) {
                    currSize = -currSize;
                    currVal = 255;
                }
                for (let ii = 0; ii < currSize; ++ii) {
                    imagePixels[index * 4 + 0] = currVal;
                    imagePixels[index * 4 + 1] = currVal;
                    imagePixels[index * 4 + 2] = currVal;
                    imagePixels[index * 4 + 3] = currVal;
                    ++index;
                }
            }
        }
        this._texture.initialize();
        this._texture.bind((boundTexture) => {
            boundTexture.loadFromMemory(width, height, imagePixels);
        });
    }
    setTextAlign(inHorizontalTextAlign, inVerticalTextAlign) {
        this._horizontalTextAlign = inHorizontalTextAlign;
        this._verticalTextAlign = inVerticalTextAlign;
        return this;
    }
    setTextScale(inScale) {
        this._textScale = inScale;
        return this;
    }
    setTextColor(inRed, inGreen, inBlue) {
        this._textColor[0] = inRed;
        this._textColor[1] = inGreen;
        this._textColor[2] = inBlue;
        return this;
    }
    pushText(inMessage, inPosition) {
        //
        // validate
        //
        if (inMessage.length === 0) {
            return this;
        }
        if (this._textScale <= 0) {
            return this;
        }
        const allLineWidth = [0];
        for (let ii = 0; ii < inMessage.length; ++ii) {
            if (inMessage[ii] == '\n') {
                allLineWidth.push(0);
            }
            else {
                allLineWidth[allLineWidth.length - 1] += 1;
            }
        }
        if (allLineWidth.length === 0) {
            return this;
        }
        // for (const currLine of allLineWidth) {
        //   if (currLine === 0) {
        //     return this;
        //   }
        // }
        let lineIndex = 0;
        const currPos = [0, 0];
        //
        // pre process
        //
        const hScale = this._textScale * 0.5;
        switch (this._horizontalTextAlign) {
            case 'left':
                currPos[0] = inPosition[0];
                break;
            case 'centered':
                currPos[0] = inPosition[0] - allLineWidth[lineIndex] * hScale + hScale;
                break;
            case 'right':
                currPos[0] =
                    inPosition[0] -
                        allLineWidth[lineIndex] * this._textScale +
                        this._textScale;
                break;
        }
        switch (this._verticalTextAlign) {
            case 'top':
                currPos[1] = inPosition[1];
                break;
            case 'centered':
                currPos[1] = inPosition[1] + allLineWidth.length * hScale - hScale;
                break;
            case 'bottom':
                currPos[1] =
                    inPosition[1] - (allLineWidth.length - 1) * this._textScale;
                break;
        }
        //
        // process
        //
        for (let ii = 0; ii < inMessage.length; ++ii) {
            const letter = inMessage[ii];
            if (letter == '\n') {
                lineIndex += 1;
                // go back
                switch (this._horizontalTextAlign) {
                    case 'left':
                        currPos[0] = inPosition[0];
                        break;
                    case 'centered':
                        currPos[0] =
                            inPosition[0] - allLineWidth[lineIndex] * hScale + hScale;
                        break;
                    case 'right':
                        currPos[0] =
                            inPosition[0] -
                                allLineWidth[lineIndex] * this._textScale +
                                this._textScale;
                        break;
                }
                currPos[1] -= this._textScale; // go down
            }
            else {
                this._pushLetter(letter, currPos);
                // go right
                currPos[0] += this._textScale;
            }
        }
        return this;
    }
    _pushLetter(inCharacter, inPosition) {
        if (this._currentSize + 9 * 10 >= this._buffer.length) {
            return;
        }
        const texCoord = this._texCoordMap.get(inCharacter);
        if (!texCoord)
            throw new Error(`fail to find a letter, letter=${inCharacter}`);
        for (let yy = -1; yy <= 1; ++yy) {
            for (let xx = -1; xx <= 1; ++xx) {
                this._buffer[this._currentSize++] = inPosition[0] + 2 * xx;
                this._buffer[this._currentSize++] = inPosition[1] + 2 * yy;
                this._buffer[this._currentSize++] = -0.1;
                this._buffer[this._currentSize++] = texCoord[0];
                this._buffer[this._currentSize++] = texCoord[1];
                this._buffer[this._currentSize++] = 0; // blackColor
                this._buffer[this._currentSize++] = 0; // blackColor
                this._buffer[this._currentSize++] = 0; // blackColor
                this._buffer[this._currentSize++] = this._textScale;
            }
        }
        this._buffer[this._currentSize++] = inPosition[0];
        this._buffer[this._currentSize++] = inPosition[1];
        this._buffer[this._currentSize++] = 0.0;
        this._buffer[this._currentSize++] = texCoord[0];
        this._buffer[this._currentSize++] = texCoord[1];
        this._buffer[this._currentSize++] = this._textColor[0];
        this._buffer[this._currentSize++] = this._textColor[1];
        this._buffer[this._currentSize++] = this._textColor[2];
        this._buffer[this._currentSize++] = this._textScale;
    }
    flush(composedMatrix) {
        if (this._currentSize === 0) {
            return this;
        }
        this._shader.bind((boundShader) => {
            boundShader.setMatrix4Uniform('u_composedMatrix', composedMatrix);
            boundShader.setTextureUniform('u_texture', this._texture, 0);
            this._geometry.updateBuffer(1, this._buffer, this._currentSize);
            this._geometry.setInstancedCount(this._currentSize / 9);
            this._geometry.render();
        });
        Texture.unbind();
        this.clear();
        return this;
    }
    clear() {
        // reset vertices
        this._currentSize = 0;
        return this;
    }
}

var wireFrameCubesRendererVertex = `
#version 300 es

precision highp float;

uniform mat4 u_composedMatrix;

in vec3  a_vertex_position;

in vec3  a_offset_center;
in float a_offset_scale;
in vec4  a_offset_color;

flat out vec4 v_color;

void main(void)
{
  vec3 position = a_offset_center + a_vertex_position * a_offset_scale;

  gl_Position = u_composedMatrix * vec4(position, 1.0);

  v_color = a_offset_color;
}
`.trim();

var wireFrameCubesRendererFragment = `
#version 300 es

precision lowp float;

flat in vec4 v_color;

out vec4 out_color;

void main(void)
{
  out_color = v_color;
}
`.trim();

const { ShaderProgram: ShaderProgram$1, GeometryWrapper } = index;
const generateWireFrameCubeVertices = (inSize) => {
    const hSize = inSize * 0.5;
    const vertices = [];
    vertices.push([+hSize, +hSize, +hSize]);
    vertices.push([-hSize, +hSize, +hSize]);
    vertices.push([+hSize, -hSize, +hSize]);
    vertices.push([-hSize, -hSize, +hSize]);
    vertices.push([+hSize, +hSize, -hSize]);
    vertices.push([-hSize, +hSize, -hSize]);
    vertices.push([+hSize, -hSize, -hSize]);
    vertices.push([-hSize, -hSize, -hSize]);
    //
    const indices = [];
    indices.push(0, 1, 1, 3, 3, 2, 2, 0);
    indices.push(4, 5, 5, 7, 7, 6, 6, 4);
    indices.push(0, 4, 1, 5, 3, 7, 2, 6);
    //
    const finalVertices = [];
    for (let ii = 0; ii < indices.length; ++ii) {
        const vertex = vertices[indices[ii]];
        finalVertices.push(vertex[0], vertex[1], vertex[2]);
    }
    return finalVertices;
};
const k_bufferSize = 8 * 1024 * 4;
class WireFrameCubesRenderer {
    constructor() {
        this._buffer = new Float32Array(k_bufferSize);
        this._currentSize = 0;
        this._shader = new ShaderProgram$1('WireFrameCubesRenderer', {
            vertexSrc: wireFrameCubesRendererVertex,
            fragmentSrc: wireFrameCubesRendererFragment,
            attributes: [
                'a_vertex_position',
                'a_offset_center',
                'a_offset_scale',
                'a_offset_color'
            ],
            uniforms: ['u_composedMatrix']
        });
        const geoBuilder = new GeometryWrapper.GeometryBuilder();
        geoBuilder
            .reset()
            .setPrimitiveType('lines')
            .addVbo()
            .addVboAttribute('a_vertex_position', 'vec3f')
            .setStride(3 * 4)
            .addVbo()
            .setVboAsDynamic()
            .setVboAsInstanced()
            .addVboAttribute('a_offset_center', 'vec3f')
            .addVboAttribute('a_offset_scale', 'float')
            .addVboAttribute('a_offset_color', 'vec4f')
            .setStride(8 * 4);
        const vertices = generateWireFrameCubeVertices(1);
        this._geometry = new GeometryWrapper.Geometry(this._shader, geoBuilder.getDef());
        this._geometry.updateBuffer(0, vertices, vertices.length);
        this._geometry.setPrimitiveCount(vertices.length / 3);
        this._geometry.setFloatBufferSize(1, k_bufferSize);
    }
    pushCenteredCube(inCenter, inScale, inColor) {
        if (this._currentSize + 8 >= this._buffer.length) {
            return;
        }
        this._buffer[this._currentSize++] = inCenter[0];
        this._buffer[this._currentSize++] = inCenter[1];
        this._buffer[this._currentSize++] = inCenter[2];
        this._buffer[this._currentSize++] = inScale;
        this._buffer[this._currentSize++] = inColor[0];
        this._buffer[this._currentSize++] = inColor[1];
        this._buffer[this._currentSize++] = inColor[2];
        this._buffer[this._currentSize++] = inColor[3] || 1;
    }
    pushOriginBoundCube(inOrigin, inScale, inColor) {
        if (this._currentSize + 8 >= this._buffer.length) {
            return;
        }
        const hScale = inScale * 0.5;
        this._buffer[this._currentSize++] = inOrigin[0] + hScale;
        this._buffer[this._currentSize++] = inOrigin[1] + hScale;
        this._buffer[this._currentSize++] = inOrigin[2] + hScale;
        this._buffer[this._currentSize++] = inScale;
        this._buffer[this._currentSize++] = inColor[0];
        this._buffer[this._currentSize++] = inColor[1];
        this._buffer[this._currentSize++] = inColor[2];
        this._buffer[this._currentSize++] = inColor[3] || 1;
    }
    flush(composedMatrix) {
        if (this._currentSize <= 0) {
            return;
        }
        this._shader.bind((boundShader) => {
            boundShader.setMatrix4Uniform('u_composedMatrix', composedMatrix);
            this._geometry.updateBuffer(1, this._buffer, this._currentSize);
            this._geometry.setInstancedCount(this._currentSize / 8);
            this._geometry.render();
        });
        this.clear();
    }
    clear() {
        // reset vertices
        this._currentSize = 0;
    }
}

const { GlobalMouseManager: GlobalMouseManager$1, GlobalTouchManager: GlobalTouchManager$3 } = index$1;
const { WebGLContext: WebGLContext$1, ShaderProgram } = index;
class WebGLRenderer {
    constructor(def) {
        this._viewportSize = create();
        this._frustumCulling = new FrustumCulling();
        this._mainCamera = new Camera();
        this._mainHudCamera = new Camera();
        this.onContextLost = null;
        this.onContextRestored = null;
        this._def = def;
        this.resize(this._def.canvasDomElement.width, this._def.canvasDomElement.height);
        WebGLContext$1.initialize(this._def.canvasDomElement);
        const onContextLost = (event) => {
            event.preventDefault();
            console.log('context is lost');
            if (this.onContextLost) {
                this.onContextLost();
            }
        };
        const onContextRestored = () => {
            console.log('context is restored');
            WebGLContext$1.initialize(this._def.canvasDomElement);
            if (this.onContextRestored) {
                this.onContextRestored();
            }
        };
        this._def.canvasDomElement.addEventListener('webglcontextlost', onContextLost, false);
        this._def.canvasDomElement.addEventListener('webglcontextrestored', onContextRestored, false);
        this._scene = {
            chunksRenderer: new ChunksRenderer(),
            triangleCubesRenderer: new TriangleCubesRenderer()
        };
        this._hud = {
            textRenderer: new TextRenderer(),
            stackRenderers: new StackRenderers(),
            wireFrameCubesRenderer: new WireFrameCubesRenderer()
        };
    }
    resize(width, height) {
        this._viewportSize[0] = width;
        this._viewportSize[1] = height;
        this._mainCamera.setViewportSize(width, height);
        this._mainCamera.setAsPerspective({ fovy: 70, near: 0.1, far: 70 });
        this._mainHudCamera.setViewportSize(width, height);
        this._mainHudCamera.setAsOrthogonal({
            left: -width * 0.5,
            right: +width * 0.5,
            top: -height * 0.5,
            bottom: +height * 0.5,
            near: -200,
            far: 200
        });
        this._mainHudCamera.setEye([+width * 0.5, +height * 0.5, 1]);
        this._mainHudCamera.setTarget([+width * 0.5, +height * 0.5, 0]);
        this._mainHudCamera.setUpAxis([0, 1, 0]);
        this._mainHudCamera.computeMatrices();
    }
    //
    toggleContextLoss() {
        const gl = WebGLContext$1.getContext();
        const extensionLoseContext = WebGLContext$1.getExtensionLoseContext();
        if (extensionLoseContext) {
            if (gl.isContextLost()) {
                extensionLoseContext.restoreContext(); // restores the context
            }
            else {
                extensionLoseContext.loseContext(); // trigger a context loss
            }
        }
    }
    contextIsLost() {
        const gl = WebGLContext$1.getContext();
        return gl.isContextLost();
    }
    setOnContextLost(callback) {
        this.onContextLost = callback;
    }
    setOnContextRestored(callback) {
        this.onContextRestored = callback;
    }
    //
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const gl = WebGLContext$1.getContext();
            //
            //
            // init
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            // gl.clearDepth(1.0);
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            gl.disable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_COLOR);
            gl.activeTexture(gl.TEXTURE0);
            gl.enable(gl.CULL_FACE);
            yield this._scene.chunksRenderer.initialize();
        });
    }
    getSize() {
        return this._viewportSize;
    }
    lookAt(inEye, inTarget, inUpAxis) {
        this._mainCamera.setEye(inEye);
        this._mainCamera.setTarget(inTarget);
        this._mainCamera.setUpAxis(inUpAxis);
        this._mainCamera.computeMatrices();
    }
    update() {
        GlobalMouseManager$1.resetDeltas();
        GlobalTouchManager$3.resetDeltas();
        this._frustumCulling.calculateFrustum(this._mainCamera.getProjectionMatrix(), this._mainCamera.getViewMatrix());
    }
    renderScene(inChunkSize) {
        const gl = WebGLContext$1.getContext();
        const viewPos = this._mainCamera.getViewportPos();
        const viewSize = this._mainCamera.getViewportSize();
        gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //
        //
        //
        this._scene.chunksRenderer.render(this._mainCamera, this._frustumCulling, inChunkSize);
        //
        //
        //
        this._scene.triangleCubesRenderer.flush(this._mainCamera);
    }
    renderHUD() {
        const gl = WebGLContext$1.getContext();
        const viewPos = this._mainHudCamera.getViewportPos();
        const viewSize = this._mainHudCamera.getViewportSize();
        gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        ShaderProgram.unbind();
    }
    get mainCamera() {
        return this._mainCamera;
    }
    get hudCamera() {
        return this._mainHudCamera;
    }
    get wireFrameCubesRenderer() {
        return this._hud.wireFrameCubesRenderer;
    }
    get triangleCubesRenderer() {
        return this._scene.triangleCubesRenderer;
    }
    get stackRenderers() {
        return this._hud.stackRenderers;
    }
    get textRenderer() {
        return this._hud.textRenderer;
    }
    get frustumCulling() {
        return this._frustumCulling;
    }
    get chunksRenderer() {
        return this._scene.chunksRenderer;
    }
}

const { GlobalKeyboardManager: GlobalKeyboardManager$1, GlobalTouchManager: GlobalTouchManager$2, GlobalPointerLockManager: GlobalPointerLockManager$1 } = index$1;
const defaultColor = [0.2, 0.2, 0.2];
const activatedColor = [0.2, 0.6, 0.2];
const _addKeyStrokesWidgets = (inAllIndicator, inPos) => {
    inAllIndicator.push({
        center: [inPos[0], inPos[1]],
        size: [40, 40],
        text: 'A\nQ',
        color: GlobalKeyboardManager$1.isPressed('A', 'Q')
            ? activatedColor
            : defaultColor
    });
    inAllIndicator.push({
        center: [inPos[0] + 45 * 1, inPos[1]],
        size: [40, 40],
        text: 'S',
        color: GlobalKeyboardManager$1.isPressed('S') ? activatedColor : defaultColor
    });
    inAllIndicator.push({
        center: [inPos[0] + 45 * 1, inPos[1] + 45],
        size: [40, 40],
        text: 'W\nZ',
        color: GlobalKeyboardManager$1.isPressed('W', 'Z')
            ? activatedColor
            : defaultColor
    });
    inAllIndicator.push({
        center: [inPos[0] + 45 * 2, inPos[1]],
        size: [40, 40],
        text: 'D',
        color: GlobalKeyboardManager$1.isPressed('D') ? activatedColor : defaultColor
    });
};
const _addArrowStrokesWidgets = (inAllIndicator, inPos) => {
    // arrow left
    inAllIndicator.push({
        center: [inPos[0], inPos[1]],
        size: [40, 40],
        lines: [
            { a: [15, 0], b: [-8, 0], thickness: 6, color: [1, 1, 1] },
            { a: [0, 10], b: [-12, -2], thickness: 6, color: [1, 1, 1] },
            { a: [0, -10], b: [-12, 2], thickness: 6, color: [1, 1, 1] }
        ],
        color: GlobalKeyboardManager$1.isPressed('ArrowLeft')
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
        color: GlobalKeyboardManager$1.isPressed('ArrowDown')
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
        color: GlobalKeyboardManager$1.isPressed('ArrowUp')
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
        color: GlobalKeyboardManager$1.isPressed('ArrowRight')
            ? activatedColor
            : defaultColor
    });
};
const _addKeysTouchesWidgets = (inAllIndicator, inCanvasElement, inPos) => {
    if (GlobalTouchManager$2.isSupported(inCanvasElement)) {
        inAllIndicator.push({
            center: [inPos[0] + 115, inPos[1]],
            size: [230, 60],
            text: 'Touch Events\nSupported\n(double tap)',
            color: [0, 0.5, 0]
        });
    }
    else {
        inAllIndicator.push({
            center: [inPos[0] + 115, inPos[1]],
            size: [230, 60],
            text: 'Touch Events\nNot Supported',
            color: [0.5, 0, 0]
        });
    }
    if (GlobalPointerLockManager$1.canBePointerLocked(inCanvasElement)) {
        inAllIndicator.push({
            center: [inPos[0] + 105, inPos[1] + 70],
            size: [210, 60],
            text: 'Mouse\nSupported',
            color: [0, 0.5, 0]
        });
    }
    else {
        inAllIndicator.push({
            center: [inPos[0] + 105, inPos[1] + 70],
            size: [210, 60],
            text: 'Mouse Events\nNot Supported',
            color: [0.5, 0, 0]
        });
    }
};
const renderControls = (inCanvasElement, stackRenderers, textRenderer) => {
    const allIndicator = [];
    const keyEventsPos = [7 + 20, 165];
    const touchEventsPos = [7 + 20, 260];
    const boardPos = [7, 35];
    _addKeyStrokesWidgets(allIndicator, keyEventsPos);
    _addArrowStrokesWidgets(allIndicator, touchEventsPos);
    _addKeysTouchesWidgets(allIndicator, inCanvasElement, boardPos);
    allIndicator.forEach((currIndicator) => {
        const { center } = currIndicator;
        stackRenderers.pushCenteredRectangle(fromValues$2(center[0], center[1], -0.3), currIndicator.size, [0, 0, 0]);
        stackRenderers.pushCenteredRectangle(fromValues$2(center[0], center[1], -0.2), [currIndicator.size[0] - 2, currIndicator.size[1] - 2], currIndicator.color);
        if (currIndicator.text) {
            textRenderer
                .setTextScale(16)
                .setTextAlign('centered', 'centered')
                .pushText(currIndicator.text, center)
                .setTextAlign('left', 'top');
        }
        if (currIndicator.lines) {
            currIndicator.lines.forEach((currLine) => {
                stackRenderers.pushThickLine([center[0] + currLine.a[0], center[1] + currLine.a[1], 0], [center[0] + currLine.b[0], center[1] + currLine.b[1], 0], currLine.thickness, currLine.color);
            });
        }
    });
};

const renderCurrentCoordinates = (inViewportSize, inChunkSize, inEyePos, inTextRenderer) => {
    const chunkCoord = [
        Math.floor(inEyePos[0] / inChunkSize),
        Math.floor(inEyePos[1] / inChunkSize),
        Math.floor(inEyePos[2] / inChunkSize)
    ];
    const allLines = [
        `Coordinates:`,
        `X: ${chunkCoord[0]}`,
        `Y: ${chunkCoord[1]}`,
        `Z: ${chunkCoord[2]}`
    ];
    const textsOrigin = [14, inViewportSize[1] - 200];
    inTextRenderer
        .setTextScale(14)
        .setTextAlign('left', 'top')
        .pushText(allLines.join('\n'), textsOrigin);
};

const renderFpsMeter = (inPos, inSize, inFrameProfiler, inStackRenderers, inTextRenderer, inShowFps = false) => {
    // fps meter
    const k_divider = 5;
    const k_verticalSize = Math.ceil(inFrameProfiler.maxDelta / k_divider) * k_divider;
    {
        // border
        inStackRenderers.pushOriginBoundRectangle(inPos, inSize, [0, 0, 0, 0.5]);
        const allVertices = [
            [inPos[0] + inSize[0] * 0, inPos[1] + inSize[1] * 0, 0],
            [inPos[0] + inSize[0] * 1, inPos[1] + inSize[1] * 0, 0],
            [inPos[0] + inSize[0] * 1, inPos[1] + inSize[1] * 1, 0],
            [inPos[0] + inSize[0] * 0, inPos[1] + inSize[1] * 1, 0]
        ];
        inStackRenderers.pushLine(allVertices[0], allVertices[1], [1, 1, 1]);
        inStackRenderers.pushLine(allVertices[1], allVertices[2], [1, 1, 1]);
        inStackRenderers.pushLine(allVertices[2], allVertices[3], [1, 1, 1]);
        inStackRenderers.pushLine(allVertices[3], allVertices[0], [1, 1, 1]);
    } // border
    {
        // dividers
        for (let currDivider = k_divider; currDivider < k_verticalSize; currDivider += k_divider) {
            const ratio = currDivider / k_verticalSize;
            const pointA = [
                inPos[0] + 0,
                inPos[1] + inSize[1] * ratio,
                0
            ];
            const pointB = [
                inPos[0] + inSize[0],
                inPos[1] + inSize[1] * ratio,
                0
            ];
            inStackRenderers.pushLine(pointA, pointB, [0.5, 0.5, 0.5]);
        }
    } // dividers
    {
        // curve
        if (inFrameProfiler.framesDelta.length >= 2) {
            const widthStep = inSize[0] / inFrameProfiler.framesDelta.length;
            let prevDelta = inFrameProfiler.framesDelta[0];
            let prevCoordX = 0;
            let prevCoordY = (inSize[1] * prevDelta) / k_verticalSize;
            for (let ii = 1; ii < inFrameProfiler.framesDelta.length; ++ii) {
                const currDelta = inFrameProfiler.framesDelta[ii];
                const currCoordX = ii * widthStep;
                const currCoordY = (inSize[1] * currDelta) / k_verticalSize;
                const pointA = [
                    inPos[0] + prevCoordX,
                    inPos[1] + prevCoordY,
                    0
                ];
                const pointB = [
                    inPos[0] + currCoordX,
                    inPos[1] + currCoordY,
                    0
                ];
                inStackRenderers.pushLine(pointA, pointB, [1, 1, 1]);
                prevDelta = currDelta;
                prevCoordX = currCoordX;
                prevCoordY = currCoordY;
            }
        }
    } // curve
    {
        // counter
        const k_textScale = 14;
        const k_textHScale = k_textScale * 0.5;
        const averageValue = inFrameProfiler.averageDelta;
        const maxValue = inFrameProfiler.maxDelta;
        const minValue = inFrameProfiler.minDelta;
        let averageStr = `~${averageValue.toFixed(0)}ms`;
        let maxStr = `<${maxValue}ms`;
        let minStr = `>${minValue}ms`;
        if (inShowFps === true) {
            const _getFpsStr = (inVal) => inVal < 999 ? inVal.toFixed(0) : '???';
            averageStr += `\n~${_getFpsStr(1000 / averageValue)}fps`;
            maxStr += `\n<${_getFpsStr(1000 / maxValue)}fps`;
            minStr += `\n>${_getFpsStr(1000 / minValue)}fps`;
        }
        inTextRenderer
            .setTextScale(k_textScale)
            .setTextAlign('left', 'top')
            .setTextColor(1.0, 1.0, 0.75)
            .pushText(averageStr, [inPos[0] + 7, inPos[1] - 8])
            .setTextAlign('left', 'centered')
            .setTextColor(1.0, 0.75, 0.75)
            .pushText(maxStr, [
            inPos[0] + inSize[0] + k_textHScale,
            inPos[1] + inSize[1] - k_textHScale * 1
        ])
            .setTextColor(0.75, 1.0, 0.75)
            .pushText(minStr, [
            inPos[0] + inSize[0] + k_textHScale,
            inPos[1] + k_textHScale * 1
        ])
            .setTextColor(1.0, 1.0, 1.0);
    } // counter
};

const renderGenerationMetrics = (inViewportSize, inChunksCreated, inChunksDiscarded, inVisibleChunks, inTextRenderer) => {
    const textsOrigin = [
        inViewportSize[0] - 10,
        inViewportSize[1] - 10
    ];
    const text = [
        `Chunks\nGenerated:\n${inChunksCreated} <`,
        '',
        `Chunks\nDiscarded:\n${inChunksDiscarded} <`,
        '',
        `Live\nChunks:\n${inChunksCreated - inChunksDiscarded} <`,
        '',
        `Visible\nChunks:\n${inVisibleChunks} <`
    ].join('\n');
    inTextRenderer
        .setTextScale(14)
        .setTextAlign('right', 'top')
        .pushText(text, textsOrigin);
};

const renderPerspectiveFrustum = (inFovY, inAspect, inNear, inFar, eyePos, theta, phi, inStackRenderers) => {
    const fH = Math.tan((inFovY / 360.0) * Math.PI) * inNear;
    const fW = fH * inAspect;
    const nearLeft = -fW;
    const nearRight = +fW;
    const nearTop = +fH;
    const nearBottom = -fH;
    const farHalfZ = inFar * Math.sin((inFovY * Math.PI) / 180.0);
    const farHalfY = farHalfZ * inAspect;
    const tmpVertices = [];
    tmpVertices.push([inNear, nearLeft, nearTop]);
    tmpVertices.push([inNear, nearRight, nearTop]);
    tmpVertices.push([inNear, nearLeft, nearBottom]);
    tmpVertices.push([inNear, nearRight, nearBottom]); // 3
    tmpVertices.push([inFar, -farHalfY, +farHalfZ]); // 4
    tmpVertices.push([inFar, +farHalfY, +farHalfZ]);
    tmpVertices.push([inFar, -farHalfY, -farHalfZ]);
    tmpVertices.push([inFar, +farHalfY, -farHalfZ]); // 7
    tmpVertices.push([0, 0, 0]); // 8
    tmpVertices.push([100, 0, 0]);
    tmpVertices.push([0, 100, 0]);
    tmpVertices.push([0, 0, 100]); // 11
    //
    {
        const tmpMatrix = identity(create$4());
        translate(tmpMatrix, tmpMatrix, eyePos);
        rotate(tmpMatrix, tmpMatrix, theta, [0, 0, 1]);
        rotate(tmpMatrix, tmpMatrix, phi, [0, -1, 0]);
        for (let ii = 0; ii < tmpVertices.length; ++ii) {
            tmpVertices[ii] = transformMat4(tmpVertices[ii], tmpVertices[ii], tmpMatrix);
        }
    }
    //
    {
        const indices = [];
        indices.push(0, 1, 1, 3, 3, 2, 2, 0);
        indices.push(0, 4, 1, 5, 2, 6, 3, 7);
        indices.push(4, 5, 5, 7, 7, 6, 6, 4);
        const colorTop = [1, 1, 0];
        for (let ii = 0; ii < indices.length; ii += 2) {
            const posA = tmpVertices[indices[ii + 0]];
            const posB = tmpVertices[indices[ii + 1]];
            inStackRenderers.pushLine(posA, posB, colorTop);
        }
        {
            const posA = tmpVertices[8];
            const posB1 = tmpVertices[9];
            const posB2 = tmpVertices[10];
            const posB3 = tmpVertices[11];
            inStackRenderers.pushLine(posA, posB1, [1, 0, 0]);
            inStackRenderers.pushLine(posA, posB2, [0, 1, 0]);
            inStackRenderers.pushLine(posA, posB3, [0, 0, 1]);
        }
    }
};

const { WebGLContext } = index;
const renderMiniMap = (inCamera, inMinScreenSize, inMinViewSize, inChunks, inChunkSize, inViewportSize, inProcessingPos, inWireFrameCubesRenderer, inStackRenderers) => {
    const gl = WebGLContext.getContext();
    //
    //
    const [width, height] = inViewportSize;
    const miniMapHudCamera = new Camera();
    const minViewportSize = Math.min(width, height) * 0.5;
    const minimapWidth = Math.max(minViewportSize, inMinScreenSize);
    const minimapHeight = Math.max(minViewportSize, inMinScreenSize);
    const minimapPosX = width - minimapWidth;
    miniMapHudCamera.setViewportPos(minimapPosX, 0);
    miniMapHudCamera.setViewportSize(minimapWidth, minimapHeight);
    const aspectRatio = minimapWidth / minimapHeight;
    const orthoSizeH = aspectRatio >= 1.0 ? inMinViewSize : inMinViewSize * (1 / aspectRatio);
    const orthoSizeW = orthoSizeH * aspectRatio;
    miniMapHudCamera.setAsOrthogonal({
        left: -orthoSizeW,
        right: +orthoSizeW,
        top: -orthoSizeH,
        bottom: +orthoSizeH,
        near: -inMinViewSize,
        far: +inMinViewSize
    });
    miniMapHudCamera.setUpAxis([0, 0, 1]);
    //
    //
    const mainEyePos = inCamera.getEye();
    const targetPos = inCamera.getTarget();
    const diff = sub(create$3(), targetPos, mainEyePos);
    const forwardTheta = Math.atan2(diff[1], diff[0]);
    const forwardPhi = Math.atan2(diff[2], length(fromValues(diff[1], diff[0])));
    const inclinedTheta = forwardTheta - Math.PI * 0.25;
    const upPhi = forwardPhi + Math.PI * 0.5;
    const inclinedCosTheta = Math.cos(inclinedTheta);
    const inclinedSinTheta = Math.sin(inclinedTheta);
    const upAxisZ = Math.sin(upPhi);
    const miniMapEyePos = copy(create$3(), mainEyePos);
    miniMapEyePos[0] -= inclinedCosTheta * 20.0;
    miniMapEyePos[1] -= inclinedSinTheta * 20.0;
    miniMapEyePos[2] += upAxisZ * 10.0;
    miniMapHudCamera.setEye(miniMapEyePos);
    miniMapHudCamera.setTarget(mainEyePos);
    miniMapHudCamera.computeMatrices();
    const viewPos = miniMapHudCamera.getViewportPos();
    const viewSize = miniMapHudCamera.getViewportSize();
    gl.viewport(viewPos[0], viewPos[1], viewSize[0], viewSize[1]);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    inWireFrameCubesRenderer.clear();
    const k_whiteColor = fromValues$2(1, 1, 1);
    const k_redColor = fromValues$1(1, 0, 0, 0.8);
    const k_greenColor = fromValues$2(0, 1, 0);
    const hSize = inChunkSize * 0.5;
    const chunkCenter = create$3();
    const chunkHalfSize = fromValues$2(hSize, hSize, hSize);
    inChunks.forEach((currChunk) => {
        copy(chunkCenter, currChunk.realPosition);
        add(chunkCenter, chunkCenter, chunkHalfSize);
        if (currChunk.isVisible) {
            // render white cubes
            inWireFrameCubesRenderer.pushCenteredCube(chunkCenter, hSize, k_whiteColor);
        }
        else {
            // render smaller red cubes
            inWireFrameCubesRenderer.pushCenteredCube(chunkCenter, hSize, k_redColor);
        }
    });
    if (inProcessingPos.length > 0) {
        const extraSize = inChunkSize * 1.2;
        inProcessingPos.forEach((currPos) => {
            // render green cubes (smaller -> scaled)
            copy(chunkCenter, currPos);
            add(chunkCenter, chunkCenter, chunkHalfSize);
            inWireFrameCubesRenderer.pushCenteredCube(chunkCenter, extraSize, k_greenColor);
        });
    }
    inWireFrameCubesRenderer.flush(miniMapHudCamera.getComposedMatrix());
    inStackRenderers.flush(miniMapHudCamera.getComposedMatrix());
    {
        const projData = inCamera.getPerspectiveData();
        renderPerspectiveFrustum(projData.fovy, projData.aspectRatio, projData.near, projData.far, mainEyePos, forwardTheta, forwardPhi, inStackRenderers);
        inStackRenderers.flush(miniMapHudCamera.getComposedMatrix());
    }
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
};

const { GlobalTouchManager: GlobalTouchManager$1 } = index$1;
const _touchesAngleMap = new Map();
const renderTouchEvents = (viewportSize, stackRenderers, isMovingForward) => {
    // touches
    const allTouchData = GlobalTouchManager$1.getTouchData();
    if (allTouchData.length === 0) {
        _touchesAngleMap.clear();
    }
    else {
        const latestTouchIds = new Set();
        const redColor = [1, 0, 0];
        const greenColor = [0, 1, 0];
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
            if (isMovingForward)
                angles.push(0.25, 0.75);
            for (const offsetAngle of angles) {
                const finalAngle = angle + offsetAngle * Math.PI;
                const position = [
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
        const idNotInUse = new Set();
        _touchesAngleMap.forEach((value, key) => {
            if (!latestTouchIds.has(key))
                idNotInUse.add(key);
        });
        idNotInUse.forEach((value) => {
            _touchesAngleMap.delete(value);
        });
    }
}; // touches

const { GlobalKeyboardManager, GlobalTouchManager, GlobalMouseManager, GlobalPointerLockManager } = index$1;
class WebGLExperiment {
    constructor(canvasElement) {
        this._chunksCreated = 0;
        this._chunksDiscarded = 0;
        this._currFrameTime = 0;
        this._frameProfiler = new FrameProfiler();
        this._canvasElement = canvasElement;
        this._freeFlyController = new FreeFlyController({
            position: fromValues$2(0, 0, 0),
            coordinates: ['X', 'Y', 'Z'],
            theta: 0,
            phi: 0,
            mouseSensibility: controllerMouseSensibility,
            movingSpeed: controllerMovingSpeed,
            keyboardSensibility: controllerKeyboardSensibility,
            touchSensibility: controllerTouchSensibility
        });
        this._renderer = new WebGLRenderer({
            canvasDomElement: canvasElement
        });
        this._chunkGenerator = new ChunkGenerator({
            chunkGraphicSize: chunkGraphicSize,
            chunkGenerationRange: chunkRange,
            chunkLogicSize: chunkLogicSize,
            workerTotal: workerTotal,
            workerFile: workerFile,
            // workerBufferSize: configuration.workerBufferSize,
            chunkIsVisible: (pos) => {
                const k_size = chunkGraphicSize;
                const k_hSize = k_size * 0.5;
                return this._renderer.frustumCulling.cubeInFrustum(pos[0] + k_hSize, pos[1] + k_hSize, pos[2] + k_hSize, k_size);
            },
            acquireGeometry: (inSize) => {
                return this._renderer.chunksRenderer.acquireGeometry(inSize);
            },
            releaseGeometry: (inGeom) => {
                this._renderer.chunksRenderer.releaseGeometry(inGeom);
            },
            onChunkCreated: () => {
                ++this._chunksCreated;
            },
            onChunkDiscarded: () => {
                ++this._chunksDiscarded;
            }
        });
        //
        //
        {
            GlobalKeyboardManager.activate();
            GlobalTouchManager.activate(this._canvasElement);
            GlobalPointerLockManager.allowPointerLockedOnClickEvent(canvasElement);
            GlobalPointerLockManager.addOnLockChange(() => {
                const isLocked = GlobalPointerLockManager.isPointerLocked(canvasElement);
                if (isLocked) {
                    // g_logger.log('The pointer lock status is now locked');
                    GlobalMouseManager.activate();
                }
                else {
                    // g_logger.log('The pointer lock status is now unlocked');
                    GlobalMouseManager.deactivate();
                    GlobalPointerLockManager.allowPointerLockedOnClickEvent(canvasElement);
                }
            });
            GlobalPointerLockManager.addOnLockError((event) => {
                // g_logger.log(
                //   `The pointer lock sent an error, event: "${JSON.stringify(event)}"`
                // );
            });
        }
        //
        //
        //
        this._running = false;
        this._errorGraphicContext = false;
        this._renderer.setOnContextLost(() => {
            console.log('on_context_lost');
            this._errorGraphicContext = true;
            this.stop();
        });
        this._renderer.setOnContextRestored(() => {
            console.log('on_context_restored');
            this._errorGraphicContext = false;
            this.start();
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._renderer.init();
        });
    }
    resize(inWidth, inHeight, inIsFullScreen) {
        let currentWidth = inWidth;
        let currentHeight = inHeight;
        if (inIsFullScreen) {
            this._canvasElement.style.position = 'absolute';
            currentWidth = window.innerWidth;
            currentHeight = window.innerHeight;
        }
        else {
            this._canvasElement.style.position = 'relative';
        }
        this._canvasElement.style.left = '0px';
        this._canvasElement.style.top = '0px';
        this._canvasElement.style.width = `${currentWidth}px`;
        this._canvasElement.style.height = `${currentHeight}px`;
        this._canvasElement.width = currentWidth;
        this._canvasElement.height = currentHeight;
        this._renderer.resize(currentWidth, currentHeight);
    }
    start() {
        if (this.isRunning())
            return;
        this._running = true;
        this._chunkGenerator.start();
        this._tick();
    }
    stop() {
        this._running = false;
        this._chunkGenerator.stop();
    }
    isRunning() {
        return this._running && !this._errorGraphicContext;
    }
    //
    //
    //
    _tick() {
        const tick = () => {
            if (!this._running || this._errorGraphicContext)
                return;
            // plan the next frame
            window.requestAnimationFrame(tick);
            this._mainLoop();
        };
        tick();
    }
    _mainLoop() {
        const currentTime = Date.now();
        const elapsedTime = Math.min(currentTime - this._currFrameTime, 30);
        this._currFrameTime = currentTime;
        this._frameProfiler.pushDelta(elapsedTime);
        //
        //
        this._freeFlyController.update(elapsedTime / 1000, (inX, inY, inZ) => {
            // return this._chunkGenerator.isColliding(
            //   glm.vec3.fromValues(inX, inY, inZ),
            //   () => {}
            // );
            return false;
        });
        this._renderer.lookAt(this._freeFlyController.getPosition(), this._freeFlyController.getTarget(), this._freeFlyController.getUpAxis());
        this._renderer.update();
        const eyePos = this._freeFlyController.getPosition();
        this._chunkGenerator.update(eyePos);
        //
        //
        ////// render 3d scene
        let visibleChunks = 0;
        this._renderer.wireFrameCubesRenderer.clear();
        this._chunkGenerator.getChunks().forEach((chunk) => {
            if (!chunk.isVisible)
                return;
            ++visibleChunks;
            this._renderer.triangleCubesRenderer.pushOriginBoundCube(chunk.realPosition, chunkGraphicSize, [1, 1, 1]);
        });
        this._renderer.renderScene(chunkGraphicSize);
        //
        //
        ////// HUD
        this._renderer.renderHUD();
        this._renderer.stackRenderers.clear();
        this._renderer.textRenderer.clear();
        // const allMsgs: string[] = [];
        // const isColliding = this._chunkGenerator.isColliding(this._freeFlyController.getPosition(), (...args) => {
        //   allMsgs.push(args.join(' '));
        // });
        // this._renderer.textRenderer
        //   .setTextScale(14)
        //   .setTextAlign('left', 'top')
        //   .pushText(`isColliding=${isColliding}`, [250,400])
        //   .pushText(allMsgs.join("\n"), [250,385]);
        // this._renderer.textRenderer.flush();
        // top right text
        renderGenerationMetrics(this._renderer.getSize(), this._chunksCreated, this._chunksDiscarded, visibleChunks, this._renderer.textRenderer);
        // bottom left text
        renderCurrentCoordinates(this._renderer.getSize(), chunkGraphicSize, eyePos, this._renderer.textRenderer);
        renderControls(this._canvasElement, this._renderer.stackRenderers, this._renderer.textRenderer);
        renderFpsMeter([10, this._canvasElement.height - 60, 0], [100, 50], this._frameProfiler, this._renderer.stackRenderers, this._renderer.textRenderer, true);
        renderFpsMeter([10, this._canvasElement.height - 150, 0], [100, 50], this._chunkGenerator.getFrameProfiler(), this._renderer.stackRenderers, this._renderer.textRenderer);
        renderTouchEvents(this._renderer.getSize(), this._renderer.stackRenderers, this._freeFlyController.getTouchMoveForward());
        this._renderer.stackRenderers.flush(this._renderer.hudCamera.getComposedMatrix());
        this._renderer.textRenderer.flush(this._renderer.hudCamera.getComposedMatrix());
        const k_minScreenSize = 300;
        const k_minViewSize = 150;
        renderMiniMap(this._renderer.mainCamera, k_minScreenSize, k_minViewSize, this._chunkGenerator.getChunks(), chunkGraphicSize, this._renderer.getSize(), this._chunkGenerator.getProcessingRealPositions(), this._renderer.wireFrameCubesRenderer, this._renderer.stackRenderers);
    }
}

const { isWebGL2Supported, isWebWorkerSupported, GlobalFullScreenManager } = index$1;
const onPageLoad = () => __awaiter(void 0, void 0, void 0, function* () {
    let mainDemo = null;
    const onPageError = () => __awaiter(void 0, void 0, void 0, function* () {
        if (mainDemo) {
            mainDemo.stop();
        }
    });
    window.addEventListener('error', onPageError);
    //
    // HTML elements check
    //
    const canvasElement = document.querySelector('#main-canvas');
    if (!canvasElement) {
        throw new Error('main-canvas not found');
    }
    const guiToggleStart = document.querySelector('#gui_toggle_start');
    if (!guiToggleStart) {
        throw new Error('guiToggleStart not found');
    }
    const guiFullscreen = document.querySelector('#gui_fullscreen');
    if (!guiFullscreen) {
        throw new Error('guiFullscreen not found');
    }
    //
    // browser features check
    //
    if (!isWebGL2Supported()) {
        throw new Error('missing WebGL2 feature (unsupported)');
    }
    if (!isWebWorkerSupported()) {
        throw new Error('missing WebWorker feature (unsupported)');
    }
    //
    // setup start/stop support
    //
    guiToggleStart.addEventListener('click', () => {
        if (!mainDemo) {
            return;
        }
        if (mainDemo.isRunning()) {
            mainDemo.stop();
        }
        else {
            mainDemo.start();
        }
    });
    //
    // setup fullscreen support
    //
    guiFullscreen.addEventListener('click', () => {
        if (!mainDemo) {
            return;
        }
        GlobalFullScreenManager.requestFullScreen(canvasElement);
    });
    GlobalFullScreenManager.addOnFullScreenChange(() => {
        if (!mainDemo) {
            return;
        }
        let currentWidth = 800;
        let currentHeight = 600;
        const isFullScreen = GlobalFullScreenManager.isFullScreen(canvasElement);
        if (isFullScreen) {
            canvasElement.style.position = 'absolute';
            currentWidth = window.innerWidth;
            currentHeight = window.innerHeight;
        }
        else {
            canvasElement.style.position = 'relative';
        }
        canvasElement.style.left = '0px';
        canvasElement.style.top = '0px';
        canvasElement.style.width = `${currentWidth}px`;
        canvasElement.style.height = `${currentHeight}px`;
        canvasElement.width = currentWidth;
        canvasElement.height = currentHeight;
        mainDemo.resize(currentWidth, currentHeight, isFullScreen);
    });
    //
    // setup application
    //
    mainDemo = new WebGLExperiment(canvasElement);
    yield mainDemo.init();
    mainDemo.start();
});
window.addEventListener('load', onPageLoad);
