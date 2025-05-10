import path from "node:path";
import { test } from "vitest";
import { fromThresholded, threshold, toLuminances } from "./thresholding";
import { PNGFixtures } from "./png-helper";
import { PNG } from "pngjs";

const fixtures = new PNGFixtures(path.join(__dirname, "./fixtures"));

test("image thresholding (gaussianSigma = 32)", async () => {
  const png = await fixtures.readPNG("qr-test1-small.png");
  const luminances = toLuminances(
    png.width,
    png.height,
    new Uint8ClampedArray(
      png.data.buffer as ArrayBuffer,
      png.data.byteOffset,
      png.data.length
    )
  );
  const thresholded = fromThresholded(threshold(luminances, 32));
  const output = new PNG({
    width: png.width,
    height: png.height,
  });
  output.data.set(thresholded);

  await fixtures.expectPNG("qr-test1-small-thresholded-32.png", output);
});

test("image thresholding (gaussianSigma = 256)", async () => {
  const png = await fixtures.readPNG("qr-test1-small.png");
  const luminances = toLuminances(
    png.width,
    png.height,
    new Uint8ClampedArray(
      png.data.buffer as ArrayBuffer,
      png.data.byteOffset,
      png.data.length
    )
  );
  const thresholded = fromThresholded(threshold(luminances, 256));
  const output = new PNG({
    width: png.width,
    height: png.height,
  });
  output.data.set(thresholded);

  await fixtures.expectPNG("qr-test1-small-thresholded-256.png", output);
});
