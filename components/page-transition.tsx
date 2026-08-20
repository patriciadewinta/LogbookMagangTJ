import { ViewTransition } from "react";

// Wrapper transisi antar halaman. Navigasi biasa → fade + rise ringan.
// Link dengan transitionTypes "nav-forward"/"nav-back" → slide directional.
// Pasang di dalam <main> tiap page (sidebar tidak ikut bergerak).
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "page-enter",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "page-exit",
      }}
    >
      {children}
    </ViewTransition>
  );
}
