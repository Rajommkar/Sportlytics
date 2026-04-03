import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../components/EmptyState";
import PageShell from "../components/PageShell";
import Panel from "../components/Panel";
import { api } from "../services/api";

const initialForm = {
  title: "",
  tournamentName: "",
  teamA: "",
  teamB: "",
  matchDate: "",
  venue: "",
  format: "T20",
  tossWinner: "",
  tossDecision: "bat"
};

function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  async function loadMatches() {
    const response = await api.getMatches();
    setMatches(response.data);
  }

  useEffect(() => {
    loadMatches().catch((error) => setMessage(error.message));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Saving match...");

    try {
      await api.createMatch({
        ...form,
        matchDate: new Date(form.matchDate).toISOString(),
        status: "scheduled"
      });
      setForm(initialForm);
      await loadMatches();
      setMessage("Match created successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageShell
      eyebrow="Fixtures"
      title="Schedule matches and jump into scoring"
      description="This page connects tournament operations to the live scorer. Create a fixture, then open it in score mode when the game begins."
    >
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1.45fr]">
        <Panel title="Create match">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {[
              ["title", "Match title"],
              ["tournamentName", "Tournament name"],
              ["teamA", "Team A"],
              ["teamB", "Team B"],
              ["venue", "Venue"],
              ["tossWinner", "Toss winner"]
            ].map(([key, label]) => (
              <input
                key={key}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch"
                placeholder={label}
                value={form[key]}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                required={["title", "teamA", "teamB"].includes(key)}
              />
            ))}
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch"
                value={form.matchDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, matchDate: event.target.value }))
                }
                required
              />
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch"
                value={form.format}
                onChange={(event) =>
                  setForm((current) => ({ ...current, format: event.target.value }))
                }
              >
                <option value="T10">T10</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
                <option value="custom">Custom</option>
              </select>
              <select
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch"
                value={form.tossDecision}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tossDecision: event.target.value }))
                }
              >
                <option value="bat">Bat first</option>
                <option value="bowl">Bowl first</option>
              </select>
            </div>
            <button type="submit" className="rounded-full bg-pitch px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
              Save Match
            </button>
          </form>
          {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
        </Panel>

        <Panel title="Match queue">
          {matches.length ? (
            <div className="space-y-4">
              {matches.map((match) => (
                <article key={match._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-pitch">{match.teamA} vs {match.teamB}</h3>
                      <p className="text-sm text-slate-600">
                        {match.tournamentName || "Independent fixture"} • {new Date(match.matchDate).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-coral">
                        {match.status}
                      </span>
                      <Link to={`/matches/${match._id}`} className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-ink">
                        Scoreboard
                      </Link>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {match.venue || "Venue pending"} • Format: {match.format}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No matches scheduled" description="Create a fixture to unlock live scoring and scoreboard views." />
          )}
        </Panel>
      </div>
    </PageShell>
  );
}

export default MatchesPage;
