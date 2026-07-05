import { useEffect, useState } from "react";
import { LANGS, useI18n } from "../lib/i18n.js";

const TABS = ["today", "weight", "history"];

// Live digital clock: bold tabular time with a colon that blinks each second.
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const colon = now.getSeconds() % 2 === 0;
  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-line bg-gradient-to-br from-white to-[#f6fbf8] px-3 py-2 shadow-card">
      <span className="h-2 w-2 flex-none animate-pulse rounded-full bg-accent2" />
      <span className="text-[15px] font-extrabold tabular-nums tracking-[-0.5px] sm:text-[17px]">
        {hh}
        <span className={"px-px " + (colon ? "opacity-100" : "opacity-20")}>:</span>
        {mm}
      </span>
    </div>
  );
}

export default function TopBar({ tab, onTab, unit, onToggleUnit, user, synced, onSignOut }) {
  const { lang, setLang, t } = useI18n();
  const nextLang = LANGS[(LANGS.findIndex((l) => l.code === lang) + 1) % LANGS.length];
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 sm:mb-[22px] sm:gap-6">
      <h1 className="flex items-center gap-2 whitespace-nowrap text-xl font-extrabold tracking-[-0.5px] sm:gap-3 sm:text-3xl">
        🍽️ Food Tracker
      </h1>
      <Clock />
      {/* On phones the tab switcher drops to its own full-width row. */}
      <div className="order-last flex w-full gap-1 rounded-[13px] bg-[#e1e6ec] p-1 sm:order-none sm:w-auto sm:gap-1.5 sm:rounded-[15px] sm:p-[5px]">
        {TABS.map((id) => (
          <button
            key={id}
            onClick={() => onTab(id)}
            className={
              "flex-1 cursor-pointer select-none rounded-[10px] border-none px-3 py-2 text-sm font-bold transition sm:flex-none sm:rounded-[11px] sm:px-6 sm:py-[11px] sm:text-base " +
              (tab === id ? "bg-white text-ink shadow-card" : "bg-transparent text-muted")
            }
          >
            {t(`tab.${id}`)}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <button
        onClick={() => setLang(nextLang.code)}
        title="Language / Jezik"
        className="cursor-pointer rounded-[11px] border border-line bg-white px-3 py-2 text-[13px] font-bold text-accent shadow-card sm:px-4 sm:py-[9px] sm:text-[15px]"
      >
        🌐 {LANGS.find((l) => l.code === lang)?.label}
      </button>
      <button
        onClick={onToggleUnit}
        className="cursor-pointer rounded-[11px] border border-line bg-white px-3 py-2 text-[13px] font-bold text-accent shadow-card sm:px-4 sm:py-[9px] sm:text-[15px]"
      >
        {t("unit", { unit })}
      </button>
      {user && (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-2 shadow-card sm:gap-2.5">
          <span
            className={"h-2 w-2 flex-none rounded-full " + (synced ? "bg-accent2" : "bg-[#c4ccd4]")}
            title={synced ? t("synced") : t("syncing")}
          />
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="h-7 w-7 rounded-full bg-line object-cover sm:h-[30px] sm:w-[30px]"
            />
          )}
          <span className="hidden max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold sm:block">
            {user.displayName || user.email || t("signedIn")}
          </span>
          <button
            onClick={onSignOut}
            className="cursor-pointer rounded-lg border-none bg-transparent px-2 py-1 text-[13px] font-bold text-muted hover:bg-[#f1f4f7] hover:text-danger"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
