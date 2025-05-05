import { expect, test } from "vitest";
import { Bits } from "./bit-writer";
import { encodeErrorCorrection } from "./ecc";

test("1-M one-block example", () => {
  const bits: Bits = {
    bitLength: 128,
    bytes: new Uint8Array([
      0b00010000,
      0b00100000,
      0b00001100,
      0b01010110,
      0b01100001,
      0b10000000,
      0b11101100,
      0b00010001,
      0b11101100,
      0b00010001,
      0b11101100,
      0b00010001,
      0b11101100,
      0b00010001,
      0b11101100,
      0b00010001,
    ]),
  };
  const actual = encodeErrorCorrection(
    bits,
    1,
    "M"
  );
  const expected: Bits = {
    bitLength: 208,
    bytes: new Uint8Array([
      0b00010000,
      0b00100000,
      0b00001100,
      0b01010110,
      0b01100001,
      0b10000000,
      0b11101100,
      0b00010001,
      0b11101100,
      0b00010001,
      0b11101100,
      0b00010001,
      0b11101100,
      0b00010001,
      0b11101100,
      0b00010001,
      0b10100101,
      0b00100100,
      0b11010100,
      0b11000001,
      0b11101101,
      0b00110110,
      0b11000111,
      0b10000111,
      0b00101100,
      0b01010101,
    ])
  };
  expect(actual).toEqual(expected);
});

test("3-H two-blocks example", () => {
  // Hello, world! 0123456789 ABC
  const bits: Bits = {
    bitLength: 208,
    bytes: new Uint8Array([
      0b01000000, // Block 1, Byte 0
      0b11100100, // Block 1, Byte 1
      0b10000110, // Block 1, Byte 2
      0b01010110, // Block 1, Byte 3
      0b11000110, // Block 1, Byte 4
      0b11000110, // Block 1, Byte 5
      0b11110010, // Block 1, Byte 6
      0b11000010, // Block 1, Byte 7
      0b00000111, // Block 1, Byte 8
      0b01110110, // Block 1, Byte 9
      0b11110111, // Block 1, Byte 10
      0b00100110, // Block 1, Byte 11
      0b11000110, // Block 1, Byte 12
      0b01000010, // Block 2, Byte 0
      0b00010010, // Block 2, Byte 1
      0b00000001, // Block 2, Byte 2
      0b00000010, // Block 2, Byte 3
      0b10000000, // Block 2, Byte 4
      0b11000101, // Block 2, Byte 5
      0b01100110, // Block 2, Byte 6
      0b10100110, // Block 2, Byte 7
      0b10010010, // Block 2, Byte 8
      0b00000010, // Block 2, Byte 9
      0b01100101, // Block 2, Byte 10
      0b11100011, // Block 2, Byte 11
      0b11110110, // Block 2, Byte 12
    ]),
  };
  const actual = encodeErrorCorrection(
    bits,
    3,
    "H"
  );
  const expected: Bits = {
    bitLength: 560,
    bytes: new Uint8Array([
      0b01000000, // Block 1, Byte 0
      0b01000010, // Block 2, Byte 0
      0b11100100, // Block 1, Byte 1
      0b00010010, // Block 2, Byte 1
      0b10000110, // Block 1, Byte 2
      0b00000001, // Block 2, Byte 2
      0b01010110, // Block 1, Byte 3
      0b00000010, // Block 2, Byte 3
      0b11000110, // Block 1, Byte 4
      0b10000000, // Block 2, Byte 4
      0b11000110, // Block 1, Byte 5
      0b11000101, // Block 2, Byte 5
      0b11110010, // Block 1, Byte 6
      0b01100110, // Block 2, Byte 6
      0b11000010, // Block 1, Byte 7
      0b10100110, // Block 2, Byte 7
      0b00000111, // Block 1, Byte 8
      0b10010010, // Block 2, Byte 8
      0b01110110, // Block 1, Byte 9
      0b00000010, // Block 2, Byte 9
      0b11110111, // Block 1, Byte 10
      0b01100101, // Block 2, Byte 10
      0b00100110, // Block 1, Byte 11
      0b11100011, // Block 2, Byte 11
      0b11000110, // Block 1, Byte 12
      0b11110110, // Block 2, Byte 12
      0b00100100, // ECC Block 1, Byte 00
      0b11000100, // ECC Block 2, Byte 00
      0b11111000, // ECC Block 1, Byte 01
      0b10011110, // ECC Block 2, Byte 01
      0b11101111, // ECC Block 1, Byte 02
      0b00000001, // ECC Block 2, Byte 02
      0b00110101, // ECC Block 1, Byte 03
      0b00001011, // ECC Block 2, Byte 03
      0b01100011, // ECC Block 1, Byte 04
      0b01111010, // ECC Block 2, Byte 04
      0b01001010, // ECC Block 1, Byte 05
      0b01100110, // ECC Block 2, Byte 05
      0b11100110, // ECC Block 1, Byte 06
      0b01001001, // ECC Block 2, Byte 06
      0b00101110, // ECC Block 1, Byte 07
      0b01101101, // ECC Block 2, Byte 07
      0b01000000, // ECC Block 1, Byte 08
      0b11111101, // ECC Block 2, Byte 08
      0b01110010, // ECC Block 1, Byte 09
      0b11111101, // ECC Block 2, Byte 09
      0b01011110, // ECC Block 1, Byte 10
      0b10111101, // ECC Block 2, Byte 10
      0b00110101, // ECC Block 1, Byte 11
      0b11100101, // ECC Block 2, Byte 11
      0b00010100, // ECC Block 1, Byte 12
      0b00111101, // ECC Block 2, Byte 12
      0b11101000, // ECC Block 1, Byte 13
      0b00001010, // ECC Block 2, Byte 13
      0b01000011, // ECC Block 1, Byte 14
      0b01110110, // ECC Block 2, Byte 14
      0b01111110, // ECC Block 1, Byte 15
      0b11111111, // ECC Block 2, Byte 15
      0b10101010, // ECC Block 1, Byte 16
      0b10010010, // ECC Block 2, Byte 16
      0b10001100, // ECC Block 1, Byte 17
      0b11000001, // ECC Block 2, Byte 17
      0b10100000, // ECC Block 1, Byte 18
      0b01000000, // ECC Block 2, Byte 18
      0b01001110, // ECC Block 1, Byte 19
      0b00010011, // ECC Block 2, Byte 19
      0b01001100, // ECC Block 1, Byte 20
      0b01100110, // ECC Block 2, Byte 20
      0b11011001, // ECC Block 1, Byte 21
      0b11011110, // ECC Block 2, Byte 21
    ])
  };
  expect(actual).toEqual(expected);
});
