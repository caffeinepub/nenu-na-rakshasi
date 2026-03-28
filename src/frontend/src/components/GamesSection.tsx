import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Answer, Question } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const TRUTHS = [
  "What's your favorite memory of us?",
  "What first made you fall for me?",
  "What's one thing you've never told me?",
  "What do you love most about our relationship?",
  "What's your biggest fear in love?",
  "Describe our relationship in 3 words.",
  "What's the most romantic thing I've done for you?",
  "If you could change one thing about us, what would it be?",
  "What's your favorite thing to do together?",
  "What does love mean to you?",
  "What is something I do that always makes you smile?",
  "When did you first know you loved me?",
  "What's one secret you've kept from me?",
  "What's your love language?",
  "What's a dream you have for our future?",
  "What would your perfect day with me look like?",
  "What's something you're still learning about me?",
  "What's one thing I do that drives you crazy (good crazy)?",
  "What do you think makes us special?",
  "What's a song that reminds you of us?",
];

const DARES = [
  "Send me a voice note right now",
  "Write me a love letter in 30 seconds",
  "Name 5 things you love about me",
  "Send me your current selfie",
  "Sing me a line from our favorite song",
  "Tell me something that made you think of me today",
  "Send me a screenshot of our first chat",
  "Describe me in emojis only",
  "Write what you'd say in a toast at our wedding",
  "Send me a meme that represents our relationship",
  "Tell me your honest first impression of me",
  "Say something in another language for me",
  "Write me a poem (even if it's bad)",
  "Tell me one thing you love about my personality",
  "Send a photo of something that makes you think of me",
  "Describe our first date in exactly 10 words",
  "Say 3 things you love about my appearance",
  "Tell me your top 3 wishes for us",
  "Call me by a new nickname for the rest of the day",
  "Record a 5-second video just for me",
];

type GameMode = "menu" | "quiz" | "truthdare";

export function GamesSection() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [gameMode, setGameMode] = useState<GameMode>("menu");

  return (
    <div className="px-4 py-4">
      {gameMode === "menu" && (
        <div className="space-y-3">
          <button
            type="button"
            data-ocid="games.quiz.button"
            onClick={() => setGameMode("quiz")}
            className="w-full card-romantic p-5 text-left hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🧠</span>
              <div>
                <p className="font-semibold text-foreground">
                  How Well Do You Know Me?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Answer questions about each other
                </p>
              </div>
            </div>
          </button>
          <button
            type="button"
            data-ocid="games.truthdare.button"
            onClick={() => setGameMode("truthdare")}
            className="w-full card-romantic p-5 text-left hover:scale-[1.01] transition-all"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎴</span>
              <div>
                <p className="font-semibold text-foreground">Truth or Dare</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Draw a card and play together
                </p>
              </div>
            </div>
          </button>
        </div>
      )}
      {gameMode === "quiz" && (
        <QuizGame
          onBack={() => setGameMode("menu")}
          actor={actor}
          identity={identity}
        />
      )}
      {gameMode === "truthdare" && (
        <TruthDareGame onBack={() => setGameMode("menu")} />
      )}
    </div>
  );
}

