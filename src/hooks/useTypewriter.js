import { useEffect, useState } from "react";

/**
 * Types out each word in `words`, pauses, deletes, moves to the next.
 * Under prefers-reduced-motion, just shows the first word statically.
 */
export default function useTypewriter(words, options = {}) {
  const { typingSpeed = 70, deletingSpeed = 40, pause = 1800 } = options;
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(words[0] || "");
      return undefined;
    }

    const current = words[index % words.length] || "";
    let timeout;

    if (!deleting && text === current) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % words.length);
    } else {
      timeout = setTimeout(
        () => {
          setText((t) => (deleting ? current.slice(0, t.length - 1) : current.slice(0, t.length + 1)));
        },
        deleting ? deletingSpeed : typingSpeed
      );
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, index, words, typingSpeed, deletingSpeed, pause]);

  return text;
}
