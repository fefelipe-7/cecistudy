import React from 'react';
import {
  Landmark,
  Network,
  Lightbulb,
  User,
  Wrench,
  GitCompare,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TempleCard {
  id: string;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  bubble: string;
  titleHover: string;
  chevron: string;
  toast: string;
}

const TEMPLE_CARDS: TempleCard[] = [
  {
    id: 'familias',
    title: 'famílias',
    subtitle: 'grupos de teorias e correntes que organizam o pensamento da psicologia',
    Icon: Network,
    bubble: 'bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong group-hover:bg-ceci-brand-strong group-hover:text-white',
    titleHover: 'group-hover:text-ceci-brand-strong',
    chevron: 'text-ceci-brand-strong',
    toast: 'em breve: famílias ♡',
  },
  {
    id: 'conceitos',
    title: 'conceitos',
    subtitle: 'ideias-chave e definições que aparecem nas aulas e nas provas',
    Icon: Lightbulb,
    bubble: 'bg-surface-blue border border-ceci-border-academic text-ceci-academic-strong group-hover:bg-ceci-academic-strong group-hover:text-white',
    titleHover: 'group-hover:text-ceci-academic-strong',
    chevron: 'text-ceci-academic-strong',
    toast: 'em breve: conceitos ♡',
  },
  {
    id: 'autores',
    title: 'autores',
    subtitle: 'pensadores e grandes obras de cada abordagem',
    Icon: User,
    bubble: 'bg-surface-muted border border-ceci-border-default text-beige-700 group-hover:bg-beige-700 group-hover:text-white',
    titleHover: 'group-hover:text-beige-700',
    chevron: 'text-beige-700',
    toast: 'em breve: autores ♡',
  },
  {
    id: 'tecnicas',
    title: 'técnicas',
    subtitle: 'instrumentos e recursos clínicos usados na prática',
    Icon: Wrench,
    bubble: 'bg-surface-mint-soft border border-ceci-border-academic text-success-deep group-hover:bg-success-deep group-hover:text-white',
    titleHover: 'group-hover:text-success-deep',
    chevron: 'text-success-deep',
    toast: 'em breve: técnicas ♡',
  },
  {
    id: 'comparacoes',
    title: 'comparações',
    subtitle: 'lado a lado das abordagens para entender diferenças e pontes',
    Icon: GitCompare,
    bubble: 'bg-surface-gold border border-ceci-border-gold text-gold group-hover:bg-gold group-hover:text-white',
    titleHover: 'group-hover:text-gold',
    chevron: 'text-gold',
    toast: 'em breve: comparações ♡',
  },
];

export const TempleScreen: React.FC = () => {
  const { showToast } = useApp();

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-5 pb-1 animate-in fade-in duration-300 relative">
      {/* Screen Title Banner */}
      <div className="bg-white rounded-[24px] p-5 border border-ceci-border-default space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-ceci-primary leading-tight">
              templo de conhecimento
            </h1>
            <p className="text-xs text-ceci-secondary">
              o mapa da sua jornada pela psicologia
            </p>
          </div>
        </div>
      </div>

      {/* Temple Cards */}
      <div className="space-y-3 px-1">
        {TEMPLE_CARDS.map((card) => (
          <button
            key={card.id}
            onClick={() => showToast(card.toast)}
            className="w-full text-left bg-white rounded-[22px] p-4 border border-ceci-border-default hover:border-ceci-border-brand shadow-2xs transition-all hover:shadow-xs active:scale-[0.99] cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center transition-colors shrink-0 ${card.bubble}`}
              >
                <card.Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className={`text-sm font-bold text-ceci-primary font-display transition-colors ${card.titleHover}`}>
                  {card.title}
                </h2>
                <p className="text-xs text-ceci-secondary mt-0.5">
                  {card.subtitle}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 ${card.chevron} group-hover:translate-x-1 transition-transform shrink-0`} />
          </button>
        ))}
      </div>
    </div>
  );
};