function QuizGame({
  onBack,
  actor,
  identity,
}: {
  onBack: () => void;
  actor: any;
  identity: any;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const callerPrincipal = identity?.getPrincipal().toString();

  const load = useCallback(async () => {
    if (!actor) return;
    const [qs, as] = await Promise.all([
      actor.getQuestions(),
      actor.getAnswers(),
    ]);
    setQuestions(qs);
    setAnswers(as);
  }, [actor]);

  useEffect(() => {
    load();
  }, [load]);

  async function addQuestion() {
    if (!actor || !newQ.trim() || !newA.trim()) return;
    setAdding(true);
    try {
      await actor.addQuestion(newQ.trim(), newA.trim());
      setNewQ("");
      setNewA("");
      await load();
    } catch {
      toast.error("Failed to add question");
    } finally {
      setAdding(false);
    }
  }

  async function submitAnswer(questionId: string) {
    if (!actor) return;
    const ans = answerInputs[questionId];
    if (!ans?.trim()) return;
    try {
      const correct = await actor.submitAnswer(questionId, ans.trim());
      setResults((prev) => ({ ...prev, [questionId]: correct }));
      toast(correct ? "Correct! 🎉" : "Not quite... 💕");
    } catch {
      toast.error("Failed to submit");
    }
  }

  const partnerQuestions = questions.filter(
    (q) => q.authorId.toString() !== callerPrincipal,
  );
  const myAnsweredIds = answers
    .filter((a) => a.answererId.toString() === callerPrincipal)
    .map((a) => a.questionId);
  const unanswered = partnerQuestions.filter(
    (q) => !myAnsweredIds.includes(q.id),
  );
  const score = answers.filter(
    (a) => a.answererId.toString() === callerPrincipal && a.isCorrect,
  ).length;
  const total = answers.filter(
    (a) => a.answererId.toString() === callerPrincipal,
  ).length;

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        data-ocid="games.quiz.back_button"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </button>

      {total > 0 && (
        <div className="card-romantic p-4 text-center">
          <p className="text-3xl font-display font-bold gradient-text">
            {score}/{total}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Correct answers</p>
        </div>
      )}

      <div className="card-romantic p-4">
        <p className="text-sm font-semibold text-foreground mb-3">
          Add a question about yourself
        </p>
        <input
          data-ocid="games.question.input"
          type="text"
          placeholder="Your question..."
          value={newQ}
          onChange={(e) => setNewQ(e.target.value)}
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 mb-2"
        />
        <input
          data-ocid="games.answer.input"
          type="text"
          placeholder="Correct answer..."
          value={newA}
          onChange={(e) => setNewA(e.target.value)}
          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 mb-3"
        />
        <button
          type="button"
          data-ocid="games.add_question.button"
          disabled={!newQ.trim() || !newA.trim() || adding}
          onClick={addQuestion}
          className="w-full gradient-pink-purple text-white font-semibold py-2.5 rounded-xl shadow-glow disabled:opacity-50"
        >
          {adding ? "Adding..." : "Add Question"}
        </button>
      </div>

      {unanswered.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-3">
            Answer partner's questions
          </p>
          <div className="space-y-3">
            {unanswered.map((q, i) => (
              <div
                key={q.id}
                data-ocid={`games.item.${i + 1}`}
                className="card-romantic p-4"
              >
                <p className="text-sm text-foreground mb-3">{q.questionText}</p>
                {results[q.id] !== undefined ? (
                  <p
                    className={`text-sm font-semibold ${results[q.id] ? "text-green-400" : "text-rose-400"}`}
                  >
                    {results[q.id] ? "✓ Correct!" : "✗ Not quite"}
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Your answer..."
                      value={answerInputs[q.id] ?? ""}
                      onChange={(e) =>
                        setAnswerInputs((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                      className="flex-1 bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
                    />
                    <button
                      type="button"
                      onClick={() => submitAnswer(q.id)}
                      className="gradient-pink-purple text-white text-sm font-semibold px-4 py-2 rounded-xl"
                    >
                      Go
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {unanswered.length === 0 && partnerQuestions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Partner hasn't added questions yet 💕
        </p>
      )}
    </div>
  );
}

function TruthDareGame({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<"truth" | "dare" | null>(null);
  const [card, setCard] = useState("");
  const [flipping, setFlipping] = useState(false);

  function drawCard(type: "truth" | "dare") {
    setFlipping(true);
    setTimeout(() => {
      const deck = type === "truth" ? TRUTHS : DARES;
      setCard(deck[Math.floor(Math.random() * deck.length)]);
      setMode(type);
      setFlipping(false);
    }, 250);
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        data-ocid="games.truthdare.back_button"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back
      </button>

      <div className="flex gap-3 mb-2">
        <button
          type="button"
          data-ocid="games.truth.button"
          onClick={() => drawCard("truth")}
          className="flex-1 gradient-pink-purple text-white font-semibold py-3 rounded-xl shadow-glow text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Truth 💬
        </button>
        <button
          type="button"
          data-ocid="games.dare.button"
          onClick={() => drawCard("dare")}
          className="flex-1 bg-accent/20 border border-accent/40 text-foreground font-semibold py-3 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          Dare 🎯
        </button>
      </div>

      {card && (
        <div
          data-ocid="games.card.panel"
          className={`card-romantic p-6 text-center glow-rose min-h-[140px] flex flex-col items-center justify-center ${
            flipping ? "animate-flip" : "animate-fade-in"
          }`}
        >
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">
            {mode === "truth" ? "Truth 💬" : "Dare 🎯"}
          </p>
          <p className="text-base text-foreground leading-relaxed font-medium">
            {card}
          </p>
        </div>
      )}

      {!card && (
        <div className="card-romantic p-8 text-center">
          <div className="text-5xl mb-3">🎴</div>
          <p className="text-muted-foreground text-sm">
            Pick Truth or Dare to draw a card
          </p>
        </div>
      )}
    </div>
  );
}
