/**
 * GF(256) arithmetic as in QR code, representing GF(256) as a residue field
 * GF(2)[x]/(x^8 + x^4 + x^3 + x^2 + 1).
 *
 * Note that the Rijndael (AES) uses a different representation
 * GF(2)[x]/(x^8 + x^4 + x^3 + x + 1).
 */

const PRIMITIVE_POLYNOMIAL = 0x11D; // x^8 + x^4 + x^3 + x^2 + 1
const PRIMITIVE_ROOT = 2;
/**
 * A sentinel value for log(0)
 */
const LOG_ZERO = 255;

/**
 * Multiply two GF(256) elements using representation
 * GF(2)[x]/(x^8 + x^4 + x^3 + x^2 + 1).
 */
export function mul(x: number, y: number): number {
  if (x === 0 || y === 0) {
    return 0;
  }
  const logX = logTable[x];
  const logY = logTable[y];
  const logZ = (logX + logY) % 255;
  return expTable[logZ];
}

/**
 * Compute the multiplicative inverse of a GF(256) element,
 * or zero if the input is zero.
 */
export function inv(x: number): number {
  if (x === 0) {
    return 0;
  }
  return expTable[(255 - logTable[x]) % 255];
}

/**
 * Naively multiply two GF(256) elements using representation
 * GF(2)[x]/(x^8 + x^4 + x^3 + x^2 + 1).
 */
function mulNaive(x: number, y: number): number {
  let z = 0;
  for (let i = 0; i < 8; i++) {
    const bit = (y >> (7 - i)) & 1;
    z = (z << 1) ^ ((-bit) & x);
    z = z ^ ((-(z >> 8)) & PRIMITIVE_POLYNOMIAL);
  }
  return z;
}

function initTables(): {
  logTable: number[];
  expTable: number[];
} {
  const logTable = Array.from({ length: 256 }, () => LOG_ZERO);
  const expTable = Array.from({ length: 255 }, () => 0);
  let current = 1;
  for (let i = 0; i < 255; i++) {
    if (logTable[current] !== LOG_ZERO) {
      throw new Error(`Invalid order: ${i}`);
    }
    logTable[current] = i;
    expTable[i] = current;
    current = mulNaive(current, PRIMITIVE_ROOT);
  }
  if (current !== 1) {
    throw new Error(`Invalid order`);
  }
  return { logTable, expTable };
}

const { logTable, expTable } = initTables();
