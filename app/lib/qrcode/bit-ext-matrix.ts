import { Bit, BitLike } from "./bit";

/**
 * An element of {@link BitExtMatrix}.
 */
export type BitExt = number;

export const BIT_VALUE_FLAG = 1;

/**
 * A flag indicating that the cell is a part of the function patterns.
 */
export const FUNCTION_PATTERN_FLAG = 2;
/**
 * A flag indicating that the cell is a part of
 * the format information area or the version information area.
 */
export const METADATA_AREA_FLAG = 4;

export const NON_DATA_MASK = FUNCTION_PATTERN_FLAG | METADATA_AREA_FLAG;

/**
 * A row-major matrix of bits and extra flags.
 */
export class BitExtMatrix {
  readonly width: number;
  readonly array: Uint8Array;

  constructor(width: number, height: number);
  constructor(width: number, array: Uint8Array | readonly BitExt[]);
  constructor(width: number, heightOrArray: number | Uint8Array | readonly BitExt[]) {
    this.width = width;
    if (typeof heightOrArray === 'number') {
      this.array = new Uint8Array(width * heightOrArray);
    } else if (heightOrArray instanceof Uint8Array) {
      this.array = heightOrArray;
    } else {
      this.array = new Uint8Array(heightOrArray);
    }
  }

  get height(): number {
    return this.array.length / this.width;
  }

  getAt(x: number, y: number): Bit {
    return (this.array[y * this.width + x] & BIT_VALUE_FLAG) as Bit;
  }

  getExtAt(x: number, y: number): BitExt {
    return this.array[y * this.width + x];
  }

  setAt(x: number, y: number, value: BitLike): void {
    const idx = y * this.width + x;
    this.array[idx] = (this.array[idx] & ~BIT_VALUE_FLAG) | Number(Boolean(value));
  }

  setExtAt(x: number, y: number, value: BitExt): void {
    this.array[y * this.width + x] = value;
  }

  flipAt(x: number, y: number): void {
    this.setAt(x, y, this.getAt(x, y) ^ 1);
  }

  clone(): BitExtMatrix {
    return new BitExtMatrix(this.width, this.array.slice());
  }
}
