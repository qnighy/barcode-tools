import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { Bits, BitWriter } from "./bit-writer";

type Chunk = {
  value: number;
  bitLength: number;
};
function chunk(): fc.Arbitrary<Chunk> {
  return fc.nat({ max: 32 }).chain((bitLength) =>
    fc.nat({ max: (2 ** bitLength) - 1 }).map((value) => ({ value, bitLength }))
  );
}
function chunks(): fc.Arbitrary<Chunk[]> {
  return fc.array(chunk(), { minLength: 0, maxLength: 100 });
}
function bitsObj(): fc.Arbitrary<Bits> {
  return fc.tuple(
    fc.uint8Array({ minLength: 0, maxLength: 100 }),
    fc.integer({ min: 0, max: 7 })
  ).map<Bits>(([bytes, excessBits]) => {
    if (bytes.length === 0 || excessBits === 0) {
      return {
        bitLength: bytes.length * 8,
        bytes,
      };
    } else {
      const newBytes = bytes.slice();
      newBytes[newBytes.length - 1] &= -(1 << (8 - excessBits));
      return {
        bitLength: newBytes.length * 8 - 8 + excessBits,
        bytes: newBytes,
      };
    }
  });
}

test.prop([bitsObj()])("create from Bits and then transferToBytes", (bits) => {
  const bitsCopy: Bits = {
    bitLength: bits.bitLength,
    bytes: new Uint8Array(bits.bytes),
  };
  const actual = new BitWriter(bitsCopy).transferToBytes();
  expect(actual).toEqual(bits);
});

test.prop([chunks()])("pushNumber", (chunks) => {
  const writer = new BitWriter();
  const expectedBits: number[] = [];
  for (const { value, bitLength } of chunks) {
    writer.pushNumber(value, bitLength);
    for (let i = bitLength - 1; i >= 0; i--) {
      expectedBits.push((value >> i) & 1);
    }
  }
  expect(writer.bitLength).toBe(expectedBits.length);

  const expectedBytes: number[] = [];
  for (let i = 0; i < expectedBits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte <<= 1;
      if (i + j < expectedBits.length) {
        byte |= expectedBits[i + j];
      }
    }
    expectedBytes.push(byte);
  }
  const actual = writer.transferToBytes();
  expect(actual).toEqual({
    bitLength: expectedBits.length,
    bytes: new Uint8Array(expectedBytes),
  } satisfies Bits);
});
