import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { SurpriseDrop } from "../backend.d";
import { useActor } from "../hooks/useActor";

export function DropsSection() {
  const { actor } = useActor();
  const [drops, setDrops] = useState<SurpriseDrop[]>([]);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [revealing, setRevealing] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!actor) return;
    const d = await actor.getDropsForUser();
    setDrops(d);
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function createDrop() {
    if (!actor || !message.trim() || !unlockDate) return;
    setSaving(true);
    try {
      const users = await actor.getUsers();
      const partner = users[0];
      if (!partner) {
        toast.error("Partner not joined yet");
        return;
      }
      const unlockAt = BigInt(new Date(unlockDate).getTime()) * 1_000_000n;
      await actor.createDrop(
        partner.id,
        message.trim(),
        imageUrl || null,
        unlockAt,
      );
      setMessage("");
      setImageUrl("");
      setUnlockDate("");
      toast.success("Surprise drop created 🎁");
      await load();
    } catch {
      toast.error("Failed to create drop");
    } finally {
      setSaving(false);
    }
  }

  async function revealDrop(dropId: string) {
    if (!actor) return;
    setRevealing(dropId);
    try {
      await actor.revealDrop(dropId);
      await load();
    } catch {
      toast.error("Failed to reveal");
    } finally {
      setRevealing(null);
    }
  }

  const now = BigInt(Date.now()) * 1_000_000n;
  const unlockedDrops = drops.filter((d) => d.unlockAt <= now);
  const lockedDrops = drops.filter((d) => d.unlockAt > now);

  return (
    <div className="px-4 py-4 space-y-5 overflow-y-auto scrollbar-hide">
      <div className="card-romantic p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Create a Surprise 🎁
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Schedule something sweet for later
        </p>
        <div className="space-y-3">
          <textarea
            data-ocid="drops.textarea"
            placeholder="Your surprise message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 resize-none"
          />
          <input
            data-ocid="drops.upload_button"
            type="file"
            accept="image/*"
            onChange={handleImageFile}
            className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/20 file:text-primary cursor-pointer"
          />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Unlock at</p>
            <input
              data-ocid="drops.input"
              type="datetime-local"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/60"
            />
          </div>
          <button
            type="button"
            data-ocid="drops.submit_button"
            disabled={!message.trim() || !unlockDate || saving}
            onClick={createDrop}
            className="w-full gradient-pink-purple text-white font-semibold py-3 rounded-xl shadow-glow disabled:opacity-50"
          >
            {saving ? "Creating..." : "Schedule Drop 🎁"}
          </button>
        </div>
      </div>

      {unlockedDrops.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Ready to open 🎉
          </h3>
          <div className="space-y-3">
            {unlockedDrops.map((d, i) => (
              <div
                key={d.id}
                data-ocid={`drops.item.${i + 1}`}
                className="card-romantic p-4"
              >
                {d.isRevealed ? (
                  <div className="animate-fade-in">
                    {d.imageUrl && (
                      <img
                        src={d.imageUrl}
                        alt="surprise"
                        className="w-full h-36 object-cover rounded-xl mb-3"
                      />
                    )}
                    <p className="text-sm text-foreground">{d.message}</p>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-4xl mb-3">🎁</div>
                    <p className="text-sm text-muted-foreground mb-3">
                      You have a surprise waiting!
                    </p>
                    <button
                      type="button"
                      data-ocid={`drops.reveal_button.${i + 1}`}
                      disabled={revealing === d.id}
                      onClick={() => revealDrop(d.id)}
                      className="gradient-pink-purple text-white font-semibold px-6 py-2.5 rounded-xl shadow-glow text-sm"
                    >
                      {revealing === d.id ? "Opening..." : "Open Surprise ✨"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {lockedDrops.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Coming soon 🔒
          </h3>
          <div className="space-y-3">
            {lockedDrops.map((d, i) => {
              const unlockMs = Number(d.unlockAt / 1_000_000n);
              const diff = unlockMs - Date.now();
              const days = Math.floor(diff / 86400000);
              const hrs = Math.floor((diff % 86400000) / 3600000);
              return (
                <div
                  key={d.id}
                  data-ocid={`drops.item.${unlockedDrops.length + i + 1}`}
                  className="card-romantic p-4 opacity-70"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <p className="text-sm text-foreground">Locked surprise</p>
                      <p className="text-xs text-muted-foreground">
                        Opens in {days > 0 ? `${days}d ` : ""}
                        {hrs}h
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {drops.length === 0 && (
        <div data-ocid="drops.empty_state" className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No drops yet. Create your first surprise 🎁
          </p>
        </div>
      )}
    </div>
  );
}
