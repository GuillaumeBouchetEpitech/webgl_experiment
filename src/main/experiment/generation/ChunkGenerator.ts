
type Vec2 = [number, number];
type Vec3 = [number, number, number];

interface IChunkGeneratorDef<GeometryType> {
    chunkSize: number;
    chunkRange: number;
    workerTotal: number;
    workerFile: string;
    workerBufferSize: number;
    chunkIsVisible: ((pos: Vec3) => boolean);
    pointIsVisible: ((pos: Vec3) => boolean);
    addGeometry: ((buffer: Float32Array) => GeometryType);
    updateGeometry: ((geom: GeometryType, buffer: Float32Array) => void);
    onChunkCreated?: () => void;
    onChunkDiscarded?: () => void;
};

interface IChunk<GeometryType> {
    position: Vec3;
    geometry: GeometryType;
    coord2d: Vec2 | null;
    visible: boolean;
};

export type Chunks<GeometryType> = IChunk<GeometryType>[];

enum WorkerStatus {
    available = 1,
    working = 2,
};

interface IWorkerInstance {
    instance: Worker;
    float32buffer: Float32Array;
    status: WorkerStatus;
};

class ChunkGenerator<GeometryType> {

    private _def: IChunkGeneratorDef<GeometryType>;

    private _running: boolean = false;
    private _chunks: Chunks<GeometryType> = []; // live chunks
    private _chunkPositionQueue: Vec3[] = []; // position to be processed
    private _geometriesPool: GeometryType[] = [];
    private _savedIndex: Vec3 = [999, 999, 999]; // any other value than 0/0/0 will work

    private _workers: IWorkerInstance[] = [];

    private _cameraPosition: Vec3 = [0, 0, 0];

    private _processingPositions: Vec3[] = [];

    constructor(def: IChunkGeneratorDef<GeometryType>) {

        this._def = def;

        for (let ii = 0; ii < this._def.workerTotal; ++ii)
            this._addWorker();
    }

    private _addWorker() {

        const newWorker: IWorkerInstance = {
            instance: new Worker(this._def.workerFile),
            float32buffer: new Float32Array(this._def.workerBufferSize),
            status: WorkerStatus.available,
        };

        const onWorkerMessage = (event: MessageEvent) => {

            const position = event.data.position;
            newWorker.float32buffer = event.data.float32buffer; // we now own the vertices buffer
            newWorker.status = WorkerStatus.available;

            // find and remove the position
            for (let ii = 0; ii < this._processingPositions.length; ++ii) {
                if (this._processingPositions[ii][0] === position[0] &&
                    this._processingPositions[ii][1] === position[1] &&
                    this._processingPositions[ii][2] === position[2]) {

                    this._processingPositions.splice(ii, 1);
                    break;
                }
            }

            if (!this._running)
                return;

            let geometry: GeometryType | undefined = undefined;
            if (this._geometriesPool.length == 0) {

                geometry = this._def.addGeometry(newWorker.float32buffer);
            }
            else {

                geometry = this._geometriesPool.pop();
                if (geometry)
                    this._def.updateGeometry(geometry, newWorker.float32buffer);
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

                if (this._def.onChunkCreated)
                    this._def.onChunkCreated();

                // launch again
                this._launchWorker();
            }
        };

        newWorker.instance.addEventListener("message", onWorkerMessage, false);

        this._workers.push(newWorker);
    }

    start() {
        this._running = true;
    }

    stop() {
        if (!this._running)
            return;

        this._running = false;

        this._chunkPositionQueue.length = 0;
        this._chunks.length = 0;
        this._geometriesPool.length = 0;
    }

