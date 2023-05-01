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
  position: glm.ReadonlyVec3;
  geometry: ILiveGeometry;
  isVisible: boolean;
}

export type Chunks = IChunk[];

interface IWorkerInstance {
  instance: Worker;
  float32buffer: Float32Array;
}

export class ChunkGenerator {
  private _def: IChunkGeneratorDef;

  private _running: boolean = false;
  private _chunks: Chunks = []; // live chunks
  private _chunkPositionQueue: glm.ReadonlyVec3[] = []; // position to be processed
  private _savedIndex: glm.vec3 = [999, 999, 999]; // any other value than 0/0/0 will work

  private _unusedWorkers: IWorkerInstance[] = [];
  private _inUseWorkers: IWorkerInstance[] = [];

  private _cameraPosition: glm.vec3 = glm.vec3.fromValues(0, 0, 0);

  private _processingPositions: glm.ReadonlyVec3[] = [];

  constructor(def: IChunkGeneratorDef) {
    this._def = def;

    for (let ii = 0; ii < this._def.workerTotal; ++ii) this._addWorker();
  }

  private _addWorker() {
    const newWorker: IWorkerInstance = {
      instance: new Worker(this._def.workerFile),
      float32buffer: new Float32Array(this._def.workerBufferSize),
    };

    const onWorkerMessage = (event: MessageEvent) => {
      const position = event.data.position;
      newWorker.float32buffer = event.data.float32buffer; // we now own the vertices buffer

      const index = this._inUseWorkers.indexOf(newWorker);
      if (index >= 0) {
        this._unusedWorkers.push(newWorker);
        this._inUseWorkers.splice(index, 1);
      }

      const sizeUsed = event.data.sizeUsed;

      // find and remove the position
      for (let ii = 0; ii < this._processingPositions.length; ++ii) {
        if (
          this._processingPositions[ii][0] === position[0] &&
          this._processingPositions[ii][1] === position[1] &&
          this._processingPositions[ii][2] === position[2]
        ) {
          this._processingPositions.splice(ii, 1);
          break;
        }
      }

      if (!this._running) return;

      const geometry = this._def.acquireGeometry();

      geometry.update(newWorker.float32buffer, sizeUsed);

      // save
      this._chunks.push({
        position,
        geometry,
        isVisible: false
      });

      if (this._def.onChunkCreated) this._def.onChunkCreated();

      // launch again
      this._launchWorker();
    };

    newWorker.instance.addEventListener('message', onWorkerMessage, false);

    this._unusedWorkers.push(newWorker);
  }

  start() {
    this._running = true;
  }

  stop() {
    if (!this._running) return;

    this._running = false;

    this._chunkPositionQueue.length = 0;
    this._chunks.forEach(chunk => this._def.releaseGeometry(chunk.geometry));
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

      const isVisible = this._def.chunkIsVisible(currChunk.position);

      currChunk.isVisible = isVisible;
      currChunk.geometry.setVisibility(isVisible);
    }

    //
    //

