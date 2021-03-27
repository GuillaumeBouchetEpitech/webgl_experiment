
import chunk_size from '../../constants';

import { GeometryWrapper } from '../webGLRenderer/utils/Geometry';

type Vec3 = [number, number, number];

interface IChunkGeneratorDef {
    chunk_is_visible: ((pos: Vec3) => void);
    point_is_visible: ((pos: Vec3) => void);
    add_geom: ((buffer: Float32Array) => GeometryWrapper.Geometry);
    update_geom: ((geom: GeometryWrapper.Geometry, buffer: Float32Array) => void);
};

interface IChunk {
    position: Vec3;
    geometry: GeometryWrapper.Geometry;
    coord2d: [number, number] | null;
    visible: boolean;
};

export type Chunks = IChunk[];

enum WorkerStatus {
    available = 1,
    working = 2,
};

interface IWorkerInstance {
    instance: Worker;
    float32buffer: Float32Array;
    status: WorkerStatus;
};

class ChunkGenerator {

    private _running: boolean = false;
    private _chunks: Chunks = []; // live chunks
    private _chunk_queue: Vec3[] = []; // position to be processed
    private _geoms: GeometryWrapper.Geometry[] = [];
    private _saved_index: Vec3 = [1,0,0]; // <- currently 1/0/0 but any other value than 0/0/0 will work

    private _workers: IWorkerInstance[] = [];

    private _camera_pos: Vec3 = [0, 0, 0];

    private _def: IChunkGeneratorDef;

    private _processing_pos: Vec3[] = []; // TODO: this is ugly

    constructor(def: IChunkGeneratorDef) {

        this._def = def;

        for (let ii = 0; ii < 2; ++ii) {

            const new_worker: IWorkerInstance = {
                instance: new Worker("./dist/worker.js"),
                float32buffer: new Float32Array(1000000),
                status: WorkerStatus.available,
            };

            const on_worker_message = (event: MessageEvent) => {

                const position = event.data.position;
                new_worker.float32buffer = event.data.float32buffer; // we now own the vertices buffer
                new_worker.status = WorkerStatus.available;

                // find and remove the position
                for (let ii = 0; ii < this._processing_pos.length; ++ii) {
                    if (this._processing_pos[ii][0] === position[0] &&
                        this._processing_pos[ii][1] === position[1] &&
                        this._processing_pos[ii][2] === position[2]) {

                        this._processing_pos.splice(ii, 1);
                        break;
                    }
                }

                if (!this._running)
                    return;

                let geometry: GeometryWrapper.Geometry | undefined = undefined;
                if (this._geoms.length == 0) {

                    geometry = this._def.add_geom(new_worker.float32buffer);
                }
                else {

                    geometry = this._geoms.pop();
                    if (geometry)
                        this._def.update_geom(geometry, new_worker.float32buffer);
                }

                if (!geometry) {

                    console.log('worker: processing the result -> invalid geometry');
                }
                else {

                    // save
                    this._chunks.push({
                        position,
                        geometry,
                        coord2d: null,
                        visible: false
                    });

                    // launch again
                    this._launchWorker();
                }
            };

            new_worker.instance.addEventListener("message", on_worker_message, false);

            this._workers.push(new_worker);
        }
    }

    start() {
        this._running = true;
    }

    stop() {
        if (!this._running)
            return;

        this._running = false;

        this._chunk_queue.length = 0;
        this._chunks.length = 0;
        this._geoms.length = 0;
    }

