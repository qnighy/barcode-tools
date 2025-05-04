import { isMicroQRVersion, SPECS, Version } from "./specs";

type MaskFunction = (i: number, j: number) => boolean;

const MICRO_QR_MASKS: MaskFunction[] = [
  (i   ) => i % 2 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => (i * j % 2 + i * j % 3) % 2 === 0,
  (i, j) => ((i + j) % 2 + i * j % 3) % 2 === 0,
];

const QR_MASKS: MaskFunction[] = [
  (i, j) => (i + j) % 2 === 0,
  (i   ) => i % 2 === 0,
  (i, j) => j % 3 === 0,
  (i, j) => (i + j) % 3 === 0,
  (i, j) => (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0,
  (i, j) => i * j % 2 + i * j % 3 === 0,
  (i, j) => (i * j % 2 + i * j % 3) % 2 === 0,
  (i, j) => ((i + j) % 2 + i * j % 3) % 2 === 0,
];

export function applyMask(
  mat: Uint8Array,
  version: Version,
  mask: number
): void {
  const { width } = SPECS[version];
  const height = width;
  const maskFunction = isMicroQRVersion(version) ? MICRO_QR_MASKS[mask] : QR_MASKS[mask];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = mat[y * width + x];
      mat[y * width + x] = (value & -2) ? value : value ^ Number(maskFunction(y, x));
    }
  }
}

/**
 * The larger the value, the better the mask.
 */
export function evaluateMask(
  mat: Uint8Array,
  version: Version
): number {
  if (isMicroQRVersion(version)) {
    return evaluateMicroQRMask(mat, version);
  } else {
    return evaluateQRMask(mat, version);
  }
}

function evaluateQRMask(
  mat: Uint8Array,
  version: Version
): number {
  const N1 = 3;
  const N2 = 3;
  const N3 = 40;
  const N4 = 10;

  const { width } = SPECS[version];
  const height = width;
  let penalty = 0;

  // Segment penalty
  for (let y = 0; y < height; y++) {
    let count = 0;
    let lastValue = -1;
    for (let x = 0; x < width; x++) {
      const value = mat[y * width + x] & 1;
      if (value === lastValue) {
        count++;
      } else {
        penalty += count >= 5 ? N1 + (count - 5) : 0;
        count = 1;
        lastValue = value;
      }
    }
    penalty += count >= 5 ? N1 + (count - 5) : 0;
  }
  for (let x = 0; x < width; x++) {
    let count = 0;
    let lastValue = -1;
    for (let y = 0; y < height; y++) {
      const value = mat[y * width + x] & 1;
      if (value === lastValue) {
        count++;
      } else {
        penalty += count >= 5 ? N1 + (count - 5) : 0;
        count = 1;
        lastValue = value;
      }
    }
    penalty += count >= 5 ? N1 + (count - 5) : 0;
  }

  // 2x2 block penalty
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const value = mat[y * width + x] & 1;
      if (
        value === (mat[y * width + x + 1] & 1) &&
        value === (mat[(y + 1) * width + x] & 1) &&
        value === (mat[(y + 1) * width + x + 1] & 1)
      ) {
        penalty += N2;
      }
    }
  }

  // Pseudo finders penalty
  for (let y = 0; y < height; y++) {
    let bits = 0;
    for (let x = 0; x < width + 4; x++) {
      const value = x < width ? mat[y * width + x] & 1 : 0;
      bits = (bits << 1) | value;
      if (
        (bits & 0b111111111110000) === 0b000010111010000 ||
        (bits & 0b000011111111111) === 0b000010111010000
      ) {
        penalty += N3;
      }
    }
  }
  for (let x = 0; x < width; x++) {
    let bits = 0;
    for (let y = 0; y < height + 4; y++) {
      const value = y < height ? mat[y * width + x] & 1 : 0;
      bits = (bits << 1) | value;
      if (
        (bits & 0b111111111110000) === 0b000010111010000 ||
        (bits & 0b000011111111111) === 0b000010111010000
      ) {
        penalty += N3;
      }
    }
  }
  // Discount the real finder patterns
  penalty -= 720;

  // Non-uniformity penalty
  let bitCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = mat[y * width + x] & 1;
      bitCount += value;
    }
  }
  const ratio = bitCount / (width * height);
  const nonUniformity = Math.floor(Math.abs(ratio - 0.5) * 20);
  penalty += N4 * nonUniformity;

  // Negate penalty so that the larger the value, the better the mask
  return -penalty;
}

function evaluateMicroQRMask(
  mat: Uint8Array,
  version: Version
): number {
  const { width } = SPECS[version];
  const height = width;

  let vCount = 0;
  // Starting from 1 to skip the timing pattern
  for (let y = 1; y < height; y++) {
    const value = mat[y * width + (width - 1)] & 1;
    vCount += value;
  }
  let hCount = 0;
  // Starting from 1 to skip the timing pattern
  for (let x = 1; x < width; x++) {
    const value = mat[(height - 1) * width + x] & 1;
    hCount += value;
  }

  const largeCount = Math.max(vCount, hCount);
  const smallCount = Math.min(vCount, hCount);
  return largeCount + smallCount * 16;
}
