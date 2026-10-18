import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from './storage';

/** vibração leve para interações (no-op no web) */
export function hapticTap(): void {
  if (!isNativePlatform) return;
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/**
 * Vibração curtíssima de **seleção** — usada quando a usuária troca a ação
 * principal escolhida, e não quando executa a ação.
 *
 * É o único `selectionStart` do app (SPEC-M-018 §12) e o único `ImpactStyle`
 * diferente de `Light`: `Medium` é o degrau acima, e é o que o plugin oferece
 * para "algo mudou de lugar sem ter sido executado". Chamar `hapticTap` aqui
 * seria indistinguível de executar.
 */
export function hapticSelection(): void {
  if (!isNativePlatform) return;
  void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

/** vibração de confirmação/sucesso (no-op no web) */
export function hapticSuccess(): void {
  if (!isNativePlatform) return;
  void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

/** vibração de aviso/erro (no-op no web) */
export function hapticWarning(): void {
  if (!isNativePlatform) return;
  void Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
}