    update(cameraPosition: Vec3) {

        if (!this._running)
            return;

        //  check if move to ask chunks
        //      -> if yes
        //          reset chunk queue
        //          exclude chunk out of range
        //          include chunk in range

        this._cameraPosition = cameraPosition;

        const currIndex = [
            Math.floor(cameraPosition[0] / this._def.chunkSize),
            Math.floor(cameraPosition[1] / this._def.chunkSize),
            Math.floor(cameraPosition[2] / this._def.chunkSize)
        ];

        // did we move to another chunk?
        if (!(this._chunks.length == 0 ||
            currIndex[0] != this._savedIndex[0] ||
            currIndex[1] != this._savedIndex[1] ||
            currIndex[2] != this._savedIndex[2])) {

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

        const minIndex: Vec3 = [
            Math.floor(currIndex[0] - range),
            Math.floor(currIndex[1] - range),
            Math.floor(currIndex[2] - range),
        ];
        const maxIndex: Vec3 = [
            Math.floor(currIndex[0] + range),
            Math.floor(currIndex[1] + range),
            Math.floor(currIndex[2] + range),
        ];

        //
        // exclude the chunks that are too far away

        for (let ii = 0; ii < this._chunks.length; ++ii) {

            const curr_pos = [
                (this._chunks[ii].position[0] / this._def.chunkSize)|0,
                (this._chunks[ii].position[1] / this._def.chunkSize)|0,
                (this._chunks[ii].position[2] / this._def.chunkSize)|0
            ];

            if (curr_pos[0] < minIndex[0] || curr_pos[0] > maxIndex[0] ||
                curr_pos[1] < minIndex[1] || curr_pos[1] > maxIndex[1] ||
                curr_pos[2] < minIndex[2] || curr_pos[2] > maxIndex[2]) {

                // this._chunks[i].geom.dispose();
                this._geometriesPool.push(this._chunks[ii].geometry);
                this._chunks.splice(ii, 1);
                --ii;

                if (this._def.onChunkDiscarded)
                    this._def.onChunkDiscarded();
            }
        }

        //
        // include in the generation queue the close enough chunks

        for (let zz = minIndex[2]; zz <= maxIndex[2]; ++zz)
        for (let yy = minIndex[1]; yy <= maxIndex[1]; ++yy)
        for (let xx = minIndex[0]; xx <= maxIndex[0]; ++xx) {

            const position: Vec3 = [
                xx * this._def.chunkSize,
                yy * this._def.chunkSize,
                zz * this._def.chunkSize
            ];

            /// already processed ?
            let found = false;
            for (let ii = 0; ii < this._chunks.length; ++ii) {

                const currPosition = this._chunks[ii].position;

                if (currPosition[0] === position[0] &&
                    currPosition[1] === position[1] &&
                    currPosition[2] === position[2]) {

                    found = true;
                    break;
                }
            }

            if (found) // is already processed
                continue;

            this._chunkPositionQueue.push(position);
        }

        //
        //

        this._launchWorker();
    }

    private _launchWorker() {

        const currentWorker = this._workers.find(item => item.status == WorkerStatus.available);
        if (currentWorker === undefined)
            return;

        // determine the next chunk to process

        // is there something to process?
        if (this._chunkPositionQueue.length == 0)
            return; // no

        let nextPosition: Vec3 | undefined = undefined;

        // if just 1 chunk left to process (or no priority callback)
        // -> just pop and process the next/last chunk in the queue
        if (this._chunkPositionQueue.length == 1) {

            nextPosition = this._chunkPositionQueue.pop();
        }
        else {

            // from here, we determine the next best chunk to process

            const computeMagnitude = (vector: Vec3) => {
                return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
            };

            let bestIndex = -1;
            let bestMagnitude = 999999;
            let bestPosition: Vec3 | undefined = undefined;

            for (let ii = 0; ii < this._chunkPositionQueue.length; ++ii) {

                const chunkPosition = this._chunkPositionQueue[ii];

                if (bestIndex == -1 || this._def.chunkIsVisible(chunkPosition)) {

                    const chunkCenter: Vec3 = [
                        this._cameraPosition[0] - chunkPosition[0] - this._def.chunkSize / 2,
                        this._cameraPosition[1] - chunkPosition[1] - this._def.chunkSize / 2,
                        this._cameraPosition[2] - chunkPosition[2] - this._def.chunkSize / 2
                    ];

                    const magnitude = computeMagnitude(chunkCenter);

                    if (bestMagnitude < magnitude)
                        continue;

                    bestIndex = ii;
                    bestMagnitude = magnitude;

                    bestPosition = this._chunkPositionQueue[bestIndex];
                }
            }

            // removal
            this._chunkPositionQueue.splice(bestIndex,1);

            nextPosition = bestPosition;
        }

        if (nextPosition === undefined)
            return;

        this._processingPositions.push(nextPosition);

        currentWorker.status = WorkerStatus.working;
        currentWorker.instance.postMessage({
            position: nextPosition,
            float32buffer: currentWorker.float32buffer
        }, [
            // we now transfer the ownership of the vertices buffer
            currentWorker.float32buffer.buffer
        ]);
    }

    getChunks(): Chunks<GeometryType> {
        return this._chunks;
    }

    getProcessingPositions(): Vec3[] {
        return this._processingPositions;
    }
};

export default ChunkGenerator;
