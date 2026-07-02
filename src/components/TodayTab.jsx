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
  mealTotal,
  rateLabel,
  startOfToday,
  uid,
} from "../lib/model.js";

// ── Modals ──────────────────────────────────────────────────────────────────

function Overlay({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,24,28,0.4)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[320px] rounded-[20px] bg-white p-[22px] shadow-[0_16px_50px_rgba(0,0,0,0.25)]">
        {children}
      </div>
    </div>
  );
}

function MealPicker({ food, onPick, onClose }) {
  return (
    <Overlay onClose={onClose}>
      <div className="mb-[15px] text-center text-[17px] font-extrabold">
        Add “{food.name}” to…
      </div>
      {MEALS.map((m) => (
        <button
          key={m.key}
          onClick={() => onPick(m.key)}
          className="mb-[9px] flex w-full cursor-pointer items-center gap-[13px] rounded-[13px] border border-line bg-white p-[15px] text-[17px] font-bold hover:border-accent hover:bg-accent-soft"
        >
          <span className="text-[22px]">{m.ic}</span>
          {m.label}
        </button>
      ))}
    </Overlay>
  );
}

// Amount modal: choose grams/ml or item count when logging or editing.
function AmountModal({ ctx, onCommit, onClose }) {
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
      ? (isItem ? "How many · " : "How much · ") + ctx.food.name
      : "Edit · " + ctx.entry.name;
  const mealLabel =
    ctx.kind === "log" ? (MEALS.find((m) => m.key === ctx.meal) || {}).label || "" : null;
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
        {ctx.kind === "log" ? "Add to " + mealLabel : "Save"}
      </button>
    </Overlay>
  );
}

// ── Food cards (library + favorites) ────────────────────────────────────────

function FoodCard({ f, onAdd, onTrash, onFav }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", "food:" + f.id);
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={
        "group relative cursor-grab select-none rounded-2xl border border-line bg-white px-[18px] pb-4 pt-[18px] shadow-card transition duration-[130ms] hover:-translate-y-[3px] hover:border-[#d2d9e0] hover:shadow-pop active:cursor-grabbing " +
        (dragging ? "opacity-40" : "")
      }
    >
      <button
        onClick={onFav}
        title={f.fav ? "Remove favorite" : "Favorite"}
        className={
          "absolute left-[9px] top-2.5 flex h-7 w-7 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-xl leading-none transition duration-[120ms] hover:scale-[1.12] hover:text-[#ef4444] " +
          (f.fav ? "text-[#ef4444]" : "text-[#c9d0d8]")
        }
      >
        {f.fav ? "♥" : "♡"}
      </button>
      <button
        onClick={onAdd}
        title="Add to a meal"
        className="absolute right-[11px] top-[11px] flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[9px] border-none bg-accent-soft text-xl font-bold leading-none text-accent hover:bg-accent hover:text-white"
      >
        +
      </button>
      <div className="mb-[5px] break-words pl-[26px] pr-6 text-[17px] font-bold leading-[1.25]">
        {f.name}
      </div>
      <div className="text-[15px] font-semibold text-muted">
        {rateLabel(f)
          .split(" kcal")
          .map((part, i) =>
            i === 0 ? (
              <b key={i} className="text-[17px] font-extrabold text-accent">
                {part}
              </b>
            ) : (
              <span key={i}> kcal{part}</span>
            )
          )}
      </div>
      <button
        onClick={onTrash}
        title="Delete from library"
        className="absolute bottom-3 right-[13px] cursor-pointer border-none bg-transparent p-0.5 text-[15px] text-[#c4ccd4] opacity-0 transition duration-[130ms] hover:text-danger group-hover:opacity-100"
      >
        🗑
      </button>
    </div>
  );
}