    update(camera_pos: Vec3) {

        if (!this._running)
            return;

        //  check if move to ask chunks
        //      -> if yes
        //          reset chunk queue
        //          exclude chunk out of range
        //          include chunk in range

        this._camera_pos = camera_pos;

        const curr_index = [
            Math.floor(camera_pos[0] / chunk_size)|0,
            Math.floor(camera_pos[1] / chunk_size)|0,
            Math.floor(camera_pos[2] / chunk_size)|0
        ];

        // did we move to another chunk?
        if (this._chunks.length == 0 ||
            curr_index[0] != this._saved_index[0] ||
            curr_index[1] != this._saved_index[1] ||
            curr_index[2] != this._saved_index[2]) {

            // yes -> save as the new current chunk
            this._saved_index[0] = curr_index[0];
            this._saved_index[1] = curr_index[1];
            this._saved_index[2] = curr_index[2];

            //

            // clear the generation queue
            this._chunk_queue.length = 0;

            // the range of chunk generation/exclusion
            const range = 3|0;

            const min_index: Vec3 = [
                Math.floor(curr_index[0] - range),
                Math.floor(curr_index[1] - range),
                Math.floor(curr_index[2] - range),
            ];
            const max_index: Vec3 = [
                Math.floor(curr_index[0] + range),
                Math.floor(curr_index[1] + range),
                Math.floor(curr_index[2] + range),
            ];

            //
            // exclude the chunks that are too far away

            for (let ii = 0; ii < this._chunks.length; ++ii) {

                const curr_pos = [
                    (this._chunks[ii].position[0] / chunk_size)|0,
                    (this._chunks[ii].position[1] / chunk_size)|0,
                    (this._chunks[ii].position[2] / chunk_size)|0
                ];

                if (curr_pos[0] < min_index[0] || curr_pos[0] > max_index[0] ||
                    curr_pos[1] < min_index[1] || curr_pos[1] > max_index[1] ||
                    curr_pos[2] < min_index[2] || curr_pos[2] > max_index[2]) {

                    // this._chunks[i].geom.dispose();
                    this._geoms.push(this._chunks[ii].geometry);
                    this._chunks.splice(ii, 1);
                    --ii;
                }
            }

            //
            // include in the generation queue the close enough chunks

            for (let zz = min_index[2]; zz <= max_index[2]; ++zz)
            for (let yy = min_index[1]; yy <= max_index[1]; ++yy)
            for (let xx = min_index[0]; xx <= max_index[0]; ++xx) {

                const position: Vec3 = [
                    xx * chunk_size,
                    yy * chunk_size,
                    zz * chunk_size
                ];

                /// already processed ?
                let found = false;
                for (let jj = 0; jj < this._chunks.length; ++jj) {
                    if (this._chunks[jj].position[0] === position[0] &&
                        this._chunks[jj].position[1] === position[1] &&
                        this._chunks[jj].position[2] === position[2]) {

                        found = true;
                        break;
                    }
                }

                if (found) // is already processed
                    continue;

                this._chunk_queue.push(position);
            }

            //
            //

            this._launchWorker();
        }
    }

    private _launchWorker() {

        const currentWorker = this._workers.find(item => item.status == WorkerStatus.available);
        if (currentWorker === undefined)
            return;

        // determine the next chunk to process

        // is there something to process?
        if (this._chunk_queue.length == 0)
            return; // no

        let next_position: Vec3 | undefined = undefined;

        // if just 1 chunk left to process (or no priority callback)
        // -> just pop and process the next/last chunk in the queue
        if (this._chunk_queue.length == 1) {

            next_position = this._chunk_queue.pop();
        }
        else {

            // from here, we determine the next best chunk to process

            const computeMagnitude = (x: number, y: number, z: number) => {
                return Math.sqrt(x * x + y * y + z * z);
            };

            let best_index = -1;
            let best_magnitude = 9999;
            let best_pos: Vec3 | undefined = undefined;

            for (let ii = 0; ii < this._chunk_queue.length; ++ii) {

                const try_pos = this._chunk_queue[ii];

                if (best_index == -1 || this._def.chunk_is_visible(try_pos)) {

                    const magnitude = computeMagnitude(
                        this._camera_pos[0] - try_pos[0] - chunk_size / 2,
                        this._camera_pos[1] - try_pos[1] - chunk_size / 2,
                        this._camera_pos[2] - try_pos[2] - chunk_size / 2);

                    if (best_magnitude < magnitude)
                        continue;

                    best_index = ii;
                    best_magnitude = magnitude;

                    best_pos = this._chunk_queue[best_index];
                }
            }

            // removal
            this._chunk_queue.splice(best_index,1);

            next_position = best_pos;
        }

        if (next_position === undefined)
            return;

        this._processing_pos.push(next_position);

        currentWorker.status = WorkerStatus.working;
        currentWorker.instance.postMessage({
            position: next_position,
            float32buffer: currentWorker.float32buffer
        }, [
            // we now transfer the ownership of the vertices buffer
            currentWorker.float32buffer.buffer
        ]);
    }

    getChunks(): Chunks {
        return this._chunks;
    }

    getProcessingPositions(): Vec3[] {
        return this._processing_pos;
    }
};

export default ChunkGenerator;
