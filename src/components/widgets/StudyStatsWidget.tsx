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
      {/* Left Card: Streak Arc & Goal */}
      <div className="rounded-[24px] p-5 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFF5F7] flex items-center justify-center text-[#40383A]">
              <Flame className="w-4 h-4 fill-[#E97891] text-[#E97891]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-[#40383A]">
                ofensiva de estudos
              </h4>
              <p className="text-[11px] text-[#6D6366]">à frente de 84% das colegas</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-[#FAF8F5] text-[#6D6366] px-2 py-1 rounded-full border border-[#E9DFDC]">
            ininterrupto 🔥
          </span>
        </div>

        <div className="flex items-center justify-between my-2">
          <div>
            <span className="text-3xl font-display font-bold text-[#40383A]">
              {streakDays} <span className="text-base font-normal text-[#6D6366]">dias</span>
            </span>
            <p className="text-xs text-[#6D6366] mt-0.5">seu hábito de estudo está consolidado!</p>
          </div>

          {/* Semi-Arc Progress Circle SVG */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                className="stroke-[#E9DFDC]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                className="stroke-[#40383A] transition-all duration-500"
                strokeWidth="8"
                strokeDasharray="200"
                strokeDashoffset="35"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <Award className="w-6 h-6 text-[#E97891] absolute" />
          </div>
        </div>

        {/* Meta Diária Bar */}
        <div className="pt-3 border-t border-[#F2EBE8] mt-2 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-[#40383A] flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-[#E97891]" /> meta diária: {dailyGoalMins} min
            </span>
            <span className="font-bold text-[#6D6366]">{currentDoneMins} / {dailyGoalMins} min</span>
          </div>
          <div className="w-full h-2 bg-[#FAF8F5] border border-[#E9DFDC] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E97891] to-[#40383A] rounded-full"
              style={{ width: `${(currentDoneMins / dailyGoalMins) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right Card: Speed & Sparkline Analytics */}
      <div className="rounded-[24px] p-5 bg-white border border-[#E9DFDC] shadow-[0_2px_8px_rgba(64,56,58,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F2F8F4] flex items-center justify-center text-[#40383A]">
              <Zap className="w-4 h-4 text-[#518265]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-[#40383A]">
                velocidade de leitura
              </h4>
              <p className="text-[11px] text-[#6D6366]">+8 ppm esta semana</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#518265] bg-[#F2F8F4] border border-[#D1E8D9] px-2 py-0.5 rounded-full">
            104 - 112 wpm
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-[#40383A]">
              {readingSpeedWpm}
            </span>
            <span className="text-xs text-[#6D6366]">palavras por minuto (ppm)</span>
          </div>
          <p className="text-[11px] text-[#6D6366] mt-1">
            seu tempo de leitura por capítulo diminuiu de 24 min para 18 min! ⚡
          </p>
        </div>

        {/* Sparkline Graph */}
        <div className="pt-3 border-t border-[#F2EBE8] mt-3">
          <div className="flex items-end justify-between h-14 px-2 pt-2 gap-2">
            {sparklineData.map((val, idx) => {
              const heightPercent = Math.round((val / 120) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full bg-[#FAF8F5] border border-[#E9DFDC] rounded-t-md h-full flex items-end overflow-hidden">
                    <div
                      className="w-full bg-[#40383A] group-hover:bg-[#E97891] transition-colors rounded-t-sm"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-[#918689] font-bold">{days[idx]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
