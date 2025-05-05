import { Bit } from "./qrcode/bit";
import { encodeToMatrix } from "./qrcode/pipeline";
import { ErrorCorrectionLevelOrNone } from "./qrcode/specs";

export type { ErrorCorrectionLevelOrNone } from "./qrcode/specs";

export type EncodeQROptions = {
  allowMicroQR?: boolean;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
};

export function encodeQRToMatrix(text: string, options: EncodeQROptions = {}): Bit[][] {
  return encodeToMatrix(text, options);
}
