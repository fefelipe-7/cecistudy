import React from 'react';
import { Sparkles } from 'lucide-react';
import { PsychologyConcept } from '../../types';

interface ApproachDetailConceptCardProps {
  concept: PsychologyConcept;
  onSelect: () => void;
}

export const ApproachDetailConceptCard: React.FC<ApproachDetailConceptCardProps> = ({
  concept,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className="w-[120px] flex flex-col items-center p-3 border border-ceci-border-default rounded-[18px] bg-white hover:border-ceci-brand-strong cursor-pointer transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-surface-rose flex items-center justify-center mb-2">
        <Sparkles className="w-5 h-5 text-ceci-brand-strong" />
      </div>
      <h3 className="text-xs font-bold text-ceci-primary text-center">{concept.name}</h3>
      <p className="text-[10px] text-ceci-secondary text-center mt-1 line-clamp-2">
        {concept.definition}
      </p>
    </button>
  );
};