import { useEffect, useRef, useState } from "react";

const FRAME_MS = 16;
const MIN_FREQUENCY = 200;
const MAX_FREQUENCY = 600;

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function frequencyToNoteName(frequency) {
  if (!frequency || frequency <= 0) {
    return "—";
  }

  const semitonesFromA4 = 12 * Math.log2(frequency / 440);
  const midiNumber = Math.round(69 + semitonesFromA4);
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = ((midiNumber % 12) + 12) % 12;

  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

export default function useMockPitch() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [currentNote, setCurrentNote] = useState("—");
  const phaseRef = useRef(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return undefined;
    }

    const startedAt = performance.now();

    intervalRef.current = setInterval(() => {
      phaseRef.current += 0.08;

      const slowWave = Math.sin(phaseRef.current) * 145;
      const fineVibration = Math.sin(phaseRef.current * 4.2 + startedAt / 1000) * 18;
      const drift = Math.sin(phaseRef.current * 0.33 + startedAt / 1500) * 25;
      const frequency = clamp(400 + slowWave + fineVibration + drift, MIN_FREQUENCY, MAX_FREQUENCY);

      setCurrentFrequency(Number(frequency.toFixed(2)));
      setCurrentNote(frequencyToNoteName(frequency));
    }, FRAME_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
    [],
  );

  const start = () => {
    setIsRunning(true);
  };

  const stop = () => {
    setIsRunning(false);
  };

  return {
    isRunning,
    start,
    stop,
    currentFrequency,
    currentNote,
  };
}