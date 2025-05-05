import { Bit } from "./bit";
import { BitExtMatrix } from "./bit-ext-matrix";
import { SPECS, Version } from "./specs";

export type GenerateSVGFromMatrixOptions = {
  moduleSize: number;
};

export function generateSVGFromMatrix(
  version: Version,
  mat: BitExtMatrix,
  options: GenerateSVGFromMatrixOptions
): string {
  const { moduleSize } = options;
  const { width, height, margin } = SPECS[version];

  let svg: string = "";

  const svgWidth = (width + margin * 2) * moduleSize;
  const svgHeight = (height + margin * 2) * moduleSize;
  svg += `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">`;
  svg += `<rect width="${svgWidth}" height="${svgHeight}" fill="#fff"/>`;
  const svgPath = generateSVGPath(version, mat, { moduleSize });
  svg += `<path d="${svgPath}" fill="#000"/>`;
  svg += `</svg>`;
  return svg;
}

const DIR_DX = [1, 0, -1, 0];
const DIR_DY = [0, 1, 0, -1];

export type GenerateSVGPathOptions = {
  moduleSize: number;
};

export function generateSVGPath(
  version: Version,
  mat: BitExtMatrix,
  options: GenerateSVGPathOptions
): string {
  const { moduleSize } = options;
  const { width, height, margin } = SPECS[version];

  const SIZE = (height + 1) * (width + 1) * 4;
  function idx(x: number, y: number, dir: number): number {
    return (y * (width + 1) + x) * 4 + dir;
  }
  function getAt(x: number, y: number): Bit {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return 0;
    }
    return mat.getAt(x, y);
  }
  function isValid(x: number, y: number, dir: number): boolean {
    const dx = DIR_DX[dir];
    const dy = DIR_DY[dir];
    // Point to the right of the current vector,
    // with coordinates subtracted by 0.5
    const rx = x - 1 + ((1 + dx - dy) >> 1);
    const ry = y - 1 + ((1 + dx + dy) >> 1);
    // Point to the left, in the same manner
    const lx = x - 1 + ((1 + dx + dy) >> 1);
    const ly = y - 1 + ((1 - dx + dy) >> 1);
    // Trace the boundary clockwise
    return Boolean(!getAt(lx, ly) && getAt(rx, ry));
  }
  function* validPositions(): IterableIterator<[x: number, y: number, dir: number]> {
    for (let y = 0; y <= height; y++) {
      for (let x = 0; x <= width; x++) {
        for (let dir = 0; dir < 4; dir++) {
          if (isValid(x, y, dir)) {
            yield [x, y, dir];
          }
        }
      }
    }
  }
  function nextPosition(x: number, y: number, dir: number): [x: number, y: number, dir: number] {
    const newX = x + DIR_DX[dir];
    const newY = y + DIR_DY[dir];
    // Try interior angle 90, 180, and then 270 degrees in this order.
    return (
      isValid(newX, newY, (dir + 1) & 3)
        ? [newX, newY, (dir + 1) & 3]
        : isValid(newX, newY, dir)
        ? [newX, newY, dir]
        : [newX, newY, (dir + 3) & 3]
    );
  }

  const visited: boolean[] = Array.from({ length: SIZE }, () => false);
  let path: string = "";
  for (const [initX, initY, initDir] of validPositions()) {
    if (visited[idx(initX, initY, initDir)]) {
      continue;
    }
    visited[idx(initX, initY, initDir)] = true;
    path += ` M${(initX + margin) * moduleSize},${(initY + margin) * moduleSize}`;
    let prevDir = initDir;
    let [x, y, dir] = nextPosition(initX, initY, initDir);
    while (!visited[idx(x, y, dir)]) {
      visited[idx(x, y, dir)] = true;
      if (prevDir !== dir) {
        path += ` L${(x + margin) * moduleSize},${(y + margin) * moduleSize}`;
      }
      prevDir = dir;
      [x, y, dir] = nextPosition(x, y, dir);
    }
  }
  return path.substring(1);
}
