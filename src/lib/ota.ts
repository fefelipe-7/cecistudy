import React, { useEffect, useState } from 'react';
import { CapacitorUpdater, type BundleInfo } from '@capgo/capacitor-updater';
import { isNativePlatform } from './storage';
import { parseOtaManifest, shouldUpdate, type OtaManifest } from './otaLogic';

/**
 * Cliente OTA do cecistudy — atualização self-hosted via @capgo/capacitor-updater
 * (modo manual, dirigido pelo JS).
 *
 * Fluxo:
 *   1. App inicia (nativo) → `initOta()` chama `notifyAppReady()` (marca o bundle
 *      atual como ok → rollback automático se o próximo crashar) e agenda a checagem.
 *   2. `checkForUpdates()` busca o `version.json` estático no GitHub Pages, compara
 *      com a versão atual e baixa o zip quando há novidade (valida o SHA-256).
 *   3. Ao concluir, agenda a troca para a próxima abertura (`next()`) e avisa a UI
 *      ("atualização pronta ♡"). O usuário pode aplicar na hora (`applyNow()`) ou
 *      deixar para a próxima abertura.
 *
 * No web/PWA tudo é no-op (`supported: false`).
 */

const DEFAULT_MANIFEST_URL = 'https://fefelipe-7.github.io/cecistudy/version.json';
export const OTA_MANIFEST_URL: string =
  (import.meta.env.VITE_OTA_MANIFEST_URL as string | undefined) || DEFAULT_MANIFEST_URL;

export type OtaStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready'
  | 'applied'
  | 'error';

export interface OtaState {
  /** Disponível apenas no app nativo (Android/iOS). */
  supported: boolean;
  status: OtaStatus;
  /** Progresso do download, 0–100. */
  progress: number;
  /** Versão web atualmente em execução ("builtin" ou semver). */
  currentVersion: string;
  /** Versão anunciada no manifest (pode ser a nova ou a atual). */
  availableVersion: string | null;
  /** Bundle baixado e pronto para aplicar. */
  pendingBundle: BundleInfo | null;
  /** Mensagem de erro amigável (pt-BR). */
  error: string | null;
}

const INITIAL_STATE: OtaState = {
  supported: false,
  status: 'idle',
  progress: 0,
  currentVersion: 'builtin',
  availableVersion: null,
  pendingBundle: null,
  error: null,
};

let state: OtaState = INITIAL_STATE;
const subscribers = new Set<React.Dispatch<React.SetStateAction<OtaState>>>();

function setState(partial: Partial<OtaState>): void {
  state = { ...state, ...partial };
  subscribers.forEach((fn) => fn(state));
}

export function getOtaState(): OtaState {
  return state;
}

/** Hook reativo para a UI (modal de atualização / card do Perfil). */
export function useOtaStatus(): OtaState {
  const [s, setS] = useState<OtaState>(state);
  useEffect(() => {
    subscribers.add(setS);
    return () => {
      subscribers.delete(setS);
    };
  }, []);
  return s;
}

let initialized = false;

function formatCurrentVersion(bundleVersion: string): string {
  return bundleVersion && bundleVersion !== 'builtin' ? bundleVersion : 'builtin';
}

function registerListeners(): void {
  void CapacitorUpdater.addListener('download', (e) => {
    setState({
      status: 'downloading',
      progress: e.percent,
      availableVersion: e.bundle.version,
      error: null,
    });
  });

  void CapacitorUpdater.addListener('downloadComplete', (e) => {
    setState({
      status: 'ready',
      progress: 100,
      availableVersion: e.bundle.version,
      pendingBundle: e.bundle,
      error: null,
    });
    // Agenda a troca para a próxima abertura/background (sem interromper agora).
    void CapacitorUpdater.next({ id: e.bundle.id }).catch(() => undefined);
  });

  void CapacitorUpdater.addListener('downloadFailed', (e) => {
    setState({
      status: 'error',
      progress: 0,
      pendingBundle: null,
      error: `não consegui baixar a versão ${e.version}.`,
    });
  });

  void CapacitorUpdater.addListener('updateFailed', () => {
    setState({ status: 'error', error: 'a atualização falhou ao instalar.' });
  });

  void CapacitorUpdater.addListener('appReloaded', () => {
    setState({
      status: 'idle',
      progress: 0,
      availableVersion: null,
      pendingBundle: null,
      error: null,
    });
  });
}

/**
 * Inicializa o OTA no app nativo. Deve rodar uma única vez por sessão,
 * após o onboarding estar concluído. No web não faz nada.
 */
export async function initOta(): Promise<void> {
  if (!isNativePlatform || initialized) return;
  initialized = true;
  setState({ supported: true });

  try {
    // CRÍTICO: chamar antes de qualquer requisição de rede — confirma que o bundle
    // atual carregou (evita o rollback automático do plugin).
    const ready = await CapacitorUpdater.notifyAppReady();
    setState({ currentVersion: formatCurrentVersion(ready.bundle.version) });
  } catch {
    /* plugin indisponível — segue sem OTA */
  }

  registerListeners();

  // Checagem silenciosa após o app carregar (sem atrapalhar a primeira impressão).
  setTimeout(() => {
    void checkForUpdates();
  }, 4000);
}

export type CheckResult = 'up-to-date' | 'downloaded' | 'failed';

/**
 * Consulta o manifest no GitHub Pages e baixa o bundle quando há versão nova.
 * `manual: true` marca o estado como erro para feedback explícito (Perfil).
 */
export async function checkForUpdates(opts: { manual?: boolean } = {}): Promise<CheckResult> {
  if (!isNativePlatform) return 'up-to-date';
  setState({ status: 'checking', error: null });

  try {
    const res = await fetch(OTA_MANIFEST_URL, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest: OtaManifest = parseOtaManifest(await res.json());

    if (!shouldUpdate(state.currentVersion, manifest.version)) {
      setState({ status: 'idle', availableVersion: manifest.version });
      return 'up-to-date';
    }

    setState({ availableVersion: manifest.version, error: null });
    const bundle = await CapacitorUpdater.download({
      url: manifest.url,
      version: manifest.version,
      checksum: manifest.checksum,
    });
    setState({
      status: 'ready',
      progress: 100,
      availableVersion: bundle.version,
      pendingBundle: bundle,
    });
    void CapacitorUpdater.next({ id: bundle.id }).catch(() => undefined);
    return 'downloaded';
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    setState({ status: 'error', error: 'não consegui verificar atualizações agora.' });
    console.warn('[ota] falha ao checar atualização:', message);
    return 'failed';
  }
}

/** Aplica na hora: recarrega o app com o bundle já agendado (next). */
export async function applyNow(): Promise<void> {
  if (!isNativePlatform) return;
  const pending = state.pendingBundle ?? (await CapacitorUpdater.getNextBundle().catch(() => null));
  if (!pending) return;
  setState({ status: 'applied' });
  try {
    await CapacitorUpdater.next({ id: pending.id });
    // reload() destrói o contexto JS — a UI não volta depois daqui.
    await CapacitorUpdater.reload();
  } catch {
    setState({ status: 'error', error: 'não consegui aplicar a atualização agora.' });
  }
}

/** Fecha o aviso "atualização pronta" (a troca segue agendada para a próxima abertura). */
export function dismissUpdate(): void {
  if (state.status === 'ready') setState({ status: 'idle' });
}

/** Versão legível do bundle atual (para o Perfil). */
export function formatVersionLabel(version: string): string {
  return version === 'builtin' ? 'embutida no app' : version;
}

export type { OtaManifest };