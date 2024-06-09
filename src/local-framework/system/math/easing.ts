export const easeClamp = (t: number) => {
  if (t > 1) {
    return t - Math.floor(t);
  }
  return t;
};

export const easePinPong = (t: number): number => {
  t *= 2.0;
  if (t < 1.0) return t;
  t -= 1.0;
  return 1.0 - t;
};

export const easeInSine = (t: number): number => {
  return Math.sin(1.5707963 * t);
};

export const easeOutSine = (t: number): number => {
  return 1.0 + Math.sin(1.5707963 * (t - 1.0));
};

export const easeInOutSine = (t: number): number => {
  return 0.5 * (1.0 + Math.sin(3.1415926 * (t - 0.5)));
};

export const easeInQuad = (t: number): number => {
  return t * t;
};

export const easeOutQuad = (t: number): number => {
  return t * (2.0 - t);
};

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2.0 * t * t : t * (4.0 - 2.0 * t) - 1.0;
};

export const easeInCubic = (t: number): number => {
  return t * t * t;
};

export const easeOutCubic = (t: number): number => {
  const t2 = t - 1;
  return 1.0 + t2 * t2 * t2;
};

export const easeInOutCubic = (t: number): number => {
  const t2 = t - 1.0;
  const t3 = t2 - 1.0;
  return t < 0.5 ? 4.0 * t * t * t : 1.0 + t2 * (2.0 * t3) * (2.0 * t3);
};

export const easeInQuart = (t: number): number => {
  t *= t;
  return t * t;
};

export const easeOutQuart = (t: number): number => {
  const t2 = t - 1.0;
  t = t2 * t2;
  return 1.0 - t * t;
};

export const easeInOutQuart = (t: number): number => {
  if (t < 0.5) {
    t *= t;
    return 8.0 * t * t;
  }
  const t2 = t - 1;
  t = t2 * t2;
  return 1.0 - 8.0 * t * t;
};

export const easeInQuint = (t: number): number => {
  const t2 = t * t;
  return t * t2 * t2;
};

export const easeOutQuint = (t: number): number => {
  const tx = t - 1;
  const t2 = tx * tx;
  return 1.0 + tx * t2 * t2;
};

export const easeInOutQuint = (t: number): number => {
  let t2;
  if (t < 0.5) {
    t2 = t * t;
    return 16.0 * t * t2 * t2;
  }

  const tx = t - 1.0;
  t2 = tx * tx;
  return 1.0 + 16.0 * tx * t2 * t2;
};

export const easeInExpo = (t: number): number => {
  return (Math.pow(2.0, 8.0 * t) - 1) / 255.0;
};

export const easeOutExpo = (t: number): number => {
  return 1.0 - Math.pow(2.0, -8.0 * t);
};

export const easeInOutExpo = (t: number): number => {
  if (t < 0.5) return (Math.pow(2.0, 16.0 * t) - 1) / 510.0;
  return 1.0 - 0.5 * Math.pow(2.0, -16.0 * (t - 0.5));
};

export const easeInCirc = (t: number): number => {
  return 1.0 - Math.sqrt(1.0 - t);
};

export const easeOutCirc = (t: number): number => {
  return Math.sqrt(t);
};

export const easeInOutCirc = (t: number): number => {
  if (t < 0.5) return (1.0 - Math.sqrt(1.0 - 2.0 * t)) * 0.5;
  return (1.0 + Math.sqrt(2.0 * t - 1.0)) * 0.5;
};

export const easeInBack = (t: number): number => {
  return t * t * (2.70158 * t - 1.70158);
};

export const easeOutBack = (t: number): number => {
  const tx = t - 1;
  return 1.0 + tx * tx * (2.70158 * tx + 1.70158);
};

export const easeInOutBack = (t: number): number => {
  if (t < 0.5) return t * t * (7.0 * t - 2.5) * 2.0;
  const tx = t - 1.0;
  return 1.0 + tx * tx * 2.0 * (7.0 * tx + 2.5);
};

export const easeInElastic = (t: number): number => {
  const t2 = t * t;
  return t2 * t2 * Math.sin(t * Math.PI * 4.5);
};

export const easeOutElastic = (t: number): number => {
  const t2 = (t - 1.0) * (t - 1.0);
  return 1.0 - t2 * t2 * Math.cos(t * Math.PI * 4.5);
};

export const easeInOutElastic = (t: number): number => {
  let t2;
  if (t < 0.45) {
    t2 = t * t;
    return 8.0 * t2 * t2 * Math.sin(t * Math.PI * 9.0);
  }
  if (t < 0.55) return 0.5 + 0.75 * Math.sin(t * Math.PI * 4.0);

  t2 = (t - 1.0) * (t - 1.0);
  return 1.0 - 8.0 * t2 * t2 * Math.sin(t * Math.PI * 9.0);
};

export const easeInBounce = (t: number): number => {
  return Math.pow(2.0, 6.0 * (t - 1.0)) * Math.abs(Math.sin(t * Math.PI * 3.5));
};

export const easeOutBounce = (t: number): number => {
  return 1.0 - Math.pow(2.0, -6.0 * t) * Math.abs(Math.cos(t * Math.PI * 3.5));
};

export const easeInOutBounce = (t: number): number => {
  if (t < 0.5)
    return (
      8.0 *
      Math.pow(2.0, 8.0 * (t - 1.0)) *
      Math.abs(Math.sin(t * Math.PI * 7.0))
    );
  return (
    1.0 - 8.0 * Math.pow(2.0, -8.0 * t) * Math.abs(Math.sin(t * Math.PI * 7.0))
  );
};
