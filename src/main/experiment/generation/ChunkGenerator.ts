import * as glm from 'gl-matrix';

import { ILiveGeometry } from '../webGLRenderer/WebGLRenderer';

interface IChunkGeneratorDef {
  chunkSize: number;
  chunkRange: number;
  workerTotal: number;
  workerFile: string;
  workerBufferSize: number;
  chunkIsVisible: (pos: glm.ReadonlyVec3) => boolean;
  acquireGeometry: () => ILiveGeometry;
  releaseGeometry: (inGeom: ILiveGeometry) => void;
  onChunkCreated?: () => void;
  onChunkDiscarded?: () => void;
}

interface IChunk {
  realPosition: glm.ReadonlyVec3;
  indexPosition: glm.ReadonlyVec3;
  geometry: ILiveGeometry;
  isVisible: boolean;
}

export type Chunks = IChunk[];

interface IPositionData {
  realPosition: glm.ReadonlyVec3;
  indexPosition: glm.ReadonlyVec3;
}

interface IWorkerInstance {
  instance: Worker;
  float32buffer: Float32Array;
  processing?: IPositionData;
}

interface IMessage {
  indexPosition: glm.ReadonlyVec3;
  realPosition: glm.ReadonlyVec3;
  float32buffer: Float32Array;
  sizeUsed: number;
}

export class ChunkGenerator {
  private _def: IChunkGeneratorDef;

  private _running: boolean = false;
  private _chunks: Chunks = []; // live chunks
  private _chunkPositionQueue: IPositionData[] = []; // position to be processed
  private _savedIndex: glm.vec3 = [999, 999, 999]; // any other value than 0/0/0 will work

  private _unusedWorkers: IWorkerInstance[] = [];
  private _inUseWorkers: IWorkerInstance[] = [];

  private _cameraPosition: glm.vec3 = glm.vec3.fromValues(0, 0, 0);

  constructor(def: IChunkGeneratorDef) {
    this._def = def;

    for (let ii = 0; ii < this._def.workerTotal; ++ii) this._addWorker();
  }

  private _addWorker() {
    const newWorker: IWorkerInstance = {
      instance: new Worker(this._def.workerFile),
      float32buffer: new Float32Array(this._def.workerBufferSize)
    };

    this._unusedWorkers.push(newWorker);

    const onWorkerMessage = (event: MessageEvent) => {
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

      const {
        indexPosition,
        realPosition,
        // we now own the vertices buffer
        float32buffer,
        sizeUsed
      } = event.data as IMessage;

      newWorker.float32buffer = float32buffer;

      newWorker.processing = undefined;

      if (!this._running) return;

      //
      // process next
      //

      const geometry = this._def.acquireGeometry();

      geometry.update(newWorker.float32buffer, sizeUsed);

      // save
      this._chunks.push({
        realPosition,
        indexPosition,
        geometry,
        isVisible: false
      });

      if (this._def.onChunkCreated) this._def.onChunkCreated();

      // launch again
      this._launchWorker();
    };

    newWorker.instance.addEventListener('message', onWorkerMessage, false);
  }

  start() {
    this._running = true;
  }

  stop() {
    if (!this._running) return;

    this._running = false;

    this._chunkPositionQueue.length = 0;
    this._chunks.forEach((chunk) => this._def.releaseGeometry(chunk.geometry));
    this._chunks.length = 0;
  }

  update(cameraPosition: glm.ReadonlyVec3) {
    if (!this._running) return;

    //
    //

    this._updateGeneration(cameraPosition);

    //
    //

    for (const currChunk of this._chunks) {
      const isVisible = this._def.chunkIsVisible(currChunk.realPosition);

      currChunk.isVisible = isVisible;
      currChunk.geometry.setVisibility(isVisible);
    }

    //
    //

    this._launchWorker();
  }

