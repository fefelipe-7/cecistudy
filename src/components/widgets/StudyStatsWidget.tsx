import React from 'react';
import { Flame, Target, Zap, TrendingUp, ChevronRight, Award } from 'lucide-react';

export const StudyStatsWidget: React.FC = () => {
  const streakDays = 25;
  const dailyGoalMins = 45;
  const currentDoneMins = 38;
  const readingSpeedWpm = 112;

  // Sparkline data points for 7 days
  const sparklineData = [60, 85, 70, 95, 110, 104, 112];
  const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left Card: Streak Arc & Goal (Image 4 Inspiration) */}
      <div className="journal-card p-5 bg-white border border-[#EFE5D8] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F4D7DF] flex items-center justify-center text-[#3F3940]">
              <Flame className="w-4 h-4 fill-[#E8AFC0] text-[#E8AFC0]" />
            </div>
            <div>
              <h4 className="font-serif-display font-bold text-sm text-[#3F3940]">
                Ofensiva de Estudos
              </h4>
              <p className="text-[11px] text-[#716A70]">À frente de 84% das colegas</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-[#FAF6EE] text-[#716A70] px-2 py-1 rounded-full border border-[#EFE5D8]">
            Ininterrupto 🔥
          </span>
        </div>

        <div className="flex items-center justify-between my-2">
          <div>
            <span className="text-3xl font-serif-display font-bold text-[#3F3940]">
              {streakDays} <span className="text-base font-normal text-[#716A70]">dias</span>
            </span>
            <p className="text-xs text-[#716A70] mt-0.5">Seu hábito de estudo está consolidado!</p>
          </div>

          {/* Semi-Arc Progress Circle SVG */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                className="stroke-[#EFE5D8]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                className="stroke-[#3F3940] transition-all duration-500"
                strokeWidth="8"
                strokeDasharray="200"
                strokeDashoffset="35"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <Award className="w-6 h-6 text-[#E8AFC0] absolute" />
          </div>
        </div>

        {/* Meta Diária Bar */}
        <div className="pt-3 border-t border-[#EFE5D8] mt-2 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-[#3F3940] flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#E8AFC0]" /> Meta Diária: {dailyGoalMins} min
            </span>
            <span className="font-bold text-[#716A70]">{currentDoneMins} / {dailyGoalMins} min</span>
          </div>
          <div className="w-full h-2 bg-[#EFE5D8] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E8AFC0] to-[#3F3940] rounded-full"
              style={{ width: `${(currentDoneMins / dailyGoalMins) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Card: Speed & Sparkline Analytics (Image 4 Inspiration) */}
      <div className="journal-card p-5 bg-white border border-[#EFE5D8] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E2ECE9] flex items-center justify-center text-[#3F3940]">
              <Zap className="w-4 h-4 text-[#4A7B6D]" />
            </div>
            <div>
              <h4 className="font-serif-display font-bold text-sm text-[#3F3940]">
                Velocidade de Leitura
              </h4>
              <p className="text-[11px] text-[#716A70]">+8 ppm esta semana</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#4A7B6D] bg-[#E2ECE9] px-2 py-0.5 rounded-full">
            104 - 112 wpm
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif-display font-bold text-[#3F3940]">
              {readingSpeedWpm}
            </span>
            <span className="text-xs text-[#716A70]">palavras por minuto (ppm)</span>
          </div>
          <p className="text-[11px] text-[#716A70] mt-1">
            Seu tempo de leitura por capítulo diminuiu de 24 min para 18 min! ⚡
          </p>
        </div>

        {/* Sparkline Graph */}
        <div className="pt-3 border-t border-[#EFE5D8] mt-3">
          <div className="flex items-end justify-between h-14 px-2 pt-2 gap-2">
            {sparklineData.map((val, idx) => {
              const heightPercent = Math.round((val / 120) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-[#FAF6EE] rounded-t-md h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-[#3F3940] group-hover:bg-[#E8AFC0] transition-colors rounded-t-sm"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#9A9195] font-bold">{days[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
