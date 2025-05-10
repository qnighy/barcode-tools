import path from "node:path";
import fs from "node:fs";
import { PackerOptions, ParserOptions, PNG } from "pngjs";
import { Uint8x4Image, VectorImage } from "./image";

export class PNGFixtures {
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  pathFor(filename: string): string {
    return path.join(this.basePath, filename);
  }

  newPathFor(filename: string): string {
    if (!/\.png$/.test(filename)) {
      throw new Error(`Filename must end with .png: ${filename}`);
    }
    const newFilename = filename.replace(/\.png$/, `.new.png`);
    return this.pathFor(newFilename);
  }

  async readPNG(filename: string, options: ParserOptions = {}): Promise<Uint8x4Image> {
    return await readPNG(this.pathFor(filename), options);
  }

  async writePNG(filename: string, image: Uint8x4Image, options: PackerOptions = {}): Promise<void> {
    await writePNG(this.pathFor(filename), image, options);
  }

  async writeNewPNG(filename: string, image: Uint8x4Image, options: PackerOptions = {}): Promise<void> {
    await writePNG(this.newPathFor(filename), image, options);
  }

  async expectPNG(filename: string, image: Uint8x4Image): Promise<void> {
    const expectPath = this.pathFor(filename);
    const newPath = this.newPathFor(filename);
    if (!fs.existsSync(expectPath)) {
      await writePNG(expectPath, image);
      return;
    }
    const expected = await readPNG(expectPath);
    if (
      image.width !== expected.width ||
      image.height !== expected.height ||
      image.numComponents !== expected.numComponents
    ) {
      await this.writeNewPNG(filename, image);
      throw new Error(`PNG dimensions do not match for ${filename}: ${image.width}x${image.height}x${image.numComponents} vs ${expected.width}x${expected.height}x${expected.numComponents}`);
    }
    const arrayMatch =
      image.array.length === expected.array.length &&
      image.array.every((value, index) => value === expected.array[index]);
    if (!arrayMatch) {
      await this.writeNewPNG(filename, image);
      throw new Error(`PNG data does not match for ${filename}`);
    }
    if (fs.existsSync(newPath)) {
      await fs.promises.unlink(newPath);
    }
  }
}

export async function readPNG(filepath: string, options: ParserOptions = {}): Promise<Uint8x4Image> {
  const data = await fs.promises.readFile(filepath);
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.length);
  const png = PNG.sync.read(buffer, options);
  return new VectorImage(
    png.width,
    png.height,
    4,
    new Uint8ClampedArray(png.data.buffer as ArrayBuffer, png.data.byteOffset, png.data.length)
  );
}

export async function writePNG(filepath: string, image: Uint8x4Image, options: PackerOptions = {}): Promise<void> {
  if (image.numComponents !== 4) {
    throw new RangeError('Image must have 4 components per pixel');
  }
  const png = new PNG({
    width: image.width,
    height: image.height,
  });
  png.data = Buffer.from(image.array.buffer, image.array.byteOffset, image.array.length);
  const buffer = PNG.sync.write(png, options);
  await fs.promises.writeFile(filepath, buffer);
}
