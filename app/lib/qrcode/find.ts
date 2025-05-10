import { FloatImage, Uint8x4Image } from "./image";
import { fromThresholded, threshold } from "./thresholding";

export function find(
  luminances: FloatImage
): Uint8x4Image {
  const gaussianSigma = 8;
  const thresholded = threshold(luminances, gaussianSigma);

  const output = fromThresholded(thresholded);
  for (let y = 0; y < luminances.height; y++) {
    let lastValue = 0;
    let lastX1 = -1;
    let lastX2 = -1;
    let lastX3 = -1;
    let lastX4 = -1;
    let lastX5 = -1;
    for (let x = 0; x < luminances.width; x++) {
      const currentValue = thresholded.getAt(x, y);
      if (currentValue !== lastValue) {
        const segment1 = x - lastX1;
        const segment2 = lastX1 - lastX2;
        const segment3 = lastX2 - lastX3;
        const segment4 = lastX3 - lastX4;
        const segment5 = lastX4 - lastX5;
        // The average excess width of the dark module segments
        const darkAdjust = (segment1 + segment5 - (segment2 + segment4)) / 8;
        const unitSize = (segment1 + segment2 + segment3 + segment4 + segment5 - darkAdjust * 2) / 7;
        const darkUnitSize = unitSize + darkAdjust * 2;
        const lightUnitSize = unitSize - darkAdjust * 2;

        const diff1 = Math.abs(segment1 / darkUnitSize - 1);
        const diff2 = Math.abs(segment2 / lightUnitSize - 1);
        const diff3 = Math.abs(segment3 / darkUnitSize - 3);
        const diff4 = Math.abs(segment4 / lightUnitSize - 1);
        const diff5 = Math.abs(segment5 / darkUnitSize - 1);

        if (
          lastX5 >= 0 &&
          Math.abs(darkAdjust / unitSize) < 0.2 &&
          diff1 < 0.5 &&
          diff2 < 0.5 &&
          diff3 < 0.5 &&
          diff4 < 0.5 &&
          diff5 < 0.5
        ) {
          for (let xx = lastX3; xx < lastX2; xx++) {
            output.setAt(xx, y, 0, currentValue);
          }
        }

        lastX5 = lastX4;
        lastX4 = lastX3;
        lastX3 = lastX2;
        lastX2 = lastX1;
        lastX1 = x;
        lastValue = currentValue;
      }
    }
  }
  for (let x = 0; x < luminances.width; x++) {
    let lastValue = 0;
    let lastY1 = -1;
    let lastY2 = -1;
    let lastY3 = -1;
    let lastY4 = -1;
    let lastY5 = -1;
    for (let y = 0; y < luminances.height; y++) {
      const currentValue = thresholded.getAt(x, y);
      if (currentValue !== lastValue) {
        const segment1 = y - lastY1;
        const segment2 = lastY1 - lastY2;
        const segment3 = lastY2 - lastY3;
        const segment4 = lastY3 - lastY4;
        const segment5 = lastY4 - lastY5;
        // The average excess width of the dark module segments
        const darkAdjust = (segment1 + segment5 - (segment2 + segment4)) / 8;
        const unitSize = (segment1 + segment2 + segment3 + segment4 + segment5 - darkAdjust * 2) / 7;
        const darkUnitSize = unitSize + darkAdjust * 2;
        const lightUnitSize = unitSize - darkAdjust * 2;

        const diff1 = Math.abs(segment1 / darkUnitSize - 1);
        const diff2 = Math.abs(segment2 / lightUnitSize - 1);
        const diff3 = Math.abs(segment3 / darkUnitSize - 3);
        const diff4 = Math.abs(segment4 / lightUnitSize - 1);
        const diff5 = Math.abs(segment5 / darkUnitSize - 1);

        if (
          lastY5 >= 0 &&
          Math.abs(darkAdjust / unitSize) < 0.2 &&
          diff1 < 0.5 &&
          diff2 < 0.5 &&
          diff3 < 0.5 &&
          diff4 < 0.5 &&
          diff5 < 0.5
        ) {
          for (let yy = lastY3; yy < lastY2; yy++) {
            output.setAt(x, yy, 1, currentValue);
          }
        }

        lastY5 = lastY4;
        lastY4 = lastY3;
        lastY3 = lastY2;
        lastY2 = lastY1;
        lastY1 = y;
        lastValue = currentValue;
      }
    }
  }
  return output;
}

