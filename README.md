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
4. Modular Audio Hook: The audio logic is decoupled from the UI layer. The unified `useVocalPitch` hook encapsulates audio context creation, DSP analysis, permission/status state management, and error handling.

# Updates

### Real-Time Custom Canvas Scatter Plot & Smart Window Panning (June 2026)
- **Custom HTML5 Canvas Render Engine:** Replaced the unstable line curve chart with a more clearer Canvas 2D scatter plot visualization.
- **Fixed Note Row Spacing:** Eliminated dynamic stretching/squeezing of the Y-axis that caused the chart to bounce uncontrollably . The grid now features a rigid vertical scale of 22 pixels per semitone, keeping note intervals more consistent.
- **Mid-Screen Timeline Scrolling:** Implemented a horizontal scrolling mechanism where the active playhead is locked at the horizontal center (50% mark). Past frequencies drift to the left, while blank space to the right reveals upcoming time.
- **Dual-Sided Musical Note Axis:** Added natural musical letter names (C1–C8) on both the left and right sides of the canvas grid lines for easy readability at any point.
- **Auto-Panning with Lock Switch:** Added a vertical auto-panning behavior that glides the view window smoothly to follow the vocalist's pitch. Includes a "Vertical Pan Lock" switch to toggle between a slower, dampened damping rate (prevents sudden octave jumps from throwing the view out of bounds) and an instant follow rate.

### Editorial Palette Redesign & Interactive Card Enhancements (June 2026)
- **Warm Editorial Color Scheme:** Transitioned the application framework from a dark slate design to a structured warm light aesthetic utilizing a strict 60-30-10 color distribution: Warm Cream (`#F5EEDC`) backgrounds, Classic Blue (`#27548A`) structural navigation frames, Deep Teal (`#183B4E`) typography, and Warm Gold (`#DDA853`) Call-to-Action anchors.
- **Rethemed Pitch Canvas Engine:** Re-rendered the pitch timeline chart elements to blend seamlessly with the warm theme, using Classic Blue grid overlays and an active Warm Gold frequency indicator.
- **Interactive Anatomy Reference Cards:** Rethemed all cards on the Anatomy page to a default cream background. Integrated interactive transitions where hovering over a card shifts its background to Classic Blue and dynamically swaps inner text and graphics to cream to maintain clear WCAG AA accessibility contrast.
- **CSS Import fixes:** Resolved custom font loading warnings by standardizing CSS rule placement.

### Technical Performance & Hook Consolidation (June 2026)
- **Consolidated Audio Hook:** Unified the microphone state management, error handling, and fundamental pitch extraction logic into a single, high-fidelity `useVocalPitch` hook. Removed redundant tracking hooks to streamline the audio architecture.
- **Enhanced Status Dot & Error UI:** Upgraded the status indicator dot to report multiple real-time microphone phases: active (green pulsing), pending request (amber pulsing), blocked/error (red), and idle (slate). Permission failures and device availability issues are now displayed directly in the controls panel.
- **Idle Frame Rate Throttling:** Optimized the custom canvas drawing engine in `PitchChart` to cap refresh rates at `~30fps` when idle (stopped), reducing CPU usage and extending battery life for laptop and mobile users. Once started, the rendering smoothly ramps back up to full `60fps+`.