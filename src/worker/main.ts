
import chunk_size from "../main/constants"

import MarchinCube from "./helpers/MarchingCube";
import ClassicalNoise from "./helpers/ClassicalNoise";
import Randomiser from "./helpers/Randomiser";

type Vec3 = [number, number, number];

const myRand = new Randomiser();
const myNoise = new ClassicalNoise(myRand);

const on_sample_callback = (x: number, y: number, z: number) => {
    return myNoise.noise_ex(x, y, z);
};

const myMarchingCube = new MarchinCube(chunk_size, 0.0, on_sample_callback);

const myself = (self as unknown) as Worker;

myself.addEventListener('message', (event: MessageEvent) => {

    const pos = event.data.pos as number[];
    const buf = event.data.buf as Float32Array; // we now own the vertices buffer

    let buf_inc = 0;

    //
    // generate

    let curr_index = 0;
    const arr_indexes: Vec3[] = [ [1,0,0], [0,1,0], [0,0,1] ];

    const on_vertex_callback = (vertex: Vec3, color: Vec3, normal: Vec3) => {

        buf[buf_inc++] = vertex[0];
        buf[buf_inc++] = vertex[1];
        buf[buf_inc++] = vertex[2];
        buf[buf_inc++] = color[0];
        buf[buf_inc++] = color[1];
        buf[buf_inc++] = color[2];
        buf[buf_inc++] = normal[0];
        buf[buf_inc++] = normal[1];
        buf[buf_inc++] = normal[2];

        const index = arr_indexes[curr_index];
        curr_index = (curr_index + 1) % 3;

        buf[buf_inc++] = index[0];
        buf[buf_inc++] = index[1];
        buf[buf_inc++] = index[2];
    }

    myMarchingCube.generate( pos, on_vertex_callback, true );

    //

    myself.postMessage({
        pos: pos,
        vertices: buf
    }, [
        // we now transfer the ownership of the vertices buffer
        buf.buffer
    ]);
}, false);
