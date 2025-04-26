import { expect, test } from "vitest";
import { encodeDigits, findDigits } from "./digit";
import { BitArray } from "../bit-array";

test("findDigits", () => {
  expect([...findDigits("123abc456")]).toEqual([
    [0, 3],
    [6, 9],
  ]);
});

function encodeDigits_(text: string): number[] {
  const buf = new BitArray();
  encodeDigits(text, buf);
  return [...buf];
}

test("encodeDigits with remainder 0", () => {
  expect(encodeDigits_("123456")).toEqual([
    // 123 = 0b0001111011
    0, 0, 0, 1, 1, 1, 1, 0, 1, 1,
    // 456 = 0b0111001000
    0, 1, 1, 1, 0, 0, 1, 0, 0, 0,
  ]);
});

test("encodeDigits with remainder 1", () => {
  expect(encodeDigits_("1234")).toEqual([
    // 123 = 0b0001111011
    0, 0, 0, 1, 1, 1, 1, 0, 1, 1,
    // 4 = 0b0100
    0, 1, 0, 0,
  ]);
});

test("encodeDigits with remainder 2", () => {
  expect(encodeDigits_("12345")).toEqual([
    // 123 = 0b0001111011
    0, 0, 0, 1, 1, 1, 1, 0, 1, 1,
    // 45 = 0b01000101
    0, 1, 0, 1, 1, 0, 1,
  ]);
});
