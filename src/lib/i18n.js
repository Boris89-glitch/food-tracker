import { createContext, createElement, useContext, useState } from "react";

// Tiny i18n: one translations dictionary, a persisted current language, and a
// t(key, vars) lookup with {var} interpolation. A module-level `lang` mirror
// lets non-component helpers (rateLabel, date formatting) translate too.

export const LANGS = [
  { code: "en", label: "EN" },
  { code: "sr", label: "SR" },
];

const LOCALE = { en: "en-US", sr: "sr-Latn" };
const LS_KEY = "ft2_lang";

const T = {
  en: {
    "tab.today": "Today",
    "tab.weight": "Weight",
    "tab.history": "History",
    unit: "Unit: {unit}",
    synced: "Synced",
    syncing: "Syncing…",
    signedIn: "Signed in",
    signOut: "Sign out",
    signInToSave: "Sign in to save your data",

    "meal.breakfast": "Breakfast",
    "meal.lunch": "Lunch",
    "meal.snacks": "Snacks",
    "meal.dinner": "Dinner",

    addTo: "Add “{name}” to…",
    howMany: "How many · {name}",
    howMuch: "How much · {name}",
    editEntry: "Edit · {name}",
    addToMeal: "Add to {meal}",
    addFood: "Add food",
    save: "Save",
    removeFavorite: "Remove favorite",
    favorite: "Favorite",
    addToAMeal: "Add to a meal",
    deleteFromLibrary: "Delete from library",
    tapToEdit: "Tap to edit amount",
    remove: "Remove",
    nothingYet: "Nothing yet — tap ＋ on a food below",
    dropFoodHere: "Drop food here",

    consumed: "Consumed",
    remaining: "Remaining",
    overBy: "Over by",
    dailyGoal: "Daily goal",
    editShort: "edit",
    ofGoal: "of {goal}",
    today: "Today",
    confirmDelete: "Remove “{name}” from your library? (Past logs stay.)",
    goalPrompt: "Daily calorie goal:",

    favorites: "Favorites",
    favEmptyMobile: "Tap a food's ♡ to keep it here for quick logging",
    favEmptyDesktop: "Drag a food here — or tap its ♡ — to keep it here for quick logging",
    foodLibrary: "Food library",
    libHintMobile: "tap ＋ on a card to log it",
    libHintDesktop: "drag a card up into a meal — or tap ＋ to choose",
    searchFoods: "Search foods…",
    noMatch: "No match for “{q}”.",
    newFoodName: "New food name",
    kcalPerItem: "kcal per item",
    kcalPer100ml: "kcal per 100 ml",
    kcalPer100g: "kcal per 100 g",
    chipItem: "item",
    add: "Add",
    unitItem: "item",

    logWeight: "Log weight",
    latest: "Latest",
    change30d: "Change (30d)",
    entries: "Entries",
    weightForToday: "Weight for today",
    lastVal: "last: {v}",
    weightIn: "weight in {unit}",
    saveWeight: "Save weight",
    weightTrend: "Weight trend",
    weightEmpty: "Log your weight to start a trend line.",

    dailyVsGoal: "Daily calories vs goal",
    daysRange: "{r} days",
    dayByDay: "Day by day",
    todaySuffix: "today",
    noHistory: "No history yet.",

    authSyncPrompt: "Sign in to sync your food log across every device.",
    authLocalPrompt:
      "Running in local-only mode. Add your Firebase config in src/firebase.js to enable Google sign-in and cross-device sync.",
    continueGoogle: "Continue with Google",
    continueOffline: "Continue offline",
    signInFailed: "Sign-in failed.",
    signInFailedRetry: "Sign-in failed. Please try again.",
  },
  sr: {
    "tab.today": "Danas",
    "tab.weight": "Težina",
    "tab.history": "Istorija",
    unit: "Jedinica: {unit}",
    synced: "Sinhronizovano",
    syncing: "Sinhronizacija…",
    signedIn: "Prijavljen",
    signOut: "Odjava",
    signInToSave: "Prijavi se da sačuvaš podatke",

    "meal.breakfast": "Doručak",
    "meal.lunch": "Ručak",
    "meal.snacks": "Užina",
    "meal.dinner": "Večera",

    addTo: "Dodaj „{name}“ u…",
    howMany: "Koliko komada · {name}",
    howMuch: "Koliko · {name}",
    editEntry: "Izmeni · {name}",
    addToMeal: "Dodaj u: {meal}",
    addFood: "Dodaj hranu",
    save: "Sačuvaj",
    removeFavorite: "Ukloni iz omiljenih",
    favorite: "Omiljeno",
    addToAMeal: "Dodaj u obrok",
    deleteFromLibrary: "Obriši iz biblioteke",
    tapToEdit: "Dodirni da izmeniš količinu",
    remove: "Ukloni",
    nothingYet: "Još ništa — dodirni ＋ na hrani ispod",
    dropFoodHere: "Prevuci hranu ovde",

    consumed: "Uneto",
    remaining: "Preostalo",
    overBy: "Preko za",
    dailyGoal: "Dnevni cilj",
    editShort: "izmeni",
    ofGoal: "od {goal}",
    today: "Danas",
    confirmDelete: "Ukloniti „{name}“ iz biblioteke? (Prethodni unosi ostaju.)",
    goalPrompt: "Dnevni cilj kalorija:",

    favorites: "Omiljeno",
    favEmptyMobile: "Dodirni ♡ na hrani da je držiš ovde za brzo unošenje",
    favEmptyDesktop: "Prevuci hranu ovde — ili dodirni ♡ — da je držiš ovde za brzo unošenje",
    foodLibrary: "Biblioteka hrane",
    libHintMobile: "dodirni ＋ na kartici da uneseš",
    libHintDesktop: "prevuci karticu u obrok — ili dodirni ＋ da izabereš",
    searchFoods: "Pretraži hranu…",
    noMatch: "Nema rezultata za „{q}“.",
    newFoodName: "Naziv nove hrane",
    kcalPerItem: "kcal po komadu",
    kcalPer100ml: "kcal na 100 ml",
    kcalPer100g: "kcal na 100 g",
    chipItem: "kom",
    add: "Dodaj",
    unitItem: "kom",

    logWeight: "Unesi težinu",
    latest: "Poslednje",
    change30d: "Promena (30d)",
    entries: "Unosi",
    weightForToday: "Težina za danas",
    lastVal: "poslednje: {v}",
    weightIn: "težina u {unit}",
    saveWeight: "Sačuvaj težinu",
    weightTrend: "Trend težine",
    weightEmpty: "Unesi težinu da započneš trend.",

    dailyVsGoal: "Dnevne kalorije naspram cilja",
    daysRange: "{r} dana",
    dayByDay: "Dan po dan",
    todaySuffix: "danas",
    noHistory: "Još nema istorije.",

    authSyncPrompt: "Prijavi se da sinhronizuješ dnevnik hrane na svim uređajima.",
    authLocalPrompt:
      "Rad u lokalnom režimu. Dodaj Firebase konfiguraciju u src/firebase.js za Google prijavu i sinhronizaciju.",
    continueGoogle: "Nastavi sa Google-om",
    continueOffline: "Nastavi oflajn",
    signInFailed: "Prijava nije uspela.",
    signInFailedRetry: "Prijava nije uspela. Pokušaj ponovo.",
  },
};

const readLang = () => {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v && T[v] ? v : "en";
  } catch {
    return "en";
  }
};

// Module-level mirror so plain helpers can translate without React.
let lang = readLang();

const interpolate = (str, vars) =>
  vars ? str.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : str;

export function t(key, vars) {
  const s = (T[lang] && T[lang][key]) ?? T.en[key] ?? key;
  return interpolate(s, vars);
}

export const getLang = () => lang;
export const getLocale = () => LOCALE[lang] || undefined;

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [l, setL] = useState(lang);
  const setLang = (next) => {
    lang = next;
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      /* ignore */
    }
    setL(next);
  };
  // Reference `l` so a language change re-renders consumers; `t` reads the
  // module-level mirror which setLang keeps in sync.
  return createElement(I18nContext.Provider, { value: { lang: l, setLang, t } }, children);
}

export const useI18n = () => useContext(I18nContext);
