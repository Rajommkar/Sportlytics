import { useEffect, useState } from "react";

import EmptyState from "../components/EmptyState";
import PageShell from "../components/PageShell";
import Panel from "../components/Panel";
import { api } from "../services/api";

const initialForm = {
  name: "",
  organizerName: "",
  venue: "",
  format: "T20",
  status: "scheduled",
  teamsText: ""
};

function TournamentsPage() {
  const [form, setForm] = useState(initialForm);
  const [tournaments, setTournaments] = useState([]);
  const [message, setMessage] = useState("");

  async function loadTournaments() {
    const response = await api.getTournaments();
    setTournaments(response.data);
  }

  useEffect(() => {
    loadTournaments().catch((error) => setMessage(error.message));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("Saving tournament...");

    try {
      const teams = form.teamsText
        .split(",")
        .map((team) => team.trim())
        .filter(Boolean)
        .map((team) => ({ name: team }));

      await api.createTournament({
        name: form.name,
        organizerName: form.organizerName,
        venue: form.venue,
        format: form.format,
        status: form.status,
        teams
      });

      setForm(initialForm);
      await loadTournaments();
      setMessage("Tournament created successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <PageShell
      eyebrow="Competition Setup"
      title="Create and manage local tournaments"
      description="Organizers can register a competition, define format, and list participating teams. This becomes the base for fixtures and live scoring."
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.4fr]">
        <Panel title="New tournament">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" placeholder="Tournament name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" placeholder="Organizer name" value={form.organizerName} onChange={(event) => setForm((current) => ({ ...current, organizerName: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" placeholder="Venue" value={form.venue} onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))} />
            <div className="grid gap-4 sm:grid-cols-2">
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" value={form.format} onChange={(event) => setForm((current) => ({ ...current, format: event.target.value }))}>
                <option value="T10">T10</option>
                <option value="T20">T20</option>
                <option value="ODI">ODI</option>
                <option value="Test">Test</option>
                <option value="custom">Custom</option>
              </select>
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <textarea className="min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-pitch" placeholder="Teams separated by commas" value={form.teamsText} onChange={(event) => setForm((current) => ({ ...current, teamsText: event.target.value }))} />
            <button type="submit" className="rounded-full bg-pitch px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
              Save Tournament
            </button>
          </form>
          {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
        </Panel>

        <Panel title="Tournament board">
          {tournaments.length ? (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <article key={tournament._id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-pitch">{tournament.name}</h3>
                      <p className="text-sm text-slate-600">{tournament.format} • {tournament.status}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-coral">
                      {tournament.teams.length} teams
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {tournament.venue || "Venue pending"} • Organizer: {tournament.organizerName || "Not set"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="No tournaments yet" description="Create your first grassroots tournament to unlock match scheduling." />
          )}
        </Panel>
      </div>
    </PageShell>
  );
}

export default TournamentsPage;
