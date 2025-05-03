export type Bits = {
  bitLength: number;
  bytes: Uint8Array;
};

export class BitWriter {
  #dataView: DataView<ArrayBuffer>;
  #wordLength: number;
  #lastWord: number;
  #lastWordBitLength: number;

  constructor();
  constructor(bitsObj: Bits);
  constructor(bitsObj?: Bits) {
    if (typeof bitsObj === "object" && bitsObj !== null) {
      const { bitLength, bytes } = bitsObj;
      const expectedByteLength = Math.ceil(bitLength / 8);
      if (bytes.length !== expectedByteLength) {
        throw new RangeError(
          `Expected ${expectedByteLength} bytes, but got ${bytes.length}`
        );
      }
      const buffer = bytes.buffer;
      if (!(buffer instanceof ArrayBuffer)) {
        throw new TypeError("Expected an ArrayBuffer");
      }
      if (bytes.byteOffset !== 0) {
        throw new RangeError("Buffer must start at offset 0")
      }

      this.#lastWordBitLength = bitLength % 32;
      this.#lastWord = 0;
      const lastWordStart = Math.floor(bitLength / 32) * 4;
      for (let i = lastWordStart; i < expectedByteLength; i++) {
        this.#lastWord |= bytes[i] << (24 - (i - lastWordStart) * 8);
      }
      if (this.#lastWord & (2 ** (32 - this.#lastWordBitLength) - 1)) {
        throw new TypeError("Non-zero-padded last byte");
      }

      this.#wordLength = Math.floor(bitLength / 32);
      this.#dataView = new DataView(buffer.transferToFixedLength());
    } else {
      this.#dataView = new DataView(new ArrayBuffer(0));
      this.#wordLength = 0;
      this.#lastWord = 0;
      this.#lastWordBitLength = 0;
    }
  }

  get bitLength() {
    return this.#wordLength * 32 + this.#lastWordBitLength;
  }

  pushNumber(value: number, bitLength: number): void {
    if (bitLength > 32) {
      throw new RangeError("Cannot push more than 32 bits from a number");
    }
    if (bitLength < 32) {
      value &= (1 << bitLength) - 1;
    }
    while (bitLength + this.#lastWordBitLength >= 32) {
      const bitsToPush = 32 - this.#lastWordBitLength;
      const word =
        this.#lastWord |
        (value >>> (bitLength - bitsToPush));
      this.#pushWord(word);
      this.#lastWord = 0;
      this.#lastWordBitLength = 0;
      bitLength -= bitsToPush;
      if (bitLength < 32) {
        value &= (1 << bitLength) - 1;
      }
    }
    if (bitLength > 0) {
      this.#lastWord =
        this.#lastWord | (value << (32 - this.#lastWordBitLength - bitLength));
      this.#lastWordBitLength += bitLength;
    }
  }

  #pushWord(word: number): void {
    this.#reserveDataView(this.#wordLength + 1);
    // Big endian
    this.#dataView.setUint32(this.#wordLength * 4, word);
    this.#wordLength++;
  }

  #reserveDataView(demandWordLength: number): void {
    if (this.#dataView.byteLength >= demandWordLength * 4) {
      return;
    }
    const newCapacityBytes = Math.max(
      this.#dataView.byteLength * 2,
      demandWordLength * 4,
    );
    this.#dataView = new DataView(
      this.#dataView.buffer.transfer(newCapacityBytes)
    );
  }

  transferToBytes(): Bits {
    const bitLength = this.bitLength;
    if (this.#lastWordBitLength > 0) {
      this.#reserveDataView(this.#wordLength + 1);
      // Big endian
      this.#dataView.setUint32(this.#wordLength * 4, this.#lastWord);
    }
    const byteLength = Math.ceil(this.bitLength / 8);
    const buffer = this.#dataView.buffer.transfer();
    return {
      bitLength,
      bytes: new Uint8Array(buffer, 0, byteLength),
    };
  }
}
