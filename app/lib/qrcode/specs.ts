export type Version =
  | "M1" | "M2" | "M3" | "M4"
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40;

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
  metadataSize: number;
  physicalBits: number;
  effectivePhysicalBits: number;
  effectivePhysicalBytes: number;
  physicalPadSize: number;
  codingVersion: CodingVersion;
};

const FINDER_PATTERN_SIZE = 8 * 8;
const ALIGNMENT_PATTERN_SIZE = 5 * 5;
// Those that are rendered over the timing pattern
const ALIGNMENT_PATTERN_SIZE_MINUS_TIMING = 5 * 4;

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
      : Math.floor(versionNumber / 7) + 2; 
  const alignmentPatternTotalSize =
    alignmentGridWidth === 0
      ? 0
      : (alignmentGridWidth - 1) * (alignmentGridWidth - 1) * ALIGNMENT_PATTERN_SIZE +
        (alignmentGridWidth - 2) * 2 * ALIGNMENT_PATTERN_SIZE_MINUS_TIMING;
  const functionPatternTotalSize =
    finderPatternTotalSize +
    timingPatternTotalSize +
    alignmentPatternTotalSize;
  const metadataSize =
    isMicro
      ? 15
      : versionNumber <= 6
      ? 31
      : 67;
  const physicalBits =
    width * width - functionPatternTotalSize - metadataSize;
  const effectivePhysicalBits =
    isMicro
      ? physicalBits
      : Math.floor(physicalBits / 8) * 8;
  const effectivePhysicalBytes = Math.ceil(effectivePhysicalBits / 8);
  const physicalPadSize = physicalBits - effectivePhysicalBits;
  const codingVersion =
    isMicro
      ? version as CodingVersion
      : versionNumber <= 9
      ? 9
      : versionNumber <= 26
      ? 26
      : 40;
  return Object.freeze({
    version,
    margin,
    width,
    finderPatternTotalSize,
    timingPatternTotalSize,
    alignmentGridWidth,
    alignmentPatternTotalSize,
    functionPatternTotalSize,
    metadataSize,
    physicalBits,
    effectivePhysicalBits,
    effectivePhysicalBytes,
    physicalPadSize,
    codingVersion,
  });
}

export const SPECS: Record<Version, VersionSpec> = Object.freeze(Object.fromEntries(
  VERSIONS.map((version) => Object.freeze([version, getVersionSpec(version)]))
) as Record<Version, VersionSpec>);
