import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import EmptyState from "../components/EmptyState";
import PageShell from "../components/PageShell";
import Panel from "../components/Panel";
import { api } from "../services/api";

function MatchDetailPage() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getMatch(matchId)
      .then((response) => setMatch(response.data))
      .catch((currentError) => setError(currentError.message));
  }, [matchId]);

  if (error) {
    return <PageShell eyebrow="Scoreboard" title="Match detail unavailable" description={error} />;
  }

  if (!match) {
    return <PageShell eyebrow="Scoreboard" title="Loading match scoreboard" description="Fetching the latest match state from the SPORTLYTICS API." />;
  }

  return (
    <PageShell
      eyebrow="Scoreboard"
      title={`${match.teamA} vs ${match.teamB}`}
      description="Live and completed innings data are displayed here so organizers, players, and viewers can follow the match state."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Match summary">
          <div className="space-y-3 text-sm text-slate-600">
            <p>Status: <span className="font-semibold text-pitch">{match.status}</span></p>
            <p>Format: <span className="font-semibold text-pitch">{match.format}</span></p>
            <p>Venue: <span className="font-semibold text-pitch">{match.venue || "Pending"}</span></p>
            <p>Total match runs: <span className="font-semibold text-pitch">{match.totalRuns}</span></p>
            <p>Total wickets: <span className="font-semibold text-pitch">{match.totalWickets}</span></p>
            <p>Total overs: <span className="font-semibold text-pitch">{match.overs}</span></p>
          </div>
        </Panel>

        <div className="lg:col-span-2">
          {match.innings.length ? (
            <div className="space-y-5">
              {match.innings.map((innings) => (
                <Panel key={innings._id} title={`Innings ${innings.inningsNumber}: ${innings.battingTeam}`}>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Score</p>
                      <p className="mt-2 text-2xl font-black text-pitch">{innings.totalRuns}/{innings.wicketsLost}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Overs</p>
                      <p className="mt-2 text-2xl font-black text-pitch">{innings.oversBowled}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Run Rate</p>
                      <p className="mt-2 text-2xl font-black text-pitch">{innings.runRate}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</p>
                      <p className="mt-2 text-2xl font-black text-pitch">{innings.isCompleted ? "Closed" : "Live"}</p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {innings.overs.length ? (
                      innings.overs.map((over) => (
                        <div key={`${innings._id}-${over.overNumber}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <p className="text-sm font-bold text-pitch">Over {over.overNumber}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {over.deliveries.map((delivery, index) => (
                              <span key={`${over.overNumber}-${index}`} className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink shadow-sm">
                                {delivery.isWicket ? "W" : delivery.totalRuns}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="No deliveries yet" description="Once live scoring begins, ball-by-ball events will appear here." />
                    )}
                  </div>
                </Panel>
              ))}
            </div>
          ) : (
            <EmptyState title="No innings recorded" description="Start a live innings from the scorer page to populate this scoreboard." />
          )}
        </div>
      </div>
    </PageShell>
  );
}

export default MatchDetailPage;
