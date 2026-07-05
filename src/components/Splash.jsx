// Brief branded loading screen shown only while the first auth check runs.
export default function Splash() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-page p-6">
      <div className="text-center">
        <div className="text-[52px] leading-none">🍽️</div>
        <div className="mx-auto mt-4 h-[34px] w-[34px] animate-spin rounded-full border-[3px] border-line border-t-accent" />
      </div>
    </div>
  );
}
