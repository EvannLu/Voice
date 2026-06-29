import { useEffect, useState } from "react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function frequencyToNoteName(frequency) {
  if (!frequency || frequency <= 0) {
    return "--";
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
  const [currentNote, setCurrentNote] = useState("--");
  const [recordingStartTime, setRecordingStartTime] = useState(null);

  useEffect(() => {
    if (!isRunning || !recordingStartTime) {
      return undefined;
    }

    let animId;
    const tick = () => {
      const elapsedSec = (performance.now() - recordingStartTime) / 1000;
      const period = 6; // 6 seconds for a faster full up-and-down sweep cycle
      const progress = (elapsedSec % period) / period;
      
      // Triangle wave to sweep smoothly between 0 and 1
      const wave = 1.0 - Math.abs(2.0 * progress - 1.0);
      
      // Map wave progress to MIDI note numbers 41 (F2) through 89 (F6) to provide a long range of notes
      const midi = 41 + wave * (89 - 41);
      
      // Add a natural vocal vibrato (6Hz frequency, 0.25 semitone amplitude)
      const vibrato = Math.sin(elapsedSec * 2 * Math.PI * 6) * 0.25;
      
      const finalMidi = clamp(midi + vibrato, 41, 89);
      const frequency = 440 * Math.pow(2, (finalMidi - 69) / 12);

      setCurrentFrequency(Number(frequency.toFixed(2)));
      setCurrentNote(frequencyToNoteName(frequency));

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      if (animId) {
        cancelAnimationFrame(animId);
      }
    };
  }, [isRunning, recordingStartTime]);

  const start = () => {
    setRecordingStartTime(performance.now());
    setIsRunning(true);
  };

  const stop = () => {
    setIsRunning(false);
    setRecordingStartTime(null);
  };

  return {
    isRunning,
    start,
    stop,
    currentFrequency,
    currentNote,
    recordingStartTime,
  };
}