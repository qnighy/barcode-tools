import path from "node:path";
import fs from "node:fs";
import { test } from "vitest";
import { PNG } from "pngjs";
import { threshold } from "./thresholding";

test("image thresholding (gaussianSigma = 32)", async () => {
  const data = await fs.promises.readFile(
    path.join(__dirname, "./fixtures/qr-test1-small.png")
  );
  const png = await new Promise<PNG>((resolve, reject) => {
    new PNG({ filterType: 4 }).parse(data, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
  console.log(png.gamma);
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

  await new Promise<void>((resolve, reject) => {
    png.pack().pipe(
      fs.createWriteStream(path.join(__dirname, "./fixtures/qr-test1-small-thresholded-32.png"))
    ).on("finish", () => {
      resolve();
    }).on("error", (error) => {
      reject(error);
    });
  });
});

test("image thresholding (gaussianSigma = 256)", async () => {
  const data = await fs.promises.readFile(
    path.join(__dirname, "./fixtures/qr-test1-small.png")
  );
  const png = await new Promise<PNG>((resolve, reject) => {
    new PNG({ filterType: 4 }).parse(data, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
  console.log(png.gamma);
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

  await new Promise<void>((resolve, reject) => {
    png.pack().pipe(
      fs.createWriteStream(path.join(__dirname, "./fixtures/qr-test1-small-thresholded-256.png"))
    ).on("finish", () => {
      resolve();
    }).on("error", (error) => {
      reject(error);
    });
  });
});
