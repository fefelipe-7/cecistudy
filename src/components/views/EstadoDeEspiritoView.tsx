import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  ArrowLeft,
  Check,
  Coffee,
  Smile,
  Brain,
  Zap,
  BookOpen,
  MessageSquare,
  Flame,
  Sun
} from 'lucide-react';

export interface DailyMoodData {
  emoji: string;
  label: string;
  energyLevel: number; // 1-5
  vibeColor: string;
  reflection: string;
  intention: string;
  updatedAt: string;
}

interface EstadoDeEspiritoViewProps {
  currentMood: DailyMoodData;
  onSaveMood: (newMood: DailyMoodData) => void;
  onBackToHome: () => void;
}

export const MOOD_PRESETS = [
  {
    id: 'focada',
    emoji: '🤓',
    label: 'Focada & Acadêmica',
    description: 'Pronta para imergir nos livros e sintetizar teorias',
    vibeColor: 'bg-[#FFEAF0] border-[#FFD4E0] text-[#CE5373]',
    accentBg: 'bg-[#CE5373]'
  },
  {
    id: 'calma',
    emoji: '🧘',
    label: 'Calma & Equilibrada',
    description: 'Ritmo suave e leitura sem pressão com foco no essencial',
    vibeColor: 'bg-[#E6F0F7] border-[#CEE1EF] text-[#33627E]',
    accentBg: 'bg-[#33627E]'
  },
  {
    id: 'criativa',
    emoji: '✨',
    label: 'Inspirada & Criativa',
    description: 'Ideias fluindo para mapas mentais, TCC e artigos',
    vibeColor: 'bg-[#FFF7EC] border-[#FFF0DB] text-[#9E6B38]',
    accentBg: 'bg-[#9E6B38]'
  },
  {
    id: 'cafe',
    emoji: '☕',
    label: 'Preciso de um Café',
    description: 'Levemente cansada, avançando um passo de cada vez',
    vibeColor: 'bg-[#E8F3EB] border-[#CEE4D5] text-[#487A5B]',
    accentBg: 'bg-[#487A5B]'
  },
  {
    id: 'motivada',
    emoji: '⚡',
    label: 'Super Motivada',
    description: 'Energia máxima para dominar todos os tópicos de hoje',
    vibeColor: 'bg-[#FFF2E5] border-[#F2D7C2] text-[#8C522B]',
    accentBg: 'bg-[#8C522B]'
  },
  {
    id: 'reflexiva',
    emoji: '🧸',
    label: 'Acolhida & Reflexiva',
    description: 'Analisando conceitos de psicologia com escuta interna',
    vibeColor: 'bg-[#F3EFE8] border-[#DFD5CD] text-[#705C4D]',
    accentBg: 'bg-[#705C4D]'
  }
];

