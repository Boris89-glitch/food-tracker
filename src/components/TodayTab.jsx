import { useEffect, useRef, useState } from "react";
import {
  MEALS,
  amtLabel,
  calcCal,
  dateKey,
  dayFromKey,
  dayTotal,
  entriesFor,
  fmtLong,
  mealLabel,
  mealTotal,
  rateLabel,
  startOfToday,
  uid,
} from "../lib/model.js";
import { useI18n } from "../lib/i18n.js";

// True once the current drag lands on a valid target (meal bucket or the
// Favorites bucket). dragend checks it: still false means the card was
// dragged away → remove the entry / unfavorite.
// Module-level is safe: only one drag can be in flight at a time.
let dragValidDrop = false;

// ── Modals ──────────────────────────────────────────────────────────────────

function Overlay({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,24,28,0.4)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[min(92vw,340px)] rounded-[20px] bg-white p-[22px] shadow-[0_16px_50px_rgba(0,0,0,0.25)]">
        {children}
      </div>
    </div>
  );
}

function MealPicker({ food, onPick, onClose }) {
  const { t } = useI18n();
  return (
    <Overlay onClose={onClose}>
      <div className="mb-[15px] text-center text-[17px] font-extrabold">
        {t("addTo", { name: food.name })}
      </div>
      {MEALS.map((m) => (
        <button
          key={m.key}
          onClick={() => onPick(m.key)}
          className="mb-[9px] flex w-full cursor-pointer items-center gap-[13px] rounded-[13px] border border-line bg-white p-[15px] text-[17px] font-bold hover:border-accent hover:bg-accent-soft"
        >
          <span className="text-[22px]">{m.ic}</span>
          {mealLabel(m)}
        </button>
      ))}
    </Overlay>
  );
}

// Amount modal: choose grams/ml or item count when logging or editing.
function AmountModal({ ctx, onCommit, onClose }) {
  const { t } = useI18n();
  const isItem = (ctx.kind === "log" ? ctx.food.mode : ctx.entry.mode) === "item";
  const unitLabel = isItem ? "×" : ctx.kind === "log" ? ctx.food.unit : ctx.entry.unit;
  const [val, setVal] = useState(ctx.kind === "log" ? (isItem ? "1" : "100") : String(ctx.entry.amount));
  const [flash, setFlash] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(t);
  }, []);

  const commit = () => {
    const amount = +val;
    if (!(amount > 0)) {
      setFlash(true);
      setTimeout(() => setFlash(false), 700);
      return;
    }
    onCommit(amount);
  };

  const title =
    ctx.kind === "log"
      ? t(isItem ? "howMany" : "howMuch", { name: ctx.food.name })
      : t("editEntry", { name: ctx.entry.name });
  const meal = ctx.kind === "log" ? mealLabel(ctx.meal) : null;
  const presets = isItem ? [1, 2, 3, 4] : [50, 100, 150, 200];

  return (
    <Overlay onClose={onClose}>
      <div className="mb-[15px] text-center text-[17px] font-extrabold">{title}</div>
      <div className="mb-3.5 flex items-center gap-3">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          min="0"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          className={
            "w-full flex-1 rounded-[13px] border bg-white px-4 py-3.5 text-center text-[22px] font-bold focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] focus:outline-none " +
            (flash ? "border-danger" : "border-line")
          }
        />
        <span className="min-w-[34px] text-lg font-extrabold text-muted">{unitLabel}</span>
      </div>
      <div className="mb-[18px] flex gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => {
              setVal(String(p));
              inputRef.current?.focus();
            }}
            className="flex-1 cursor-pointer rounded-[11px] border border-line bg-white px-2 py-[11px] text-[15px] font-bold text-ink hover:border-accent hover:bg-accent-soft hover:text-accent"
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={commit}
        className="w-full cursor-pointer rounded-[13px] border-none bg-accent p-[15px] text-[17px] font-bold text-white"
      >
        {ctx.kind === "log" ? t("addToMeal", { meal }) : t("save")}
      </button>
    </Overlay>
  );
}

