export function threshold(
  width: number,
  height: number,
  data: Uint8ClampedArray<ArrayBuffer>,
): void {
  let luminanceSum = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = toLinear(data[(y * width + x) * 4] / 255);
      const g = toLinear(data[(y * width + x) * 4 + 1] / 255);
      const b = toLinear(data[(y * width + x) * 4 + 2] / 255);
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      luminanceSum += luminance;
    }
  }
  const luminanceAvg = luminanceSum / (width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = toLinear(data[(y * width + x) * 4] / 255);
      const g = toLinear(data[(y * width + x) * 4 + 1] / 255);
      const b = toLinear(data[(y * width + x) * 4 + 2] / 255);
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const newValue = luminance > luminanceAvg ? 1 : 0;
      data[(y * width + x) * 4] = newValue * 255;
      data[(y * width + x) * 4 + 1] = newValue * 255;
      data[(y * width + x) * 4 + 2] = newValue * 255;
    }
  }
}

function toLinear(value: number): number {
  if (value < 0.04045) {
    return value / 12.92;
  } else {
    return ((value + 0.055) / 1.055) ** 2.4;
  }
}
