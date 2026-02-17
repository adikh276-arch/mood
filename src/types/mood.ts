export interface MoodEntry {
  id: string;
  timestamp: string; // ISO
  mood: MoodType;
  intensity: 1 | 2 | 3 | 4 | 5;
  factors: string[];
  tobaccoUrge: "none" | "mild" | "strong";
  notes: string;
}

export type MoodType =
  | "joyful"
  | "calm"
  | "engaged"
  | "neutral"
  | "low"
  | "anxious"
  | "irritable"
  | "fatigued"
  | "overwhelmed";

export const MOODS: { type: MoodType; emoji: string; label: string }[] = [
  { type: "joyful", emoji: "😁", label: "Joyful" },
  { type: "calm", emoji: "😌", label: "Calm" },
  { type: "engaged", emoji: "🤩", label: "Engaged" },
  { type: "neutral", emoji: "😐", label: "Neutral" },
  { type: "low", emoji: "😔", label: "Low" },
  { type: "anxious", emoji: "😟", label: "Anxious" },
  { type: "irritable", emoji: "😤", label: "Irritable" },
  { type: "fatigued", emoji: "😴", label: "Fatigued" },
  { type: "overwhelmed", emoji: "😣", label: "Overwhelmed" },
];

export const FACTORS = [
  "Work demands",
  "Interpersonal conflict",
  "Personal matters",
  "Sleep quality",
  "Health",
  "Recovery progress",
  "Achievement",
  "Isolation",
  "Financial concern",
  "Other",
];

export const INTENSITY_LABELS = ["Minimal", "Low", "Moderate", "High", "Very High"];

export type MoodCategory = "positive" | "neutral" | "low" | "distressed" | "fatigued";

export function getMoodCategory(mood: MoodType): MoodCategory {
  if (["joyful", "calm", "engaged"].includes(mood)) return "positive";
  if (mood === "neutral") return "neutral";
  if (["low", "anxious"].includes(mood)) return "low";
  if (["irritable", "overwhelmed"].includes(mood)) return "distressed";
  return "fatigued";
}

export function getMoodColor(mood: MoodType): string {
  const cat = getMoodCategory(mood);
  switch (cat) {
    case "positive": return "hsl(157, 88%, 34%)";
    case "neutral": return "hsl(202, 92%, 59%)";
    case "low": return "hsl(38, 92%, 44%)";
    case "distressed": return "hsl(355, 72%, 54%)";
    case "fatigued": return "hsl(210, 16%, 56%)";
  }
}
