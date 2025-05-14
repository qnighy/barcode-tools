import { BitReader } from "./bit-reader";
import { Bits, BitWriter } from "./bit-writer";

export type CodingParameters = {
  modeIndicatorBits: number;
  digitModeIndicator: number | null;
  alphanumericModeIndicator: number | null;
  byteModeIndicator: number | null;
  kanjiModeIndicator: number | null;
  ECIModeIndicator: number | null;
  digitModeCountBits: number;
  alphanumericModeCountBits: number;
  byteModeCountBits: number;
  kanjiModeCountBits: number;
};

const BIT_COST = 6;
const ALPHANUMERIC_SYMBOL_MAP = [
  // '!' '"' '#' '$' '%' '&' "'" '(' ')' '*' '+' ',' '-' '.' '/'
  36,  0,  0,  0, 37, 38,  0,  0,  0,  0, 39, 40,  0, 41, 42, 43,
];

export type BitOverflowErrorOptions = {
  bodyBitLength: number;
  maxBitLength: number;
};
export class BitOverflowError extends Error {
  static {
    this.prototype.name = "BitOverflowError";
  }

  bodyBitLength: number;
  maxBitLength: number;

  constructor(options: BitOverflowErrorOptions) {
    const { bodyBitLength, maxBitLength } = options;
    super(`Bit overflow: got ${bodyBitLength} bits for ${maxBitLength} capacity`);
    this.bodyBitLength = bodyBitLength;
    this.maxBitLength = maxBitLength;
  }
}

export type UnsupportedContentType = "non-digit" | "non-alphanumeric" | "non-default-ECI";
export type UnsupportedContentErrorOptions = {
  unsupportedContentType: UnsupportedContentType;
  maxBitLength: number;
};
export class UnsupportedContentError extends Error {
  static {
    this.prototype.name = "UnsupportedContentError";
  }

  unsupportedContentType: UnsupportedContentType;
  maxBitLength: number;
  constructor(options: UnsupportedContentErrorOptions) {
    const { unsupportedContentType, maxBitLength } = options;
    super(
      unsupportedContentType === "non-digit"
      ? "Only digits are encodable in this mode"
      : unsupportedContentType === "non-alphanumeric"
      ? "Only alphanumeric characters are encodable in this mode"
      : "ECI designator is not supported in this mode",
    );
    this.unsupportedContentType = unsupportedContentType;
    this.maxBitLength = maxBitLength;
  }
}

export class FormatError extends Error {
  static {
    this.prototype.name = "FormatError";
  }
}

export type BinaryParts = readonly BinaryPart[];
export type BinaryPart = {
  eciDesignator: number | null;
  bytes: Uint8Array;
};

export function compressBinaryParts(
  parts: BinaryParts,
  maxBits: number,
  params: CodingParameters,
): BitWriter {
  const writer = new BitWriter();
  let first = true;
  for (const part of parts) {
    const { eciDesignator, bytes } = part;
    if (eciDesignator != null) {
      if (params.ECIModeIndicator == null) {
        throw new UnsupportedContentError({
          unsupportedContentType: "non-default-ECI",
          maxBitLength: maxBits,
        });
      }
      writer.pushNumber(params.ECIModeIndicator, params.modeIndicatorBits);
      if (eciDesignator < 128) {
        writer.pushNumber(eciDesignator & 0x7F, 8);
      } else if (eciDesignator < 16384) {
        writer.pushNumber((eciDesignator & 0x3FFF) | 0x8000, 16);
      } else {
        writer.pushNumber((eciDesignator & 0x1FFFFF) | 0xC00000, 24);
      }
    } else if (!first) {
      throw new TypeError("ECI designator is required for all parts except the first");
    }
    compressBytes(bytes, maxBits, params, writer);
    first = false;
  }
  return writer;
}

function compressBytes(
  data: Uint8Array,
  maxBits: number,
  params: CodingParameters,
  writer: BitWriter,
): void {
  if (params.alphanumericModeIndicator == null && !data.every(isDigit_)) {
    throw new UnsupportedContentError({
      unsupportedContentType: "non-digit",
      maxBitLength: maxBits,
    });
  } else if (params.byteModeIndicator == null && !data.every(isAlphanumeric_)) {
    throw new UnsupportedContentError({
      unsupportedContentType: "non-alphanumeric",
      maxBitLength: maxBits,
    });
  }

  const finalNode = computeOptimumPath(data, params);
  if (writer.bitLength + finalNode.cost / BIT_COST > maxBits) {
    throw new BitOverflowError({
      bodyBitLength: writer.bitLength + finalNode.cost / BIT_COST,
      maxBitLength: maxBits,
    });
  }

  const modeChunks = reconstructPath(finalNode);

  for (const modeChunk of modeChunks) {
    writeChunk(writer, modeChunk, data, params);
  }
}

