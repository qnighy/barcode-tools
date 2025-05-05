import { BitExtMatrix } from "./bit-ext-matrix";
import { encodeErrorCorrection } from "./ecc";
import { fitBytes } from "./fitting";
import { fillFunctionPatterns, pourDataBits } from "./layout";
import { applyAutoMaskAndMetadata } from "./mask";
import { ErrorCorrectionLevelOrNone, SPECS, Version } from "./specs";

export type EncodeToMatrixOptions = {
  allowMicroQR?: boolean;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
};

export type EncodeToMatrixResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  matrix: BitExtMatrix;
};

export function encodeToMatrix(text: string, options: EncodeToMatrixOptions = {}): EncodeToMatrixResult {
  const {
    allowMicroQR = false,
    minErrorCorrectionLevel = "NONE",
  } = options;
  if (!/^[\x00-\x7F]*$/.test(text)) {
    throw new Error("TODO: Support non-ASCII characters");
  }
  const data = new TextEncoder().encode(text);
  const { bits: bodyBits, version, errorCorrectionLevel } = fitBytes(data, {
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
    matrix: mat,
  };
}

