import { MoodEntry, MOODS, getMoodColor } from "@/types/mood";
import { getTodayEntries, formatTimeIST } from "@/lib/moodStorage";
import { useState, useMemo } from "react";

interface TodaySnapshotProps {
  refreshKey: number;
}

const TodaySnapshot = ({ refreshKey }: TodaySnapshotProps) => {
  const entries = useMemo(() => getTodayEntries(), [refreshKey]);
  const [tooltip, setTooltip] = useState<MoodEntry | null>(null);

  if (entries.length === 0) return null;

  const moodCounts: Record<string, number> = {};
  let urgeCount = 0;
  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    if (e.tobaccoUrge !== "none") urgeCount++;
  });

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  const topMoodData = MOODS.find((m) => m.type === topMood[0]);

  // Timeline: 6AM to 11PM = 17 hours
  const startHour = 6;
  const endHour = 23;
  const range = endHour - startHour;

  const getX = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours() + d.getMinutes() / 60;
    const clamped = Math.max(startHour, Math.min(endHour, h));
    return ((clamped - startHour) / range) * 100;
  };

  return (
    <div className="card-base flex flex-col gap-3">
      <h2 className="section-title">Today</h2>

      <div className="flex flex-wrap gap-2">
        {[
          `Entries: ${entries.length}`,
          `Most recorded: ${topMoodData?.emoji} ${topMoodData?.label}`,
          `Urge noted: ${urgeCount}`,
        ].map((text) => (
          <span key={text} className="inline-flex items-center bg-surface-2 border border-border rounded-[20px] px-3.5 py-2 font-body text-[13px] text-body">
            {text}
          </span>
        ))}
      </div>

      {/* Mini Timeline */}
      <div className="relative mt-1" style={{ height: 60 }}>
        <svg width="100%" height="40" className="overflow-visible">
          <line x1="0" y1="20" x2="100%" y2="20" stroke="hsl(var(--border-light))" strokeWidth="1" />
          {entries.map((e) => (
            <circle
              key={e.id}
              cx={`${getX(e.timestamp)}%`}
              cy="20"
              r="5"
              fill={getMoodColor(e.mood)}
              className="cursor-pointer"
              onClick={() => setTooltip(tooltip?.id === e.id ? null : e)}
            />
          ))}
        </svg>
        <div className="flex justify-between mt-1 font-body text-[10px] text-muted-foreground">
          <span>6AM</span><span>12PM</span><span>6PM</span><span>11PM</span>
        </div>

        {tooltip && (
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 bg-card border border-border rounded-[10px] px-3 py-2 shadow-lg z-10 animate-slide-up-fade whitespace-nowrap">
            <span className="font-body text-xs text-foreground">
              {MOODS.find((m) => m.type === tooltip.mood)?.emoji}{" "}
              {MOODS.find((m) => m.type === tooltip.mood)?.label} — {formatTimeIST(tooltip.timestamp)} — Intensity {tooltip.intensity}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaySnapshot;
