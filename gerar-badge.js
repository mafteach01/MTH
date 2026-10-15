const sharp = require("sharp");
const path = require("path");

async function main() {
  const input = path.join(__dirname, "public", "icon-192.png");
  const output = path.join(__dirname, "public", "icon-badge.png");

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.max(data[i], data[i + 1], data[i + 2]);
    const alpha = Math.min(255, Math.round(lum * 1.6));
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = alpha;
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(96, 96)
    .png()
    .toFile(output);

  console.log("Pronto: public/icon-badge.png");
}

main();