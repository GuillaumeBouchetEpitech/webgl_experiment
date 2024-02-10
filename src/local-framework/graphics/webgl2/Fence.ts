import { WebGLContext } from './WebGLContext';

export class FenceSync {
  private _sync: WebGLSync | undefined;

  constructor() {}

  dispose(): void {
    if (!this._sync) {
      // throw new Error("fence not started");
      return;
    }
    const gl = WebGLContext.getContext();
    gl.deleteSync(this._sync);
    this._sync = undefined;
  }

  isStarted(): boolean {
    return this._sync !== undefined;
  }

  start(): void {
    if (this._sync) {
      // throw new Error("fence already started");
      this.dispose();
    }
    const gl = WebGLContext.getContext();
    const tmpSync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (tmpSync === null) {
      throw new Error('could not create a webgl fence');
    }
    this._sync = tmpSync;
    gl.flush();
    gl.finish();
  }

  isSignaled(): boolean {
    if (!this._sync) {
      throw new Error('fence not started');
    }

    const gl = WebGLContext.getContext();
    const signaled = gl.getSyncParameter(this._sync, gl.SYNC_STATUS);
    return signaled === gl.SIGNALED;
  }

  wait(timeoutNanoSec: number): 'done' | 'timed-out' {
    if (!this._sync) {
      throw new Error('fence not started');
    }
    const gl = WebGLContext.getContext();

    const bitflags = 0;
    const status = gl.clientWaitSync(this._sync, bitflags, timeoutNanoSec);

    switch (status) {
      case gl.TIMEOUT_EXPIRED:
        // it's not done, check again next time
        return 'timed-out';
      case gl.WAIT_FAILED:
        // throw new Error('fence.wait -> should never get here');
        console.warn('fence.wait -> should never get here');
        // return 'timed-out';
        this.dispose();
        return 'done';
      case gl.ALREADY_SIGNALED:
      case gl.CONDITION_SATISFIED:
      default:
        this.dispose();
        return 'done';
    }
  }
}
