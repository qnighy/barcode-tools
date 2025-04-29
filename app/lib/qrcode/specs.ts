export type Version =
  | MicroQRVersion
  | QRVersion;
export type MicroQRVersion =
  | "M1" | "M2" | "M3" | "M4";
export type QRVersion =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40;

export function isMicroQRVersion(version: Version): version is MicroQRVersion {
  return typeof version === "string" && version.startsWith("M");
}
export function isQRVersion(version: Version): version is QRVersion {
  return typeof version === "number";
}

export type CodingVersion =
  | "M1" | "M2" | "M3" | "M4"
  | 9 | 26 | 40;

export const VERSIONS: readonly Version[] = Object.freeze<Version[]>([
  "M1", "M2", "M3", "M4",
  ...Array.from({ length: 40 }, (_, i) => (i + 1) as Version),
]);

export type ErrorCorrectionLevelOrNone = ErrorCorrectionLevel | "NONE";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

export function compareVersion(a: Version, b: Version): -1 | 0 | 1 {
  if (a === b) {
    return 0;
  }
  if (typeof a === "string") {
    return -1;
  }
  if (typeof b === "string") {
    return 1;
  }
  return a < b ? -1 : 1;
}

export type VersionSpec = {
  version: Version;
  margin: number;
  width: number;
  finderPatternTotalSize: number;
  timingPatternTotalSize: number;
  alignmentGridWidth: number;
  alignmentPatternTotalSize: number;
  functionPatternTotalSize: number;
  formatInfoSize: number;
  versionInfoSize: number;
  formatAndVersionInfoSize: number;
  dataCapacityBits: number;
  truncatedDataCapacityBits: number;
  dataCapacityBytes: number;
  remainderBits: number;
  numAlignmentPatterns: number;
  alignmentPatternPositions: number[];
  errorCorrectionSpecs: Partial<Record<ErrorCorrectionLevelOrNone, ErrorCorrectionSpec>>;
  codingVersion: CodingVersion;
};
export type ErrorCorrectionSpec = {
  numEccBlocks: number;
  numEccBytes: number;
  p: number;
  eccBlockGroups: ErrorCorrectionBlockGroup[];
  dataBytes: number;
  dataBits: number;
  digitCapacity: number;
  alphanumericCapacity: number;
  byteCapacity: number;
  kanjiCapacity: number;
};
export type ErrorCorrectionBlockGroup = {
  numBlocks: number;
  c: number;
  k: number;
  r: number;
};

const FINDER_PATTERN_SIZE = 8 * 8;
const ALIGNMENT_PATTERN_SIZE = 5 * 5;
// Those that are rendered over the timing pattern
const ALIGNMENT_PATTERN_SIZE_MINUS_TIMING = 5 * 4;

export type CodingVersionSpec = {
  codingVersion: CodingVersion;
  modeIndicatorBits: number;
  digitModeIndicator: number | null;
  alphanumericModeIndicator: number | null;
  byteModeIndicator: number | null;
  kanjiModeIndicator: number | null;
  FNC1FirstPositionIndicator: number | null;
  FNC1SecondPositionIndicator: number | null;
  ECIModeIndicator: number | null;
  structuredAppendModeIndicator: number | null;
  digitModeCountBits: number;
  alphanumericModeCountBits: number;
  byteModeCountBits: number;
  kanjiModeCountBits: number;
};

