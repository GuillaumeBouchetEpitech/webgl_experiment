import * as configuration from '../main/configuration';

import { MarchingCube } from './helpers/MarchingCube';
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

const marchingCubeInstance = new MarchingCube(
  configuration.chunkSize,
  configuration.chunkLimit,
  on_sample_callback
);

const myself = self as unknown as Worker; // well, that's apparently needed...

const onMainScriptMessage = (event: MessageEvent) => {
  const position = event.data.position as Vec3;
  const float32buffer = event.data.float32buffer as Float32Array; // we now own the vertices buffer

  //
  // generate

  let currIndex = 0;
  const indexes: Vec3[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  let bufIndex = 0;

  const on_vertex_callback = (vertex: Vec3, color: Vec3, normal: Vec3) => {
    // should never happen, but just in case
    if (bufIndex + 12 > configuration.workerBufferSize) return;

    // conveniently setting up the buffer to work with the receiving geometry

    float32buffer[bufIndex++] = vertex[0];
    float32buffer[bufIndex++] = vertex[1];
    float32buffer[bufIndex++] = vertex[2];
    float32buffer[bufIndex++] = color[0];
    float32buffer[bufIndex++] = color[1];
    float32buffer[bufIndex++] = color[2];
    float32buffer[bufIndex++] = normal[0];
    float32buffer[bufIndex++] = normal[1];
    float32buffer[bufIndex++] = normal[2];

    const index = indexes[currIndex];
    currIndex = (currIndex + 1) % 3;

    float32buffer[bufIndex++] = index[0];
    float32buffer[bufIndex++] = index[1];
    float32buffer[bufIndex++] = index[2];
  };

  marchingCubeInstance.generate(position, on_vertex_callback, true);

  //

  myself.postMessage(
    {
      position: position,
      float32buffer: float32buffer
    },
    [
      // we now transfer the ownership of the vertices buffer
      float32buffer.buffer
    ]
  );
};

myself.addEventListener('message', onMainScriptMessage, false);
