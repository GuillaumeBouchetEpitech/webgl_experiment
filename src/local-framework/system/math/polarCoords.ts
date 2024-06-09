import * as glm from 'gl-matrix';

export const polar2Cartesian = (
  lat: number,
  lng: number,
  relAltitude = 0,
  globRadius = 100
): glm.vec3 => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  const r = globRadius * (1 + relAltitude);
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  ];
};

export const cartesian2Polar = (
  x: number,
  y: number,
  z: number,
  globRadius = 100
): {
  lat: number;
  lng: number;
  altitude: number;
} => {
  const r = Math.sqrt(x * x + y * y + z * z);
  const phi = Math.acos(y / r);
  const theta = Math.atan2(z, x);

  return {
    lat: 90 - (phi * 180) / Math.PI,
    lng: 90 - (theta * 180) / Math.PI - (theta < -Math.PI / 2 ? 360 : 0), // keep within [-180, 180] boundaries
    altitude: r / globRadius - 1
  };
};
