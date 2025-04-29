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
