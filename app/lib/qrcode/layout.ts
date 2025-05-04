import { isMicroQRVersion, SPECS, Version } from "./specs";

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

export function* bitPositions(mat: Uint8Array, version: Version): IterableIterator<[number, number]> {
  const { width } = SPECS[version];
  for (const [x, y] of rawBitPositions(version)) {
    if (mat[y * width + x] & -2) {
      continue;
    }
    yield [x, y];
  }
}

function* rawBitPositions(version: Version): IterableIterator<[number, number]> {
  const { width } = SPECS[version];
  const height = width;
  const timingPatternX = isMicroQRVersion(version) ? 0 : 6;
  const numColumns = (width - 1) / 2;
  for (let col = numColumns - 1; col >= 0; col--) {
    const x = col * 2 + Number(col >= timingPatternX / 2);
    const isDescending = (numColumns - 1 - col) % 2 > 0;
    if (isDescending) {
      for (let y = 0; y < height; y++) {
        yield [x + 1, y];
        yield [x, y];
      }
    } else {
      for (let y = height - 1; y >= 0; y--) {
        yield [x + 1, y];
        yield [x, y];
      }
    }
  }
}
