import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format an Airtable date string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS) as dd/mm/yyyy HH:MM:ss */
export function formatAdminDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/);
  if (!m) return dateStr;
  const [, year, month, day, hh = '00', mm = '00', ss = '00'] = m;
  return `${day}/${month}/${year} ${hh}:${mm}:${ss}`;
}
