import type { ChannelVariant, ContentBase } from '../../domain';
import { createContentBase } from '../../domain';

export function createContentBaseUseCase(input: { ideaId: string; message: string }): ContentBase {
  return createContentBase(input);
}

/** Aprovação é individual por adaptação de canal (não aprova as outras). */
export function approveChannelVariant(variant: ChannelVariant): ChannelVariant {
  return { ...variant, approved: true, status: 'aprovado' };
}

export function rejectChannelVariant(variant: ChannelVariant): ChannelVariant {
  return { ...variant, approved: false, status: 'rascunho' };
}
