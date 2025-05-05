import { Bits, BitWriter } from "./bit-writer";
import { addFiller, BinaryParts, BitOverflowError, compressBinaryParts } from "./compression";
import { CODING_SPECS, CodingVersion, ErrorCorrectionLevelOrNone, SPECS, Version } from "./specs";

export type FitBytesOptions = {
  minErrorCorrectionLevel: ErrorCorrectionLevelOrNone;
  allowMicroQR?: boolean;
};

export type FitBytesResult = {
  bits: Bits;
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  bodyBitLength: number;
};

const CODING_VERSION_VERSIONS: Record<CodingVersion, Version[]> = {
  M1: ["M1"],
  M2: ["M2"],
  M3: ["M3"],
  M4: ["M4"],
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  26: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
  40: [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
};
const LEVEL_MAP: Record<ErrorCorrectionLevelOrNone, ErrorCorrectionLevelOrNone[]> = {
  NONE: ["NONE", "L", "M", "Q", "H"],
  L: ["L", "M", "Q", "H"],
  M: ["M", "Q", "H"],
  Q: ["Q", "H"],
  H: ["H"],
};

export function fitBytes(parts: BinaryParts, options: FitBytesOptions): FitBytesResult {
  const { minErrorCorrectionLevel, allowMicroQR = false } = options;
  const codingVersions: CodingVersion[] =
    allowMicroQR
      ? ["M1", "M2", "M3", "M4", 9, 26, 40]
      : [9, 26, 40];
  let lastError: BitOverflowError | undefined;
  for (const codingVersion of codingVersions) {
    const maxVersionSpec = SPECS[codingVersion];
    const modifiedLevelForMaxVersion = LEVEL_MAP[minErrorCorrectionLevel].find((level) => level in maxVersionSpec.errorCorrectionSpecs);
    if (!modifiedLevelForMaxVersion) {
      // Error correction level too high
      continue;
    }
    const maxVersionErrorCorrectionSpec = maxVersionSpec.errorCorrectionSpecs[modifiedLevelForMaxVersion]!;
    let compressed: BitWriter;
    try {
      compressed = compressBinaryParts(
        parts,
        maxVersionErrorCorrectionSpec.dataBits,
        CODING_SPECS[codingVersion]
      );
    } catch (e) {
      if (e instanceof BitOverflowError) {
        lastError = e;
        continue;
      }
      throw e;
    }

    for (const version of CODING_VERSION_VERSIONS[codingVersion]) {
      const spec = SPECS[version];
      const modifiedLevel = LEVEL_MAP[minErrorCorrectionLevel].find((level) => level in spec.errorCorrectionSpecs);
      if (!modifiedLevel) {
        // Error correction level too high
        continue;
      }
      const errorCorrectionSpec = spec.errorCorrectionSpecs[modifiedLevel]!;
      if (compressed.bitLength > errorCorrectionSpec.dataBits) {
        // Data too large
        continue;
      }

      // Found a version that fits. Finalize the result.
      const bodyBitLength = compressed.bitLength;
      addFiller(compressed, errorCorrectionSpec.dataBits, CODING_SPECS[codingVersion]);
      return {
        bits: compressed.transferToBytes(),
        version,
        errorCorrectionLevel: modifiedLevel,
        bodyBitLength,
      };
    }
  }
  throw lastError ?? new BitOverflowError({
    bodyBitLength: -1,
    maxBitLength: -1,
  });
}
