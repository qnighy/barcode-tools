import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { BitWriter } from "./bit-writer";

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
  const actualBytes = writer.transferToBytes();
  expect(actualBytes).toEqual(new Uint8Array(expectedBytes));
});
