import { useState } from "react";
import PitchChart from "../components/PitchChart";
import useVocalPitch from "../hooks/useVocalPitch";

export default function PitchTracker() {
  const {
    currentFrequency,
    currentNote,
    isRecording,
    startRecording,
    stopRecording,
  } = useVocalPitch();

  const [autoPanLock, setAutoPanLock] = useState(true);

  return (
    <section className="grid w-full max-w-7xl gap-6 lg:grid-cols-[380px_1fr] items-start">

      {/* ── Left: Controls + Current Note ─────────────────────────────── */}
      <div className="flex flex-col gap-5 rounded-2xl border border-blue/15 bg-cream shadow-card-lg p-6">

        {/* Start / Stop buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">

          {/* Primary CTA — Gold bg / Teal text (max pop against cream) */}
          <button
            type="button"
            onClick={startRecording}
            disabled={isRecording}
            id="btn-start-singing"
            aria-label="Start singing and request microphone access"
            className="inline-flex min-h-14 flex-1 items-center justify-center rounded-xl bg-gold px-6 py-4 text-base font-bold text-teal shadow-card transition duration-200 hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg"
          >
            {isRecording ? "Recording…" : "Start Singing"}
          </button>

          {/* Secondary — outlined in Classic Blue */}
          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
            id="btn-stop"
            aria-label="Stop microphone input"
            className="inline-flex min-h-14 flex-1 items-center justify-center rounded-xl border-2 border-blue/35 bg-transparent px-6 py-4 text-base font-semibold text-blue transition duration-200 hover:border-blue/70 hover:bg-blue/5 focus:outline-none focus:ring-4 focus:ring-blue/20 focus:ring-offset-2 focus:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg"
          >
            Stop
          </button>
        </div>

        {/* Current Note Display */}
        <div
          className="rounded-2xl border border-blue/12 bg-teal/5 px-5 py-7 text-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue">
            Current Note
          </p>
          <div className="mt-4 flex flex-col items-center gap-3">
            <div className="text-8xl font-black leading-none tracking-tight text-teal tabular-nums sm:text-9xl lg:text-[8.5rem]">
              {currentNote}
            </div>
            <div className="text-base font-medium tabular-nums text-blue sm:text-lg">
              {isRecording && currentFrequency > 0
                ? `${currentFrequency.toFixed(2)} Hz`
                : "Awaiting microphone input…"}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-teal/50">
            {isRecording
              ? "Microphone access is active."
              : "The chart remains static until microphone access is granted."}
          </p>
        </div>

        {/* Auto-Pan Lock Toggle */}
        <div className="rounded-xl border border-blue/12 bg-teal/5 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-teal">Vertical Pan Lock</p>
              <p className="mt-0.5 text-xs leading-5 text-teal/55">
                {autoPanLock
                  ? "Smoothly follows pitch — prevents sudden jumps"
                  : "Snaps quickly to new pitch position"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              id="toggle-pan-lock"
              aria-checked={autoPanLock}
              onClick={() => setAutoPanLock((v) => !v)}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-cream ${
                autoPanLock ? "bg-blue" : "bg-blue/25"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-cream shadow-md ring-0 transition duration-200 ease-in-out ${
                  autoPanLock ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

      </div>

      {/* ── Right: Scatter Chart ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue/15 bg-cream p-4 shadow-card-lg sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isRecording ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
              aria-hidden="true"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue/60">
              Pitch stream
            </p>
          </div>
          <div className="rounded-full border border-blue/20 bg-blue/8 px-3 py-1 text-xs font-medium text-blue">
            ±4 s window
          </div>
        </div>

        {/* Canvas container */}
        <div
          className="relative w-full overflow-hidden rounded-xl border border-blue/15 shadow-inner"
          style={{ height: "760px", background: "#EDE6D3" }}
        >
          <PitchChart
            currentFrequency={currentFrequency}
            isActive={isRecording}
            autoPanLock={autoPanLock}
          />
        </div>
      </div>

    </section>
  );
}
