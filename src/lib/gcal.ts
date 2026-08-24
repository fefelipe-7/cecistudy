import type { GcalEventInput } from './gcalLogic';
import type { Exam, Task, Course } from '../types';
import { buildEventForExam, buildEventForTask } from './gcalLogic';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB as string | undefined;
const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** ambiente web com client id configurado? */
export function isGcalConfigured(): boolean {
  return typeof CLIENT_ID === 'string' && CLIENT_ID.length > 0;
}

// ---- tipos mínimos do Google Identity Services (web) ----
interface TokenClient {
  requestAccessToken: (override?: { prompt?: string }) => void;
}
interface GisGoogle {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (resp: { access_token?: string; error?: string }) => void;
      }) => TokenClient;
    };
  };
}
declare global {
  interface Window {
    google?: GisGoogle;
  }
}

let accessToken: string | null = null;
let tokenClient: TokenClient | null = null;

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existing = document.getElementById('gis-client');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.id = 'gis-client';
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('falha ao carregar o google identity services'));
    document.head.appendChild(s);
  });
}

/** abre o popup de consentimento e guarda o token em memória. */
export async function connectGcal(): Promise<boolean> {
  if (!isGcalConfigured() || !CLIENT_ID) return false;
  try {
    await loadGisScript();
    if (!tokenClient) {
      tokenClient = window.google!.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (resp) => {
          accessToken = resp.access_token ?? null;
        },
      });
    }
    await new Promise<void>((resolve) => {
      tokenClient!.requestAccessToken({ prompt: '' });
      // o callback do initTokenClient define accessToken; aguardamos um tick
      setTimeout(resolve, 600);
    });
    return accessToken != null;
  } catch (e) {
    console.error('gcal connect error', e);
    return false;
  }
}

export function disconnectGcal(): void {
  accessToken = null;
  tokenClient = null;
}

async function putEvent(event: GcalEventInput): Promise<string | null> {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(event.id)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.start },
        end: { dateTime: event.end },
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { id?: string };
    return data.id ?? event.id;
  } catch (e) {
    console.error('gcal put error', e);
    return null;
  }
}

async function deleteEvent(eventId: string): Promise<void> {
  if (!accessToken) return;
  try {
    await fetch(`${CALENDAR_API}/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (e) {
    console.error('gcal delete error', e);
  }
}

export async function syncExam(exam: Exam, courses: Course[]): Promise<string | null> {
  if (!accessToken) return null;
  return putEvent(buildEventForExam(exam, courses));
}

export async function syncTask(task: Task, courses: Course[]): Promise<string | null> {
  if (!accessToken) return null;
  return putEvent(buildEventForTask(task, courses));
}

export async function unsyncEvent(gcalEventId: string): Promise<void> {
  await deleteEvent(gcalEventId);
}