export const CODING_SPECS: Record<CodingVersion, CodingVersionSpec> = Object.freeze<Record<CodingVersion, CodingVersionSpec>>({
  M1: {
    codingVersion: "M1",
    modeIndicatorBits: 0,
    digitModeIndicator: 0,
    alphanumericModeIndicator: null,
    byteModeIndicator: null,
    kanjiModeIndicator: null,
    FNC1FirstPositionIndicator: null,
    FNC1SecondPositionIndicator: null,
    ECIModeIndicator: null,
    structuredAppendModeIndicator: null,
    digitModeCountBits: 3,
    alphanumericModeCountBits: -1,
    byteModeCountBits: -1,
    kanjiModeCountBits: -1,
  },
  M2: {
    codingVersion: "M2",
    modeIndicatorBits: 1,
    digitModeIndicator: 0b0,
    alphanumericModeIndicator: 0b1,
    byteModeIndicator: null,
    kanjiModeIndicator: null,
    FNC1FirstPositionIndicator: null,
    FNC1SecondPositionIndicator: null,
    ECIModeIndicator: null,
    structuredAppendModeIndicator: null,
    digitModeCountBits: 4,
    alphanumericModeCountBits: 3,
    byteModeCountBits: -1,
    kanjiModeCountBits: -1,
  },
  M3: {
    codingVersion: "M3",
    modeIndicatorBits: 2,
    digitModeIndicator: 0b00,
    alphanumericModeIndicator: 0b01,
    byteModeIndicator: 0b10,
    kanjiModeIndicator: 0b11,
    FNC1FirstPositionIndicator: null,
    FNC1SecondPositionIndicator: null,
    ECIModeIndicator: null,
    structuredAppendModeIndicator: null,
    digitModeCountBits: 5,
    alphanumericModeCountBits: 4,
    byteModeCountBits: 4,
    kanjiModeCountBits: 3,
  },
  M4: {
    codingVersion: "M4",
    modeIndicatorBits: 3,
    digitModeIndicator: 0b000,
    alphanumericModeIndicator: 0b001,
    byteModeIndicator: 0b010,
    kanjiModeIndicator: 0b011,
    FNC1FirstPositionIndicator: null,
    FNC1SecondPositionIndicator: null,
    ECIModeIndicator: null,
    structuredAppendModeIndicator: null,
    digitModeCountBits: 6,
    alphanumericModeCountBits: 5,
    byteModeCountBits: 5,
    kanjiModeCountBits: 4,
  },
  9: {
    codingVersion: 9,
    modeIndicatorBits: 4,
    digitModeIndicator: 0b0001,
    alphanumericModeIndicator: 0b0010,
    byteModeIndicator: 0b0100,
    kanjiModeIndicator: 0b1000,
    FNC1FirstPositionIndicator: 0b0101,
    FNC1SecondPositionIndicator: 0b1001,
    ECIModeIndicator: 0b0111,
    structuredAppendModeIndicator: 0b0011,
    digitModeCountBits: 10,
    alphanumericModeCountBits: 9,
    byteModeCountBits: 8,
    kanjiModeCountBits: 8,
  },
  26: {
    codingVersion: 26,
    modeIndicatorBits: 4,
    digitModeIndicator: 0b0001,
    alphanumericModeIndicator: 0b0010,
    byteModeIndicator: 0b0100,
    kanjiModeIndicator: 0b1000,
    FNC1FirstPositionIndicator: 0b0101,
    FNC1SecondPositionIndicator: 0b1001,
    ECIModeIndicator: 0b0111,
    structuredAppendModeIndicator: 0b0011,
    digitModeCountBits: 12,
    alphanumericModeCountBits: 11,
    byteModeCountBits: 16,
    kanjiModeCountBits: 10,
  },
  40: {
    codingVersion: 40,
    modeIndicatorBits: 4,
    digitModeIndicator: 0b0001,
    alphanumericModeIndicator: 0b0010,
    byteModeIndicator: 0b0100,
    kanjiModeIndicator: 0b1000,
    FNC1FirstPositionIndicator: 0b0101,
    FNC1SecondPositionIndicator: 0b1001,
    ECIModeIndicator: 0b0111,
    structuredAppendModeIndicator: 0b0011,
    digitModeCountBits: 14,
    alphanumericModeCountBits: 13,
    byteModeCountBits: 16,
    kanjiModeCountBits: 12,
  },
});

