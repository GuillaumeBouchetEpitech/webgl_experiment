export const clamp = (currVal: number, minVal: number, maxVal: number) =>
  Math.min(Math.max(currVal, minVal), maxVal);
