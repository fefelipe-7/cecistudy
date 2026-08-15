import React from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';

interface ApproachDetailComparisonCardProps {
  approach: {
    name: string;
    shortName?: string;
  };
  relationType: 'similar' | 'contrast';
  children: React.ReactNode;
  onSelect: () => void;
}

export const ApproachDetailComparisonCard: React.FC<ApproachDetailComparisonCardProps> = ({
  approach,
  relationType,
  children,
  onSelect,
}) => {
  const bgColor =
    relationType === 'similar'
      ? 'bg-surface-rose/20'
      : 'bg-surface-blue/20';
  const borderColor =
    relationType === 'similar'
      ? 'border-ceci-brand-strong'
      : 'border-ceci-academic-strong';
  const textColor =
    relationType === 'similar'
      ? 'text-ceci-brand-strong'
      : 'text-ceci-academic-strong';

  return (
    <button
      onClick={onSelect}
      className={`w-[140px] flex flex-col items-center p-3 border rounded-[18px] ${bgColor} ${borderColor} hover:border-${textColor}/50 cursor-pointer transition-colors`}
    >
      <div className="w-8 h-8 flex items-center justify-center mb-2">
        {relationType === 'similar' ? (
          <Sparkles className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
      </div>
      <h3 className="text-xs font-bold text-center">{approach.name}</h3>
      {approach.shortName && (
        <p className="text-[10px] text-ceci-secondary italic">{approach.shortName}</p>
      )}
      {children}
    </button>
  );
};