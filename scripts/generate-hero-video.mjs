#!/usr/bin/env node
/**
 * Gera os assets de vídeo do hero da Home a partir do arquivo-fonte
 * `assets/hero-source.mp4`.
 *
 * Alvos:
 *  - public/media/hero-home.mp4   (H.264, yuv420p, sem áudio, faststart)
 *  - public/media/hero-home.webm  (VP9, sem áudio)
 *  - public/media/hero-home-poster.webp (primeiro frame, fallback estático)
 *
 * Por que cada passo existe:
 *
 * 1. **Corta a tarja preta.** O fonte vem gravado em 848x478 com barras
 *    superior e inferior; o `cropdetect` mede `crop=848:426:0:26`, ou seja,
 *    26px de cada lado. Sem o corte, a faixa preta entra no hero.
 *
 * 2. **Tira o áudio.** O vídeo é mudo por decisão (o autoplay de iOS/Android
 *    só dispara sem som), e áudio num vídeo de fundo seria o bug do `muted`
 *    Ausente: o browser bloqueia o autoplay e o hero fica no poster.
 *
 * 3. **Faz o crossfade do fim no começo.** O fonte não é um loop: o último
 *    frame não é igual ao primeiro. Cruzar os ~0,7s finais sobre os ~0,7s
 *    iniciais faz o corte sumir. O resultado é ~7,3s de vídeo sem costura.
 *
 * 4. **`faststart`** (moov antes de mdat): o MP4 começa a tocar antes de
 *    baixar inteiro — sem isso, o poster fica na tela até o arquivo inteiro
 *    chegar, que em 3G é exatamente o caso que o `spec-performance.md`
 *    §6.1 manda tratar como `opportunistic`.
 *
 * Uso: npm run assets:hero   (ou: node scripts/generate-hero-video.mjs)
 * Requer: @ffmpeg-installer/ffmpeg (devDependency).
 */
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = ffmpegInstaller.path;

const SOURCE = join(root, 'assets', 'hero-source.mp4');
const OUT_DIR = join(root, 'public', 'media');

const MP4 = join(OUT_DIR, 'hero-home.mp4');
const WEBM = join(OUT_DIR, 'hero-home.webm');
const POSTER = join(OUT_DIR, 'hero-home-poster.webp');

/** Dimensão útil depois de cortar a tarja (medida por `cropdetect`). */
const CROP = '848:426:0:26';

/**
 * Duração da sobreposição do crossfade, em segundos. Curto o bastante para
 * não repetir conteúdo visível, longo o bastante para o corte sumir.
 */
const FADE = 0.7;

const log = (...a) => console.log(...a);

/** Roda o ffmpeg e falha o script se ele falhar (erro silencioso é bug). */
function run(args) {
  execFileSync(FFMPEG, args, { stdio: ['ignore', 'ignore', 'pipe'] });
}

/** Duração do fonte, em segundos (float). Lê do stderr do próprio ffmpeg. */
function durationOf(file) {
  let stderr = '';
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (err) {
    // O ffmpeg sai com código != 0 quando só recebeu `-i` (nenhuma saída pedida).
    // O stderr carrega a duração — é dele que tiramos.
    stderr = err.stderr?.toString() ?? '';
  }
  const m = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  if (!m) throw new Error(`não consegui ler a duração de ${file}`);
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

function main() {
  if (!existsSync(SOURCE)) {
    throw new Error(
      `vídeo-fonte não encontrado: ${SOURCE}\n` +
        'coloque o arquivo em assets/hero-source.mp4 (veja README do script)',
    );
  }
  mkdirSync(OUT_DIR, { recursive: true });

  const dur = durationOf(SOURCE);
  const body = (dur - FADE).toFixed(3);
  log(`→ fonte: ${SOURCE} (${dur.toFixed(2)}s)`);

  // O crossfade: os últimos FADE segundos cruzam sobre os primeiros FADE.
  // `xfade` não existe neste build do ffmpeg (4.x antigo), então o cruzamento
  // é feito com `blend`, que é o mesmo mecanismo por baixo.
  //
  //   [0:v] cortada -> TRÊS ramos (um label só pode ser consumido uma vez):
  //     "head" = do início até FADE       (a parte que entra no crossfade)
  //     "body" = de FADE até (dur - FADE)  (o miolo, que passa inteiro)
  //     "tail" = os últimos FADE segundos  (a parte que sai)
  //
  //   A saída = corpo ++ (cauda sobre cabeça, em fade). O último frame do
  //   vídeo é a cabeça do começo, e o primeiro frame do vídeo é o começo do
  //   corpo — os dois se encontram, e o loop fecha sem costura.
  const filter = [
    `[0:v]crop=${CROP},fps=30,split=3[head][mid][tail]`,
    `[head]trim=start=0:end=${FADE},setpts=PTS-STARTPTS[headt]`,
    `[mid]trim=start=${FADE}:end=${body},setpts=PTS-STARTPTS[midt]`,
    `[tail]trim=start=${body}:end=${dur},setpts=PTS-STARTPTS[tailt]`,
    // O fade de verdade: a cauda entra sobre a cabeça.
    `[tailt][headt]blend=all_expr='A*(1-(T/${FADE}))+B*(T/${FADE})'[xf]`,
    `[midt][xf]concat=n=2:v=1:a=0[v]`,
  ].join(';');

  log('→ mp4 (H.264, sem áudio, faststart)');
  run([
    '-y',
    '-i', SOURCE,
    '-filter_complex', filter,
    '-map', '[v]',
    '-an',
    '-c:v', 'libx264',
    '-profile:v', 'main',
    '-pix_fmt', 'yuv420p',
    '-crf', '26',
    '-preset', 'slow',
    '-movflags', '+faststart',
    MP4,
  ]);

  log('→ webm (VP9, sem áudio)');
  run([
    '-y',
    '-i', SOURCE,
    '-filter_complex', filter,
    '-map', '[v]',
    '-an',
    '-c:v', 'libvpx-vp9',
    '-crf', '36',
    '-b:v', '0',
    '-row-mt', '1',
    '-deadline', 'good',
    '-cpu-used', '2',
    WEBM,
  ]);

  // O poster é o PRIMEIRO frame do arquivo já processado — assim o fallback
  // estático é exatamente a primeira coisa que o vídeo mostra, sem salto.
  log('→ poster (primeiro frame do mp4)');
  run([
    '-y',
    '-i', MP4,
    '-frames:v', '1',
    '-vf', 'scale=848:-2',
    '-c:v', 'libwebp',
    '-quality', '72',
    POSTER,
  ]);

  for (const f of [MP4, WEBM, POSTER]) {
    log(`  ✓ ${f.replace(root + '/', '')} — ${(statSync(f).size / 1024).toFixed(0)} KB`);
  }
  log('prontinho ♡ vídeo do hero gerado');
}

main();
