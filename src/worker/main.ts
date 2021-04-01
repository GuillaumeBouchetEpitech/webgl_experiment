
import chunk_size from "../main/constants"

import MarchinCube from "./helpers/MarchingCube";
import ClassicalNoise from "./helpers/ClassicalNoise";
import Randomiser from "./helpers/Randomiser";

type Vec3 = [number, number, number];

const randomiserInstance = new Randomiser();
const simplexNoiseInstance = new ClassicalNoise(randomiserInstance);

const on_sample_callback = (x: number, y: number, z: number) => {
    return simplexNoiseInstance.noise(x, y, z);
};

const marchingCubeInstance = new MarchinCube(chunk_size, 0.0, on_sample_callback);

const myself = (self as unknown) as Worker; // well, that's apparently needed...

const onMainScriptMessage = (event: MessageEvent) => {

    const position = event.data.position as Vec3;
    const float32buffer = event.data.float32buffer as Float32Array; // we now own the vertices buffer

    let buf_inc = 0;

    //
    // generate

    let curr_index = 0;
    const indexes: Vec3[] = [ [1,0,0], [0,1,0], [0,0,1] ];

    const on_vertex_callback = (vertex: Vec3, color: Vec3, normal: Vec3) => {

        // conveniently setting up the buffer to work with the receiving geometry

        float32buffer[buf_inc++] = vertex[0];
        float32buffer[buf_inc++] = vertex[1];
        float32buffer[buf_inc++] = vertex[2];
        float32buffer[buf_inc++] = color[0];
        float32buffer[buf_inc++] = color[1];
        float32buffer[buf_inc++] = color[2];
        float32buffer[buf_inc++] = normal[0];
        float32buffer[buf_inc++] = normal[1];
        float32buffer[buf_inc++] = normal[2];

        const index = indexes[curr_index];
        curr_index = (curr_index + 1) % 3;

        float32buffer[buf_inc++] = index[0];
        float32buffer[buf_inc++] = index[1];
        float32buffer[buf_inc++] = index[2];
    };

    marchingCubeInstance.generate( position, on_vertex_callback, true );

    //

    myself.postMessage({
        position: position,
        float32buffer: float32buffer
    }, [
        // we now transfer the ownership of the vertices buffer
        float32buffer.buffer
    ]);
};

myself.addEventListener('message', onMainScriptMessage, false);
