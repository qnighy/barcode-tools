import { BitExtMatrix } from "./qrcode/bit-ext-matrix";
import { encodeToMatrix, encodeToSVG } from "./qrcode/pipeline";
import { ErrorCorrectionLevelOrNone, Version } from "./qrcode/specs";

export type { ErrorCorrectionLevelOrNone, Version } from "./qrcode/specs";
export { BitExtMatrix, BIT_VALUE_FLAG, METADATA_AREA_FLAG, FUNCTION_PATTERN_FLAG, NON_DATA_MASK } from "./qrcode/bit-ext-matrix";

export type EncodeToQROptions = {
  allowMicroQR?: boolean;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
};

export type EncodeToQRMatrixResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  matrix: BitExtMatrix;
};

export function encodeToQRMatrix(text: string, options: EncodeToQROptions = {}): EncodeToQRMatrixResult {
  return encodeToMatrix(text, options);
}

export type EncodeToQRSVGResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  matrix: BitExtMatrix;
  svg: string;
};

export function encodeToQRSVG(text: string, options: EncodeToQROptions = {}): EncodeToQRSVGResult {
  return encodeToSVG(text, options);
}
