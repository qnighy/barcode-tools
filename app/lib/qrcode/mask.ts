import { Bit } from "./bit";
import { BitExtMatrix, NON_DATA_MASK } from "./bit-ext-matrix";
import { pourMetadataBits } from "./layout";
import { ErrorCorrectionLevelOrNone, isMicroQRVersion, SPECS, Version } from "./specs";

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

export function applyAutoMaskAndMetadata(
  mat: BitExtMatrix,
  version: Version,
  errorCorrectionLevel: ErrorCorrectionLevelOrNone
): void {
  const numMasks = isMicroQRVersion(version) ? 4 : 8;
  const tmpMat = mat.clone();
  applyMaskAndMetadata(tmpMat, version, errorCorrectionLevel, 0);
  let optimalMask = 0;
  let optimalScore = evaluateMask(tmpMat, version);
  for (let mask = 1; mask < numMasks; mask++) {
    tmpMat.array.set(mat.array);
    applyMaskAndMetadata(tmpMat, version, errorCorrectionLevel, mask);
    const score = evaluateMask(tmpMat, version);
    if (score > optimalScore) {
      optimalMask = mask;
      optimalScore = score;
    }
  }
  applyMaskAndMetadata(mat, version, errorCorrectionLevel, optimalMask);
}

export function applyMaskAndMetadata(
  mat: BitExtMatrix,
  version: Version,
  errorCorrectionLevel: ErrorCorrectionLevelOrNone,
  mask: number
): void {
  applyMask(mat, version, mask);
  pourMetadataBits(mat, version, errorCorrectionLevel, mask);
}

export function applyMask(
  mat: BitExtMatrix,
  version: Version,
  mask: number
): void {
  const { width, height } = SPECS[version];
  const maskFunction = isMicroQRVersion(version) ? MICRO_QR_MASKS[mask] : QR_MASKS[mask];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = mat.getExtAt(x, y);
      mat.setExtAt(x, y, (value & NON_DATA_MASK) ? value : value ^ Number(maskFunction(y, x)));
    }
  }
}

/**
 * The larger the value, the better the mask.
 */
export function evaluateMask(
  mat: BitExtMatrix,
  version: Version
): number {
  if (isMicroQRVersion(version)) {
    return evaluateMicroQRMask(mat, version);
  } else {
    return evaluateQRMask(mat, version);
  }
}

export function evaluateMaskDetail(
  mat: BitExtMatrix,
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
  mat: BitExtMatrix,
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
  mat: BitExtMatrix,
  version: Version
): number {
  const N1 = 3;

  const { width, height } = SPECS[version];

  let penalty = 0;
  for (let y = 0; y < height; y++) {
    let count = 0;
    let lastValue = -1;
    for (let x = 0; x < width; x++) {
      const value = mat.getAt(x, y);
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
      const value = mat.getAt(x, y);
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

  // Base penalty to discount:
  // - Each finder pattern + separator implies:
  //   - 4 dark segments of length 7 (penalty 5)
  //   - 4 light segments of length 5 (penalty 3)
  //   - 2 light segments of length 8 (penalty 6)
  // - Therefore, each finder pattern + separator implies a penalty of 44.
  // - Total base penalty: 3 * 44 = 132
  return penalty - 132;
}

function evaluate2x2BlockPenalty(
  mat: BitExtMatrix,
  version: Version
): number {
  const N2 = 3;

  const { width, height } = SPECS[version];

  let num2x2Blocks = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const value = mat.getAt(x, y);
      if (
        value === mat.getAt(x + 1, y) &&
        value === mat.getAt(x, y + 1) &&
        value === mat.getAt(x + 1, y + 1)
      ) {
        num2x2Blocks++;
      }
    }
  }

  // Base penalty to discount:
  // - Each finder pattern has a 3x3 area of dark segments,
  //   which contains 4 2x2 blocks.
  // - Each finder pattern contributes 12 penalty points.
  // - It amounts to 36 penalty points.
  return (num2x2Blocks - 12) * N2;
}

