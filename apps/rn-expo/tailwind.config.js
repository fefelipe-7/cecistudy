/**
 * tailwind.config.js — o design system do cecistudy em classNames de RN.
 *
 * NAO copie valor de cor aqui. Este arquivo so **deriva** de `src/tokens/palette.js`,
 * que por sua vez espelha o `@theme` do `src/index.css`. Se um hex novo
 * aparecer neste arquivo, o gate de drift (`scripts/tokens-sync.mjs`) acusa.
 */
const p = require('./src/tokens/palette.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.js', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: p.canvas,
        surface: p.surface,
        ceci: p.ceci,
        border: p.border,
        status: p.status,
        cover: p.cover,
        aurora: p.aurora,
        rose: p.primitives.rose,
        blue: p.primitives.blue,
        cream: p.primitives.cream,
        beige: p.primitives.beige,
        green: p.primitives.green,
        yellow: p.primitives.yellow,
        red: p.primitives.red,
      },
      borderRadius: p.radius,
      spacing: p.space,
      fontFamily: p.fonts,
    },
  },
  plugins: [],
};