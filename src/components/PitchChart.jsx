import { useEffect, useRef, useCallback } from "react";

// ─── Music Theory Helpers ────────────────────────────────────────────────────

const CHROMATIC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Convert MIDI number → frequency in Hz */
function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Convert frequency → MIDI (float) */
function hzToMidi(hz) {
  return 69 + 12 * Math.log2(hz / 440);
}

/** Build note grid: 24 semitones starting from F (fixed range) */
function buildNoteGrid() {
  const notes = [];
  for (let i = 0; i < 24; i++) {
    const semitone = ((i - 7) % 12 + 12) % 12;
    notes.push({
      midi:      i,
      name:      CHROMATIC[semitone],
      label:     CHROMATIC[semitone],
      isC:       semitone === 0,
      isNatural: !CHROMATIC[semitone].includes("#"),
    });
  }
  return notes;
}

const NOTE_GRID = buildNoteGrid();

// ─── Drawing Constants ────────────────────────────────────────────────────────

const LABEL_WIDTH      = 54;   // px — note label column on each side
const WINDOW_MS        = 12000; // visible horizontal window (ms)

/**
 * @param {{
 *   currentFrequency: number,
 *   isActive: boolean,
 *   autoPanLock: boolean,
 *   mode: string,
 *   playbackTimeMs: number,
 *   recordingStartTime: number|null,
 *   recordingDuration: number,
 *   onScrub: (t: number) => void,
 *   onRecordingComplete: (pts: any[]) => void
 * }} props
 */