function getVersionSpec(version: Version): VersionSpec {
  const isMicro = typeof version === "string" && version.startsWith("M");
  const versionNumber = isMicro ? Number(version.slice(1)) : version as number;

  const margin = isMicro ? 2 : 4;
  const width =
    isMicro
      ? versionNumber * 2 + 9
      : versionNumber * 4 + 17;
  const finderPatternTotalSize = isMicro ? FINDER_PATTERN_SIZE : FINDER_PATTERN_SIZE * 3;
  const timingPatternTotalSize = isMicro ? versionNumber * 4 + 2 : versionNumber * 8 + 2;
  const alignmentGridWidth =
    isMicro || versionNumber <= 1
      ? 0
      : Math.floor(versionNumber / 7) + 1;
  const alignmentPatternTotalSize =
    alignmentGridWidth === 0
      ? 0
      : alignmentGridWidth * alignmentGridWidth * ALIGNMENT_PATTERN_SIZE +
        (alignmentGridWidth - 1) * 2 * ALIGNMENT_PATTERN_SIZE_MINUS_TIMING;
  const functionPatternTotalSize =
    finderPatternTotalSize +
    timingPatternTotalSize +
    alignmentPatternTotalSize;
  const formatInfoSize = isMicro ? 15 : 31;
  const versionInfoSize = isMicro || versionNumber <= 6 ? 0 : 36;
  const formatAndVersionInfoSize = formatInfoSize + versionInfoSize;
  const dataCapacityBits =
    width * width - functionPatternTotalSize - formatAndVersionInfoSize;
  const truncatedDataCapacityBits =
    isMicro
      ? dataCapacityBits
      : Math.floor(dataCapacityBits / 8) * 8;
  const dataCapacityBytes = Math.ceil(truncatedDataCapacityBits / 8);
  const remainderBits = dataCapacityBits - truncatedDataCapacityBits;

  const numAlignmentPatterns =
    alignmentGridWidth === 0
      ? 0
      : alignmentGridWidth * alignmentGridWidth +
        (alignmentGridWidth - 1) * 2;
  const alignmentPatternGap =
    alignmentGridWidth === 0
      ? 0
        // 0.75 is strange but it is spec-compatible.
        // It is presumably caused by double-rounding, first to the nearest integer
        // (tie to floor) and then to the nearest even number (tie to ceil).
      : Math.floor((versionNumber * 2 + 2) / alignmentGridWidth + 0.75) * 2;
  const alignmentPatternPositions =
    alignmentGridWidth === 0
      ? []
      : Array.from({ length: alignmentGridWidth + 1 }, (_, i) => {
          if (i === 0) {
            return 6;
          } else {
            return versionNumber * 4 + 10 - (alignmentGridWidth - i) * alignmentPatternGap;
          }
        });

  const codingVersion =
    isMicro
      ? version as CodingVersion
      : versionNumber <= 9
      ? 9
      : versionNumber <= 26
      ? 26
      : 40;
  const codingSpec = CODING_SPECS[codingVersion];

  const errorCorrectionSpecs: Partial<Record<ErrorCorrectionLevelOrNone, ErrorCorrectionSpec>> = {};
  for (const level of ["NONE", "L", "M", "Q", "H"] as const) {
    const row = ERROR_CORRECTION_LEVEL_TABLE[level][version];
    if (!row) {
      continue;
    }
    const [numBlocks, r, p] = row;
    const numBlocks2 = dataCapacityBytes % numBlocks;
    const numBlocks1 = numBlocks - numBlocks2;
    const blockSize1 = Math.floor(dataCapacityBytes / numBlocks);
    const blockSize2 = blockSize1 + 1;
    const eccBlockGroups: ErrorCorrectionBlockGroup[] = [{
      numBlocks: numBlocks1,
      c: blockSize1,
      k: blockSize1 - r * 2 - p,
      r,
    }];
    if (numBlocks2 > 0) {
      eccBlockGroups.push({
        numBlocks: numBlocks2,
        c: blockSize2,
        k: blockSize2 - r * 2 - p,
        r,
      });
    }
    const numEccBytes = numBlocks * (r * 2 + p);
    const dataBytes = dataCapacityBytes - numEccBytes;
    const dataBits = truncatedDataCapacityBits - numEccBytes * 8;
    const digitCapacity = Math.floor((dataBits - codingSpec.modeIndicatorBits - codingSpec.digitModeCountBits) * 3 / 10);
    const alphanumericCapacity =
      codingSpec.alphanumericModeIndicator != null
      ? Math.floor((dataBits - codingSpec.modeIndicatorBits - codingSpec.alphanumericModeCountBits) * 2 / 11)
      : 0;
    const byteCapacity =
      codingSpec.byteModeIndicator != null
      ? Math.floor((dataBits - codingSpec.modeIndicatorBits - codingSpec.byteModeCountBits) / 8)
      : 0;
    const kanjiCapacity =
      codingSpec.kanjiModeIndicator != null
      ? Math.floor((dataBits - codingSpec.modeIndicatorBits - codingSpec.kanjiModeCountBits) / 13)
      : 0;
    errorCorrectionSpecs[level] = {
      numEccBlocks: numBlocks,
      numEccBytes: numBlocks * (r * 2 + p),
      p,
      eccBlockGroups,
      dataBytes,
      dataBits,
      digitCapacity,
      alphanumericCapacity,
      byteCapacity,
      kanjiCapacity,
    };
  }

  return Object.freeze<VersionSpec>({
    version,
    margin,
    width,
    finderPatternTotalSize,
    timingPatternTotalSize,
    alignmentGridWidth,
    alignmentPatternTotalSize,
    functionPatternTotalSize,
    formatInfoSize,
    versionInfoSize,
    formatAndVersionInfoSize,
    dataCapacityBits,
    truncatedDataCapacityBits,
    dataCapacityBytes,
    remainderBits,
    numAlignmentPatterns,
    alignmentPatternPositions,
    errorCorrectionSpecs,
    codingVersion,
  });
}

