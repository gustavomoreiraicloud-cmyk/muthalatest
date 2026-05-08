export type DayHours = { open: boolean; from: string; to: string };
export type BusinessHours = Record<string, DayHours>; // "0"..."6", 0=Domingo

export const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const DAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const DEFAULT_HOURS: BusinessHours = {
  "0": { open: false, from: "18:00", to: "23:00" },
  "1": { open: true, from: "18:00", to: "23:00" },
  "2": { open: true, from: "18:00", to: "23:00" },
  "3": { open: true, from: "18:00", to: "23:00" },
  "4": { open: true, from: "18:00", to: "23:00" },
  "5": { open: true, from: "18:00", to: "23:30" },
  "6": { open: true, from: "18:00", to: "23:30" },
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Returns next opening Date based on current moment, or null if no day is configured open. */
export function nextOpening(hours: BusinessHours, now = new Date()): Date | null {
  const todayMin = now.getHours() * 60 + now.getMinutes();
  for (let offset = 0; offset < 8; offset++) {
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    const dow = d.getDay();
    const cfg = hours[String(dow)];
    if (!cfg || !cfg.open) continue;
    const fromMin = toMinutes(cfg.from);
    if (offset === 0 && todayMin >= fromMin) continue; // already past opening today
    const result = new Date(d);
    const [h, m] = cfg.from.split(":").map(Number);
    result.setHours(h || 0, m || 0, 0, 0);
    return result;
  }
  return null;
}

/** Whether the store is currently within operating hours. */
export function isWithinHours(hours: BusinessHours, now = new Date()): boolean {
  const cfg = hours[String(now.getDay())];
  if (!cfg || !cfg.open) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur >= toMinutes(cfg.from) && cur < toMinutes(cfg.to);
}

/** "Abrimos hoje às 18h" / "Abrimos amanhã às 18h" / "Abrimos terça às 18h" */
export function formatNextOpening(next: Date, now = new Date()): string {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const target = new Date(next); target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  const time = next.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
  if (diffDays <= 0) return `Abrimos hoje às ${time}`;
  if (diffDays === 1) return `Abrimos amanhã às ${time}`;
  return `Abrimos ${DAY_LABELS[next.getDay()].toLowerCase()} às ${time}`;
}
