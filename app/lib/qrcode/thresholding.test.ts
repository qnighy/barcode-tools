import path from "node:path";
import { test } from "vitest";
import { threshold } from "./thresholding";
import { PNGFixtures } from "./png-helper";

const fixtures = new PNGFixtures(path.join(__dirname, "./fixtures"));

test("image thresholding (gaussianSigma = 32)", async () => {
  const png = await fixtures.readPNG("qr-test1-small.png");
  threshold(
    png.width,
    png.height,
    new Uint8ClampedArray(
      png.data.buffer as ArrayBuffer,
      png.data.byteOffset,
      png.data.length
    ),
    32
  );

  await fixtures.expectPNG("qr-test1-small-thresholded-32.png", png);
});

test("image thresholding (gaussianSigma = 256)", async () => {
  const png = await fixtures.readPNG("qr-test1-small.png");
  threshold(
    png.width,
    png.height,
    new Uint8ClampedArray(
      png.data.buffer as ArrayBuffer,
      png.data.byteOffset,
      png.data.length
    ),
    256
  );

  await fixtures.expectPNG("qr-test1-small-thresholded-256.png", png);
});
