import { BitArray } from "../bit-array";
import { COST_DENOMINATOR } from "./cost";

export function* findDigits(text: string): IterableIterator<[number, number]> {
  for (const match of text.matchAll(/[0-9]+/g)) {
    yield [match.index, match.index + match[0].length];
  }
}

export const DIGIT_COST: number = COST_DENOMINATOR * 10 / 3;

export function encodeDigits(text: string, buf: BitArray): void {
  for (let i = 0; i < text.length; i += 3) {
    const charLength = Math.min(3, text.length - i);
    const bitLength = [0, 4, 7, 10][charLength];
    const packedValue = parseInt(text.slice(i, i + 3), 10);
    buf.pushNumber(packedValue, bitLength);
  }
}
