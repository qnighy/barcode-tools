import { expect, test } from "vitest";
import { BitArray } from "./bit-array";

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

test("construct with ArrayBuffer alone", () => {
  const buffer = new Uint8Array([99]).buffer;
  expect(Array.from(new BitArray(buffer))).toEqual([0, 1, 1, 0, 0, 0, 1, 1]);
});

test("construct with ArrayBuffer and offset", () => {
  const buffer = new Uint8Array([99]).buffer;
  expect(Array.from(new BitArray(buffer, 2))).toEqual([1, 0, 0, 0, 1, 1]);
});

test("construct with ArrayBuffer and length", () => {
  const buffer = new Uint8Array([99]).buffer;
  expect(Array.from(new BitArray(buffer, undefined, 3))).toEqual([0, 1, 1]);
});

test("construct with ArrayBuffer, offset, and length", () => {
  const buffer = new Uint8Array([99]).buffer;
  expect(Array.from(new BitArray(buffer, 2, 3))).toEqual([1, 0, 0]);
});

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

test("push to non-growable", () => {
  const bitArray = new BitArray(new ArrayBuffer(3), 0);
  expect(() => bitArray.push(1, 0, 2)).toThrow(TypeError);
});

test("pushInteger within byte", () => {
  const bitArray = new BitArray([1, 1, 1]);
  bitArray.pushInteger(0b101, 3);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 1, 0, 1]);
});

test("pushInteger empty push within byte", () => {
  const bitArray = new BitArray([1, 1, 1]);
  bitArray.pushInteger(0, 0);
  expect(Array.from(bitArray)).toEqual([1, 1, 1]);
});

test("pushInteger empty push at border", () => {
  const bitArray = new BitArray([1, 1, 1, 1, 1, 1, 1, 1]);
  bitArray.pushInteger(0, 0);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
});

test("pushInteger within byte, end at border", () => {
  const bitArray = new BitArray([1, 1, 1]);
  bitArray.pushInteger(0b10001, 5);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 1, 0, 0, 0, 1]);
});

test("pushInteger within byte, start at border", () => {
  const bitArray = new BitArray([1, 1, 1, 1, 1, 1, 1, 1]);
  bitArray.pushInteger(0b101, 3);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1]);
});

test("pushInteger within byte, start and end at border", () => {
  const bitArray = new BitArray([1, 1, 1, 1, 1, 1, 1, 1]);
  bitArray.pushInteger(0b01100011, 8);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 1]);
});

test("pushInteger across bytes", () => {
  const bitArray = new BitArray([1, 1, 1]);
  bitArray.pushInteger(0b10001010000100010, 17);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]);
});

test("pushInteger across bytes, end at border", () => {
  const bitArray = new BitArray([1, 1, 1]);
  bitArray.pushInteger(0b000010001010000100010, 21);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]);
});

test("pushInteger across bytes, start at border", () => {
  const bitArray = new BitArray([1, 1, 1, 1, 1, 1, 1, 1]);
  bitArray.pushInteger(0b10001010000100010, 17);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]);
});

test("pushInteger across bytes, start and end at border", () => {
  const bitArray = new BitArray([1, 1, 1, 1, 1, 1, 1, 1]);
  bitArray.pushInteger(0b000000010001010000100010, 24);
  expect(Array.from(bitArray)).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0]);
});
