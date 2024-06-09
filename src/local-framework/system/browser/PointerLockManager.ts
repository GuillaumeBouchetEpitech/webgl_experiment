const allRequestEvents: string[] = [
  'requestPointerLock',
  'mozRequestPointerLock',
  'webkitRequestPointerLock'
];

const allExitEvents: string[] = [
  'exitPointerLock',
  'mozExitPointerLock',
  'webkitExitPointerLock'
];

const allStateEvents: string[] = [
  'pointerLockElement',
  'mozPointerLockElement',
  'webkitPointerLockElement'
];

const allChangeEvents: { methodName: string; propertyName: string }[] = [
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

const allErrorEvents: { methodName: string; propertyName: string }[] = [
  { methodName: 'onpointerlockerror', propertyName: 'pointerlockerror' },
  { methodName: 'onmozpointerlockerror', propertyName: 'mozpointerlockerror' },
  {
    methodName: 'onwebkitpointerlockerror',
    propertyName: 'webkitpointerlockerror'
  }
];

type OnChangeCallback = () => void;
type OnErrorCallback = (event: Event) => void;

interface IResult {
  success: boolean;
  message: string;
}

class PointerLockManager {
  private _onLockChangeCallbacks: OnChangeCallback[] = [];
  private _onLockErrorCallbacks: OnErrorCallback[] = [];
  private _timeSinceLastLockChange = 0;

  private _latestRequestHtmlElement: HTMLElement | undefined;

  private _isInitialized: boolean = false;

  // constructor() {}

  private _initialize() {
    if (this._isInitialized) {
      return;
    }
    this._isInitialized = true;

    const onLockChange = () => {
      this._timeSinceLastLockChange = Date.now();
      // console.log("timer reset");

      this._onLockChangeCallbacks.forEach((callback) => callback());
    };

    const onLockError = (event: Event) => {
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

  canBePointerLocked(inTargetElement: HTMLElement) {
    for (const currEvent of allRequestEvents) {
      if (currEvent in inTargetElement) {
        return true;
      }
    }
    return false;
  }

  //

  isPointerLocked(inTargetElement: HTMLElement) {
    for (const currEvent of allStateEvents) {
      if (currEvent in document) {
        return (document as any)[currEvent] === inTargetElement;
      }
    }
    return false;
  }

  //

  async requestPointerLock(inTargetElement: HTMLElement): Promise<IResult> {
    if (this.isPointerLocked(inTargetElement)) {
      return { success: false, message: 'element already locked' };
    }

    this._initialize();

    if (this._timeSinceLastLockChange > 0) {
      const elapsedSecTime =
        (Date.now() - this._timeSinceLastLockChange) / 1000;

      // console.log("elapsedSecTime 1", elapsedSecTime);

      if (elapsedSecTime < 1.1) {
        return {
          success: false,
          message: `request for lock was too early, time to wait: ${elapsedSecTime.toFixed(
            2
          )}sec`
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

          await (inTargetElement as any)[currEvent](options);
        } catch (err) {
          // console.log("ERR", err);

          const elapsedSecTime =
            (Date.now() - this._timeSinceLastLockChange) / 1000;

          // console.log("elapsedSecTime 2", elapsedSecTime);

          return {
            success: false,
            message: `request for lock was too early, time to wait: ${elapsedSecTime.toFixed(
              2
            )}sec`
          };
        }

        this._timeSinceLastLockChange = Date.now();
        // console.log("timer reset");

        return { success: true, message: 'request for lock done' };
      }
    }

    return { success: false, message: 'unsupported request for lock' };
  }

  //

  allowPointerLockedOnClickEvent(inTargetElement: HTMLElement) {
    if (inTargetElement === this._latestRequestHtmlElement) {
      return;
    }

    this._latestRequestHtmlElement = inTargetElement;

    const onClick = async () => {
      inTargetElement.removeEventListener('click', onClick);

      const result = await this.requestPointerLock(inTargetElement);

      this._latestRequestHtmlElement = undefined;

      if (!result.success) {
        this.allowPointerLockedOnClickEvent(inTargetElement);
      }
    };

    inTargetElement.addEventListener('click', onClick);
  }

  //

  exitPointerLock() {
    for (const currEvent of allExitEvents) {
      if (currEvent in document) {
        (document as any)[currEvent]();
        break;
      }
    }
  }

  //

  addOnLockChange(inCallback: OnChangeCallback) {
    this._onLockChangeCallbacks.push(inCallback);
  }
  removeOnLockChange(inCallback: OnChangeCallback) {
    const index = this._onLockChangeCallbacks.indexOf(inCallback);
    if (index < 0) {
      return;
    }
    this._onLockChangeCallbacks.splice(index, 1);
  }

  //

  addOnLockError(inCallback: OnErrorCallback) {
    this._onLockErrorCallbacks.push(inCallback);
  }
  removeOnLockError(inCallback: OnErrorCallback) {
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

const GlobalPointerLockManager = new PointerLockManager();

export { GlobalPointerLockManager };
