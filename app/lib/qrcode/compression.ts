import { BitArray } from "./bit-array";

export type CodingParameters = {
  maxBits: number;
  modeIndicatorBits: number;
  digitModeIndicator: number | null;
  alphanumericModeIndicator: number | null;
  byteModeIndicator: number | null;
  kanjiModeIndicator: number | null;
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

export class BitOverflowError extends Error {
  static {
    this.prototype.name = "BitOverflowError";
  }
}
export function compressBytes(data: Uint8Array, params: CodingParameters): BitArray {
  return compressBytesImpl(data, params, (bits: number) => {
    throw new BitOverflowError(`Bit overflow: got ${bits} bits for ${params.maxBits} capacity`);
  });
}

export function maybeCompressBytes(data: Uint8Array, params: CodingParameters): BitArray | null {
  return compressBytesImpl(data, params, () => null);
}

export function compressBytesImpl<T>(
  data: Uint8Array,
  params: CodingParameters,
  onOverflow: (bits: number) => T
): BitArray | T {
  const finalNode = computeOptimumPath(data, params);
  if (finalNode.cost / BIT_COST > params.maxBits) {
    return onOverflow(finalNode.cost / BIT_COST);
  }

  const modeChunks = reconstructPath(finalNode);

  const bitArray = new BitArray();
  for (const modeChunk of modeChunks) {
    writeChunk(bitArray, modeChunk, data, params);
  }
  return bitArray;
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
    const isDigit = byte >= 0x30 && byte <= 0x39;
    const isAlphanumeric =
      // '0' - '9'
      isDigit ||
      // 'A' - 'Z'
      (byte >= 0x41 && byte <= 0x5A) ||
      // ' ', '$', '%', '*', '+', '-', '.', '/'
      (byte >= 0x20 && byte <= 0x2F && ALPHANUMERIC_SYMBOL_MAP[byte - 0x20]) ||
      // ':'
      byte === 0x3A;
    let isKanji = false;
    if (byte >= 0x40 && byte <= 0xFC && i > 0) {
      const prevByte = data[i - 1];
      isKanji =
        (prevByte >= 0x81 && prevByte <= 0x9F) ||
        (prevByte >= 0xE0 && prevByte < 0xEB) ||
        (prevByte === 0xEB && byte <= 0xBF);
    }

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
  bitArray: BitArray,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  switch (modeChunk.mode) {
    case "digit":
      writeDigitChunk(bitArray, modeChunk, data, params);
      break;
    case "alphanumeric":
      writeAlphanumericChunk(bitArray, modeChunk, data, params);
      break;
    case "byte":
      writeByteChunk(bitArray, modeChunk, data, params);
      break;
    case "kanji":
      writeKanjiChunk(bitArray, modeChunk, data, params);
      break;
    default:
      throw new TypeError(`Unknown mode: ${modeChunk.mode satisfies never}`);
  }
}

function writeDigitChunk(
  bitArray: BitArray,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  if (params.digitModeIndicator == null) {
    throw new TypeError("digitModeIndicator is null");
  }
  bitArray.pushNumber(params.digitModeIndicator, params.modeIndicatorBits);
  bitArray.pushNumber(modeChunk.end - modeChunk.start, params.digitModeCountBits);
  for (let i = modeChunk.start; i < modeChunk.end; i += 3) {
    const size = modeChunk.end - i;
    if (size <= 1) {
      const value = data[i] - 0x30;
      bitArray.pushNumber(value, 4);
    } else if (size <= 2) {
      const value = (data[i] - 0x30) * 10 + (data[i + 1] - 0x30);
      bitArray.pushNumber(value, 7);
    } else {
      const value =
        (data[i] - 0x30) * 100 +
        (data[i + 1] - 0x30) * 10 +
        (data[i + 2] - 0x30);
      bitArray.pushNumber(value, 10);
    }
  }
}

function writeAlphanumericChunk(
  bitArray: BitArray,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  if (params.alphanumericModeIndicator == null) {
    throw new TypeError("alphanumericModeIndicator is null");
  }
  bitArray.pushNumber(params.alphanumericModeIndicator, params.modeIndicatorBits);
  bitArray.pushNumber(modeChunk.end - modeChunk.start, params.alphanumericModeCountBits);
  for (let i = modeChunk.start; i < modeChunk.end; i += 2) {
    const size = modeChunk.end - i;
    if (size <= 1) {
      const value = alphanumericCode(data[i]);
      bitArray.pushNumber(value, 6);
    } else {
      const value =
        alphanumericCode(data[i]) * 45 +
        alphanumericCode(data[i + 1]);
      bitArray.pushNumber(value, 11);
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
  bitArray: BitArray,
  modeChunk: ModeChunk,
  data: Uint8Array,
  params: CodingParameters
): void {
  if (params.byteModeIndicator == null) {
    throw new TypeError("byteModeIndicator is null");
  }
  bitArray.pushNumber(params.byteModeIndicator, params.modeIndicatorBits);
  bitArray.pushNumber(modeChunk.end - modeChunk.start, params.byteModeCountBits);
  for (let i = modeChunk.start; i < modeChunk.end; i++) {
    const byte = data[i];
    bitArray.pushNumber(byte, 8);
  }
}

function writeKanjiChunk(
  bitArray: BitArray,
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
  bitArray.pushNumber(params.kanjiModeIndicator, params.modeIndicatorBits);
  bitArray.pushNumber((modeChunk.end - modeChunk.start) / 2, params.kanjiModeCountBits);
  for (let i = modeChunk.start; i < modeChunk.end; i += 2) {
    const byte1 = data[i];
    const byte2 = data[i + 1];
    let value: number;
    if (byte1 < 0xE0) {
      value = (byte1 - 0x81) * 0xC0 + (byte2 - 0x40);
    } else {
      value = (byte1 - (0xE0 - 31)) * 0xC0 + (byte2 - 0x40);
    }
    bitArray.pushNumber(value, 13);
  }
}
