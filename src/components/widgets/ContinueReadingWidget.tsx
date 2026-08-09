import React from 'react';
import { BookOpen, ChevronRight, Clock, MoreHorizontal } from 'lucide-react';
import { ReadingItem } from '../../types';

interface ContinueReadingWidgetProps {
  reading: ReadingItem;
  onContinue: (reading: ReadingItem) => void;
}

export const ContinueReadingWidget: React.FC<ContinueReadingWidgetProps> = ({
  reading,
  onContinue,
}) => {
  const percent = Math.round(((reading.readPages || 0) / (reading.totalPages || 100)) * 100);
  const remainingPages = (reading.totalPages || 100) - (reading.readPages || 0);
  const estMinutesLeft = Math.round(remainingPages * 1.5);

  return (
    <div className="journal-card p-5 bg-white border border-[#EFE5D8] shadow-xs hover:border-[#E8AFC0] transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-[#716A70] tracking-wide uppercase">
          Continuar de onde parou 📖
        </span>
        <button className="text-[#9A9195] hover:text-[#3F3940]">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start gap-4">
        {/* Book Cover Mockup */}
        <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-[#F4D7DF] via-[#E8AFC0] to-[#DCCBB8] shadow-xs flex flex-col justify-between p-2.5 text-[#3F3940] shrink-0 relative overflow-hidden border border-[#E8AFC0]/40">
          <div className="absolute -right-3 -bottom-3 opacity-20 pointer-events-none">
            <BookOpen className="w-16 h-16 text-[#3F3940]" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider bg-white/80 px-1.5 py-0.5 rounded self-start">
            {reading.type}
          </span>
          <div>
            <p className="font-serif-display font-bold text-xs line-clamp-2 leading-tight">
              {reading.title}
            </p>
            <p className="text-[9px] text-[#716A70] line-clamp-1 mt-0.5">{reading.author}</p>
          </div>
        </div>

        {/* Book Info & Progress */}
        <div className="flex-1 flex flex-col justify-between h-28">
          <div>
            <h3 className="font-serif-display font-bold text-base text-[#3F3940] line-clamp-1">
              {reading.title}
            </h3>
            <p className="text-xs text-[#716A70] mt-0.5">{reading.author}</p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#716A70]">
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-[#E8AFC0]" /> ~{estMinutesLeft} min restantes
              </span>
              <span className="font-bold text-[#3F3940]">{percent}%</span>
            </div>

            <div className="w-full h-1.5 bg-[#EFE5D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3F3940] rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => onContinue(reading)}
            className="w-full bg-[#3F3940] hover:bg-[#2A252B] text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 shadow-2xs transition-transform active:scale-98 mt-1"
          >
            <span>Continuar Leitura</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
