import { useCallback, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { CONFIGURED, auth, db, completeGoogleRedirect, signInWithGoogle } from "./firebase.js";
import { loadInitialData, writeLS } from "./lib/model.js";
import { useI18n } from "./lib/i18n.js";
import Splash from "./components/Splash.jsx";
import TopBar from "./components/TopBar.jsx";
import TodayTab from "./components/TodayTab.jsx";
import WeightTab from "./components/WeightTab.jsx";
import HistoryTab from "./components/HistoryTab.jsx";

export default function App() {
  // user: undefined = auth state unknown yet (first paint only), null = signed
  // out / local-only mode, otherwise the Firebase user. Signed-out is a fully
  // usable local mode — sign-in is optional and only enables cloud sync.
  const [user, setUser] = useState(CONFIGURED ? undefined : null);
  const [data, setData] = useState(loadInitialData);
  const [synced, setSynced] = useState(true);
  const [tab, setTab] = useState("today");
  const [signInErr, setSignInErr] = useState("");
  const { t } = useI18n();

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

    // Finish any redirect-based sign-in from a previous page load.
    completeGoogleRedirect().catch((e) => {
      if (e) setSignInErr(e.message || "");
    });

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

  const signIn = useCallback(() => {
    setSignInErr("");
    signInWithGoogle().catch((e) => {
      if (e && e.code === "auth/popup-closed-by-user") return;
      setSignInErr((e && e.message) || "");
    });
  }, []);

  const signOut = useCallback(() => {
    userRef.current = null;
    fbSignOut(auth);
  }, []);

  // Show a branded splash only while the very first auth check is pending, so
  // the app never flashes signed-out UI before Firebase restores the session.
  if (user === undefined) return <Splash />;

  return (
    <div className="mx-auto max-w-[1680px] px-4 pb-10 pt-[max(14px,env(safe-area-inset-top))] sm:px-[34px] sm:pb-[60px] sm:pt-[max(26px,env(safe-area-inset-top))]">
      <TopBar
        tab={tab}
        onTab={setTab}
        unit={data.unit}
        onToggleUnit={() => update((d) => ({ ...d, unit: d.unit === "kg" ? "lb" : "kg" }))}
        user={user}
        synced={synced}
        canSignIn={CONFIGURED}
        onSignIn={signIn}
        signInErr={signInErr}
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
      <footer className="mt-10 border-t border-line pt-4 text-center text-sm text-muted sm:mt-14">
        {t("footerCredit")}{" "}
        <a
          href="https://www.upwork.com/freelancers/~01b9f151ec60832f96"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-accent hover:underline"
        >
          Boris Colic
        </a>
      </footer>
    </div>
  );
}
