import { NavLink, Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import TournamentsPage from "./pages/TournamentsPage";
import MatchesPage from "./pages/MatchesPage";
import LiveScorerPage from "./pages/LiveScorerPage";
import MatchDetailPage from "./pages/MatchDetailPage";

const navigation = [
  { to: "/", label: "Dashboard" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/matches", label: "Matches" },
  { to: "/scorer", label: "Live Scorer" }
];

function App() {
  return (
    <div className="min-h-screen bg-sand bg-mesh text-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] bg-pitch px-6 py-5 text-white shadow-card">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky">
                Grassroots Sports Analytics
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                SPORTLYTICS
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
                Digitize local tournaments, score matches live, and turn amateur
                performance into visible data.
              </p>
            </div>
            <nav className="flex flex-wrap gap-3">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    [
                      "rounded-full px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-white text-pitch"
                        : "bg-white/10 text-white hover:bg-white/20"
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/scorer" element={<LiveScorerPage />} />
            <Route path="/matches/:matchId" element={<MatchDetailPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
