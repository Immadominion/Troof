import { useEffect, useState } from "react";

// Animated "typewriter" placeholder: types a phrase, pauses, deletes, moves to the next.
// Pass a STABLE phrases array (module-level const) to avoid restarting the loop each render.
export function useTypingPlaceholder(phrases: string[]): string {
  const [text, setText] = useState(phrases[0] ?? "");

  useEffect(() => {
    let phrase = 0;
    let char = phrases[0]?.length ?? 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const full = phrases[phrase] ?? "";
      if (!deleting) {
        char++;
        setText(full.slice(0, char));
        if (char >= full.length) {
          deleting = true;
          timer = setTimeout(tick, 1800);
          return;
        }
        timer = setTimeout(tick, 55);
      } else {
        char--;
        setText(full.slice(0, Math.max(0, char)));
        if (char <= 0) {
          deleting = false;
          phrase = (phrase + 1) % phrases.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 28);
      }
    };

    timer = setTimeout(tick, 1800);
    return () => clearTimeout(timer);
  }, [phrases]);

  return text;
}
