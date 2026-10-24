/**
 * A voz amarrada ao perfil (`SPEC-M-018` D14).
 *
 * `voice.ts` é dado puro e **não sabe quem é a usuária**. Este é o único lugar do
 * app que lê o nome e a autorização e monta o `VozContexto` — assim a voz
 * continua testável sem provider, sem perfil e sem React (`D14`).
 *
 * A autorização é **padrão fechado** (`tratamentoAutorizado = false`): sem o
 * campo no perfil, a voz fala com "você". O interruptor que liga a autorização
 * mora na tela de Perfil (F5.5), e o campo é opcional justamente para não exigir
 * migração (`SPEC-017`, campo retrocompatível).
 */
import { useMemo } from 'react';

import { SEM_NOME, erro, comNome, type VozContexto } from './voice';
import type { UserProfile } from '../types/profile';

/** O contexto da voz derivado do perfil — a ponte de `D14`. */
export function contextoDaVoz(profile: Partial<UserProfile> | null | undefined): VozContexto {
  if (!profile) return SEM_NOME;
  return {
    tratamentoAutorizado: profile.nomeAutorizado === true,
    nomeDaUsuaria: profile.name,
  };
}

/**
 * O que uma tela precisa da voz. Só o que já tem consumidor — `D12`: chave sem
 * consumidor é dívida, e dívida aqui nasce como `undefined` silencioso.
 */
export interface VozLigada {
  contexto: VozContexto;
  /** `D5`: as duas frases do erro, já compostas. */
  erro: (codigo: string, params?: Parameters<typeof erro>[1]) => string;
  /** `D8`: abre a frase com o nome quando ele existe. */
  comNome: (frase: string) => string;
}

export function useVoz(profile?: Partial<UserProfile> | null): VozLigada {
  const contexto = useMemo(() => contextoDaVoz(profile), [profile]);
  return useMemo(
    () => ({
      contexto,
      erro: (codigo, params) => erro(codigo, params, contexto),
      comNome: (frase: string) => comNome(frase, contexto),
    }),
    [contexto],
  );
}
