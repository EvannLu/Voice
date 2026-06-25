import { useState } from "react";
import { Link } from "react-router-dom";
import PostureModel from "../components/PostureModel";

const POSTURE_OPTIONS = [
  {
    key: null,
    label: "All Postures",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    desc: "View all four postures side by side",
  },
  {
    key: "forward-head",
    label: "Forward Head",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
      </svg>
    ),
    desc: "Cervical displacement — head jutting forward",
    problem: true,
  },
  {
    key: "lordosis",
    label: "Lordosis",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
      </svg>
    ),
    desc: "Swayback — exaggerated lower spine curve",
    problem: true,
  },
  {
    key: "slouch",
    label: "Slouch",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5-5-5" />
      </svg>
    ),
    desc: "Thoracic kyphosis — upper back rounded forward",
    problem: true,
  },
  {
    key: "correct",
    label: "Correct",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    desc: "Tall spine — optimal alignment for singing",
    problem: false,
  },
];

export default function PosturePage() {
  const [activePosture, setActivePosture] = useState(null);

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
        <div
          className="relative rounded-2xl border border-blue/15 bg-gradient-to-b from-teal/[0.03] to-blue/[0.06] shadow-card-lg overflow-hidden"
          style={{ minHeight: 520 }}
        >
          <PostureModel activePosture={activePosture} />

          {/* Floating posture indicator */}
          <div className="absolute top-5 left-5 flex items-center gap-3 rounded-xl border border-blue/10 bg-cream/80 backdrop-blur-md px-4 py-3 shadow-card">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              activePosture === "correct"
                ? "bg-gold"
                : activePosture
                ? "bg-[#d45c5c]"
                : "bg-blue"
            } transition-colors duration-300`}>
              <svg className="h-4.5 w-4.5 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${
                activePosture === "correct"
                  ? "text-gold"
                  : activePosture
                  ? "text-[#d45c5c]"
                  : "text-blue"
              } transition-colors duration-300`}>
                {activePosture
                  ? POSTURE_OPTIONS.find((o) => o.key === activePosture)?.label || "All"
                  : "Posture Comparison"}
              </p>
              <p className="text-[11px] text-teal/50 mt-0.5">
                {activePosture
                  ? POSTURE_OPTIONS.find((o) => o.key === activePosture)?.desc
                  : "Select a posture to inspect"}
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

          {/* Posture Selector */}
          <div className="rounded-2xl border border-blue/15 bg-cream p-6 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue/40 mb-4">
              Select Posture
            </p>
            <div className="flex flex-col gap-2">
              {POSTURE_OPTIONS.map((option) => {
                const isActive = activePosture === option.key;
                const isCorrectType = option.key === "correct";
                const isProblem = option.problem;

                let btnClasses;
                if (isActive && isCorrectType) {
                  btnClasses = "bg-gold text-teal shadow-card";
                } else if (isActive && isProblem) {
                  btnClasses = "bg-[#d45c5c] text-cream shadow-card";
                } else if (isActive) {
                  btnClasses = "bg-blue text-cream shadow-card";
                } else {
                  btnClasses = "bg-blue/[0.04] text-teal/70 hover:bg-blue/[0.08]";
                }

                return (
                  <button
                    key={option.key ?? "all"}
                    onClick={() => setActivePosture(option.key)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${btnClasses}`}
                  >
                    <span className="shrink-0">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-2xl border border-blue/15 bg-cream p-6 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue/40 mb-4">
              Legend
            </p>
            <div className="flex flex-col gap-3">
              <LegendItem color="bg-[#dda853]" label="Correct posture" />
              <LegendItem color="bg-[#d45c5c]" label="Problem zone" />
              <LegendItem color="bg-[#d4cbb8]" label="Body structure" />
              <LegendItem color="bg-[#9a8a70]" label="Spine vertebrae" />
              <LegendItem color="bg-[#888888]" label="Alignment reference" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Educational Content ───────────────────────────────────────── */}
      <div className="w-full grid gap-6 sm:grid-cols-3">

        <InfoCard
          number="01"
          title="The Tall Spine"
          description="An aligned spine is the foundation for singing and health. It optimizes lung capacity by freeing the ribs and diaphragm, distributes weight to prevent neck/back strain (avoiding chronic fatigue and tension headaches), and opens your airway."
        />

        <InfoCard
          number="02"
          title="How Bad Posture Hurts Your Voice"
          description="Forward head position causes flat acoustics, nasality, and limited vocal range. It prevents smooth passage through the passaggio (vocal break). Lordosis restricts abdominal release during breath intake. A slouched upper back compresses the chest cavity, severely limiting lung expansion and breath support."
        />

        <InfoCard
          number="03"
          title="How to get into Correct Posture"
          description={`Roll your shoulders gently back, reach your arms straight toward the ceiling like you're trying to touch the sky, and then let them float freely back down to your sides, leaving your chest open and lifted.`}
        />
      </div>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      <div className="w-full border-t border-blue/15"></div>

      {/* ── Key Rules Strip ───────────────────────────────────────────── */}
      <div className="w-full grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-blue/15 bg-blue/[0.06] px-8 py-6 flex items-start gap-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue mt-0.5">
            <svg className="h-5 w-5 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-teal mb-1">Rule #1</p>
            <p className="text-sm leading-relaxed text-teal/70">
              <span className="font-semibold text-teal">Always bend from the hips</span> — never from the spine. Whether dancing, sitting, or performing, the pivot point is always the pelvis, not the lower back.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-blue/15 bg-blue/[0.06] px-8 py-6 flex items-start gap-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue mt-0.5">
            <svg className="h-5 w-5 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-teal mb-1">Rule #2</p>
            <p className="text-sm leading-relaxed text-teal/70">
              <span className="font-semibold text-teal">Natural, Effortless Poise</span> — never force your posture. The goal is to feel light, balanced, and free of tension. If you feel strain, you are doing it wrong.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tip Strip ─────────────────────────────────────────────────── */}
      <div className="w-full rounded-2xl border border-blue/15 bg-blue/[0.06] px-8 py-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold">
          <svg className="h-5 w-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-teal/70 text-center sm:text-left">
          <span className="font-semibold text-teal">Practice Tip:</span>{" "}
          Stand in front of a mirror and imagine a ponytail at the very top-back of your skull. Picture it being gently pulled straight upward toward the ceiling — not yanked, just nicely taut. This single visualization, from the Alexander Technique, corrects most neck displacement issues and creates the &quot;tall spine&quot; foundation for optimal singing posture.
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
