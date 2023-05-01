import * as configuration from '../main/configuration';

import { IMarchingAlgorithm, OnVertexCallback, MarchingCube, MarchingTetrahedron } from './marching-algorithms';
import { ClassicalNoise } from './helpers/ClassicalNoise';
import { DeterministicRng } from './helpers/DeterministicRng';

type Vec3 = [number, number, number];

const tmpRng = new DeterministicRng();

const simplexNoiseInstance = new ClassicalNoise({
  randomCallback: () => tmpRng.random(),
  octaves: configuration.noiseOctaves,
  frequency: configuration.noiseFrequency,
  amplitude: configuration.noiseAmplitude
});

const on_sample_callback = (x: number, y: number, z: number) => {
  return simplexNoiseInstance.noise(x, y, z);
};

// const marchingCubeInstance: IMarchingAlgorithm = new MarchingCube(configuration.chunkSize, configuration.chunkLimit, on_sample_callback);
const marchingCubeInstance: IMarchingAlgorithm = new MarchingTetrahedron(configuration.chunkSize, configuration.chunkLimit, on_sample_callback);

const myself = self as unknown as Worker; // well, that's apparently needed...

const onMainScriptMessage = (event: MessageEvent) => {
  const position = event.data.position as Vec3;
  const float32buffer = event.data.float32buffer as Float32Array; // we now own the vertices buffer

  //
  // generate

  let bufIndex = 0;

  const onVertexCallback: OnVertexCallback = (vertex: Vec3, normal: Vec3) => {
    // should never happen, but just in case
    if (bufIndex + 12 > configuration.workerBufferSize) return;

    // conveniently setting up the buffer to work with the receiving geometry

    float32buffer[bufIndex++] = vertex[0];
    float32buffer[bufIndex++] = vertex[1];
    float32buffer[bufIndex++] = vertex[2];
    float32buffer[bufIndex++] = normal[0];
    float32buffer[bufIndex++] = normal[1];
    float32buffer[bufIndex++] = normal[2];
  };

  marchingCubeInstance.generate(position, onVertexCallback);

  //

  myself.postMessage(
    {
      position: position,
      float32buffer: float32buffer,
      sizeUsed: bufIndex,
    },
    [
      // we now transfer the ownership of the vertices buffer
      float32buffer.buffer
    ]
  );
};

myself.addEventListener('message', onMainScriptMessage, false);
