import { useEffect, useState } from "react";

import EmptyState from "../components/EmptyState";
import PageShell from "../components/PageShell";
import Panel from "../components/Panel";
import { api } from "../services/api";

const scorerActions = [
  { label: "0", payload: { runsBat: 0, extras: 0, extrasType: "none", isWicket: false } },
  { label: "1", payload: { runsBat: 1, extras: 0, extrasType: "none", isWicket: false } },
  { label: "2", payload: { runsBat: 2, extras: 0, extrasType: "none", isWicket: false } },
  { label: "4", payload: { runsBat: 4, extras: 0, extrasType: "none", isWicket: false } },
  { label: "6", payload: { runsBat: 6, extras: 0, extrasType: "none", isWicket: false } },
  { label: "Wide", payload: { runsBat: 0, extras: 1, extrasType: "wide", isWicket: false } },
  { label: "No Ball", payload: { runsBat: 0, extras: 1, extrasType: "no-ball", isWicket: false } },
  { label: "Wicket", payload: { runsBat: 0, extras: 0, extrasType: "none", isWicket: true } }
];

function LiveScorerPage() {
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedInningsId, setSelectedInningsId] = useState("");
  const [message, setMessage] = useState("");
  const [overNumber, setOverNumber] = useState(1);
  const [inningsForm, setInningsForm] = useState({
    battingTeam: "",
    bowlingTeam: "",
    inningsNumber: 1
  });

  async function loadMatches() {
    const response = await api.getMatches();
    setMatches(response.data);
  }

  useEffect(() => {
    loadMatches().catch((error) => setMessage(error.message));
  }, []);

  const selectedMatch = matches.find((match) => match._id === selectedMatchId);

  useEffect(() => {
    if (selectedMatch) {
      setInningsForm((current) => ({
        ...current,
        battingTeam: current.battingTeam || selectedMatch.teamA,
        bowlingTeam: current.bowlingTeam || selectedMatch.teamB,
        inningsNumber: selectedMatch.innings.length + 1
      }));
      setSelectedInningsId(selectedMatch.innings.at(-1)?._id || "");
    }
  }, [selectedMatch]);

  async function refreshSelectedMatch(matchId) {
    const response = await api.getMatch(matchId);
    setMatches((current) =>
      current.map((match) => (match._id === matchId ? response.data : match))
    );
    return response.data;
  }

  async function handleStartInnings(event) {
    event.preventDefault();

    if (!selectedMatchId) {
      setMessage("Select a match before starting an innings.");
      return;
    }

    try {
      const response = await api.startInnings(selectedMatchId, inningsForm);
      const currentMatch = response.data;
      const latestInnings = currentMatch.innings.at(-1);
      setSelectedInningsId(latestInnings?._id || "");
      setMessage("Innings started. You can begin live scoring now.");
      await refreshSelectedMatch(selectedMatchId);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleScore(action) {
    if (!selectedMatchId || !selectedInningsId) {
      setMessage("Start or select an innings before scoring.");
      return;
    }

    try {
      await api.addDelivery(selectedMatchId, selectedInningsId, {
        overNumber,
        ...action.payload,
        commentary: `${action.label} recorded from scorer controls`
      });
      setMessage(`${action.label} added successfully.`);
      const updatedMatch = await refreshSelectedMatch(selectedMatchId);
      const innings = updatedMatch.innings.find(
        (currentInnings) => currentInnings._id === selectedInningsId
      );

      if (innings) {
        const lastOver = innings.overs.at(-1);
        const legalBalls =
          lastOver?.deliveries.filter(
            (delivery) => !["wide", "no-ball"].includes(delivery.extrasType)
          ).length || 0;

        if (legalBalls >= 6) {
          setOverNumber((current) => current + 1);
        }
      }
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageShell
      eyebrow="Scorer Desk"
      title="Score the match live, one ball at a time"
      description="This screen is designed to be the operational heart of SPORTLYTICS. Start an innings, tap scoring events quickly, and keep the live scoreboard moving."
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_1.3fr]">
        <Panel title="Match and innings setup">
          <div className="space-y-4">
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" value={selectedMatchId} onChange={(event) => setSelectedMatchId(event.target.value)}>
              <option value="">Select a match</option>
              {matches.map((match) => (
                <option key={match._id} value={match._id}>
                  {match.teamA} vs {match.teamB}
                </option>
              ))}
            </select>

            <form className="space-y-4" onSubmit={handleStartInnings}>
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" placeholder="Batting team" value={inningsForm.battingTeam} onChange={(event) => setInningsForm((current) => ({ ...current, battingTeam: event.target.value }))} required />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" placeholder="Bowling team" value={inningsForm.bowlingTeam} onChange={(event) => setInningsForm((current) => ({ ...current, bowlingTeam: event.target.value }))} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <input type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" value={inningsForm.inningsNumber} onChange={(event) => setInningsForm((current) => ({ ...current, inningsNumber: Number(event.target.value) }))} />
                <input type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" value={overNumber} onChange={(event) => setOverNumber(Number(event.target.value))} />
              </div>
              <button type="submit" className="rounded-full bg-pitch px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
                Start Innings
              </button>
            </form>

            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </div>
        </Panel>

        <Panel title="Scoring controls">
          {selectedMatch ? (
            <div className="space-y-5">
              <div className="rounded-3xl bg-pitch p-5 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-sky">Live Match</p>
                <h3 className="mt-2 text-2xl font-black">{selectedMatch.teamA} vs {selectedMatch.teamB}</h3>
                <p className="mt-2 text-sm text-white/80">
                  Current innings selected: {selectedInningsId || "none"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {scorerActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleScore(action)}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-5 text-lg font-black text-pitch transition hover:border-pitch hover:bg-pitch hover:text-white"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState title="No match selected" description="Choose a match from the left side and start an innings to begin live scoring." />
          )}
        </Panel>
      </div>
    </PageShell>
  );
}

export default LiveScorerPage;
