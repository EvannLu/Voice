import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_STATUS = "idle";
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

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

function getPermissionMessage(error) {
  if (!error) {
    return "";
  }

  if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
    return "Microphone access was denied. Use Start Singing again after allowing the browser prompt.";
  }

  if (error.name === "NotFoundError") {
    return "No microphone was found on this device.";
  }

  return "Microphone access is unavailable in this browser.";
}

export default function useMicrophonePitch() {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [currentNote, setCurrentNote] = useState("--");

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setStatus(DEFAULT_STATUS);
    setCurrentFrequency(0);
    setCurrentNote("--");
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("This browser does not support microphone access.");
      setStatus("blocked");
      return;
    }

    setErrorMessage("");
    setStatus("pending");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new window.AudioContext();
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      mediaStreamSource.connect(analyser);

      mediaStreamRef.current = stream;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setStatus("active");

      const samples = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (!analyserRef.current) {
          return;
        }

        analyserRef.current.getFloatTimeDomainData(samples);

        let sumSquares = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const sample = samples[index];
          sumSquares += sample * sample;
        }

        const rms = Math.sqrt(sumSquares / samples.length);
        const frequency = rms > 0.01 ? 220 + rms * 1400 : 0;
        const roundedFrequency = Number(frequency.toFixed(2));

        setCurrentFrequency(roundedFrequency);
        setCurrentNote(frequencyToNoteName(roundedFrequency));

        animationFrameRef.current = window.requestAnimationFrame(tick);
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    } catch (error) {
      const message = getPermissionMessage(error);
      stop();
      setErrorMessage(message);
      setStatus("blocked");
    }
  }, [stop]);

  return {
    status,
    isIdle: status === DEFAULT_STATUS,
    isPending: status === "pending",
    isActive: status === "active",
    isBlocked: status === "blocked",
    errorMessage,
    currentFrequency,
    currentNote,
    start,
    stop,
  };
}