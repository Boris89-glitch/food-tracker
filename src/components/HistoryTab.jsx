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
import { useI18n } from "../lib/i18n.js";

export default function HistoryTab({ data, visible }) {
  const { t } = useI18n();
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

  const card =
    "rounded-2xl border border-line bg-white p-4 shadow-card sm:rounded-[18px] sm:p-6";
  const sectit =
    "mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.6px] text-muted sm:mb-4 sm:text-[15px]";

  return (
    <section className="animate-fade grid grid-cols-1 gap-3.5 sm:gap-[22px] min-[980px]:grid-cols-2">
      <div className={card}>
        <p className={sectit}>{t("dailyVsGoal")}</p>
        <div className="mb-4 flex gap-2">
          {[7, 14, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                "flex-1 cursor-pointer rounded-[11px] border p-2 text-sm font-bold sm:p-[11px] sm:text-[15px] " +
                (range === r
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line bg-white text-muted")
              }
            >
              {t("daysRange", { r })}
            </button>
          ))}
        </div>
        <div className="relative h-[230px] sm:h-[320px]">
          <canvas ref={canvasRef} />
        </div>
      </div>
      <div className={card}>
        <p className={sectit}>{t("dayByDay")}</p>
        {historyKeys.length ? (
          historyKeys.map((k) => {
            const tot = dayTotal(logs, k);
            const over = tot > goal;
            return (
              <div
                key={k}
                className="flex justify-between border-b border-line2 px-1 py-2.5 text-sm last:border-b-0 sm:py-3.5 sm:text-base"
              >
                <span className="font-bold">
                  {fmtShort(dayFromKey(k))}
                  {k === todayKey && (
                    <span className="font-normal text-muted"> · {t("todaySuffix")}</span>
                  )}
                </span>
                <span className="text-muted">
                  <b style={{ color: over ? "var(--color-danger)" : "var(--color-ink)" }}>
                    {tot.toLocaleString()}
                  </b>{" "}
                  / {goal.toLocaleString()} kcal
                </span>
              </div>
            );
          })
        ) : (
          <div className="mt-2.5 text-center text-sm text-muted">{t("noHistory")}</div>
        )}
      </div>
    </section>
  );
}