// ── Food cards (library + favorites) ────────────────────────────────────────

function FoodCard({ f, onAdd, onTrash, onFav, onDragAway }) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "food:" + f.id);
        dragValidDrop = false;
        setDragging(true);
      }}
      onDragEnd={() => {
        setDragging(false);
        if (!dragValidDrop) onDragAway?.();
      }}
      className={
        "group relative cursor-grab select-none rounded-xl border border-line bg-white px-2.5 pb-2.5 pt-3 shadow-card transition duration-[130ms] hover:-translate-y-[3px] hover:border-[#d2d9e0] hover:shadow-pop active:cursor-grabbing sm:rounded-2xl sm:px-[18px] sm:pb-4 sm:pt-[18px] " +
        (dragging ? "opacity-40" : "")
      }
    >
      <button
        onClick={onFav}
        title={f.fav ? t("removeFavorite") : t("favorite")}
        className={
          "absolute left-1 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-base leading-none transition duration-[120ms] hover:scale-[1.12] hover:text-[#ef4444] sm:left-[9px] sm:top-2.5 sm:h-7 sm:w-7 sm:text-xl " +
          (f.fav ? "text-[#ef4444]" : "text-[#c9d0d8]")
        }
      >
        {f.fav ? "♥" : "♡"}
      </button>
      <button
        onClick={onAdd}
        title={t("addToAMeal")}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border-none bg-accent-soft text-base font-bold leading-none text-accent hover:bg-accent hover:text-white sm:right-[11px] sm:top-[11px] sm:h-[30px] sm:w-[30px] sm:rounded-[9px] sm:text-xl"
      >
        +
      </button>
      <div className="mb-1 break-words pl-[22px] pr-5 text-[13px] font-bold leading-[1.25] sm:mb-[5px] sm:pl-[26px] sm:pr-6 sm:text-[17px]">
        {f.name}
      </div>
      <div className="text-xs font-semibold text-muted sm:text-[15px]">
        {rateLabel(f)
          .split(" kcal")
          .map((part, i) =>
            i === 0 ? (
              <b key={i} className="text-[13px] font-extrabold text-accent sm:text-[17px]">
                {part}
              </b>
            ) : (
              <span key={i}> kcal{part}</span>
            )
          )}
      </div>
      <button
        onClick={onTrash}
        title={t("deleteFromLibrary")}
        className="absolute bottom-2 right-2 cursor-pointer border-none bg-transparent p-0.5 text-[13px] text-[#c4ccd4] opacity-50 transition duration-[130ms] hover:text-danger sm:bottom-3 sm:right-[13px] sm:text-[15px] sm:opacity-0 sm:group-hover:opacity-100"
      >
        🗑
      </button>
    </div>
  );
}

