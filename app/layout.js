import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Blinkit's actual brand typeface isn't a font this app can legitimately
 * ship — it's not confirmed to be freely licensed, and using it without that
 * would be the same category of problem as fabricating a "real" review or
 * lifting a photo without rights. Plus Jakarta Sans is the closest freely
 * licensed stand-in: a bold, slightly rounded grotesque with the same
 * confident-headline weight the real app uses for things like "14 minutes".
 * A deliberate approximation, not a claim to the genuine article.
 */
const appFont = Plus_Jakarta_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Blinkit — Unlock New Category",
  description:
    "Demo of the Unlock New Category feature inside a Blinkit-style app shell.",
};

/**
 * iOS status bar and Dynamic Island, drawn over the app's yellow header the
 * way it sits on the real device.
 *
 * The clock is a fixed 9:41 rather than the live time on purpose: a server
 * render and a client render would disagree about "now" and React would flag
 * the hydration mismatch. It's also the time Apple puts in every screenshot.
 */
function StatusBar() {
  return (
    <div
      className="relative h-[54px] shrink-0 items-center justify-between bg-blinkit-yellow px-8 pt-2"
      style={{ display: "flex" }}
    >
      <span className="text-[15px] font-semibold tracking-tight">9:41</span>

      {/* Dynamic Island */}
      <span className="absolute top-2.5 left-1/2 h-[32px] w-[112px] -translate-x-1/2 rounded-full bg-black" />

      <span className="flex items-center gap-1.5">
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon />
      </span>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" opacity="0.35" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
      <path d="M8 11.2 5.9 8.7a3.3 3.3 0 0 1 4.2 0z" />
      <path
        d="M3.6 6.1a6.8 6.8 0 0 1 8.8 0M1.2 3.4a10.4 10.4 0 0 1 13.6 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden="true">
      <rect
        x="0.6"
        y="0.6"
        width="21"
        height="11.8"
        rx="3.4"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.2"
      />
      <rect x="2.4" y="2.4" width="13" height="8.2" rx="2" fill="currentColor" />
      <path
        d="M23.4 4.6v3.8a2.2 2.2 0 0 0 0-3.8z"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${appFont.variable} h-full antialiased`}>
      {/*
       * The device frame is styled INLINE, on purpose.
       *
       * It was in a stylesheet behind a media query — first on viewport width,
       * then on pointer type — and both failed on the machine it needed to work
       * on, showing the app full-window with no phone. Inline styles have no
       * condition to fail and cannot be defeated by a stale cached stylesheet,
       * which is the other thing that went wrong here.
       *
       * Consequence worth knowing: the frame now renders everywhere, including
       * on a real phone, where you'd get a phone drawn inside a phone.
       */}
      <body
        className="flex justify-center overflow-hidden"
        style={{
          height: "100dvh",
          alignItems: "center",
          background: "#000",
          paddingBlock: "20px",
        }}
      >
        {/*
         * An iPhone, at iPhone 15 logical size: 393 × 852, 19.5:9.
         *
         * On anything with a mouse you get the whole device — bezel, status
         * bar, Dynamic Island, home indicator. On a touch device the frame and
         * the fake iOS chrome are switched off (see .device-frame in
         * globals.css), because a real iPhone draws its own status bar and two
         * of them stacked would be absurd.
         *
         * The middle div is the scroll container, deliberately: that's what
         * makes the search bar pin and the nav float against the device edge
         * rather than the browser window. It needs a bounded height to do it —
         * unconstrained, it grows to fit its content, never scrolls, and
         * `sticky bottom-0` silently drops the nav off the end of the page.
         */}
        <div
          className="relative flex flex-col overflow-hidden bg-white"
          style={{
            /* iPhone 15 logical size, 19.5:9. */
            width: "393px",
            height: "852px",
            maxHeight: "calc(100dvh - 40px)",
            flex: "none",
            border: "11px solid #16161a",
            borderRadius: "56px",
            boxShadow: "0 0 0 2px #2c2c31, 0 30px 90px rgba(0,0,0,0.75)",
          }}
        >
          <StatusBar />

          <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain">
            {children}
          </div>

          {/* Home indicator. Sits below the floating nav, as on the device. */}
          <div
            className="shrink-0 justify-center bg-white pt-1 pb-2"
            style={{ display: "flex" }}
          >
            <span className="h-[5px] w-[134px] rounded-full bg-black/85" />
          </div>
        </div>
      </body>
    </html>
  );
}
