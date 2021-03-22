
import g_data from '../data/Data';

import { GeometryWrapper } from '../rendererWebGL/utils/Geometry';

interface IChunk {
    pos: [number, number, number];
    geom: GeometryWrapper.Geometry;
    coord2d: [number, number] | null;
    visible: boolean;
};

type Chunks = IChunk[];

class ChunkGenerator {

    private _running: boolean = false;
    private _chunks: Chunks = []; // live chunks
    private _chunk_queue: [number, number, number][] = []; // position to be processed
    private _geoms: GeometryWrapper.Geometry[] = [];
    private _saved_index: number[] = [1,0,0]; // <- currently 1/0/0 but any other value than 0/0/0 will work
    private _myWorker_buffer: Float32Array = new Float32Array(100000);
    private _myWorker: Worker;
    private _myWorker_status: number = 1; // worker available
    private _camera_pos: [number, number, number] = [0, 0, 0]

    public processing_pos: [number, number, number] | null = null; // TODO: this is ugly
    public is_processing_chunk: boolean = false; // TODO: this is ugly

    constructor() {

        this._myWorker = new Worker("./dist/worker.js");
        this._myWorker.addEventListener("message", (event: MessageEvent) => {

            this._myWorker_buffer = event.data.vertices; // we now own the vertices buffer
            this._myWorker_status = 1; // worker available

            if (!this._running)
                return;

            const pos = event.data.pos;

            let geom = null;
            if (this._geoms.length == 0) {

                if (g_data.add_geom)
                    geom = g_data.add_geom(this._myWorker_buffer);
            }
            else {

                if (g_data.update_geom) {

                    geom = this._geoms.pop();
                    if (geom)
                        g_data.update_geom(geom, this._myWorker_buffer);
                }
            }

            if (!geom) {

                console.log('worker: processing the result -> invalid geom');
            }
            else {

                // save

                this._chunks.push({
                    pos,
                    geom,
                    coord2d: null,
                    visible: false
                });

                this.is_processing_chunk = false;

                // launch again

                this._launch_worker();
            }
        });
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

    update(camera_pos: [number, number, number]) {

        if (!this._running)
            return;

        //  check if move to ask chunks
        //      -> if yes
        //          reset chunk queue
        //          exclude chunk out of range
        //          include chunk in range

        this._camera_pos = camera_pos;

        const curr_index = [
            Math.floor(camera_pos[0] / g_data.logic.k_chunk_size)|0,
            Math.floor(camera_pos[1] / g_data.logic.k_chunk_size)|0,
            Math.floor(camera_pos[2] / g_data.logic.k_chunk_size)|0
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
            var range = 3|0;

            var min_index = new Int32Array([
                (curr_index[0] - range)|0,
                (curr_index[1] - range)|0,
                (curr_index[2] - range)|0,
            ]);
            var max_index = new Int32Array([
                (curr_index[0] + range)|0,
                (curr_index[1] + range)|0,
                (curr_index[2] + range)|0,
            ]);

            //
            // exclude the chunks that are too far away

            for (let ii = 0; ii < this._chunks.length; ++ii) {

                const curr_pos = [
                    (this._chunks[ii].pos[0] / g_data.logic.k_chunk_size)|0,
                    (this._chunks[ii].pos[1] / g_data.logic.k_chunk_size)|0,
                    (this._chunks[ii].pos[2] / g_data.logic.k_chunk_size)|0
                ];

                if (curr_pos[0] < min_index[0] || curr_pos[0] > max_index[0] ||
                    curr_pos[1] < min_index[1] || curr_pos[1] > max_index[1] ||
                    curr_pos[2] < min_index[2] || curr_pos[2] > max_index[2]) {

                    // this._chunks[i].geom.dispose();
                    this._geoms.push(this._chunks[ii].geom);
                    this._chunks.splice(ii, 1);
                    --ii;
                }
            }

            //
            // include in the generation queue the close enough chunks

            for (let zz = min_index[2]; zz <= max_index[2]; ++zz)
            for (let yy = min_index[1]; yy <= max_index[1]; ++yy)
            for (let xx = min_index[0]; xx <= max_index[0]; ++xx) {

                const pos: [number, number, number] = [
                    xx * g_data.logic.k_chunk_size,
                    yy * g_data.logic.k_chunk_size,
                    zz * g_data.logic.k_chunk_size
                ]

                /// already processed ?
                let found = false;
                for (var jj = 0; jj < this._chunks.length; ++jj) {
                    if (this._chunks[jj].pos[0] === pos[0] &&
                        this._chunks[jj].pos[1] === pos[1] &&
                        this._chunks[jj].pos[2] === pos[2]) {

                        found = true;
                        break;
                    }
                }

                if (found) // is already processed
                    continue;

                this._chunk_queue.push(pos);
            }

            //
            //

            this._launch_worker();
        }
    }

    private _launch_worker() {

        // webworker available?

        if (this._myWorker_status != 1) // worker working
            return;

        // available -> determine the next chunk to process

        // is there something to process?
        if (this._chunk_queue.length == 0)
            return; // no

        // if just 1 chunk left to process (or no priority callback)
        // -> just pop and process the next/last chunk in the queue
        if (this._chunk_queue.length == 1) {

            const position = this._chunk_queue.pop();
            if (position)
                this.processing_pos = position;
        }
        else {

            // from here, we determine the next best chunk to process

            const calc_length = (x: number, y: number, z: number) => {
                return Math.sqrt(x * x + y * y + z * z);
            };

            let best_index = -1;
            let best_dist = 9999;
            let best_pos: [number, number, number] | null = null;

            for (let ii = 0; ii < this._chunk_queue.length; ++ii) {

                const try_pos = this._chunk_queue[ii];

                if (best_index == -1 || g_data.chunk_is_visible && g_data.chunk_is_visible(try_pos)) {

                    const dist = calc_length(this._camera_pos[0] - try_pos[0] - g_data.logic.k_chunk_size / 2,
                                             this._camera_pos[1] - try_pos[1] - g_data.logic.k_chunk_size / 2,
                                             this._camera_pos[2] - try_pos[2] - g_data.logic.k_chunk_size / 2 );

                    if (best_dist < dist)
                        continue;

                    best_index = ii;
                    best_dist = dist;

                    best_pos = this._chunk_queue[best_index];
                }
            }

            // removal
            this._chunk_queue.splice(best_index,1);

            if (best_pos)
                this.processing_pos = best_pos;
        }

        this.is_processing_chunk = true;

        this._myWorker_status = 2; // working
        this._myWorker.postMessage({
            pos: this.processing_pos,
            buf: this._myWorker_buffer
        }, [
            // we now transfer the ownership of the vertices buffer
            this._myWorker_buffer.buffer
        ]);
    }

    getChunks(): Chunks {
        return this._chunks;
    }

};

export default ChunkGenerator;
