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
