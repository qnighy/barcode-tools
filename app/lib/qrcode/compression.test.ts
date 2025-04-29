import { expect, test } from "vitest";
import { CodingParameters, compressBytes } from "./compression";

const GenericM3Parameters: CodingParameters = {
  maxBits: -1,
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
const GenericV9Parameters: CodingParameters = {
  maxBits: -1,
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

const M3MParameters: CodingParameters = {
  ...GenericM3Parameters,
  maxBits: 68,
};
const V1HParameters: CodingParameters = {
  ...GenericV9Parameters,
  maxBits: 72,
};

test("digit example on 1-H symbol", () => {
  const bits = compressBytes(
    new TextEncoder().encode("01234567"),
    V1HParameters
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
    M3MParameters
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
    V1HParameters
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
    V1HParameters
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
    V1HParameters
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
