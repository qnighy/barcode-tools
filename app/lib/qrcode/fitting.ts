import { Bits, BitWriter } from "./bit-writer";
import { addFiller, BinaryParts, BitOverflowError, compressBinaryParts, UnsupportedContentError } from "./compression";
import { CODING_SPECS, CodingVersion, ErrorCorrectionLevelOrNone, SPECS, Version } from "./specs";

export type QRSymbolType = "QR" | "MicroQR";
export type FitBytesOptions = {
  symbolType: QRSymbolType;
  minErrorCorrectionLevel: ErrorCorrectionLevelOrNone;
  minWidth?: number | undefined;
  maxWidth?: number | undefined;
  minHeight?: number | undefined;
  maxHeight?: number | undefined;
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

export function getMaxBitLength(options: FitBytesOptions): number {
  const {
    symbolType,
    minErrorCorrectionLevel,
    maxWidth,
    maxHeight,
  } = options;
  const versionsOfSymbol: Version[] =
    symbolType === "MicroQR"
      ? ["M1", "M2", "M3", "M4"]
      : [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
          11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
          21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
          31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        ];
  const versions = versionsOfSymbol.filter((version) => {
    const { width, height } = SPECS[version];
    return (
      width <= (maxWidth ?? Infinity) &&
      height <= (maxHeight ?? Infinity)
    );
  });
  return Math.max(
    ...versions.map((version) => {
      const spec = SPECS[version];
      const level = LEVEL_MAP[minErrorCorrectionLevel].find((level) => level in spec.errorCorrectionSpecs);
      if (level == null) {
        return 0; // Error correction level too high
      }
      const errorCorrectionSpec = spec.errorCorrectionSpecs[level]!;
      return errorCorrectionSpec.dataBits;
    })
  );
}

export function fitBytes(parts: BinaryParts, options: FitBytesOptions): FitBytesResult {
  const {
    symbolType,
    minErrorCorrectionLevel,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
  } = options;
  const codingVersions: CodingVersion[] =
    symbolType === "MicroQR"
      ? ["M1", "M2", "M3", "M4"]
      : [9, 26, 40];
  let lastError: BitOverflowError | UnsupportedContentError | undefined;
  for (const codingVersion of codingVersions) {
    const versions = CODING_VERSION_VERSIONS[codingVersion].filter((version) => {
      const { width, height } = SPECS[version];
      return (
        width >= (minWidth ?? 0) &&
        width <= (maxWidth ?? Infinity) &&
        height >= (minHeight ?? 0) &&
        height <= (maxHeight ?? Infinity)
      );
    });
    if (versions.length === 0) {
      // No versions fit the size constraints
      continue;
    }

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
      if (e instanceof BitOverflowError || e instanceof UnsupportedContentError) {
        lastError = e;
        continue;
      }
      throw e;
    }

    for (const version of versions) {
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
  throw lastError ?? new Error("Unreachable: no exception set in fitBytes");
}
