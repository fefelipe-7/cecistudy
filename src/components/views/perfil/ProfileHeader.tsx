// Perfil — header compacto + progresso da graduação (MOD-001 / B.6).
// Extraído de `PerfilView.tsx`.
import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import type { UserProfile } from '../../../types';
import { ProgressBar } from '../../ui/ProgressBar';

interface ProfileHeaderProps {
  profile: UserProfile;
  percentDegree: number;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  percentDegree,
  onPickPhoto,
  onRemovePhoto,
}) => (
  <div className="rounded-2xl p-5 bg-gradient-to-r from-white via-surface-muted to-surface-rose/80 border border-ceci-border-default shadow-sm space-y-4">
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <div className="w-16 h-16 rounded-3xl bg-surface-rose border-2 border-ceci-border-brand flex items-center justify-center font-display font-bold text-3xl text-ceci-primary shadow-2xs overflow-hidden">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={`foto de ${profile.name}`} className="w-full h-full object-cover" />
          ) : (
            profile.name.trim().charAt(0).toUpperCase() || 'C'
          )}
        </div>
        <button
          onClick={onPickPhoto}
          aria-label="trocar foto de perfil"
          title="trocar foto"
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ceci-primary hover:bg-ceci-primary-hover text-white flex items-center justify-center shadow-xs border-2 border-white tap-interactive cursor-pointer active:scale-95"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>
        {profile.photoUrl && (
          <button
            onClick={onRemovePhoto}
            aria-label="remover foto de perfil"
            title="remover foto"
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border border-ceci-border-default text-ceci-secondary hover:text-red-700 hover:border-red-400 flex items-center justify-center shadow-xs tap-interactive cursor-pointer active:scale-95"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="min-w-0">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ceci-primary truncate">
          meu espaço • {profile.name} <span className="text-rose-500 font-normal">♡</span>
        </h1>
        <p className="text-xs text-ceci-secondary mt-0.5">
          {profile.targetCareer} • {profile.university}
        </p>
      </div>
    </div>

    {/* progresso da graduação — inline */}
    <div className="rounded-2xl bg-white p-3.5 border border-ceci-border-default space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-bold text-ceci-tertiary">progresso da graduação</span>
        <span className="font-display font-bold text-sm text-ceci-brand-strong">
          {percentDegree}% concluído
        </span>
      </div>
      <ProgressBar value={percentDegree} />
      <p className="text-[11px] text-ceci-secondary">
        {profile.semester}º de {profile.totalSemesters} semestres
      </p>
    </div>

    <p className="text-xs text-ceci-secondary leading-relaxed italic border-t border-ceci-border-subtle pt-3">
      “{profile.dailyQuote}”
    </p>
  </div>
);

export default ProfileHeader;