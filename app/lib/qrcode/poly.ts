import { add, addExponents, exp, GF256, inv, log, LogGF256, mul, mulExponent, ONE, sub, ZERO } from "./gf256";

export class UncorrectableBlockError extends Error {
  static {
    this.prototype.name = "UncorrectableBlockError";
  }
}

export type CorrectErrorsOptions = {
  /** Number of ECC codewords to reserve for error detection */
  p: number;
};

/**
 * A divisor polynomial for GF(256)-based Reed-Solomon coding.
 */
export class RSPolynomial {
  readonly nonLeadingLogCoefficients: readonly LogGF256[];

  constructor(coefficients: readonly GF256[]) {
    if (coefficients.length === 0) {
      throw new Error("Coefficients cannot be empty");
    }
    if (coefficients[coefficients.length - 1] !== 1) {
      throw new Error("Leading coefficient must be 1");
    }
    const nonLeadingLogCoefficients = Object.freeze<readonly LogGF256[]>(
      coefficients.slice(0, coefficients.length - 1).map((c) => log(c))
    );
    this.nonLeadingLogCoefficients = nonLeadingLogCoefficients;
    Object.freeze(this);
  }

  /**
   * Generates the Reed-Solomon code for the given data.
   * @param block the input/output buffer.
   *              the first `block.length - degree` bytes are
   *              the input data, and the last `degree` bytes are
   *              the buffer for the Reed-Solomon code.
   */
  generate(block: Uint8Array): void {
    const degree = this.nonLeadingLogCoefficients.length;
    if (block.length < degree) {
      throw new RangeError("Buffer too small");
    }
    const inputLength = block.length - degree;
    const output = block.subarray(inputLength);
    output.fill(0);
    for (const dataByte of block.subarray(0, inputLength)) {
      const topCoeff = add(dataByte as GF256, output[0] as GF256);
      const logTopCoeff = log(topCoeff);
      for (let j = 0; j < degree - 1; j++) {
        output[j] = add(
          output[j + 1] as GF256,
          exp(addExponents(logTopCoeff, this.nonLeadingLogCoefficients[degree - 1 - j]))
        );
      }
      output[degree - 1] = exp(addExponents(logTopCoeff, this.nonLeadingLogCoefficients[0]));
    }
  }
}

const MAX_DEGREE = 68;
const ALPHA = 2 as GF256;
function generatePolynomials(): readonly RSPolynomial[] {
  const coefficients: GF256[] = [ONE];
  const polynomials: RSPolynomial[] = [];
  const logAlpha = log(ALPHA);
  let logPowerOfAlpha = log(ONE);
  while (polynomials.length <= MAX_DEGREE) {
    polynomials.push(new RSPolynomial(coefficients));

    const k = coefficients.length;
    coefficients.push(ONE);
    for (let i = k - 1; i >= 0; i--) {
      if (i > 0) {
        coefficients[i] = add(coefficients[i - 1], exp(addExponents(logPowerOfAlpha, log(coefficients[i]))));
      } else {
        coefficients[i] = exp(addExponents(logPowerOfAlpha, log(coefficients[i])));
      }
    }

    logPowerOfAlpha = addExponents(logPowerOfAlpha, logAlpha);
  }
  Object.freeze(polynomials);
  return polynomials;
}

export const POLYNOMIALS: readonly RSPolynomial[] = generatePolynomials();

export function correctErrors(degree: number, block: Uint8Array, options: CorrectErrorsOptions): void {
  const { p } = options;

  if (degree > MAX_DEGREE) {
    throw new RangeError("Degree too large");
  } else if (block.length < degree) {
    throw new RangeError("Buffer too small");
  } else if (p > degree) {
    throw new RangeError("Insufficient ECC codewords");
  }

  const syndromes = computeSyndromes(degree, block);
  // console.log("Syndromes:", syndromes);
  const errorLocations = findErrorLocations(block, degree - p, syndromes);
  // console.log("Error locations:", errorLocations);
  const errorValues = findErrorValues(degree, block, syndromes, errorLocations);
  // console.log("Error values:", errorValues);
  for (const [errorLocation, errorValue] of errorValues) {
    const pos = block.length - 1 - errorLocation;
    block[pos] = sub(block[pos] as GF256, errorValue as GF256);
  }
}

function computeSyndromes(
  degree: number,
  block: Uint8Array,
): Uint8Array {
  const syndromes = new Uint8Array(degree);
  const logAlpha = log(ALPHA);
  for (let i = 0; i < degree; i++) {
    syndromes[i] = evaluatePoly(block, mulExponent(logAlpha, i));
  }
  return syndromes;
}

function findErrorLocations(
  block: Uint8Array,
  errorCorrectionCapability: number,
  syndromes: Uint8Array,
): number[] {
  const coeffs = computeLFSR(syndromes.subarray(0, errorCorrectionCapability));
  // console.log("Coefficients:", coeffs);
  const logAlpha = log(ALPHA);
  const errorLocations: number[] = [];
  for (let i = 0; i < block.length; i++) {
    const logX = mulExponent(logAlpha, i);
    const result = evaluatePoly(coeffs, logX);
    if (result === ZERO) {
      errorLocations.push(i);
    }
  }
  if (errorLocations.length * 2 > errorCorrectionCapability) {
    return [];
  }
  return errorLocations;
}

