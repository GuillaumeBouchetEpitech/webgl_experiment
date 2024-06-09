export const lerp = (ratio: number, minVal: number, maxVal: number): number =>
  minVal + (maxVal - minVal) * ratio;