export function canny(
  width: number,
  height: number,
  data: Uint8ClampedArray<ArrayBuffer>,
): void {
  const luminances = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = toLinear(data[(y * width + x) * 4] / 255);
      const g = toLinear(data[(y * width + x) * 4 + 1] / 255);
      const b = toLinear(data[(y * width + x) * 4 + 2] / 255);
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      luminances[y * width + x] = luminance;
    }
  }

  const afterGaussian = applyKernel(
    width,
    height,
    luminances,
    gaussianKernel
  );

  const sobelX = applyKernel(
    width,
    height,
    afterGaussian,
    [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ]
  );

  const sobelY = applyKernel(
    width,
    height,
    afterGaussian,
    [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ]
  );

  const sobelMagnitude = new Float32Array(width * height);
  const sobelDirection = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gradX = sobelX[y * width + x];
      const gradY = sobelY[y * width + x];
      const mag = Math.hypot(gradX, gradY);
      const ratio = gradY / gradX;
      let dir =
        ratio < -2.4142
          ? 6
          : ratio < -0.4142
          ? 7
          : ratio < 0.4142
          ? 0
          : ratio < 2.4142
          ? 1
          : 2;
      if (gradX < 0) {
        dir ^= 4;
      }
      sobelMagnitude[y * width + x] = mag;
      sobelDirection[y * width + x] = dir;
    }
  }

  const dxs = [1, 1, 0, -1, -1, -1, 0, 1];
  const dys = [0, 1, 1, 1, 0, -1, -1, -1];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dir = sobelDirection[y * width + x];
      const dx = dxs[dir];
      const dy = dys[dir];
      const len = dir & 1 ? 3 : 4;
      const mag = sobelMagnitude[y * width + x];
      for (let i = 0; i <= len; i++) {
        const x2 = x + dx * i;
        const y2 = y + dy * i;
        if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) break;
        if (sobelDirection[y2 * width + x2] !== dir) break;
        const mag2 = sobelMagnitude[y2 * width + x2];
        if (mag < mag2) {
          sobelMagnitude[y * width + x] = 0;
          break;
        }
      }
      for (let i = 0; i <= len; i++) {
        const x2 = x - dx * i;
        const y2 = y - dy * i;
        if (x2 < 0 || x2 >= width || y2 < 0 || y2 >= height) break;
        if (sobelDirection[y2 * width + x2] !== dir) break;
        const mag2 = sobelMagnitude[y2 * width + x2];
        if (mag < mag2) {
          sobelMagnitude[y * width + x] = 0;
          break;
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const luminance = sobelMagnitude[y * width + x] > 0.1 ? 1 : 0;
      data[(y * width + x) * 4] = fromLinear(luminance) * 255;
      data[(y * width + x) * 4 + 1] = fromLinear(luminance) * 255;
      data[(y * width + x) * 4 + 2] = fromLinear(luminance) * 255;
    }
  }

  for (let y = 0; y < height; y++) {
    let lastX1 = -1;
    let lastX2 = -1;
    let lastX3 = -1;
    let lastX4 = -1;
    let lastX5 = -1;
    for (let x = 0; x < width; x++) {
      if (sobelMagnitude[y * width + x] > 0.1) {
        const s = (x - lastX5) / 7;
        const diff1 = Math.abs((x - lastX1) / s - 1);
        const diff2 = Math.abs((lastX1 - lastX2) / s - 1);
        const diff3 = Math.abs((lastX2 - lastX3) / s - 3);
        const diff4 = Math.abs((lastX3 - lastX4) / s - 1);
        const diff5 = Math.abs((lastX4 - lastX5) / s - 1);
        if (
          diff1 < 0.5 &&
          diff1 < 0.5 &&
          diff2 < 0.5 &&
          diff3 < 0.5 &&
          diff4 < 0.5 &&
          diff5 < 0.5
        ) {
          for (let xx = lastX5; xx <= x; xx++) {
            data[(y * width + xx) * 4] = 255;
          }
        }

        lastX5 = lastX4;
        lastX4 = lastX3;
        lastX3 = lastX2;
        lastX2 = lastX1;
        lastX1 = x;
      }
    }
  }

  for (let x = 0; x < width; x++) {
    let lastY1 = -1;
    let lastY2 = -1;
    let lastY3 = -1;
    let lastY4 = -1;
    let lastY5 = -1;
    for (let y = 0; y < height; y++) {
      if (sobelMagnitude[y * width + x] > 0.1) {
        const s = (y - lastY5) / 7;
        const diff1 = Math.abs((y - lastY1) / s - 1);
        const diff2 = Math.abs((lastY1 - lastY2) / s - 1);
        const diff3 = Math.abs((lastY2 - lastY3) / s - 3);
        const diff4 = Math.abs((lastY3 - lastY4) / s - 1);
        const diff5 = Math.abs((lastY4 - lastY5) / s - 1);
        if (
          diff1 < 0.5 &&
          diff1 < 0.5 &&
          diff2 < 0.5 &&
          diff3 < 0.5 &&
          diff4 < 0.5 &&
          diff5 < 0.5
        ) {
          for (let yy = lastY5; yy <= y; yy++) {
            data[(yy * width + x) * 4 + 1] = 255;
          }
        }

        lastY5 = lastY4;
        lastY4 = lastY3;
        lastY3 = lastY2;
        lastY2 = lastY1;
        lastY1 = y;
      }
    }
  }
}

