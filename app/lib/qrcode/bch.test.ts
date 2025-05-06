import { expect } from "vitest";
import { test } from "@fast-check/vitest";
import { decodeBCH5, decodeBCH6, encodeBCH5, encodeBCH6 } from "./bch";
import { fc } from "@fast-check/vitest";

test("it matches Table C.1", () => {
  const qrMask = 0b101010000010010;
  const microQrMask = 0b100010001000101;
  type Row = [
    dataBits: number,
    eccBits: number,
    qrMaskedBitsBinary: number,
    qrMaskedBitsHexadecimal: number,
    microQrMaskedBitsBinary: number,
    microQrMaskedBitsHexadecimal: number,
  ];
  const actual: Row[] = Array.from({ length: 32 }, (_, input) => {
    const bch5 = encodeBCH5(input);
    return [
      input,
      bch5 & 1023,
      bch5 ^ qrMask,
      bch5 ^ qrMask,
      bch5 ^ microQrMask,
      bch5 ^ microQrMask,
    ];
  });
  const expected: Row[] = [
    [0b00000, 0b0000000000, 0b101010000010010, 0x5412, 0b100010001000101, 0x4445],
    [0b00001, 0b0100110111, 0b101000100100101, 0x5125, 0b100000101110010, 0x4172],
    [0b00010, 0b1001101110, 0b101111001111100, 0x5E7C, 0b100111000101011, 0x4E2B],
    [0b00011, 0b1101011001, 0b101101101001011, 0x5B4B, 0b100101100011100, 0x4B1C],
    [0b00100, 0b0111101011, 0b100010111111001, 0x45F9, 0b101010110101110, 0x55AE],
    [0b00101, 0b0011011100, 0b100000011001110, 0x40CE, 0b101000010011001, 0x5099],
    [0b00110, 0b1110000101, 0b100111110010111, 0x4F97, 0b101111111000000, 0x5FC0],
    [0b00111, 0b1010110010, 0b100101010100000, 0x4AA0, 0b101101011110111, 0x5AF7],
    [0b01000, 0b1111010110, 0b111011111000100, 0x77C4, 0b110011110010011, 0x6793],
    [0b01001, 0b1011100001, 0b111001011110011, 0x72F3, 0b110001010100100, 0x62A4],
    [0b01010, 0b0110111000, 0b111110110101010, 0x7DAA, 0b110110111111101, 0x6DFD],
    [0b01011, 0b0010001111, 0b111100010011101, 0x789D, 0b110100011001010, 0x68CA],
    [0b01100, 0b1000111101, 0b110011000101111, 0x662F, 0b111011001111000, 0x7678],
    [0b01101, 0b1100001010, 0b110001100011000, 0x6318, 0b111001101001111, 0x734F],
    [0b01110, 0b0001010011, 0b110110001000001, 0x6C41, 0b111110000010110, 0x7C16],
    [0b01111, 0b0101100100, 0b110100101110110, 0x6976, 0b111100100100001, 0x7921],
    [0b10000, 0b1010011011, 0b001011010001001, 0x1689, 0b000011011011110, 0x06DE],
    [0b10001, 0b1110101100, 0b001001110111110, 0x13BE, 0b000001111101001, 0x03E9],
    [0b10010, 0b0011110101, 0b001110011100111, 0x1CE7, 0b000110010110000, 0x0CB0],
    [0b10011, 0b0111000010, 0b001100111010000, 0x19D0, 0b000100110000111, 0x0987],
    [0b10100, 0b1101110000, 0b000011101100010, 0x0762, 0b001011100110101, 0x1735],
    [0b10101, 0b1001000111, 0b000001001010101, 0x0255, 0b001001000000010, 0x1202],
    [0b10110, 0b0100011110, 0b000110100001100, 0x0D0C, 0b001110101011011, 0x1D5B],
    [0b10111, 0b0000101001, 0b000100000111011, 0x083B, 0b001100001101100, 0x186C],
    [0b11000, 0b0101001101, 0b011010101011111, 0x355F, 0b010010100001000, 0x2508],
    [0b11001, 0b0001111010, 0b011000001101000, 0x3068, 0b010000000111111, 0x203F],
    [0b11010, 0b1100100011, 0b011111100110001, 0x3F31, 0b010111101100110, 0x2F66],
    [0b11011, 0b1000010100, 0b011101000000110, 0x3A06, 0b010101001010001, 0x2A51],
    [0b11100, 0b0010100110, 0b010010010110100, 0x24B4, 0b011010011100011, 0x34E3],
    [0b11101, 0b0110010001, 0b010000110000011, 0x2183, 0b011000111010100, 0x31D4],
    [0b11110, 0b1011001000, 0b010111011011010, 0x2EDA, 0b011111010001101, 0x3E8D],
    [0b11111, 0b1111111111, 0b010101111101101, 0x2BED, 0b011101110111010, 0x3BBA],
  ];
  expect(actual).toEqual(expected);
});

