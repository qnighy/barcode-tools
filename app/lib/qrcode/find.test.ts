import path from "node:path";
import { test } from "vitest";
import { canny, find } from "./find";
import { PNGFixtures } from "./png-helper";
import { toLuminances } from "./image";

const fixtures = new PNGFixtures(path.join(__dirname, "./fixtures"));

test("finder pattern lookup", async () => {
  const input = await fixtures.readPNG("qr-test1-small.png");
  const luminances = toLuminances(input);
  const output = find(luminances);

  await fixtures.expectPNG("qr-test1-small-find.png", output);
});

test("canny edge detection", async () => {
  const input = await fixtures.readPNG("qr-test1-small.png");
  canny(
    input.width,
    input.height,
    input.array,
  );

  await fixtures.expectPNG("qr-test1-small-canny.png", input);
});
