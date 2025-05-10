import path from "node:path";
import { test } from "vitest";
import { canny } from "./find";
import { PNGFixtures } from "./png-helper";

const fixtures = new PNGFixtures(path.join(__dirname, "./fixtures"));

test("canny edge detection", async () => {
  const input = await fixtures.readPNG("qr-test1-small.png");
  canny(
    input.width,
    input.height,
    input.array,
  );

  await fixtures.expectPNG("qr-test1-small-canny.png", input);
});
