import { useState } from "react";
import type { UserProfile } from "../backend.d";
import { DropsSection } from "./DropsSection";
import { GamesSection } from "./GamesSection";
import { PeriodSection } from "./PeriodSection";
import { StatsSection } from "./StatsSection";

type Section = "menu" | "stats" | "period" | "drops" | "games";

const MENU_ITEMS = [
  {
    id: "stats" as Section,
    icon: "💫",
    label: "Relationship Stats",
    desc: "Your journey together",
  },
  {
    id: "period" as Section,
    icon: "🌺",
    label: "Cycle & Care",
    desc: "Track & care for each other",
  },
  {
    id: "drops" as Section,
    icon: "🎁",
    label: "Surprise Drops",
    desc: "Schedule sweet surprises",
  },
  {
    id: "games" as Section,
    icon: "🎮",
    label: "Mini Games",
    desc: "Play together",
  },
];

export function MoreDrawer({
  profile,
  onClose: _onClose,
}: { profile: UserProfile; onClose: () => void }) {
  const [section, setSection] = useState<Section>("menu");

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-5 py-4 border-b border-border flex items-center gap-3">
        {section !== "menu" && (
          <button
            type="button"
            data-ocid="more.back_button"
            onClick={() => setSection("menu")}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ←
          </button>
        )}
        <h2 className="font-display text-lg gradient-text font-bold">
          {section === "menu"
            ? "More ✨"
            : section === "stats"
              ? "Relationship Stats 💫"
              : section === "period"
                ? "Cycle & Care 🌺"
                : section === "drops"
                  ? "Surprise Drops 🎁"
                  : "Mini Games 🎮"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {section === "menu" && (
          <div className="px-4 py-4 space-y-3">
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                data-ocid={`more.${item.id}.button`}
                onClick={() => setSection(item.id)}
                className="w-full card-romantic p-4 flex items-center gap-4 text-left hover:scale-[1.01] active:scale-[0.99] transition-all animate-fade-in"
              >
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.desc}
                  </p>
                </div>
                <span className="ml-auto text-muted-foreground text-sm">→</span>
              </button>
            ))}
          </div>
        )}
        {section === "stats" && <StatsSection />}
        {section === "period" && <PeriodSection profile={profile} />}
        {section === "drops" && <DropsSection />}
        {section === "games" && <GamesSection />}
      </div>
    </div>
  );
}
