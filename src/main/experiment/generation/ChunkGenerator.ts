import * as glm from 'gl-matrix';

import {
  WorkerManager,
  ChunkManager,
  Chunks,
  IPositionData,
  OnWorkerResult
} from './internals';

import { ILiveGeometry } from '../webGLRenderer/WebGLRenderer';
import { FrameProfiler } from '../utils/FrameProfiler';
import { IMessage } from '../../../_common';

type Vec3 = [number, number, number];

interface IChunkGeneratorDef {
  chunkGraphicSize: number;
  chunkGenerationRange: number;
  chunkLogicSize: number;
  workerTotal: number;
  workerFile: string;
  chunkIsVisible: (pos: Readonly<Vec3>) => boolean;
  acquireGeometry: (inSize: number) => ILiveGeometry;
  releaseGeometry: (inGeom: ILiveGeometry) => void;
  onChunkCreated: () => void;
  onChunkDiscarded: () => void;
}

interface WorkerData {
  geometryFloat32buffer: Float32Array;
  processing?: IPositionData;
}

export class ChunkGenerator {
  private _def: Pick<
    IChunkGeneratorDef,
    'workerFile' | 'workerTotal' | 'chunkLogicSize'
  >;
  private _geometryBufferSize: number;
  private _dataBufferSize: number;

  private _running: boolean = false;
  private _chunkManager: ChunkManager;

  private _workerManager: WorkerManager<WorkerData, IMessage>;

  private _frameProfiler = new FrameProfiler();

  constructor(def: IChunkGeneratorDef) {
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

    const onWorkerResult: OnWorkerResult<WorkerData, IMessage> = (
      inWorkerData: WorkerData,
      inMessageData: IMessage
    ) => {
      //
      // process response
      //

      const {
        indexPosition,
        realPosition,
        geometryFloat32buffer, // memory ownership transfer
        geometryBufferSize,
        sizeUsed
      } = inMessageData;

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

      this._chunkManager.pushNew(
        indexPosition,
        realPosition,
        inWorkerData.geometryFloat32buffer,
        geometryBufferSize,
        sizeUsed
      );

      // launch again
      this._launchWorker();
    };

    this._workerManager = new WorkerManager<WorkerData, IMessage>(
      onWorkerResult
    );

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
    if (!this._running) return;

    this._running = false;

    this._chunkManager.clear();
  }

  update(cameraPosition: glm.ReadonlyVec3) {
    if (!this._running) return;

    //
    //

    this._chunkManager.update(cameraPosition, this._workerManager);

    //
    //

    this._launchWorker();
  }

  private _launchWorker() {
    // determine the next chunk to process

    while (
      // is there something to process?
      this._chunkManager.isNotDone() &&
      // is there an unused worker?
      this._workerManager.isWorkerAvailable()
    ) {
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

        const payload: IMessage = {
          realPosition: nextPositionData.realPosition,
          indexPosition: nextPositionData.indexPosition,
          geometryFloat32buffer: inWorkerData.geometryFloat32buffer,
          geometryBufferSize: this._geometryBufferSize,
          sizeUsed: 0,
          time: Date.now()
        };

        const transferable: Transferable[] = [
          inWorkerData.geometryFloat32buffer.buffer // memory ownership transfer
        ];

        inPushTask(payload, transferable);
      });
    }
  }

  getChunks(): Chunks {
    return this._chunkManager.getChunks();
  }

  getFrameProfiler(): Readonly<FrameProfiler> {
    return this._frameProfiler;
  }

  getProcessingRealPositions(): glm.ReadonlyVec3[] {
    return this._workerManager
      .getInUseWorkersData()
      .map((workerData) => workerData.processing!.realPosition);
  }
}