/**
 * A graph node memoizing the paths to achieve the minimum cost.
 */
type CostNode = {
  index: number;
  cost: number;
  type: CostNodeType;
  prevNode: CostNode | null;
};
type CostNodeType = "initial" | "digit" | "alphanumeric" | "byte" | "kanji";

function computeOptimumPath(data: Uint8Array, params: CodingParameters): CostNode {
  const digitSwitchCost = BIT_COST * (params.modeIndicatorBits + params.digitModeCountBits);
  const alphanumericSwitchCost = BIT_COST * (params.modeIndicatorBits + params.alphanumericModeCountBits);
  const byteSwitchCost = BIT_COST * (params.modeIndicatorBits + params.byteModeCountBits);
  const kanjiSwitchCost = BIT_COST * (params.modeIndicatorBits + params.kanjiModeCountBits);

  const initialNode: CostNode = {
    index: 0,
    cost: 0,
    type: "initial",
    prevNode: null,
  };
  let currentNeutralCost = 0;
  let currentNeutralNode: CostNode | null = initialNode;
  let currentNeutralNodeIndex: number = 0;
  let currentNeutralNodeType: CostNodeType = "initial";
  let currentNeutralNodePrevNode: CostNode | null = null;
  let lastNeutralCost = Infinity;
  let lastNeutralNode: CostNode | null = initialNode;
  let lastNeutralNodeIndex: number = 0;
  let lastNeutralNodeType: CostNodeType = "initial";
  let lastNeutralNodePrevNode: CostNode | null = null;
  let currentDigitCost = Infinity;
  let currentDigitPrev: CostNode | null = null;
  let currentAlphanumericCost = Infinity;
  let currentAlphanumericPrev: CostNode | null = null;
  let currentByteCost = Infinity;
  let currentBytePrev: CostNode | null = null;
  const currentKanjiCosts: number[] = [Infinity, Infinity];
  const currentKanjiPrevs: (CostNode | null)[] = [null, null];
  for (let i = 0; i < data.length; i++) {
    const kanjiParity = (i + 1) & 1;
    const byte = data[i];
    // '0' - '9'
    const isDigit = isDigit_(byte);
    const isAlphanumeric = isAlphanumeric_(byte);
    const isKanji = i > 0 && isKanji_(data[i - 1], byte);

    if (isDigit) {
      if (currentDigitCost > currentNeutralCost + digitSwitchCost) {
        currentDigitCost = currentNeutralCost + digitSwitchCost;
        currentDigitPrev = currentNeutralNode ??= {
          index: currentNeutralNodeIndex,
          cost: currentNeutralCost,
          type: currentNeutralNodeType,
          prevNode: currentNeutralNodePrevNode,
        };
      }
      currentDigitCost += BIT_COST * 10 / 3;
    } else {
      currentDigitCost = Infinity;
      currentDigitPrev = null;
    }
    if (isAlphanumeric) {
      if (currentAlphanumericCost > currentNeutralCost + alphanumericSwitchCost) {
        currentAlphanumericCost = currentNeutralCost + alphanumericSwitchCost;
        currentAlphanumericPrev = currentNeutralNode ??= {
          index: currentNeutralNodeIndex,
          cost: currentNeutralCost,
          type: currentNeutralNodeType,
          prevNode: currentNeutralNodePrevNode,
        };
      }
      currentAlphanumericCost += BIT_COST * 11 / 2;
    } else {
      currentAlphanumericCost = Infinity;
      currentAlphanumericPrev = null;
    }
    {
      if (currentByteCost > currentNeutralCost + byteSwitchCost) {
        currentByteCost = currentNeutralCost + byteSwitchCost;
        currentBytePrev = currentNeutralNode ??= {
          index: currentNeutralNodeIndex,
          cost: currentNeutralCost,
          type: currentNeutralNodeType,
          prevNode: currentNeutralNodePrevNode,
        };
      }
      currentByteCost += BIT_COST * 8;
    }
    if (isKanji) {
      if (currentKanjiCosts[kanjiParity] > lastNeutralCost + kanjiSwitchCost) {
        currentKanjiCosts[kanjiParity] = lastNeutralCost + kanjiSwitchCost;
        currentKanjiPrevs[kanjiParity] = lastNeutralNode ??= {
          index: lastNeutralNodeIndex,
          cost: lastNeutralCost,
          type: lastNeutralNodeType,
          prevNode: lastNeutralNodePrevNode,
        };
      }
      currentKanjiCosts[kanjiParity] += BIT_COST * 13;
    } else {
      currentKanjiCosts[kanjiParity] = Infinity;
      currentKanjiPrevs[kanjiParity] = null;
    }

    lastNeutralCost = currentNeutralCost;
    lastNeutralNode = currentNeutralNode;
    lastNeutralNodeIndex = currentNeutralNodeIndex;
    lastNeutralNodeType = currentNeutralNodeType;
    lastNeutralNodePrevNode = currentNeutralNodePrevNode;

    currentNeutralCost = Infinity;
    currentNeutralNode = null;
    currentNeutralNodeIndex = i + 1;
    const ceiledDigitCost = ceilCost(currentDigitCost);
    if (ceiledDigitCost < currentNeutralCost) {
      currentNeutralCost = ceiledDigitCost;
      currentNeutralNodeType = "digit";
      currentNeutralNodePrevNode = currentDigitPrev;
    }
    const ceiledAlphanumericCost = ceilCost(currentAlphanumericCost);
    if (ceiledAlphanumericCost < currentNeutralCost) {
      currentNeutralCost = ceiledAlphanumericCost;
      currentNeutralNodeType = "alphanumeric";
      currentNeutralNodePrevNode = currentAlphanumericPrev;
    }
    if (currentByteCost < currentNeutralCost) {
      currentNeutralCost = currentByteCost;
      currentNeutralNodeType = "byte";
      currentNeutralNodePrevNode = currentBytePrev;
    }
    const currentKanjiCost = currentKanjiCosts[kanjiParity];
    if (currentKanjiCost < currentNeutralCost) {
      currentNeutralCost = currentKanjiCost;
      currentNeutralNodeType = "kanji";
      currentNeutralNodePrevNode = currentKanjiPrevs[kanjiParity];
    }
  }
  return currentNeutralNode ?? {
    index: currentNeutralNodeIndex,
    cost: currentNeutralCost,
    type: currentNeutralNodeType,
    prevNode: currentNeutralNodePrevNode,
  };
}

