import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { inv, mul } from "./gf256";

const gf256 = fc.integer({ min: 0, max: 255 });
const gf256nonzero = fc.integer({ min: 1, max: 255 });

test("multiplication structure is based on x^8 + x^4 + x^3 + x^2 + 1", () => {
  expect(mul(0x02, 0x80)).toBe(0x1D);
  expect(mul(0x04, 0x40)).toBe(0x1D);
  expect(mul(0x08, 0x20)).toBe(0x1D);
  expect(mul(0x10, 0x10)).toBe(0x1D);
});

test.prop([gf256, gf256, gf256])("multiplication is associative", (x, y, z) => {
  expect(mul(mul(x, y), z)).toBe(mul(x, mul(y, z)));
});

test.prop([gf256])("multiplication by 1 is identity", (x) => {
  expect(mul(x, 1)).toBe(x);
});

test.prop([gf256, gf256])("multiplication is commutative", (x, y) => {
  expect(mul(x, y)).toBe(mul(y, x));
});

test.prop([gf256, gf256, gf256])("multiplication is distributive over addition", (x, y, z) => {
  expect(mul(x, y ^ z)).toBe(mul(x, y) ^ mul(x, z));
});

test.prop([gf256])("multiplication by 0 is 0", (x) => {
  expect(mul(x, 0)).toBe(0);
});

test.prop([gf256nonzero])("multiplication by its inverse is 1", (x) => {
  expect(mul(x, inv(x))).toBe(1);
});