export const EstadoDeEspiritoView: React.FC<EstadoDeEspiritoViewProps> = ({
  currentMood,
  onSaveMood,
  onBackToHome
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState(currentMood.emoji || '🤓');
  const [energyLevel, setEnergyLevel] = useState(currentMood.energyLevel || 4);
  const [reflection, setReflection] = useState(currentMood.reflection || '');
  const [intention, setIntention] = useState(currentMood.intention || 'Estudo leve e produtivo');

  const selectedPreset = MOOD_PRESETS.find((m) => m.emoji === selectedEmoji) || MOOD_PRESETS[0];

  const handleSave = () => {
    onSaveMood({
      emoji: selectedPreset.emoji,
      label: selectedPreset.label,
      energyLevel,
      vibeColor: selectedPreset.vibeColor,
      reflection,
      intention,
      updatedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });
    onBackToHome();
  };

  return (
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      
      {/* Header with Back Button */}
      <div className="flex items-center justify-between pt-2 px-1">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs font-semibold text-[#6B5E62] hover:text-[#3D3336] bg-white px-3 py-2 rounded-xl border border-[#F0E6E3] shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Hoje</span>
        </button>

        <span className="text-[11px] font-bold text-[#CE5373] uppercase tracking-wider bg-[#FFEAF0] px-3 py-1 rounded-full border border-[#FFD4E0]">
          Estado de Espírito ♡
        </span>
      </div>

      {/* Hero Banner */}
      <div className="journal-card p-6 bg-gradient-to-br from-[#FFEAF0] via-white to-[#FFF7EC] border border-[#FFD4E0] text-center relative overflow-hidden space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-white border-2 border-[#FFD4E0] flex items-center justify-center text-4xl shadow-sm transition-transform hover:scale-105">
          {selectedPreset.emoji}
        </div>

        <div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#3D3336]">
            Como você está se sentindo hoje?
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5E62] mt-1 max-w-sm mx-auto leading-relaxed">
            Registre seu estado de espírito do dia para adaptar seu ritmo de estudos de forma acolhedora.
          </p>
        </div>
      </div>

      {/* Mood Selector Grid */}
      <div className="journal-card p-6 bg-white border border-[#F0E6E3] space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0E6E3] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E26D8B]" />
            <h2 className="font-serif-display text-lg font-bold text-[#3D3336]">
              Escolha seu Mood do Dia
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-[#96888C] uppercase">
            6 opções
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MOOD_PRESETS.map((preset) => {
            const isSelected = selectedEmoji === preset.emoji;
            return (
              <button
                key={preset.id}
                onClick={() => setSelectedEmoji(preset.emoji)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative ${
                  isSelected
                    ? `${preset.vibeColor} ring-2 ring-[#E26D8B]/30 shadow-2xs scale-[1.02]`
                    : 'bg-[#FFFDF9] border-[#F0E6E3] hover:border-[#FFD4E0] hover:bg-white'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#CE5373] text-white flex items-center justify-center text-[10px] shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                
                <div className="text-2xl mb-2">{preset.emoji}</div>
                <div>
                  <p className="font-serif-display font-bold text-sm text-[#3D3336]">
                    {preset.label}
                  </p>
                  <p className="text-[10px] text-[#6B5E62] mt-0.5 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy Level & Intention */}
      <div className="journal-card p-6 bg-white border border-[#F0E6E3] space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#3D3336] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#CE5373]" /> Nível de Energia de Hoje
            </span>
            <span className="text-xs font-bold text-[#CE5373] bg-[#FFEAF0] px-2.5 py-0.5 rounded-full border border-[#FFD4E0]">
              {energyLevel} / 5
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setEnergyLevel(level)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                  level <= energyLevel
                    ? 'bg-[#FFEAF0] border-[#FFD4E0] text-[#CE5373] shadow-2xs'
                    : 'bg-[#FFFDF9] border-[#F0E6E3] text-[#B3A5A9] hover:border-[#FFD4E0]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${level <= energyLevel ? 'fill-[#CE5373]' : ''}`} />
                <span>{level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Intention Chips */}
        <div className="pt-2 border-t border-[#F0E6E3]">
          <span className="text-xs font-bold text-[#3D3336] flex items-center gap-1.5 mb-2.5">
            <Sun className="w-4 h-4 text-[#9E6B38]" /> Intenção para a Sessão
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'Estudo leve e produtivo',
              'Foco total em exames',
              'Avançar no TCC',
              'Leitura sem pressa',
              'Organizar cronograma'
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => setIntention(tag)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                  intention === tag
                    ? 'bg-[#3D3336] text-white border-[#3D3336]'
                    : 'bg-[#FFFDF9] text-[#6B5E62] border-[#F0E6E3] hover:border-[#FFD4E0]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Reflection Note */}
        <div className="pt-2 border-t border-[#F0E6E3]">
          <label className="text-xs font-bold text-[#3D3336] flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-4 h-4 text-[#33627E]" /> Nota de Reflexão do Dia
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Como você está hoje? Escreva uma linha sobre seu dia, sentimentos ou foco..."
            rows={2}
            className="w-full text-xs p-3 rounded-xl border border-[#F0E6E3] bg-[#FFFDF9] focus:outline-none focus:border-[#E26D8B] text-[#3D3336] placeholder-[#B3A5A9]"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-[#E26D8B] hover:bg-[#CE5373] text-white py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[48px]"
      >
        <Check className="w-5 h-5 stroke-[2.5]" />
        <span>Salvar e Voltar para Home</span>
      </button>

    </div>
  );
};
