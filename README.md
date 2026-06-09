# Brief Description
A lightweight, real-time React web application designed to help vocalists visualize their pitch accuracy. Using the browser's native Web Audio API and a highly optimized time-domain autocorrelation algorithm, this tool listens to microphone input, detects the fundamental frequency of the human voice, and maps it to the corresponding musical note in real time.

# Tech Stack
- Frontend Framework: React (Functional Components, Hooks)initialized with Vite.
- Styling: Tailwind CSS (utility-first, responsive, native dark mode).
- Visualization: Chart.js via react-chartjs-2.
- Audio Engine: Web Audio API

# Features
1. Real-Time DSP (Digital Signal Processing): Utilizes an optimized autocorrelation algorithm to filter out harmonic overtones and accurately track the fundamental frequency of the voice.
2. Auto-Expanding Visualization: Features a dynamic line chart that automatically adjusts its Y-axis bounding box to accommodate the singer's current vocal range without dizzying vertical scrolling.
3. Accessible UI: Designed with inclusive practices, including robust keyboard focus states, semantic HTML, ARIA labels for screen readers, and a high-contrast color palette.
4. Modular Audio Hooks: The audio logic is decoupled from the UI layer. It includes a useMockPitch hook for UI development without requiring microphone permissions, and a useVocalPitch hook for live production tracking.

