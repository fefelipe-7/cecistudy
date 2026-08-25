/**
 * Leitura do QR de pareamento usando @capacitor/camera (foto) + jsqr
 * (decodificação local). Sem plugin nativo novo — funciona no nativo e no web
 * (seletor de arquivo/câmera do navegador).
 */
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import jsQR from 'jsqr';

/** Decodifica o primeiro QR de uma imagem data URL. `null` quando não encontra. */
export async function decodeQrFromDataUrl(dataUrl: string): Promise<string | null> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('imagem inválida'));
    img.src = dataUrl;
  });
  const canvas = document.createElement('canvas');
  // QR lê melhor em resolução cheia (limite de segurança p/ memória).
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return result?.data ?? null;
}

/**
 * Abre a câmera/galeria e devolve o conteúdo do QR escaneado.
 * Resolve `null` quando a usuária cancela ou nenhum QR é encontrado.
 */
export async function scanQrPayload(
  options: { header?: string } = {}
): Promise<string | null> {
  const photo = await Camera.getPhoto({
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    quality: 90,
    width: 1600,
    promptLabelHeader: options.header ?? 'escanear QR code',
    promptLabelPhoto: 'escolher da galeria',
    promptLabelPicture: 'tirar uma foto',
    promptLabelCancel: 'cancelar',
    correctOrientation: true,
  });
  if (!photo.dataUrl) return null;
  try {
    return await decodeQrFromDataUrl(photo.dataUrl);
  } catch {
    return null;
  }
}
