import { expect, test } from "vitest";
import { encodeAlphanumerics, findAlphanumerics } from "./alphanumeric";
import { BitArray } from "../bit-array";

test("findAlphanumerics", () => {
  expect([...findAlphanumerics("A35-Bax'S[] Z")]).toEqual([
    [0, 5],
    [8, 9],
    [11, 13],
  ]);
});

function encodeAlphanumerics_(text: string): number[] {
  const buf = new BitArray();
  encodeAlphanumerics(text, buf);
  return [...buf];
}

test("encodeAlphanumerics with remainder 0", () => {
  expect(encodeAlphanumerics_("AC-35/ZZ")).toEqual([
    // "AC" = (10, 12) =  462 = 0b00111001110
    0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,
    // "-3" = (41,  3) = 1848 = 0b11100111000
    1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0,
    // "5/" = ( 5, 43) =  268 = 0b00100001100
    0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0,
    // "ZZ" = (35, 35) = 1610 = 0b11001001010
    1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0,
  ]);
});

test("encodeAlphanumerics with remainder 1", () => {
  expect(encodeAlphanumerics_("AC-35/Z")).toEqual([
    // "AC" = (10, 12) =  462 = 0b00111001110
    0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0,
    // "-3" = (41,  3) = 1848 = 0b11100111000
    1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0,
    // "5/" = ( 5, 43) =  268 = 0b00100001100
    0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0,
    // "Z"  = (35)     =   35 = 0b100011
    1, 0, 0, 0, 1, 1,
  ]);
});
