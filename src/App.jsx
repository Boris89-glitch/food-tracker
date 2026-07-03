import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { CONFIGURED, auth, db } from "./firebase.js";
import { loadInitialData, writeLS } from "./lib/model.js";
import AuthGate from "./components/AuthGate.jsx";
import TopBar from "./components/TopBar.jsx";
import TodayTab from "./components/TodayTab.jsx";
import WeightTab from "./components/WeightTab.jsx";
import HistoryTab from "./components/HistoryTab.jsx";

export default function App() {
  // user: undefined = auth state unknown yet, null = signed out,
  // "local" = offline/local-only mode, otherwise the Firebase user.
  const [user, setUser] = useState(CONFIGURED ? undefined : null);
  const [data, setData] = useState(loadInitialData);
  const [synced, setSynced] = useState(true);
  const [tab, setTab] = useState("today");

  const userRef = useRef(null);
  const saveTimer = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const scheduleCloudSave = useCallback((next) => {
    if (!userRef.current) return;
    setSynced(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setDoc(doc(db, "users", userRef.current), { ...next, updatedAt: serverTimestamp() })
        .then(() => setSynced(true))
        .catch((err) => {
          console.error("Sync failed", err);
          setSynced(false);
        });
    }, 500);
  }, []);

  // Every state mutation goes through here: localStorage is written
  // synchronously (instant + offline), Firestore is debounced.
  const update = useCallback(
    (fn) => {
      setData((prev) => {
        const next = fn(prev);
        writeLS(next);
        scheduleCloudSave(next);
        return next;
      });
    },
    [scheduleCloudSave]
  );

  useEffect(() => {
    if (!CONFIGURED) return;
    let unsubSnap = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (unsubSnap) {
        unsubSnap();
        unsubSnap = null;
      }
      setUser(u);
      userRef.current = u ? u.uid : null;
      if (!u) return;

      const ref = doc(db, "users", u.uid);
      unsubSnap = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            // A "missing" doc served from the local cache is NOT authoritative:
            // the server copy may well exist (e.g. data written from another
            // device). Wait for the server snapshot before deciding this is a
            // new account — otherwise we'd overwrite real cloud data with this
            // device's local seed.
            if (snap.metadata.fromCache) return;
            // Genuinely new account: seed the cloud doc from this device.
            setDoc(ref, { ...dataRef.current, updatedAt: serverTimestamp() }).catch((e) =>
              console.error(e)
            );
            setSynced(true);
            return;
          }
          if (snap.metadata.hasPendingWrites) {
            setSynced(false); // our own optimistic write
            return;
          }
          const d = snap.data();
          const next = {
            foods: d.foods || [],
            logs: d.logs || {},
            goal: typeof d.goal === "number" ? d.goal : 2000,
            weight: d.weight || {},
            unit: d.unit || "kg",
          };
          setData(next);
          writeLS(next);
          setSynced(true);
        },
        (err) => {
          console.error("Snapshot error", err);
          setSynced(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubSnap) unsubSnap();
    };
  }, []);

  const signOut = useCallback(() => {
    userRef.current = null;
    fbSignOut(auth);
  }, []);

  const signedIn = user === "local" || (user && user !== "local");
  if (!signedIn) {
    return <AuthGate loading={user === undefined} onLocal={() => setUser("local")} />;
  }

  return (
    <div className="mx-auto max-w-[1680px] px-[34px] pb-[60px] pt-[max(26px,env(safe-area-inset-top))]">
      <TopBar
        tab={tab}
        onTab={setTab}
        unit={data.unit}
        onToggleUnit={() => update((d) => ({ ...d, unit: d.unit === "kg" ? "lb" : "kg" }))}
        user={user === "local" ? null : user}
        synced={synced}
        onSignOut={signOut}
      />
      <div className={tab === "today" ? "" : "hidden"}>
        <TodayTab data={data} update={update} />
      </div>
      <div className={tab === "weight" ? "" : "hidden"}>
        <WeightTab data={data} update={update} visible={tab === "weight"} />
      </div>
      <div className={tab === "history" ? "" : "hidden"}>
        <HistoryTab data={data} visible={tab === "history"} />
      </div>
    </div>
  );
}