function evaluatePseudoFinderPenalty(
  mat: BitExtMatrix,
  version: Version
): number {
  const N3 = 40;

  const { width, height } = SPECS[version];

  // There are always 18 pseudo finders that originates from the real finder.
  let numPseudoFinders = -18;

  for (let y = 0; y < height; y++) {
    let rl6 = 10000;
    let rl5 = 10000;
    let rl4 = 10000;
    let rl3 = 10000;
    let rl2 = 10000;
    let rl1 = 10000;
    let rl0 = 10000;
    // the value of rl6, rl4, rl2, rl0 segments
    let lastValue: Bit = 0;
    for (let x = 0; x <= width + 1; x++) {
      const current: Bit = x < width ? mat.getAt(x, y) : (lastValue ^ 1) as Bit;
      if (current !== lastValue) {
        // Check if rl5:rl4:rl3:rl2:rl1 is 1:1:3:1:1 and
        // either rl6 or rl0 is at least 4 times rl1
        if (
          lastValue === 0 &&
          rl5 === rl1 &&
          rl4 === rl1 &&
          rl3 === rl1 * 3 &&
          rl2 === rl1 &&
          (rl6 >= rl1 * 4 || rl0 >= rl1 * 4)
        ) {
          numPseudoFinders++;
        }

        lastValue = current;
        rl6 = rl5;
        rl5 = rl4;
        rl4 = rl3;
        rl3 = rl2;
        rl2 = rl1;
        rl1 = rl0;
        rl0 = 0;
      }
      rl0 += x < width ? 1 : 10000;
    }
  }
  for (let x = 0; x < width; x++) {
    let rl6 = 10000;
    let rl5 = 10000;
    let rl4 = 10000;
    let rl3 = 10000;
    let rl2 = 10000;
    let rl1 = 10000;
    let rl0 = 10000;
    // the value of rl6, rl4, rl2, rl0 segments
    let lastValue: Bit = 0;
    for (let y = 0; y <= height + 1; y++) {
      const current: Bit = y < height ? mat.getAt(x, y) : (lastValue ^ 1) as Bit;
      if (current !== lastValue) {
        // Check if rl5:rl4:rl3:rl2:rl1 is 1:1:3:1:1 and
        // either rl6 or rl0 is at least 4 times rl1
        if (
          lastValue === 0 &&
          rl5 === rl1 &&
          rl4 === rl1 &&
          rl3 === rl1 * 3 &&
          rl2 === rl1 &&
          (rl6 >= rl1 * 4 || rl0 >= rl1 * 4)
        ) {
          numPseudoFinders++;
        }

        lastValue = current;
        rl6 = rl5;
        rl5 = rl4;
        rl4 = rl3;
        rl3 = rl2;
        rl2 = rl1;
        rl1 = rl0;
        rl0 = 0;
      }
      rl0 += y < height ? 1 : 10000;
    }
  }
  return N3 * numPseudoFinders;
}

function evaluateQRNonUniformityPenalty(
  mat: BitExtMatrix,
  version: Version
): number {
  const N4 = 10;

  const { width, height } = SPECS[version];
  let bitCount = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = mat.getAt(x, y);
      bitCount += value;
    }
  }
  const ratio = bitCount / (width * height);
  const nonUniformity = Math.floor(Math.abs(ratio - 0.5) * 20);
  return N4 * nonUniformity;
}

function evaluateMicroQRMask(
  mat: BitExtMatrix,
  version: Version
): number {
  const { width, height } = SPECS[version];

  let vCount = 0;
  // Starting from 1 to skip the timing pattern
  for (let y = 1; y < height; y++) {
    const value = mat.getAt(width - 1, y);
    vCount += value;
  }
  let hCount = 0;
  // Starting from 1 to skip the timing pattern
  for (let x = 1; x < width; x++) {
    const value = mat.getAt(x, height - 1);
    hCount += value;
  }

  const largeCount = Math.max(vCount, hCount);
  const smallCount = Math.min(vCount, hCount);
  return largeCount + smallCount * 16;
}
