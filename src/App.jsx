import { Routes, Route, Link, useLocation } from "react-router-dom";
import PitchTracker from "./pages/PitchTracker";
import Anatomy from "./pages/Anatomy";
import DiaphragmPage from "./pages/DiaphragmPage";

export default function App() {
  const location = useLocation();

  return (
    <main className="min-h-screen bg-cream px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8">

        {/* ── Navigation Bar — Classic Blue structural frame ───────────────── */}
        <header className="w-full max-w-7xl rounded-2xl border border-blue/20 bg-teal px-6 py-4 shadow-card-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-cream">
              Voice Pitch Tracker
            </h1>
            <p className="text-xs text-cream/55 mt-0.5">
              Real-time pitch scatter plot with smart window panning.
            </p>
          </div>

          <nav
            className="flex items-center gap-1 self-start sm:self-auto bg-teal/60 p-1 rounded-full border border-cream/10"
            aria-label="Primary navigation"
          >
            <Link
              to="/"
              id="nav-pitch-tracker"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                location.pathname === "/"
                  ? "bg-gold text-teal shadow-sm"
                  : "text-cream/60 hover:text-cream hover:bg-cream/10"
              }`}
            >
              Pitch Tracker
            </Link>
            <Link
              to="/anatomy"
              id="nav-anatomy"
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                location.pathname.startsWith("/anatomy")
                  ? "bg-gold text-teal shadow-sm"
                  : "text-cream/60 hover:text-cream hover:bg-cream/10"
              }`}
            >
              Anatomy
            </Link>
          </nav>
        </header>

        {/* ── Main Content Area ────────────────────────────────────────────── */}
        <Routes>
          <Route path="/" element={<PitchTracker />} />
          <Route path="/anatomy" element={<Anatomy />} />
          <Route path="/anatomy/diaphragm" element={<DiaphragmPage />} />
        </Routes>

      </div>
    </main>
  );
}