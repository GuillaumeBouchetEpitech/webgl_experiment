const allRequestEvents: string[] = [
  'requestFullscreen',
  'webkitRequestFullscreen',
  'mozRequestFullScreen',
  'msRequestFullscreen'
];

const allChangeEvents: string[] = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'msfullscreenchange'
];

type OnChangeCallback = () => void;

interface IResult {
  success: boolean;
  message: string;
}

class FullScreenManager {
  private _onFullScreenChangeCallbacks: OnChangeCallback[] = [];

  private _isInitialized: boolean = false;

  private _initialize() {
    if (this._isInitialized) {
      return;
    }
    this._isInitialized = true;

    const onLockChange = () => {
      this._onFullScreenChangeCallbacks.forEach((callback) => callback());
    };

    for (const currEvent of allChangeEvents)
      document.addEventListener(currEvent, onLockChange, false);
  }

  //

  isCompatible(inTargetElement: HTMLElement) {
    for (const currEvent of allRequestEvents) {
      if (currEvent in inTargetElement) {
        return true;
      }
    }
    return false;
  }

  //

  isFullScreen(inTargetElement: HTMLElement) {
    return document.fullscreenElement === inTargetElement;
  }

  //

  async requestFullScreen(inTargetElement: HTMLElement): Promise<IResult> {
    if (this.isFullScreen(inTargetElement)) {
      return { success: false, message: 'element already in full screen' };
    }

    this._initialize();

    for (const currEvent of allRequestEvents) {
      if (currEvent in inTargetElement) {
        (inTargetElement as any)[currEvent]();

        return { success: true, message: 'request for full screen done' };
      }
    }

    return { success: false, message: 'unsupported request for full screen' };
  }

  //

  addOnFullScreenChange(inCallback: OnChangeCallback) {
    this._onFullScreenChangeCallbacks.push(inCallback);
  }
  removeOnFullScreenChange(inCallback: OnChangeCallback) {
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

const GlobalFullScreenManager = new FullScreenManager();

export { GlobalFullScreenManager };
