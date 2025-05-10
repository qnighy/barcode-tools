import path from "node:path";
import { test } from "vitest";
import { canny } from "./find";
import { PNGFixtures } from "./png-helper";

const fixtures = new PNGFixtures(path.join(__dirname, "./fixtures"));

test("canny edge detection", async () => {
  const png = await fixtures.readPNG("qr-test1-small.png");
  canny(
    png.width,
    png.height,
    new Uint8ClampedArray(
      png.data.buffer as ArrayBuffer,
      png.data.byteOffset,
      png.data.length
    )
  );

  await fixtures.expectPNG("qr-test1-small-canny.png", png);
});
