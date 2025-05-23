import { expect, test } from "vitest";
import { fillFunctionPatterns } from "./layout";
import { applyAutoMaskAndMetadata, applyMask, evaluateMaskDetail } from "./mask";
import { SPECS, Version } from "./specs";
import { BitExtMatrix } from "./bit-ext-matrix";

function renderMaskPattern(version: Version, mask: number): string {
  const { width, height } = SPECS[version];
  const mat = new BitExtMatrix(width, height);
  fillFunctionPatterns(mat, version);
  applyMask(mat, version, mask);
  const mat2 = Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x): string => {
    const byte = mat.getExtAt(x, y);
    return byte & 1 ? "\u2588" : "\u2592";
  }));
  return mat2.map((row) => row.join("") + "\n").join("");
}

test("mask pattern 000 for version 1", () => {
  expect(renderMaskPattern(1, 0b000)).toEqual(`\
    ███████▒▒▒█▒█▒███████
    █▒▒▒▒▒█▒▒█▒█▒▒█▒▒▒▒▒█
    █▒███▒█▒▒▒█▒█▒█▒███▒█
    █▒███▒█▒▒█▒█▒▒█▒███▒█
    █▒███▒█▒▒▒█▒█▒█▒███▒█
    █▒▒▒▒▒█▒▒█▒█▒▒█▒▒▒▒▒█
    ███████▒█▒█▒█▒███████
    ▒▒▒▒▒▒▒▒▒█▒█▒▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒█▒▒▒█▒█▒▒▒▒▒▒▒▒
    ▒█▒█▒█▒█▒█▒█▒█▒█▒█▒█▒
    █▒█▒█▒█▒█▒█▒█▒█▒█▒█▒█
    ▒█▒█▒█▒█▒█▒█▒█▒█▒█▒█▒
    █▒█▒█▒█▒█▒█▒█▒█▒█▒█▒█
    ▒▒▒▒▒▒▒▒▒█▒█▒█▒█▒█▒█▒
    ███████▒▒▒█▒█▒█▒█▒█▒█
    █▒▒▒▒▒█▒▒█▒█▒█▒█▒█▒█▒
    █▒███▒█▒▒▒█▒█▒█▒█▒█▒█
    █▒███▒█▒▒█▒█▒█▒█▒█▒█▒
    █▒███▒█▒▒▒█▒█▒█▒█▒█▒█
    █▒▒▒▒▒█▒▒█▒█▒█▒█▒█▒█▒
    ███████▒▒▒█▒█▒█▒█▒█▒█
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 001 for version 1", () => {
  expect(renderMaskPattern(1, 0b001)).toEqual(`\
    ███████▒▒████▒███████
    █▒▒▒▒▒█▒▒▒▒▒▒▒█▒▒▒▒▒█
    █▒███▒█▒▒████▒█▒███▒█
    █▒███▒█▒▒▒▒▒▒▒█▒███▒█
    █▒███▒█▒▒████▒█▒███▒█
    █▒▒▒▒▒█▒▒▒▒▒▒▒█▒▒▒▒▒█
    ███████▒█▒█▒█▒███████
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒█▒▒████▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █████████████████████
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █████████████████████
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    ███████▒▒████████████
    █▒▒▒▒▒█▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █▒███▒█▒▒████████████
    █▒███▒█▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █▒███▒█▒▒████████████
    █▒▒▒▒▒█▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    ███████▒▒████████████
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 010 for version 1", () => {
  expect(renderMaskPattern(1, 0b010)).toEqual(`\
    ███████▒▒█▒▒█▒███████
    █▒▒▒▒▒█▒▒█▒▒█▒█▒▒▒▒▒█
    █▒███▒█▒▒█▒▒█▒█▒███▒█
    █▒███▒█▒▒█▒▒█▒█▒███▒█
    █▒███▒█▒▒█▒▒█▒█▒███▒█
    █▒▒▒▒▒█▒▒█▒▒█▒█▒▒▒▒▒█
    ███████▒█▒█▒█▒███████
    ▒▒▒▒▒▒▒▒▒█▒▒█▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒█▒▒█▒▒█▒▒▒▒▒▒▒▒
    █▒▒█▒▒▒▒▒█▒▒█▒▒█▒▒█▒▒
    █▒▒█▒▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒▒█▒▒▒▒▒█▒▒█▒▒█▒▒█▒▒
    █▒▒█▒▒█▒▒█▒▒█▒▒█▒▒█▒▒
    ▒▒▒▒▒▒▒▒▒█▒▒█▒▒█▒▒█▒▒
    ███████▒▒█▒▒█▒▒█▒▒█▒▒
    █▒▒▒▒▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒███▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒███▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒███▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒▒▒▒▒█▒▒█▒▒█▒▒█▒▒█▒▒
    ███████▒▒█▒▒█▒▒█▒▒█▒▒
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 011 for version 1", () => {
  expect(renderMaskPattern(1, 0b011)).toEqual(`\
    ███████▒▒█▒▒█▒███████
    █▒▒▒▒▒█▒▒▒▒█▒▒█▒▒▒▒▒█
    █▒███▒█▒▒▒█▒▒▒█▒███▒█
    █▒███▒█▒▒█▒▒█▒█▒███▒█
    █▒███▒█▒▒▒▒█▒▒█▒███▒█
    █▒▒▒▒▒█▒▒▒█▒▒▒█▒▒▒▒▒█
    ███████▒█▒█▒█▒███████
    ▒▒▒▒▒▒▒▒▒▒▒█▒▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒█▒▒▒█▒▒▒▒▒▒▒▒▒▒
    █▒▒█▒▒▒▒▒█▒▒█▒▒█▒▒█▒▒
    ▒▒█▒▒██▒█▒▒█▒▒█▒▒█▒▒█
    ▒█▒▒█▒▒█▒▒█▒▒█▒▒█▒▒█▒
    █▒▒█▒▒█▒▒█▒▒█▒▒█▒▒█▒▒
    ▒▒▒▒▒▒▒▒▒▒▒█▒▒█▒▒█▒▒█
    ███████▒▒▒█▒▒█▒▒█▒▒█▒
    █▒▒▒▒▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒███▒█▒▒▒▒█▒▒█▒▒█▒▒█
    █▒███▒█▒▒▒█▒▒█▒▒█▒▒█▒
    █▒███▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒▒▒▒▒█▒▒▒▒█▒▒█▒▒█▒▒█
    ███████▒▒▒█▒▒█▒▒█▒▒█▒
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 100 for version 1", () => {
  expect(renderMaskPattern(1, 0b100)).toEqual(`\
    ███████▒▒▒▒▒█▒███████
    █▒▒▒▒▒█▒▒▒▒▒█▒█▒▒▒▒▒█
    █▒███▒█▒▒███▒▒█▒███▒█
    █▒███▒█▒▒███▒▒█▒███▒█
    █▒███▒█▒▒▒▒▒█▒█▒███▒█
    █▒▒▒▒▒█▒▒▒▒▒█▒█▒▒▒▒▒█
    ███████▒█▒█▒█▒███████
    ▒▒▒▒▒▒▒▒▒███▒▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒█▒▒▒▒▒█▒▒▒▒▒▒▒▒
    ███▒▒▒▒██▒▒▒███▒▒▒███
    ▒▒▒████▒▒███▒▒▒███▒▒▒
    ▒▒▒███▒▒▒███▒▒▒███▒▒▒
    ███▒▒▒███▒▒▒███▒▒▒███
    ▒▒▒▒▒▒▒▒▒▒▒▒███▒▒▒███
    ███████▒▒███▒▒▒███▒▒▒
    █▒▒▒▒▒█▒▒███▒▒▒███▒▒▒
    █▒███▒█▒▒▒▒▒███▒▒▒███
    █▒███▒█▒▒▒▒▒███▒▒▒███
    █▒███▒█▒▒███▒▒▒███▒▒▒
    █▒▒▒▒▒█▒▒███▒▒▒███▒▒▒
    ███████▒▒▒▒▒███▒▒▒███
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 101 for version 1", () => {
  expect(renderMaskPattern(1, 0b101)).toEqual(`\
    ███████▒▒████▒███████
    █▒▒▒▒▒█▒▒▒▒▒█▒█▒▒▒▒▒█
    █▒███▒█▒▒█▒▒█▒█▒███▒█
    █▒███▒█▒▒▒█▒█▒█▒███▒█
    █▒███▒█▒▒█▒▒█▒█▒███▒█
    █▒▒▒▒▒█▒▒▒▒▒█▒█▒▒▒▒▒█
    ███████▒█▒█▒█▒███████
    ▒▒▒▒▒▒▒▒▒▒▒▒█▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒█▒▒█▒▒█▒▒▒▒▒▒▒▒
    █▒█▒█▒▒▒█▒█▒█▒█▒█▒█▒█
    █▒▒█▒▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒▒▒▒▒▒▒▒▒▒▒█▒▒▒▒▒█▒▒
    █████████████████████
    ▒▒▒▒▒▒▒▒▒▒▒▒█▒▒▒▒▒█▒▒
    ███████▒▒█▒▒█▒▒█▒▒█▒▒
    █▒▒▒▒▒█▒▒▒█▒█▒█▒█▒█▒█
    █▒███▒█▒▒█▒▒█▒▒█▒▒█▒▒
    █▒███▒█▒▒▒▒▒█▒▒▒▒▒█▒▒
    █▒███▒█▒▒████████████
    █▒▒▒▒▒█▒▒▒▒▒█▒▒▒▒▒█▒▒
    ███████▒▒█▒▒█▒▒█▒▒█▒▒
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 110 for version 1", () => {
  expect(renderMaskPattern(1, 0b110)).toEqual(`\
    ███████▒▒████▒███████
    █▒▒▒▒▒█▒▒▒▒▒█▒█▒▒▒▒▒█
    █▒███▒█▒▒██▒█▒█▒███▒█
    █▒███▒█▒▒▒█▒█▒█▒███▒█
    █▒███▒█▒▒█▒██▒█▒███▒█
    █▒▒▒▒▒█▒▒▒███▒█▒▒▒▒▒█
    ███████▒█▒█▒█▒███████
    ▒▒▒▒▒▒▒▒▒▒▒▒█▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒█▒▒██▒█▒▒▒▒▒▒▒▒
    █▒█▒█▒▒▒█▒█▒█▒█▒█▒█▒█
    █▒██▒██▒██▒██▒██▒██▒█
    █▒▒▒██▒▒▒▒███▒▒▒███▒▒
    █████████████████████
    ▒▒▒▒▒▒▒▒▒▒▒▒███▒▒▒███
    ███████▒▒██▒██▒██▒██▒
    █▒▒▒▒▒█▒▒▒█▒█▒█▒█▒█▒█
    █▒███▒█▒▒█▒██▒██▒██▒█
    █▒███▒█▒▒▒███▒▒▒███▒▒
    █▒███▒█▒▒████████████
    █▒▒▒▒▒█▒▒▒▒▒███▒▒▒███
    ███████▒▒██▒██▒██▒██▒
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 111 for version 1", () => {
  expect(renderMaskPattern(1, 0b111)).toEqual(`\
    ███████▒▒▒█▒█▒███████
    █▒▒▒▒▒█▒▒███▒▒█▒▒▒▒▒█
    █▒███▒█▒▒▒███▒█▒███▒█
    █▒███▒█▒▒█▒█▒▒█▒███▒█
    █▒███▒█▒▒▒▒▒█▒█▒███▒█
    █▒▒▒▒▒█▒▒█▒▒▒▒█▒▒▒▒▒█
    ███████▒█▒█▒█▒███████
    ▒▒▒▒▒▒▒▒▒███▒▒▒▒▒▒▒▒▒
    ▒▒▒▒▒▒█▒▒▒███▒▒▒▒▒▒▒▒
    ▒█▒█▒█▒█▒█▒█▒█▒█▒█▒█▒
    ███▒▒▒███▒▒▒███▒▒▒███
    ▒███▒▒▒███▒▒▒███▒▒▒██
    █▒█▒█▒█▒█▒█▒█▒█▒█▒█▒█
    ▒▒▒▒▒▒▒▒▒███▒▒▒███▒▒▒
    ███████▒▒▒███▒▒▒███▒▒
    █▒▒▒▒▒█▒▒█▒█▒█▒█▒█▒█▒
    █▒███▒█▒▒▒▒▒███▒▒▒███
    █▒███▒█▒▒█▒▒▒███▒▒▒██
    █▒███▒█▒▒▒█▒█▒█▒█▒█▒█
    █▒▒▒▒▒█▒▒███▒▒▒███▒▒▒
    ███████▒▒▒███▒▒▒███▒▒
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 00 for version M4", () => {
  expect(renderMaskPattern("M4", 0b00)).toEqual(`\
    ███████▒█▒█▒█▒█▒█
    █▒▒▒▒▒█▒▒▒▒▒▒▒▒▒▒
    █▒███▒█▒▒████████
    █▒███▒█▒▒▒▒▒▒▒▒▒▒
    █▒███▒█▒▒████████
    █▒▒▒▒▒█▒▒▒▒▒▒▒▒▒▒
    ███████▒▒████████
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █▒▒▒▒▒▒▒▒████████
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █████████████████
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █████████████████
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █████████████████
    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
    █████████████████
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 01 for version M4", () => {
  expect(renderMaskPattern("M4", 0b01)).toEqual(`\
    ███████▒█▒█▒█▒█▒█
    █▒▒▒▒▒█▒▒▒▒▒███▒▒
    █▒███▒█▒▒███▒▒▒██
    █▒███▒█▒▒███▒▒▒██
    █▒███▒█▒▒▒▒▒███▒▒
    █▒▒▒▒▒█▒▒▒▒▒███▒▒
    ███████▒▒███▒▒▒██
    ▒▒▒▒▒▒▒▒▒███▒▒▒██
    █▒▒▒▒▒▒▒▒▒▒▒███▒▒
    ▒██▒▒▒███▒▒▒███▒▒
    █▒▒███▒▒▒███▒▒▒██
    ▒▒▒███▒▒▒███▒▒▒██
    ███▒▒▒███▒▒▒███▒▒
    ▒██▒▒▒███▒▒▒███▒▒
    █▒▒███▒▒▒███▒▒▒██
    ▒▒▒███▒▒▒███▒▒▒██
    ███▒▒▒███▒▒▒███▒▒
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 10 for version M4", () => {
  expect(renderMaskPattern("M4", 0b10)).toEqual(`\
    ███████▒█▒█▒█▒█▒█
    █▒▒▒▒▒█▒▒▒▒▒███▒▒
    █▒███▒█▒▒██▒██▒██
    █▒███▒█▒▒▒█▒█▒█▒█
    █▒███▒█▒▒█▒██▒██▒
    █▒▒▒▒▒█▒▒▒███▒▒▒█
    ███████▒▒████████
    ▒▒▒▒▒▒▒▒▒▒▒▒███▒▒
    █▒▒▒▒▒▒▒▒██▒██▒██
    ▒▒█▒█▒█▒█▒█▒█▒█▒█
    █▒██▒██▒██▒██▒██▒
    ▒▒▒▒███▒▒▒███▒▒▒█
    █████████████████
    ▒██▒▒▒███▒▒▒███▒▒
    ██▒██▒██▒██▒██▒██
    ▒▒█▒█▒█▒█▒█▒█▒█▒█
    █▒██▒██▒██▒██▒██▒
  `.replace(/^\s+/gm, ""));
});

test("mask pattern 11 for version M4", () => {
  expect(renderMaskPattern("M4", 0b11)).toEqual(`\
    ███████▒█▒█▒█▒█▒█
    █▒▒▒▒▒█▒▒███▒▒▒██
    █▒███▒█▒▒▒███▒▒▒█
    █▒███▒█▒▒█▒█▒█▒█▒
    █▒███▒█▒▒▒▒▒███▒▒
    █▒▒▒▒▒█▒▒█▒▒▒███▒
    ███████▒▒▒█▒█▒█▒█
    ▒▒▒▒▒▒▒▒▒███▒▒▒██
    █▒▒▒▒▒▒▒▒▒███▒▒▒█
    ▒█▒█▒█▒█▒█▒█▒█▒█▒
    ███▒▒▒███▒▒▒███▒▒
    ▒███▒▒▒███▒▒▒███▒
    █▒█▒█▒█▒█▒█▒█▒█▒█
    ▒▒▒███▒▒▒███▒▒▒██
    █▒▒▒███▒▒▒███▒▒▒█
    ▒█▒█▒█▒█▒█▒█▒█▒█▒
    ███▒▒▒███▒▒▒███▒▒
  `.replace(/^\s+/gm, ""));
});

test("applyAutoMaskAndMetadata as in Annex I", () => {
  const mat = new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 4, 0, 0, 1, 0, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 1, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 1, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 0, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 0, 2, 2, 2, 2, 2, 2, 2, 2,
    4, 4, 4, 4, 4, 4, 3, 4, 4, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 4,
    1, 0, 0, 0, 0, 1, 2, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    1, 0, 1, 1, 0, 0, 3, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
    1, 0, 0, 1, 1, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0,
    1, 0, 0, 0, 1, 1, 3, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 0,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0,
  ]);
  applyAutoMaskAndMetadata(mat, 1, "M");
  expect(mat).toEqual(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 0, 1, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 1, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 0, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 0, 0, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 0, 0, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 4, 5, 5, 5, 5, 3, 4, 4, 1, 0, 0, 1, 4, 5, 5, 5, 5, 5, 4, 4,
    0, 0, 0, 1, 0, 1, 2, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0,
    0, 0, 1, 0, 0, 0, 3, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0,
    0, 0, 0, 1, 1, 1, 3, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 1, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0,
  ]));
});

test("applyAutoMaskAndMetadata for Micro QR as in Annex I", () => {
  const mat = new BitExtMatrix(13, [
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 0, 0, 0, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 0, 0, 1, 0,
    3, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0,
    2, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    3, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 0, 0,
    2, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0,
    3, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0,
  ]);
  applyAutoMaskAndMetadata(mat, "M2", "L");
  expect(mat).toEqual(new BitExtMatrix(13, [
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 1, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 0, 0, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 1, 0, 0,
    3, 5, 4, 5, 4, 4, 4, 4, 5, 0, 0, 0, 1,
    2, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0,
    2, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0,
    3, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1,
  ]));
});

test("QR mask evaluation (good - checker pattern)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 1, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 0, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 4, 5, 4, 5, 4, 3, 4, 5, 0, 1, 0, 1, 4, 5, 4, 5, 4, 5, 4, 5,
    0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 0, 1, 0, 1, 0, 3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    0, 1, 0, 1, 0, 1, 2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 0, 1, 0, 1, 0, 3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  ]), 1);

  expect(scores).toEqual([-6, -6, 0, 0, 0]);
});

