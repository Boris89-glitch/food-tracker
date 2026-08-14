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
  const [range, setRange] = useState(30); // days visible in the chart window
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const scrollRef = useRef(null);
  const pan = useRef(null);

  const today = startOfToday();
  const todayKey = dateKey(today);

  // The chart always holds the FULL history (first logged day → today); `range`
  // only sets how many days fit the visible window. You grab-drag it left/right
  // to pan into the past. `totalDays` drives the inner width vs that window.
  const firstKey = Object.keys(logs)
    .filter((k) => entriesFor(logs, k).length)
    .sort()[0];
  const totalDays = firstKey
    ? Math.round((today - dayFromKey(firstKey)) / 86400000) + 1
    : range;

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const days = [];
    const start = new Date(today);
    start.setDate(start.getDate() - (totalDays - 1));
    for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
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
    // Open pinned to the most recent day (far right); pan left for the past.
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, goal, range, visible, totalDays]);

  const historyKeys = Object.keys(logs)
    .filter((k) => entriesFor(logs, k).length)
    .sort()
    .reverse();

  // Grab-drag the chart horizontally to pan through history (mouse + touch).
  const onPanStart = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    pan.current = { x: e.clientX, left: el.scrollLeft };
    el.setPointerCapture?.(e.pointerId);
  };
  const onPanMove = (e) => {
    const el = scrollRef.current;
    if (!pan.current || !el) return;
    el.scrollLeft = pan.current.left - (e.clientX - pan.current.x);
  };
  const onPanEnd = () => {
    pan.current = null;
  };

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
        <div
          ref={scrollRef}
          onPointerDown={onPanStart}
          onPointerMove={onPanMove}
          onPointerUp={onPanEnd}
          onPointerCancel={onPanEnd}
          className="no-scrollbar relative h-[230px] cursor-grab overflow-x-auto touch-pan-y active:cursor-grabbing sm:h-[320px]"
        >
          <div className="h-full" style={{ width: Math.max(100, (totalDays / range) * 100) + "%" }}>
            <canvas ref={canvasRef} />
          </div>
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
