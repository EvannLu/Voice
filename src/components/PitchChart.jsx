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

/** Build note grid: every semitone from C1 to C8 */
function buildNoteGrid() {
  const notes = [];
  for (let midi = 24; midi <= 108; midi++) {
    const semitone = ((midi % 12) + 12) % 12;
    const octave   = Math.floor(midi / 12) - 1;
    notes.push({
      midi,
      hz:        midiToHz(midi),
      name:      CHROMATIC[semitone],
      octave,
      label:     CHROMATIC[semitone] + octave,
      isC:       semitone === 0,
      isNatural: !CHROMATIC[semitone].includes("#"),
    });
  }
  return notes;
}

const NOTE_GRID = buildNoteGrid();

// ─── Drawing Constants ────────────────────────────────────────────────────────

const LABEL_WIDTH      = 54;   // px — note label column on each side
const WINDOW_SECONDS   = 8;    // total visible time span (seconds)
const HISTORY_SECONDS  = 40;   // how long we keep accumulated points
const PX_PER_SEMITONE  = 22;   // ← FIXED gap between each semitone row (px)
const PAN_SPEED        = 0.06; // smoothing factor when pan lock is OFF (fast)
const PAN_LOCK_SPEED   = 0.022;// slower smoothing when pan lock is ON

// ─── PitchChart Component ─────────────────────────────────────────────────────

/**
 * @param {{ currentFrequency: number, isActive: boolean, autoPanLock: boolean }} props
 */
