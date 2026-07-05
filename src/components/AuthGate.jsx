import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { CONFIGURED, auth } from "../firebase.js";
import { useI18n } from "../lib/i18n.js";

const GoogleMark = () => (
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-none">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export default function AuthGate({ loading, onLocal }) {
  const { t } = useI18n();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CONFIGURED) return;
    getRedirectResult(auth).catch((e) => {
      if (e) setErr(e.message || t("signInFailed"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = () => {
    setErr("");
    setBusy(true);
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((e) => {
      setBusy(false);
      if (
        e &&
        (e.code === "auth/popup-blocked" ||
          e.code === "auth/cancelled-popup-request" ||
          e.code === "auth/operation-not-supported-in-this-environment")
      ) {
        signInWithRedirect(auth, provider);
      } else if (e && e.code === "auth/popup-closed-by-user") {
        // user closed it — no error message needed
      } else {
        setErr((e && e.message) || t("signInFailedRetry"));
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-page p-6">
      <div className="w-full max-w-[400px] rounded-[22px] border border-line bg-white px-[34px] py-[38px] text-center shadow-pop">
        <div className="text-[52px] leading-none">🍽️</div>
        <h2 className="mb-1.5 mt-3.5 text-[26px] font-extrabold tracking-[-0.5px]">
          Food Tracker
        </h2>
        <p className="mb-[22px] text-base text-muted">
          {CONFIGURED ? t("authSyncPrompt") : t("authLocalPrompt")}
        </p>
        {loading ? (
          <div className="mx-auto mt-1.5 h-[34px] w-[34px] animate-spin rounded-full border-[3px] border-line border-t-accent" />
        ) : CONFIGURED ? (
          <button
            onClick={signIn}
            disabled={busy}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[13px] border border-line bg-white px-[18px] py-3.5 text-base font-bold text-ink shadow-card hover:border-[#c7ced6] hover:bg-[#fafbfc] disabled:cursor-default disabled:opacity-60"
          >
            <GoogleMark />
            {t("continueGoogle")}
          </button>
        ) : (
          <button
            onClick={onLocal}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-[13px] border border-line bg-white px-[18px] py-3.5 text-base font-bold text-ink shadow-card hover:border-[#c7ced6] hover:bg-[#fafbfc]"
          >
            {t("continueOffline")}
          </button>
        )}
        <p className="mt-3.5 min-h-[18px] text-sm font-semibold text-danger">{err}</p>
      </div>
    </div>
  );
}