function AddFoodCard({ onAdd }) {
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");
  const [mode, setMode] = useState("per100-g");
  const [flash, setFlash] = useState(null); // "name" | "cal"
  const calRef = useRef(null);
  const nameRef = useRef(null);

  const placeholder =
    mode === "item" ? "kcal per item" : mode === "per100-ml" ? "kcal per 100 ml" : "kcal per 100 g";

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
    "w-full rounded-[13px] border bg-white px-3 py-2.5 text-[15px] focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] focus:outline-none " +
    (bad ? "border-danger" : "border-line");

  return (
    <div className="flex flex-col justify-center gap-[9px] rounded-2xl border-2 border-dashed border-line bg-[#fafcfd] px-[18px] pb-4 pt-[18px]">
      <input
        ref={nameRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") calRef.current?.focus();
        }}
        placeholder="New food name"
        autoComplete="off"
        className={inputCls(flash === "name")}
      />
      <div className="flex gap-[5px]">
        {[
          ["per100-g", "/100g"],
          ["per100-ml", "/100ml"],
          ["item", "item"],
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
          className="cursor-pointer rounded-[11px] border-none bg-accent px-4 py-[11px] text-[15px] font-bold text-white"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ── Meal bucket ─────────────────────────────────────────────────────────────

function LoggedEntry({ e, onEdit, onRemove }) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      draggable
      title="Tap to edit amount"
      onDragStart={(ev) => {
        ev.dataTransfer.setData("text/plain", "entry:" + e.id);
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={onEdit}
      className={
        "flex cursor-pointer items-center justify-between rounded-[13px] border border-line2 bg-[#f8fafb] px-[15px] py-[13px] active:cursor-grabbing " +
        (dragging ? "opacity-45" : "")
      }
    >
      <span className="text-base font-semibold">
        {e.name}{" "}
        <span className="ml-0.5 text-sm font-semibold text-muted">{amtLabel(e)}</span>
      </span>
      <span className="flex items-center gap-[13px]">
        <span className="text-[15px] tabular-nums text-muted">
          {(+e.cal).toLocaleString()} kcal
        </span>
        <button
          title="Remove"
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
        onDrop(e.dataTransfer.getData("text/plain"));
      }}
      className={
        "flex min-h-[360px] flex-col rounded-[18px] border-2 bg-white shadow-card transition " +
        (over
          ? "-translate-y-[3px] border-accent shadow-[0_0_0_4px_var(--color-accent-soft)]"
          : "border-line")
      }
    >
      <h3 className="m-0 flex items-center justify-between border-b-2 border-line2 px-5 py-[18px] text-[19px] font-extrabold">
        <span className="flex items-center gap-[11px]">
          <span className="text-2xl">{meal.ic}</span>
          {meal.label}
        </span>
        <span className="text-[15px] font-extrabold tabular-nums text-accent">
          {total.toLocaleString()} kcal
        </span>
      </h3>
      <div className="flex flex-1 flex-col gap-[9px] p-3.5">
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
          <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-[13px] border-2 border-dashed border-line text-center text-[15px] text-[#aab2bb]">
            Drop food here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hero (progress ring + stats) ────────────────────────────────────────────

function Hero({ total, goal, onEditGoal }) {
  const rem = goal - total;
  const pct = goal > 0 ? total / goal : 0;
  const C = 2 * Math.PI * 72;
  const color =
    pct > 1 ? "var(--color-danger)" : pct >= 0.85 ? "var(--color-amber)" : "var(--color-accent)";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-[46px] rounded-[18px] border border-line bg-gradient-to-br from-white to-[#f6fbf8] px-8 py-[26px] shadow-pop">
      <div className="relative h-[168px] w-[168px] flex-none">
        <svg width="168" height="168" viewBox="0 0 168 168" className="-rotate-90">
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
          <span className="text-[42px] font-extrabold leading-none tracking-[-1.5px]">
            {total.toLocaleString()}
          </span>
          <span className="mt-1 text-sm font-bold text-muted">of {goal.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex min-w-[300px] flex-1 flex-wrap gap-10">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold uppercase tracking-[0.5px] text-muted">Consumed</span>
          <span className="text-[34px] font-extrabold tabular-nums tracking-[-1px]">
            {total.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold uppercase tracking-[0.5px] text-muted">
            {rem >= 0 ? "Remaining" : "Over by"}
          </span>
          <span
            className={
              "text-[34px] font-extrabold tabular-nums tracking-[-1px] " +
              (rem >= 0 ? "text-accent" : "text-danger")
            }
          >
            {Math.abs(rem).toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold uppercase tracking-[0.5px] text-muted">
            Daily goal
          </span>
          <span className="text-[34px] font-extrabold tabular-nums tracking-[-1px]">
            {goal.toLocaleString()}
          </span>
          <button
            onClick={onEditGoal}
            className="mt-1.5 cursor-pointer self-start rounded-[9px] border-none bg-accent-soft px-3 py-[5px] text-[13px] font-bold text-accent"
          >
            edit goal
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Today tab ───────────────────────────────────────────────────────────────

export default function TodayTab({ data, update }) {
  const { foods, logs, goal } = data;
  const today = startOfToday();
  const [curKey, setCurKey] = useState(dateKey(today));
  const [search, setSearch] = useState("");
  const [pickerFood, setPickerFood] = useState(null);
  const [amtCtx, setAmtCtx] = useState(null);

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
      const f = foods.find((x) => x.id === payload.slice(5));
      if (f) setAmtCtx({ kind: "log", food: f, meal });
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
    if (confirm(`Remove “${f.name}” from your library? (Past logs stay.)`)) {
      update((d) => ({ ...d, foods: d.foods.filter((x) => x.id !== id) }));
    }
  };

  const toggleFav = (id) => {
    update((d) => ({
      ...d,
      foods: d.foods.map((f) => (f.id === id ? { ...f, fav: !f.fav } : f)),
    }));
  };

  const editGoal = () => {
    const v = prompt("Daily calorie goal:", goal);
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

  return (
    <section className="animate-fade">
      {/* Date bar */}
      <div className="mb-[22px] flex items-center justify-center gap-[18px]">
        <button
          onClick={() => shiftDay(-1)}
          className="h-[50px] w-[50px] cursor-pointer rounded-[13px] border border-line bg-white text-2xl text-ink shadow-card"
        >
          ‹
        </button>
        <div className="min-w-[340px] text-center text-[22px] font-extrabold">
          {curKey === todayKey ? "Today" : fmtLong(cur)}
          <small className="mt-0.5 block text-sm font-semibold text-muted">
            {curKey === todayKey ? fmtLong(cur) : " "}
          </small>
        </div>
        <button
          onClick={() => shiftDay(1)}
          disabled={curKey >= todayKey}
          className="h-[50px] w-[50px] cursor-pointer rounded-[13px] border border-line bg-white text-2xl text-ink shadow-card disabled:cursor-default disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <Hero total={total} goal={goal} onEditGoal={editGoal} />

      {/* Meal buckets */}
      <div className="mb-[30px] grid grid-cols-1 gap-[18px] min-[620px]:grid-cols-2 min-[1100px]:grid-cols-4">
        {MEALS.map((m) => (
          <MealCard
            key={m.key}
            meal={m}
            items={entriesFor(logs, k).filter((e) => e.meal === m.key)}
            total={mealTotal(logs, k, m.key)}
            onDrop={(payload) => handleDrop(payload, m.key)}
            onEditEntry={(e) => setAmtCtx({ kind: "edit", entry: e })}
            onRemoveEntry={removeEntry}
          />
        ))}
      </div>

      {/* Favorites bucket */}
      <div className="mb-[30px] flex flex-col rounded-[18px] border-2 border-[#f3d0d4] bg-white shadow-card">
        <h3 className="m-0 flex items-center justify-between border-b-2 border-[#f6e0e2] px-5 py-[18px] text-[19px] font-extrabold">
          <span className="flex items-center gap-[11px]">
            <span className="text-2xl">❤️</span>Favorites
          </span>
          <span className="text-[15px] font-extrabold tabular-nums text-[#ef4444]">
            {favs.length || ""}
          </span>
        </h3>
        <div className="p-3.5">
          {favs.length ? (
            <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5">
              {favs.map((f) => (
                <FoodCard key={f.id} {...cardProps(f)} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[120px] items-center justify-center rounded-[13px] border-2 border-dashed border-line px-4 text-center text-[15px] text-[#aab2bb]">
              Tap the ♡ on any food below to keep it here for quick logging
            </div>
          )}
        </div>
      </div>

      {/* Library */}
      <div className="mx-1 mb-4 mt-1.5 flex flex-wrap items-center justify-between gap-2.5">
        <span className="text-[17px] font-extrabold uppercase tracking-[0.6px] text-muted">
          Food library
        </span>
        <span className="text-sm text-muted">
          drag a card up into a meal — or tap ＋ to choose
        </span>
      </div>
      <div className="mb-[18px] max-w-[420px]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search foods…"
          autoComplete="off"
          className="w-full rounded-[13px] border border-line bg-white px-4 py-3.5 text-base text-ink focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-soft)] focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
        {libList.map((f) => (
          <FoodCard key={f.id} {...cardProps(f)} />
        ))}
        {!libList.length && q && (
          <div className="col-span-full p-6 text-center text-[15px] text-muted">
            No match for “{search}”.
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