export default function PitchChart({
  currentFrequency = 0,
  isActive = false,
  mode = "idle",
  playbackTimeMs = 0,
  recordingStartTime = null,
  recordingDuration = 0,
  onScrub,
  onRecordingComplete
}) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    points:       [],   // { t: ms, hz: number }[]
    // viewMidMidi = the MIDI note centred vertically on screen (smoothed)
    viewMidMidi:  60,   // start around C4
    targetMidMidi: 60,
    animFrame:    null,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, time: 0, hasMoved: false });
  const lastActiveRef = useRef(isActive);

  useEffect(() => {
    if (lastActiveRef.current && !isActive) {
      if (onRecordingComplete) {
        onRecordingComplete([...stateRef.current.points]);
      }
    }
    lastActiveRef.current = isActive;
  }, [isActive, onRecordingComplete]);

  // ── Accumulate points ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || currentFrequency <= 0 || !recordingStartTime) {
      console.log("MOCK_DEBUG: Skip accumulate", { isActive, currentFrequency, recordingStartTime });
      return;
    }
    const elapsed = performance.now() - recordingStartTime;
    stateRef.current.points.push({ t: elapsed, hz: currentFrequency });
    console.log("MOCK_DEBUG: Point pushed", { elapsed, hz: currentFrequency, total: stateRef.current.points.length });
  }, [currentFrequency, isActive, recordingStartTime]);

  // ── Reset on start ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive) {
      stateRef.current.points       = [];
      stateRef.current.viewMidMidi  = 60;
      stateRef.current.targetMidMidi = 60;
    }
  }, [isActive]);

  // ── Drag & Seek Event Handlers ───────────────────────────────────────────
  const scrubToX = (clientX) => {
    const canvas = canvasRef.current;
    if (!canvas || !onScrub) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const chartLeft = LABEL_WIDTH;
    const chartWidth = canvas.offsetWidth - 2 * LABEL_WIDTH;
    
    // Calculate the current viewStartMs matching the draw loop logic
    const playheadThreshold = WINDOW_MS * 0.75;
    let viewStartMs = 0;
    if (playbackTimeMs > playheadThreshold) {
      viewStartMs = playbackTimeMs - playheadThreshold;
    }
    
    // Map X coordinate to absolute time in ms
    let clickedTime = viewStartMs + ((x - chartLeft) / chartWidth) * WINDOW_MS;
    clickedTime = Math.max(0, Math.min(clickedTime, recordingDuration));
    onScrub(clickedTime);
  };

  const handleMouseDown = (e) => {
    if (mode !== "playback" || !onScrub) return;
    isDraggingRef.current = true;
    scrubToX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || mode !== "playback" || !onScrub) return;
    scrubToX(e.clientX);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e) => {
    if (mode !== "playback" || !onScrub || e.touches.length === 0) return;
    isDraggingRef.current = true;
    scrubToX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current || mode !== "playback" || !onScrub || e.touches.length === 0) return;
    scrubToX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // ── Draw loop ────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Use CSS pixel dimensions (already set by ResizeObserver)
    const W = canvas.offsetWidth  || canvas.width;
    const H = canvas.offsetHeight || canvas.height;

    const s   = stateRef.current;

    // Define current playhead time
    const playheadTimeMs = mode === "recording"
      ? (recordingStartTime ? performance.now() - recordingStartTime : 0)
      : (mode === "playback" ? playbackTimeMs : 0);

    // ── Layout ──────────────────────────────────────────────────────────────
    const chartLeft   = LABEL_WIDTH;
    const chartRight  = W - LABEL_WIDTH;
    const chartWidth  = chartRight - chartLeft;
    const chartTop    = 12;
    const chartBottom = H - 18;
    const chartHeight = chartBottom - chartTop;

    // Fixed 2-octave grid mapping
    const margin = chartHeight / 16;
    const yBottom = chartBottom - margin;
    const yTop = chartTop + margin;
    const rowHeight = (yBottom - yTop) / 23;

    function wrappedMidiToY(val) {
      return yBottom + (val / 23) * (yTop - yBottom);
    }

    function midiToY(absoluteMidi) {
      const wrapped = ((absoluteMidi + 7) % 24 + 24) % 24;
      return wrappedMidiToY(wrapped);
    }

    // Fixed window duration of 12 seconds
    const playheadThreshold = WINDOW_MS * 0.75; // view starts scrolling when playhead crosses 75% width
    
    let viewStartMs = 0;
    if (playheadTimeMs > playheadThreshold) {
      viewStartMs = playheadTimeMs - playheadThreshold;
    }
    const viewEndMs = viewStartMs + WINDOW_MS;

    // Map time to X coordinate based on current visible page window
    function timeToX(t) {
      return chartLeft + ((t - viewStartMs) / WINDOW_MS) * chartWidth;
    }

    // ── Clear ───────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    // ── Background ──────────────────────────────────────────────────────────
    ctx.fillStyle = "#EDE6D3";
    ctx.fillRect(0, 0, W, H);

    // ── Grid lines (clipped to chart area) ──────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(chartLeft, chartTop, chartWidth, chartHeight);
    ctx.clip();

    for (const note of NOTE_GRID) {
      const y = wrappedMidiToY(note.midi);

      if (note.isC) {
        ctx.strokeStyle = "rgba(39, 84, 138, 0.32)";
        ctx.lineWidth   = 1.3;
      } else if (note.isNatural) {
        ctx.strokeStyle = "rgba(39, 84, 138, 0.14)";
        ctx.lineWidth   = 0.7;
      } else {
        ctx.fillStyle = "rgba(24, 59, 78, 0.025)";
        ctx.fillRect(chartLeft, y - rowHeight / 2, chartWidth, rowHeight);
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }

    ctx.restore();

    // ── Past-region tint ────────────────────────────────────────────────────
    const playX = timeToX(playheadTimeMs);
    const pastGrad = ctx.createLinearGradient(chartLeft, 0, playX, 0);
    pastGrad.addColorStop(0, "rgba(39, 84, 138, 0.03)");
    pastGrad.addColorStop(1, "rgba(39, 84, 138, 0.09)");
    ctx.fillStyle = pastGrad;
    ctx.fillRect(chartLeft, chartTop, Math.max(0, playX - chartLeft), chartHeight);

    // ── Note labels — LEFT ───────────────────────────────────────────────────
    ctx.save();
    for (const note of NOTE_GRID) {
      if (!note.isNatural) continue; // only label natural notes
      const y = wrappedMidiToY(note.midi);
      if (y < chartTop || y > chartBottom) continue;

      ctx.textAlign    = "right";
      ctx.textBaseline = "middle";
      ctx.font         = note.isC
        ? `bold 11px "SF Mono", "Fira Code", monospace`
        : `10px "SF Mono", "Fira Code", monospace`;
      ctx.fillStyle    = note.isC
        ? "rgba(24, 59, 78, 0.90)"    // Deep Teal for C-notes
        : "rgba(39, 84, 138, 0.55)";  // Classic Blue for naturals
      ctx.fillText(note.label, chartLeft - 5, y);

      // ── RIGHT label ─────────────────────────────────────────────────────
      ctx.textAlign = "left";
      ctx.fillText(note.label, chartRight + 5, y);
    }
    ctx.restore();

    // ── Data: trail line + scatter dots ─────────────────────────────────────
    if ((isActive || mode === "playback") && s.points.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(chartLeft, chartTop, chartWidth, chartHeight);
      ctx.clip();

      // Filter points to only render those inside the current visible 12s window
      const visiblePoints = s.points.filter(pt => pt.t >= viewStartMs - 500 && pt.t <= viewEndMs + 500);

      // Trail polyline
      ctx.beginPath();
      let lineStarted = false;
      for (const pt of visiblePoints) {
        const x = timeToX(pt.t);
        const y = midiToY(hzToMidi(pt.hz));
        if (x < chartLeft || x > chartRight) { lineStarted = false; continue; }
        if (!lineStarted) { ctx.moveTo(x, y); lineStarted = true; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(39, 84, 138, 0.30)";
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = "round";
      ctx.stroke();

      // Dots — Classic Blue palette
      for (const pt of visiblePoints) {
        const x = timeToX(pt.t);
        const y = midiToY(hzToMidi(pt.hz));
        if (x < chartLeft || x > chartRight) continue;

        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(39, 84, 138, 0.75)";
        ctx.fill();
      }

      ctx.restore();
    }

    // ── Playhead ────────────────────────────────────────────────────────────
    if (isActive || mode === "playback") {
      const phGrad = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
      phGrad.addColorStop(0,   "rgba(24,59,78,0)");
      phGrad.addColorStop(0.2, "rgba(24,59,78,0.80)");
      phGrad.addColorStop(0.8, "rgba(24,59,78,0.80)");
      phGrad.addColorStop(1,   "rgba(24,59,78,0)");
      ctx.strokeStyle = phGrad;
      ctx.lineWidth   = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(playX, chartTop);
      ctx.lineTo(playX, chartBottom);
      ctx.stroke();

      // Triangle head — Deep Teal
      ctx.fillStyle = "#183B4E";
      ctx.beginPath();
      ctx.moveTo(playX - 5, chartTop);
      ctx.lineTo(playX + 5, chartTop);
      ctx.lineTo(playX, chartTop + 9);
      ctx.closePath();
      ctx.fill();
    }

    // ── Live/Playback dot at playhead ───────────────────────────────────────
    let displayHz = -1;
    if (isActive && currentFrequency > 0) {
      displayHz = currentFrequency;
    } else if (mode === "playback" && s.points.length > 0) {
      let closestPt = null;
      let minDiff = Infinity;
      for (const pt of s.points) {
        const diff = Math.abs(pt.t - playheadTimeMs);
        if (diff < minDiff) {
          minDiff = diff;
          closestPt = pt;
        }
      }
      if (closestPt && minDiff < 150) {
        displayHz = closestPt.hz;
      }
    }

    if (displayHz > 0) {
      const liveY  = midiToY(hzToMidi(displayHz));
      const pulse  = 0.6 + 0.4 * Math.sin(performance.now() / 200);

      // Outer pulse ring — Warm Gold
      ctx.beginPath();
      ctx.arc(playX, liveY, 13 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(221,168,83,${(0.25 * pulse).toFixed(3)})`;
      ctx.fill();

      // Main dot — Warm Gold
      ctx.beginPath();
      ctx.arc(playX, liveY, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#DDA853";
      ctx.fill();

      // Inner highlight — Deep Teal
      ctx.beginPath();
      ctx.arc(playX, liveY, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#183B4E";
      ctx.fill();
    }

    // ── Idle overlay ────────────────────────────────────────────────────────
    if (!isActive && mode !== "playback") {
      ctx.fillStyle = "rgba(237,230,211,0.55)";
      ctx.fillRect(chartLeft, chartTop, chartWidth, chartHeight);
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font         = '14px "SF Mono","Fira Code",monospace';
      ctx.fillStyle    = "rgba(24,59,78,0.45)";
      ctx.fillText(
        "Press Start Singing to begin",
        chartLeft + chartWidth / 2,
        chartTop + chartHeight / 2,
      );
    }

    // ── X-axis time ticks ───────────────────────────────────────────────────
    // Helper to format ms to m:ss
    function formatMsToMinSec(ms) {
      const totalSecs = Math.floor(ms / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    }

    ctx.font         = '10px "SF Mono","Fira Code",monospace';
    ctx.fillStyle    = "rgba(24,59,78,0.38)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";

    // Draw ticks at absolute multiples of 2 seconds
    const tickIntervalMs = 2000;
    const firstTick = Math.ceil(viewStartMs / tickIntervalMs) * tickIntervalMs;
    for (let t = firstTick; t <= viewEndMs; t += tickIntervalMs) {
      const x = timeToX(t);
      if (x < chartLeft || x > chartRight) continue;

      ctx.fillText(formatMsToMinSec(t), x, chartBottom + 3);
      ctx.strokeStyle = "rgba(39,84,138,0.15)";
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, chartBottom);
      ctx.lineTo(x, chartBottom - 4);
      ctx.stroke();
    }

    if (isActive || mode === "playback") {
      s.animFrame = requestAnimationFrame(draw);
    } else {
      s.timeoutId = setTimeout(() => {
        s.animFrame = requestAnimationFrame(draw);
      }, 1000 / 30);
    }
  }, [isActive, mode, currentFrequency, playbackTimeMs, recordingStartTime, recordingDuration, onScrub]);

  // ── Animation loop lifecycle ─────────────────────────────────────────────
  useEffect(() => {
    stateRef.current.animFrame = requestAnimationFrame(draw);
    return () => {
      if (stateRef.current.animFrame) cancelAnimationFrame(stateRef.current.animFrame);
      if (stateRef.current.timeoutId) clearTimeout(stateRef.current.timeoutId);
    };
  }, [draw]);

  // ── Resize observer: set canvas backing size ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w   = container.clientWidth;
      const h   = container.clientHeight;
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Real-time vocal pitch scatter plot"
      role="img"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        cursor: mode === "playback" ? "ew-resize" : "default"
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}