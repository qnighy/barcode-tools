import { UncorrectableBlockError } from "./poly";

// x^10 + x^8 + x^5 + x^4 + x^2 + x + 1
const BCH5_DIVISOR = 0b10100110111;

export function encodeBCH5(value: number): number {
  return BCH5_TABLE[value];
}

// Every pair of different codes has at least 7 hamming distance
const BCH5_DISTANCE = 7;
export function decodeBCH5(
  encoded: number,
  erasureMask: number
): number {
  const numErasures = popcount(erasureMask);
  if (numErasures >= BCH5_DISTANCE) {
    throw new UncorrectableBlockError("Too many erasures");
  }

  const maxExtraDistance = Math.floor((BCH5_DISTANCE - numErasures - 1) / 2);
  const mask = ((1 << 15) - 1) ^ erasureMask;

  for (let i = 0; i < BCH5_TABLE.length; i++) {
    const code = BCH5_TABLE[i];
    const extraDistance = popcount((encoded ^ code) & mask);
    if (extraDistance <= maxExtraDistance) {
      return i;
    }
  }
  throw new UncorrectableBlockError("Too many errors");
}

function naiveEncodeBCH5(value: number): number {
  let rem = value << 10;
  for (let i = 4; i >= 0; i--) {
    if (rem & (1 << (i + 10))) {
      rem ^= BCH5_DIVISOR << i;
    }
  }
  return (value << 10) | rem;
}

function generateBCH5Table(): number[] {
  return Array.from({ length: 1 << 5 }, (_, i) => naiveEncodeBCH5(i));
}
const BCH5_TABLE = generateBCH5Table();

// x^12 + x^11 + x^10 + x^9 + x^8 + x^5 + x^2 + 1
const BCH6_DIVISOR = 0b1111100100101;

export function encodeBCH6(value: number): number {
  return BCH6_TABLE[value - BCH6_TABLE_OFFSET];
}

// Every pair of different codes has at least 8 hamming distance
const BCH6_DISTANCE = 8;
export function decodeBCH6(
  encoded: number,
  erasureMask: number
): number {
  const numErasures = popcount(erasureMask);
  if (numErasures >= BCH6_DISTANCE) {
    throw new UncorrectableBlockError("Too many erasures");
  }

  const maxExtraDistance = Math.floor((BCH6_DISTANCE - numErasures - 1) / 2);
  const mask = ((1 << 18) - 1) ^ erasureMask;

  for (let i = 0; i < BCH6_TABLE.length; i++) {
    const code = BCH6_TABLE[i];
    const extraDistance = popcount((encoded ^ code) & mask);
    if (extraDistance <= maxExtraDistance) {
      return i + BCH6_TABLE_OFFSET;
    }
  }
  throw new UncorrectableBlockError("Too many errors");
}

function naiveEncodeBCH6(value: number): number {
  let rem = value << 12;
  for (let i = 5; i >= 0; i--) {
    if (rem & (1 << (i + 12))) {
      rem ^= BCH6_DIVISOR << i;
    }
  }
  return (value << 12) | rem;
}

function generateBCH6Table(): number[] {
  return Array.from({ length: 40 - BCH6_TABLE_OFFSET + 1 }, (_, i) => naiveEncodeBCH6(i + BCH6_TABLE_OFFSET));
}
const BCH6_TABLE_OFFSET = 7;
const BCH6_TABLE = generateBCH6Table();

function popcount(num: number): number {
  num = (num & 0x55555555) + ((num >>> 1) & 0x55555555);
  num = (num & 0x33333333) + ((num >>> 2) & 0x33333333);
  num = (num & 0x0F0F0F0F) + ((num >>> 4) & 0x0F0F0F0F);
  num = (num & 0x00FF00FF) + ((num >>> 8) & 0x00FF00FF);
  num = (num & 0x0000FFFF) + ((num >>> 16) & 0x0000FFFF);
  return num;
}
