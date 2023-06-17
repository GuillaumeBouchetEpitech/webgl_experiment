import * as glm from 'gl-matrix';

import { ILiveGeometry } from '../../webGLRenderer/WebGLRenderer';

import { Vec3HashSet, CubeData, loop3dimensions, IWorkerManager } from '.';

type Vec3 = [number, number, number];

export interface IPositionData {
  realPosition: Vec3;
  indexPosition: Vec3;
}

interface IChunk {
  realPosition: Vec3;
  indexPosition: Vec3;
  geometry: ILiveGeometry;
  isVisible: boolean;
  data: CubeData;
}

export type Chunks = ReadonlyArray<IChunk>;

interface IChunkManagerDef {
  chunkGraphicSize: number;
  chunkGenerationRange: number;
  chunkLogicSize: number;
  chunkIsVisible: (pos: Readonly<Vec3>) => boolean;
  acquireGeometry: (inSize: number) => ILiveGeometry;
  releaseGeometry: (inGeom: ILiveGeometry) => void;
  onChunkCreated?: () => void;
  onChunkDiscarded?: () => void;
}

export class ChunkManager {

  private _def: IChunkManagerDef;

  private _cameraPosition: glm.vec3 = glm.vec3.fromValues(0, 0, 0);
  private _chunkPositionQueue: IPositionData[] = []; // position to be processed
  private _savedIndex: glm.vec3 = [999, 999, 999]; // any other value than 0/0/0 will work

  private _unusedChunks: IChunk[] = []; // live chunks
  private _usedChunks: IChunk[] = []; // live chunks
  private _usedSet = new Vec3HashSet();

  constructor(inDef: IChunkManagerDef) {
    this._def = inDef;
  }

  clear() {

    this._chunkPositionQueue.length = 0;

    this._unusedChunks.forEach((chunk) =>
      this._def.releaseGeometry(chunk.geometry)
    );
    this._unusedChunks.length = 0;
    this._usedChunks.forEach((chunk) =>
      this._def.releaseGeometry(chunk.geometry)
    );
    this._usedChunks.length = 0;
    this._usedSet.clear();
  }

  isEmpty() {
    return this._usedChunks.length === 0;
  }

  isNotDone() {
    return this._chunkPositionQueue.length > 0;
  }

  getChunks(): Chunks {
    return this._usedChunks;
  }

  pushNew(
    indexPosition: Vec3,
    realPosition: Vec3,
    geometryFloat32buffer: Float32Array,
    geometryBufferSizeUsed: number,
    dataFloat32buffer: Float32Array,
    inGeometryBufferSize: number
  ) {

    const geometry = this._def.acquireGeometry(inGeometryBufferSize);

    geometry.update(realPosition, geometryFloat32buffer, geometryBufferSizeUsed);

    // save
    if (this._unusedChunks.length === 0) {
      this._usedChunks.push({
        realPosition,
        indexPosition,
        geometry,
        isVisible: false,
        data: new CubeData(
          new Float32Array(dataFloat32buffer),
          this._def.chunkLogicSize + 1 + 1
        )
      });
    } else {
      const reused = this._unusedChunks.pop()!;
      reused.realPosition = realPosition;
      reused.indexPosition = indexPosition;
      reused.isVisible = false;
      reused.data.copy(dataFloat32buffer);
      this._usedChunks.push(reused);
    }

    this._usedSet.add(indexPosition);


    if (this._def.onChunkCreated) {
      this._def.onChunkCreated();
    }

  }

  update(cameraPosition: glm.ReadonlyVec3, inWorkerManager: IWorkerManager<{ processing?: IPositionData }>) {

    this._updateGeneration(cameraPosition, inWorkerManager);

    for (const currChunk of this._usedChunks) {
      const isVisible = this._def.chunkIsVisible(currChunk.realPosition);

      currChunk.isVisible = isVisible;
      currChunk.geometry.setVisibility(isVisible);
    }
  }

