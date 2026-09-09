import type { Channel } from '../domain';

export type GoogleEventSyncState = 'linked' | 'external_readonly' | 'conflict';

/** Adapter de integração com Google Calendar (bidirecional; origem define edição). */
export interface GoogleCalendarAdapter {
  pushEvent(event: unknown): Promise<string>;
  pullEvents(): Promise<unknown[]>;
  resolveConflict(local: unknown, remote: unknown, take: 'local' | 'remote' | 'merge'): Promise<unknown>;
}

/** Adapter de publicação em rede social (autorização individual e revogável). */
export interface SocialAdapter {
  readonly channel: Channel;
  publish(variantId: string): Promise<{ ok: boolean; url?: string }>;
}