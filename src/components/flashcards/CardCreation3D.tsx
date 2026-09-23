import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card3D } from './Card3D';

export interface CardCreation3DProps {
  question: string;
  onQuestionChange: (value: string) => void;
  answer: string;
  onAnswerChange: (value: string) => void;
  /** Sobrescreve o `prefers-reduced-motion` (usado nos testes). */
  reduceMotion?: boolean;
  ariaLabel?: string;
}

/**
 * Card-form 3D da criação: pergunta na face frontal, resposta no verso.
 * "virar o card ♡" (ou Enter sem shift) gira o card (spring 260/26) e foca o
 * textarea da face oposta — sem trocar de tela. Shift+Enter insere quebra.
 * O card é NÃO-interativo por tap (flip só pelo botão/Enter), então os
 * textareas das faces convivem com o CSS-3D sem roubar o caret.
 */
export const CardCreation3D: React.FC<CardCreation3DProps> = ({
  question,
  onQuestionChange,
  answer,
  onAnswerChange,
  reduceMotion,
  ariaLabel = 'criação do card',
}) => {
  const [flipped, setFlipped] = useState(false);
  const frontRef = useRef<HTMLTextAreaElement>(null);
  const backRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Autofoco por face: pergunta na frente, resposta ao virar (lição Quizlet/Anki).
    (flipped ? backRef : frontRef).current?.focus();
  }, [flipped]);

  const flip = () => setFlipped((f) => !f);

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    e.preventDefault();
    flip();
  };

  return (
    <div className="space-y-3" data-testid="card-creation">
      <Card3D
        flipped={flipped}
        ariaLabel={ariaLabel}
        reduceMotion={reduceMotion}
        frontClassName="flex flex-col p-4"
        backClassName="flex flex-col p-4"
        front={
          <div className="flex h-full flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-muted">
              pergunta ♡
            </span>
            <textarea
              ref={frontRef}
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="qual a pergunta do card?"
              className="w-full flex-1 resize-none bg-transparent select-text text-sm text-ceci-primary placeholder-ceci-faded outline-none leading-relaxed"
            />
          </div>
        }
        back={
          <div className="flex h-full flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-brand-strong">
              resposta ✨
            </span>
            <textarea
              ref={backRef}
              value={answer}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyDown={handleEnter}
              placeholder="a resposta, com suas palavras..."
              className="w-full flex-1 resize-none bg-transparent select-text text-sm text-ceci-primary placeholder-ceci-faded outline-none leading-relaxed"
            />
          </div>
        }
      />
      <button
        type="button"
        onClick={flip}
        className={cn(
          'mx-auto flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold cursor-pointer active:scale-95 transition',
          flipped
            ? 'bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand'
            : 'bg-ceci-primary hover:bg-ceci-primary-hover text-ceci-on-primary shadow-xs'
        )}
      >
        <ArrowLeftRight className="w-3.5 h-3.5" />
        {flipped ? 'voltar pra pergunta' : 'virar o card ♡'}
      </button>
      <p className="text-center text-[10px] text-ceci-tertiary">
        enter vira o card · shift+enter pula linha
      </p>
    </div>
  );
};

export default CardCreation3D;