  private _updateGeneration(inCameraPosition: glm.ReadonlyVec3) {
    //  check if moved enough to justify asking for new chunks
    //      -> if yes
    //          reset chunk queue
    //          exclude chunk out of range
    //          include chunk in range

    glm.vec3.copy(this._cameraPosition, inCameraPosition);

    const currIndex: glm.ReadonlyVec3 = [
      Math.floor(inCameraPosition[0] / this._def.chunkSize),
      Math.floor(inCameraPosition[1] / this._def.chunkSize),
      Math.floor(inCameraPosition[2] / this._def.chunkSize)
    ];

    // did we move to another chunk?
    if (
      !(
        this._chunks.length == 0 ||
        !glm.vec3.exactEquals(currIndex, this._savedIndex)
      )
    ) {
      // no -> stop here
      return;
    }

    // yes -> save as the new current chunk
    glm.vec3.copy(this._savedIndex, currIndex);

    //

    // clear the generation queue
    this._chunkPositionQueue.length = 0;

    // the range of chunk generation/exclusion
    const { chunkRange } = this._def;

    const minPos: glm.ReadonlyVec3 = [
      Math.floor(currIndex[0] - chunkRange),
      Math.floor(currIndex[1] - chunkRange),
      Math.floor(currIndex[2] - chunkRange)
    ];
    const maxPos: glm.ReadonlyVec3 = [
      Math.floor(currIndex[0] + chunkRange),
      Math.floor(currIndex[1] + chunkRange),
      Math.floor(currIndex[2] + chunkRange)
    ];

    //
    // exclude the chunks that are too far away

    for (let ii = 0; ii < this._chunks.length; ) {
      const { indexPosition } = this._chunks[ii];

      const isOutOfRange =
        indexPosition[0] < minPos[0] ||
        indexPosition[0] > maxPos[0] ||
        indexPosition[1] < minPos[1] ||
        indexPosition[1] > maxPos[1] ||
        indexPosition[2] < minPos[2] ||
        indexPosition[2] > maxPos[2];

      if (isOutOfRange) {
        // remove chunk
        this._def.releaseGeometry(this._chunks[ii].geometry);
        this._chunks.splice(ii, 1);

        if (this._def.onChunkDiscarded) {
          this._def.onChunkDiscarded();
        }
      } else {
        ++ii;
      }
    }

    //
    // include in the generation queue the close enough chunks

    const currPos: glm.vec3 = [0, 0, 0];
    for (currPos[2] = minPos[2]; currPos[2] <= maxPos[2]; ++currPos[2]) {
      for (currPos[1] = minPos[1]; currPos[1] <= maxPos[1]; ++currPos[1]) {
        for (currPos[0] = minPos[0]; currPos[0] <= maxPos[0]; ++currPos[0]) {
          {
            const tmpIndex = this._chunks.findIndex((currChunk) => {
              const { indexPosition } = currChunk;
              return glm.vec3.exactEquals(indexPosition, currPos);
            });
            if (tmpIndex >= 0) {
              continue; // already processed
            }
          }

          {
            const tmpIndex = this._inUseWorkers.findIndex((currWorker) => {
              const { indexPosition } = currWorker.processing!;
              return glm.vec3.exactEquals(indexPosition, currPos);
            });

            if (tmpIndex >= 0) {
              continue; // already processing
            }
          }

          this._chunkPositionQueue.push({
            indexPosition: [...currPos],
            realPosition: [
              currPos[0] * this._def.chunkSize,
              currPos[1] * this._def.chunkSize,
              currPos[2] * this._def.chunkSize
            ]
          });
        }
      }
    }
  }

  private _launchWorker() {
    // determine the next chunk to process

    while (
      // is there something to process?
      this._chunkPositionQueue.length > 0 &&
      // is there an unused worker?
      this._unusedWorkers.length > 0
    ) {
      //
      // set worker as "in use"
      //

      const currentWorker = this._unusedWorkers.pop()!;
      this._inUseWorkers.push(currentWorker);

      //
      // find the "best" chunk to generate
      //

      const nextPositionData = this._getBestNextChunkPosition();

      currentWorker.processing = nextPositionData;

      currentWorker.instance.postMessage(
        {
          realPosition: nextPositionData.realPosition,
          indexPosition: nextPositionData.indexPosition,
          float32buffer: currentWorker.float32buffer
        } as IMessage,
        [
          // we now transfer the ownership of the vertices buffer
          currentWorker.float32buffer.buffer
        ]
      );
    }
  }

  private _getBestNextChunkPosition(): IPositionData {
    if (this._chunkPositionQueue.length === 0) {
      throw new Error('empty chunk position queue');
    }

    // if just 1 chunk left to process (or no priority callback)
    // -> just pop and process the next/last chunk in the queue
    if (this._chunkPositionQueue.length == 1) {
      return this._chunkPositionQueue.pop()!;
    }

    // from here, we determine the next best chunk to process

    const _getDistanceToCamera = (chunkPosition: glm.ReadonlyVec3) => {
      const chunkHSize = this._def.chunkSize * 0.5;

      const chunkCenter: glm.ReadonlyVec3 = [
        this._cameraPosition[0] - (chunkPosition[0] + chunkHSize),
        this._cameraPosition[1] - (chunkPosition[1] + chunkHSize),
        this._cameraPosition[2] - (chunkPosition[2] + chunkHSize)
      ];

      return glm.vec3.length(chunkCenter);
    };

    let bestIndex = 0;
    let bestMagnitude = _getDistanceToCamera(
      this._chunkPositionQueue[0].realPosition
    );

    for (let ii = 1; ii < this._chunkPositionQueue.length; ++ii) {
      const { realPosition } = this._chunkPositionQueue[ii];

      if (!this._def.chunkIsVisible(realPosition)) continue;

      const magnitude = _getDistanceToCamera(realPosition);
      if (bestMagnitude < magnitude) continue;

      bestIndex = ii;
      bestMagnitude = magnitude;
    }

    // removal
    return this._chunkPositionQueue.splice(bestIndex, 1)[0];
  }

  getChunks(): Chunks {
    return this._chunks;
  }

  getProcessingRealPositions(): glm.ReadonlyVec3[] {
    return this._inUseWorkers.map((worker) => worker.processing!.realPosition);
  }
}
