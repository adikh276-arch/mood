import { useState, useEffect } from "react";
import { MOODS, FACTORS, INTENSITY_LABELS, MoodType, MoodEntry } from "@/types/mood";
import { getUserId } from "@/lib/auth";
import { saveMoodLog } from "@/lib/db";
import { generateId, formatTimeIST } from "@/lib/moodStorage";
import { toast } from "sonner";

interface LogCardProps {
  onSaved: () => void;
}

const LogCard = ({ onSaved }: LogCardProps) => {
  const [mood, setMood] = useState<MoodType | null>(null);
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [factors, setFactors] = useState<string[]>([]);
  const [tobaccoUrge, setTobaccoUrge] = useState<"none" | "mild" | "strong">("none");
  const [notes, setNotes] = useState("");
  const [timestamp, setTimestamp] = useState(new Date().toISOString());
  const [editingTime, setEditingTime] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!editingTime) setTimestamp(new Date().toISOString());
    }, 30000);
    return () => clearInterval(interval);
  }, [editingTime]);

  const toggleFactor = (f: string) => {
    setFactors((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const handleSave = async () => {
    if (!mood) {
      toast("Select a mood to save.");
      return;
    }
    const userId = getUserId();
    if (!userId) {
      toast.error("User session not found");
      return;
    }
    const entry: MoodEntry = {
      id: generateId(),
      timestamp,
      mood,
      intensity,
      factors,
      tobaccoUrge,
      notes: notes.trim(),
    };
    try {
      await saveMoodLog(userId, entry);
      toast("Entry saved.");
      setMood(null);
      setIntensity(3);
      setFactors([]);
      setTobaccoUrge("none");
      setNotes("");
      setTimestamp(new Date().toISOString());
      setEditingTime(false);
      onSaved();
    } catch (error) {
      console.error("Failed to save mood log:", error);
      toast.error("Failed to save entry");
    }
  };

  const urges: ("none" | "mild" | "strong")[] = ["none", "mild", "strong"];

  return (
    <div className="card-base flex flex-col gap-5">
      <h2 className="section-title">Log Mood</h2>

      {/* Mood Grid */}
      <div>
        <p className="label-text mb-2">Current mood</p>
        <div className="grid grid-cols-3 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.type}
              onClick={() => setMood(m.type)}
              className={`flex flex-col items-center justify-center rounded-xl border p-3 transition-all duration-150 active:scale-[1.04] ${mood === m.type
                  ? "bg-primary-light border-2 border-primary"
                  : "bg-surface-2 border-border"
                }`}
              style={{ minHeight: 80 }}
            >
              <span className="text-[26px] leading-none">{m.emoji}</span>
              <span className="font-body text-[11px] text-body mt-1">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div>
        <p className="label-text mb-2">Intensity</p>
        <div className="flex justify-between">
          {([1, 2, 3, 4, 5] as const).map((level) => (
            <button
              key={level}
              onClick={() => setIntensity(level)}
              className="flex-1 flex flex-col items-center gap-1 py-1"
              aria-label={INTENSITY_LABELS[level - 1]}
            >
              <div className="flex gap-[3px]">
                {Array.from({ length: level }).map((_, i) => (
                  <span
                    key={i}
                    className="inline-block w-[14px] h-[14px] rounded-full transition-colors duration-150"
                    style={{
                      backgroundColor: intensity >= level ? "hsl(var(--primary))" : "hsl(var(--border))",
                    }}
                  />
                ))}
              </div>
              <span className="font-body text-[10px] text-muted-foreground">{INTENSITY_LABELS[level - 1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Factors */}
      <div>
        <p className="label-text mb-2">Contributing factors</p>
        <div className="flex flex-wrap gap-2">
          {FACTORS.map((f) => (
            <button
              key={f}
              onClick={() => toggleFactor(f)}
              className={factors.includes(f) ? "chip-selected" : "chip-unselected"}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tobacco Urge */}
      <div>
        <p className="label-text mb-2">Tobacco urge</p>
        <div className="grid grid-cols-3 gap-2">
          {urges.map((u) => (
            <button
              key={u}
              onClick={() => setTobaccoUrge(u)}
              className={`text-center py-2.5 rounded-xl border font-body text-[13px] transition-all duration-150 ${tobaccoUrge === u
                  ? "bg-primary-light border-primary text-accent-foreground font-medium"
                  : "bg-surface-2 border-border text-muted-foreground"
                }`}
            >
              {u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>
        {tobaccoUrge === "strong" && (
          <div className="mt-3 p-3 rounded-[10px] bg-warning-light border border-warning/30">
            <p className="font-body text-[13px] text-body leading-snug">
              A strong association between negative mood states and tobacco urges is well-documented.
              Consider discussing patterns with your counsellor.
              <span className="text-muted-foreground"> — NIMHANS, 2022</span>
            </p>
          </div>
        )}
      </div>

      {/* Time */}
      <div>
        <p className="label-text mb-1">Recorded at</p>
        <div className="flex items-center gap-2">
          {editingTime ? (
            <input
              type="datetime-local"
              className="bg-surface-2 border border-border rounded-lg px-3 py-2 font-body text-sm text-foreground focus:border-primary focus:bg-card outline-none"
              value={timestamp.slice(0, 16)}
              onChange={(e) => setTimestamp(new Date(e.target.value).toISOString())}
              onBlur={() => setEditingTime(false)}
              autoFocus
            />
          ) : (
            <>
              <span className="font-body text-sm text-foreground">{formatTimeIST(timestamp)}</span>
              <button onClick={() => setEditingTime(true)} className="font-body text-[13px] text-primary font-medium">
                Edit time
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="label-text mb-2">Notes</p>
        <textarea
          rows={3}
          placeholder="Optional — any context to record."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card outline-none resize-none transition-colors"
        />
        <p className="font-body text-[11px] text-muted-foreground mt-1">Stored only on this device.</p>
      </div>

      <hr className="border-border-light" />

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full h-[52px] bg-primary text-primary-foreground font-heading text-[15px] font-semibold rounded-[14px] active:scale-[0.97] active:bg-primary-dark transition-all duration-120"
      >
        Save Entry
      </button>
    </div>
  );
};

export default LogCard;
