import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { BitReader } from "./bit-reader";
import { Bits, BitWriter } from "./bit-writer";

const readPlan = fc.array(
  fc.nat({ max: 32 }),
  { maxLength: 20 }
).chain((plan) =>
  fc.array(
    fc.nat({ max: 1 }),
    {
      minLength: plan.reduce((x, y) => x + y, 0),
      maxLength: plan.reduce((x, y) => x + y, 0),
    }
  ).map((bits): [number[], number[]] => [plan, bits])
);

function bitsToBits(bits: number[]): Bits {
  const writer = new BitWriter();
  for (const bit of bits) {
    writer.pushNumber(bit, 1);
  }
  return writer.transferToBytes();
}

test.prop([readPlan])("readNumber", ([plan, bits]) => {
  const bitReader = new BitReader(bitsToBits(bits));
  let index = 0;
  const expected: number[] = [];
  const actual: number[] = [];
  for (const bitLength of plan) {
    expected.push(parseInt("0" + bits.slice(index, index + bitLength).join(""), 2));
    actual.push(bitReader.readNumber(bitLength));
    index += bitLength;
  }
  expect(actual).toEqual(expected);
});
