import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import DiaphragmModel from "../components/DiaphragmModel";

export default function DiaphragmPage() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [phase, setPhase] = useState({ phase: "inhale", progress: 0 });

  // Throttle phase updates to avoid excessive re-renders
  const lastUpdate = useRef(0);
  const handlePhaseChange = useCallback((data) => {
    const now = Date.now();
    if (now - lastUpdate.current > 60) {
      lastUpdate.current = now;
      setPhase(data);
    }
  }, []);

  // Progress ring SVG parameters
  const ringRadius = 28;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - phase.progress);

  return (
    <section className="flex flex-col items-center w-full max-w-7xl gap-8">

      {/* ── Back Navigation ──────────────────────────────────────────── */}
      <div className="w-full flex items-center">
        <Link
          to="/anatomy"
          className="group flex items-center gap-2 text-sm font-semibold text-blue/70 hover:text-blue transition-colors duration-200"
        >
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Anatomy
        </Link>
      </div>

      {/* ── 3D Viewport + Controls ───────────────────────────────────── */}
      <div className="w-full grid gap-6 lg:grid-cols-[1fr_280px]">

        {/* 3D Canvas */}
        <div className="relative rounded-2xl border border-blue/15 bg-gradient-to-b from-teal/[0.03] to-blue/[0.06] shadow-card-lg overflow-hidden"
          style={{ minHeight: 520 }}
        >
          <DiaphragmModel
            isPlaying={isPlaying}
            speed={speed}
            onPhaseChange={handlePhaseChange}
          />

          {/* Floating phase indicator */}
          <div className="absolute top-5 left-5 flex items-center gap-3 rounded-xl border border-blue/10 bg-cream/80 backdrop-blur-md px-4 py-3 shadow-card">
            {/* Progress Ring */}
            <svg width="64" height="64" className="shrink-0 -rotate-90">
              <circle
                cx="32" cy="32" r={ringRadius}
                fill="none"
                stroke="currentColor"
                className="text-blue/10"
                strokeWidth="4"
              />
              <circle
                cx="32" cy="32" r={ringRadius}
                fill="none"
                stroke="currentColor"
                className={phase.phase === "inhale" ? "text-blue" : "text-gold"}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ transition: "stroke-dashoffset 80ms linear, stroke 300ms ease" }}
              />
            </svg>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${
                phase.phase === "inhale" ? "text-blue" : "text-gold"
              } transition-colors duration-300`}>
                {phase.phase}
              </p>
              <p className="text-[11px] text-teal/50 mt-0.5">
                {Math.round(phase.progress * 100)}%
              </p>
            </div>
          </div>

          {/* Drag hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-teal/70 backdrop-blur-sm px-4 py-1.5 text-[11px] text-cream/60 font-medium">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Drag to rotate · Scroll to zoom
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex flex-col gap-4">

          {/* Play / Pause */}
          <div className="rounded-2xl border border-blue/15 bg-cream p-6 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue/40 mb-4">Controls</p>
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-200 shadow-card hover:shadow-card-lg ${
                isPlaying
                  ? "bg-blue text-cream hover:bg-blue/90"
                  : "bg-gold text-teal hover:bg-gold/90"
              }`}
            >
              {isPlaying ? (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </>
              )}
            </button>
          </div>

          {/* Speed Control */}
          <div className="rounded-2xl border border-blue/15 bg-cream p-6 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue/40 mb-1">
              Breathing Speed
            </p>
            <p className="text-xs text-teal/50 mb-4">
              {speed < 0.6 ? "Slow — great for learning" : speed < 1.3 ? "Normal" : "Fast — advanced practice"}
            </p>
            <input
              type="range"
              min="0.3"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-gold cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-teal/40 mt-1.5 font-medium">
              <span>Slow</span>
              <span>{speed.toFixed(1)}×</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-2xl border border-blue/15 bg-cream p-6 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue/40 mb-4">Legend</p>
            <div className="flex flex-col gap-3">
              <LegendItem color="bg-[#c46b6b]" label="Diaphragm" />
              <LegendItem color="bg-[#d4837a]" label="Lungs" />
              <LegendItem color="bg-[#c9b99a]" label="Ribcage" />
              <LegendItem color="bg-[#b85c5c]" label="Trachea & Bronchi" />
              <LegendItem color="bg-[#7ec8e3]" label="Airflow" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Educational Content ───────────────────────────────────────── */}
      <div className="w-full grid gap-6 sm:grid-cols-3">

        <InfoCard
          number="01"
          title="Inhale: Diaphragm Descends"
          description="When you breathe in, the diaphragm contracts and flattens downward, increasing the volume of the thoracic cavity. This creates negative pressure, pulling air into the lungs — the foundation of breath support in singing."
        />

        <InfoCard
          number="02"
          title="Exhale: Controlled Release"
          description='During singing, the exhale is slow and controlled — the "appoggio" technique. The diaphragm gradually returns to its domed position while the abdominal muscles provide steady, calibrated pressure for consistent airflow.'
        />

        <InfoCard
          number="03"
          title="Why Singers Care"
          description="Diaphragmatic breathing provides a larger air reservoir and finer control over sub-glottal pressure. This means longer phrases, steadier vibrato, more consistent dynamics, and less vocal strain compared to shallow chest breathing."
        />
      </div>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="w-full border-t border-blue/15"></div>

      {/* ── Tip Strip ────────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl border border-blue/15 bg-blue/[0.06] px-8 py-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold">
          <svg className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-teal/70 text-center sm:text-left">
          <span className="font-semibold text-teal">Practice Tip:</span>{" "}
          Lie on your back and place a book on your stomach. As you inhale, the book should rise.
          As you exhale slowly (hissing on an &quot;sss&quot;), the book should lower gradually.
          This trains your diaphragm for singing breath support.
        </p>
      </div>

    </section>
  );
}

/* ── Reusable sub-components ─────────────────────────────────────────── */

function InfoCard({ number, title, description }) {
  return (
    <article className="rounded-2xl border border-blue/15 bg-cream p-8 shadow-card transition-all duration-300 hover:shadow-card-lg hover:-translate-y-1">
      <div className="text-xs font-semibold uppercase tracking-widest text-blue/40 mb-2">
        {number}
      </div>
      <h3 className="text-lg font-bold text-teal mb-3">{title}</h3>
      <div className="h-px w-10 bg-gold/50 mb-4"></div>
      <p className="text-sm leading-relaxed text-teal/60">{description}</p>
    </article>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-3 w-3 rounded-full ${color} shadow-sm shrink-0`}></span>
      <span className="text-xs font-medium text-teal/70">{label}</span>
    </div>
  );
}
