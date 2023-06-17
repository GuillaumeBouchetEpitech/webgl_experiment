
import { TypedMessageEvent } from '../../../../_common';

interface IWorkerInstance<T> {
  instance: Worker;
  data: T
}

type OnWorkerResult<T, P> = (inWorkerData: T, inMessageData: P) => void;

export interface IWorkerManager<T> {
  areAllWorkerAvailable(): boolean;
  getInUseWorkersData(): ReadonlyArray<T>;
};

export class WorkerManager<T, P> implements IWorkerManager<T> {

  private _unusedWorkers: IWorkerInstance<T>[] = [];
  private _inUseWorkers: IWorkerInstance<T>[] = [];

  private _onWorkerResult: OnWorkerResult<T, P>;

  constructor(inOnWorkerResult: OnWorkerResult<T, P>) {
    this._onWorkerResult = inOnWorkerResult;
  }

  areAllWorkerAvailable(): boolean {
    return this._inUseWorkers.length === 0;
  }

  isWorkerAvailable(): boolean {
    return this._unusedWorkers.length > 0;
  }

  getInUseWorkersData(): ReadonlyArray<T> {
    return this._inUseWorkers.map(worker => worker.data);
  }

  pushTask(inCallback: (inWorkerData: T, inPushTask: (inPayload: P, inTransfer: Transferable[]) => void) => void): boolean {

    if (!this.isWorkerAvailable()) {
      return false;
    }

    //
    // set worker as "in use"
    //

    const currentWorker = this._unusedWorkers.pop()!;
    this._inUseWorkers.push(currentWorker);

    //
    // start
    //

    inCallback(currentWorker.data, (inPayload, inTransfer) => {
      currentWorker.instance.postMessage(inPayload, inTransfer);
    });
    return true;
  }

  addOneWorker(inWorkerFile: string, inWorkerData: T) {
    const newWorker: IWorkerInstance<T> = {
      instance: new Worker(inWorkerFile),
      data: inWorkerData,
    };

    this._unusedWorkers.push(newWorker);

    const onWorkerMessage = (event: TypedMessageEvent<P>) => {

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
