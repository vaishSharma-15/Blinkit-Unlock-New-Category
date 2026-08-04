/**
 * The pale, oversized sign-off block real Blinkit closes every page with:
 * "India's last minute app ♥", a thin diagonal rule, then the wordmark. Purely
 * decorative brand chrome, so it's marked aria-hidden and lives at the very
 * end of a page's content, after anything actually functional.
 */
export default function AppFooterMark() {
  return (
    <div aria-hidden="true" className="px-4 pt-10 pb-6 select-none">
      <p className="text-[34px] leading-[1.08] font-extrabold tracking-tight text-[#d7dae1]">
        India&rsquo;s last
        <br />
        minute app <span className="text-[#ff5a5f]">♥</span>
      </p>
      <div className="my-5 h-px w-full origin-left -rotate-1 bg-[#e5e7eb]" />
      <p className="text-[15px] font-extrabold tracking-tight text-[#d7dae1]">
        blinkit
      </p>
    </div>
  );
}
