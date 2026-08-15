import React from 'react';
import { Wrench } from 'lucide-react';
import { Technique } from '../../types';

interface ApproachDetailVerbCardProps {
  verb: Technique;
  onSelect: () => void;
}

export const ApproachDetailVerbCard: React.FC<ApproachDetailVerbCardProps> = ({
  verb,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className="w-[120px] flex flex-col items-center p-3 border border-ceci-border-default rounded-[18px] bg-white hover:border-ceci-brand-strong cursor-pointer transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-surface-mint-soft flex items-center justify-center mb-2">
        <Wrench className="w-5 h-5 text-success-deep" />
      </div>
      <h3 className="text-xs font-bold text-ceci-primary text-center">{verb.name}</h3>
      <p className="text-[10px] text-ceci-secondary text-center mt-1 line-clamp-2">
        {verb.description}
      </p>
    </button>
  );
};