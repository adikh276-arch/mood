import { useMemo, useState, useEffect, useRef } from "react";
import { X, Download, Search } from "lucide-react";
import { MoodEntry, MOODS, getMoodColor } from "@/types/mood";
import { getUserId } from "@/lib/auth";
import { getMoodLogs, deleteMoodLog } from "@/lib/db";
import { formatTimeIST, formatDateDDMMYYYY } from "@/lib/moodStorage";
import { toast } from "sonner";

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  refreshKey: number;
  onRefresh: () => void;
}

const HistoryDrawer = ({ open, onClose, refreshKey, onRefresh }: HistoryDrawerProps) => {
  const [allEntries, setAllEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEntries = async () => {
      if (!open) return;
      const userId = getUserId();
      if (!userId) return;
      setLoading(true);
      try {
        const data = await getMoodLogs(userId);
        setAllEntries(data);
      } catch (error) {
        console.error("Failed to fetch history mood logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [open, refreshKey]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allEntries;
    const q = search.toLowerCase();
    return allEntries.filter(
      (e) =>
        e.mood.includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        e.factors.some((f) => f.toLowerCase().includes(q))
    );
  }, [allEntries, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, MoodEntry[]>();
    filtered.forEach((e) => {
      const key = formatDateDDMMYYYY(e.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Bar chart data
  const moodCounts = useMemo(() => {
    return MOODS.map((m) => ({
      ...m,
      count: allEntries.filter((e) => e.mood === m.type).length,
    }));
  }, [allEntries]);

  const maxCount = Math.max(...moodCounts.map((m) => m.count), 1);

  // Stats
  const topMood = moodCounts.reduce((a, b) => (b.count > a.count ? b : a), moodCounts[0]);
  const urgePercent = allEntries.length
    ? Math.round((allEntries.filter((e) => e.tobaccoUrge !== "none").length / allEntries.length) * 100)
    : 0;

  const handleRemove = async (id: string) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      await deleteMoodLog(userId, id);
      setAllEntries(prev => prev.filter(e => e.id !== id));
      onRefresh();
      toast("Entry removed");
    } catch (error) {
      console.error("Failed to remove mood log:", error);
      toast.error("Failed to remove entry");
    }
  };

  const handleExport = () => {
    const csv = [
      "Date,Time,Mood,Intensity,Factors,Tobacco Urge,Notes",
      ...allEntries.map((e) =>
        [
          formatDateDDMMYYYY(e.timestamp),
          formatTimeIST(e.timestamp),
          e.mood,
          e.intensity,
          `"${e.factors.join(", ")}"`,
          e.tobaccoUrge,
          `"${(e.notes || "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mood-log-${formatDateDDMMYYYY(new Date().toISOString()).replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-border" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-heading text-[16px] font-semibold text-foreground">Mood Records</h2>
        <button onClick={onClose} className="p-1" aria-label="Close">
          <X size={20} className="text-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {loading ? (
          <p className="text-center font-body text-sm text-muted-foreground py-8">Loading history...</p>
        ) : (
          <>
            {/* Bar Chart */}
            <div className="card-base mb-4 p-4">
              <div className="flex flex-col gap-2">
                {moodCounts.map((m) => (
                  <div key={m.type} className="flex items-center gap-2">
                    <span className="w-24 font-body text-[11px] text-body truncate">
                      {m.emoji} {m.label}
                    </span>
                    <div className="flex-1 h-5 bg-surface-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(m.count / maxCount) * 100}%`,
                          backgroundColor: getMoodColor(m.type),
                          minWidth: m.count > 0 ? 8 : 0,
                        }}
                      />
                    </div>
                    <span className="font-body text-[11px] text-muted-foreground w-6 text-right">{m.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search entries..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded-xl pl-9 pr-4 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-card outline-none transition-colors"
              />
            </div>

            {/* Grouped entries */}
            {grouped.map(([date, entries]) => (
              <div key={date} className="mb-4">
                <p className="font-body text-xs text-muted-foreground mb-2 px-1">{date}</p>
                <div className="flex flex-col gap-2">
                  {entries.map((entry) => {
                    const moodData = MOODS.find((m) => m.type === entry.mood)!;
                    return (
                      <SwipeToRemove key={entry.id} onRemove={() => handleRemove(entry.id)}>
                        <div className="bg-card border border-border rounded-xl px-4 py-3">
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
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="w-[6px] h-[6px] rounded-full"
                                  style={{ backgroundColor: i < entry.intensity ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                                />
                              ))}
                            </div>
                          </div>
                          {entry.factors.length > 0 && (
                            <p className="mt-1.5 font-body text-[11px] text-muted-foreground">{entry.factors.join(", ")}</p>
                          )}
                          {entry.notes && (
                            <p className="mt-1 font-body text-xs text-muted-foreground">{entry.notes}</p>
                          )}
                        </div>
                      </SwipeToRemove>
                    );
                  })}
                </div>
              </div>
            ))}

            {allEntries.length > 0 && (
              <div className="mt-2 mb-4 px-1">
                <p className="font-body text-xs text-muted-foreground">
                  Most recorded: {topMood.emoji} {topMood.label} — {topMood.count} entries.
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  Tobacco urge noted in {urgePercent}% of all entries.
                </p>
              </div>
            )}

            {allEntries.length === 0 && (
              <p className="font-body text-sm text-muted-foreground text-center py-8">No entries yet.</p>
            )}

            {/* Export */}
            {allEntries.length > 0 && (
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 h-[48px] border border-border rounded-[14px] font-heading text-[14px] font-semibold text-foreground active:scale-[0.97] transition-all mb-4"
              >
                <Download size={16} />
                Export CSV
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

function SwipeToRemove({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="absolute inset-0 flex items-center justify-end pr-4 bg-alert rounded-xl">
        <span className="font-body text-sm text-primary-foreground font-medium">Remove</span>
      </div>
      <div
        className="relative transition-transform"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={(e) => { startX.current = e.touches[0].clientX; dragging.current = true; }}
        onTouchMove={(e) => {
          if (!dragging.current) return;
          const dx = e.touches[0].clientX - startX.current;
          if (dx < 0) setOffset(Math.max(dx, -100));
        }}
        onTouchEnd={() => {
          dragging.current = false;
          if (offset < -60) onRemove();
          setOffset(0);
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default HistoryDrawer;
