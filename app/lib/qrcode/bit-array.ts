export type Bit = 0 | 1;
export type BitLike = number | boolean;
export class BitArray implements Iterable<Bit> {
  #byteBuffer: Uint8Array<ArrayBuffer>;
  #growable: boolean = false;
  #bitOffset: number;
  #bitLength: number;

  constructor();
  constructor(length: number);
  constructor(source: ArrayLike<BitLike> | Iterable<BitLike>);
  constructor(buffer: ArrayBuffer, bitOffset?: number | undefined, bigLength?: number);
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
      this.#byteBuffer = new Uint8Array(Math.ceil(length / 8));
      this.#growable = true;
      this.#bitOffset = 0;
      this.#bitLength = length;
    } else if (source instanceof ArrayBuffer) {
      this.#byteBuffer = new Uint8Array(source);
      this.#growable = bitOffset == null;
      bitOffset = Math.trunc(bitOffset ?? 0);
      if (bitOffset < 0 || bitOffset > this.#byteBuffer.length * 8) {
        throw new RangeError("Offset out of bounds");
      }
      this.#bitOffset = bitOffset;
      bitLength = Math.trunc(bitLength ?? (this.#byteBuffer.length * 8 - bitOffset));
      if (bitLength < 0 || bitLength + bitOffset > this.#byteBuffer.length * 8) {
        throw new RangeError("Length out of bounds");
      }
      this.#bitLength = bitLength;
    } else {
      this.#byteBuffer = new Uint8Array(0);
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
    if (#byteBuffer in source && source.#bitOffset % 8 === 0) {
      // Use slice rather than subarray to get a new buffer
      this.#byteBuffer = source.#byteBuffer.slice(source.#bitOffset >> 3, Math.ceil((source.#bitLength + source.#bitOffset) / 8));
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
      this.#byteBuffer = new Uint8Array(Math.ceil(length / 8));
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
    return ((this.#byteBuffer[abs >> 3] >> (7 - (abs & 7))) & 1) as Bit;
  }

  setAt(index: number, value: BitLike): void {
    if (!this.#isValidIndex(index)) {
      return;
    }
    const abs = this.#bitOffset + index;
    if (value) {
      this.#byteBuffer[abs >> 3] |= 1 << (7 - (abs & 7));
    } else {
      this.#byteBuffer[abs >> 3] &= ~(1 << (7 - (abs & 7)));
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
    const byteStart = Math.ceil(oldLength / 8);
    const byteEnd = Math.floor(newLength / 8);
    if (byteStart > byteEnd) {
      const pos = byteStart - 1;
      // Both values between 1 and 7 (inclusive)
      const bitStart = oldLength - pos * 8;
      const bitEnd = newLength - pos * 8;
      if (bitStart < bitEnd) {
        const mask = (1 << (8 - bitStart)) - (1 << (8 - bitEnd));
        this.#byteBuffer[pos] = (this.#byteBuffer[pos] & ~mask) | ((value << (8 - bitEnd)) & mask);
      }
      return;
    }
    {
      // Copy bits at the start
      const pos = byteStart - 1;
      // bitStart is between 1 and 8 (inclusive)
      const bitStart = oldLength - pos * 8;
      if (bitStart < 8) {
        const mask = (1 << (8 - bitStart)) - 1;
        this.#byteBuffer[pos] = (this.#byteBuffer[pos] & ~mask) | ((value >>> (lengthToAdd - (8 - bitStart))) & mask);
      }
    }
    for (let pos = byteStart; pos < byteEnd; pos++) {
      this.#byteBuffer[pos] = value >>> (newLength - (pos * 8 + 8));
    }
    {
      // Copy bits at the end
      const pos = byteEnd;
      // bitEnd is between 0 and 7 (inclusive)
      const bitEnd = newLength - pos * 8;
      if (bitEnd > 0) {
        const mask = 256 - (1 << (8 - bitEnd));
        this.#byteBuffer[pos] = (this.#byteBuffer[pos] & ~mask) | ((value << (8 - bitEnd)) & mask);
      }
    }
  }

  #reserve(demand: number): void {
    if (!this.#growable) {
      throw new TypeError("Cannot use #reserve() on a non-growable BitArray");
    }
    if (demand <= this.#byteBuffer.length * 8) {
      return;
    }
    const newByteCapacity = Math.max(Math.ceil(demand / 8), this.#byteBuffer.length * 2);
    const newArrayBuffer = this.#byteBuffer.buffer.transferToFixedLength(newByteCapacity);
    this.#byteBuffer = new Uint8Array(newArrayBuffer);
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