test("QR mask evaluation (bad - vertical stripes)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 1, 0, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 1, 0, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 1, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 4, 5, 4, 5, 4, 3, 4, 5, 0, 1, 0, 1, 4, 5, 4, 5, 4, 5, 4, 5,
    1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    1, 0, 1, 0, 1, 0, 3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  ]), 1);
  expect(scores).toEqual([-219, -219, 0, 0, 0]);
});

test("QR mask evaluation (bad - horizontal stripes)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 5, 1, 1, 1, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 0, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 0, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 0, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 5, 5, 5, 5, 5, 3, 5, 5, 1, 1, 1, 1, 5, 5, 5, 5, 5, 5, 5, 5,
    0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]), 1);
  expect(scores).toEqual([-219, -219, 0, 0, 0]);
});

test("QR mask evaluation (bad - 3x3 blocks)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 0, 0, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 1, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 1, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 5, 5, 4, 4, 4, 3, 5, 5, 0, 0, 0, 1, 5, 5, 4, 4, 4, 5, 5, 5,
    0, 0, 0, 1, 1, 1, 2, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 3, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 2, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
    1, 1, 1, 0, 0, 0, 3, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1,
  ]), 1);
  expect(scores).toEqual([-288, 0, -288, 0, 0]);
});

test("QR mask evaluation (bad - 2x2 blocks)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 0, 1, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 0, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 0, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 0, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 4, 4, 5, 5, 4, 3, 5, 5, 0, 0, 1, 1, 4, 4, 5, 5, 4, 4, 5, 5,
    0, 1, 1, 0, 0, 1, 2, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
    0, 1, 1, 0, 0, 1, 3, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
    1, 0, 0, 1, 1, 0, 2, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
    1, 0, 0, 1, 1, 0, 3, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
  ]), 1);
  expect(scores).toEqual([-170, -2, -168, 0, 0]);
});