    this._launchWorker();
  }

  private _updateGeneration(cameraPosition: glm.ReadonlyVec3) {

    //  check if moved enough to justify asking for new chunks
    //      -> if yes
    //          reset chunk queue
    //          exclude chunk out of range
    //          include chunk in range

    glm.vec3.copy(this._cameraPosition, cameraPosition);

    const currIndex = [
      Math.floor(cameraPosition[0] / this._def.chunkSize),
      Math.floor(cameraPosition[1] / this._def.chunkSize),
      Math.floor(cameraPosition[2] / this._def.chunkSize)
    ];

    // did we move to another chunk?
    if (
      !(
        this._chunks.length == 0 ||
        currIndex[0] != this._savedIndex[0] ||
        currIndex[1] != this._savedIndex[1] ||
        currIndex[2] != this._savedIndex[2]
      )
    ) {
      // no -> stop here
      return;
    }

    // yes -> save as the new current chunk
    this._savedIndex[0] = currIndex[0];
    this._savedIndex[1] = currIndex[1];
    this._savedIndex[2] = currIndex[2];

    //

    // clear the generation queue
    this._chunkPositionQueue.length = 0;

    // the range of chunk generation/exclusion
    const range = this._def.chunkRange;

    const minIndex: glm.ReadonlyVec3 = [
      Math.floor(currIndex[0] - range),
      Math.floor(currIndex[1] - range),
      Math.floor(currIndex[2] - range)
    ];
    const maxIndex: glm.ReadonlyVec3 = [
      Math.floor(currIndex[0] + range),
      Math.floor(currIndex[1] + range),
      Math.floor(currIndex[2] + range)
    ];

    //
    // exclude the chunks that are too far away

    for (let ii = 0; ii < this._chunks.length; ++ii) {
      const curr_pos = [
        Math.floor(this._chunks[ii].position[0] / this._def.chunkSize),
        Math.floor(this._chunks[ii].position[1] / this._def.chunkSize),
        Math.floor(this._chunks[ii].position[2] / this._def.chunkSize)
      ];

      if (
        curr_pos[0] < minIndex[0] ||
        curr_pos[0] > maxIndex[0] ||
        curr_pos[1] < minIndex[1] ||
        curr_pos[1] > maxIndex[1] ||
        curr_pos[2] < minIndex[2] ||
        curr_pos[2] > maxIndex[2]
      ) {

        this._def.releaseGeometry(this._chunks[ii].geometry);
        this._chunks.splice(ii, 1);
        --ii;

        if (this._def.onChunkDiscarded) this._def.onChunkDiscarded();
      }
    }

    //
    // include in the generation queue the close enough chunks

    for (let zz = minIndex[2]; zz <= maxIndex[2]; ++zz) {
      for (let yy = minIndex[1]; yy <= maxIndex[1]; ++yy) {
        for (let xx = minIndex[0]; xx <= maxIndex[0]; ++xx) {
          const position: glm.ReadonlyVec3 = [
            xx * this._def.chunkSize,
            yy * this._def.chunkSize,
            zz * this._def.chunkSize
          ];

          /// already processed ?
          let found = false;
          for (const currChunk of this._chunks) {
            const currPosition = currChunk.position;

            if (
              currPosition[0] === position[0] &&
              currPosition[1] === position[1] &&
              currPosition[2] === position[2]
            ) {
              found = true;
              break;
            }
          }

          if (found)
            // is already processed
            continue;

          this._chunkPositionQueue.push(position);
        }
      }
    }

  }

  private _launchWorker() {

    // determine the next chunk to process

    // is there something to process?
    if (this._chunkPositionQueue.length == 0) return; // no

    // is there an unused worker?
    if (this._unusedWorkers.length === 0) return;
    const currentWorker = this._unusedWorkers.pop()!;
    this._inUseWorkers.push(currentWorker);

    let nextPosition: glm.ReadonlyVec3 | undefined = undefined;

    // if just 1 chunk left to process (or no priority callback)
    // -> just pop and process the next/last chunk in the queue
    if (this._chunkPositionQueue.length == 1) {
      nextPosition = this._chunkPositionQueue.pop();
    } else {
      // from here, we determine the next best chunk to process

      const _getDistanceToCamera = (chunkPosition: glm.ReadonlyVec3) => {
        const chunkHSize = this._def.chunkSize * 0.5;

        const chunkCenter: glm.ReadonlyVec3 = [
          this._cameraPosition[0] - chunkPosition[0] - chunkHSize,
          this._cameraPosition[1] - chunkPosition[1] - chunkHSize,
          this._cameraPosition[2] - chunkPosition[2] - chunkHSize
        ];

        const magnitude = glm.vec3.length(chunkCenter);

        return magnitude;
      };

      let bestIndex = 0;
      let bestMagnitude = _getDistanceToCamera(this._chunkPositionQueue[bestIndex]);

      for (let ii = 1; ii < this._chunkPositionQueue.length; ++ii) {
        const chunkPosition = this._chunkPositionQueue[ii];

        if (!this._def.chunkIsVisible(chunkPosition))
          continue;

        const magnitude = _getDistanceToCamera(chunkPosition);
        if (bestMagnitude < magnitude)
          continue;

        bestIndex = ii;
        bestMagnitude = magnitude;
      }

      nextPosition = this._chunkPositionQueue[bestIndex];

      // removal
      this._chunkPositionQueue.splice(bestIndex, 1);
    }

    if (nextPosition === undefined) return;

    this._processingPositions.push(nextPosition);

    currentWorker.instance.postMessage(
      {
        position: nextPosition,
        float32buffer: currentWorker.float32buffer
      },
      [
        // we now transfer the ownership of the vertices buffer
        currentWorker.float32buffer.buffer
      ]
    );
  }

  getChunks(): Chunks {
    return this._chunks;
  }

  getProcessingPositions(): glm.ReadonlyVec3[] {
    return this._processingPositions;
  }
}
