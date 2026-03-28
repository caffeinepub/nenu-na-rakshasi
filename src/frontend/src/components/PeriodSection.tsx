import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { MoodType, PeriodLog, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const SYMPTOMS = ["cramps", "bloating", "headache", "fatigue", "mood swings"];
const MOODS: { value: MoodType; emoji: string }[] = [
  { value: "happy" as MoodType, emoji: "😊" },
  { value: "sad" as MoodType, emoji: "😢" },
  { value: "anxious" as MoodType, emoji: "😰" },
  { value: "tired" as MoodType, emoji: "😴" },
  { value: "loved" as MoodType, emoji: "🥰" },
  { value: "romantic" as MoodType, emoji: "💕" },
];

export function PeriodSection({ profile }: { profile: UserProfile }) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPeriodDay, setIsPeriodDay] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState<MoodType>("happy" as MoodType);
  const [note, setNote] = useState("");
  const [partnerCanSee, setPartnerCanSee] = useState(true);
  const [saving, setSaving] = useState(false);

  const isUser1 = profile.role === "user1";

  const load = useCallback(async () => {
    if (!actor || !identity) return;
    const usersList = await actor.getUsers();
    const user1 = usersList.find((u) => u.role === "user1");
    if (!user1) return;
    const fetchedLogs = await actor.getPeriodLogs(user1.id);
    setLogs(fetchedLogs);
  }, [actor, identity]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  async function addLog() {
    if (!actor) return;
    setSaving(true);
    try {
      await actor.addPeriodLog(
        date,
        isPeriodDay,
        symptoms,
        mood,
        note || null,
        partnerCanSee,
      );
      setNote("");
      setSymptoms([]);
      setIsPeriodDay(false);
      toast.success("Log added 🌺");
      await load();
    } catch {
      toast.error("Failed to save log");
    } finally {
      setSaving(false);
    }
  }

  if (!isUser1) {
    const relevantLog = logs.find(
      (l) =>
        l.partnerCanSeeDetails &&
        l.isPeriodDay &&
        Math.abs(new Date(l.date).getTime() - Date.now()) < 3 * 86400000,
    );
    return (
      <div className="px-4 py-8 text-center calming-bg">
        <div className="text-5xl mb-4">💗</div>
        <h3 className="font-display text-lg gradient-text font-bold mb-2">
          Care Insights
        </h3>
        {relevantLog ? (
          <div className="card-romantic p-6 mt-4 text-center">
            <p className="text-base font-semibold text-foreground mb-2">
              She might need extra care today 💕
            </p>
            <p className="text-sm text-muted-foreground">
              Be gentle, loving, and present 🌸
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Low energy phase · Take it slow together
            </p>
          </div>
        ) : (
          <div className="card-romantic p-6 mt-4">
            <p className="text-sm text-muted-foreground">
              No special care notes for today. Keep being loving! 💕
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 scrollbar-hide overflow-y-auto">
      <div className="card-romantic p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          Log an Entry 🌺
        </h3>
        <div className="space-y-3">
          <input
            data-ocid="period.input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              data-ocid="period.checkbox"
              type="checkbox"
              checked={isPeriodDay}
              onChange={(e) => setIsPeriodDay(e.target.checked)}
              className="w-4 h-4 accent-pink-400"
            />
            <span className="text-sm text-foreground">Period day 🌺</span>
          </label>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Symptoms</p>
            <div className="flex flex-wrap gap-2">
              {SYMPTOMS.map((s) => (
                <button
                  key={s}
                  type="button"
                  data-ocid={`period.${s.replace(" ", "_")}.toggle`}
                  onClick={() => toggleSymptom(s)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    symptoms.includes(s)
                      ? "border-primary/60 bg-primary/20 text-foreground"
                      : "border-border bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Mood</p>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`text-lg px-2 py-1 rounded-xl border transition-all ${
                    mood === m.value
                      ? "border-primary/60 bg-primary/20 scale-110"
                      : "border-border bg-secondary/40 opacity-60"
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>
          <textarea
            data-ocid="period.textarea"
            placeholder="Any notes..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              data-ocid="period.partner_visibility.switch"
              type="checkbox"
              checked={partnerCanSee}
              onChange={(e) => setPartnerCanSee(e.target.checked)}
              className="w-4 h-4 accent-pink-400"
            />
            <span className="text-xs text-muted-foreground">
              Show care hints to partner
            </span>
          </label>
          <button
            type="button"
            data-ocid="period.submit_button"
            disabled={saving}
            onClick={addLog}
            className="w-full gradient-pink-purple text-white font-semibold py-3 rounded-xl shadow-glow disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Log 🌺"}
          </button>
        </div>
      </div>

      {logs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Past Logs
          </h3>
          <div className="space-y-2">
            {logs.slice(0, 10).map((l, i) => (
              <div
                key={l.id}
                data-ocid={`period.item.${i + 1}`}
                className="card-romantic px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm text-foreground">{l.date}</span>
                  {l.isPeriodDay && (
                    <span className="ml-2 text-xs text-primary">
                      🌺 Period day
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {l.symptoms.join(", ") || "No symptoms"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
