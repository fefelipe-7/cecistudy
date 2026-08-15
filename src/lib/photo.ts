import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNativePlatform } from './storage';

const PROFILE_IMAGE_MAX_WIDTH = 400;

/**
 * Escolhe uma foto de perfil e devolve como data URL.
 * - Nativo: abre câmera/galeria do sistema (prompt de escolha).
 * - Web: abre o seletor de arquivos do navegador.
 * Retorna `null` se o usuário cancelar.
 */
export async function pickProfilePhoto(): Promise<string | null> {
  if (isNativePlatform) {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt,
      width: PROFILE_IMAGE_MAX_WIDTH,
      quality: 80,
      promptLabelHeader: 'sua foto de perfil',
      promptLabelPhoto: 'escolher da galeria',
      promptLabelPicture: 'tirar uma foto',
      promptLabelCancel: 'cancelar',
      saveToGallery: false,
      correctOrientation: true,
    });
    return photo.dataUrl ?? null;
  }

  return pickFromFileInput();
}

/**
 * No web, usa um <input type="file"> escondido + FileReader.
 * Redimensiona via canvas para caber no localStorage.
 */
function pickFromFileInput(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : null;
        if (!dataUrl) {
          resolve(null);
          return;
        }
        resizeImage(dataUrl)
          .then(resolve)
          .catch(() => resolve(dataUrl));
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    document.body.appendChild(input);
    input.click();
    input.remove();
  });
}

/** Redimensiona a imagem (canvas) mantendo proporção, dentro do limite de largura. */
function resizeImage(dataUrl: string, maxWidth = PROFILE_IMAGE_MAX_WIDTH): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('invalid image'));
    img.src = dataUrl;
  });
}
