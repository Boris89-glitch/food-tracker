import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { dateKey, dayFromKey, fmtShort, startOfToday } from "../lib/model.js";
import { useI18n } from "../lib/i18n.js";

export default function WeightTab({ data, update, visible }) {
  const { t } = useI18n();
  const { weight, unit } = data;
  const [val, setVal] = useState("");
  const [flash, setFlash] = useState(false);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const keys = Object.keys(weight).sort();
  const latest = keys.length ? weight[keys[keys.length - 1]] : null;

  let change = null;
  if (keys.length) {
    const cutoff = startOfToday();
    cutoff.setDate(cutoff.getDate() - 30);
    const past = keys.filter((k) => dayFromKey(k) >= cutoff);
    if (past.length >= 2) change = weight[past[past.length - 1]] - weight[past[0]];
  }

  const saveWeight = () => {
    const v = parseFloat(val);
    if (!(v > 0)) {
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
      return;
    }
    update((d) => ({ ...d, weight: { ...d.weight, [dateKey(startOfToday())]: v } }));
    setVal("");
  };

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const labels = keys.map((k) => fmtShort(dayFromKey(k)));
    const points = keys.map((k) => weight[k]);
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            data: points,
            borderColor: "#16a34a",
            backgroundColor: "rgba(22,163,74,.12)",
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointBackgroundColor: "#16a34a",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { color: "#6c747e" }, grid: { color: "#eef1f4" } },
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
  }, [weight, unit, visible]);

  const card =
    "rounded-2xl border border-line bg-white p-4 shadow-card sm:rounded-[18px] sm:p-6";
  const sectit =
    "mb-3 mt-0 text-[13px] font-extrabold uppercase tracking-[0.6px] text-muted sm:mb-4 sm:text-[15px]";

  return (
    <section className="animate-fade grid grid-cols-1 gap-3.5 sm:gap-[22px] min-[980px]:grid-cols-2">
      <div className={card}>
        <p className={sectit}>{t("logWeight")}</p>
        <div className="mb-4 flex gap-3 sm:mb-5 sm:gap-6">
          <div className="flex-1">
            <div className="text-xl font-extrabold sm:text-3xl">
              {latest != null ? `${latest} ${unit}` : "—"}
            </div>
            <div className="text-xs text-muted sm:text-sm">{t("latest")}</div>
          </div>
          <div className="flex-1">
            <div
              className="text-xl font-extrabold sm:text-3xl"
              style={
                change != null
                  ? { color: change > 0 ? "var(--color-danger)" : "var(--color-accent)" }
                  : undefined
              }
            >
              {change != null ? `${change > 0 ? "+" : ""}${change.toFixed(1)} ${unit}` : "—"}
            </div>
            <div className="text-xs text-muted sm:text-sm">{t("change30d")}</div>
          </div>
          <div className="flex-1">
            <div className="text-xl font-extrabold sm:text-3xl">{keys.length}</div>
            <div className="text-xs text-muted sm:text-sm">{t("entries")}</div>
          </div>
        </div>
        <label className="mb-[7px] block text-sm font-bold text-muted">{t("weightForToday")}</label>
        <input
          type="number"
          inputMode="decimal"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") saveWeight();
          }}
          placeholder={latest != null ? t("lastVal", { v: latest }) : t("weightIn", { unit })}
          className={
            "w-full rounded-[13px] border bg-white px-4 py-3.5 text-base text-ink focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] focus:outline-none " +
            (flash ? "border-danger" : "border-line")
          }
        />
        <button
          onClick={saveWeight}
          className="mt-3.5 w-full cursor-pointer rounded-[13px] border-none bg-accent p-[15px] text-[17px] font-bold text-white"
        >
          {t("saveWeight")}
        </button>
      </div>
      <div className={card}>
        <p className={sectit}>{t("weightTrend")}</p>
        <div className="relative h-[230px] sm:h-[320px]">
          <canvas ref={canvasRef} />
        </div>
        {!keys.length && (
          <div className="mt-2.5 text-center text-sm text-muted">
            {t("weightEmpty")}
          </div>
        )}
      </div>
    </section>
  );
}
