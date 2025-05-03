import { isMicroQRVersion, MicroQRVersion, QRVersion, SPECS, Version } from "./specs";

export const FUNCTION_PATTERN = 2;
export const METADATA_AREA = 4;

export function fillFunctionPatterns(
  mat: Uint8Array,
  version: Version,
): void {
  const spec = SPECS[version];
  const { width } = spec;
  const height = width;
  if (mat.length !== width * height) {
    throw new RangeError(`Invalid matrix size: ${mat.length}, expected ${width * height}`);
  }
  if (isMicroQRVersion(version)) {
    // The finder pattern + separator
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const parity = finderParity(x, y);
        mat[y * width + x] = FUNCTION_PATTERN + parity;
      }
    }
    // Timing patterns
    for (let x = 8; x < width; x++) {
      mat[0 * width + x] = FUNCTION_PATTERN + ((x & 1) ^ 1);
    }
    for (let y = 8; y < height; y++) {
      mat[y * width + 0] = FUNCTION_PATTERN + ((y & 1) ^ 1);
    }
    // Format information area
    for (let x = 1; x < 9; x++) {
      mat[8 * width + x] = METADATA_AREA;
    }
    for (let y = 1; y < 9; y++) {
      mat[y * width + 8] = METADATA_AREA;
    }
  } else {
    // The finder pattern + separator
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const parity = finderParity(x, y);
        mat[y * width + x] = FUNCTION_PATTERN + parity;
      }
    }
    for (let y = 0; y < 8; y++) {
      for (let x = width - 8; x < width; x++) {
        const parity = finderParity(x - (width - 7), y);
        mat[y * width + x] = FUNCTION_PATTERN + parity;
      }
    }
    for (let y = height - 8; y < height; y++) {
      for (let x = 0; x < 8; x++) {
        const parity = finderParity(x, y - (height - 7));
        mat[y * width + x] = FUNCTION_PATTERN + parity;
      }
    }
    // Timing patterns
    for (let x = 8; x < width - 8; x++) {
      mat[6 * width + x] = FUNCTION_PATTERN + ((x & 1) ^ 1);
    }
    for (let y = 8; y < height - 8; y++) {
      mat[y * width + 6] = FUNCTION_PATTERN + ((y & 1) ^ 1);
    }
    // Alignment patterns
    const lastAlignmentPatternPos = spec.alignmentPatternPositions[spec.alignmentPatternPositions.length - 1];
    for (const y0 of spec.alignmentPatternPositions) {
      for (const x0 of spec.alignmentPatternPositions) {
        if (
          (x0 === 6 && y0 === 6) ||
          (x0 === lastAlignmentPatternPos && y0 === 6) ||
          (x0 === 6 && y0 === lastAlignmentPatternPos)
        ) {
          continue;
        }
        for (let y = y0 - 2; y <= y0 + 2; y++) {
          for (let x = x0 - 2; x <= x0 + 2; x++) {
            const parity = alignmentParity(x - x0, y - y0);
            mat[y * width + x] = FUNCTION_PATTERN + parity;
          }
        }
      }
    }
    // Format information area
    for (let x = 0; x < 9; x++) {
      if (x !== 6) {
        mat[8 * width + x] = METADATA_AREA;
      }
    }
    for (let x = width - 8; x < width; x++) {
      mat[8 * width + x] = METADATA_AREA;
    }
    for (let y = 0; y < 9; y++) {
      if (y !== 6) {
        mat[y * width + 8] = METADATA_AREA;
      }
    }
    for (let y = height - 8; y < height; y++) {
      mat[y * width + 8] = METADATA_AREA;
    }
    if (spec.versionInfoSize) {
      // Version information area
      for (let y = 0; y < 6; y++) {
        for (let x = width - 11; x < width - 8; x++) {
          mat[y * width + x] = METADATA_AREA;
        }
      }
      for (let y = height - 11; y < height - 8; y++) {
        for (let x = 0; x < 6; x++) {
          mat[y * width + x] = METADATA_AREA;
        }
      }
    }
  }
}

function finderParity(x: number, y: number): number {
  const parity =
    Number(x >= 0 && x < 7 && y >= 0 && y < 7) +
    Number(x >= 1 && x < 6 && y >= 1 && y < 6) +
    Number(x >= 2 && x < 5 && y >= 2 && y < 5);
  return parity & 1;
}
function alignmentParity(x: number, y: number): number {
  const parity =
    1 +
    Number(x >= -1 && x <= 1 && y >= -1 && y <= 1) +
    Number(x === 0 && y === 0);
  return parity & 1;
}

export function bitPositions(version: Version): IterableIterator<[number, number]> {
  if (isMicroQRVersion(version)) {
    return microQrBitPositions(version);
  } else {
    return qrBitPositions(version);
  }
}

