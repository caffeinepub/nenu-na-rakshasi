import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Memory } from "../backend.d";
import { useActor } from "../hooks/useActor";

export function MemoriesTab() {
  const { actor } = useActor();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!actor) return;
    const mems = await actor.getMemoriesSortedByDate();
    setMemories(mems);
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

  async function addMemory() {
    if (!actor || !title.trim()) return;
    setSaving(true);
    try {
      await actor.addMemory(title.trim(), note.trim(), imageUrl || null);
      setTitle("");
      setNote("");
      setImageUrl("");
      setShowAdd(false);
      toast.success("Memory saved 🌸");
      await load();
    } catch {
      toast.error("Failed to save memory");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMemory(id: string) {
    if (!actor) return;
    try {
      await actor.deleteMemory(id);
      await load();
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4 scrollbar-hide relative">
      {memories.length === 0 ? (
        <div
          data-ocid="memories.empty_state"
          className="flex flex-col items-center justify-center h-full text-center py-16"
        >
          <div className="text-5xl mb-4">🌸</div>
          <p className="text-muted-foreground text-sm">No memories yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Create your first one 💕
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-accent/30 to-transparent" />
          <div className="space-y-5 pl-10">
            {memories.map((m, i) => (
              <div
                key={m.id}
                data-ocid={`memories.item.${i + 1}`}
                className="card-romantic p-4 animate-fade-in relative"
              >
                <div className="absolute -left-[2.35rem] top-5 w-3 h-3 rounded-full gradient-pink-purple ring-2 ring-background" />
                {m.imageUrl && (
                  <div className="w-full h-44 mb-3 overflow-hidden rounded-xl">
                    <img
                      src={m.imageUrl}
                      alt={m.title}
                      className="w-full h-full object-cover"
                      style={{ filter: "brightness(0.9) saturate(1.1)" }}
                    />
                  </div>
                )}
                <h3 className="font-display font-bold text-base gradient-text mb-1">
                  {m.title}
                </h3>
                {m.note && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {m.note}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(
                      Number(m.createdAt / 1_000_000n),
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    type="button"
                    data-ocid={`memories.delete_button.${i + 1}`}
                    onClick={() => deleteMemory(m.id)}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        data-ocid="memories.open_modal_button"
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-5 w-12 h-12 gradient-pink-purple rounded-full shadow-glow flex items-center justify-center text-white text-xl transition-all hover:scale-110 active:scale-95 z-10"
      >
        +
      </button>

      {showAdd && (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowAdd(false)}
        >
          <div
            data-ocid="memories.dialog"
            className="w-full max-w-lg bg-card rounded-t-3xl p-6 animate-slide-up border-t border-border"
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <h3 className="font-display text-lg gradient-text font-bold mb-4">
              Add a Memory 🌸
            </h3>
            <input
              data-ocid="memories.input"
              type="text"
              placeholder="Give this memory a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 mb-3"
            />
            <textarea
              data-ocid="memories.textarea"
              placeholder="Write about this moment..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 resize-none mb-3"
            />
            <input
              data-ocid="memories.upload_button"
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-primary/20 file:text-primary cursor-pointer mb-4"
            />
            <div className="flex gap-3">
              <button
                type="button"
                data-ocid="memories.cancel_button"
                onClick={() => setShowAdd(false)}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="memories.save_button"
                disabled={!title.trim() || saving}
                onClick={addMemory}
                className="flex-1 gradient-pink-purple text-white font-semibold py-2.5 rounded-xl shadow-glow disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Memory 💕"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