test("it matches Table D.1", () => {
  type Row = [
    dataBits: number,
    outputBinary: number,
    outputHexadecimal: number,
  ];
  const versions = [
    7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  ];
  const actual: Row[] = versions.map((input) => {
    const bch6 = encodeBCH6(input);
    return [
      input,
      bch6,
      bch6,
    ];
  });
  const expected: Row[] = [
    [ 7, 0b000111110010010100, 0x07C94],
    [ 8, 0b001000010110111100, 0x085BC],
    [ 9, 0b001001101010011001, 0x09A99],
    [10, 0b001010010011010011, 0x0A4D3],
    [11, 0b001011101111110110, 0x0BBF6],
    [12, 0b001100011101100010, 0x0C762],
    [13, 0b001101100001000111, 0x0D847],
    [14, 0b001110011000001101, 0x0E60D],
    [15, 0b001111100100101000, 0x0F928],
    [16, 0b010000101101111000, 0x10B78],
    [17, 0b010001010001011101, 0x1145D],
    [18, 0b010010101000010111, 0x12A17],
    [19, 0b010011010100110010, 0x13532],
    [20, 0b010100100110100110, 0x149A6],
    [21, 0b010101011010000011, 0x15683],
    [22, 0b010110100011001001, 0x168C9],
    [23, 0b010111011111101100, 0x177EC],
    [24, 0b011000111011000100, 0x18EC4],
    [25, 0b011001000111100001, 0x191E1],
    [26, 0b011010111110101011, 0x1AFAB],
    [27, 0b011011000010001110, 0x1B08E],
    [28, 0b011100110000011010, 0x1CC1A],
    [29, 0b011101001100111111, 0x1D33F],
    [30, 0b011110110101110101, 0x1ED75],
    [31, 0b011111001001010000, 0x1F250],
    [32, 0b100000100111010101, 0x209D5],
    [33, 0b100001011011110000, 0x216F0],
    [34, 0b100010100010111010, 0x228BA],
    [35, 0b100011011110011111, 0x2379F],
    [36, 0b100100101100001011, 0x24B0B],
    [37, 0b100101010000101110, 0x2542E],
    [38, 0b100110101001100100, 0x26A64],
    [39, 0b100111010101000001, 0x27541],
    [40, 0b101000110001101001, 0x28C69],
  ];
  expect(actual).toEqual(expected);
});

function natOfBits(length: number, maxPopcount: number): fc.Arbitrary<number> {
  const counts: number[][] = Array.from({ length: length - maxPopcount + 1 }, () =>
    Array.from({ length: maxPopcount + 1 }, () => 0)
  );
  for (let i = 0; i <= length - maxPopcount; i++) {
    for (let j = 0; j <= maxPopcount; j++) {
      if (j === 0) {
        counts[i][j] = 1;
      } else if (i === 0) {
        counts[i][j] = 1 << j;
      } else {
        counts[i][j] = counts[i - 1][j] + counts[i][j - 1];
      }
    }
  }
  return fc.nat({ max: counts[length - maxPopcount][maxPopcount] - 1 }).map((num) => {
    let result = 0;
    let i = length - maxPopcount;
    let j = maxPopcount;
    while (j > 0) {
      if (num >= counts[i][j - 1]) {
        num -= counts[i][j - 1];
        result |= 1 << (i + j - 1);
        j--;
      } else {
        i--;
        j = Math.min(i, j);
      }
    }
    return result;
  });
}

test.prop([fc.nat({ max: 31 }), natOfBits(15, 3)])("BCH5 correct 3 unknown bits", (value, errors) => {
  const encoded = encodeBCH5(value);
  expect(decodeBCH5(encoded ^ errors, 0)).toBe(value);
});

test.prop([fc.nat({ max: 31 }), natOfBits(15, 2), natOfBits(15, 2)])("BCH5 correct 2 unknown bits + 2 known bits", (value, errors, knownErrors) => {
  const encoded = encodeBCH5(value);
  expect(decodeBCH5(encoded ^ (errors | knownErrors), knownErrors)).toBe(value);
});

test.prop([fc.nat({ max: 31 }), natOfBits(15, 1), natOfBits(15, 4)])("BCH5 correct 1 unknown bits + 4 known bits", (value, errors, knownErrors) => {
  const encoded = encodeBCH5(value);
  expect(decodeBCH5(encoded ^ (errors | knownErrors), knownErrors)).toBe(value);
});

test.prop([fc.nat({ max: 31 }), natOfBits(15, 0), natOfBits(15, 6)])("BCH5 correct 0 unknown bits + 6 known bits", (value, errors, knownErrors) => {
  const encoded = encodeBCH5(value);
  expect(decodeBCH5(encoded ^ (errors | knownErrors), knownErrors)).toBe(value);
});

test.prop([fc.integer({ min: 7, max: 40 }), natOfBits(18, 3), natOfBits(18, 1)])("BCH6 correct 3 unknown bits + 1 known bits", (value, errors) => {
  const encoded = encodeBCH6(value);
  expect(decodeBCH6(encoded ^ errors, 0)).toBe(value);
});

test.prop([fc.integer({ min: 7, max: 40 }), natOfBits(18, 2), natOfBits(18, 3)])("BCH6 correct 2 unknown bits + 3 known bits", (value, errors) => {
  const encoded = encodeBCH6(value);
  expect(decodeBCH6(encoded ^ errors, 0)).toBe(value);
});

test.prop([fc.integer({ min: 7, max: 40 }), natOfBits(18, 1), natOfBits(18, 5)])("BCH6 correct 1 unknown bits + 5 known bits", (value, errors) => {
  const encoded = encodeBCH6(value);
  expect(decodeBCH6(encoded ^ errors, 0)).toBe(value);
});

test.prop([fc.integer({ min: 7, max: 40 }), natOfBits(18, 0), natOfBits(18, 7)])("BCH6 correct 0 unknown bits + 7 known bits", (value, errors) => {
  const encoded = encodeBCH6(value);
  expect(decodeBCH6(encoded ^ errors, 0)).toBe(value);
});
