import { useState, useCallback } from "react";
import TopBar from "@/components/mood/TopBar";
import LogCard from "@/components/mood/LogCard";
import TodaySnapshot from "@/components/mood/TodaySnapshot";
import RecentEntries from "@/components/mood/RecentEntries";
import HistoryDrawer from "@/components/mood/HistoryDrawer";

const Index = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">
        <TopBar onOpenHistory={() => setHistoryOpen(true)} />

        <main className="flex-1 flex flex-col gap-3 px-4 py-4 pb-24">
          <LogCard onSaved={refresh} />
          <TodaySnapshot refreshKey={refreshKey} />
          <RecentEntries refreshKey={refreshKey} onRefresh={refresh} onOpenHistory={() => setHistoryOpen(true)} />
        </main>

        <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} refreshKey={refreshKey} onRefresh={refresh} />
      </div>
    </div>
  );
};

export default Index;
