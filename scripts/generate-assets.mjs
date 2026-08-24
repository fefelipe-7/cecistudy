#!/usr/bin/env node
/**
 * Regenera todos os assets de ícone/splash do cecistudy a partir de
 * `assets/icon-n.jpeg`, rasteriza os sprites da mascote 3D
 * (`assets/mascote_expressoes_svgs/`) para `src/assets/mascote/*.png`
 * e compõe a splash estática a partir de um frame do vídeo
 * `assets/splash.mp4` (extraído via ffmpeg).
 *
 * Alvos:
 *  - Web/PWA:        public/icon.png, public/icon-192.png, public/icons/icon-*.webp
 *  - Android:        mipmaps ic_launcher{,_round,_foreground,_background}
 *                    + buckets de splash (drawable splashes) + ic_launcher.xml
 *  - iOS:            AppIcon-512@2x.png (1024) + Splash.imageset (2732²)
 *  - Mascote:        src/assets/mascote/<expressão>.png (384², PNG otimizado)
 *
 * Uso: npm run assets   (ou: node scripts/generate-assets.mjs)
 * Requer: sharp + @ffmpeg-installer/ffmpeg (devDependencies).
 */
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICON_SRC = join(root, 'assets', 'icon-n.jpeg');
const MASCOTE_DIR = join(root, 'assets', 'mascote_expressoes_svgs');
const SPLASH_VIDEO = join(root, 'assets', 'splash.mp4');

/** Cor de fundo do vídeo/splash (creme quente da marca). */
const SPLASH_BG = { r: 254, g: 246, b: 235 };

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

// Expressões da mascote usadas no app → sufixo do arquivo SVG em MASCOTE_DIR
const MASCOTE_EXPRESSIONS = [
  'welcome-wave', 'listening-hello', 'focus-ready', 'reading-curious',
  'library-shelf', 'writing-note', 'review-card', 'quiz-ready',
  'correct-soft', 'try-again', 'empty-invite', 'done-calm',
  'celebrate-small', 'class-ready', 'field-prepare', 'supervision-reflect',
  'connection-link', 'research-tcc', 'writing-flow', 'boundaries-care',
  'sync-wait', 'loading-patient', 'no-results', 'pause-kind',
];

const log = (...a) => console.log(...a);

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

/** Ícone do app: imagem full-bleed (o icon-n.jpeg já tem fundo próprio). */
function renderIcon(size) {
  return sharp(ICON_SRC)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toBuffer();
}

