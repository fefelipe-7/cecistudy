import type { InternshipLog } from '../types';

export interface DerivedCase {
  /** Chave de agrupamento (paciente normalizado: minúsculas + sem espaços). */
  patientKey: string;
  /** Rótulo exibível (iniciais do paciente). */
  patientLabel: string;
  /** Registros de atendimento do caso, ordenados por sessão/data. */
  logs: InternshipLog[];
  totalHours: number;
  lastSessionDate: string;
  /** Atendimentos ainda sem reflexão registrada. */
  pendingReflection: number;
  /** Atendimentos ainda não discutidos em supervisão. */
  pendingSupervision: number;
}

function patientKey(patient?: string): string {
  return (patient ?? '').trim().toLowerCase();
}

function patientLabel(patient?: string): string {
  return (patient ?? '').trim();
}

function numericDate(log: InternshipLog): number {
  return new Date(log.date).getTime();
}

/**
 * Deriva a visão "por paciente/caso" a partir dos logs.
 * Filtra apenas `atendimento_clinico` com `patient` preenchido e agrupa por
 * iniciais normalizadas. Ordena os logs por sessão, depois por data.
 */
export function deriveCases(logs: InternshipLog[]): DerivedCase[] {
  const map = new Map<string, DerivedCase>();

  for (const log of logs) {
    if (log.type !== 'atendimento_clinico') continue;
    if (!log.patient?.trim()) continue;

    const key = patientKey(log.patient);
    const existing = map.get(key);
    if (existing) {
      existing.logs.push(log);
    } else {
      map.set(key, {
        patientKey: key,
        patientLabel: patientLabel(log.patient),
        logs: [log],
        totalHours: 0,
        lastSessionDate: '',
        pendingReflection: 0,
        pendingSupervision: 0,
      });
    }
  }

  const cases = [...map.values()];

  for (const c of cases) {
    c.logs.sort((a, b) => {
      const aNum = a.sessionNumber ?? 0;
      const bNum = b.sessionNumber ?? 0;
      if (aNum !== bNum) return aNum - bNum;
      return numericDate(a) - numericDate(b);
    });

    c.totalHours = c.logs.reduce((acc, l) => acc + (l.hours || 0), 0);
    const last = c.logs[c.logs.length - 1];
    c.lastSessionDate = last ? last.date : '';
    c.pendingReflection = c.logs.filter((l) => !l.reflections?.trim()).length;
    c.pendingSupervision = c.logs.filter((l) => !l.supervisionLogId).length;
  }

  // Ordena casos por data da última sessão (mais recente primeiro).
  cases.sort((a, b) => (a.lastSessionDate < b.lastSessionDate ? 1 : -1));

  return cases;
}