test("QR mask evaluation (bad - 2x2 dark blocks)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 4, 0, 0, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 1, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 1, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 1, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 0, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 1, 1, 0, 2, 2, 2, 2, 2, 2, 2, 2,
    4, 5, 5, 4, 5, 5, 3, 5, 5, 0, 1, 1, 0, 5, 5, 4, 5, 5, 4, 5, 5,
    0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    1, 1, 0, 1, 1, 0, 3, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
    1, 1, 0, 1, 1, 0, 2, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
    1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1,
  ]), 1);
  expect(scores).toEqual([-137, -41, -96, 0, 0]);
});

test("QR mask evaluation (bad - 2x2 light blocks)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 5, 1, 1, 1, 0, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 0, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 1, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 0, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 4, 4, 5, 4, 4, 3, 4, 4, 1, 0, 0, 1, 4, 4, 5, 4, 4, 5, 4, 4,
    1, 1, 1, 1, 1, 0, 2, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1,
    0, 0, 1, 0, 0, 1, 3, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 0, 1, 0, 0, 1, 2, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    0, 1, 1, 1, 1, 1, 3, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  ]), 1);
  expect(scores).toEqual([-121, -28, -93, 0, 0]);
});

test("QR mask evaluation (bad - pseudo finders)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 0, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 4, 5, 5, 5, 4, 3, 4, 4, 0, 0, 0, 0, 4, 5, 4, 5, 5, 5, 4, 5,
    0, 1, 0, 1, 1, 1, 2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0,
    1, 0, 1, 1, 1, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1,
    0, 1, 0, 1, 1, 1, 2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0,
    1, 0, 1, 1, 1, 1, 3, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1,
  ]), 1);
  expect(scores).toEqual([-1014, -99, -75, -840, 0]);
});

