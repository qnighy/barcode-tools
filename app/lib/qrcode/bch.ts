// x^10 + x^8 + x^5 + x^4 + x^2 + x + 1
const BCH5_DIVISOR = 0b10100110111;

export function encodeBCH5(value: number): number {
  return BCH5_TABLE[value];
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