/** Extrai um frame do vídeo de splash (ffmpeg) e recorta o conteúdo (mascote + spinner). */
async function extractSplashContent() {
  const frameBuf = execFileSync(
    ffmpegInstaller.path,
    [
      '-y',
      '-ss', '0.67', // ~frame 20: mascote centralizada com spinner
      '-i', SPLASH_VIDEO,
      '-vf', 'scale=1080:1920:flags=lanczos',
      '-frames:v', '1',
      '-f', 'image2pipe', '-vcodec', 'png',
      '-',
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  const trimmed = await sharp(frameBuf)
    .trim({ background: SPLASH_BG, threshold: 16 })
    .png()
    .toBuffer();

  // Feather nas bordas: o vídeo tem gradiente sutil, então o recorte ganha
  // uma máscara de alpha suave para fundir com o fundo chapado da splash.
  const meta = await sharp(trimmed).metadata();
  const feather = Math.max(16, Math.round(Math.min(meta.width, meta.height) * 0.08));
  const inset = Math.round(feather / 2);
  const maskSvg = Buffer.from(
    `<svg width="${meta.width}" height="${meta.height}">` +
      `<rect x="${inset}" y="${inset}" width="${meta.width - inset * 2}" height="${meta.height - inset * 2}" ` +
      `rx="${feather}" ry="${feather}" fill="white"/>` +
    `</svg>`,
  );
  const mask = await sharp(maskSvg).blur(Math.round(feather / 3)).png().toBuffer();

  return sharp(trimmed)
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/** Composição da splash: fundo creme do vídeo + mascote centralizada. */
async function renderSplash(width, height, contentBuf) {
  const contentSize = Math.round(Math.min(width, height) * 0.42);
  const content = await sharp(contentBuf)
    .resize(contentSize, contentSize, { fit: 'inside' })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width, height, channels: 3,
      background: SPLASH_BG,
    },
  })
    .composite([{ input: content, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function generateWeb() {
  log('→ web/pwa (public/)');
  const iconPng = await renderIcon(512);
  const icon192 = await renderIcon(192);
  writeFileSync(join(root, 'public', 'icon.png'), iconPng);
  writeFileSync(join(root, 'public', 'icon-192.png'), icon192);

  ensureDir(join(root, 'public', 'icons'));
  for (const size of [48, 72, 96, 128, 192, 256, 512]) {
    const buf = await renderIcon(size);
    const webp = await sharp(buf).webp({ quality: 85 }).toBuffer();
    writeFileSync(join(root, 'public', 'icons', `icon-${size}.webp`), webp);
  }
}

async function generateAndroid(contentBuf) {
  log('→ android (mipmaps + splash)');
  for (const [bucket, size] of Object.entries(MIPMAP_SIZES)) {
    const dir = join(ANDROID_RES, bucket);
    ensureDir(dir);
    const resized = await renderIcon(size);
    writeFileSync(join(dir, 'ic_launcher.png'), resized);
    writeFileSync(join(dir, 'ic_launcher_round.png'), resized);
    // Adaptativo: fundo desfocado (ambient) + foreground com o ícone em ~70% (transparente ao redor)
    const background = await sharp(ICON_SRC)
      .resize(Math.round(size * 1.5), Math.round(size * 1.5), { fit: 'cover' })
      .blur(Math.max(4, Math.round(size / 24)))
      .resize(size, size)
      .png()
      .toBuffer();
    writeFileSync(join(dir, 'ic_launcher_background.png'), background);
    const iconSize = Math.round(size * 0.7);
    const iconSmall = await sharp(ICON_SRC).resize(iconSize, iconSize, { fit: 'cover' }).png().toBuffer();
    const transparent = await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    }).composite([{ input: iconSmall, gravity: 'centre' }]).png().toBuffer();
    writeFileSync(join(dir, 'ic_launcher_foreground.png'), transparent);
  }

  // Splash buckets: redimensiona para cada pasta drawable-* existente
  for (const dir of readdirSync(ANDROID_RES)) {
    if (!dir.startsWith('drawable')) continue;
    const bucketDir = join(ANDROID_RES, dir);
    const target = join(bucketDir, 'splash.png');
    if (!existsSync(target)) continue;
    const meta = await sharp(target).metadata();
    const buf = await renderSplash(meta.width, meta.height, contentBuf);
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

async function generateIos(contentBuf) {
  log('→ ios (AppIcon + splash)');
  const appIcon = await renderIcon(1024);
  writeFileSync(
    join(IOS_XCASSETS, 'AppIcon.appiconset', 'AppIcon-512@2x.png'),
    appIcon,
  );

  const splashDir = join(IOS_XCASSETS, 'Splash.imageset');
  const splash = await renderSplash(2732, 2732, contentBuf);
  for (const f of readdirSync(splashDir)) {
    if (f.endsWith('.png')) writeFileSync(join(splashDir, f), splash);
  }
}

async function generateMascote() {
  log('→ mascote (src/assets/mascote/)');
  const files = readdirSync(MASCOTE_DIR);
  const outDir = join(root, 'src', 'assets', 'mascote');
  ensureDir(outDir);
  for (const key of MASCOTE_EXPRESSIONS) {
    const svgFile = files.find((f) => f.endsWith(`_${key}.svg`));
    if (!svgFile) throw new Error(`sprite da mascote não encontrado: *_${key}.svg`);
    const buf = await sharp(join(MASCOTE_DIR, svgFile))
      .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 82, alphaQuality: 90 })
      .toBuffer();
    writeFileSync(join(outDir, `${key}.webp`), buf);
    log(`  ✓ ${key}.webp (${(buf.length / 1024).toFixed(0)}KB)`);
  }
}

async function main() {
  if (!existsSync(ICON_SRC)) throw new Error(`fonte do ícone não encontrada: ${ICON_SRC}`);
  if (!existsSync(SPLASH_VIDEO)) throw new Error(`vídeo de splash não encontrado: ${SPLASH_VIDEO}`);
  const splashContent = await extractSplashContent();
  await generateWeb();
  await generateAndroid(splashContent);
  await generateIos(splashContent);
  await generateMascote();
  log('prontinho ♡ assets regenerados');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});