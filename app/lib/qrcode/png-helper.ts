import path from "node:path";
import fs from "node:fs";
import { PackerOptions, ParserOptions, PNG, PNGWithMetadata } from "pngjs";

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

  async readPNG(filename: string, options: ParserOptions = {}): Promise<PNGWithMetadata> {
    const data = await fs.promises.readFile(this.pathFor(filename));
    const buffer = Buffer.from(data.buffer, data.byteOffset, data.length);
    return PNG.sync.read(buffer, options);
  }

  async writePNG(filename: string, png: PNG, options: PackerOptions = {}): Promise<void> {
    const buffer = PNG.sync.write(png, options);
    await fs.promises.writeFile(this.pathFor(filename), buffer);
  }

  async writeNewPNG(filename: string, png: PNG, options: PackerOptions = {}): Promise<void> {
    const buffer = PNG.sync.write(png, options);
    await fs.promises.writeFile(this.newPathFor(filename), buffer);
  }

  async expectPNG(filename: string, png: PNG): Promise<void> {
    const expectPath = this.pathFor(filename);
    const newPath = this.newPathFor(filename);
    if (!fs.existsSync(expectPath)) {
      await this.writePNG(filename, png);
      return;
    }
    const expected = await this.readPNG(filename);
    if (png.width !== expected.width || png.height !== expected.height) {
      await this.writeNewPNG(filename, png);
      throw new Error(`PNG dimensions do not match for ${filename}: ${png.width}x${png.height} vs ${expected.width}x${expected.height}`);
    }
    if (!png.data.equals(expected.data)) {
      await this.writeNewPNG(filename, png);
      throw new Error(`PNG data does not match for ${filename}`);
    }
    if (fs.existsSync(newPath)) {
      await fs.promises.unlink(newPath);
    }
  }
}
