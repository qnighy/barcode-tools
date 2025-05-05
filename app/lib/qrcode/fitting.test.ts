import { expect, test } from "vitest";
import { fitBytes } from "./fitting";
import { Bits } from "./bit-writer";


test("1-H digit example", () => {
  const result = fitBytes(
    new TextEncoder().encode("01234567"),
    { minErrorCorrectionLevel: "H" },
  );
  expect(result.version).toEqual(1);
  expect(result.errorCorrectionLevel).toEqual("H");
  expect(result.bits).toEqual({
    bitLength: 72,
    bytes: new Uint8Array([
      // mode  0001
      // size      0000(001000)
      0b00010000,
      // ...   001000
      // chunk       00(00001100)
      0b00100000,
      // ...   00001100
      0b00001100,
      // chunk 01010110(01)
      0b01010110,
      // ...   01
      // chunk   100001(1)
      0b01100001,
      // ...   1
      // term   0000
      // fill       000
      0b10000000,
      // fill  11101100
      0b11101100,
      // fill  00010001
      0b00010001,
      // fill  11101100
      0b11101100,
    ]),
  } satisfies Bits);
});

test("M3-M digit example", () => {
  const result = fitBytes(
    new TextEncoder().encode("0123456789012345"),
    { minErrorCorrectionLevel: "M", allowMicroQR: true },
  );
  expect(result.version).toEqual("M3");
  expect(result.errorCorrectionLevel).toEqual("M");
  expect(result.bits).toEqual({
    bitLength: 68,
    bytes: new Uint8Array([
      // mode  00
      // size    10000
      // chunk        0(000001100)
      0b00100000,
      // ...   00000110(0)
      0b00000110,
      // ...   0
      // chunk  0101011(001)
      0b00101011,
      // ...   001
      // chunk    10101(00110)
      0b00110101,
      // ...   00110
      // chunk      111(0000101)
      0b00110111,
      // ...   0000101
      // chunk        0(011101010)
      0b00001010,
      // ...   01110101(0)
      0b01110101,
      // ...   0
      // chunk  0101
      // term       000(0000)
      0b00101000,
      // ...   0000
      // pad       0000
      0b00000000,
    ]),
  } satisfies Bits);
});
