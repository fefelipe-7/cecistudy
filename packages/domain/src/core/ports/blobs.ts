/** Referência de um blob (PDF, imagem, DOCX, vídeo, anexo, exportação). */
export interface BlobRef {
  id: string;
  name: string;
  size: number;
  mime: string;
}

/**
 * Provider de blobs, separado do provider de dados estruturados. Permite migrar
 * armazenamento (GitHub → WebDAV/S3/Drive) independentemente do SyncProvider.
 */
export interface BlobProvider {
  put(id: string, data: Uint8Array, meta?: Record<string, string>): Promise<BlobRef>;
  get(id: string): Promise<Uint8Array | null>;
  remove(id: string): Promise<void>;
  list(): Promise<BlobRef[]>;
}