export default function PitchChart({ currentFrequency = 0, isActive = false, autoPanLock = true }) {
  const canvasRef = useRef(null);
  const stateRef  = useRef({
    points:       [],   // { t: ms, hz: number }[]
    // viewMidMidi = the MIDI note centred vertically on screen (smoothed)
    viewMidMidi:  60,   // start around C4
    targetMidMidi: 60,
    animFrame:    null,
  });

  // ── Accumulate points ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive || currentFrequency <= 0) return;
    stateRef.current.points.push({ t: performance.now(), hz: currentFrequency });
    const cutoff = performance.now() - HISTORY_SECONDS * 1000;
    stateRef.current.points = stateRef.current.points.filter((p) => p.t >= cutoff);
  }, [currentFrequency, isActive]);

  // ── Reset on stop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      stateRef.current.points       = [];
      stateRef.current.viewMidMidi  = 60;
      stateRef.current.targetMidMidi = 60;
    }
  }, [isActive]);

  // ── Draw loop ────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Use CSS pixel dimensions (already set by ResizeObserver)
    const W = canvas.offsetWidth  || canvas.width;
    const H = canvas.offsetHeight || canvas.height;

    const s   = stateRef.current;
    const now = performance.now();

    // ── Determine target vertical centre ────────────────────────────────────
    const recentMs = 4000;
    const recentHz = s.points
      .filter((p) => now - p.t < recentMs)
      .map((p) => p.hz);

    if (recentHz.length > 0) {
      const recentMidi = recentHz.map(hzToMidi);
      s.targetMidMidi  = recentMidi.reduce((a, b) => a + b, 0) / recentMidi.length;
    }

    // ── Smooth pan ──────────────────────────────────────────────────────────
    const speed = autoPanLock ? PAN_LOCK_SPEED : PAN_SPEED;
    s.viewMidMidi += (s.targetMidMidi - s.viewMidMidi) * speed;

    // ── Layout ──────────────────────────────────────────────────────────────
    const chartLeft   = LABEL_WIDTH;
    const chartRight  = W - LABEL_WIDTH;
    const chartWidth  = chartRight - chartLeft;
    const chartTop    = 12;
    const chartBottom = H - 18;
    const chartHeight = chartBottom - chartTop;

    // FIXED layout: midiToY uses PX_PER_SEMITONE, centred on viewMidMidi
    // Higher MIDI = higher on screen (lower y)
    const midY = chartTop + chartHeight / 2;
    function midiToY(midi) {
      return midY - (midi - s.viewMidMidi) * PX_PER_SEMITONE;
    }

    // Visible MIDI range given current chart height
    const visibleSemitones = chartHeight / PX_PER_SEMITONE;
    const midiLow  = s.viewMidMidi - visibleSemitones / 2;
    const midiHigh = s.viewMidMidi + visibleSemitones / 2;

    // Time axis: current time is centred at 50% of chart width
    const halfWindowMs = (WINDOW_SECONDS / 2) * 1000;
    function timeToX(t) {
      return chartLeft + ((t - (now - halfWindowMs)) / (WINDOW_SECONDS * 1000)) * chartWidth;
    }

    // ── Clear ───────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);

    // ── Background ──────────────────────────────────────────────────────────
    // Warm cream canvas base
    ctx.fillStyle = "#EDE6D3";
    ctx.fillRect(0, 0, W, H);

    // ── Grid lines (clipped to chart area) ──────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.rect(chartLeft, chartTop, chartWidth, chartHeight);
    ctx.clip();

    for (const note of NOTE_GRID) {
      if (note.midi < midiLow - 1 || note.midi > midiHigh + 1) continue;
      const y = midiToY(note.midi);

      if (note.isC) {
        // Classic Blue C-note lines
        ctx.strokeStyle = "rgba(39, 84, 138, 0.32)";
        ctx.lineWidth   = 1.3;
      } else if (note.isNatural) {
        // Lighter blue natural-note lines
        ctx.strokeStyle = "rgba(39, 84, 138, 0.14)";
        ctx.lineWidth   = 0.7;
      } else {
        // Sharps — very subtle cream-tinted band
        ctx.fillStyle = "rgba(24, 59, 78, 0.025)";
        ctx.fillRect(chartLeft, y - PX_PER_SEMITONE / 2, chartWidth, PX_PER_SEMITONE);
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }

    ctx.restore();

    // ── Past-region tint ────────────────────────────────────────────────────
    const playX = timeToX(now);
    const pastGrad = ctx.createLinearGradient(chartLeft, 0, playX, 0);
    pastGrad.addColorStop(0, "rgba(39, 84, 138, 0.03)");
    pastGrad.addColorStop(1, "rgba(39, 84, 138, 0.09)");
    ctx.fillStyle = pastGrad;
    ctx.fillRect(chartLeft, chartTop, Math.max(0, playX - chartLeft), chartHeight);

    // ── Note labels — LEFT ───────────────────────────────────────────────────
    ctx.save();
    for (const note of NOTE_GRID) {
      if (note.midi < midiLow - 0.5 || note.midi > midiHigh + 0.5) continue;
      if (!note.isNatural) continue; // only label natural notes
      const y = midiToY(note.midi);
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
    if (isActive && s.points.length > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(chartLeft, chartTop, chartWidth, chartHeight);
      ctx.clip();

      // Trail polyline
      ctx.beginPath();
      let lineStarted = false;
      for (const pt of s.points) {
        const x = timeToX(pt.t);
        const y = midiToY(hzToMidi(pt.hz));
        if (x < chartLeft || x > chartRight) { lineStarted = false; continue; }
        if (!lineStarted) { ctx.moveTo(x, y); lineStarted = true; }
        else ctx.lineTo(x, y);
      }
      // Classic Blue trail
      ctx.strokeStyle = "rgba(39, 84, 138, 0.30)";
      ctx.lineWidth   = 1.5;
      ctx.lineJoin    = "round";
      ctx.stroke();

      // Dots — Classic Blue palette
      for (const pt of s.points) {
        const x     = timeToX(pt.t);
        const y     = midiToY(hzToMidi(pt.hz));
        if (x < chartLeft || x > chartRight) continue;
        const age   = (now - pt.t) / 1000;
        const alpha = Math.max(0.10, 1 - age / WINDOW_SECONDS);
        const r     = age < 0.3 ? 5 : age < 1 ? 4 : 3;

        if (age < 0.5) {
          ctx.beginPath();
          ctx.arc(x, y, r + 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(39,84,138,${(alpha * 0.15).toFixed(3)})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(39,84,138,${alpha.toFixed(3)})`;
        ctx.fill();
      }

      ctx.restore();
    }

    // ── Playhead ────────────────────────────────────────────────────────────
    if (isActive) {
      // Deep Teal playhead line
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

    // ── Live dot at playhead ────────────────────────────────────────────────
    if (isActive && currentFrequency > 0) {
      const liveY  = midiToY(hzToMidi(currentFrequency));
      const pulse  = 0.6 + 0.4 * Math.sin(now / 200);

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
    if (!isActive) {
      // Warm Cream tint overlay
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
    ctx.font         = '10px "SF Mono","Fira Code",monospace';
    ctx.fillStyle    = "rgba(24,59,78,0.38)";
    ctx.textAlign    = "center";
    ctx.textBaseline = "top";
    const windowStart = now - halfWindowMs;
    const firstTick   = Math.ceil(windowStart / 1000) * 1000;
    for (let t = firstTick; t <= now + halfWindowMs; t += 1000) {
      const x = timeToX(t);
      if (x < chartLeft + 4 || x > chartRight - 4) continue;
      const label = `${((t - now) / 1000).toFixed(0)}s`;
      ctx.fillText(label, x, chartBottom + 3);
      ctx.strokeStyle = "rgba(39,84,138,0.15)";
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, chartBottom);
      ctx.lineTo(x, chartBottom - 4);
      ctx.stroke();
    }

    // ── Pan lock badge ──────────────────────────────────────────────────────
    ctx.textAlign    = "right";
    ctx.textBaseline = "top";
    ctx.font         = '10px "SF Mono","Fira Code",monospace';
    ctx.fillStyle    = autoPanLock
      ? "rgba(221,168,83,0.90)"   // Warm Gold when active
      : "rgba(24,59,78,0.30)";   // faded Deep Teal when off
    ctx.fillText(
      autoPanLock ? "⬡ Pan Lock ON" : "⬡ Pan Lock OFF",
      chartRight - 6,
      chartTop + 6,
    );

    if (isActive) {
      s.animFrame = requestAnimationFrame(draw);
    } else {
      s.timeoutId = setTimeout(() => {
        s.animFrame = requestAnimationFrame(draw);
      }, 1000 / 30);
    }
  }, [isActive, currentFrequency, autoPanLock]);

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
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}