function AddFoodCard({ onAdd }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [mode, setMode] = useState("per100-g");
  const [flash, setFlash] = useState(null); // "name" | "cal"
  const calRef = useRef(null);
  const nameRef = useRef(null);

  const placeholder =
    mode === "item"
      ? t("kcalPerItem")
      : mode === "per100-ml"
        ? t("kcalPer100ml")
        : t("kcalPer100g");

  const submit = () => {
    const n = name.trim();
    const c = Math.round(+cal);
    if (!n || !(c > 0)) {
      const which = n ? "cal" : "name";
      setFlash(which);
      setTimeout(() => setFlash(null), 700);
      (which === "cal" ? calRef : nameRef).current?.focus();
      return;
    }
    onAdd(n, mode === "item" ? "item" : "per100", mode === "per100-ml" ? "ml" : "g", c);
    setName("");
    setCal("");
  };

  const inputCls = (bad) =>
    "w-full rounded-[11px] border bg-white px-2.5 py-2 text-sm focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] focus:outline-none sm:rounded-[13px] sm:px-3 sm:py-2.5 sm:text-[15px] " +
    (bad ? "border-danger" : "border-line");

  return (
    <div className="col-span-2 flex flex-col justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-[#fafcfd] px-3 pb-3 pt-3.5 sm:col-auto sm:gap-[9px] sm:rounded-2xl sm:px-[18px] sm:pb-4 sm:pt-[18px]">
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") calRef.current?.focus();
        }}
        placeholder={t("newFoodName")}
        autoComplete="off"
        className={inputCls(flash === "name")}
      />
      <div className="flex gap-[5px]">
        {[
          ["per100-g", "/100g"],
          ["per100-ml", "/100ml"],
          ["item", t("chipItem")],
        ].map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              "flex-1 cursor-pointer rounded-[9px] border px-1 py-[7px] text-xs font-bold " +
              (mode === m
                ? "border-accent bg-accent-soft text-accent"
                : "border-line bg-white text-muted")
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          ref={calRef}
          value={cal}
          onChange={(e) => setCal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          className={inputCls(flash === "cal") + " min-w-0 flex-1"}
        />
        <button
          onClick={submit}
          className="cursor-pointer rounded-[11px] border-none bg-accent px-3.5 py-2 text-sm font-bold text-white sm:px-4 sm:py-[11px] sm:text-[15px]"
        >
          {t("add")}
        </button>
      </div>
    </div>
  );
}

// ── Meal bucket ─────────────────────────────────────────────────────────────

function LoggedEntry({ e, onEdit, onRemove }) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);
  return (
    <div
      draggable
      title={t("tapToEdit")}
      onDragStart={(ev) => {
        ev.dataTransfer.setData("text/plain", "entry:" + e.id);
        dragValidDrop = false;
        setDragging(true);
      }}
      onDragEnd={() => {
        setDragging(false);
        if (!dragValidDrop) onRemove();
      }}
      onClick={onEdit}
      className={
        "flex cursor-pointer items-center justify-between rounded-[11px] border border-line2 bg-[#f8fafb] px-2.5 py-1.5 active:cursor-grabbing sm:rounded-[13px] sm:px-[15px] sm:py-2 " +
        (dragging ? "opacity-45" : "")
      }
    >
      <span className="min-w-0 break-words pr-2 text-sm font-semibold sm:text-base">
        {e.name}{" "}
        <span className="ml-0.5 text-xs font-semibold text-muted sm:text-sm">{amtLabel(e)}</span>
      </span>
      <span className="flex flex-none items-center gap-2 sm:gap-[13px]">
        <span className="text-[13px] tabular-nums text-muted sm:text-[15px]">
          {(+e.cal).toLocaleString()} kcal
        </span>
        <button
          title={t("remove")}
          onClick={(ev) => {
            ev.stopPropagation();
            onRemove();
          }}
          className="cursor-pointer border-none bg-transparent p-0.5 text-lg leading-none text-[#b9c0c8] hover:text-danger"
        >
          ✕
        </button>
      </span>
    </div>
  );
}

