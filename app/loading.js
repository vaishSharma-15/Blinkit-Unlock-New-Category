/**
 * Route-level loading state.
 *
 * Both pages read a cookie to decide who they're rendering for, which makes
 * them dynamic — so navigation waits on the server. Without this, tapping a
 * category is a blank pause on a phone. The skeleton keeps the shell's shape
 * so the swap-in doesn't jump.
 */
export default function Loading() {
  return (
    <div className="flex w-full flex-1 flex-col bg-white">
      <div className="h-[52px] animate-pulse bg-[#fffbe6]" />
      <div className="h-[64px] animate-pulse bg-blinkit-yellow/60" />

      <div className="px-4 py-2.5">
        <div className="h-[44px] animate-pulse rounded-xl bg-[#f1f1f3]" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[230px] animate-pulse rounded-xl bg-[#f1f1f3]"
          />
        ))}
      </div>

      <p className="sr-only" role="status">
        Loading
      </p>
    </div>
  );
}
