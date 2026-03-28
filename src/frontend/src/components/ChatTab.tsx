import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Message, MoodTag, UserProfile } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const MOOD_TAGS: { value: MoodTag; emoji: string; label: string }[] = [
  { value: "happy" as MoodTag, emoji: "😊", label: "Happy" },
  { value: "sad" as MoodTag, emoji: "😢", label: "Sad" },
  { value: "angry" as MoodTag, emoji: "😤", label: "Angry" },
  { value: "missYou" as MoodTag, emoji: "🥺", label: "Miss You" },
];

function moodTagEmoji(tag: MoodTag): string {
  return MOOD_TAGS.find((m) => m.value === tag)?.emoji ?? "";
}

export function ChatTab({ profile: _profile }: { profile: UserProfile }) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodTag | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const callerPrincipal = identity?.getPrincipal().toString();

  const loadMessages = useCallback(async () => {
    if (!actor) return;
    try {
      const msgs = await actor.getMessages();
      setMessages(msgs);
      for (const msg of msgs) {
        const seenByMe = msg.seenBy.some(
          (p) => p.toString() === callerPrincipal,
        );
        if (!seenByMe && msg.senderId.toString() !== callerPrincipal) {
          actor.markMessageAsSeen(msg.id).catch(() => {});
        }
      }
    } catch {}
  }, [actor, callerPrincipal]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!actor || !text.trim()) return;
    setSending(true);
    try {
      await actor.sendMessage(text.trim(), selectedMood);
      setText("");
      setSelectedMood(null);
      await loadMessages();
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-hide">
        {messages.length === 0 && (
          <div
            data-ocid="chat.empty_state"
            className="flex flex-col items-center justify-center h-full text-center py-16"
          >
            <div className="text-5xl mb-4">💬</div>
            <p className="text-muted-foreground text-sm">No messages yet.</p>
            <p className="text-muted-foreground text-xs mt-1">
              Say something sweet 💕
            </p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.senderId.toString() === callerPrincipal;
          return (
            <div
              key={msg.id}
              data-ocid={`chat.item.${i + 1}`}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              <div
                className={`max-w-[78%] px-4 py-2.5 text-sm ${isOwn ? "bubble-own" : "bubble-partner"}`}
              >
                {msg.moodTag && (
                  <span className="text-xs mr-1 opacity-80">
                    {moodTagEmoji(msg.moodTag)}
                  </span>
                )}
                <span>{msg.text}</span>
                {!isOwn && msg.seenBy.length > 0 && (
                  <span className="block text-[10px] mt-1 opacity-50">
                    seen
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-border px-4 py-3 bg-sidebar">
        <div className="flex gap-2 mb-2">
          {MOOD_TAGS.map((m) => (
            <button
              key={m.value}
              type="button"
              data-ocid={`chat.${m.value}.toggle`}
              onClick={() =>
                setSelectedMood(selectedMood === m.value ? null : m.value)
              }
              className={`text-base px-2 py-0.5 rounded-full border transition-all ${
                selectedMood === m.value
                  ? "border-primary/60 bg-primary/20 scale-110"
                  : "border-border bg-secondary/40 opacity-60 hover:opacity-100"
              }`}
              title={m.label}
            >
              {m.emoji}
            </button>
          ))}
          {selectedMood && (
            <span className="text-xs text-muted-foreground self-center ml-1">
              {MOOD_TAGS.find((m) => m.value === selectedMood)?.label}
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <input
            data-ocid="chat.input"
            type="text"
            placeholder="Type something sweet..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            data-ocid="chat.submit_button"
            disabled={!text.trim() || sending}
            onClick={sendMessage}
            className="gradient-pink-purple text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-glow"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
