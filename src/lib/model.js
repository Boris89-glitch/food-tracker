// Data model: a food carries a RATE — kcal per 100 g/ml (mode "per100") or kcal
// per item (mode "item"). A log entry carries an amount + a snapshot of that
// rate, so its calories can be recomputed and old foods can be deleted safely.

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Same localStorage keys as the pre-React app so existing data carries over.
export const K = {
  foods: "ft2_foods",
  logs: "ft2_logs",
  goal: "ft2_goal",
  weight: "ft2_weight",
  unit: "ft2_unit",
};

export const loadLS = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};

// Migrate the legacy {name,cal} shape (treated as 1 item).
export function normFood(f) {
  if (f.mode) return f;
  return { id: f.id || uid(), name: f.name, mode: "item", kcal: +f.cal || 0, unit: "g" };
}

export function normEntry(e) {
  if (e.mode && e.amount != null) return e;
  return {
    id: e.id || uid(),
    name: e.name,
    meal: e.meal,
    mode: "item",
    unit: "",
    amount: 1,
    rate: +e.cal || 0,
    cal: +e.cal || 0,
  };
}

export const calcCal = (mode, rate, amt) =>
  Math.round(mode === "item" ? rate * amt : (rate * amt) / 100);

export const rateLabel = (f) =>
  f.mode === "item"
    ? `${(+f.kcal).toLocaleString()} kcal / item`
    : `${(+f.kcal).toLocaleString()} kcal / 100 ${f.unit}`;

export const amtLabel = (e) =>
  e.mode === "item" ? `× ${e.amount}` : `${e.amount} ${e.unit}`;

export const MEALS = [
  { key: "breakfast", label: "Breakfast", ic: "🌅" },
  { key: "lunch", label: "Lunch", ic: "☀️" },
  { key: "snacks", label: "Snacks", ic: "🍎" },
  { key: "dinner", label: "Dinner", ic: "🌙" },
];

const pad = (n) => String(n).padStart(2, "0");
export const dateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dayFromKey = (k) => {
  const a = k.split("-").map(Number);
  return new Date(a[0], a[1] - 1, a[2]);
};
export const startOfToday = () => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
};
export const fmtLong = (d) =>
  d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
export const fmtShort = (d) =>
  d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const entriesFor = (logs, k) => logs[k] || [];
export const dayTotal = (logs, k) =>
  entriesFor(logs, k).reduce((s, e) => s + (+e.cal || 0), 0);
export const mealTotal = (logs, k, m) =>
  entriesFor(logs, k)
    .filter((e) => e.meal === m)
    .reduce((s, e) => s + (+e.cal || 0), 0);

// Initial state: read localStorage, run one-time migrations, seed defaults.
export function loadInitialData() {
  let foods = loadLS(K.foods, []);
  let logs = loadLS(K.logs, {});
  let goal = loadLS(K.goal, 2000);
  let weight = loadLS(K.weight, {});
  let unit = loadLS(K.unit, "kg");

  if (!localStorage.getItem("ft2_init")) {
    const oldSaved = loadLS("ft_saved", []);
    if (oldSaved.length && !foods.length) {
      foods = oldSaved.map((s) => ({ id: uid(), name: s.name, cal: +s.cal }));
    }
    const oldW = loadLS("ft_weight", null);
    if (oldW && !Object.keys(weight).length) weight = oldW;
    if (!foods.length) {
      foods = [
        { id: uid(), name: "Banana", cal: 95 },
        { id: uid(), name: "Greek yogurt", cal: 120 },
        { id: uid(), name: "Black coffee", cal: 5 },
        { id: uid(), name: "Chicken breast (100g)", cal: 165 },
        { id: uid(), name: "Boiled egg", cal: 78 },
        { id: uid(), name: "Oatmeal bowl", cal: 220 },
      ];
    }
    localStorage.setItem("ft2_init", "1");
  }

  foods = foods.map(normFood);
  const normLogs = {};
  for (const dk in logs) normLogs[dk] = (logs[dk] || []).map(normEntry);

  return { foods, logs: normLogs, goal, weight, unit };
}

export function writeLS(data) {
  localStorage.setItem(K.foods, JSON.stringify(data.foods));
  localStorage.setItem(K.logs, JSON.stringify(data.logs));
  localStorage.setItem(K.goal, JSON.stringify(data.goal));
  localStorage.setItem(K.weight, JSON.stringify(data.weight));
  localStorage.setItem(K.unit, JSON.stringify(data.unit));
}
