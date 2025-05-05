import { expect, test } from "vitest";
import { addFiller, CodingParameters, compressBinaryParts } from "./compression";
import { Bits, BitWriter } from "./bit-writer";

const M3Parameters: CodingParameters = {
  modeIndicatorBits: 2,
  digitModeIndicator: 0b00,
  alphanumericModeIndicator: 0b01,
  byteModeIndicator: 0b10,
  kanjiModeIndicator: 0b11,
  digitModeCountBits: 5,
  alphanumericModeCountBits: 4,
  byteModeCountBits: 4,
  kanjiModeCountBits: 3,
};
const V9Parameters: CodingParameters = {
  modeIndicatorBits: 4,
  digitModeIndicator: 0b0001,
  alphanumericModeIndicator: 0b0010,
  byteModeIndicator: 0b0100,
  kanjiModeIndicator: 0b1000,
  digitModeCountBits: 10,
  alphanumericModeCountBits: 9,
  byteModeCountBits: 8,
  kanjiModeCountBits: 8,
};

const M3MMaxBits = 68;
const V1HMaxBits = 72;

test("digit example on 1-H symbol", () => {
  const bits = compressBinaryParts(
    [{
      eciDesignator: null,
      bytes: new TextEncoder().encode("01234567"),
    }],
    V1HMaxBits,
    V9Parameters
  );
  expect(bits.transferToBytes()).toEqual({
    bitLength: 41,
    bytes: new Uint8Array([
      // mode  0001
      // size      0000(001000)
      0b00010000,
      // ...   001000
      // chunk       00(00001100)
      0b00100000,
      // ...   00001100
      0b00001100,
      // chunk 01010110(01)
      0b01010110,
      // ...   01
      // chunk   100001(1)
      0b01100001,
      // ...   1
      // pad    0000000
      0b10000000,
    ]),
  } satisfies Bits);
});

test("digit example on M3-M symbol", () => {
  const bits = compressBinaryParts(
    [{
      eciDesignator: null,
      bytes: new TextEncoder().encode("0123456789012345"),
    }],
    M3MMaxBits,
    M3Parameters
  );
  expect(bits.transferToBytes()).toEqual({
    bitLength: 61,
    bytes: new Uint8Array([
      // mode  00
      // size    10000
      // chunk        0(000001100)
      0b00100000,
      // ...   00000110(0)
      0b00000110,
      // ...   0
      // chunk  0101011(001)
      0b00101011,
      // ...   001
      // chunk    10101(00110)
      0b00110101,
      // ...   00110
      // chunk      111(0000101)
      0b00110111,
      // ...   0000101
      // chunk        0(011101010)
      0b00001010,
      // ...   01110101(0)
      0b01110101,
      // ...   0
      // chunk  0101
      // pad        000
      0b00101000,
    ]),
  } satisfies Bits);
});

test("alphanumeric example on 1-H symbol", () => {
  const bits = compressBinaryParts(
    [{
      eciDesignator: null,
      bytes: new TextEncoder().encode("AC-42"),
    }],
    V1HMaxBits,
    V9Parameters
  );
  expect(bits.transferToBytes()).toEqual({
    bitLength: 41,
    bytes: new Uint8Array([
      // mode  0010
      // size      0000(00101)
      0b00100000,
      // ...   00101
      // chunk      001(11001110)
      0b00101001,
      // ...   11001110
      0b11001110,
      // chunk 11100111(001)
      0b11100111,
      // ...   001
      // chunk    00001(0)
      0b00100001,
      // ...   0
      // pad    0000000
      0b00000000,
    ]),
  } satisfies Bits);
});

test("kanji example on 1-H symbol", () => {
  const bits = compressBinaryParts(
    // 935F (点), E4AA (茗)
    [{
      eciDesignator: null,
      bytes: new Uint8Array([0x93, 0x5F, 0xE4, 0xAA]),
    }],
    V1HMaxBits,
    V9Parameters
  );
  expect(bits.transferToBytes()).toEqual({
    bitLength: 38,
    bytes: new Uint8Array([
      // mode  1000
      // size      0000(0010)
      0b10000000,
      // ...   0010
      // chunk     0110(110011111)
      0b00100110,
      // ...   11001111(1)
      0b11001111,
      // ...   1
      // chunk  1101010(101010)
      0b11101010,
      // ...   101010
      // pad         00
      0b10101000,
    ]),
  } satisfies Bits);
});

test("Mixed alphanumerics and digits", () => {
  const bits = compressBinaryParts(
    [{
      eciDesignator: null,
      bytes: new TextEncoder().encode("ZK-3235014"),
    }],
    V1HMaxBits,
    V9Parameters
  );
  expect(bits.transferToBytes()).toEqual({
    bitLength: 68,
    bytes: new Uint8Array([
      // mode  0010
      // size      0000(00011)
      0b00100000,
      // ...   00011
      // chunk      110(00111011)
      0b00011110,
      // ...   00111011
      0b00111011,
      // chunk 101001
      // mode        00(01)
      0b10100100,
      // ...   01
      // size    000000(0111)
      0b01000000,
      // ...   0111
      // chunk     0101(000011)
      0b01110101,
      // ...   000011
      // chunk       01(11110101)
      0b00001101,
      // ...   11110101
      0b11110101,
      // chunk 0100
      // pad       0000
      0b01000000,
    ]),
  } satisfies Bits);
});