function ceilCost(cost: number): number {
  return Math.ceil(cost / BIT_COST) * BIT_COST;
}

type ModeChunk = {
  mode: "digit" | "alphanumeric" | "byte" | "kanji";
  start: number;
  end: number;
};
function reconstructPath(node: CostNode): ModeChunk[] {
  const modeChunks: ModeChunk[] = [];
  let currentNode: CostNode = node;
  while (currentNode.type !== "initial") {
    const modeChunk: ModeChunk = {
      mode: currentNode.type,
      start: currentNode.prevNode!.index,
      end: currentNode.index,
    };
    modeChunks.push(modeChunk);
    currentNode = currentNode.prevNode!;
  }
  modeChunks.reverse();
  return modeChunks;
}

function writeChunk(
  writer: BitWriter,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  switch (modeChunk.mode) {
    case "digit":
      writeDigitChunk(writer, modeChunk, data, params);
      break;
    case "alphanumeric":
      writeAlphanumericChunk(writer, modeChunk, data, params);
      break;
    case "byte":
      writeByteChunk(writer, modeChunk, data, params);
      break;
    case "kanji":
      writeKanjiChunk(writer, modeChunk, data, params);
      break;
    default:
      throw new TypeError(`Unknown mode: ${modeChunk.mode satisfies never}`);
  }
}

function isDigit_(byte: number): boolean {
  return byte >= 0x30 && byte <= 0x39;
}

function writeDigitChunk(
  writer: BitWriter,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  if (params.digitModeIndicator == null) {
    throw new TypeError("digitModeIndicator is null");
  }
  writer.pushNumber(params.digitModeIndicator, params.modeIndicatorBits);
  writer.pushNumber(modeChunk.end - modeChunk.start, params.digitModeCountBits);
  for (let i = modeChunk.start; i < modeChunk.end; i += 3) {
    const size = modeChunk.end - i;
    if (size <= 1) {
      const value = data[i] - 0x30;
      writer.pushNumber(value, 4);
    } else if (size <= 2) {
      const value = (data[i] - 0x30) * 10 + (data[i + 1] - 0x30);
      writer.pushNumber(value, 7);
    } else {
      const value =
        (data[i] - 0x30) * 100 +
        (data[i + 1] - 0x30) * 10 +
        (data[i + 2] - 0x30);
      writer.pushNumber(value, 10);
    }
  }
}

