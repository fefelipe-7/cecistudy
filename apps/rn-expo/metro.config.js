/**
 * Metro — O pipeline do NativeWind.
 *
 * Este arquivo é o motivo de todo className do app funcionar ou não. O
 * `withNativeWind` lê `global.css`, compila pelo Tailwind (com o design system
 * de `tailwind.config.js`) e injeta o resultado no bundle pelo
 * `react-native-css-interop`. Sem ele, o CSS nunca chega ao aparelho e **todo
 * className é um no-op** — o app renderiza sem estilo nenhum: texto preto
 * gigante sobre canvas branco, sem padding, sem cor, sem raio. É o
 * "desastre visual" que motivou a revisão (SPEC-015 §Riscos, linha 1).
 *
 * O `input` é relativo à raiz do projeto, não a este arquivo.
 */
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
