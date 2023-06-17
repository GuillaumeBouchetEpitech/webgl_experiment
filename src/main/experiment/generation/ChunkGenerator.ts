import * as glm from 'gl-matrix';

import {
  WorkerManager,
  ChunkManager,
  Chunks,
  IPositionData
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
  onChunkCreated?: () => void;
  onChunkDiscarded?: () => void;
}

interface WorkerData {
  geometryFloat32buffer: Float32Array;
  dataFloat32buffer: Float32Array;
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
      releaseGeometry: def.releaseGeometry
    });

    this._workerManager = new WorkerManager<WorkerData, IMessage>(
      (inWorkerData: WorkerData, inMessageData: IMessage) => {
        //
        // process response
        //

        const {
          indexPosition,
          realPosition,
          geometryFloat32buffer, // memory ownership transfer
          dataFloat32buffer, // memory ownership transfer
          sizeUsed
        } = inMessageData;

        const currTime = Date.now();
        const delta = currTime - inMessageData.time;
        this._frameProfiler.pushDelta(delta);

        inWorkerData.geometryFloat32buffer = geometryFloat32buffer;
        inWorkerData.dataFloat32buffer = dataFloat32buffer;

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
          sizeUsed,
          inWorkerData.dataFloat32buffer,
          this._geometryBufferSize
        );

        // launch again
        this._launchWorker();
      }
    );

    this._dataBufferSize = Math.pow(this._def.chunkLogicSize + 1 + 1, 3); // TODO: check size
    this._geometryBufferSize = this._dataBufferSize * 20 * 6 * 3; // 20 triangles (3 vertices, 6 floats each)

    for (let ii = 0; ii < this._def.workerTotal; ++ii) {
      this._workerManager.addOneWorker(this._def.workerFile, {
        geometryFloat32buffer: new Float32Array(this._geometryBufferSize),
        dataFloat32buffer: new Float32Array(this._dataBufferSize)
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
          dataFloat32buffer: inWorkerData.dataFloat32buffer,
          // dataBufferSize: this._dataBufferSize,
          sizeUsed: 0,
          time: Date.now()
        };

        inPushTask(payload, [
          inWorkerData.geometryFloat32buffer.buffer, // memory ownership transfer
          inWorkerData.dataFloat32buffer.buffer // memory ownership transfer
        ]);
      });
    }
  }

  getChunks(): Chunks {
    return this._chunkManager.getChunks();
  }

  // isColliding(
  //   inPosition: glm.ReadonlyVec3,
  //   inLog: (...args: any[]) => void
  // ): boolean {
  //   const realLogicSize = this._def.chunkLogicSize + 1 + 1;

  //   // const k_graphicLogicRatio = this._def.chunkGraphicSize / realLogicSize;

  //   // const k_chunkRange = 2;

  //   const logicalMinSqPos: glm.ReadonlyVec3 = [
  //     Math.floor((inPosition[0] / this._def.chunkGraphicSize) * realLogicSize),
  //     Math.floor((inPosition[1] / this._def.chunkGraphicSize) * realLogicSize),
  //     Math.floor((inPosition[2] / this._def.chunkGraphicSize) * realLogicSize)
  //   ];
  //   const logicalMaxSqPos: glm.ReadonlyVec3 = [
  //     Math.ceil((inPosition[0] / this._def.chunkGraphicSize) * realLogicSize),
  //     Math.ceil((inPosition[1] / this._def.chunkGraphicSize) * realLogicSize),
  //     Math.ceil((inPosition[2] / this._def.chunkGraphicSize) * realLogicSize)
  //   ];

  //   inLog(
  //     ` -- logic (${logicalMinSqPos[0]}_${logicalMaxSqPos[0]}) (${logicalMinSqPos[1]}_${logicalMaxSqPos[1]}) (${logicalMinSqPos[2]}_${logicalMaxSqPos[2]})`
  //   );
  //   // inLog(`    chunk (${minChunkPos[0]}_${maxChunkPos[0]}) (${minChunkPos[1]}_${maxChunkPos[1]}) (${minChunkPos[2]}_${maxChunkPos[2]})`);
  //   // inLog(`    local pos ${logicalSqPos}`);

  //   const allVals: number[] = [];

  //   loop3dimensions(logicalMinSqPos, logicalMaxSqPos, (inPos) => {
  //     const tmpChunkPos: glm.ReadonlyVec3 = [
  //       Math.floor(inPos[0] / realLogicSize),
  //       Math.floor(inPos[1] / realLogicSize),
  //       Math.floor(inPos[2] / realLogicSize)
  //     ];

  //     for (const currChunk of this._usedChunks) {
  //       const { indexPosition } = currChunk;

  //       if (
  //         indexPosition[0] !== tmpChunkPos[0] ||
  //         indexPosition[1] !== tmpChunkPos[1] ||
  //         indexPosition[2] !== tmpChunkPos[2]
  //       ) {
  //         continue;
  //       }

  //       const localIndex: glm.ReadonlyVec3 = [
  //         inPos[0] - indexPosition[0] * realLogicSize,
  //         inPos[1] - indexPosition[1] * realLogicSize,
  //         inPos[2] - indexPosition[2] * realLogicSize
  //       ];

  //       if (
  //         localIndex[0] < 0 ||
  //         localIndex[0] >= realLogicSize ||
  //         localIndex[1] < 0 ||
  //         localIndex[1] >= realLogicSize ||
  //         localIndex[2] < 0 ||
  //         localIndex[2] >= realLogicSize
  //       ) {
  //         continue;
  //       }

  //       const val = currChunk.data.get(
  //         localIndex[0],
  //         localIndex[1],
  //         localIndex[2]
  //       );

  //       inLog(
  //         `    -- ${tmpChunkPos[0]} ${tmpChunkPos[1]} ${tmpChunkPos[2]}`
  //       );
  //       inLog(
  //         `      -- ${localIndex[0]} ${localIndex[1]} ${localIndex[2]}`
  //       );
  //       inLog(`        -- ${val}`);

  //       allVals.push(val);
  //     }
  //   });

  //   // const minChunkPos: glm.ReadonlyVec3 = [
  //   //   Math.floor(logicalMinSqPos[0] / realLogicSize * this._def.chunkGraphicSize),
  //   //   Math.floor(logicalMinSqPos[1] / realLogicSize * this._def.chunkGraphicSize),
  //   //   Math.floor(logicalMinSqPos[2] / realLogicSize * this._def.chunkGraphicSize)
  //   // ];
  //   // const maxChunkPos: glm.ReadonlyVec3 = [
  //   //   Math.ceil(logicalMaxSqPos[0] / realLogicSize * this._def.chunkGraphicSize),
  //   //   Math.ceil(logicalMaxSqPos[1] / realLogicSize * this._def.chunkGraphicSize),
  //   //   Math.ceil(logicalMaxSqPos[2] / realLogicSize * this._def.chunkGraphicSize)
  //   // ];

  //   // inLog(` -- logic (${logicalMinSqPos[0]}_${logicalMaxSqPos[0]}) (${logicalMinSqPos[1]}_${logicalMaxSqPos[1]}) (${logicalMinSqPos[2]}_${logicalMaxSqPos[2]})`);
  //   // inLog(`    chunk (${minChunkPos[0]}_${maxChunkPos[0]}) (${minChunkPos[1]}_${maxChunkPos[1]}) (${minChunkPos[2]}_${maxChunkPos[2]})`);
  //   // // inLog(`    local pos ${logicalSqPos}`);

  //   // //
  //   // //

  //   // const allVals: number[] = [];

  //   // for (const currChunk of this._usedChunks) {

  //   //   const { indexPosition: chunkIndex } = currChunk;

  //   //   const isOutOfRange =
  //   //     chunkIndex[0] < minChunkPos[0] ||
  //   //     chunkIndex[0] > maxChunkPos[0] ||
  //   //     chunkIndex[1] < minChunkPos[1] ||
  //   //     chunkIndex[1] > maxChunkPos[1] ||
  //   //     chunkIndex[2] < minChunkPos[2] ||
  //   //     chunkIndex[2] > maxChunkPos[2];

  //   //   if (isOutOfRange) {
  //   //     continue;
  //   //   }

  //   //   // LOOP HERE
  //   //   // LOOP HERE
  //   //   // LOOP HERE

  //   //   // logicalSqPos

  //   //   const localIndex: glm.ReadonlyVec3 = [
  //   //     logicalSqPos[0] - chunkIndex[0] * realLogicSize,
  //   //     logicalSqPos[1] - chunkIndex[1] * realLogicSize,
  //   //     logicalSqPos[2] - chunkIndex[2] * realLogicSize,
  //   //   ];

  //   //   if (
  //   //     localIndex[0] < 0 || localIndex[0] >= realLogicSize ||
  //   //     localIndex[1] < 0 || localIndex[1] >= realLogicSize ||
  //   //     localIndex[2] < 0 || localIndex[2] >= realLogicSize
  //   //   ) {
  //   //     continue;
  //   //   }

  //   //   const val = currChunk.data.get(localIndex[0], localIndex[1], localIndex[2]);

  //   //   inLog(`    -- ${chunkIndex[0]} ${chunkIndex[1]} ${chunkIndex[2]}`);
  //   //   inLog(`      -- ${localIndex[0]} ${localIndex[1]} ${localIndex[2]}`);
  //   //   inLog(`        -- ${val}`);

  //   //   allVals.push(val);
  //   //   // if (val > 0.5) {
  //   //   //   return true;
  //   //   // }

  //   // //   inLog('   -- localPos', minLocalPos, maxLocalPos);

  //   // //   for (let iZ = minLocalPos[2]; iZ <= maxLocalPos[2]; ++iZ) {
  //   // //     for (let iY = minLocalPos[1]; iY <= maxLocalPos[1]; ++iY) {
  //   // //       for (let iX = minLocalPos[0]; iX <= maxLocalPos[0]; ++iX) {

  //   // //         if (currChunk.data.get(iX, iY, iZ) < 0.5) {
  //   // //           return true;
  //   // //         }

  //   // //       }
  //   // //     }
  //   // //   }

  //   // }

  //   if (allVals.length > 0) {
  //     let average = 0;
  //     allVals.forEach((val) => (average += val));
  //     average /= allVals.length;

  //     inLog(` average: ${average}`);

  //     if (average > 0.5) {
  //       return true;
  //     }
  //   }

  //   return false;
  // }

  getFrameProfiler(): Readonly<FrameProfiler> {
    return this._frameProfiler;
  }

  getProcessingRealPositions(): glm.ReadonlyVec3[] {
    return this._workerManager
      .getInUseWorkersData()
      .map((workerData) => workerData.processing!.realPosition);
  }
}
