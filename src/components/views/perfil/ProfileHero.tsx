// Perfil — hero de identidade (SPEC-013 D1/D5/D11).
//
// Responde "eu sou" antes de qualquer número: quem usa o app, com que foto, a
// que curso pertence e em que nível está. Substitui o `ProfileHeader`, que
// carregava junto a barra de progresso da graduação — essa agora vive **uma vez**
// em `JourneyNow` (SPEC-013 I2).
//
// O `h1` é o nome (único `h1` da tela, D11). Nome vazio vira o convite de
// onboarding, nunca um título em branco (§7).
import React from 'react';
import { Pencil, Sparkles } from 'lucide-react';
import type { ProfileIdentity } from '../../../lib/profileViewModel';
import ProfileAvatar from './ProfileAvatar';

interface ProfileHeroProps {
  identity: ProfileIdentity;
  onEdit: () => void;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
}

/** Frase editorial para quando a usuária ainda não escreveu a dela (§7). */
const QUOTE_PLACEHOLDER = 'um cantinho para organizar a rotina da faculdade com carinho ♡';

const ProfileHero: React.FC<ProfileHeroProps> = ({
  identity,
  onEdit,
  onPickPhoto,
  onRemovePhoto,
}) => {
  const hasName = identity.displayName.trim().length > 0;
  const hasSubtitle = identity.subtitle.trim().length > 0;
  const quote = identity.quote.trim().length > 0 ? identity.quote : QUOTE_PLACEHOLDER;

  return (
    <section
      aria-labelledby="perfil-nome"
      className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-surface-default via-surface-muted to-surface-rose/70 border border-ceci-border-default shadow-sm space-y-5"
    >
      <div className="flex items-start gap-4">
        <ProfileAvatar
          photoUrl={identity.photoUrl}
          name={identity.displayName || 'usuária'}
          initials={identity.initials}
          onPickPhoto={onPickPhoto}
          onRemovePhoto={onRemovePhoto}
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ceci-tertiary">
            perfil
          </p>

          <h1
            id="perfil-nome"
            className="font-display text-2xl sm:text-3xl font-bold text-ceci-primary truncate"
          >
            {hasName ? identity.displayName : 'como quer ser chamada?'}
          </h1>

          {hasSubtitle ? (
            <p className="text-xs text-ceci-secondary">{identity.subtitle}</p>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="text-xs font-medium text-ceci-brand-strong underline underline-offset-2 cursor-pointer"
            >
              adicione sua universidade
            </button>
          )}

          <p className="inline-flex items-center gap-1.5 rounded-full bg-surface-default border border-ceci-border-brand px-2.5 py-1 text-[11px] font-semibold text-ceci-brand-strong">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            nível {identity.level} · {identity.title}
          </p>
        </div>
      </div>

      <p className="font-serif italic text-sm text-ceci-secondary leading-relaxed border-l-2 border-ceci-border-brand pl-3">
        “{quote}”
      </p>

      <button
        type="button"
        onClick={onEdit}
        className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full border border-ceci-border-default bg-surface-default px-4 py-2.5 text-xs font-semibold text-ceci-primary hover:border-ceci-border-brand hover:bg-surface-rose transition-colors cursor-pointer"
      >
        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
        editar perfil
      </button>
    </section>
  );
};

export default ProfileHero;
