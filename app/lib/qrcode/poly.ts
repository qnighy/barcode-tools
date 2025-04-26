import { add, addExponents, exp, GF256, log, LogGF256, ONE } from "./gf256";

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
      throw new Error("Buffer too small");
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