test("addFiller, QR, no terminator", () => {
  const bits = new BitWriter({
    bitLength: 24,
    bytes: new Uint8Array([
      // "999" in version 1
      0b00010000,
      0b00001111,
      0b11100111,
    ]),
  });
  addFiller(bits, 24, V9Parameters);
  expect(bits.transferToBytes()).toEqual({
    bitLength: 24,
    bytes: new Uint8Array([
      0b00010000,
      0b00001111,
      0b11100111,
    ]),
  } satisfies Bits);
});

test("addFiller, QR, short terminator", () => {
  const bits = new BitWriter({
    bitLength: 21,
    bytes: new Uint8Array([
      // "99" in version 1
      0b00010000,
      0b00001011,
      0b00011000,
    ]),
  });
  addFiller(bits, 24, V9Parameters);
  expect(bits.transferToBytes()).toEqual({
    bitLength: 24,
    bytes: new Uint8Array([
      0b00010000,
      0b00001011,
      0b00011000,
    ]),
  } satisfies Bits);
});

test("addFiller, QR, exact terminator", () => {
  const bits = new BitWriter({
    bitLength: 28,
    bytes: new Uint8Array([
      // "9999" in version 1
      0b00010000,
      0b00010011,
      0b11100111,
      0b10010000,
    ]),
  });
  addFiller(bits, 32, V9Parameters);
  expect(bits.transferToBytes()).toEqual({
    bitLength: 32,
    bytes: new Uint8Array([
      0b00010000,
      0b00010011,
      0b11100111,
      0b10010000,
    ]),
  } satisfies Bits);
});

test("addFiller, QR, 0.5-byte excess", () => {
  const bits = new BitWriter({
    bitLength: 24,
    bytes: new Uint8Array([
      // "999" in version 1
      0b00010000,
      0b00001111,
      0b11100111,
    ]),
  });
  addFiller(bits, 32, V9Parameters);
  expect(bits.transferToBytes()).toEqual({
    bitLength: 32,
    bytes: new Uint8Array([
      0b00010000,
      0b00001111,
      0b11100111,
      0b00000000,
    ]),
  } satisfies Bits);
});

test("addFiller, QR, 1-byte excess", () => {
  const bits = new BitWriter({
    bitLength: 28,
    bytes: new Uint8Array([
      // "9999" in version 1
      0b00010000,
      0b00010011,
      0b11100111,
      0b10010000,
    ]),
  });
  addFiller(bits, 40, V9Parameters);
  expect(bits.transferToBytes()).toEqual({
    bitLength: 40,
    bytes: new Uint8Array([
      0b00010000,
      0b00010011,
      0b11100111,
      0b10010000,
      0b11101100,
    ]),
  } satisfies Bits);
});

test("addFiller, QR, 1.5-byte excess", () => {
  const bits = new BitWriter({
    bitLength: 24,
    bytes: new Uint8Array([
      // "999" in version 1
      0b00010000,
      0b00001111,
      0b11100111,
    ]),
  });
  addFiller(bits, 40, V9Parameters);
  expect(bits.transferToBytes()).toEqual({
    bitLength: 40,
    bytes: new Uint8Array([
      0b00010000,
      0b00001111,
      0b11100111,
      0b00000000,
      0b11101100,
    ]),
  } satisfies Bits);
});

test("addFiller, QR, 2-byte excess", () => {
  const bits = new BitWriter({
    bitLength: 28,
    bytes: new Uint8Array([
      // "9999" in version 1
      0b00010000,
      0b00010011,
      0b11100111,
      0b10010000,
    ]),
  });
  addFiller(bits, 48, V9Parameters);
  expect(bits.transferToBytes()).toEqual({
    bitLength: 48,
    bytes: new Uint8Array([
      0b00010000,
      0b00010011,
      0b11100111,
      0b10010000,
      0b11101100,
      0b00010001,
    ]),
  } satisfies Bits);
});

test("addFiller, QR, 2.5-byte excess", () => {
  const bits = new BitWriter({
    bitLength: 24,
    bytes: new Uint8Array([
      // "999" in version 1
      0b00010000,
      0b00001111,
      0b11100111,
    ]),
  });
  addFiller(bits, 48, V9Parameters);
  expect(bits.transferToBytes()).toEqual({
    bitLength: 48,
    bytes: new Uint8Array([
      0b00010000,
      0b00001111,
      0b11100111,
      0b00000000,
      0b11101100,
      0b00010001,
    ]),
  } satisfies Bits);
});
