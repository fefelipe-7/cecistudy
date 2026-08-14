import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
import { DailyMoodData } from '../../types';
import { MOOD_PRESETS } from '../../data/moodPresets';

interface EstadoDeEspiritoViewProps {
  currentMood: DailyMoodData;
  onSaveMood: (newMood: DailyMoodData) => void;
  onBackToHome: () => void;
}

export const EstadoDeEspiritoView: React.FC<EstadoDeEspiritoViewProps> = ({
  currentMood,
  onSaveMood,
  onBackToHome
}) => {
  const [selectedEmoji, setSelectedEmoji] = useState(currentMood.emoji || '🤓');
  const [energyLevel, setEnergyLevel] = useState(currentMood.energyLevel || 4);
  const [reflection, setReflection] = useState(currentMood.reflection || '');
  const [intention, setIntention] = useState(currentMood.intention || 'estudo leve e produtivo');

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
    <div className="max-w-md sm:max-w-xl mx-auto space-y-6 pb-1">
      
      {/* Header with Back Button */}
      <div className="flex items-center justify-between pt-2 px-1">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs font-semibold text-ceci-secondary hover:text-ceci-primary bg-white px-3 py-2 rounded-xl border border-ceci-border-default shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>voltar para hoje</span>
        </button>

        <span className="text-[11px] font-bold text-ceci-brand-strong lowercase tracking-wider bg-surface-rose px-3 py-1 rounded-full border border-ceci-border-brand">
          estado de espírito ♡
        </span>
      </div>

      {/* Hero Banner */}
      <div className="rounded-[24px] p-6 bg-gradient-to-br from-surface-rose via-white to-surface-subtle border border-ceci-border-brand text-center relative overflow-hidden space-y-4 shadow-sm">
        <motion.div
          key={selectedPreset.emoji}
          initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="w-20 h-20 mx-auto rounded-3xl bg-white border-2 border-ceci-border-brand flex items-center justify-center text-4xl shadow-2xs hover:scale-105"
        >
          {selectedPreset.emoji}
        </motion.div>

        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ceci-primary">
            como você está se sentindo hoje?
          </h1>
          <p className="text-xs sm:text-sm text-ceci-secondary mt-1 max-w-sm mx-auto leading-relaxed">
            registre seu estado de espírito do dia para adaptar seu ritmo de estudos de forma acolhedora.
          </p>
        </div>
      </div>

      {/* Mood Selector Grid */}
      <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-ceci-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h2 className="font-display text-lg font-bold text-ceci-primary">
              escolha seu mood do dia
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-ceci-tertiary lowercase">
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
                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer ${
                  isSelected
                    ? `${preset.vibeColor} ring-2 ring-rose-500/30 shadow-2xs scale-[1.02]`
                    : 'bg-surface-muted border-ceci-border-default hover:border-ceci-border-brand hover:bg-white'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-ceci-brand-strong text-white flex items-center justify-center text-[10px] shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                
                <div className="text-2xl mb-2">{preset.emoji}</div>
                <div>
                  <p className="font-display font-bold text-sm text-ceci-primary">
                    {preset.label}
                  </p>
                  <p className="text-[10px] text-ceci-secondary mt-0.5 line-clamp-2 leading-tight">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy Level & Intention */}
      <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-ceci-primary flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-ceci-brand-strong" /> nível de energia de hoje
            </span>
            <span className="text-xs font-bold text-ceci-brand-strong bg-surface-rose px-2.5 py-0.5 rounded-full border border-ceci-border-brand">
              {energyLevel} / 5
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setEnergyLevel(level)}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  level <= energyLevel
                    ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong shadow-2xs'
                    : 'bg-surface-muted border-ceci-border-default text-ceci-faded hover:border-ceci-border-brand'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${level <= energyLevel ? 'fill-ceci-brand-strong' : ''}`} />
                <span>{level}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Intention Chips */}
        <div className="pt-2 border-t border-ceci-border-subtle">
          <span className="text-xs font-bold text-ceci-primary flex items-center gap-1.5 mb-2.5">
            <Sun className="w-4 h-4 text-beige-700" /> intenção para a sessão
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              'estudo leve e produtivo',
              'foco total em exames',
              'avançar no tcc',
              'leitura sem pressa',
              'organizar cronograma'
            ].map((tag) => (
              <button
                key={tag}
                onClick={() => setIntention(tag)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                  intention === tag
                    ? 'bg-ceci-primary text-white border-ceci-primary'
                    : 'bg-surface-muted text-ceci-secondary border-ceci-border-default hover:border-ceci-border-brand'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Reflection Note */}
        <div className="pt-2 border-t border-ceci-border-subtle">
          <label className="text-xs font-bold text-ceci-primary flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-4 h-4 text-ceci-academic-strong" /> nota de reflexão do dia
          </label>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="como você está hoje? escreva uma linha sobre seu dia, sentimentos ou foco..."
            rows={2}
            className="w-full text-xs p-3 rounded-xl border border-ceci-border-default bg-surface-muted focus:outline-none focus:border-rose-500 text-ceci-primary placeholder-ceci-faded"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-rose-500 hover:bg-ceci-brand text-white py-3.5 rounded-2xl font-bold text-sm shadow-2xs transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
      >
        <Check className="w-5 h-5 stroke-[2.5]" />
        <span>salvar e voltar para home</span>
      </button>

    </div>
  );
};
