import { expect, test } from "vitest";
import { addFiller, CodingParameters, compressBytes } from "./compression";
import { BitArray } from "./bit-array";

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
  const bits = compressBytes(
    new TextEncoder().encode("01234567"),
    V1HMaxBits,
    V9Parameters
  );
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
    0, 1, 0, 1, 0, 1, 1, 0, 0, 1,
    1, 0, 0, 0, 0, 1, 1
  ]);
});

test("digit example on M3-M symbol", () => {
  const bits = compressBytes(
    new TextEncoder().encode("0123456789012345"),
    M3MMaxBits,
    M3Parameters
  );
  expect([...bits]).toEqual([
    0, 0,
    1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
    0, 1, 0, 1, 0, 1, 1, 0, 0, 1,
    1, 0, 1, 0, 1, 0, 0, 1, 1, 0,
    1, 1, 1, 0, 0, 0, 0, 1, 0, 1,
    0, 0, 1, 1, 1, 0, 1, 0, 1, 0,
    0, 1, 0, 1,
  ]);
});

test("alphanumeric example on 1-H symbol", () => {
  const bits = compressBytes(
    new TextEncoder().encode("AC-42"),
    V1HMaxBits,
    V9Parameters
  );
  expect([...bits]).toEqual([
    0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 1, 0, 1,
    0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,
    1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1,
    0, 0, 0, 0, 1, 0,
  ]);
});

test("kanji example on 1-H symbol", () => {
  const bits = compressBytes(
    // 935F (点), E4AA (茗)
    new Uint8Array([0x93, 0x5F, 0xE4, 0xAA]),
    V1HMaxBits,
    V9Parameters
  );
  expect([...bits]).toEqual([
    1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 0,
    0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1,
    1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
  ]);
});

test("Mixed alphanumerics and digits", () => {
  const bits = compressBytes(
    new TextEncoder().encode("ZK-3235014"),
    V1HMaxBits,
    V9Parameters
  );
  expect([...bits]).toEqual([
    0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1,
    1, 0, 1, 0, 0, 1,
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    0, 1, 0, 1, 0, 0, 0, 0, 1, 1,
    0, 1, 1, 1, 1, 1, 0, 1, 0, 1,
    0, 1, 0, 0,
  ]);
});

test("addFiller, QR, no terminator", () => {
  const bits = new BitArray([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]);
  addFiller(bits, 24, V9Parameters);
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]);
});

test("addFiller, QR, short terminator", () => {
  const bits = new BitArray([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    1, 1, 1, 1, 1, 1, 1,
  ]);
  addFiller(bits, 24, V9Parameters);
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 0,
    1, 1, 1, 1, 1, 1, 1,
    0, 0, 0,
  ]);
});

test("addFiller, QR, exact terminator", () => {
  const bits = new BitArray([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1
  ]);
  addFiller(bits, 32, V9Parameters);
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1,
    0, 0, 0, 0,
  ]);
});

test("addFiller, QR, 0.5-byte excess", () => {
  const bits = new BitArray([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]);
  addFiller(bits, 32, V9Parameters);
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0,
    0, 0, 0, 0,
  ]);
});

test("addFiller, QR, 1-byte excess", () => {
  const bits = new BitArray([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1
  ]);
  addFiller(bits, 40, V9Parameters);
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1,
    0, 0, 0, 0,
    1, 1, 1, 0, 1, 1, 0, 0,
  ]);
});

test("addFiller, QR, 1.5-byte excess", () => {
  const bits = new BitArray([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]);
  addFiller(bits, 40, V9Parameters);
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0,
    0, 0, 0, 0,
    1, 1, 1, 0, 1, 1, 0, 0,
  ]);
});

test("addFiller, QR, 2-byte excess", () => {
  const bits = new BitArray([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1
  ]);
  addFiller(bits, 48, V9Parameters);
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1,
    0, 0, 0, 0,
    1, 1, 1, 0, 1, 1, 0, 0,
    0, 0, 0, 1, 0, 0, 0, 1,
  ]);
});

test("addFiller, QR, 2.5-byte excess", () => {
  const bits = new BitArray([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]);
  addFiller(bits, 48, V9Parameters);
  expect([...bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0,
    0, 0, 0, 0,
    1, 1, 1, 0, 1, 1, 0, 0,
    0, 0, 0, 1, 0, 0, 0, 1,
  ]);
});
