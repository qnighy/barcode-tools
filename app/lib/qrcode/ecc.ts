import { Bits } from "./bit-writer";
import { POLYNOMIALS } from "./poly";
import { ErrorCorrectionLevelOrNone, SPECS, Version } from "./specs";

export function encodeErrorCorrection(
  bits: Bits,
  version: Version,
  errorCorrectionLevel: ErrorCorrectionLevelOrNone
): Bits {
  const spec = SPECS[version];
  const errorCorrectionSpec = spec.errorCorrectionSpecs[errorCorrectionLevel];
  if (!errorCorrectionSpec) {
    throw new Error(`Error correction level ${errorCorrectionLevel} not supported for version ${version}`);
  }
  const poly = POLYNOMIALS[errorCorrectionSpec.numEccBytesEach];

  // It's 4 in M1 and M3, 0 otherwise
  const zeroBits = spec.dataCapacityBytes * 8 - spec.truncatedDataCapacityBits;
  const outputBytes = new Uint8Array(Math.ceil(spec.truncatedDataCapacityBits / 8));

  const maxBlockSize = Math.ceil(spec.dataCapacityBytes / errorCorrectionSpec.numEccBlocks);
  const blockSize1 = Math.floor(spec.dataCapacityBytes / errorCorrectionSpec.numEccBlocks);
  const blockSize2 = blockSize1 + 1;
  const blockSize2Count = spec.dataCapacityBytes % errorCorrectionSpec.numEccBlocks;
  const blockSize1Count = errorCorrectionSpec.numEccBlocks - blockSize2Count;

  // Copy data block
  // Note: when zeroBits > 0, one of the write calls will write past the end of the body part,
  // but this is ok because the excess is within the ECC part and will be overwritten
  // in the next step.
  const dataSize1 = blockSize1 - errorCorrectionSpec.numEccBytesEach;
  for (let i = 0; i < errorCorrectionSpec.numEccBlocks; i++) {
    const blockSize = i < blockSize1Count ? blockSize1 : blockSize2;
    const dataSize = blockSize - errorCorrectionSpec.numEccBytesEach;
    const dataSlice = bits.bytes.subarray(
      dataSize1 * i + Math.max(0, i - blockSize1Count),
      dataSize1 * i + Math.max(0, i - blockSize1Count) + dataSize,
    );
    for (let j = 0; j < dataSize1; j++) {
      outputBytes[errorCorrectionSpec.numEccBlocks * j + i] = dataSlice[j];
    }
    if (i >= blockSize1Count) {
      const j = dataSize1;
      outputBytes[errorCorrectionSpec.numEccBlocks * j + i - blockSize1Count] = dataSlice[j];
    }
  }

  // Generate ECC blocks
  const blockBuffer = new Uint8Array(maxBlockSize);
  const block1 = blockBuffer.subarray(0, blockSize1);
  for (let i = 0; i < errorCorrectionSpec.numEccBlocks; i++) {
    const blockSize = i < blockSize1Count ? blockSize1 : blockSize2;
    const dataSize = blockSize - errorCorrectionSpec.numEccBytesEach;
    const block = i < blockSize1Count ? block1 : blockBuffer;

    const dataSlice = bits.bytes.subarray(
      dataSize1 * i + Math.max(0, i - blockSize1Count),
      dataSize1 * i + Math.max(0, i - blockSize1Count) + dataSize
    );
    block.set(dataSlice, 0);
    poly.generate(block);

    if (zeroBits > 0) {
      // Not byte-aligned
      const bytePos = Math.floor(errorCorrectionSpec.dataBits / 8);
      for (let j = 0; j < errorCorrectionSpec.numEccBytesEach; j++) {
        const byte = block[dataSize + j];
        const index = bytePos + errorCorrectionSpec.numEccBlocks * j + i;
        outputBytes[index] |= (byte >>> (8 - zeroBits));
        outputBytes[index + 1] |= byte << zeroBits;
      }
    } else {
      const bytePos = errorCorrectionSpec.dataBytes;
      for (let j = 0; j < errorCorrectionSpec.numEccBytesEach; j++) {
        outputBytes[bytePos + errorCorrectionSpec.numEccBlocks * j + i] = block[dataSize + j];
      }
    }
  }

  return {
    bitLength: spec.truncatedDataCapacityBits,
    bytes: outputBytes,
  };
}
