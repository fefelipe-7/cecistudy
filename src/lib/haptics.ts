import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativePlatform } from './storage';

/** vibração leve para interações (no-op no web) */
export function hapticTap(): void {
  if (!isNativePlatform) return;
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
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