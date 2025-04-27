export type Bit = 0 | 1;
export type BitLike = number | boolean;
const UNIT_BIT_LENGTH = 32;
const UNIT_BYTE_LENGTH = 8;
export class BitArray implements Iterable<Bit> {
  #wordBuffer: DataView<ArrayBuffer>;
  #growable: boolean = false;
  #bitOffset: number;
  #bitLength: number;

  static readonly UNIT_BIT_LENGTH: number = UNIT_BIT_LENGTH;
  static readonly UNIT_BYTE_LENGTH: number = UNIT_BYTE_LENGTH;

  constructor();
  constructor(length: number);
  constructor(source: ArrayLike<BitLike> | Iterable<BitLike>);
  constructor(buffer: ArrayBuffer, bitOffset?: number | undefined, bitLength?: number);
  constructor(
    source: ArrayLike<BitLike> | Iterable<BitLike> | ArrayBuffer | number = 0,
    bitOffset: number | undefined = undefined,
    bitLength: number | undefined = undefined
  ) {
    if (typeof source === "number") {
      const length = Math.trunc(source);
      if (length < 0) {
        throw new RangeError("Length must be non-negative");
      }
      this.#wordBuffer = new DataView(new ArrayBuffer(Math.ceil(length / UNIT_BIT_LENGTH) * UNIT_BYTE_LENGTH));
      this.#growable = true;
      this.#bitOffset = 0;
      this.#bitLength = length;
    } else if (source instanceof ArrayBuffer) {
      if (source.byteLength % UNIT_BYTE_LENGTH) {
        throw new RangeError(`Buffer length must be a multiple of ${UNIT_BYTE_LENGTH}`);
      }
      this.#wordBuffer = new DataView(source);
      this.#growable = bitOffset == null;
      bitOffset = Math.trunc(bitOffset ?? 0);
      if (bitOffset < 0 || bitOffset > this.#wordBuffer.byteLength * 8) {
        throw new RangeError("Offset out of bounds");
      }
      this.#bitOffset = bitOffset;
      bitLength = Math.trunc(bitLength ?? (this.#wordBuffer.byteLength * 8 - bitOffset));
      if (bitLength < 0 || bitLength + bitOffset > this.#wordBuffer.byteLength * 8) {
        throw new RangeError("Length out of bounds");
      }
      this.#bitLength = bitLength;
    } else {
      this.#wordBuffer = new DataView(new ArrayBuffer(0));
      this.#growable = true;
      this.#bitOffset = 0;
      this.#bitLength = 0;
      this.#initFrom(source);
    }
  }

  static from(source: ArrayLike<BitLike> | Iterable<BitLike>): BitArray {
    const bitArray = new BitArray();
    bitArray.#initFrom(source);
    return bitArray;
  }

  #initFrom(source: ArrayLike<BitLike> | Iterable<BitLike>): void {
    if (#wordBuffer in source && source.#bitOffset % UNIT_BIT_LENGTH === 0) {
      // Use slice rather than subarray to get a new buffer
      this.#wordBuffer = new DataView(new Uint32Array(source.#wordBuffer.buffer).slice(source.#bitOffset / UNIT_BIT_LENGTH, Math.ceil((source.#bitLength + source.#bitOffset) / UNIT_BIT_LENGTH)).buffer);
      this.#growable = true;
      this.#bitOffset = 0;
      this.#bitLength = source.#bitLength;
      return;
    }

    const isIterable = typeof (source as Iterable<BitLike>)[Symbol.iterator] === "function";
    if (isIterable && !Array.isArray(source) && !ArrayBuffer.isView(source)) {
      const iterable = source as Iterable<BitLike>;
      for (const value of iterable) {
        this.push(value);
      }
    } else {
      const arrayLike = source as ArrayLike<BitLike>;
      const length = Math.trunc(arrayLike.length);
      if (length < 0) {
        throw new RangeError("Length must be non-negative");
      }
      this.#wordBuffer = new DataView(new ArrayBuffer(Math.ceil(length / UNIT_BIT_LENGTH) * UNIT_BYTE_LENGTH));
      this.#growable = true;
      this.#bitOffset = 0;
      this.#bitLength = length;
      for (let i = 0; i < length; i++) {
        this.setAt(i, arrayLike[i]);
      }
    }
  }

  getAt(index: number): Bit {
    if (!this.#isValidIndex(index)) {
      return undefined as unknown as Bit;
    }
    const abs = this.#bitOffset + index;
    return ((this.#wordBuffer.getUint32(abs >> 5) >> (31 - (abs & 31))) & 1) as Bit;
  }

  setAt(index: number, value: BitLike): void {
    if (!this.#isValidIndex(index)) {
      return;
    }
    const abs = this.#bitOffset + index;
    if (value) {
      this.#wordBuffer.setUint32(abs >> 5, this.#wordBuffer.getUint32(abs >> 5) | (1 << (31 - (abs & 31))));
    } else {
      this.#wordBuffer.setUint32(abs >> 5, this.#wordBuffer.getUint32(abs >> 5) & ~(1 << (31 - (abs & 31))));
    }
  }

  push(...bits: BitLike[]): void {
    if (!this.#growable) {
      throw new TypeError("Cannot push to a non-growable BitArray");
    }
    this.#reserve(this.#bitLength + bits.length);
    for (const bit of bits) {
      this.setAt(this.#bitLength++, bit);
    }
  }

  pushInteger(value: number, lengthToAdd: number): void {
    if (!this.#growable) {
      throw new TypeError("Cannot push to a non-growable BitArray");
    }
    lengthToAdd = Math.trunc(lengthToAdd);
    if (lengthToAdd < 0) {
      throw new RangeError("Length must be non-negative");
    }
    const oldLength = this.#bitLength;
    const newLength = oldLength + lengthToAdd;
    this.#reserve(newLength);
    this.#bitLength = newLength;
    const byteStart = Math.ceil(oldLength / 32);
    const byteEnd = Math.floor(newLength / 32);
    if (byteStart > byteEnd) {
      const pos = byteStart - 1;
      // Both values between 1 and 31 (inclusive)
      const bitStart = oldLength - pos * 32;
      const bitEnd = newLength - pos * 32;
      if (bitStart < bitEnd) {
        const mask = (1 << (32 - bitStart)) - (1 << (32 - bitEnd));
        this.#wordBuffer.setUint32(pos, (this.#wordBuffer.getUint32(pos) & ~mask) | ((value << (32 - bitEnd)) & mask));
      }
      return;
    }
    {
      // Copy bits at the start
      const pos = byteStart - 1;
      // bitStart is between 1 and 32 (inclusive)
      const bitStart = oldLength - pos * 32;
      if (bitStart < 32) {
        const mask = (1 << (32 - bitStart)) - 1;
        this.#wordBuffer.setUint32(pos, (this.#wordBuffer.getUint32(pos) & ~mask) | ((value >>> (lengthToAdd - (32 - bitStart))) & mask));
      }
    }
    for (let pos = byteStart; pos < byteEnd; pos++) {
      this.#wordBuffer.setUint32(pos, value >>> (newLength - (pos * 32 + 32)));
    }
    {
      // Copy bits at the end
      const pos = byteEnd;
      // bitEnd is between 0 and 31 (inclusive)
      const bitEnd = newLength - pos * 32;
      if (bitEnd > 0) {
        const mask = -(1 << (32 - bitEnd));
        this.#wordBuffer.setUint32(pos, (this.#wordBuffer.getUint32(pos) & ~mask) | ((value << (32 - bitEnd)) & mask));
      }
    }
  }

  #reserve(demand: number): void {
    if (!this.#growable) {
      throw new TypeError("Cannot use #reserve() on a non-growable BitArray");
    }
    if (demand <= this.#wordBuffer.byteLength * 8) {
      return;
    }
    const newByteCapacity = Math.max(Math.ceil(demand / UNIT_BIT_LENGTH) * UNIT_BYTE_LENGTH, this.#wordBuffer.byteLength * 2);
    const newArrayBuffer = this.#wordBuffer.buffer.transferToFixedLength(newByteCapacity);
    this.#wordBuffer = new DataView(newArrayBuffer);
  }

  #isValidIndex(index: number): boolean {
    return Number.isInteger(index) && index >= 0 && index < this.#bitLength;
  }

  *keys(): IterableIterator<number> {
    const length = this.#bitLength;
    for (let i = 0; i < length; i++) {
      yield i;
    }
  }

  *values(): IterableIterator<Bit> {
    const length = this.#bitLength;
    for (let i = 0; i < length; i++) {
      yield this.getAt(i);
    }
  }

  *[Symbol.iterator](): IterableIterator<Bit> {
    const length = this.#bitLength;
    for (let i = 0; i < length; i++) {
      yield this.getAt(i);
    }
  }

  *entries(): IterableIterator<[number, Bit]> {
    const length = this.#bitLength;
    for (let i = 0; i < length; i++) {
      yield [i, this.getAt(i)];
    }
  }

  toString(): string {
    let result = "";
    for (let i = 0; i < this.#bitLength; i++) {
      result += this.getAt(i).toString();
      if (i + 1 < this.#bitLength) {
        result += ",";
      }
    }
    return result;
  }
}
