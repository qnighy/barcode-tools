import { BitExtMatrix } from "./qrcode/bit-ext-matrix";
import { QRSymbolType } from "./qrcode/fitting";
import { encodeToMatrix, encodeToSVG } from "./qrcode/pipeline";
import { ErrorCorrectionLevelOrNone, Version } from "./qrcode/specs";

export type { ErrorCorrectionLevelOrNone, Version } from "./qrcode/specs";
export { BitExtMatrix, BIT_VALUE_FLAG, METADATA_AREA_FLAG, FUNCTION_PATTERN_FLAG, NON_DATA_MASK } from "./qrcode/bit-ext-matrix";
export { BitOverflowError, UnsupportedContentError } from "./qrcode/compression";
export type { BitOverflowErrorOptions, UnsupportedContentType, UnsupportedContentErrorOptions } from "./qrcode/compression";
export { getMaxBitLength } from "./qrcode/fitting";
export type { QRSymbolType } from "./qrcode/fitting";

export type EncodeToQROptions = {
  symbolType: QRSymbolType;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
  minWidth?: number | undefined;
  maxWidth?: number | undefined;
  minHeight?: number | undefined;
  maxHeight?: number | undefined;
};

export type EncodeToQRMatrixResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  bodyBitLength: number;
  matrix: BitExtMatrix;
};

export function encodeToQRMatrix(text: string, options: EncodeToQROptions): EncodeToQRMatrixResult {
  return encodeToMatrix(text, options);
}

export type EncodeToQRSVGResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  matrix: BitExtMatrix;
  bodyBitLength: number;
  svg: string;
};

export function encodeToQRSVG(text: string, options: EncodeToQROptions): EncodeToQRSVGResult {
  return encodeToSVG(text, options);
}