function isAlphanumeric_(byte: number): boolean {
  return (
    // '0' - '9'
    (byte >= 0x30 && byte <= 0x39) ||
    // 'A' - 'Z'
    (byte >= 0x41 && byte <= 0x5A) ||
    // ' ', '$', '%', '*', '+', '-', '.', '/'
    (byte >= 0x20 && byte <= 0x2F && !!ALPHANUMERIC_SYMBOL_MAP[byte - 0x20]) ||
    // ':'
    byte === 0x3A
  );
}

function writeAlphanumericChunk(
  writer: BitWriter,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  if (params.alphanumericModeIndicator == null) {
    throw new TypeError("alphanumericModeIndicator is null");
  }
  writer.pushNumber(params.alphanumericModeIndicator, params.modeIndicatorBits);
  writer.pushNumber(modeChunk.end - modeChunk.start, params.alphanumericModeCountBits);
  for (let i = modeChunk.start; i < modeChunk.end; i += 2) {
    const size = modeChunk.end - i;
    if (size <= 1) {
      const value = alphanumericCode(data[i]);
      writer.pushNumber(value, 6);
    } else {
      const value =
        alphanumericCode(data[i]) * 45 +
        alphanumericCode(data[i + 1]);
      writer.pushNumber(value, 11);
    }
  }
}

function alphanumericCode(byte: number): number {
  if (byte >= 0x30 && byte <= 0x39) {
    return byte - 0x30;
  } else if (byte >= 0x41 && byte <= 0x5A) {
    return byte - (0x41 - 10);
  } else if (byte >= 0x20 && byte <= 0x2F) {
    return ALPHANUMERIC_SYMBOL_MAP[byte - 0x20];
  } else if (byte === 0x3A) {
    return 44;
  }
  throw new RangeError(`Invalid alphanumeric byte: ${byte}`);
}

function writeByteChunk(
  writer: BitWriter,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  if (params.byteModeIndicator == null) {
    throw new TypeError("byteModeIndicator is null");
  }
  writer.pushNumber(params.byteModeIndicator, params.modeIndicatorBits);
  writer.pushNumber(modeChunk.end - modeChunk.start, params.byteModeCountBits);
  for (let i = modeChunk.start; i < modeChunk.end; i++) {
    const byte = data[i];
    writer.pushNumber(byte, 8);
  }
}

function isKanji_(prevByte: number, byte: number): boolean {
  return (
    byte >= 0x40 &&
    // Kanji mode can technically encode 0x7F or 0xFD - 0xFF, but
    // the wording in the standard suggests that
    // it is not a correct encoding.
    byte <= 0xFC &&
    byte !== 0x7F &&
    (
      (prevByte >= 0x81 && prevByte <= 0x9F) ||
      (prevByte >= 0xE0 && prevByte < 0xEB) ||
      // 13 bit (8192 patterns) is a bit small
      // for 43 (upper) x 192 (lower) = 8256 patterns.
      // As a result, we cannot encode 0xEBC0 - 0xEBFC.
      (prevByte === 0xEB && byte <= 0xBF)
    )
  );
}

function writeKanjiChunk(
  writer: BitWriter,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  if ((modeChunk.end - modeChunk.start) % 2 !== 0) {
    throw new RangeError("Kanji chunk must have an even number of bytes");
  }
  if (params.kanjiModeIndicator == null) {
    throw new TypeError("kanjiModeIndicator is null");
  }
  writer.pushNumber(params.kanjiModeIndicator, params.modeIndicatorBits);
  writer.pushNumber((modeChunk.end - modeChunk.start) / 2, params.kanjiModeCountBits);
  for (let i = modeChunk.start; i < modeChunk.end; i += 2) {
    const byte1 = data[i];
    const byte2 = data[i + 1];
    let value: number;
    if (byte1 < 0xE0) {
      value = (byte1 - 0x81) * 0xC0 + (byte2 - 0x40);
    } else {
      value = (byte1 - (0xE0 - 31)) * 0xC0 + (byte2 - 0x40);
    }
    writer.pushNumber(value, 13);
  }
}

