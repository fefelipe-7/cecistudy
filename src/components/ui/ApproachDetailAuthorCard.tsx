import React from 'react';
import { User } from 'lucide-react';
import { PsychologyAuthor } from '../../types';

interface ApproachDetailAuthorCardProps {
  author: PsychologyAuthor;
  onSelect: () => void;
}

export const ApproachDetailAuthorCard: React.FC<ApproachDetailAuthorCardProps> = ({
  author,
  onSelect,
}) => {
  return (
    <button
      onClick={onSelect}
      className="w-[120px] flex flex-col items-center p-3 border border-ceci-border-default rounded-[18px] bg-white hover:border-ceci-brand-strong cursor-pointer transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-surface-blue flex items-center justify-center mb-2">
        <User className="w-5 h-5 text-ceci-academic-strong" />
      </div>
      <h3 className="text-xs font-bold text-ceci-primary text-center">{author.name}</h3>
      <p className="text-[10px] text-ceci-secondary text-center mt-1 line-clamp-2">
        {author.bio}
      </p>
    </button>
  );
};