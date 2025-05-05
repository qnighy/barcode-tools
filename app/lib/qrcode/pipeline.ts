import { encodeErrorCorrection } from "./ecc";
import { fitBytes } from "./fitting";
import { fillFunctionPatterns, pourDataBits } from "./layout";
import { applyAutoMaskAndMetadata } from "./mask";
import { ErrorCorrectionLevelOrNone, SPECS } from "./specs";

export type EncodeToMatrixOptions = {
  allowMicroQR?: boolean;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
};

export function encodeToMatrix(text: string, options: EncodeToMatrixOptions = {}): (0 | 1)[][] {
  const {
    allowMicroQR = false,
    minErrorCorrectionLevel = "NONE",
  } = options;
  if (!/^[\x00-\x7F]*$/.test(text)) {
    throw new Error("TODO: Support non-ASCII characters");
  }
  const data = new TextEncoder().encode(text);
  const { bits: bodyBits, version, errorCorrectionLevel } = fitBytes(data, {
    errorCorrectionLevel: minErrorCorrectionLevel,
    allowMicroQR,
  });
  const bitsWithEcc = encodeErrorCorrection(bodyBits, version, errorCorrectionLevel);

  const { width, height } = SPECS[version];
  const mat = new Uint8Array(width * height);
  fillFunctionPatterns(mat, version);
  pourDataBits(mat, version, bitsWithEcc);
  applyAutoMaskAndMetadata(mat, version, errorCorrectionLevel);

  const result: (0 | 1)[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) =>
      (mat[y * width + x] & 1) as (0 | 1)
    )
  );
  return result;
}

