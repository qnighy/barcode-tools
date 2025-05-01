import { expect, test } from "vitest";
import { fitBytes } from "./fitting";


test("1-H digit example", () => {
  const result = fitBytes(
    new TextEncoder().encode("01234567"),
    { errorCorrectionLevel: "H" },
  );
  expect(result.version).toEqual(1);
  expect(result.errorCorrectionLevel).toEqual("H");
  expect([...result.bits]).toEqual([
    0, 0, 0, 1,
    0, 0, 0, 0, 0, 0, 1, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
    0, 1, 0, 1, 0, 1, 1, 0, 0, 1,
    1, 0, 0, 0, 0, 1, 1,
    0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 0, 1, 1, 0, 0,
    0, 0 ,0, 1, 0, 0, 0, 1,
    1, 1, 1, 0, 1, 1, 0, 0,
  ]);
});

test("M3-M digit example", () => {
  const result = fitBytes(
    new TextEncoder().encode("0123456789012345"),
    { errorCorrectionLevel: "M", allowMicroQR: true },
  );
  expect(result.version).toEqual("M3");
  expect(result.errorCorrectionLevel).toEqual("M");
  expect([...result.bits]).toEqual([
    0, 0,
    1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 0, 0,
    0, 1, 0, 1, 0, 1, 1, 0, 0, 1,
    1, 0, 1, 0, 1, 0, 0, 1, 1, 0,
    1, 1, 1, 0, 0, 0, 0, 1, 0, 1,
    0, 0, 1, 1, 1, 0, 1, 0, 1, 0,
    0, 1, 0, 1,
    0, 0, 0, 0, 0, 0, 0,
  ]);
});
