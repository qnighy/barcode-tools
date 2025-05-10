export type Uint8Image = ScalarImage<number, Uint8ClampedArray<ArrayBuffer>>;
export type Uint8x4Image = VectorImage<number, Uint8ClampedArray<ArrayBuffer>>;
export type FloatImage = ScalarImage<number, Float32Array<ArrayBuffer>>;

export class ScalarImage<T, A extends ArrayLike<T>> {
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

export class VectorImage<T, A extends ArrayLike<T>> {
  array: A;
  width: number;
  height: number;
  numComponents: number;
  constructor(width: number, height: number, numComponents: number, array: A) {
    if (array.length !== width * height * numComponents) {
      throw new RangeError('Array length does not match width and height');
    }
    this.array = array;
    this.width = width;
    this.height = height;
    this.numComponents = numComponents;
  }

  getAt(x: number, y: number, component: number): T {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || component < 0 || component >= this.numComponents) {
      return undefined as unknown as T;
    }
    return this.array[(y * this.width + x) * this.numComponents + component];
  }
  setAt(x: number, y: number, component: number, value: T): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || component < 0 || component >= this.numComponents) {
      throw new RangeError('Index out of bounds');
    }
    (this.array as unknown as T[])[(y * this.width + x) * this.numComponents + component] = value;
  }
}

export function toLuminances(
  image: Uint8x4Image,
): FloatImage {
  const { width, height } = image;
  const luminances = new ScalarImage<number, Float32Array<ArrayBuffer>>(width, height, new Float32Array(width * height));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const r = toLinear(image.getAt(x, y, 0) / 255);
      const g = toLinear(image.getAt(x, y, 1) / 255);
      const b = toLinear(image.getAt(x, y, 2) / 255);
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      luminances.setAt(x, y, luminance);
    }
  }
  return luminances;
}

function toLinear(value: number): number {
  if (value < 0.04045) {
    return value / 12.92;
  } else {
    return ((value + 0.055) / 1.055) ** 2.4;
  }
}

export function fromLuminances(
  image: FloatImage
): Uint8x4Image {
  const { width, height } = image;
  const result = new VectorImage<number, Uint8ClampedArray<ArrayBuffer>>(
    width,
    height,
    4,
    new Uint8ClampedArray(width * height * 4)
  );
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = image.getAt(x, y);
      const sRGBValue = fromLinear(value) * 255;
      result.setAt(x, y, 0, sRGBValue);
      result.setAt(x, y, 1, sRGBValue);
      result.setAt(x, y, 2, sRGBValue);
      result.setAt(x, y, 3, 255);
    }
  }
  return result;
}

function fromLinear(value: number): number {
  if (value < 0.0031308) {
    return value * 12.92;
  } else {
    return 1.055 * value ** (1 / 2.4) - 0.055;
  }
}
