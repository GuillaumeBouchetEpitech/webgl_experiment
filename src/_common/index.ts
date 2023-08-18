type Vec3 = [number, number, number];

export interface IMessage {
  indexPosition: Vec3;
  realPosition: Vec3;
  geometryFloat32buffer: Float32Array;
  geometryBufferSize: number;
  sizeUsed: number;
  time: number;
}

// FIXME: unexpectedly MessageEvent<T> doesn't not seems to work, this fixes it
export type TypedMessageEvent<T> = Omit<MessageEvent, 'data'> & { data: T };