function* microQrBitPositions(version: MicroQRVersion): IterableIterator<[number, number]> {
  const versionNumber = Number(version.slice(1));
  for (let x = 7 + versionNumber * 2; x >= 1; x -= 2) {
    const minY = x >= 9 ? 1 : 9;
    const isDescending = (x + versionNumber * 2) % 4 === 1;
    if (isDescending) {
      for (let y = minY; y < 9 + versionNumber * 2; y++) {
        yield [x + 1, y];
        yield [x, y];
      }
    } else {
      for (let y = 9 + versionNumber * 2 - 1; y >= minY; y--) {
        yield [x + 1, y];
        yield [x, y];
      }
    }
  }
}

function* qrBitPositions(version: QRVersion): IterableIterator<[number, number]> {
  const { width, versionInfoSize, alignmentPatternPositions } = SPECS[version];
  const numFatColumns = version * 2 + 8;
  let currentXAlignmentIndex = alignmentPatternPositions.length - 1;
  for (let fatCol = numFatColumns - 1; fatCol >= 0; fatCol--) {
    // The column consists of x = xBase line and x = xBase + 1 line.
    // Here the computation skips x = 6 (which contains the vertical timing pattern)
    const xBase = fatCol * 2 + Number(fatCol >= 3);
    // Ignore upper finder patterns, separators,
    // format information, and a part of version information.
    const minY =
      fatCol < 4 || fatCol >= numFatColumns - 4
      ? 9
      : fatCol >= numFatColumns - 5 && versionInfoSize
      ? 7
      : 0;
    // Ignore lower-left finder pattern, separators, and version information.
    const maxY =
      fatCol < 3 && versionInfoSize
      ? width - 11
      : fatCol < 4
      ? width - 8
      : width;

    if (currentXAlignmentIndex > 0 && xBase + 4 <= alignmentPatternPositions[currentXAlignmentIndex]) {
      --currentXAlignmentIndex;
    }
    const alignmentXStart = currentXAlignmentIndex >= 0 ? alignmentPatternPositions[currentXAlignmentIndex] - 2 : -5;
    const alignmentXEnd = alignmentXStart + 5;
    const hasAlignmentX0 = xBase >= alignmentXStart && xBase < alignmentXEnd;
    const hasAlignmentX1 = xBase + 1 >= alignmentXStart && xBase + 1 < alignmentXEnd;
    const hasAlignmentX = hasAlignmentX0 || hasAlignmentX1;
    // Ignore top-right and top-left alignment patterns
    const minYAlignmentIndex =
      currentXAlignmentIndex === 0 || currentXAlignmentIndex === alignmentPatternPositions.length - 1
      ? 1
      : 0;
    // Ignore bottom-right alignment patterns
    const maxYAlignmentIndex =
      currentXAlignmentIndex === 0
      ? alignmentPatternPositions.length - 1
      : alignmentPatternPositions.length;
    // The remaining version info part that is not covered by minY/maxY definition.
    // It always suppresses baseX + 1 position and not baseX + 0 position.
    const hasVersionInfo = !!versionInfoSize && fatCol === numFatColumns - 6;
    const descending = fatCol % 2 === 0;
    if (descending) {
      let currentYAlignmentIndex = minYAlignmentIndex;
      for (let y = minY; y < maxY; y++) {
        if (y === 6) {
          // Skip the horizontal timing pattern.
          continue;
        }
        if (
          hasAlignmentX &&
          currentYAlignmentIndex + 1 < maxYAlignmentIndex &&
          y >= alignmentPatternPositions[currentYAlignmentIndex] + 3
        ) {
          currentYAlignmentIndex++;
        }
        const alignmentYStart = currentYAlignmentIndex < maxYAlignmentIndex ? alignmentPatternPositions[currentYAlignmentIndex] - 2 : -5;
        const alignmentYEnd = alignmentYStart + 5;
        const hasAlignmentY = y >= alignmentYStart && y < alignmentYEnd;
        if (!(hasAlignmentY && hasAlignmentX1) && !(hasVersionInfo && y < 6)) {
          yield [xBase + 1, y];
        }
        if (!(hasAlignmentY && hasAlignmentX0)) {
          yield [xBase, y];
        }
      }
    } else {
      let currentYAlignmentIndex = maxYAlignmentIndex - 1;
      for (let y = maxY - 1; y >= minY; y--) {
        if (y === 6) {
          // Skip the horizontal timing pattern.
          continue;
        }
        if (
          hasAlignmentX &&
          currentYAlignmentIndex > minYAlignmentIndex &&
          y + 4 < alignmentPatternPositions[currentYAlignmentIndex]
        ) {
          currentYAlignmentIndex--;
        }
        const alignmentYStart = currentYAlignmentIndex >= minYAlignmentIndex ? alignmentPatternPositions[currentYAlignmentIndex] - 2 : -5;
        const alignmentYEnd = alignmentYStart + 5;
        const hasAlignmentY = y >= alignmentYStart && y < alignmentYEnd;
        if (!(hasAlignmentY && hasAlignmentX1) && !(hasVersionInfo && y < 6)) {
          yield [xBase + 1, y];
        }
        if (!(hasAlignmentY && hasAlignmentX0)) {
          yield [xBase, y];
        }
      }
    }
  }
}