const gaussianKernel: number[][] = (() => {
  const r = 3;
  const sigma = 0.84089642;
  const samples = Array.from({ length: r * 2 + 1 }, (_, i) =>
    Math.exp(-0.5 * ((i - r) / sigma) ** 2)
  );
  const sum = samples.reduce((a, b) => a + b, 0);
  const normalized = samples.map((s) => s / sum);
  const kernel = normalized.map((a) => normalized.map((b) => a * b));
  return kernel;
})();

function applyKernel(
  width: number,
  height: number,
  data: Float32Array,
  kernel: number[][]
): Float32Array {
  const kernelWidth = kernel[0].length;
  const kernelHeight = kernel.length;
  const kernelOffsetX = Math.floor(kernelWidth / 2);
  const kernelOffsetY = Math.floor(kernelHeight / 2);
  const result = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      for (let ky = -kernelOffsetY; ky <= kernelOffsetY; ky++) {
        for (let kx = -kernelOffsetX; kx <= kernelOffsetX; kx++) {
          const pixelX = Math.min(Math.max(x + kx, 0), width - 1);
          const pixelY = Math.min(Math.max(y + ky, 0), height - 1);
          sum += data[pixelY * width + pixelX] * kernel[ky + kernelOffsetY][kx + kernelOffsetX];
        }
      }
      result[y * width + x] = sum;
    }
  }
  return result;
}

function toLinear(value: number): number {
  if (value < 0.04045) {
    return value / 12.92;
  } else {
    return ((value + 0.055) / 1.055) ** 2.4;
  }
}

function fromLinear(value: number): number {
  if (value <= 0.0031308) {
    return value * 12.92;
  } else {
    return 1.055 * value ** (1 / 2.4) - 0.055;
  }
}
