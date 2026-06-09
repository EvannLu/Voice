import PitchChart from "./components/PitchChart";
import useVocalPitch from "./hooks/useVocalPitch";

export default function App() {
  const {
    currentFrequency,
    currentNote,
    isRecording,
    startRecording,
    stopRecording,
  } = useVocalPitch();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 transition-colors duration-300 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8">
        <header className="w-full max-w-4xl rounded-3xl border border-white/10 bg-slate-900/70 px-6 py-6 text-center shadow-2xl shadow-slate-950/40 backdrop-blur md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-300/90">
            Live vocal pitch tracker
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Voice Pitch Tracker
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            A focused, high-contrast interface for reading live pitch at a glance.
          </p>
        </header>

        <section className="grid w-full max-w-7xl gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.55fr)]">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/75 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startRecording}
                disabled={isRecording}
                aria-label="Start singing and request microphone access"
                className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-base font-semibold text-emerald-950 shadow-lg shadow-emerald-950/20 transition duration-200 hover:bg-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-400/40 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg"
              >
                {isRecording ? "Recording..." : "Start Singing"}
              </button>
              <button
                type="button"
                onClick={stopRecording}
                disabled={!isRecording}
                aria-label="Stop microphone input"
                className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/15 px-6 py-4 text-base font-semibold text-rose-100 shadow-lg shadow-rose-950/20 transition duration-200 hover:bg-rose-500/25 focus:outline-none focus:ring-4 focus:ring-rose-400/40 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg"
              >
                Stop
              </button>
            </div>

            <div
              className="rounded-3xl border border-white/10 bg-slate-950/50 px-5 py-7 text-center"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Current Note
              </p>
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="text-8xl font-black leading-none tracking-tight text-white tabular-nums sm:text-9xl lg:text-[8.5rem]">
                  {currentNote}
                </div>
                <div className="text-base font-medium tabular-nums text-slate-300 sm:text-lg">
                  {isRecording && currentFrequency > 0
                    ? `${currentFrequency.toFixed(2)} Hz`
                    : "Awaiting microphone input..."}
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {isRecording
                  ? "Microphone access is active."
                  : "The chart remains static until microphone access is granted."}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-6">
            <PitchChart currentFrequency={currentFrequency} isActive={isRecording} />
          </div>
        </section>
      </div>
    </main>
  );
}