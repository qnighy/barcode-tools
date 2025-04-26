/**
 * GF(256) arithmetic as in QR code, representing GF(256) as a residue field
 * GF(2)[x]/(x^8 + x^4 + x^3 + x^2 + 1).
 *
 * Note that the Rijndael (AES) uses a different representation
 * GF(2)[x]/(x^8 + x^4 + x^3 + x + 1).
 */

/**
 * Multiply two GF(256) elements using representation
 * GF(2)[x]/(x^8 + x^4 + x^3 + x^2 + 1).
 *
 * The value is an integer in the range [0, 255],
 * whose each bit represents a coefficient of the polynomial.
 */
export type GF256 = number & { __brand: "GF256" };
/**
 * The logarithm of a GF(256) element.
 *
 * An integer between 0 and 254, inclusive, represents
 * the value log_α(value), where α is the canonical primitive root.
 *
 * The sentinel value {@link LOG_ZERO} (which is 255) represents
 * the special value log_α(0).
 */
export type LogGF256 = number & { __brand: "LogGF256" };

const PRIMITIVE_POLYNOMIAL = 0x11D; // x^8 + x^4 + x^3 + x^2 + 1
/**
 * The canonical primitive root (called α) used throughout the QR code standard.
 */
export const PRIMITIVE_ROOT = 2 as GF256;
/**
 * A sentinel value for log(0)
 */
export const LOG_ZERO = 255 as LogGF256;

export const ZERO: GF256 = 0 as GF256;

/**
 * The sum of two GF(256) elements.
 */
export function add(x: GF256, y: GF256): GF256 {
  return (x ^ y) as GF256;
}

/**
 * You don't need to use this. Simply write `x` to get the negation.
 */
export function neg(x: GF256): GF256 {
  return x;
}

export const ONE = 1 as GF256;

/**
 * The product of two GF(256) elements.
 */
export function mul(x: GF256, y: GF256): GF256 {
  return exp(addExponents(log(x), log(y)));
}

/**
 * Compute the multiplicative inverse of a GF(256) element,
 * or zero if the input is zero.
 */
export function inv(x: GF256): GF256 {
  return exp(negExponent(log(x)));
}

/**
 * Represents the GF(256) element as the power of α.
 *
 * If the input is zero, returns {@link LOG_ZERO} sentinel value.
 */
export function log(x: GF256): LogGF256 {
  return logTable[x];
}

/**
 * Computs the power of α with the given exponent, or
 * zero if the input is {@link LOG_ZERO} sentinel value.
 */
export function exp(x: LogGF256): GF256 {
  return expTable[x];
}

export function addExponents(x: LogGF256, y: LogGF256): LogGF256 {
  if (x === LOG_ZERO || y === LOG_ZERO) {
    return LOG_ZERO;
  }
  return (x + y) % 255 as LogGF256;
}

export function negExponent(x: LogGF256): LogGF256 {
  if (x === LOG_ZERO) {
    return LOG_ZERO;
  }
  return ((255 - x) % 255) as LogGF256;
}

/**
 * Naively multiply two GF(256) elements using representation
 * GF(2)[x]/(x^8 + x^4 + x^3 + x^2 + 1).
 */
function mulNaive(x: GF256, y: GF256): GF256 {
  let z = 0;
  for (let i = 0; i < 8; i++) {
    const bit = (y >> (7 - i)) & 1;
    z = (z << 1) ^ ((-bit) & x);
    z = z ^ ((-(z >> 8)) & PRIMITIVE_POLYNOMIAL);
  }
  return z as GF256;
}

function initTables(): {
  logTable: LogGF256[];
  expTable: GF256[];
} {
  const logTable = Array.from({ length: 256 }, () => LOG_ZERO);
  const expTable = Array.from({ length: 256 }, () => ZERO);
  let current = ONE;
  for (let i = 0; i < 255; i++) {
    if (logTable[current] !== LOG_ZERO) {
      throw new Error(`Invalid order: ${i}`);
    }
    logTable[current] = i as LogGF256;
    expTable[i] = current as GF256;
    current = mulNaive(current, PRIMITIVE_ROOT);
  }
  if (current !== 1) {
    throw new Error(`Invalid order`);
  }
  expTable[LOG_ZERO] = ZERO;
  return { logTable, expTable };
}

const { logTable, expTable } = initTables();
