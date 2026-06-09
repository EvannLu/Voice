import { useCallback, useEffect, useRef, useState } from "react";

/*
This implementation is based on the auto-correlation algorithm described by Chris Wilson:
    - auto-correlation: this function computes the auto-correlation of the audio buffer to estimate the fundamental frequency.
    - frequencyToNote: this function converts a frequency in Hz to a musical note name.

The useVocalPitch hook manages the state and lifecycle of the audio processing, allowing components to easily access the current pitch and control the recording.
*/
function autoCorrelate(buffer, sampleRate) { 
    let sumOfSquares = 0;
    for (let i = 0; i < buffer.length; i++) {
        sumOfSquares += buffer[i] * buffer[i];
    }
    const rootMeanSquare = Math.sqrt(sumOfSquares / buffer.length);
    if (rootMeanSquare < 0.01) return -1;
    let r1 = 0, r2 = buffer.length - 1, thres = 0.2;
    for (let i = 0; i < buffer.length / 2; i++) {
        if (Math.abs(buffer[i]) < thres) {
            r1 = i;
            break;
        }

    }
    for (let i = 1; i < buffer.length / 2; i++) {
        if (Math.abs(buffer[buffer.length - i]) < thres) {
            r2 = buffer.length - i;
            break;
        }
    }
    buffer = buffer.slice(r1, r2);
    let c = new Array(buffer.length).fill(0);
    for (let i = 0; i < buffer.length; i++) {
        for (let j = 0; j < buffer.length - i; j++) {
            c[i] = c[i] + buffer[j] * buffer[j + i];
        }
    }
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buffer.length; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
}

function frequencyToNote(frequency) {
    if (frequency === -1) return "--";
    const noteNum = Math.round(12 * (Math.log2(frequency / 440)) + 69);
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const octave = Math.floor(noteNum / 12) - 1;
    const noteName = notes[noteNum % 12];
    return noteName + octave;
}           

export default function useVocalPitch() {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const bufferRef = useRef(null);

  const [currentFrequency, setCurrentFrequency] = useState(-1);
  const [currentNote, setCurrentNote] = useState("--");
  const [isRecording, setIsRecording] = useState(false);

  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    bufferRef.current = null;
    setCurrentFrequency(-1);
    setCurrentNote("--");
    setIsRecording(false);
  }, []);

  useEffect(() => () => {
    stopRecording();
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      console.error("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new window.AudioContext();

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;
      bufferRef.current = new Float32Array(analyser.fftSize);
      setIsRecording(true);

      const tick = () => {
        if (!analyserRef.current || !audioContextRef.current || !bufferRef.current) {
          return;
        }

        analyserRef.current.getFloatTimeDomainData(bufferRef.current);

        const frequency = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);

        setCurrentFrequency(frequency);
        setCurrentNote(frequencyToNote(frequency));

        animationFrameRef.current = window.requestAnimationFrame(tick);
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    } catch (error) {
      console.error("Unable to start microphone pitch tracking.", error);
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  return {
    currentFrequency,
    currentNote,
    isRecording,
    startRecording,
    stopRecording,
  };
}