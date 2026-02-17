import { useMemo, useState, useRef } from "react";
import { MoodEntry, MOODS, INTENSITY_LABELS, getMoodColor } from "@/types/mood";
import { getEntries, removeEntry, formatTimeIST } from "@/lib/moodStorage";

interface RecentEntriesProps {
  refreshKey: number;
  onRefresh: () => void;
  onOpenHistory: () => void;
}

const RecentEntries = ({ refreshKey, onRefresh, onOpenHistory }: RecentEntriesProps) => {
  const entries = useMemo(() => getEntries().slice(0, 5), [refreshKey]);

  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-heading text-[14px] font-bold text-muted-foreground px-1">Recent Entries</h3>
      {entries.map((entry) => (
        <SwipeableEntry key={entry.id} entry={entry} onRemove={() => { removeEntry(entry.id); onRefresh(); }} />
      ))}
      {getEntries().length > 5 && (
        <button onClick={onOpenHistory} className="font-body text-[13px] text-primary font-medium text-center py-2">
          View all
        </button>
      )}
    </div>
  );
};

function SwipeableEntry({ entry, onRemove }: { entry: MoodEntry; onRemove: () => void }) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  const moodData = MOODS.find((m) => m.type === entry.mood)!;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    dragging.current = true;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffset(Math.max(dx, -100));
  };
  const handleTouchEnd = () => {
    dragging.current = false;
    if (offset < -60) {
      onRemove();
    }
    setOffset(0);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 flex items-center justify-end pr-4 bg-alert rounded-xl">
        <span className="font-body text-sm text-primary-foreground font-medium">Remove</span>
      </div>
      <div
        className="relative bg-card border border-border rounded-xl px-4 py-3 transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-surface-2 rounded-lg px-2 py-1 font-body text-[11px] text-muted-foreground">
              {formatTimeIST(entry.timestamp)}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[12px] font-medium"
              style={{ backgroundColor: getMoodColor(entry.mood) + "1a", color: getMoodColor(entry.mood) }}
            >
              {moodData.emoji} {moodData.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-[2px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="w-[6px] h-[6px] rounded-full"
                  style={{ backgroundColor: i < entry.intensity ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                />
              ))}
            </div>
            {entry.tobaccoUrge !== "none" && (
              <span className="bg-warning-light text-warning rounded-full px-2 py-0.5 font-body text-[10px] font-medium">
                {entry.tobaccoUrge}
              </span>
            )}
          </div>
        </div>
        {entry.notes && (
          <p className="mt-1.5 font-body text-xs text-muted-foreground truncate">{entry.notes}</p>
        )}
      </div>
    </div>
  );
}

export default RecentEntries;
