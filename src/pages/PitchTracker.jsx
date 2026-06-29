import { useState, useRef, useCallback, useEffect } from "react";
import PitchChart from "../components/PitchChart";
import useVocalPitch, { frequencyToNote } from "../hooks/useVocalPitch";
// Import the mock pitch tracker hook for simulating vocal signals in Dev Mode
import useMockPitch from "../hooks/useMockPitch";

export default function PitchTracker() {
  // --- MOCK MODE / SIMULATION STATUS ---
  // showMockControls is enabled if '?mock=true' query parameter is passed in the URL
  const [showMockControls, setShowMockControls] = useState(false);
  // isMockMode indicates if we are using the simulation (mockPitch) instead of real microphone input (vocalPitch)
  const [isMockMode, setIsMockMode] = useState(false);

  // Check URL query parameters on mount to conditionally expose Mock Mode controls
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mock") === "true") {
      setShowMockControls(true);
    }
  }, []);

  // Initialize both active pitch stream hooks (microphone vs simulated data)
  const vocalPitch = useVocalPitch();
  const mockPitch = useMockPitch();

  // --- MOCK SIMULATOR INTERACTION ---
  // If Mock Mode is ON, we project the simulated mockPitch data into the standard
  // activePitch structure to feed the chart without changing its interface.
  const activePitch = isMockMode ? {
    currentFrequency: mockPitch.currentFrequency,
    currentNote: mockPitch.currentNote,
    isRecording: mockPitch.isRunning,
    startRecording: mockPitch.start,
    stopRecording: mockPitch.stop,
    status: mockPitch.isRunning ? "active" : "idle",
    errorMessage: "",
    isPending: false,
    isBlocked: false,
    clearSession: () => {},
    audioUrl: null,
    recordingStartTime: mockPitch.recordingStartTime,
    recordingDuration: 0,
  } : vocalPitch;

  const {
    currentFrequency: liveFrequency,
    currentNote: liveNote,
    isRecording,
    startRecording,
    stopRecording,
    clearSession,
    audioUrl,
    recordingStartTime,
    recordingDuration,
  } = activePitch;

  // --- TEARDOWN / SOURCE RESET CORRELATION ---
  // Ensure that toggling Mock Mode stops both active vocal and mock loops
  // to prevent cross-contamination of recording start times or animation frames.
  useEffect(() => {
    vocalPitch.stopRecording();
    mockPitch.stop();
  }, [isMockMode]);

  const [playbackTimeMs, setPlaybackTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedPoints, setRecordedPoints] = useState([]);
  const audioRef = useRef(null);

  const mode = isRecording ? "recording" : (audioUrl ? "playback" : "idle");

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => console.error("Error playing audio:", err));
    }
  };

  const handleScrub = useCallback((timeMs) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeMs / 1000;
    setPlaybackTimeMs(timeMs);
  }, []);

  const handleRecordingComplete = useCallback((points) => {
    setRecordedPoints(points);
    setPlaybackTimeMs(0);
  }, []);

  const handleClearSession = () => {
    clearSession();
    setRecordedPoints([]);
    setPlaybackTimeMs(0);
    setIsPlaying(false);
  };

  // Determine display values for current note display
  let displayNote = "--";
  let displayFrequency = -1;

  if (mode === "recording") {
    displayNote = liveNote;
    displayFrequency = liveFrequency;
  } else if (mode === "playback") {
    let closestPt = null;
    let minDiff = Infinity;
    for (const pt of recordedPoints) {
      const diff = Math.abs(pt.t - playbackTimeMs);
      if (diff < minDiff) {
        minDiff = diff;
        closestPt = pt;
      }
    }
    if (closestPt && minDiff < 150) {
      displayFrequency = closestPt.hz;
      displayNote = frequencyToNote(closestPt.hz);
    }
  }

  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <section className="grid w-full max-w-7xl gap-6 lg:grid-cols-[380px_1fr] items-start">
      {/* Hidden audio player */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setPlaybackTimeMs(e.target.currentTime * 1000)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* ── Left: Controls + Current Note ─────────────────────────────── */}
      <div className="flex flex-col gap-5 rounded-2xl border border-blue/15 bg-cream shadow-card-lg p-6">

        {/* Start / Stop / Playback buttons */}
        <div className="flex flex-col gap-3">
          {mode === "playback" ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={togglePlay}
                  id="btn-play-pause"
                  aria-label={isPlaying ? "Pause playback" : "Play recording"}
                  className="inline-flex min-h-14 flex-1 items-center justify-center rounded-xl bg-gold px-6 py-4 text-base font-bold text-teal shadow-card transition duration-200 hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-cream sm:text-lg"
                >
                  {isPlaying ? "Pause Playback" : "Play Session"}
                </button>

                <button
                  type="button"
                  onClick={handleClearSession}
                  id="btn-record-new"
                  aria-label="Start a new recording session"
                  className="inline-flex min-h-14 flex-1 items-center justify-center rounded-xl border-2 border-blue/35 bg-transparent px-6 py-4 text-base font-semibold text-blue transition duration-200 hover:border-blue/70 hover:bg-blue/5 focus:outline-none focus:ring-4 focus:ring-blue/20 focus:ring-offset-2 focus:ring-offset-cream sm:text-lg"
                >
                  Record New
                </button>
              </div>

              <div className="flex justify-between text-xs font-semibold uppercase tracking-[0.15em] text-blue/60 mt-1 px-1">
                <span>Timeline Time</span>
                <span>{formatTime(playbackTimeMs)} / {formatTime(recordingDuration)}</span>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 sm:flex-row">
              <button
                type="button"
                onClick={startRecording}
                disabled={isRecording}
                id="btn-start-singing"
                aria-label={isMockMode ? "Start mock pitch simulation" : "Start singing and request microphone access"}
                className="inline-flex min-h-14 flex-1 items-center justify-center rounded-xl bg-gold px-6 py-4 text-base font-bold text-teal shadow-card transition duration-200 hover:brightness-95 focus:outline-none focus:ring-4 focus:ring-gold/40 focus:ring-offset-2 focus:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg"
              >
                {isRecording ? "Recording…" : "Start Singing"}
              </button>

              <button
                type="button"
                onClick={stopRecording}
                disabled={!isRecording}
                id="btn-stop"
                aria-label="Stop pitch tracking"
                className="inline-flex min-h-14 flex-1 items-center justify-center rounded-xl border-2 border-blue/35 bg-transparent px-6 py-4 text-base font-semibold text-blue transition duration-200 hover:border-blue/70 hover:bg-blue/5 focus:outline-none focus:ring-4 focus:ring-blue/20 focus:ring-offset-2 focus:ring-offset-cream disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg"
              >
                Stop
              </button>
            </div>
          )}
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
              {displayNote}
            </div>
            <div className="text-base font-medium tabular-nums text-blue sm:text-lg">
              {displayFrequency > 0
                ? `${displayFrequency.toFixed(2)} Hz`
                : mode === "playback"
                ? "Scrub or play to view pitch..."
                : isMockMode
                ? "Awaiting simulated pitch data…"
                : "Awaiting microphone input…"}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-teal/50">
            {activePitch.errorMessage ? (
              <span className="text-red-500 font-semibold">{activePitch.errorMessage}</span>
            ) : mode === "recording" ? (
              isMockMode ? "Mock pitch simulation is active." : "Microphone access is active."
            ) : mode === "playback" ? (
              "Playback mode active. Drag chart to seek."
            ) : activePitch.isPending ? (
              "Requesting microphone access…"
            ) : isMockMode ? (
              "The chart remains static until mock pitch is started."
            ) : (
              "The chart remains static until microphone access is granted."
            )}
          </p>
        </div>



        {/* Mock Mode Toggle: Exposes controls to switch between mock pitch simulation and mic input */}
        {showMockControls && (
          <div className="rounded-xl border border-blue/12 bg-teal/5 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-teal">Mock Mode (Mock Pitch)</p>
                <p className="mt-0.5 text-xs leading-5 text-teal/55">
                  {isMockMode
                    ? "Generating simulated pitch data"
                    : "Using real microphone input"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                id="toggle-mock-mode"
                aria-checked={isMockMode}
                onClick={() => setIsMockMode((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-cream ${
                  isMockMode ? "bg-blue" : "bg-blue/25"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-cream shadow-md ring-0 transition duration-200 ease-in-out ${
                    isMockMode ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Pitch Display System Note */}
        <div className="rounded-xl border border-blue/10 bg-blue/3 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue/70">
            System Guide
          </p>
          <p className="mt-2 text-xs leading-5 text-teal/70">
            <strong>How the Chart & Note Calculator work together:</strong>
            <br />
            The note calculator maps your real-time frequency onto 12 absolute pitch classes (F to E). The chart matches this exact 2-octave wrapped layout vertically. This allows vocal accuracy visualization independent of absolute octave registers (e.g. tenor or soprano), eliminating vertical scrolling.
          </p>
        </div>

      </div>

      {/* ── Right: Scatter Chart ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue/15 bg-cream p-4 shadow-card-lg sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isRecording
                  ? "bg-emerald-500 animate-pulse"
                  : activePitch.isPending
                  ? "bg-amber-500 animate-pulse"
                  : activePitch.isBlocked
                  ? "bg-red-500"
                  : mode === "playback"
                  ? "bg-blue animate-pulse"
                  : "bg-slate-400"
              }`}
              aria-hidden="true"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue/60">
              {mode === "playback" ? "Playback session" : "Pitch stream"}
            </p>
          </div>
        </div>

        {/* Canvas container */}
        <div
          className="relative w-full overflow-hidden rounded-xl border border-blue/15 shadow-inner"
          style={{ height: "760px", background: "#EDE6D3" }}
        >
          <PitchChart
            currentFrequency={liveFrequency}
            isActive={isRecording}
            mode={mode}
            playbackTimeMs={playbackTimeMs}
            recordingStartTime={recordingStartTime}
            recordingDuration={recordingDuration}
            onScrub={handleScrub}
            onRecordingComplete={handleRecordingComplete}
          />
        </div>
      </div>

    </section>
  );
}
