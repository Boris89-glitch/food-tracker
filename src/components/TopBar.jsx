const TABS = [
  { id: "today", label: "Today" },
  { id: "weight", label: "Weight" },
  { id: "history", label: "History" },
];

export default function TopBar({ tab, onTab, unit, onToggleUnit, user, synced, onSignOut }) {
  return (
    <div className="mb-[22px] flex flex-wrap items-center gap-6">
      <h1 className="flex items-center gap-3 whitespace-nowrap text-3xl font-extrabold tracking-[-0.5px]">
        🍽️ Food Tracker
      </h1>
      <div className="flex gap-1.5 rounded-[15px] bg-[#e1e6ec] p-[5px]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onTab(t.id)}
            className={
              "cursor-pointer select-none rounded-[11px] border-none px-6 py-[11px] text-base font-bold transition " +
              (tab === t.id ? "bg-white text-ink shadow-card" : "bg-transparent text-muted")
            }
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <button
        onClick={onToggleUnit}
        className="cursor-pointer rounded-[11px] border border-line bg-white px-4 py-[9px] text-[15px] font-bold text-accent shadow-card"
      >
        Unit: {unit}
      </button>
      {user && (
        <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-2 shadow-card">
          <span
            className={"h-2 w-2 flex-none rounded-full " + (synced ? "bg-accent2" : "bg-[#c4ccd4]")}
            title={synced ? "Synced" : "Syncing…"}
          />
          {user.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="h-[30px] w-[30px] rounded-full bg-line object-cover"
            />
          )}
          <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold">
            {user.displayName || user.email || "Signed in"}
          </span>
          <button
            onClick={onSignOut}
            className="cursor-pointer rounded-lg border-none bg-transparent px-2 py-1 text-[13px] font-bold text-muted hover:bg-[#f1f4f7] hover:text-danger"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