  private _updateGeneration(inCameraPosition: glm.ReadonlyVec3, inWorkerManager: IWorkerManager<{ processing?: IPositionData }>) {
    //  check if moved enough to justify asking for new chunks
    //      -> if yes
    //          reset chunk queue
    //          exclude chunk out of range
    //          include chunk in range

    glm.vec3.copy(this._cameraPosition, inCameraPosition);

    const currIndex: glm.ReadonlyVec3 = [
      Math.floor(inCameraPosition[0] / this._def.chunkGraphicSize),
      Math.floor(inCameraPosition[1] / this._def.chunkGraphicSize),
      Math.floor(inCameraPosition[2] / this._def.chunkGraphicSize)
    ];


    let needRefresh = false;

    // first time, no chunks yet?
    if (this._usedChunks.length === 0 && inWorkerManager.areAllWorkerAvailable()) {
      needRefresh = true;
    }

    // still in the same chunk?
    if (!needRefresh && !glm.vec3.exactEquals(currIndex, this._savedIndex)) {
      needRefresh = true;
    }

    if (needRefresh === false) {
      return;
    }

    // yes -> save as the new current chunk
    glm.vec3.copy(this._savedIndex, currIndex);

    //

    // clear the generation queue
    this._chunkPositionQueue.length = 0;

    // the range of chunk generation/exclusion
    const { chunkGenerationRange } = this._def;

    const minChunkPos: glm.ReadonlyVec3 = [
      Math.floor(currIndex[0] - chunkGenerationRange),
      Math.floor(currIndex[1] - chunkGenerationRange),
      Math.floor(currIndex[2] - chunkGenerationRange)
    ];
    const maxChunkPos: glm.ReadonlyVec3 = [
      Math.floor(currIndex[0] + chunkGenerationRange),
      Math.floor(currIndex[1] + chunkGenerationRange),
      Math.floor(currIndex[2] + chunkGenerationRange)
    ];

    //
    // exclude the chunks that are too far away

    for (let ii = 0; ii < this._usedChunks.length; ) {
      const { indexPosition } = this._usedChunks[ii];

      const isOutOfRange =
        indexPosition[0] < minChunkPos[0] ||
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

        if (this._def.onChunkDiscarded) {
          this._def.onChunkDiscarded();
        }
      } else {
        ++ii;
      }
    }

    //
    // include in the generation queue the close enough chunks

    loop3dimensions(minChunkPos, maxChunkPos, (inPos) => {

      {
        const tmpIndex = this._usedChunks.findIndex((currChunk) => {
          return this._usedSet.has(currChunk.indexPosition);
        });
        if (tmpIndex >= 0) {
          return; // already processed
        }
      }

      {
        const tmpIndex = inWorkerManager.getInUseWorkersData().findIndex((currWorker) => {
          return glm.vec3.exactEquals(currWorker.processing!.indexPosition, inPos);
        });

        if (tmpIndex >= 0) {
          return; // already processing
        }
      }

      this._chunkPositionQueue.push({
        indexPosition: [...inPos],
        realPosition: [
          inPos[0] * this._def.chunkGraphicSize,
          inPos[1] * this._def.chunkGraphicSize,
          inPos[2] * this._def.chunkGraphicSize
        ]
      });

    });
  }

  getBestNextChunkPosition(): IPositionData | undefined {
    if (this._chunkPositionQueue.length === 0) {
      return undefined;
    }

    // from here, we determine the next best chunk to process

    const _getDistanceToCamera = (chunkPosition: glm.ReadonlyVec3) => {
      const chunkHSize = this._def.chunkGraphicSize * 0.5;

      const chunkCenter: glm.ReadonlyVec3 = [
        this._cameraPosition[0] - (chunkPosition[0] + chunkHSize),
        this._cameraPosition[1] - (chunkPosition[1] + chunkHSize),
        this._cameraPosition[2] - (chunkPosition[2] + chunkHSize)
      ];

      return glm.vec3.length(chunkCenter);
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