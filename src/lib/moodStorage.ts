import { MoodEntry } from "@/types/mood";

const KEY = "moodLogs";

export function getEntries(): MoodEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: MoodEntry): void {
  const entries = getEntries();
  entries.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function removeEntry(id: string): void {
  const entries = getEntries().filter((e) => e.id !== id);
  localStorage.setItem(KEY, JSON.stringify(entries));
}

export function getTodayEntries(): MoodEntry[] {
  const today = new Date().toDateString();
  return getEntries().filter((e) => new Date(e.timestamp).toDateString() === today);
}

export function formatTimeIST(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function formatDateDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
