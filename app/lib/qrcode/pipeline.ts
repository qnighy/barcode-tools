import { BitExtMatrix } from "./bit-ext-matrix";
import { BinaryParts, decompressAsBinaryParts } from "./compression";
import { decodeErrorCorrection, encodeErrorCorrection } from "./ecc";
import { fitBytes, QRSymbolType } from "./fitting";
import { collectDataBits, collectMicroQRMetadataBits, collectQRMetadataBits, fillFunctionPatterns, pourDataBits } from "./layout";
import { applyAutoMaskAndMetadata, applyMask } from "./mask";
import { CODING_SPECS, ErrorCorrectionLevelOrNone, isMicroQRVersion, MicroQRVersion, SPECS, Version } from "./specs";
import { generateSVGFromMatrix } from "./svg";

export type EncodeToMatrixOptions = {
  symbolType: QRSymbolType;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
};

export type EncodeToMatrixResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  bodyBitLength: number;
  matrix: BitExtMatrix;
};

export function encodeToMatrix(text: string, options: EncodeToMatrixOptions): EncodeToMatrixResult {
  const {
    symbolType,
    minErrorCorrectionLevel = "NONE",
  } = options;
  const data: BinaryParts = [{
    // 26 = UTF-8
    eciDesignator: /^[\x00-\x7F]*$/.test(text) ? null : 26,
    bytes: new TextEncoder().encode(text),
  }];
  const { bits: bodyBits, version, errorCorrectionLevel, bodyBitLength } = fitBytes(data, {
    symbolType,
    minErrorCorrectionLevel,
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
  symbolType: QRSymbolType;
  minErrorCorrectionLevel?: ErrorCorrectionLevelOrNone;
};

export type EncodeToSVGResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  bodyBitLength: number;
  matrix: BitExtMatrix;
  svg: string;
};

export function encodeToSVG(text: string, options: EncodeToSVGOptions): EncodeToSVGResult {
  const {
    symbolType,
    minErrorCorrectionLevel = "NONE",
  } = options;

  const { version, errorCorrectionLevel, bodyBitLength, matrix } = encodeToMatrix(text, {
    symbolType,
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

export type DecodeToMatrixResult = {
  version: Version;
  errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  text: string;
};

export function decodeFromMatrix(matrix: BitExtMatrix): DecodeToMatrixResult {
  let version: Version;
  if (matrix.width < 21) {
    const v = (matrix.width - 9) / 2;
    if (v === 1 || v === 2 || v === 3 || v === 4) {
      version = `M${v}` as MicroQRVersion;
    } else {
      throw new RangeError("Invalid QR Code version");
    }
  } else {
    const v = (matrix.width - 17) / 4;
    if (Number.isInteger(v) && v >= 1 && v <= 40) {
      version = v as Version;
    } else {
      throw new RangeError("Invalid QR Code version");
    }
  }

  let errorCorrectionLevel: ErrorCorrectionLevelOrNone;
  let mask: number;
  if (isMicroQRVersion(version)) {
    const result = collectMicroQRMetadataBits(matrix);
    if (result.version !== version) {
      throw new RangeError("Invalid QR Code version");
    }
    errorCorrectionLevel = result.errorCorrectionLevel;
    mask = result.mask;
  } else {
    const result = collectQRMetadataBits(matrix, version);
    errorCorrectionLevel = result.errorCorrectionLevel;
    mask = result.mask;
  }

  fillFunctionPatterns(matrix, version);
  applyMask(matrix, version, mask);

  const bitsWithEcc = collectDataBits(matrix, version);
  const bodyBits = decodeErrorCorrection(bitsWithEcc, version, errorCorrectionLevel);

  const parts = decompressAsBinaryParts(bodyBits, CODING_SPECS[SPECS[version].codingVersion]);

  let text = "";
  for (const part of parts) {
    switch (part.eciDesignator ?? 3) {
      case 3:
        // ISO/IEC 8859-1
        text += new TextDecoder("iso-8859-1").decode(part.bytes);
        break;
      case 26:
        // UTF-8
        text += new TextDecoder("utf-8").decode(part.bytes);
        break;
      default:
        throw new Error(`Unsupported ECI designator: ${part.eciDesignator!.toString().padStart(6, "0")}`);
    }
  }

  return {
    version,
    errorCorrectionLevel,
    text,
  };
}
