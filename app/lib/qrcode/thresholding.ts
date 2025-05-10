import { Uint8x4Image, VectorImage } from "./image";

export function fromThresholded(
  mat: Matrix<number, Uint8ClampedArray<ArrayBuffer>>,
): Uint8x4Image {
  const { width, height } = mat;
  const output = new VectorImage<number, Uint8ClampedArray<ArrayBuffer>>(
    width,
    height,
    4,
    new Uint8ClampedArray(width * height * 4)
  );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = mat.getAt(x, y);
      output.setAt(x, y, 0, value);
      output.setAt(x, y, 1, value);
      output.setAt(x, y, 2, value);
      output.setAt(x, y, 3, 255);
    }
  }
  return output;
}

export function threshold(
  luminances: Matrix<number, Float32Array<ArrayBuffer>>,
  gaussianSigma: number
): Matrix<number, Uint8ClampedArray<ArrayBuffer>> {
  const { width, height } = luminances;

  const afterGaussian = applyGaussian(luminances, gaussianSigma);

  const thresholded = new Matrix<number, Uint8ClampedArray<ArrayBuffer>>(
    width,
    height,
    new Uint8ClampedArray(width * height)
  );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const newValue = Number(luminances.getAt(x, y) > afterGaussian.getAt(x, y));
      thresholded.setAt(x, y, newValue * 255);
    }
  }
  return thresholded;
}

class Matrix<T, A extends ArrayLike<T>> {
  array: A;
  width: number;
  height: number;
  constructor(width: number, height: number, array: A) {
    if (array.length !== width * height) {
      throw new RangeError('Array length does not match width and height');
    }
    this.array = array;
    this.width = width;
    this.height = height;
  }

  getAt(x: number, y: number): T {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return undefined as unknown as T;
    }
    return this.array[y * this.width + x];
  }
  setAt(x: number, y: number, value: T): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      throw new RangeError('Index out of bounds');
    }
    (this.array as unknown as T[])[y * this.width + x] = value;
  }
}

function applyGaussian(
  input: Matrix<number, Float32Array>,
  gaussianSigma: number,
): Matrix<number, Float32Array> {
  if (gaussianSigma < 40) {
    return applyGaussianA(input, gaussianSigma);
  } else {
    return applyGaussianB(input, gaussianSigma);
  }
}

function applyGaussianA(
  input: Matrix<number, Float32Array>,
  gaussianSigma: number,
): Matrix<number, Float32Array> {
  const gaussianRadius = Math.ceil(gaussianSigma * 1.5);
  const gaussianCoefficients = new Float32Array(gaussianRadius * 2 + 1);
  let gaussianSum = 0;
  for (let i = -gaussianRadius; i <= gaussianRadius; i++) {
    const coefficient = Math.exp(-((i / gaussianSigma) ** 2));
    gaussianCoefficients[i + gaussianRadius] = coefficient;
    gaussianSum += coefficient;
  }
  for (let i = 0; i < gaussianCoefficients.length; i++) {
    gaussianCoefficients[i] /= gaussianSum;
  }

  const gaussX = new Matrix<number, Float32Array>(input.width, input.height, new Float32Array(input.width * input.height));
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      let sum = 0;
      for (let i = -gaussianRadius; i <= gaussianRadius; i++) {
        const x2 = Math.max(0, Math.min(x + i, input.width - 1));
        sum += input.getAt(x2, y) * gaussianCoefficients[i + gaussianRadius];
      }
      gaussX.setAt(x, y, sum);
    }
  }
  const output = new Matrix<number, Float32Array>(input.width, input.height, new Float32Array(input.width * input.height));
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      let sum = 0;
      for (let i = -gaussianRadius; i <= gaussianRadius; i++) {
        const y2 = Math.max(0, Math.min(y + i, input.height - 1));
        sum += gaussX.getAt(x, y2) * gaussianCoefficients[i + gaussianRadius];
      }
      output.setAt(x, y, sum);
    }
  }
  return output;
}

function applyGaussianB(
  input: Matrix<number, Float32Array>,
  gaussianSigma: number,
): Matrix<number, Float32Array> {
  const { width, height } = input;
  const NUM_PASS = 3;
  const radius = Math.ceil(Math.sqrt(3 * gaussianSigma ** 2 / NUM_PASS));
  const output = new Matrix<number, Float32Array>(width, height, new Float32Array(width * height));
  output.array.set(input.array);
  const tmp = new Matrix<number, Float32Array>(width, height, new Float32Array(width * height));
  for (let i = 0; i < NUM_PASS; i++) {
    const input = output;

    // Fold in the x direction
    for (let y = 0; y < height; y++) {
      let sum = 0;
      let windowWidth = 0;
      for (let x = -radius; x < 0; x++) {
        if (x + radius < width) {
          sum += input.getAt(x + radius, y);
          windowWidth++;
        }
      }
      for (let x = 0; x < width; x++) {
        if (x + radius < width) {
          sum += input.getAt(x + radius, y);
          windowWidth++;
        }
        tmp.setAt(x, y, sum / windowWidth);
        if (x - radius >= 0) {
          sum -= input.getAt(x - radius, y);
          windowWidth--;
        }
      }
    }

    // Fold in the y direction
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let windowWidth = 0;
      for (let y = -radius; y < 0; y++) {
        if (y + radius < height) {
          sum += tmp.getAt(x, y + radius);
          windowWidth++;
        }
      }
      for (let y = 0; y < height; y++) {
        if (y + radius < height) {
          sum += tmp.getAt(x, y + radius);
          windowWidth++;
        }
        output.setAt(x, y, sum / windowWidth);
        if (y - radius >= 0) {
          sum -= tmp.getAt(x, y - radius);
          windowWidth--;
        }
      }
    }
  }

  return output;
}
