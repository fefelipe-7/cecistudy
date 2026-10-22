/**
 * Interruptor e caminhos do vídeo de fundo do hero da Home.
 *
 * A flag é o que torna a mudança **reversível**: `spec-performance.md` RNF-04
 * exige que cada fase seja reversível "por flag/configuração ou commit
 * isolado". Ligar e desligar aqui não desfaz commit nenhum — o hero volta a ser
 * o card de sempre.
 *
 * Os caminhos são de `public/media/`, servidos como **arquivo** e não como
 * import do Vite. Import seria empacotado como base64 dentro do JS, o que
 * mata o `preload="none"` (o navegador não consegue adiar o download de um
 * data URI) e joga os bytes no caminho crítico da entrada.
 *
 * O Capacitor empacota `webDir: 'dist'`, e o que o Vite constrói é o que entra
 * no APK/IPA — por isso o arquivo precisa estar em `public/`, que o Vite copia
 * para `dist/` na build.
 */
export const HERO_VIDEO = {
  /**
   * Interruptor do protótipo. `false` devolve o hero ao formato card.
   */
  enabled: true,

  /** H.264 — o que o WebView do iOS e do Android tocam. */
  mp4: '/media/hero-home.mp4',

  /** VP9 — menor no Chrome; o browser pula a fonte se não souber decodificar. */
  webm: '/media/hero-home.webm',

  /** Primeiro frame do arquivo processado: o fallback estático. */
  poster: '/media/hero-home-poster.webp',
} as const;
