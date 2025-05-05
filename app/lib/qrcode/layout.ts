import { encodeBCH5, encodeBCH6 } from "./bch";
import { BitExtMatrix, FUNCTION_PATTERN_FLAG, METADATA_AREA_FLAG, NON_DATA_MASK } from "./bit-ext-matrix";
import { Bits } from "./bit-writer";
import { ErrorCorrectionLevelOrNone, isMicroQRVersion, MicroQRVersion, QRVersion, SPECS, Version } from "./specs";

export function fillFunctionPatterns(
  mat: BitExtMatrix,
  version: Version,
): void {
  const spec = SPECS[version];
  const { width, height } = spec;
  if (mat.width !== width || mat.height !== height) {
    throw new RangeError(`Invalid matrix size: ${mat.width}x${mat.height}, expected ${width}x${height}`);
  }
  if (isMicroQRVersion(version)) {
    // The finder pattern + separator
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const parity = finderParity(x, y);
        mat.setExtAt(x, y, FUNCTION_PATTERN_FLAG + parity);
      }
    }
    // Timing patterns
    for (let x = 8; x < width; x++) {
      mat.setExtAt(x, 0, FUNCTION_PATTERN_FLAG | ((x & 1) ^ 1));
    }
    for (let y = 8; y < height; y++) {
      mat.setExtAt(0, y, FUNCTION_PATTERN_FLAG | ((y & 1) ^ 1));
    }
    // Format information area
    for (let x = 1; x < 9; x++) {
      mat.setExtAt(x, 8, METADATA_AREA_FLAG);
    }
    for (let y = 1; y < 9; y++) {
      mat.setExtAt(8, y, METADATA_AREA_FLAG);
    }
  } else {
    // The finder pattern + separator
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const parity = finderParity(x, y);
        mat.setExtAt(x, y, FUNCTION_PATTERN_FLAG | parity);
      }
    }
    for (let y = 0; y < 8; y++) {
      for (let x = width - 8; x < width; x++) {
        const parity = finderParity(x - (width - 7), y);
        mat.setExtAt(x, y, FUNCTION_PATTERN_FLAG | parity);
      }
    }
    for (let y = height - 8; y < height; y++) {
      for (let x = 0; x < 8; x++) {
        const parity = finderParity(x, y - (height - 7));
        mat.setExtAt(x, y, FUNCTION_PATTERN_FLAG | parity);
      }
    }
    // Timing patterns
    for (let x = 8; x < width - 8; x++) {
      mat.setExtAt(x, 6, FUNCTION_PATTERN_FLAG | ((x & 1) ^ 1));
    }
    for (let y = 8; y < height - 8; y++) {
      mat.setExtAt(6, y, FUNCTION_PATTERN_FLAG | ((y & 1) ^ 1));
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
            mat.setExtAt(x, y, FUNCTION_PATTERN_FLAG | parity);
          }
        }
      }
    }
    // Format information area
    for (let x = 0; x < 9; x++) {
      if (x !== 6) {
        mat.setExtAt(x, 8, METADATA_AREA_FLAG);
      }
    }
    for (let x = width - 8; x < width; x++) {
      mat.setExtAt(x, 8, METADATA_AREA_FLAG);
    }
    for (let y = 0; y < 9; y++) {
      if (y !== 6) {
        mat.setExtAt(8, y, METADATA_AREA_FLAG);
      }
    }
    for (let y = height - 8; y < height; y++) {
      mat.setExtAt(8, y, METADATA_AREA_FLAG);
    }
    if (spec.versionInfoSize) {
      // Version information area
      for (let y = 0; y < 6; y++) {
        for (let x = width - 11; x < width - 8; x++) {
          mat.setExtAt(x, y, METADATA_AREA_FLAG);
        }
      }
      for (let y = height - 11; y < height - 8; y++) {
        for (let x = 0; x < 6; x++) {
          mat.setExtAt(x, y, METADATA_AREA_FLAG);
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

export function pourDataBits(
  mat: BitExtMatrix,
  version: Version,
  bits: Bits
): void {
  let currentByte: number | null = null;
  let bitIndex = 0;
  for (const [x, y] of bitPositions(mat, version)) {
    if (mat.getExtAt(x, y) & NON_DATA_MASK) {
      continue;
    }
    if (bitIndex >= bits.bitLength) {
      mat.setExtAt(x, y, 0);
      continue;
    }
    currentByte ??= bits.bytes[bitIndex >> 3];
    mat.setExtAt(x, y, (currentByte >> (7 - (bitIndex & 7))) & 1);
    bitIndex++;
    if ((bitIndex & 7) === 0) {
      currentByte = null;
    }
  }
}

export function* bitPositions(mat: BitExtMatrix, version: Version): IterableIterator<[number, number]> {
  for (const [x, y] of rawBitPositions(version)) {
    if (mat.getExtAt(x, y) & NON_DATA_MASK) {
      continue;
    }
    yield [x, y];
  }
}

function* rawBitPositions(version: Version): IterableIterator<[number, number]> {
  const { width, height } = SPECS[version];
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

const QR_ECC_LEVEL_NUMBERS: Partial<Record<ErrorCorrectionLevelOrNone, number>> = {
  L: 0b01,
  M: 0b00,
  Q: 0b11,
  H: 0b10,
};
const MICROQR_SYMBOL_NUMBERS: Record<MicroQRVersion, Partial<Record<ErrorCorrectionLevelOrNone, number>>> = {
  M1: {
    NONE: 0b000,
  },
  M2: {
    L: 0b001,
    M: 0b010,
  },
  M3: {
    L: 0b011,
    M: 0b100,
  },
  M4: {
    L: 0b101,
    M: 0b110,
    Q: 0b111,
  },
};

export function pourMetadataBits(
  mat: BitExtMatrix,
  version: Version,
  errorCorrectionLevel: ErrorCorrectionLevelOrNone,
  mask: number
): void {
  if (isMicroQRVersion(version)) {
    pourMicroQRMetadataBits(mat, version, errorCorrectionLevel, mask);
  } else {
    pourQRMetadataBits(mat, version, errorCorrectionLevel, mask);
  }
}

const QR_FORMAT_INFO_POSITIONS = [
  // Top left (bit 0 to 14)
  [ 0,  8,  0],
  [ 1,  8,  1],
  [ 2,  8,  2],
  [ 3,  8,  3],
  [ 4,  8,  4],
  [ 5,  8,  5],
  [ 6,  8,  7],
  [ 7,  8,  8],
  [ 8,  7,  8],
  [ 9,  5,  8],
  [10,  4,  8],
  [11,  3,  8],
  [12,  2,  8],
  [13,  1,  8],
  [14,  0,  8],
  // Top right (bit 0 to 7)
  [ 0, -1,  8],
  [ 1, -2,  8],
  [ 2, -3,  8],
  [ 3, -4,  8],
  [ 4, -5,  8],
  [ 5, -6,  8],
  [ 6, -7,  8],
  [ 7, -8,  8],
  // Bottom left (bit 8 to 14)
  [ 8,  8, -7],
  [ 9,  8, -6],
  [10,  8, -5],
  [11,  8, -4],
  [12,  8, -3],
  [13,  8, -2],
  [14,  8, -1],
];

const QR_FORMAT_INFO_MASK = 0b101010000010010;

function pourQRMetadataBits(
  mat: BitExtMatrix,
  version: QRVersion,
  errorCorrectionLevel: ErrorCorrectionLevelOrNone,
  mask: number
): void {
  const spec = SPECS[version];
  const { width, height } = spec;
  const eccLevelNumber = QR_ECC_LEVEL_NUMBERS[errorCorrectionLevel];
  if (eccLevelNumber == null) {
    throw new RangeError(`Invalid error correction level ${errorCorrectionLevel} for version ${version}`);
  }

  const formatInfoBits = encodeBCH5((eccLevelNumber << 3) | (mask & 0b111)) ^ QR_FORMAT_INFO_MASK;
  for (const [bitPos, relX, relY] of QR_FORMAT_INFO_POSITIONS) {
    const x = relX < 0 ? width + relX : relX;
    const y = relY < 0 ? height + relY : relY;
    const bit = (formatInfoBits >> bitPos) & 1;
    mat.setExtAt(x, y, METADATA_AREA_FLAG | bit);
  }
  // Always set to 1
  mat.setExtAt(8, (height - 8), METADATA_AREA_FLAG | 1);

  if (spec.versionInfoSize) {
    const versionInfoBits = encodeBCH6(version);
    // Top right
    for (let i = 0; i < 18; i++) {
      const bit = (versionInfoBits >> i) & 1;
      const x = width - 11 + i % 3;
      const y = Math.floor(i / 3);
      mat.setExtAt(x, y, METADATA_AREA_FLAG | bit);
    }
    // Bottom left
    for (let i = 0; i < 18; i++) {
      const bit = (versionInfoBits >> i) & 1;
      const x = Math.floor(i / 3);
      const y = height - 11 + i % 3;
      mat.setExtAt(x, y, METADATA_AREA_FLAG | bit);
    }
  }
}

const MICRO_QR_FORMAT_INFO_MASK = 0b100010001000101;

function pourMicroQRMetadataBits(
  mat: BitExtMatrix,
  version: MicroQRVersion,
  errorCorrectionLevel: ErrorCorrectionLevelOrNone,
  mask: number
): void {
  const symbolNumber = MICROQR_SYMBOL_NUMBERS[version][errorCorrectionLevel];
  if (symbolNumber == null) {
    throw new RangeError(`Invalid error correction level ${errorCorrectionLevel} for version ${version}`);
  }
  const formatInfoBits = encodeBCH5((symbolNumber << 2) | (mask & 0b11)) ^ MICRO_QR_FORMAT_INFO_MASK;
  for (let i = 0; i < 8; i++) {
    const bit = (formatInfoBits >> i) & 1;
    const x = 8;
    const y = i + 1;
    mat.setExtAt(x, y, METADATA_AREA_FLAG | bit);
  }
  for (let i = 8; i < 15; i++) {
    const bit = (formatInfoBits >> i) & 1;
    const x = 15 - i;
    const y = 8;
    mat.setExtAt(x, y, METADATA_AREA_FLAG | bit);
  }
}
