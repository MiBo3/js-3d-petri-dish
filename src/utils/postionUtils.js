const getCircleAngle = (i, count) => (i / count) * (2 * Math.PI);

export const getPos = (i, count, height, radius) => {
  const theta = getCircleAngle(i, count);
  return { x: radius * Math.cos(theta), y: height / 2, z: radius * Math.sin(theta) }
};

export const getRot = (i, count) => {
  return `0 ${-360 * i / count} 0`;
};

export const getOffsetPos = (i, count, radius) => {
  const theta = getCircleAngle(i, count);
  return { x: radius * Math.cos(theta), y: 0, z: radius * Math.sin(theta) };
};

export const getOffsetRot = (i, count) => {
  return `-90 ${-360 * i / count} 0`;
};

