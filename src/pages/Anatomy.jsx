import { Link } from "react-router-dom";

export default function Anatomy() {
  return (
    <section className="flex flex-col items-center w-full max-w-7xl gap-10">


      {/* ── Anatomy cards ─────────────────────────────────────────── */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 w-full">

        {/* Diaphragm — Cream card (linked) */}
        <Link to="/anatomy/diaphragm" className="block">
          <article
            id="anatomy-diaphragm"
            className="group rounded-2xl border border-blue/15 bg-cream hover:bg-blue p-8 flex flex-col items-center text-center shadow-card transition-all duration-300 hover:shadow-card-lg hover:-translate-y-1 cursor-pointer h-full"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue group-hover:bg-cream/15 mb-6 shadow-card transition-all duration-300 group-hover:scale-110">
              <svg className="h-7 w-7 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-blue/50 group-hover:text-cream/45 mb-2 transition-colors duration-300">01</div>
            <h3 className="text-xl font-bold text-teal group-hover:text-cream transition-colors duration-300">Diaphragm</h3>
            <div className="mt-3 h-px w-10 bg-gold/50 mx-auto transition-colors duration-300 group-hover:bg-gold/80"></div>
            <p className="mt-4 text-sm leading-relaxed text-teal/60 group-hover:text-cream/70 transition-colors duration-300">
              The power source for your voice, providing the airflow and sub-glottal pressure
              needed to set the vocal folds in motion.
            </p>
            {/* Explore indicator */}
            <div className="mt-auto pt-5 flex items-center gap-1.5 text-xs font-semibold text-gold/70 group-hover:text-gold transition-colors duration-300">
              <span>Explore 3D Model</span>
              <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </article>
        </Link>

        {/* Vocal Folds — Cream card (placeholder link) */}
        <article
          id="anatomy-vocal-folds"
          className="group rounded-2xl border border-blue/15 bg-cream hover:bg-blue p-8 flex flex-col items-center text-center shadow-card transition-all duration-300 hover:shadow-card-lg hover:-translate-y-1 h-full"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue group-hover:bg-cream/15 mb-6 shadow-card transition-all duration-300 group-hover:scale-110">
            <svg className="h-7 w-7 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-blue/50 group-hover:text-cream/45 mb-2 transition-colors duration-300">02</div>
          <h3 className="text-xl font-bold text-teal group-hover:text-cream transition-colors duration-300">Vocal Folds</h3>
          <div className="mt-3 h-px w-10 bg-gold/50 mx-auto transition-colors duration-300 group-hover:bg-gold/80"></div>
          <p className="mt-4 text-sm leading-relaxed text-teal/60 group-hover:text-cream/70 transition-colors duration-300">
            The vibrator. As air passes through the larynx, the folds adduct and vibrate,
            creating the fundamental frequency of your voice.
          </p>
          {/* Coming soon badge */}
          <div className="mt-auto pt-5 flex items-center gap-1.5 text-xs font-semibold text-teal/30 group-hover:text-cream/35">
            <span>Coming Soon</span>
          </div>
        </article>

        {/* Articulators — Cream card (placeholder link) */}
        <article
          id="anatomy-articulators"
          className="group rounded-2xl border border-blue/15 bg-cream hover:bg-blue p-8 flex flex-col items-center text-center shadow-card transition-all duration-300 hover:shadow-card-lg hover:-translate-y-1 h-full"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue group-hover:bg-cream/15 mb-6 shadow-card transition-all duration-300 group-hover:scale-110">
            <svg className="h-7 w-7 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-blue/50 group-hover:text-cream/45 mb-2 transition-colors duration-300">03</div>
          <h3 className="text-xl font-bold text-teal group-hover:text-cream transition-colors duration-300">Articulators</h3>
          <div className="mt-3 h-px w-10 bg-gold/50 mx-auto transition-colors duration-300 group-hover:bg-gold/80"></div>
          <p className="mt-4 text-sm leading-relaxed text-teal/60 group-hover:text-cream/70 transition-colors duration-300">
            The resonators — throat, mouth, and nasal cavity — that shape raw phonation
            into intelligible speech or expressive song.
          </p>
          {/* Coming soon badge */}
          <div className="mt-auto pt-5 flex items-center gap-1.5 text-xs font-semibold text-teal/30 group-hover:text-cream/35">
            <span>Coming Soon</span>
          </div>
        </article>

        {/* Vocal Registers — Cream card (placeholder link) */}
        <article
          id="anatomy-vocal-registers"
          className="group rounded-2xl border border-blue/15 bg-cream hover:bg-blue p-8 flex flex-col items-center text-center shadow-card transition-all duration-300 hover:shadow-card-lg hover:-translate-y-1 h-full"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue group-hover:bg-cream/15 mb-6 shadow-card transition-all duration-300 group-hover:scale-110">
            <svg className="h-7 w-7 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest text-blue/50 group-hover:text-cream/45 mb-2 transition-colors duration-300">04</div>
          <h3 className="text-xl font-bold text-teal group-hover:text-cream transition-colors duration-300">Vocal Registers</h3>
          <div className="mt-3 h-px w-10 bg-gold/50 mx-auto transition-colors duration-300 group-hover:bg-gold/80"></div>
          <p className="mt-4 text-sm leading-relaxed text-teal/60 group-hover:text-cream/70 transition-colors duration-300">
            Chest voice, head voice, falsetto, and fry — the different vibrational modes of the vocal folds mapping to distinct pitch registers.
          </p>
          {/* Coming soon badge */}
          <div className="mt-auto pt-5 flex items-center gap-1.5 text-xs font-semibold text-teal/30 group-hover:text-cream/35">
            <span>Coming Soon</span>
          </div>
        </article>

        {/* Posture & Alignment — Cream card (linked) */}
        <Link to="/anatomy/posture" className="block">
          <article
            id="anatomy-posture"
            className="group rounded-2xl border border-blue/15 bg-cream hover:bg-blue p-8 flex flex-col items-center text-center shadow-card transition-all duration-300 hover:shadow-card-lg hover:-translate-y-1 cursor-pointer h-full"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue group-hover:bg-cream/15 mb-6 shadow-card transition-all duration-300 group-hover:scale-110">
              <svg className="h-7 w-7 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-blue/50 group-hover:text-cream/45 mb-2 transition-colors duration-300">05</div>
            <h3 className="text-xl font-bold text-teal group-hover:text-cream transition-colors duration-300">Posture & Alignment</h3>
            <div className="mt-3 h-px w-10 bg-gold/50 mx-auto transition-colors duration-300 group-hover:bg-gold/80"></div>
            <p className="mt-4 text-sm leading-relaxed text-teal/60 group-hover:text-cream/70 transition-colors duration-300">
              Optimal physical alignment of the head, spine, and shoulders to minimize throat tension and maximize lung expansion capacity.
            </p>
            {/* Explore indicator */}
            <div className="mt-auto pt-5 flex items-center gap-1.5 text-xs font-semibold text-gold/70 group-hover:text-gold transition-colors duration-300">
              <span>Explore 3D Model</span>
              <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </article>
        </Link>

      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="w-full border-t border-blue/15"></div>

      {/* ── Info strip — Classic Blue structural band ───────────────────── */}
      <div className="w-full rounded-2xl border border-blue/15 bg-blue/6 px-8 py-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue">
          <svg className="h-5 w-5 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-teal/70 text-center sm:text-left">
          <span className="font-semibold text-teal">Did you know?</span>{" "}
          The average human speaks at a fundamental frequency between 85–255 Hz. Head over to
          the <span className="font-semibold text-blue">Pitch Tracker</span> to measure yours in real time.
        </p>
      </div>

    </section>
  );
}
