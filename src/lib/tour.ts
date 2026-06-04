import { driver, type DriveStep } from "driver.js";

// A guided coachmark tour that points at the real UI (not a static dialog).
// Steps whose target isn't on the page (e.g. the starter tiles once a chat has begun) are skipped.
export function startTour() {
  const all: DriveStep[] = [
    {
      element: "#tour-composer",
      popover: {
        title: "Ask about anything on Sui",
        description: "Paste a wallet or a token here, or a proof link to verify. The agent reads it live through Tatum.",
      },
    },
    {
      element: "#tour-mode",
      popover: {
        title: "Fast or Thinking",
        description: "Fast uses Haiku and is snappy. Switch to Thinking for deeper, multi-step questions.",
      },
    },
    {
      element: "#tour-tiles",
      popover: {
        title: "Or tap a starter",
        description: "New here? Try one: spot a fake SUI, score the real one, or explain a wallet.",
      },
    },
    {
      element: "#tour-connect",
      popover: {
        title: "Connect to unlock",
        description: "Free to try. Connect a Sui wallet for unlimited analyses and to keep your proofs.",
      },
    },
  ];

  const steps = all.filter(
    (s) => typeof s.element === "string" && document.querySelector(s.element),
  );
  if (steps.length === 0) return;

  driver({
    showProgress: true,
    overlayColor: "rgba(0,0,0,0.7)",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Got it",
    steps,
  }).drive();
}