const ERROR_CORRECTION_LEVEL_TABLE: Record<ErrorCorrectionLevelOrNone, Partial<Record<Version, [
  numBlocks: number,
  r: number,
  p: number
]>>> = {
  NONE: {
    "M1": [ 1,  0, 2],
  },
  L: {
    "M2": [ 1,  1, 3],
    "M3": [ 1,  2, 2],
    "M4": [ 1,  3, 2],
       1: [ 1,  2, 3],
       2: [ 1,  4, 2],
       3: [ 1,  7, 1],
       4: [ 1, 10, 0],
       5: [ 1, 13, 0],
       6: [ 2,  9, 0],
       7: [ 2, 10, 0],
       8: [ 2, 12, 0],
       9: [ 2, 15, 0],
      10: [ 4,  9, 0],
      11: [ 4, 10, 0],
      12: [ 4, 12, 0],
      13: [ 4, 13, 0],
      14: [ 4, 15, 0],
      15: [ 6, 11, 0],
      16: [ 6, 12, 0],
      17: [ 6, 14, 0],
      18: [ 6, 15, 0],
      19: [ 7, 14, 0],
      20: [ 8, 14, 0],
      21: [ 8, 14, 0],
      22: [ 9, 14, 0],
      23: [ 9, 15, 0],
      24: [10, 15, 0],
      25: [12, 13, 0],
      26: [12, 14, 0],
      27: [12, 15, 0],
      28: [13, 15, 0],
      29: [14, 15, 0],
      30: [15, 15, 0],
      31: [16, 15, 0],
      32: [17, 15, 0],
      33: [18, 15, 0],
      34: [19, 15, 0],
      35: [19, 15, 0],
      36: [20, 15, 0],
      37: [21, 15, 0],
      38: [22, 15, 0],
      39: [24, 15, 0],
      40: [25, 15, 0],
  },
  M: {
    "M2": [ 1,  2, 2],
    "M3": [ 1,  3, 2],
    "M4": [ 1,  5, 0],
       1: [ 1,  4, 2],
       2: [ 1,  8, 0],
       3: [ 1, 13, 0],
       4: [ 2,  9, 0],
       5: [ 2, 12, 0],
       6: [ 4,  8, 0],
       7: [ 4,  9, 0],
       8: [ 4, 11, 0],
       9: [ 5, 11, 0],
      10: [ 5, 13, 0],
      11: [ 5, 15, 0],
      12: [ 8, 11, 0],
      13: [ 9, 11, 0],
      14: [ 9, 12, 0],
      15: [10, 12, 0],
      16: [10, 14, 0],
      17: [11, 14, 0],
      18: [13, 13, 0],
      19: [14, 13, 0],
      20: [16, 13, 0],
      21: [17, 13, 0],
      22: [17, 14, 0],
      23: [18, 14, 0],
      24: [20, 14, 0],
      25: [21, 14, 0],
      26: [23, 14, 0],
      27: [25, 14, 0],
      28: [26, 14, 0],
      29: [28, 14, 0],
      30: [29, 14, 0],
      31: [31, 14, 0],
      32: [33, 14, 0],
      33: [35, 14, 0],
      34: [37, 14, 0],
      35: [38, 14, 0],
      36: [40, 14, 0],
      37: [43, 14, 0],
      38: [45, 14, 0],
      39: [47, 14, 0],
      40: [49, 14, 0],
  },
  Q: {
    "M4": [ 1,  7, 0],
       1: [ 1,  6, 1],
       2: [ 1, 11, 0],
       3: [ 2,  9, 0],
       4: [ 2, 13, 0],
       5: [ 4,  9, 0],
       6: [ 4, 12, 0],
       7: [ 6,  9, 0],
       8: [ 6, 11, 0],
       9: [ 8, 10, 0],
      10: [ 8, 12, 0],
      11: [ 8, 14, 0],
      12: [10, 13, 0],
      13: [12, 12, 0],
      14: [16, 10, 0],
      15: [12, 15, 0],
      16: [17, 12, 0],
      17: [16, 14, 0],
      18: [18, 14, 0],
      19: [21, 13, 0],
      20: [20, 15, 0],
      21: [23, 14, 0],
      22: [23, 15, 0],
      23: [25, 15, 0],
      24: [27, 15, 0],
      25: [29, 15, 0],
      26: [34, 14, 0],
      27: [34, 15, 0],
      28: [35, 15, 0],
      29: [38, 15, 0],
      30: [40, 15, 0],
      31: [43, 15, 0],
      32: [45, 15, 0],
      33: [48, 15, 0],
      34: [51, 15, 0],
      35: [53, 15, 0],
      36: [56, 15, 0],
      37: [59, 15, 0],
      38: [62, 15, 0],
      39: [65, 15, 0],
      40: [68, 15, 0],
  },
  H: {
       1: [ 1,  8, 1],
       2: [ 1, 14, 0],
       3: [ 2, 11, 0],
       4: [ 4,  8, 0],
       5: [ 4, 11, 0],
       6: [ 4, 14, 0],
       7: [ 5, 13, 0],
       8: [ 6, 13, 0],
       9: [ 8, 12, 0],
      10: [ 8, 14, 0],
      11: [11, 12, 0],
      12: [11, 14, 0],
      13: [16, 11, 0],
      14: [16, 12, 0],
      15: [18, 12, 0],
      16: [16, 15, 0],
      17: [19, 14, 0],
      18: [21, 14, 0],
      19: [25, 13, 0],
      20: [25, 14, 0],
      21: [25, 15, 0],
      22: [34, 12, 0],
      23: [30, 15, 0],
      24: [32, 15, 0],
      25: [35, 15, 0],
      26: [37, 15, 0],
      27: [40, 15, 0],
      28: [42, 15, 0],
      29: [45, 15, 0],
      30: [48, 15, 0],
      31: [51, 15, 0],
      32: [54, 15, 0],
      33: [57, 15, 0],
      34: [60, 15, 0],
      35: [63, 15, 0],
      36: [66, 15, 0],
      37: [70, 15, 0],
      38: [74, 15, 0],
      39: [77, 15, 0],
      40: [81, 15, 0],
  },
};

export const SPECS: Record<Version, VersionSpec> = Object.freeze(Object.fromEntries(
  VERSIONS.map((version) => Object.freeze([version, getVersionSpec(version)]))
) as Record<Version, VersionSpec>);
