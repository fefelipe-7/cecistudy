/**
 * Plugin Vite — F7.4 do todo-performance (spec-performance §4.5):
 * elimina a publicação duplicada `.woff` das fontes (@fontsource publica a
 * mesma face em woff2 E woff; 52 arquivos .woff = ~810 KB de cópia morta).
 *
 * O CSS de cada peso (ex.: `inter/400.css`) traz `src: url(...woff2)
 * format('woff2'), url(...woff) format('woff')`. O plugin remove a entrada
 * `.woff` de cada `@font-face`, mantendo o woff2 (suportado por todo
 * browser/WebView moderno — Chrome 36+, Safari 10+, Firefox 39+).
 * Sem a referência no CSS, o Vite não copia o arquivo para o bundle.
 *
 * Uso: `plugins: [..., stripLegacyFontFormats()]` (vite.config da raiz e do
 * apps/mobile).
 */

const WOFF_FALLBACK = /,\s*url\(\s*[^)]*\.woff\s*\)\s*format\(\s*['"]woff['"]\s*\)/g;

/** @returns {import('vite').Plugin} */
export function stripLegacyFontFormats() {
  return {
    name: 'cecistudy:strip-legacy-font-formats',
    // 'pre' é OBRIGATÓRIO: o plugin interno de CSS do Vite reescreve as url()
    // e EMITE os assets antes de plugins da fase normal — sem isso o CSS sai
    // limpo mas os .woff continuam copiados no bundle.
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('@fontsource') || !id.endsWith('.css')) return null;
      if (!WOFF_FALLBACK.test(code)) return null;
      WOFF_FALLBACK.lastIndex = 0;
      const stripped = code.replace(WOFF_FALLBACK, '');
      return { code: stripped, map: null };
    },
  };
}
