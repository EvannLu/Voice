import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

const WINDOW_SECONDS = 8;

export default function PitchChart({ currentFrequency = 0, isActive = false }) {
  const chartData = currentFrequency > 0 && isActive
    ? {
        datasets: [
          {
            label: "Pitch",
            data: [{ x: 0, y: currentFrequency }],
            borderColor: "#a855f7",
            backgroundColor: "rgba(168, 85, 247, 0.16)",
            pointRadius: 3,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: true,
            borderWidth: 5,
          },
        ],
      }
    : {
        datasets: [
          {
            label: "Pitch",
            data: [],
            borderColor: "#a855f7",
            backgroundColor: "rgba(168, 85, 247, 0.16)",
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: true,
            borderWidth: 5,
          },
        ],
      };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: {
      intersect: false,
      mode: "nearest",
    },
    plugins: {
      legend: false,
      tooltip: false,
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: WINDOW_SECONDS,
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#94a3b8",
          maxTicksLimit: 6,
          callback(value) {
            return `${value}s`;
          },
        },
        title: {
          display: true,
          text: "Time (seconds)",
          color: "#cbd5e1",
        },
      },
      y: {
        min: isActive && currentFrequency > 0 ? Math.max(0, currentFrequency - 50) : 130,
        max: isActive && currentFrequency > 0 ? currentFrequency + 100 : 523,
        grid: {
          color: "rgba(148, 163, 184, 0.12)",
          drawBorder: false,
        },
        ticks: {
          color: "#cbd5e1",
          callback(value) {
            return `${value} Hz`;
          },
        },
        title: {
          display: true,
          text: "Frequency (Hz)",
          color: "#cbd5e1",
        },
      },
    },
  };

  return (
    <div className="flex h-full min-h-[440px] flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4 text-slate-100 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Pitch stream</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {isActive ? "Live frequency line chart" : "Idle pitch chart"}
          </h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
          Window: {WINDOW_SECONDS}s
        </div>
      </div>

      <div className="relative min-h-[380px] flex-1 rounded-2xl border border-white/10 bg-slate-900/70 p-3 shadow-inner shadow-slate-950/30">
        <Line
          data={chartData}
          options={chartOptions}
          aria-label="Real-time pitch frequency line chart"
          role="img"
        />
        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-between text-xs text-slate-500">
          <span>{isActive ? "Mic active" : "Idle until microphone input exists"}</span>
          <span>{isActive ? "Live shell" : "Static chart shell"}</span>
        </div>
      </div>
    </div>
  );
}