// Berlekamp-Massey
//
// This is to find the shortest vector that annihilates
// every window of the input sequence (i.e. the dot product is zero).
//
// In other words, it finds the smallest non-trivial vector in the kernel of
// a maximal matrix of the following staircase-shaped layout:
//
// S0  S1  S2  S3  S4
// S1  S2  S3  S4
// S2  S3  S4
// S3  S4
// S4
//
function computeLFSR(syndromes: Uint8Array): Uint8Array {
  const maxDegree = Math.ceil(syndromes.length / 2);
  const coeffs = new Uint8Array(maxDegree + 1);
  coeffs[0] = 1;
  let degree = 0;
  const prevCoeffs = new Uint8Array(maxDegree + 1);
  prevCoeffs[0] = 1;
  let prevDegree = 0;
  const tmpCoeffs = new Uint8Array(maxDegree + 1);
  let level = 1;

  for (let i = 0; i < syndromes.length; i++) {
    let discrepancy = 0 as GF256;
    for (let j = 0; j <= degree; j++) {
      discrepancy = add(discrepancy, mul(coeffs[j] as GF256, syndromes[i - j] as GF256));
    }

    if (discrepancy === 0) {
      level++;
    } else if (degree * 2 <= i) {
      const tmpDegree = degree;
      tmpCoeffs.set(coeffs.subarray(0, degree + 1));

      for (let j = 0; j <= prevDegree; j++) {
        coeffs[j + level] = sub(coeffs[j + level] as GF256, mul(discrepancy, prevCoeffs[j] as GF256));
      }
      degree = i + 1 - degree;

      const invDiscrepancy = inv(discrepancy);
      for (let j = 0; j <= tmpDegree; j++) {
        prevCoeffs[j] = mul(tmpCoeffs[j] as GF256, invDiscrepancy);
      }
      prevDegree = tmpDegree;
      level = 1;
    } else {
      for (let j = 0; j <= prevDegree; j++) {
        coeffs[j + level] = sub(coeffs[j + level] as GF256, mul(discrepancy, prevCoeffs[j] as GF256));
      }
      level++;
    }
  }
  return coeffs.slice(0, degree + 1);
}

function findErrorValues(
  degree: number,
  block: Uint8Array,
  syndromes: Uint8Array,
  errorLocations: readonly number[]
): [number, GF256][] {
  if (degree < errorLocations.length) {
    throw new UncorrectableBlockError();
  }

  // Gaussian elimination on
  // [ α^{j0*0} α^{j1*0} α^{j2*0} α^{j3*0} S0 ]
  // [ α^{j0*1} α^{j1*1} α^{j2*1} α^{j3*1} S1 ]
  // [ α^{j0*2} α^{j1*2} α^{j2*2} α^{j3*2} S2 ]
  // [ α^{j0*3} α^{j1*3} α^{j2*3} α^{j3*3} S3 ]
  // [ α^{j0*4} α^{j1*4} α^{j2*4} α^{j3*4} S4 ]
  // to get
  // [ 1 0 0 0 Y0 ]
  // [ 0 1 0 0 Y1 ]
  // [ 0 0 1 0 Y2 ]
  // [ 0 0 0 1 Y3 ]
  // [ 0 0 0 0  0 ]
  const width = errorLocations.length + 1;
  const mat = new Uint8Array(width * degree);

  // Initialize the matrix
  const logAlpha = log(ALPHA);
  for (let y = 0; y < degree; y++) {
    for (let x = 0; x < errorLocations.length; x++) {
      mat[y * width + x] = exp(mulExponent(logAlpha, y * errorLocations[x]));
    }
    mat[y * width + errorLocations.length] = syndromes[y];
  }

  // Do an elimination
  for (let y = 0; y < errorLocations.length; y++) {
    const xBase = y;
    // Find non-zero row
    let yNZ = y;
    for (let y2 = y; y2 < degree; y2++) {
      if (mat[y2 * width + xBase] !== 0) {
        yNZ = y2;
        break;
      }
    }
    if (mat[yNZ * width + xBase] === 0) {
      throw new UncorrectableBlockError("Insufficient rank");
    }

    // Swap and normalize
    const diagFactor = inv(mat[yNZ * width + xBase] as GF256);
    if (yNZ === y) {
      for (let x = xBase; x < width; x++) {
        const val = mat[y * width + x] as GF256;
        mat[y * width + x] = mul(val, diagFactor);
      }
    } else {
      for (let x = xBase; x < width; x++) {
        const val0 = mat[y * width + x] as GF256;
        const val1 = mat[yNZ * width + x] as GF256;
        mat[y * width + x] = mul(val1, diagFactor);
        mat[yNZ * width + x] = val0;
      }
    }

    // Eliminate other rows
    for (let y2 = 0; y2 < degree; y2++) {
      if (y2 === y) {
        continue;
      }
      const factor = mat[y2 * width + xBase] as GF256;
      for (let x = xBase; x < width; x++) {
        mat[y2 * width + x] = sub(mat[y2 * width + x] as GF256, mul(factor, mat[y * width + x] as GF256));
      }
    }
  }
  for (let y = errorLocations.length; y < degree; y++) {
    if (mat[y * width + errorLocations.length] !== 0) {
      throw new UncorrectableBlockError("No solution in the equation");
    }
  }
  return errorLocations.map((errorLocation, y) => [
    errorLocation,
    mat[y * width + errorLocations.length] as GF256
  ]);
}

function evaluatePoly(block: Uint8Array, logX: LogGF256): GF256 {
  let result = ZERO;
  for (const coeff of block) {
    // result = result * x + coeff
    result = exp(addExponents(log(result), logX));
    result = add(result, coeff as GF256);
  }
  return result;
}
