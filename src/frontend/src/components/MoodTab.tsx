import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { MoodEntry, MoodType } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const MOODS: { value: MoodType; emoji: string; label: string }[] = [
  { value: "happy" as MoodType, emoji: "😊", label: "Happy" },
  { value: "sad" as MoodType, emoji: "😢", label: "Sad" },
  { value: "anxious" as MoodType, emoji: "😰", label: "Anxious" },
  { value: "loved" as MoodType, emoji: "🥰", label: "Loved" },
  { value: "tired" as MoodType, emoji: "😴", label: "Tired" },
  { value: "romantic" as MoodType, emoji: "💕", label: "Romantic" },
];

export function MoodTab() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const callerPrincipal = identity?.getPrincipal().toString();

  const load = useCallback(async () => {
    if (!actor) return;
    const all = await actor.getMoodEntries();
    setEntries(all.filter((e) => e.date === today));
  }, [actor, today]);

  useEffect(() => {
    load();
  }, [load]);

  const myEntry = entries.find((e) => e.userId.toString() === callerPrincipal);
  const partnerEntry = entries.find(
    (e) => e.userId.toString() !== callerPrincipal,
  );

  async function selectMood(mood: MoodType) {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.logMood(mood, today, null);
      await load();
      toast.success("Mood updated 🌙");
    } catch {
      toast.error("Failed to update mood");
    } finally {
      setSaving(false);
    }
  }

  function getMoodEmoji(mood: MoodType) {
    return MOODS.find((m) => m.value === mood)?.emoji ?? "✨";
  }
  function getMoodLabel(mood: MoodType) {
    return MOODS.find((m) => m.value === mood)?.label ?? mood;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-6 scrollbar-hide calming-bg">
      <h2 className="font-display text-xl gradient-text font-bold mb-1 text-center">
        Mood Sync 🌙
      </h2>
      <p className="text-muted-foreground text-xs text-center mb-6">
        How are you both feeling today?
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-romantic p-5 text-center">
          <p className="text-xs text-muted-foreground mb-3">Your mood</p>
          <div className="text-5xl mb-2">
            {myEntry ? getMoodEmoji(myEntry.mood) : "🌑"}
          </div>
          <p className="text-sm font-medium text-foreground">
            {myEntry ? getMoodLabel(myEntry.mood) : "Not set"}
          </p>
        </div>
        <div className="card-romantic p-5 text-center">
          <p className="text-xs text-muted-foreground mb-3">Partner's mood</p>
          <div className="text-5xl mb-2">
            {partnerEntry ? getMoodEmoji(partnerEntry.mood) : "🌑"}
          </div>
          <p className="text-sm font-medium text-foreground">
            {partnerEntry ? getMoodLabel(partnerEntry.mood) : "Not shared"}
          </p>
        </div>
      </div>

      <div className="card-romantic p-5">
        <p className="text-sm font-semibold text-foreground mb-4">
          How are you feeling?
        </p>
        <div className="grid grid-cols-3 gap-3">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              data-ocid={`mood.${m.value}.button`}
              disabled={saving}
              onClick={() => selectMood(m.value)}
              className={`flex flex-col items-center py-3 px-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${
                myEntry?.mood === m.value
                  ? "border-primary/60 bg-primary/15 shadow-glow"
                  : "border-border bg-secondary/40 hover:border-border hover:bg-secondary/60"
              }`}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <span className="text-[11px] text-muted-foreground">
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
