import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import {
  dateKey,
  dayFromKey,
  dayTotal,
  entriesFor,
  fmtShort,
  startOfToday,
} from "../lib/model.js";

export default function HistoryTab({ data, visible }) {
  const { logs, goal } = data;
  const [range, setRange] = useState(7);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const today = startOfToday();
  const todayKey = dateKey(today);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const labels = days.map((d) => fmtShort(d));
    const points = days.map((d) => dayTotal(logs, dateKey(d)));
    const colors = points.map((v) => (v > goal ? "#f0a3a3" : "#7fd0a0"));
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      data: {
        labels,
        datasets: [
          {
            type: "bar",
            data: points,
            backgroundColor: colors,
            borderRadius: 5,
            maxBarThickness: 40,
            order: 2,
          },
          {
            type: "line",
            label: "Goal",
            data: days.map(() => goal),
            borderColor: "#16a34a",
            borderDash: [5, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { color: "#6c747e" }, grid: { color: "#eef1f4" } },
          x: {
            ticks: { color: "#6c747e", maxRotation: 0, autoSkip: true },
            grid: { display: false },
          },
        },
      },
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, goal, range, visible]);

  const historyKeys = Object.keys(logs)
    .filter((k) => entriesFor(logs, k).length)
    .sort()
    .reverse();

  const card = "mb-[22px] rounded-[18px] border border-line bg-white p-6 shadow-card";
  const sectit =
    "mb-4 mt-0 text-[15px] font-extrabold uppercase tracking-[0.6px] text-muted";

  return (
    <section className="animate-fade grid grid-cols-1 gap-[22px] min-[980px]:grid-cols-2">
      <div className={card}>
        <p className={sectit}>Daily calories vs goal</p>
        <div className="mb-4 flex gap-2">
          {[7, 14, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                "flex-1 cursor-pointer rounded-[11px] border p-[11px] text-[15px] font-bold " +
                (range === r
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line bg-white text-muted")
              }
            >
              {r} days
            </button>
          ))}
        </div>
        <div className="relative h-[320px]">
          <canvas ref={canvasRef} />
        </div>
      </div>
      <div className={card}>
        <p className={sectit}>Day by day</p>
        {historyKeys.length ? (
          historyKeys.map((k) => {
            const t = dayTotal(logs, k);
            const over = t > goal;
            return (
              <div
                key={k}
                className="flex justify-between border-b border-line2 px-1 py-3.5 text-base last:border-b-0"
              >
                <span className="font-bold">
                  {fmtShort(dayFromKey(k))}
                  {k === todayKey && <span className="font-normal text-muted"> · today</span>}
                </span>
                <span className="text-muted">
                  <b style={{ color: over ? "var(--color-danger)" : "var(--color-ink)" }}>
                    {t.toLocaleString()}
                  </b>{" "}
                  / {goal.toLocaleString()} kcal
                </span>
              </div>
            );
          })
        ) : (
          <div className="mt-2.5 text-center text-sm text-muted">No history yet.</div>
        )}
      </div>
    </section>
  );
}
