import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Card, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function SorryTab({ profile: _profile }: { profile: UserProfile }) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [cards, setCards] = useState<Card[]>([]);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);
  const callerPrincipal = identity?.getPrincipal().toString();

  const loadCards = useCallback(async () => {
    if (!actor) return;
    const all = await actor.getCards();
    setCards(all);
    for (const c of all) {
      if (c.senderId.toString() !== callerPrincipal && !c.isRead) {
        actor.markCardAsRead(c.id).catch(() => {});
      }
    }
  }, [actor, callerPrincipal]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function sendCard() {
    if (!actor || !message.trim()) return;
    setSending(true);
    try {
      await actor.sendSorryCard(message.trim(), imageUrl || null);
      setMessage("");
      setImageUrl("");
      toast.success("Sorry card sent 💕");
      await loadCards();
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  }

  const received = cards.filter(
    (c) => c.senderId.toString() !== callerPrincipal,
  );
  const sent = cards.filter((c) => c.senderId.toString() === callerPrincipal);

  return (
    <div className="h-full overflow-y-auto px-4 py-6 scrollbar-hide calming-bg">
      <div className="card-romantic p-6 mb-6 text-center animate-slide-up">
        <div className="text-4xl mb-3 animate-glow-pulse">💝</div>
        <h2 className="font-display text-xl gradient-text font-bold mb-1">
          Send a Sorry Card
        </h2>
        <p className="text-muted-foreground text-xs mb-5">
          From the heart, with love
        </p>
        <textarea
          data-ocid="sorry.textarea"
          placeholder="Write your sorry message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 resize-none mb-3"
        />
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1 text-left">
            Optional memory photo
          </p>
          <input
            data-ocid="sorry.upload_button"
            type="file"
            accept="image/*"
            onChange={handleImageFile}
            className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/20 file:text-primary cursor-pointer"
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="preview"
              className="mt-2 w-full h-32 object-cover rounded-xl opacity-80"
            />
          )}
        </div>
        <button
          type="button"
          data-ocid="sorry.submit_button"
          disabled={!message.trim() || sending}
          onClick={sendCard}
          className="w-full gradient-pink-purple text-white font-semibold py-3 rounded-xl shadow-glow disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {sending ? "Sending..." : "Send with Love 💕"}
        </button>
      </div>

      {received.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Received 💌
          </h3>
          <div className="space-y-3">
            {received.map((c, i) => (
              <div
                key={c.id}
                data-ocid={`sorry.item.${i + 1}`}
                className="card-romantic p-4 animate-fade-in"
              >
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt="memory"
                    className="w-full h-40 object-cover rounded-xl mb-3 opacity-90"
                  />
                )}
                <p className="text-sm text-foreground leading-relaxed">
                  {c.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {c.isRead ? "✓ Seen" : "New"} ·{" "}
                  {new Date(
                    Number(c.createdAt / 1_000_000n),
                  ).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {sent.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Sent by you 💗
          </h3>
          <div className="space-y-3">
            {sent.map((c, i) => (
              <div
                key={c.id}
                data-ocid={`sorry.item.${received.length + i + 1}`}
                className="card-romantic p-4 opacity-75"
              >
                <p className="text-sm text-foreground leading-relaxed">
                  {c.message}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {c.isRead ? "Seen by partner ✓" : "Not yet seen"} ·{" "}
                  {new Date(
                    Number(c.createdAt / 1_000_000n),
                  ).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {received.length === 0 && sent.length === 0 && (
        <div data-ocid="sorry.empty_state" className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            No cards yet. Hopefully you won't need this much 🌸
          </p>
        </div>
      )}
    </div>
  );
}
