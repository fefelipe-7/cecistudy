/**
 * Babel — a configuração documentada do NativeWind v4, sem improviso.
 *
 * Presets rodam em ordem inversa: `nativewind/babel` (listado por último)
 * executa primeiro e compila o JSX — inclusive injetando o plugin do
 * Reanimated/Worklets (o preset do css-interop já o traz, então não se
 * adiciona de novo aqui; duplicado, o worklet compila duas vezes e o app
 * quebra no primeiro animated style).
 *
 * O `jsxImportSource: 'nativewind'` no babel-preset-expo não vence o do
 * preset do NativeWind (que roda primeiro). Ele existe para o fluxo TS
 * (`tsc`) consumir o mesmo indicador de fonte do que o Metro usa.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
