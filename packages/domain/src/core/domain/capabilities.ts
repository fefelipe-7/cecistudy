import type { Platform } from './common';

export type CapabilityEntity =
  | 'document'
  | 'concept'
  | 'relation'
  | 'event'
  | 'responsibility'
  | 'project'
  | 'output'
  | 'contentBase'
  | 'publication'
  // ---- entidades acadêmicas legadas (D7: integração desktop, CRUD completo).
  // Mobile NÃO recebe rows aqui — o comportamento móvel atual fica intacto.
  | 'course'
  | 'task'
  | 'exam'
  | 'classNote'
  | 'flashcard'
  | 'reading'
  | 'studySession'
  | 'material'
  | 'internshipLog'
  | 'tcc'
  | 'sticker'
  | 'quizSession';

export type Projection = 'compact' | 'standard' | 'rich';

/**
 * Matriz de capacidades por plataforma. Evita espalhar `if (isDesktop)`
 * pelas views: a UI consulta esta matriz para decidir projeção e ações.
 */
export interface PlatformCapability {
  entity: CapabilityEntity;
  platform: Platform;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  projection: Projection;
}

/** Matriz padrão (desktop edita tudo; mobile é captura/consulta). */
export const DEFAULT_CAPABILITIES: PlatformCapability[] = [
  { entity: 'document', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'document', platform: 'mobile', canView: true, canCreate: true, canEdit: true, canDelete: false, projection: 'standard' },
  { entity: 'concept', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'concept', platform: 'mobile', canView: true, canCreate: false, canEdit: false, canDelete: false, projection: 'compact' },
  { entity: 'relation', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'relation', platform: 'mobile', canView: true, canCreate: false, canEdit: false, canDelete: false, projection: 'compact' },
  { entity: 'event', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'event', platform: 'mobile', canView: true, canCreate: true, canEdit: true, canDelete: false, projection: 'compact' },
  { entity: 'responsibility', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'responsibility', platform: 'mobile', canView: true, canCreate: true, canEdit: true, canDelete: false, projection: 'compact' },
  { entity: 'project', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'project', platform: 'mobile', canView: true, canCreate: false, canEdit: false, canDelete: false, projection: 'compact' },
  { entity: 'output', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'output', platform: 'mobile', canView: true, canCreate: false, canEdit: false, canDelete: false, projection: 'compact' },
  { entity: 'contentBase', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'contentBase', platform: 'mobile', canView: true, canCreate: true, canEdit: true, canDelete: false, projection: 'compact' },
  { entity: 'publication', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'publication', platform: 'mobile', canView: true, canCreate: false, canEdit: false, canDelete: false, projection: 'compact' },
  // ---- acadêmicas legadas: desktop-only (CRUD completo via domínio Rust; D7).
  { entity: 'course', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'task', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'exam', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'classNote', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'flashcard', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'reading', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'studySession', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'material', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
  { entity: 'internshipLog', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'tcc', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'rich' },
  { entity: 'sticker', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'compact' },
  { entity: 'quizSession', platform: 'desktop', canView: true, canCreate: true, canEdit: true, canDelete: true, projection: 'standard' },
];

export function capabilityFor(
  entity: CapabilityEntity,
  platform: Platform,
  matrix: PlatformCapability[] = DEFAULT_CAPABILITIES
): PlatformCapability | undefined {
  return matrix.find((c) => c.entity === entity && c.platform === platform);
}
