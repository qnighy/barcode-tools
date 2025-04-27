import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { Bit, BitArray } from "./bit-array";

const bit = fc.integer({ min: 0, max: 1 }) as fc.Arbitrary<Bit>;
function bits({
  minLength = 0,
  maxLength = 256,
}: {
  minLength?: number;
  maxLength?: number;
} = {}): fc.Arbitrary<Bit[]> {
  return fc.array(bit, {
    minLength,
    maxLength,
  });
}

test("construct with no argument", () => {
  expect(Array.from(new BitArray())).toEqual([]);
});

test("construct with size", () => {
  expect(Array.from(new BitArray(3))).toEqual([0, 0, 0]);
});

test("construct with array", () => {
  expect(Array.from(new BitArray([1, 0, 2]))).toEqual([1, 0, 1]);
});

test("construct with iterable", () => {
  expect(Array.from(new BitArray(function*() {
    yield 1;
    yield 0;
    yield 2;
  }()))).toEqual([1, 0, 1]);
});

test("construct with array-like", () => {
  expect(Array.from(new BitArray({ length: 3, 0: 1, 1: 0, 2: 2 }))).toEqual([1, 0, 1]);
});

test("construct with TypedArray", () => {
  expect(Array.from(new BitArray(new Uint8Array([1, 0, 2])))).toEqual([1, 0, 1]);
});

test("construct with BitArray", () => {
  expect(Array.from(new BitArray(new BitArray([1, 0, 2])))).toEqual([1, 0, 1]);
});

// test("construct with ArrayBuffer alone", () => {
//   const buffer = new Uint8Array([99]).buffer;
//   expect(Array.from(new BitArray(buffer))).toEqual([0, 1, 1, 0, 0, 0, 1, 1]);
// });
//
// test("construct with ArrayBuffer and offset", () => {
//   const buffer = new Uint8Array([99]).buffer;
//   expect(Array.from(new BitArray(buffer, 2))).toEqual([1, 0, 0, 0, 1, 1]);
// });
//
// test("construct with ArrayBuffer and length", () => {
//   const buffer = new Uint8Array([99]).buffer;
//   expect(Array.from(new BitArray(buffer, undefined, 3))).toEqual([0, 1, 1]);
// });
//
// test("construct with ArrayBuffer, offset, and length", () => {
//   const buffer = new Uint8Array([99]).buffer;
//   expect(Array.from(new BitArray(buffer, 2, 3))).toEqual([1, 0, 0]);
// });

test("BitArray.from with array", () => {
  expect(Array.from(BitArray.from([1, 0, 2]))).toEqual([1, 0, 1]);
});

test("BitArray.from with iterable", () => {
  expect(Array.from(BitArray.from(function*() {
    yield 1;
    yield 0;
    yield 2;
  }()))).toEqual([1, 0, 1]);
});

test("BitArray.from with array-like", () => {
  expect(Array.from(BitArray.from({ length: 3, 0: 1, 1: 0, 2: 2 }))).toEqual([1, 0, 1]);
});

test("BitArray.from with TypedArray", () => {
  expect(Array.from(BitArray.from(new Uint8Array([1, 0, 2])))).toEqual([1, 0, 1]);
});

test("BitArray.from with BitArray", () => {
  expect(Array.from(BitArray.from(BitArray.from([1, 0, 2])))).toEqual([1, 0, 1]);
});

test.prop([bits(), fc.nat(), fc.nat()])("getNumber", (bits, start_, len_) => {
  const bitArray = new BitArray(bits);
  const start = start_ % (bits.length + 1);
  const len = Math.min(len_ % (bits.length + 1 - start), 32);
  const expected = parseInt("0" + bits.slice(start, start + len).join(""), 2);
  const actual = bitArray.getNumber(start, len);
  expect(actual).toEqual(expected);
});

test.prop([bits(), fc.nat(), fc.nat(), fc.nat({ max: 2 ** 32 - 1 })])("setNumber", (bits_, start_, len_, value_) => {
  const bits = [...bits_];
  const bitArray = new BitArray(bits);
  const start = start_ % (bits.length + 1);
  const len = Math.min(len_ % (bits.length + 1 - start), 32);
  const value = value_ % (2 ** len);

  bitArray.setNumber(start, len, value);
  for (let i = 0; i < len; i++) {
    bits[start + i] = ((value >> (len - 1 - i)) & 1) as Bit;
  }
  expect(Array.from(bitArray)).toEqual(bits);
});

test("getAt in-range", () => {
  const bitArray = new BitArray([1, 0, 2]);
  expect(bitArray.getAt(0)).toBe(1);
  expect(bitArray.getAt(1)).toBe(0);
  expect(bitArray.getAt(2)).toBe(1);
});

test("getAt out-of-range", () => {
  const bitArray = new BitArray([1, 0, 2]);
  expect(bitArray.getAt(-1)).toBeUndefined();
  expect(bitArray.getAt(3)).toBeUndefined();
});

test("setAt in-range", () => {
  const bitArray = new BitArray([0, 0, 0]);
  bitArray.setAt(0, 1);
  expect(Array.from(bitArray)).toEqual([1, 0, 0]);
  bitArray.setAt(1, 0);
  expect(Array.from(bitArray)).toEqual([1, 0, 0]);
  bitArray.setAt(2, 2);
  expect(Array.from(bitArray)).toEqual([1, 0, 1]);
});

test("setAt out-of-range", () => {
  const bitArray = new BitArray([0, 0, 0]);
  bitArray.setAt(-1, 1);
  expect(Array.from(bitArray)).toEqual([0, 0, 0]);
  bitArray.setAt(3, 1);
  expect(Array.from(bitArray)).toEqual([0, 0, 0]);
});

test("push to growable", () => {
  const bitArray = new BitArray([1, 1, 0, 1, 1]);
  bitArray.push(1, 0, 2);
  expect(Array.from(bitArray)).toEqual([1, 1, 0, 1, 1, 1, 0, 1]);
});

// test("push to non-growable", () => {
//   const bitArray = new BitArray(new ArrayBuffer(3), 0);
//   expect(() => bitArray.push(1, 0, 2)).toThrow(TypeError);
// });

test.prop([bits(), fc.nat({ max: 32 }), fc.nat()])("pushNumber", (bits_, len_, value_) => {
  const bits = [...bits_];
  const bitArray = new BitArray(bits);
  const len = len_ % 33;
  const value = value_ % (2 ** len);

  bitArray.pushNumber(value, len);
  for (let i = 0; i < len; i++) {
    bits.push(((value >> (len - 1 - i)) & 1) as Bit);
  }
  expect(Array.from(bitArray)).toEqual(bits);
});