test("QR mask evaluation (bad - too many 0s)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 4, 0, 0, 1, 0, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 0, 0, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 1, 0, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 0, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 0, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 1, 0, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 0, 1, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2,
    4, 4, 4, 4, 4, 4, 3, 4, 4, 0, 0, 0, 1, 4, 4, 4, 4, 5, 4, 4, 4,
    0, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    0, 1, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0,
    1, 0, 0, 0, 0, 1, 3, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 4, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0,
  ]), 1);
  expect(scores).toEqual([-309, -66, -213, 0, -30]);
});

test("QR mask evaluation (bad - too many 1s)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(21, [
    3, 3, 3, 3, 3, 3, 3, 2, 5, 1, 1, 0, 1, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 1, 1, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 0, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 0, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 1, 1, 2, 3, 2, 3, 3, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 1, 1, 0, 1, 2, 3, 2, 2, 2, 2, 2, 3,
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 1, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2,
    5, 5, 5, 5, 5, 5, 3, 5, 5, 1, 1, 1, 0, 5, 5, 5, 5, 4, 5, 5, 5,
    1, 1, 1, 1, 0, 1, 2, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1,
    1, 0, 1, 1, 1, 1, 3, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1,
    1, 1, 1, 0, 1, 1, 2, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1,
    0, 1, 1, 1, 1, 0, 3, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 5, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 5, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1,
  ]), 1);
  expect(scores).toEqual([-252, -47, -135, -40, -30]);
});

