import { useState } from "react";
import { Link } from "react-router-dom";
import PostureModel from "../components/PostureModel";

export default function PosturePage() {
  const [posture, setPosture] = useState("good");

  const postureInfo = {
    good: {
      title: "Optimal Alignment",
      desc: "Ear, shoulder, hip, and ankle align vertically. This maximizes lung capacity, reduces laryngeal tension, and provides the most efficient mechanical advantage for breath support.",
    },
    swayback: {
      title: "Sway Back",
      desc: "Pelvis shifts forward relative to the feet, rounding the upper back. This collapses the chest, hindering diaphragm descent and reducing breath capacity.",
    },
    lumbar: {
      title: "Lumbar Lordosis",
      desc: "An exaggerated curve in the lower back (anterior pelvic tilt). This locks the abdominal muscles, making it difficult to use them effectively for breath support (appoggio).",
    },
    kyphosis: {
      title: "Thoracic Kyphosis",
      desc: "Excessive rounding of the upper back and shoulders. This severely limits ribcage expansion and often leads to compensatory neck tension.",
    },
    forwardhead: {
      title: "Forward Head",
      desc: "The head juts forward of the center of gravity. For every inch forward, the neck bears an extra 10 lbs of weight. This pulls on the larynx, impeding vocal fold vibration and altering resonance.",
    },
  };

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
      <div className="w-full grid gap-6 lg:grid-cols-[1fr_320px]">

        {/* 3D Canvas */}
        <div className="relative rounded-2xl border border-blue/15 bg-gradient-to-b from-teal/[0.03] to-blue/[0.06] shadow-card-lg overflow-hidden"
          style={{ minHeight: 520 }}
        >
          <PostureModel postureType={posture} />

          {/* Floating posture indicator */}
          <div className="absolute top-5 left-5 rounded-xl border border-blue/10 bg-cream/80 backdrop-blur-md px-4 py-3 shadow-card max-w-xs">
            <h3 className="text-sm font-bold text-teal mb-1">{postureInfo[posture].title}</h3>
            <p className="text-xs text-teal/70 leading-relaxed">{postureInfo[posture].desc}</p>
          </div>

          {/* Drag hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-teal/70 backdrop-blur-sm px-4 py-1.5 text-[11px] text-cream/60 font-medium">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Drag to rotate
          </div>
        </div>

        {/* Controls Panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-blue/15 bg-cream p-6 shadow-card h-full flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-blue/40 mb-4">Select Posture</p>
            <div className="flex flex-col gap-3">
              {Object.entries({
                good: "Optimal Alignment",
                swayback: "Sway Back",
                lumbar: "Lumbar Lordosis",
                kyphosis: "Thoracic Kyphosis",
                forwardhead: "Forward Head"
              }).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPosture(key)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    posture === key
                      ? "bg-blue border-blue text-cream shadow-md"
                      : "bg-white border-blue/10 text-teal hover:border-blue/30 hover:bg-blue/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-auto pt-6">
               <p className="text-[11px] font-semibold uppercase tracking-widest text-blue/40 mb-3">Legend</p>
               <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-3">
                    <span className="h-0.5 w-6 bg-gold shadow-sm shrink-0"></span>
                    <span className="text-xs font-medium text-teal/70">Plumb Line (Gravity)</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-[#c9b99a] shadow-sm shrink-0"></span>
                    <span className="text-xs font-medium text-teal/70">Skeletal Alignment</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Educational Content ───────────────────────────────────────── */}
      <div className="w-full grid gap-6 sm:grid-cols-3">
        <InfoCard
          number="01"
          title="The Noble Posture"
          description='Often referred to as the "noble posture," ideal alignment involves a comfortably high sternum, ribs slightly expanded, and the head balanced freely on the spine. It feels buoyant, not rigid.'
        />
        <InfoCard
          number="02"
          title="Tension is the Enemy"
          description="Misalignment forces muscles to work overtime to keep you upright. This extraneous tension quickly spreads to the jaw, tongue, and larynx, severely limiting vocal freedom and range."
        />
        <InfoCard
          number="03"
          title="Breath Mechanics"
          description="Your lungs are housed in your ribcage. If your spine is collapsed or excessively curved, the ribs cannot swing open fully during inhalation, halving your available breath supply."
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
          Stand with your back against a wall. Your heels, buttocks, shoulders, and the back of your head should gently touch the wall. Step away while maintaining this alignment.
        </p>
      </div>

    </section>
  );
}

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