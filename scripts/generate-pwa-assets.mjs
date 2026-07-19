import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const sourceLogo = path.join(rootDir, "logo ppc oficial.png");
const outputDir = path.join(rootDir, "public", "pwa");

const white = { r: 255, g: 255, b: 255, alpha: 1 };

const icons = [
  { name: "favicon-16.png", size: 16, padding: 0, background: white },
  { name: "favicon-32.png", size: 32, padding: 0, background: white },
  { name: "apple-touch-icon-152.png", size: 152, padding: 14, background: white },
  { name: "apple-touch-icon-167.png", size: 167, padding: 16, background: white },
  { name: "apple-touch-icon-180.png", size: 180, padding: 18, background: white },
  { name: "ppc-logo-192.png", size: 192, padding: 12, background: white },
  { name: "ppc-logo-512.png", size: 512, padding: 34, background: white },
  { name: "ppc-logo-maskable-192.png", size: 192, padding: 34, background: white },
  { name: "ppc-logo-maskable-512.png", size: 512, padding: 90, background: white },
];

async function createLogoBuffer(size) {
  return sharp(sourceLogo)
    .resize(size + 8, size + 8, { fit: "contain" })
    .extract({ left: 4, top: 4, width: size, height: size })
    .png()
    .toBuffer();
}

async function createIcon({ name, size, padding, background }) {
  const innerSize = size - padding * 2;
  const logoBuffer = await createLogoBuffer(innerSize);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toFile(path.join(outputDir, name));
}

async function createSplashLogo() {
  const size = 512;
  const logoBuffer = await createLogoBuffer(300);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 253, b: 248, alpha: 1 },
    },
  })
    .composite([{ input: logoBuffer, gravity: "center" }])
    .png()
    .toFile(path.join(outputDir, "splash-logo.png"));
}

await fs.mkdir(outputDir, { recursive: true });

await Promise.all(icons.map(createIcon));
await createSplashLogo();

console.log(`Generated ${icons.length + 1} PWA assets in ${path.relative(rootDir, outputDir)}`);
