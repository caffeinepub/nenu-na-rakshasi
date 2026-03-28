import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { backendInterface } from "./backend.d";
import type { UserProfile, UserRole } from "./backend.d";
import { ChatTab } from "./components/ChatTab";
import { MemoriesTab } from "./components/MemoriesTab";
import { MoodTab } from "./components/MoodTab";
import { MoreDrawer } from "./components/MoreDrawer";
import { SorryTab } from "./components/SorryTab";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
      <Toaster />
    </QueryClientProvider>
  );
}

type Tab = "chat" | "sorry" | "memories" | "mood" | "more";

function AppInner() {
  const { identity, login, isInitializing } = useInternetIdentity();
  const { actor, isFetching: isActorLoading } = useActor();
  const [profile, setProfile] = useState<UserProfile | null | undefined>(
    undefined,
  );
  const [tab, setTab] = useState<Tab>("chat");

  useEffect(() => {
    if (!actor) return;
    actor
      .getCallerUserProfile()
      .then((p) => setProfile(p ?? null))
      .catch((e) => {
        console.error("getCallerUserProfile error:", e);
        // Treat any error as "not set up yet" so onboarding is shown
        setProfile(null);
      });
  }, [actor]);

  if (!identity && !isInitializing) {
    return <LoginScreen onLogin={login} />;
  }

  if (isInitializing || isActorLoading || profile === undefined) {
    return <LoadingScreen />;
  }

  if (profile === null) {
    return <OnboardingScreen actor={actor} onDone={setProfile} />;
  }

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <header className="shrink-0 px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
        <h1 className="font-display text-xl gradient-text font-bold tracking-wide">
          Nenu Na Rakshasi
        </h1>
        <div className="text-sm text-muted-foreground font-body">
          <span className="text-foreground font-medium">{profile.name}</span>
          <span className="ml-2 text-xs opacity-60">
            {profile.role === "user1" ? "💗" : "💙"}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {tab === "chat" && <ChatTab profile={profile} />}
        {tab === "sorry" && <SorryTab profile={profile} />}
        {tab === "memories" && <MemoriesTab />}
        {tab === "mood" && <MoodTab />}
        {tab === "more" && (
          <MoreDrawer profile={profile} onClose={() => setTab("chat")} />
        )}
      </main>

      <nav className="shrink-0 bg-sidebar border-t border-border flex items-center px-1">
        {(
          [
            { id: "chat" as Tab, icon: "💬", label: "Chat" },
            { id: "sorry" as Tab, icon: "💌", label: "Sorry" },
            { id: "memories" as Tab, icon: "🌸", label: "Memories" },
            { id: "mood" as Tab, icon: "🌙", label: "Mood" },
            { id: "more" as Tab, icon: "✨", label: "More" },
          ] as const
        ).map(({ id, icon, label }) => (
          <button
            key={id}
            type="button"
            data-ocid={`nav.${id}.tab`}
            onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-all ${
              tab === id ? "nav-tab-active" : "text-muted-foreground"
            }`}
          >
            <span
              className={`text-xl transition-transform ${tab === id ? "scale-110" : ""}`}
            >
              {icon}
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 calming-bg">
      <div className="text-center animate-slide-up">
        <div className="text-6xl mb-6 animate-glow-pulse">💕</div>
        <h1 className="font-display text-3xl gradient-text font-bold mb-2">
          Nenu Na Rakshasi
        </h1>
        <p className="text-muted-foreground text-sm mb-10 max-w-xs">
          A private space, just for the two of you
        </p>
        <button
          type="button"
          data-ocid="login.primary_button"
          onClick={onLogin}
          className="gradient-pink-purple text-white font-semibold px-8 py-3.5 rounded-2xl shadow-glow transition-all hover:scale-105 active:scale-95"
        >
          Enter Our Space 🌸
        </button>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-glow-pulse">💕</div>
        <p className="text-muted-foreground text-sm">Loading your space...</p>
      </div>
    </div>
  );
}

function OnboardingScreen({
  actor,
  onDone,
}: {
  actor: backendInterface | null;
  onDone: (p: UserProfile) => void;
}) {
  const [name, setName] = useState("");
  const [step, setStep] = useState<"name" | "code">("name");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(
    null,
  );

  async function handleSubmit() {
    if (!actor || !name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const users = await actor.getUsers();
      let role: UserRole;
      if (users.length === 0) {
        role = "user1" as UserRole;
        await actor.createUser(name.trim(), role);
        await actor.saveCallerUserProfile({ name: name.trim(), role });
        const code = await actor.generateInviteCode();
        setInviteCode(code);
        const profile = { name: name.trim(), role };
        setPendingProfile(profile);
        setStep("code");
      } else if (users.length === 1) {
        role = "user2" as UserRole;
        await actor.createUser(name.trim(), role);
        await actor.saveCallerUserProfile({ name: name.trim(), role });
        onDone({ name: name.trim(), role });
      } else {
        setError(
          "This space already has two people. Please ask your partner for the invite code or use a different account.",
        );
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6 calming-bg">
      <div className="w-full max-w-sm animate-slide-up">
        {step === "name" ? (
          <div className="card-romantic p-8 text-center">
            <div className="text-5xl mb-5">🌸</div>
            <h2 className="font-display text-2xl gradient-text font-bold mb-2">
              Welcome
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              What's your name, love?
            </p>
            <input
              data-ocid="onboarding.input"
              type="text"
              placeholder="Your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 mb-5"
            />
            {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
            <button
              type="button"
              data-ocid="onboarding.submit_button"
              disabled={!name.trim() || loading}
              onClick={handleSubmit}
              className="w-full gradient-pink-purple text-white font-semibold py-3 rounded-xl shadow-glow disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? "Setting up..." : "Enter 💕"}
            </button>
          </div>
        ) : (
          <div className="card-romantic p-8 text-center">
            <div className="text-5xl mb-5">🔮</div>
            <h2 className="font-display text-2xl gradient-text font-bold mb-2">
              Share This Code
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Send this to your partner so they can join your space
            </p>
            <div className="bg-secondary/50 border border-border rounded-xl px-5 py-4 mb-5 font-mono text-xl tracking-[0.3em] text-foreground font-bold">
              {inviteCode}
            </div>
            <button
              type="button"
              data-ocid="onboarding.copy_button"
              onClick={copyCode}
              className="w-full gradient-pink-purple text-white font-semibold py-3 rounded-xl shadow-glow transition-all hover:scale-[1.02] mb-3"
            >
              {copied ? "Copied! ✓" : "Copy Code"}
            </button>
            <button
              type="button"
              data-ocid="onboarding.primary_button"
              onClick={() => pendingProfile && onDone(pendingProfile)}
              className="w-full bg-secondary/60 border border-border text-foreground font-semibold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Got it! Continue 💕
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              You can always access this from the app later
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
