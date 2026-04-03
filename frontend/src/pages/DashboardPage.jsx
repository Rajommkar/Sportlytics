import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import PageShell from "../components/PageShell";
import Panel from "../components/Panel";
import StatCard from "../components/StatCard";
import { api } from "../services/api";

function DashboardPage() {
  const [summary, setSummary] = useState({
    tournaments: 0,
    matches: 0,
    liveMatches: 0
  });
  const [apiStatus, setApiStatus] = useState("Checking backend...");

  useEffect(() => {
    async function loadSummary() {
      try {
        const [tournaments, matches, health] = await Promise.all([
          api.getTournaments(),
          api.getMatches(),
          api.getHealth()
        ]);

        setSummary({
          tournaments: tournaments.count,
          matches: matches.count,
          liveMatches: matches.data.filter((match) => match.status === "live")
            .length
        });
        setApiStatus(health.message);
      } catch (error) {
        setApiStatus(error.message);
      }
    }

    loadSummary();
  }, []);

  return (
    <PageShell
      eyebrow="Mission Control"
      title="Run local tournaments like a modern sports operation"
      description="This dashboard is the first frontend foundation for SPORTLYTICS. It gives organizers and scorers a direct path into tournaments, matches, and live scoring."
      actions={
        <>
          <Link
            to="/tournaments"
            className="rounded-full bg-coral px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
          >
            Create Tournament
          </Link>
          <Link
            to="/matches"
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-ink transition hover:border-pitch hover:text-pitch"
          >
            Schedule Match
          </Link>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          label="Tournaments"
          value={summary.tournaments}
          hint="Organized competitions tracked in the platform."
        />
        <StatCard
          label="Matches"
          value={summary.matches}
          hint="Scheduled, live, and completed fixtures."
        />
        <StatCard
          label="Live Now"
          value={summary.liveMatches}
          hint="Matches currently being scored ball by ball."
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Why this matters">
          <div className="space-y-3 text-sm leading-6 text-slate-600">
            <p>
              SPORTLYTICS turns paper scorebooks and scattered spreadsheets into
              structured performance data that players can actually use.
            </p>
            <p>
              The next build steps can now plug into real APIs for match
              creation, live scoring, and analytics-ready data capture.
            </p>
          </div>
        </Panel>

        <Panel title="Backend status">
          <p className="text-sm font-medium text-slate-600">{apiStatus}</p>
          <p className="mt-3 rounded-2xl bg-pitch/5 p-4 text-sm text-pitch">
            API base URL:{" "}
            <span className="font-semibold">
              {import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}
            </span>
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}

export default DashboardPage;