test("Micro QR mask evaluation (good - has 1s in the edges)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(13, [
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 1,
    3, 4, 4, 4, 4, 4, 4, 4, 5, 0, 1, 0, 1,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]), "M2");

  expect(scores).toEqual([204]);
});

test("Micro QR mask evaluation (good - has 1s evenly in the edges)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(13, [
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 0,
    3, 4, 4, 4, 4, 4, 4, 4, 5, 0, 1, 0, 1,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
  ]), "M2");

  expect(scores).toEqual([102]);
});

test("Micro QR mask evaluation (not too bad - has 1s in the left edge)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(13, [
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 1, 1,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 1,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 1,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 1,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 1,
    3, 4, 4, 4, 4, 4, 4, 4, 5, 0, 1, 0, 1,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  ]), "M2");

  expect(scores).toEqual([28]);
});

test("Micro QR mask evaluation (not too bad - has 1s in the bottom edge)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(13, [
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 0,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 0,
    3, 4, 4, 4, 4, 4, 4, 4, 5, 0, 1, 0, 0,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ]), "M2");

  expect(scores).toEqual([28]);
});

test("Micro QR mask evaluation (bad - no 1s in the edges)", () => {
  const scores = evaluateMaskDetail(new BitExtMatrix(13, [
    3, 3, 3, 3, 3, 3, 3, 2, 3, 2, 3, 2, 3,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 0, 0, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 4, 1, 0, 1, 0,
    3, 2, 3, 3, 3, 2, 3, 2, 5, 0, 1, 0, 0,
    3, 2, 2, 2, 2, 2, 3, 2, 4, 1, 0, 1, 0,
    3, 3, 3, 3, 3, 3, 3, 2, 5, 0, 1, 0, 0,
    2, 2, 2, 2, 2, 2, 2, 2, 4, 1, 0, 1, 0,
    3, 4, 4, 4, 4, 4, 4, 4, 5, 0, 1, 0, 0,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0,
    2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0,
    3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]), "M2");

  expect(scores).toEqual([0]);
});
