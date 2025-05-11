export function generateImage(
  width: number,
  height: number,
  outputInput: Float32Array<ArrayBuffer>,
  outputOutput: Float32Array<ArrayBuffer>
) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      outputInput[y * width + x] = Math.random();
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      outputOutput[y * width + x] = 0.0;
    }
  }
  const moduleSize = 4;
  const posX = Math.floor(Math.random() * (width - moduleSize * 9 + 1));
  const posY = Math.floor(Math.random() * (height - moduleSize * 9 + 1));
  const darkValue = Math.random() * 0.1;
  const lightValue = Math.random() * 0.1 + 0.9;
  for (let y = 0; y < moduleSize; y++) {
    const my = Math.floor(y / moduleSize);
    for (let x = 0; x < moduleSize; x++) {
      const mx = Math.floor(x / moduleSize);
      const nesting =
        Number(my >= 1 && my < 8 && mx >= 1 && mx < 8) +
        Number(my >= 2 && my < 7 && mx >= 2 && mx < 7) +
        Number(my >= 3 && my < 6 && mx >= 3 && mx < 6);
      outputInput[(posY + y) * width + (posX + x)] = nesting & 1 ? darkValue : lightValue;
      outputOutput[(posY + y) * width + (posX + x)] = 1.0;
    }
  }
}
