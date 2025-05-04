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

export function applyOptimalMask(
  mat: Uint8Array,
  version: Version
): number {
  const numMasks = isMicroQRVersion(version) ? 4 : 8;
  const tmpMat = mat.slice();
  applyMask(tmpMat, version, 0);
  let optimalMask = 0;
  let optimalScore = evaluateMask(tmpMat, version);
  console.log("mask =", 0, ", score =", optimalScore);
  for (let mask = 1; mask < numMasks; mask++) {
    tmpMat.set(mat);
    applyMask(tmpMat, version, mask);
    const score = evaluateMask(tmpMat, version);
    console.log("mask =", mask, ", score =", score);
    if (score > optimalScore) {
      optimalMask = mask;
      optimalScore = score;
    }
  }
  applyMask(mat, version, optimalMask);
  return optimalMask;
}

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

export function evaluateMaskDetail(
  mat: Uint8Array,
  version: Version
): number[] {
  if (isMicroQRVersion(version)) {
    return [evaluateMicroQRMask(mat, version)];
  } else {
    return [
      evaluateQRMask(mat, version),
      0 - evaluateSegmentPenalty(mat, version),
      0 - evaluate2x2BlockPenalty(mat, version),
      0 - evaluatePseudoFinderPenalty(mat, version),
      0 - evaluateQRNonUniformityPenalty(mat, version),
    ];
  }
}

function evaluateQRMask(
  mat: Uint8Array,
  version: Version
): number {
  const penaltyA = evaluateSegmentPenalty(mat, version);
  const penaltyB = evaluate2x2BlockPenalty(mat, version);
  const penaltyC = evaluatePseudoFinderPenalty(mat, version);
  const penaltyD = evaluateQRNonUniformityPenalty(mat, version);

  // Negate penalty so that the larger the value, the better the mask
  return 0 - (penaltyA + penaltyB + penaltyC + penaltyD);
}

function evaluateSegmentPenalty(
  mat: Uint8Array,
  version: Version
): number {
  const N1 = 3;

  const { width } = SPECS[version];
  const height = width;

  let penalty = 0;
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

  // The following segments always induce a penalty:
  // - Top-left finder pattern (total penalty 32):
  //   - ( 0, 0) - ( 6, 0), horizontal, dark , penalty 5
  //   - ( 1, 1) - ( 5, 1), horizontal, light, penalty 3
  //   - ( 1, 5) - ( 5, 5), horizontal, light, penalty 3
  //   - ( 0, 6) - ( 6, 6), horizontal, dark , penalty 5
  //   - ( 0, 0) - ( 0, 6), vertical  , dark , penalty 5
  //   - ( 1, 1) - ( 1, 5), vertical  , light, penalty 3
  //   - ( 5, 1) - ( 5, 5), vertical  , light, penalty 3
  //   - ( 6, 0) - ( 6, 6), vertical  , dark , penalty 5
  // - Top-left separator + format information (total penalty 22):
  //   - ( 0, 7) - ( 8, 7), horizontal, light, penalty 7
  //   - ( 0, 8) - ( 5, 8), horizontal, light, penalty 4
  //   - ( 7, 0) - ( 7, 8), vertical  , light, penalty 7
  //   - ( 8, 0) - ( 8, 5), vertical  , light, penalty 4
  // - Top-right finder pattern (total penalty 32):
  //   - (-7, 0) - (-1, 0), horizontal, dark , penalty 5
  //   - (-6, 1) - (-2, 1), horizontal, light, penalty 3
  //   - (-6, 5) - (-2, 5), horizontal, light, penalty 3
  //   - (-7, 6) - (-1, 6), horizontal, dark , penalty 5
  //   - (-7, 0) - (-7, 6), vertical  , dark , penalty 5
  //   - (-6, 1) - (-6, 5), vertical  , light, penalty 3
  //   - (-2, 1) - (-2, 5), vertical  , light, penalty 3
  //   - (-1, 0) - (-1, 6), vertical  , dark , penalty 5
  // - Top-right separator + format information (total penalty 19):
  //   - (-8, 7) - (-1, 7), horizontal, light, penalty 6
  //   - (-8, 8) - (-1, 8), horizontal, light, penalty 6
  //   - (-8, 0) - (-8, 8), vertical  , light, penalty 7
  // - Bottom-left finder pattern (total penalty 32):
  //   - (0, -7) - (0, -1), horizontal, dark , penalty 5
  //   - (1, -6) - (1, -2), horizontal, light, penalty 3
  //   - (1, -6) - (1, -2), horizontal, light, penalty 3
  //   - (0, -7) - (6, -7), horizontal, dark , penalty 5
  //   - (0, -7) - (0, -1), vertical  , dark , penalty 5
  //   - (1, -6) - (1, -2), vertical  , light, penalty 3
  //   - (5, -6) - (5, -2), vertical  , light, penalty 3
  //   - (6, -7) - (6, -1), vertical  , dark , penalty 5
  // - Bottom-left separator + format information (total penalty 19):
  //   - (0, -8) - (8, -8), horizontal, light, penalty 7
  //   - (7, -8) - (7, -1), horizontal, light, penalty 6
  //   - (8, -8) - (8, -1), vertical  , light, penalty 6
  return penalty - 156;
}

