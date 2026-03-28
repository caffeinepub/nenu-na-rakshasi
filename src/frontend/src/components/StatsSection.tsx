import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { RelationshipStats } from "../backend.d";
import { useActor } from "../hooks/useActor";

export function StatsSection() {
  const { actor } = useActor();
  const [stats, setStats] = useState<RelationshipStats | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [dateInput, setDateInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    const [s, msgs] = await Promise.all([
      actor.getRelationshipStats(),
      actor.getMessages(),
    ]);
    if (s) {
      setStats(s);
      setDateInput(s.startDate);
    }
    setMessageCount(msgs.length);
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveDate() {
    if (!actor || !dateInput) return;
    setSaving(true);
    try {
      await actor.setRelationshipStartDate(dateInput);
      await load();
      toast.success("Date saved 💕");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const daysTogether = stats?.startDate
    ? Math.floor((Date.now() - new Date(stats.startDate).getTime()) / 86400000)
    : null;

  return (
    <div className="px-4 py-6 space-y-4 calming-bg">
      <div className="grid grid-cols-2 gap-4">
        <div className="card-romantic p-5 text-center animate-slide-up">
          <p className="text-4xl font-display font-bold gradient-text mb-1">
            {daysTogether !== null ? daysTogether : "—"}
          </p>
          <p className="text-xs text-muted-foreground">Days Together</p>
        </div>
        <div className="card-romantic p-5 text-center animate-slide-up">
          <p className="text-4xl font-display font-bold gradient-text mb-1">
            {messageCount}
          </p>
          <p className="text-xs text-muted-foreground">Messages Shared</p>
        </div>
      </div>

      <div className="card-romantic p-5">
        <p className="text-sm font-semibold text-foreground mb-3">
          When did your story begin? 🌹
        </p>
        <input
          data-ocid="stats.input"
          type="date"
          value={dateInput}
          onChange={(e) => setDateInput(e.target.value)}
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 mb-3"
        />
        <button
          type="button"
          data-ocid="stats.save_button"
          disabled={!dateInput || saving}
          onClick={saveDate}
          className="w-full gradient-pink-purple text-white font-semibold py-3 rounded-xl shadow-glow disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Date"}
        </button>
      </div>
    </div>
  );
}
