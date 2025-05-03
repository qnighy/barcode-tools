import { Bits } from "./bit-writer";
import { addFiller, BitOverflowError, maybeCompressBytes } from "./compression";
import { CODING_SPECS, CodingVersion, ErrorCorrectionLevelOrNone, SPECS, Version } from "./specs";

export type FitBytesOptions = {
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  allowMicroQR?: boolean;
};

export type FitBytesResult = {
  bits: Bits;
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
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

export function fitBytes(data: Uint8Array, options: FitBytesOptions): FitBytesResult {
  const { errorCorrectionLevel, allowMicroQR = false } = options;
  const codingVersions: CodingVersion[] =
    allowMicroQR
      ? ["M1", "M2", "M3", "M4", 9, 26, 40]
      : [9, 26, 40];
  for (const codingVersion of codingVersions) {
    const maxVersionSpec = SPECS[codingVersion];
    const modifiedLevelForMaxVersion = LEVEL_MAP[errorCorrectionLevel].find((level) => level in maxVersionSpec.errorCorrectionSpecs);
    if (!modifiedLevelForMaxVersion) {
      // Error correction level too high
      continue;
    }
    const maxVersionErrorCorrectionSpec = maxVersionSpec.errorCorrectionSpecs[modifiedLevelForMaxVersion]!;
    const compressed = maybeCompressBytes(
      data,
      maxVersionErrorCorrectionSpec.dataBits,
      CODING_SPECS[codingVersion]
    );
    if (!compressed) {
      // Data too large
      continue;
    }

    for (const version of CODING_VERSION_VERSIONS[codingVersion]) {
      const spec = SPECS[version];
      const modifiedLevel = LEVEL_MAP[errorCorrectionLevel].find((level) => level in spec.errorCorrectionSpecs);
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
      addFiller(compressed, errorCorrectionSpec.dataBits, CODING_SPECS[codingVersion]);
      return {
        bits: compressed.transferToBytes(),
        version,
        errorCorrectionLevel: modifiedLevel,
      };
    }
  }
  throw new BitOverflowError(`Bit overflow`);
}
