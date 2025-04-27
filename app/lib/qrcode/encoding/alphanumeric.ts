import { BitArray } from "../bit-array";
import { COST_DENOMINATOR } from "./cost";

export function* findAlphanumerics(text: string): IterableIterator<[number, number]> {
  for (const match of text.matchAll(/[0-9A-Z $%*+\-.\/:]+/g)) {
    yield [match.index, match.index + match[0].length];
  }
}

export const ALPHANUMERIC_COST: number = COST_DENOMINATOR * 11 / 2;

export function encodeAlphanumerics(text: string, buf: BitArray): void {
  for (let i = 0; i < text.length; i += 2) {
    const charLength = Math.min(2, text.length - i);
    const bitLength = [0, 6, 11][charLength];
    const packedValue =
      charLength === 2
      ? alphanumericIndex(text.charAt(i)) * 45 +
        alphanumericIndex(text.charAt(i + 1))
      : alphanumericIndex(text.charAt(i));
    buf.pushNumber(packedValue, bitLength);
  }
}

const symbolEncodingMap: Record<string, number> = {
  " ": 36,
  "$": 37,
  "%": 38,
  "*": 39,
  "+": 40,
  "-": 41,
  ".": 42,
  "/": 43,
  ":": 44,
};
function alphanumericIndex(char: string): number {
  const code = char.charCodeAt(0);
  if (code >= 0x30 && code <= 0x39) {
    // '0' - '9' -> 0 - 9
    return code - 0x30;
  } else if (code >= 0x41 && code <= 0x5A) {
    // 'A' - 'Z' -> 10 - 35
    return code - (0x41 - 10);
  } else {
    return symbolEncodingMap[char];
  }
}
