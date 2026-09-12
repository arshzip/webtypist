import { get } from "svelte/store";
import { defaultMaxError, maxError, persistError, wrongChars, wrongCount } from "../stores/textstore";

export const wrongCharUtils = () => {
  function add(charIndex) {
    wrongChars.update((w) => w.add(charIndex));
  }
  function remove(charIndex) {
    wrongChars.update((w) => {
      w.delete(charIndex);
      return w;
    });
  }
  function clear() {
    wrongCount.set(0);
    wrongChars.set(new Set([]));
  }
  function count() {
    return get(wrongCount);
  }
  function has(i) {
    return get(wrongChars).has(i);
  }
  function inc() {
    wrongCount.update((v) => v + 1);
  }
  return { add, clear, count, has, inc, remove };
};

// Parses gtypist "E:" arguments. Supported forms:
//   "default"        reset to the default max error rate, non-persistent
//   "4" / "4%"       4% max error for the next drill
//   "5.0%*"          5% max error, persistent for the rest of the script
//   "2.5 *"          same as above (classic gtypist spacing)
export function setMaxError(errorStr) {
  errorStr = errorStr.trim();
  if (errorStr.toLowerCase() === "default") {
    maxError.set(defaultMaxError);
    persistError.set(false);
    return;
  }
  const errorPct = parseFloat(errorStr) / 100;
  if (Number.isNaN(errorPct)) return; // malformed E: line — keep current setting
  maxError.set(errorPct);
  persistError.set(/\*\s*$/.test(errorStr));
}
