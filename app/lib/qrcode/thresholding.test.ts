import path from "node:path";
import { test } from "vitest";
import { fromThresholded, threshold, thresholdAuto } from "./thresholding";
import { PNGFixtures } from "./png-helper";
import { toLuminances } from "./image";

const fixtures = new PNGFixtures(path.join(__dirname, "./fixtures"));

test("image auto thresholding", async () => {
  const input = await fixtures.readPNG("qr-test2.png");
  const luminances = toLuminances(input);
  const thresholded = thresholdAuto(luminances);

  await fixtures.expectPNG("qr-test2-thresholded-auto.png", fromThresholded(thresholded));
});

test("image thresholding (gaussianSigma = 32)", async () => {
  const input = await fixtures.readPNG("qr-test1-small.png");
  const luminances = toLuminances(input);
  const thresholded = threshold(luminances, 32);

  await fixtures.expectPNG("qr-test1-small-thresholded-32.png", fromThresholded(thresholded));
});

test("image thresholding (gaussianSigma = 256)", async () => {
  const input = await fixtures.readPNG("qr-test1-small.png");
  const luminances = toLuminances(input);
  const thresholded = threshold(luminances, 256);

  await fixtures.expectPNG("qr-test1-small-thresholded-256.png", fromThresholded(thresholded));
});
