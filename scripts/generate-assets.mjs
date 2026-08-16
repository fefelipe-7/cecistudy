#!/usr/bin/env node
/**
 * Regenera todos os assets de ícone/splash do cecistudy a partir de
 * `assets/new icon.jpeg` e rasteriza as expressões da bonequinha (Hello Kitty)
 * de `assets/hello_kitty_expressoes_svgs/` para `src/assets/kitty/*.png`.
 *
 * Alvos:
 *  - Web/PWA:        public/icon.png, public/icon-192.png, public/icons/icon-*.webp
 *  - Android:        mipmaps ic_launcher{,_round,_foreground,_background}
 *                    + buckets de splash (drawable splashes) + ic_launcher.xml
 *  - iOS:            AppIcon-512@2x.png (1024) + Splash.imageset (2732²)
 *  - Bonequinha:     src/assets/kitty/<emoção>.png (512², PNG otimizado)
 *
 * Uso: npm run assets   (ou: node scripts/generate-assets.mjs)
 * Requer: sharp (devDependency).
 */
import sharp from 'sharp';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICON_SRC = join(root, 'assets', 'new icon.jpeg');
const KITTY_DIR = join(root, 'assets', 'hello_kitty_expressoes_svgs');

const ANDROID_RES = join(root, 'android', 'app', 'src', 'main', 'res');
const IOS_XCASSETS = join(root, 'ios', 'App', 'App', 'Assets.xcassets');

const MIPMAP_SIZES = {
  'mipmap-ldpi': 36,
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Expressões → nome do arquivo SVG (e do PNG gerado)
const KITTY_EXPRESSIONS = [
  'apaixonada', 'curiosa', 'decepcionada', 'feliz', 'nervosa', 'pensativa',
  'rindo', 'sonolenta', 'surpresa', 'triste', 'zangada',
];

const log = (...a) => console.log(...a);

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

/** Composição da splash: fundo creme cheio + ícone centralizado a X% da menor dimensão. */
async function renderSplash(width, height) {
  const iconSize = Math.round(Math.min(width, height) * 0.38);
  const icon = await sharp(ICON_SRC).resize(iconSize, iconSize).png().toBuffer();
  return sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 252, b: 248 } },
  })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function generateWeb() {
  log('→ web/pwa (public/)');
  const iconPng = await sharp(ICON_SRC).resize(512, 512).png().toBuffer();
  const icon192 = await sharp(ICON_SRC).resize(192, 192).png().toBuffer();
  writeFileSync(join(root, 'public', 'icon.png'), iconPng);
  writeFileSync(join(root, 'public', 'icon-192.png'), icon192);

  ensureDir(join(root, 'public', 'icons'));
  for (const size of [48, 72, 96, 128, 192, 256, 512]) {
    const buf = await sharp(ICON_SRC).resize(size, size).webp({ quality: 85 }).toBuffer();
    writeFileSync(join(root, 'public', 'icons', `icon-${size}.webp`), buf);
  }
}

async function generateAndroid() {
  log('→ android (mipmaps + splash)');
  const iconPng = await sharp(ICON_SRC).png().toBuffer();
  for (const [bucket, size] of Object.entries(MIPMAP_SIZES)) {
    const dir = join(ANDROID_RES, bucket);
    ensureDir(dir);
    const resized = await sharp(iconPng).resize(size, size).png().toBuffer();
    writeFileSync(join(dir, 'ic_launcher.png'), resized);
    writeFileSync(join(dir, 'ic_launcher_round.png'), resized);
    // Full-bleed: fundo = JPEG inteiro; foreground transparente
    writeFileSync(join(dir, 'ic_launcher_background.png'), resized);
    const transparent = await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).png().toBuffer();
    writeFileSync(join(dir, 'ic_launcher_foreground.png'), transparent);
  }

  // Splash buckets: redimensiona para cada pasta drawable-* existente
  for (const dir of readdirSync(ANDROID_RES)) {
    if (!dir.startsWith('drawable')) continue;
    const bucketDir = join(ANDROID_RES, dir);
    const target = join(bucketDir, 'splash.png');
    if (!existsSync(target)) continue;
    const meta = await sharp(target).metadata();
    const buf = await renderSplash(meta.width, meta.height);
    writeFileSync(target, buf);
  }

  // Adaptativo full-bleed: sem inset, fundo preenche a máscara (máscara corta bordas)
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;
  writeFileSync(join(ANDROID_RES, 'mipmap-anydpi-v26', 'ic_launcher.xml'), xml);
}

async function generateIos() {
  log('→ ios (AppIcon + splash)');
  const appIcon = await sharp(ICON_SRC).resize(1024, 1024).png().toBuffer();
  writeFileSync(
    join(IOS_XCASSETS, 'AppIcon.appiconset', 'AppIcon-512@2x.png'),
    appIcon,
  );

  const splashDir = join(IOS_XCASSETS, 'Splash.imageset');
  const splash = await renderSplash(2732, 2732);
  for (const f of readdirSync(splashDir)) {
    if (f.endsWith('.png')) writeFileSync(join(splashDir, f), splash);
  }
}

async function generateKitty() {
  log('→ bonequinha (src/assets/kitty/)');
  const outDir = join(root, 'src', 'assets', 'kitty');
  ensureDir(outDir);
  for (const name of KITTY_EXPRESSIONS) {
    const svg = join(KITTY_DIR, `hello_kitty_${name}.svg`);
    const buf = await sharp(svg).resize(512, 512).png({ compressionLevel: 9 }).toBuffer();
    writeFileSync(join(outDir, `${name}.png`), buf);
    log(`  ✓ ${name}.png (${(buf.length / 1024).toFixed(0)}KB)`);
  }
}

async function main() {
  if (!existsSync(ICON_SRC)) throw new Error(`fonte do ícone não encontrada: ${ICON_SRC}`);
  await generateWeb();
  await generateAndroid();
  await generateIos();
  await generateKitty();
  log('prontinho ♡ assets regenerados');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});