function evaluate2x2BlockPenalty(
  mat: Uint8Array,
  version: Version
): number {
  const N2 = 3;

  const { width } = SPECS[version];
  const height = width;

  let num2x2Blocks = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const value = mat[y * width + x] & 1;
      if (
        value === (mat[y * width + x + 1] & 1) &&
        value === (mat[(y + 1) * width + x] & 1) &&
        value === (mat[(y + 1) * width + x + 1] & 1)
      ) {
        num2x2Blocks++;
      }
    }
  }

  // The following segments always induce a penalty (total count 37):
  // - Top-left finder pattern:
  //   - Rectangle (2, 2) - (4, 4), dark, count 4
  // - Top-left separator + format information (total count 11):
  //   - Rectangle (7, 0) - (8, 5), light, count 5
  //   - Rectangle (0, 7) - (5, 8), light, count 5
  //   - Rectangle (7, 7) - (8, 8), light, count 1
  // - Top-right finder pattern:
  //   - Rectangle (-5, 2) - (-3, 4), dark, count 4
  // - Top-right separator + format information:
  //   - Rectangle (-8, 7) - (-1, 8), light, count 7
  // - Bottom-left finder pattern:
  //   - Rectangle (2, -5) - (4, -3), dark, count 4
  // - Bottom-left separator + format information:
  //   - Rectangle (7, -8) - (8, -1), light, count 7
  return (num2x2Blocks - 37) * N2;
}

function evaluatePseudoFinderPenalty(
  mat: Uint8Array,
  version: Version
): number {
  const N3 = 40;

  const { width } = SPECS[version];
  const height = width;

  let hasPseudoFinder = false;
  for (let y = 0; y < height; y++) {
    // Bits from the left to x + 11
    let bitsLA11 = 0;
    for (let x = -11; x <= width - 7; x++) {
      if (x >= 0) {
        if (
          ((bitsLA11 & 0b111111111110000) === 0b000010111010000 && x >= 4) ||
          ((bitsLA11 & 0b000011111111111) === 0b000010111010000 && x <= width - 11)
        ) {
          // penalty += N3;
          hasPseudoFinder = true;
        }
      }
      const value = x + 11 < width ? mat[y * width + (x + 11)] & 1 : 0;
      bitsLA11 = (bitsLA11 << 1) | value;
    }
  }
  for (let x = 0; x < width; x++) {
    // Bits from the left to x + 11
    let bitsLA11 = 0;
    for (let y = -11; y <= height - 7; y++) {
      if (y >= 0) {
        if (
          ((bitsLA11 & 0b111111111110000) === 0b000010111010000 && y >= 4) ||
          ((bitsLA11 & 0b000011111111111) === 0b000010111010000 && y <= height - 11)
        ) {
          // penalty += N3;
          hasPseudoFinder = true;
        }
      }
      const value = y + 11 < height ? mat[(y + 11) * width + x] & 1 : 0;
      bitsLA11 = (bitsLA11 << 1) | value;
    }
  }
  return hasPseudoFinder ? N3 : 0;
}

function evaluateQRNonUniformityPenalty(
  mat: Uint8Array,
  version: Version
): number {
  const N4 = 10;

  const { width } = SPECS[version];
  const height = width;
  let bitCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = mat[y * width + x] & 1;
      bitCount += value;
    }
  }
  const ratio = bitCount / (width * height);
  const nonUniformity = Math.floor(Math.abs(ratio - 0.5) * 20);
  return N4 * nonUniformity;
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
