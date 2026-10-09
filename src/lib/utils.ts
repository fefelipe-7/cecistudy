import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Impede que TypeScript infira um tipo genérico a partir desta posição.
 * Usado nas props de options/tabs para que o tipo `T` seja inferido
 * apenas de `value`/`onChange` (evita widening para `string`).
 */
export type NoInfer<T> = [T][T extends any ? 0 : never];

/**
 * Copia texto para a área de transferência.
 * Usa a Clipboard API moderna com fallback para o `execCommand` legado,
 * que funciona dentro do webview do Capacitor.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // cai no fallback abaixo
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Lê o texto da área de transferência (camada 1 da captura, SPEC-012 §8.3).
 * iOS 16+ pede permissão; quando negada ou indisponível devolve `null` e a
 * sheet aceita colagem manual no campo.
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText();
      return text ? text : null;
    }
  } catch {
    // permissão negada / sem clipboard — a sheet resolve com colagem manual
  }
  return null;
}
