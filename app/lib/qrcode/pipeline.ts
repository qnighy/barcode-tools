import { BitExtMatrix } from "./bit-ext-matrix";
import { BinaryParts } from "./compression";
import { encodeErrorCorrection } from "./ecc";
import { fitBytes } from "./fitting";
import { fillFunctionPatterns, pourDataBits } from "./layout";
import { applyAutoMaskAndMetadata } from "./mask";
import { ErrorCorrectionLevelOrNone, SPECS, Version } from "./specs";
import { generateSVGFromMatrix } from "./svg";

export type EncodeToMatrixOptions = {
  allowMicroQR?: boolean;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
};

export type EncodeToMatrixResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  bodyBitLength: number;
  matrix: BitExtMatrix;
};

export function encodeToMatrix(text: string, options: EncodeToMatrixOptions = {}): EncodeToMatrixResult {
  const {
    allowMicroQR = false,
    minErrorCorrectionLevel = "NONE",
  } = options;
  const data: BinaryParts = [{
    // 26 = UTF-8
    eciDesignator: /^[\x00-\x7F]*$/.test(text) ? null : 26,
    bytes: new TextEncoder().encode(text),
  }];
  const { bits: bodyBits, version, errorCorrectionLevel, bodyBitLength } = fitBytes(data, {
    minErrorCorrectionLevel,
    allowMicroQR,
  });
  const bitsWithEcc = encodeErrorCorrection(bodyBits, version, errorCorrectionLevel);

  const { width, height } = SPECS[version];
  const mat = new BitExtMatrix(width, height);
  fillFunctionPatterns(mat, version);
  pourDataBits(mat, version, bitsWithEcc);
  applyAutoMaskAndMetadata(mat, version, errorCorrectionLevel);

  return {
    version,
    errorCorrectionLevel,
    bodyBitLength,
    matrix: mat,
  };
}

export type EncodeToSVGOptions = {
  allowMicroQR?: boolean;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
};

export type EncodeToSVGResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  bodyBitLength: number;
  matrix: BitExtMatrix;
  svg: string;
};

export function encodeToSVG(text: string, options: EncodeToSVGOptions = {}): EncodeToSVGResult {
  const {
    allowMicroQR = false,
    minErrorCorrectionLevel = "NONE",
  } = options;

  const { version, errorCorrectionLevel, bodyBitLength, matrix } = encodeToMatrix(text, {
    allowMicroQR,
    minErrorCorrectionLevel,
  });
  const svg = generateSVGFromMatrix(version, matrix, {
    moduleSize: 10,
  });
  return {
    version,
    errorCorrectionLevel,
    bodyBitLength,
    matrix,
    svg,
  };
}
