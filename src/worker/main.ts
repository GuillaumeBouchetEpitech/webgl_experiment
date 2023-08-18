import { IMessage, TypedMessageEvent } from '../_common';
import * as configuration from '../main/configuration';

import {
  IMarchingAlgorithm,
  OnVertexCallback,
  MarchingCube
} from './marching-algorithms';

import { ClassicalNoise } from './helpers/ClassicalNoise';
import { DeterministicRng } from './helpers/DeterministicRng';

type Vec3 = [number, number, number];

const tmpRng = new DeterministicRng();
tmpRng.setSeed(1);

const simplexNoiseInstance = new ClassicalNoise({
  randomCallback: () => tmpRng.random(),
  octaves: 1,
  frequency: 1,
  amplitude: 0.5
});

const _clamp = (inVal: number, inMin: number, inMax: number) => {
  return Math.min(Math.max(inVal, inMin), inMax);
};

const _lerp = (inValA: number, inValB: number, inRatio: number) => {
  return inValA + (inValB - inValA) * _clamp(inRatio, 0, 1);
};

const _getLength = (inX: number, inY: number, inZ: number) => {
  return Math.sqrt(inX * inX + inY * inY + inZ * inZ);
};

const _getRadius = (
  inX: number,
  inY: number,
  inZ: number,
  inRadius: number
) => {
  return _getLength(inX, inY, inZ) / inRadius;
};

const k_originRadius = 1.25;
const k_originRange = 2;

const onGenericSampleCallback = (x: number, y: number, z: number) => {
  return simplexNoiseInstance.getNoise(x, y, z) + 0.5; // [0..1]
};

const onOriginSampleCallback = (inX: number, inY: number, inZ: number) => {
  const noiseValue = onGenericSampleCallback(inX, inY, inZ);

  const lerpCoef = 1 - _getRadius(inX, inY, inZ, k_originRadius);

  return _lerp(noiseValue, 0, lerpCoef);
};

const marchingCubeInstance: IMarchingAlgorithm = new MarchingCube(
  configuration.chunkLogicSize,
  configuration.chunkThreshold
);

const myself = self as unknown as Worker; // well, that's apparently needed...

const onMainScriptMessage = (event: TypedMessageEvent<IMessage>) => {
  const {
    indexPosition,
    realPosition,
    geometryFloat32buffer,
    geometryBufferSize
  } = event.data;

  //
  // generate

  const logicOrigin: Vec3 = [
    indexPosition[0] * configuration.chunkLogicSize,
    indexPosition[1] * configuration.chunkLogicSize,
    indexPosition[2] * configuration.chunkLogicSize
  ];

  let bufIndex = 0;

  const onVertexCallback: OnVertexCallback = (vertex: Vec3, normal: Vec3) => {
    // should never happen, but just in case
    if (bufIndex + 6 > geometryBufferSize) {
      return;
    }

    // conveniently setting up the buffer to work with the receiving geometry

    geometryFloat32buffer[bufIndex++] = vertex[0];
    geometryFloat32buffer[bufIndex++] = vertex[1];
    geometryFloat32buffer[bufIndex++] = vertex[2];
    geometryFloat32buffer[bufIndex++] = normal[0];
    geometryFloat32buffer[bufIndex++] = normal[1];
    geometryFloat32buffer[bufIndex++] = normal[2];
  };

  const isOutsideTheOrigin =
    indexPosition[0] < -k_originRange ||
    indexPosition[0] > +k_originRange ||
    indexPosition[1] < -k_originRange ||
    indexPosition[1] > +k_originRange ||
    indexPosition[2] < -k_originRange ||
    indexPosition[2] > +k_originRange;

  const onSampleCallback = isOutsideTheOrigin
    ? onGenericSampleCallback
    : onOriginSampleCallback;

  marchingCubeInstance.generate(
    logicOrigin,
    onVertexCallback,
    onSampleCallback
  );

  //

  const toSend: IMessage = {
    indexPosition,
    realPosition,
    geometryFloat32buffer,
    geometryBufferSize,
    sizeUsed: bufIndex,
    time: event.data.time
  };

  myself.postMessage(toSend, [
    // we now transfer the ownership of the vertices buffer
    geometryFloat32buffer.buffer
  ]);
};

myself.addEventListener('message', onMainScriptMessage, false);