export function addFiller(
  writer: BitWriter,
  maxBits: number,
  parameters: CodingParameters
): void {
  // Add terminator bits
  const terminatorBits =
    parameters.digitModeIndicator === 0
    ? // Micro QR; the length field should also be 0 so that
      // we can distinguish between the terminator and the digit mode indicator
      parameters.modeIndicatorBits + parameters.digitModeCountBits
    : parameters.modeIndicatorBits;
  writer.pushNumber(0, Math.min(terminatorBits, maxBits - writer.bitLength));

  const firstByteBoundary = Math.ceil(writer.bitLength / 8) * 8;
  const lastByteBoundary = Math.floor(maxBits / 8) * 8;
  if (firstByteBoundary < maxBits) {
    // Add initial padding bits
    writer.pushNumber(0, firstByteBoundary - writer.bitLength);
    // Add padding codewords
    while (writer.bitLength < lastByteBoundary) {
      writer.pushNumber(0b11101100, 8);
      if (writer.bitLength < lastByteBoundary) {
        writer.pushNumber(0b00010001, 8);
      }
    }
  }
  // Add final padding bits
  writer.pushNumber(0, maxBits - writer.bitLength);
}

export function decompressAsBinaryParts(
  bits: Bits,
  params: CodingParameters
): BinaryParts {
  const hasLongTerminator = params.digitModeIndicator === 0;
  const reader = new BitReader(bits);
  const parts: BinaryPart[] = [];
  let currentECI: number | null = null;
  const byteWriter = new ByteWriter();
  try {
  loop:
    while (true) {
      if (reader.remainingBits < params.modeIndicatorBits) {
        const lastPart = reader.readNumber(reader.remainingBits);
        if (lastPart !== 0) {
          throw new FormatError("Early end of input");
        }
        break;
      }
      const mode = reader.readNumber(params.modeIndicatorBits);
      switch (mode) {
        case 0: {
          if (!hasLongTerminator) {
            // Ordinary QR code.
            break loop;
          } else if (reader.remainingBits < params.digitModeCountBits) {
            const lastPart = reader.readNumber(reader.remainingBits);
            if (lastPart !== 0) {
              throw new FormatError("Early end of input");
            }
            break loop;
          } else {
            // For Micro QR code, we need to check the length bits to determine
            // if it is a digit mode or a terminator.
            const length = reader.readNumber(params.digitModeCountBits);
            if (length === 0) {
              break loop;
            }
            readDigitChunk(reader, byteWriter, params, length);
            break;
          }
        }
        case params.digitModeIndicator:
          readDigitChunk(reader, byteWriter, params);
          break;
        case params.alphanumericModeIndicator:
          readAlphanumericChunk(reader, byteWriter, params);
          break;
        case params.byteModeIndicator:
          readByteChunk(reader, byteWriter, params);
          break;
        case params.kanjiModeIndicator:
          readKanjiChunk(reader, byteWriter, params);
          break;
        case params.ECIModeIndicator: {
          parts.push({
            eciDesignator: currentECI,
            bytes: byteWriter.currentCopy(),
          });
          byteWriter.clear();

          let designator = reader.readNumber(8);
          if ((designator & 0x80) === 0) {
            // 0b0xxxxxxx (1 byte form)
            // nothing to do
          } else if ((designator & 0xC0) === 0x80) {
            // 0b10xxxxxx 0bxxxxxxxx (2 byte form)
            designator = ((designator & 0x3F) << 8) | reader.readNumber(8);
          } else if ((designator & 0xE0) === 0xC0) {
            // 0b110xxxxx 0bxxxxxxxx 0bxxxxxxxx (3 byte form)
            designator = ((designator & 0x1F) << 16) | (reader.readNumber(8) << 8) | reader.readNumber(8);
            if (designator >= 1000000) {
              throw new FormatError("ECI designator too large");
            }
          } else {
            throw new FormatError("Invalid ECI designator");
          }
          currentECI = designator;
        }
        default:
          throw new FormatError(`Unknown mode: ${mode.toString(2).padStart(params.modeIndicatorBits, "0")}`);
      }
    }
  } catch (e) {
    if (e instanceof RangeError) {
      throw new FormatError("Early end of input");
    }
    throw e;
  }
  if (byteWriter.len > 0 || currentECI != null) {
    parts.push({
      eciDesignator: currentECI,
      bytes: byteWriter.currentCopy(),
    });
  }
  return parts;
}