function MealCard({ meal, items, total, onDrop, onEditEntry, onRemoveEntry }) {
  const { t } = useI18n();
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        dragValidDrop = true;
        onDrop(e.dataTransfer.getData("text/plain"));
      }}
      className={
        "flex min-h-[240px] flex-col rounded-2xl border-2 bg-white shadow-card transition sm:min-h-[360px] sm:rounded-[18px] lg:min-h-[140px] " +
        (over
          ? "-translate-y-[3px] border-accent shadow-[0_0_0_4px_var(--color-accent-soft)]"
          : "border-line")
      }
    >
      <h3 className="m-0 flex items-center justify-between border-b-2 border-line2 px-3.5 py-3 text-base font-extrabold sm:px-5 sm:py-[18px] sm:text-[19px]">
        <span className="flex items-center gap-2 sm:gap-[11px]">
          <span className="text-xl sm:text-2xl">{meal.ic}</span>
          {mealLabel(meal)}
        </span>
        <span className="text-[13px] font-extrabold tabular-nums text-accent sm:text-[15px]">
          {total.toLocaleString()} kcal
        </span>
      </h3>
      <div className="flex flex-1 flex-col gap-2 p-2.5 sm:gap-[9px] sm:p-3.5">
        {items.length ? (
          items.map((e) => (
            <LoggedEntry
              key={e.id}
              e={e}
              onEdit={() => onEditEntry(e)}
              onRemove={() => onRemoveEntry(e.id)}
            />
          ))
        ) : (
          <div className="flex min-h-[100px] flex-1 items-center justify-center rounded-[13px] border-2 border-dashed border-line px-4 text-center text-sm text-[#aab2bb] sm:min-h-[120px] sm:text-[15px] lg:min-h-[64px]">
            <span className="sm:hidden">{t("nothingYet")}</span>
            <span className="hidden sm:inline">{t("dropFoodHere")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Mobile-only pager: one meal bucket per screen, swipe (scroll-snap) to move
// between meals, or tap a chip in the segmented bar to jump straight there.
function MobileMealPager({ totals, renderCard }) {
  const scroller = useRef(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(MEALS.length - 1, i)));
  };

  const goTo = (i) => {
    const el = scroller.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-2.5 grid grid-cols-4 gap-1 rounded-2xl bg-[#e1e6ec] p-1">
        {MEALS.map((m, i) => (
          <button
            key={m.key}
            onClick={() => goTo(i)}
            className={
              "flex cursor-pointer flex-col items-center rounded-xl border-none px-0.5 py-1.5 leading-tight transition " +
              (i === active ? "bg-white shadow-card" : "bg-transparent")
            }
          >
            <span className="text-base">{m.ic}</span>
            <span className={"text-[10px] font-bold " + (i === active ? "text-ink" : "text-muted")}>
              {mealLabel(m)}
            </span>
            <span
              className={
                "text-[10px] font-extrabold tabular-nums " +
                (i === active ? "text-accent" : "text-[#98a1ab]")
              }
            >
              {totals[i] ? totals[i].toLocaleString() : "·"}
            </span>
          </button>
        ))}
      </div>
      <div
        ref={scroller}
        onScroll={onScroll}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory overflow-x-auto"
      >
        {MEALS.map((m) => (
          <div key={m.key} className="w-full flex-none snap-center px-1">
            {renderCard(m)}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5">
        {MEALS.map((m, i) => (
          <span
            key={m.key}
            className={
              "h-1.5 rounded-full transition-all duration-200 " +
              (i === active ? "w-4 bg-accent" : "w-1.5 bg-[#c9d0d8]")
            }
          />
        ))}
      </div>
    </div>
  );
}

// ── Hero (progress ring + stats) ────────────────────────────────────────────

function Hero({ total, goal, onEditGoal }) {
  const { t } = useI18n();
  const rem = goal - total;
  const pct = goal > 0 ? total / goal : 0;
  const C = 2 * Math.PI * 72;
  const color =
    pct > 1 ? "var(--color-danger)" : pct >= 0.85 ? "var(--color-amber)" : "var(--color-accent)";

  const label = "text-[11px] font-bold uppercase tracking-[0.5px] text-muted sm:text-sm";
  const value = "text-lg font-extrabold tabular-nums sm:text-[34px] sm:tracking-[-1px]";
  const stat =
    "flex items-baseline justify-between gap-2 sm:flex-col sm:items-start sm:justify-start sm:gap-1";

  return (
    <div className="mb-4 flex items-center gap-4 rounded-[18px] border border-line bg-gradient-to-br from-white to-[#f6fbf8] px-4 py-4 shadow-pop sm:mb-6 sm:flex-wrap sm:gap-[46px] sm:px-8 sm:py-[26px]">
      <div className="relative h-[118px] w-[118px] flex-none sm:h-[168px] sm:w-[168px]">
        <svg viewBox="0 0 168 168" className="h-full w-full -rotate-90">
          <circle cx="84" cy="84" r="72" fill="none" stroke="#edf1f4" strokeWidth="15" />
          <circle
            cx="84"
            cy="84"
            r="72"
            fill="none"
            stroke={color}
            strokeWidth="15"
            strokeLinecap="round"
            strokeDasharray={C.toFixed(2)}
            strokeDashoffset={(C * (1 - Math.min(pct, 1))).toFixed(2)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[27px] font-extrabold leading-none tracking-[-1px] sm:text-[42px] sm:tracking-[-1.5px]">
            {total.toLocaleString()}
          </span>
          <span className="mt-0.5 text-[11px] font-bold text-muted sm:mt-1 sm:text-sm">
            {t("ofGoal", { goal: goal.toLocaleString() })}
          </span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[300px] sm:flex-row sm:flex-wrap sm:gap-10">
        <div className={stat}>
          <span className={label}>{t("consumed")}</span>
          <span className={value}>{total.toLocaleString()}</span>
        </div>
        <div className={stat}>
          <span className={label}>{rem >= 0 ? t("remaining") : t("overBy")}</span>
          <span className={value + " " + (rem >= 0 ? "text-accent" : "text-danger")}>
            {Math.abs(rem).toLocaleString()}
          </span>
        </div>
        <div className={stat}>
          <span className={label}>{t("dailyGoal")}</span>
          <span className="flex items-center gap-2">
            <span className={value}>{goal.toLocaleString()}</span>
            <button
              onClick={onEditGoal}
              className="cursor-pointer rounded-[9px] border-none bg-accent-soft px-2 py-1 text-[11px] font-bold text-accent sm:px-3 sm:py-[5px] sm:text-[13px]"
            >
              {t("editShort")}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Today tab ───────────────────────────────────────────────────────────────

export default function TodayTab({ data, update }) {
  const { t } = useI18n();
  const { foods, logs, goal } = data;
  const today = startOfToday();
  const [curKey, setCurKey] = useState(dateKey(today));
  const [search, setSearch] = useState("");
  const [pickerFood, setPickerFood] = useState(null);
  const [amtCtx, setAmtCtx] = useState(null);
  const [favOver, setFavOver] = useState(false);

  const cur = dayFromKey(curKey);
  const todayKey = dateKey(today);
  const k = curKey;
  const total = dayTotal(logs, k);

  const shiftDay = (delta) => {
    const d = dayFromKey(curKey);
    d.setDate(d.getDate() + delta);
    setCurKey(dateKey(d));
  };

  const logFood = (food, meal, amount) => {
    update((d) => {
      const entry = {
        id: uid(),
        name: food.name,
        meal,
        mode: food.mode,
        unit: food.unit,
        amount,
        rate: +food.kcal,
        cal: calcCal(food.mode, +food.kcal, amount),
      };
      return { ...d, logs: { ...d.logs, [k]: [...entriesFor(d.logs, k), entry] } };
    });
  };

  const editAmount = (id, amount) => {
    update((d) => ({
      ...d,
      logs: {
        ...d.logs,
        [k]: entriesFor(d.logs, k).map((e) =>
          e.id === id ? { ...e, amount, cal: calcCal(e.mode, e.rate, amount) } : e
        ),
      },
    }));
  };

  const moveEntry = (id, meal) => {
    update((d) => ({
      ...d,
      logs: {
        ...d.logs,
        [k]: entriesFor(d.logs, k).map((e) => (e.id === id ? { ...e, meal } : e)),
      },
    }));
  };

  const removeEntry = (id) => {
    update((d) => {
      const rest = entriesFor(d.logs, k).filter((e) => e.id !== id);
      const logs = { ...d.logs };
      if (rest.length) logs[k] = rest;
      else delete logs[k];
      return { ...d, logs };
    });
  };

  const handleDrop = (payload, meal) => {
    if (!payload) return;
    if (payload.startsWith("food:")) {
      // Drop = log a default serving straight away (1 item, or 100 g/ml).
      // Tap the logged entry afterward to adjust the amount.
      const f = foods.find((x) => x.id === payload.slice(5));
      if (f) logFood(f, meal, f.mode === "item" ? 1 : 100);
    } else if (payload.startsWith("entry:")) {
      moveEntry(payload.slice(6), meal);
    }
  };

  const addFood = (name, mode, unit, kcal) => {
    update((d) => ({ ...d, foods: [...d.foods, { id: uid(), name, mode, kcal, unit }] }));
  };

  const deleteFood = (id) => {
    const f = foods.find((x) => x.id === id);
    if (!f) return;
    if (confirm(t("confirmDelete", { name: f.name }))) {
      update((d) => ({ ...d, foods: d.foods.filter((x) => x.id !== id) }));
    }
  };

  const toggleFav = (id) => {
    update((d) => ({
      ...d,
      foods: d.foods.map((f) => (f.id === id ? { ...f, fav: !f.fav } : f)),
    }));
  };

  // Drop onto the Favorites bucket: a library card favorites that food; a
  // logged entry favorites the matching food (the entry itself stays logged).
  const dropOnFavs = (payload) => {
    if (!payload) return;
    let food = null;
    if (payload.startsWith("food:")) {
      food = foods.find((x) => x.id === payload.slice(5));
    } else if (payload.startsWith("entry:")) {
      const e = entriesFor(logs, k).find((x) => x.id === payload.slice(6));
      if (e) food = foods.find((x) => x.name === e.name);
    }
    if (food && !food.fav) toggleFav(food.id);
  };

  const editGoal = () => {
    const v = prompt(t("goalPrompt"), goal);
    if (v === null) return;
    const n = Math.round(+v);
    if (n > 0) update((d) => ({ ...d, goal: n }));
  };

  const favs = foods.filter((f) => f.fav).sort((a, b) => a.name.localeCompare(b.name));
  const q = search.toLowerCase();
  const libList = foods
    .filter((f) => f.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const cardProps = (f) => ({
    f,
    onAdd: () => setPickerFood(f),
    onTrash: () => deleteFood(f.id),
    onFav: () => toggleFav(f.id),
  });

  const mealCard = (m) => (
    <MealCard
      key={m.key}
      meal={m}
      items={entriesFor(logs, k).filter((e) => e.meal === m.key)}
      total={mealTotal(logs, k, m.key)}
      onDrop={(payload) => handleDrop(payload, m.key)}
      onEditEntry={(e) => setAmtCtx({ kind: "edit", entry: e })}
      onRemoveEntry={removeEntry}
    />
  );

  return (
    <section className="animate-fade">
      {/* Date bar */}
      <div className="mb-3.5 flex items-center justify-center gap-2.5 sm:mb-[22px] sm:gap-[18px]">
        <button
          onClick={() => shiftDay(-1)}
          className="h-10 w-10 flex-none cursor-pointer rounded-[11px] border border-line bg-white text-xl text-ink shadow-card sm:h-[50px] sm:w-[50px] sm:rounded-[13px] sm:text-2xl"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1 text-center text-lg font-extrabold sm:min-w-[340px] sm:flex-none sm:text-[22px]">
          {curKey === todayKey ? t("today") : fmtLong(cur)}
          <small className="mt-0.5 block text-xs font-semibold text-muted sm:text-sm">
            {curKey === todayKey ? fmtLong(cur) : " "}
          </small>
        </div>
        <button
          onClick={() => shiftDay(1)}
          disabled={curKey >= todayKey}
          className="h-10 w-10 flex-none cursor-pointer rounded-[11px] border border-line bg-white text-xl text-ink shadow-card disabled:cursor-default disabled:opacity-30 sm:h-[50px] sm:w-[50px] sm:rounded-[13px] sm:text-2xl"
        >
          ›
        </button>
      </div>

      <Hero total={total} goal={goal} onEditGoal={editGoal} />

      {/* Meals (left) + Favorites (right on desktop) */}
      <div className="mb-5 flex flex-col gap-5 sm:mb-[30px] sm:gap-[18px] lg:grid lg:grid-cols-3 lg:items-start">
        {/* Meal buckets — chip pager on every screen size, in the compact left column on desktop */}
        <div className="min-w-0 flex-1">
          <MobileMealPager
            totals={MEALS.map((m) => mealTotal(logs, k, m.key))}
            renderCard={mealCard}
          />
        </div>

        {/* Favorites bucket — below on phones/tablets, to the right on desktop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setFavOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setFavOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setFavOver(false);
            dragValidDrop = true;
            dropOnFavs(e.dataTransfer.getData("text/plain"));
          }}
          className={
            "flex flex-col rounded-2xl border-2 bg-white shadow-card transition sm:rounded-[18px] lg:col-span-2 " +
            (favOver
              ? "-translate-y-[3px] border-[#ef4444] shadow-[0_0_0_4px_#fde8ea]"
              : "border-[#f3d0d4]")
          }
        >
          <h3 className="m-0 flex items-center justify-between border-b-2 border-[#f6e0e2] px-3.5 py-3 text-base font-extrabold sm:px-5 sm:py-[18px] sm:text-[19px]">
            <span className="flex items-center gap-2 sm:gap-[11px]">
              <span className="text-xl sm:text-2xl">❤️</span>{t("favorites")}
            </span>
            <span className="text-[13px] font-extrabold tabular-nums text-[#ef4444] sm:text-[15px]">
              {favs.length || ""}
            </span>
          </h3>
          <div className="p-2.5 sm:p-3.5">
            {favs.length ? (
              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] sm:gap-3.5">
                {favs.map((f) => (
                  <FoodCard key={f.id} {...cardProps(f)} onDragAway={() => toggleFav(f.id)} />
                ))}
              </div>
            ) : (
              <div className="flex min-h-[90px] items-center justify-center rounded-[13px] border-2 border-dashed border-line px-4 text-center text-sm text-[#aab2bb] sm:min-h-[120px] sm:text-[15px]">
                <span className="sm:hidden">{t("favEmptyMobile")}</span>
                <span className="hidden sm:inline">{t("favEmptyDesktop")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Library */}
      <div className="mx-1 mb-3 mt-1.5 flex flex-wrap items-center justify-between gap-2.5 sm:mb-4">
        <span className="text-sm font-extrabold uppercase tracking-[0.6px] text-muted sm:text-[17px]">
          {t("foodLibrary")}
        </span>
        <span className="text-xs text-muted sm:text-sm">
          <span className="sm:hidden">{t("libHintMobile")}</span>
          <span className="hidden sm:inline">{t("libHintDesktop")}</span>
        </span>
      </div>
      <div className="mb-3 max-w-[420px] sm:mb-[18px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchFoods")}
          autoComplete="off"
          className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] focus:outline-none sm:rounded-[13px] sm:px-4 sm:py-3.5 sm:text-base"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] sm:gap-4">
        {libList.map((f) => (
          <FoodCard key={f.id} {...cardProps(f)} />
        ))}
        {!libList.length && q && (
          <div className="col-span-full p-6 text-center text-[15px] text-muted">
            {t("noMatch", { q: search })}
          </div>
        )}
        <AddFoodCard onAdd={addFood} />
      </div>

      {pickerFood && (
        <MealPicker
          food={pickerFood}
          onClose={() => setPickerFood(null)}
          onPick={(meal) => {
            const f = pickerFood;
            setPickerFood(null);
            setAmtCtx({ kind: "log", food: f, meal });
          }}
        />
      )}
      {amtCtx && (
        <AmountModal
          ctx={amtCtx}
          onClose={() => setAmtCtx(null)}
          onCommit={(amount) => {
            if (amtCtx.kind === "log") logFood(amtCtx.food, amtCtx.meal, amount);
            else editAmount(amtCtx.entry.id, amount);
            setAmtCtx(null);
          }}
        />
      )}
    </section>
  );
}
