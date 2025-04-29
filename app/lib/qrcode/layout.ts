import { isMicroQRVersion, QRVersion, SPECS, Version } from "./specs";

export function bitPositions(version: Version): IterableIterator<[number, number]> {
  if (isMicroQRVersion(version)) {
    throw new Error("TODO: micro QR bitPositions");
  } else {
    return qrBitPositions(version);
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