function readDigitChunk(
  reader: BitReader,
  byteWriter: ByteWriter,
  params: CodingParameters,
  length?: number
): void {
  length ??= reader.readNumber(params.digitModeCountBits);
  byteWriter.reserve(byteWriter.buf.length + length);
  for (let i = 0; i < length; i += 3) {
    const size = length - i;
    if (size <= 1) {
      const value = reader.readNumber(4);
      if (value >= 10) {
        throw new FormatError("BCD out of bounds");
      }
      byteWriter.push(value + 0x30);
    } else if (size <= 2) {
      const value = reader.readNumber(7);
      if (value >= 100) {
        throw new FormatError("BCD out of bounds");
      }
      byteWriter.push(Math.floor(value / 10) + 0x30);
      byteWriter.push(value % 10 + 0x30);
    } else {
      const value = reader.readNumber(10);
      if (value >= 1000) {
        throw new FormatError("BCD out of bounds");
      }
      byteWriter.push(Math.floor(value / 100) + 0x30);
      byteWriter.push(Math.floor((value % 100) / 10) + 0x30);
      byteWriter.push(value % 10 + 0x30);
    }
  }
}

function readAlphanumericChunk(
  reader: BitReader,
  byteWriter: ByteWriter,
  params: CodingParameters,
  length?: number
): void {
  length ??= reader.readNumber(params.alphanumericModeCountBits);
  byteWriter.reserve(byteWriter.buf.length + length);
  for (let i = 0; i < length; i += 2) {
    const size = length - i;
    if (size <= 1) {
      const value = reader.readNumber(6);
      if (value >= 45) {
        throw new FormatError("Alphanumeric code out of bounds");
      }
      byteWriter.push(alphanumericByteFromCode(value));
    } else {
      const value = reader.readNumber(11);
      if (value >= 45 * 45) {
        throw new FormatError("Alphanumeric code out of bounds");
      }
      byteWriter.push(alphanumericByteFromCode(Math.floor(value / 45)));
      byteWriter.push(alphanumericByteFromCode(value % 45));
    }
  }
}

const ALPHANUMERIC_SYMBOL_LIST = [
  // 36: ' '
  0x20,
  // 37: '$'
  0x24,
  // 38: '%'
  0x25,
  // 39: '*'
  0x2A,
  // 40: '+'
  0x2B,
  // 41: '-'
  0x2D,
  // 42: '.'
  0x2E,
  // 43: '/'
  0x2F,
  // 44: ':'
  0x3A,
];
function alphanumericByteFromCode(code: number): number {
  if (code <= 9) {
    return code + 0x30;
  } else if (code <= 35) {
    return code + (0x41 - 10);
  } else {
    return ALPHANUMERIC_SYMBOL_LIST[code - 36];
  }
}

function readByteChunk(
  reader: BitReader,
  byteWriter: ByteWriter,
  params: CodingParameters,
  length?: number
): void {
  length ??= reader.readNumber(params.byteModeCountBits);
  byteWriter.reserve(byteWriter.buf.length + length);
  for (let i = 0; i < length; i++) {
    const value = reader.readNumber(8);
    byteWriter.push(value);
  }
}

function readKanjiChunk(
  reader: BitReader,
  byteWriter: ByteWriter,
  params: CodingParameters,
  length?: number
): void {
  length ??= reader.readNumber(params.kanjiModeCountBits);
  byteWriter.reserve(byteWriter.buf.length + length * 2);
  for (let i = 0; i < length; i++) {
    const value = reader.readNumber(13);
    const upper = Math.floor(value / 0xC0);
    const lower = value % 0xC0;
    const byte1 = upper + (upper < 0x1F ? 0x81 : 0xC1);
    const byte2 = lower + 0x40;
    if (byte1 === 0x7F || byte1 >= 0xFD) {
      throw new FormatError("Invalid kanji code lower byte");
    }
    byteWriter.push(byte1);
    byteWriter.push(byte2);
  }
}

class ByteWriter {
  buf: Uint8Array<ArrayBuffer> = new Uint8Array();
  len: number = 0;

  push(value: number): void {
    this.buf[this.len++] = value;
  }

  reserve(demand: number): void {
    const capacity = this.buf.length;
    if (demand <= capacity) {
      return;
    }
    const newCapacity = Math.max(demand, capacity * 2);
    this.buf = new Uint8Array(this.buf.buffer.transfer(newCapacity));
  }

  currentCopy(): Uint8Array {
    return this.buf.slice(0, this.len);
  }

  clear(): void {
    this.len = 0;
  }
}
