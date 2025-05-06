import { Bits } from "./bit-writer";

export class BitReader {
  #bitLength: number;
  #dataView: DataView;
  #wordIndex: number;
  #currentWord: number;
  #currentWordBitIndex: number;

  constructor(bitsObj: Bits) {
    const { bitLength, bytes } = bitsObj;
    const expectedByteLength = Math.ceil(bitLength / 8);
    if (bytes.length !== expectedByteLength) {
      throw new RangeError(
        `Expected ${expectedByteLength} bytes, but got ${bytes.length}`
      );
    }
    const buffer = bytes.buffer;
    if (bytes.byteOffset !== 0) {
      throw new RangeError("Buffer must start at offset 0")
    }

    this.#bitLength = bitLength;
    this.#dataView = new DataView(buffer);
    this.#wordIndex = 0;
    this.#currentWord = 0;
    this.#currentWordBitIndex = 0;
    this.#setCurrentWord();
  }

  get bitLength(): number {
    return this.#bitLength;
  }
  get bitOffset(): number {
    return this.#wordIndex * 32 + this.#currentWordBitIndex;
  }
  get remainingBits(): number {
    return this.bitLength - this.bitOffset;
  }

  readNumber(bitLength: number): number {
    if (bitLength > 32) {
      throw new RangeError("Cannot read more than 32 bits as a number");
    } else if (bitLength > this.remainingBits) {
      throw new RangeError("Tried to read past the end of the buffer");
    }
    let value = 0;
    while (bitLength + this.#currentWordBitIndex >= 32) {
      const bitsToRead = 32 - this.#currentWordBitIndex;
      value |= this.#currentWord << (bitLength - bitsToRead);
      this.#wordIndex++;
      this.#currentWordBitIndex = 0;
      this.#setCurrentWord();
      bitLength -= bitsToRead;
    }
    if (bitLength > 0) {
      value |= this.#currentWord >>> (32 - this.#currentWordBitIndex - bitLength);
      this.#currentWord &= (1 << (32 - this.#currentWordBitIndex - bitLength)) - 1;
      this.#currentWordBitIndex += bitLength;
    }
    return value >>> 0;
  }

  #setCurrentWord(): void {
    const nextBoundary = (this.#wordIndex + 1) << 2;
    if (nextBoundary <= this.#dataView.byteLength) {
      // Big endian
      this.#currentWord = this.#dataView.getUint32(this.#wordIndex << 2);
    } else {
      const bytePos = this.#wordIndex << 2;
      const len = this.#dataView.byteLength - bytePos;
      this.#currentWord = 0;
      for (let i = 0; i < len; i++) {
        this.#currentWord |= this.#dataView.getUint8(bytePos + i) << ((3 - i) * 8);
      }
      this.#currentWord >>>= 0;
    }
  }
}
