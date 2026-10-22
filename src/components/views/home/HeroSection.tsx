// Home — hero: card fino com vídeo de fundo + saudação à esquerda.
//
// O hero é um **card**: raio, borda e sombra, como os outros cards do app.
// O vídeo é a superfície do card, não uma imagem colada num retângulo — o
// texto flutua por cima dele.
//
// O card é **fino** (uma faixa), porque o herói é a cena: o pôr do sol e a
// cecinho na grama. A saudação é o que a usuária lê em meio segundo, enquanto
// o olho está na arte.
//
// O texto fica à **esquerda** porque a arte é: pôr do sol e cidade à esquerda,
// a cecinho na grama à direita. O lado direito fica livre.
//
// A voz do texto continua vindo de `lib/voice.ts` (SPEC-C-014 D7) — nenhuma
// frase de identidade é escrita aqui.
import React from 'react';

import { HeroVideo } from '../../ui/HeroVideo';
import { HERO_VIDEO } from './heroVideo.config';

interface HeroSectionProps {
  formattedDate: string;
  greeting: string;
  name: string;
  dayMessage: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  formattedDate,
  greeting,
  name,
  dayMessage,
}) => {
  if (!HERO_VIDEO.enabled) {
    // A forma antiga, mantida para o interruptor: o hero segue sendo um card.
    return (
      <section className="rounded-[26px] bg-gradient-to-br from-surface-default to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ceci-brand animate-pulse" />
              <p className="text-xs font-medium text-ceci-secondary lowercase">{formattedDate}</p>
            </div>
            <h1 className="font-serif-academic text-3xl sm:text-4xl text-ceci-primary mt-1 tracking-tight">
              {greeting}, {name} ✨
            </h1>
          </div>
        </div>
        <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">
          {dayMessage}
        </p>
      </section>
    );
  }

  return (
    <section
      data-testid="hero-card"
      /*
       * O card é uma **faixa**: `aspect-[3/1]` com teto de altura. Proporção
       * 3:1 dá a fatia larga da arte (pôr do sol + cidade + a grama da
       * cecinho) sem esticar; o `max-h` impede que o card engula a tela em
       * telas largas.
       *
       * O texto vive dentro do card, no canto inferior esquerdo — o canto
       * mais escuro da arte (a cidade em silhueta).
       */
      className="relative overflow-hidden rounded-[26px] border border-ceci-border-subtle shadow-sm aspect-[3/1] max-h-[168px]"
    >
      {/*
        O vídeo é a superfície do card: ocupa tudo, e o texto senta por cima.

        O `object-position: 50% 100%` ancora o enquadramento na **base** da
        arte — a grama e a cecinho. O céu da arte (o azul) é o topo do
        quadro, que o card fino não alcança; por isso o céu é pintado pelo
        tema, na faixa acima do card (`hero-ceu`, em `HomeView.tsx`).
      */}
      <HeroVideo
        srcMp4={HERO_VIDEO.mp4}
        srcWebm={HERO_VIDEO.webm}
        poster={HERO_VIDEO.poster}
        className="absolute inset-0 h-full w-full object-cover object-[50%_100%]"
      />

      {/*
        O véu de contraste — do lado do texto, e só dele.

        É **escuro** em todos os temas (`hero-veu`): um véu claro — a cor da
        superfície do tema — lavava a arte, e a cecinho, que é bege e clara,
        sumia no fundo. Escurecer preserva a cor da arte e serve para texto
        claro E escuro.

        O gradiente é horizontal e some antes da cecinho: o lado direito da
        arte fica **intacto**. O véu que cobria a arte inteira (a primeira
        versão) matava a qualidade do vídeo — e era o defeito principal
        apontado.

        O contraste foi medido no render real (WCAG 2.1, o texto contra o
        pixel que fica atrás dele), nos sete temas — ver a SPEC-023 D4.
      */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-hero-veu from-15% via-hero-veu/80 via-58% to-transparent to-82%"
      />

      {/*
        O texto, à esquerda, pequeno. O `max-w` curto deixa a cecinho da arte
        à direita; o texto é o que se lê em meio segundo, não o herói.
      */}
      <div className="absolute inset-0 flex items-end">
        <div className="p-4 sm:p-5 max-w-[70%] sm:max-w-[58%]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ceci-brand animate-pulse" />
            <p className="text-[11px] font-medium text-hero-ink/85 lowercase">{formattedDate}</p>
          </div>
          <h1 className="font-serif-academic text-xl sm:text-2xl text-hero-ink mt-0.5 tracking-tight">
            {greeting}, {name} ✨
          </h1>
          <p className="text-[11px] text-hero-ink/85 leading-relaxed mt-1">{dayMessage}</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
