import { writable } from "svelte/store";

// Lesson progress, persisted to localStorage. Shape:
// {
//   completed: { [scriptFile]: { [menuOptionLabel]: true } },
//   last: { file, label, text } | undefined   // for "continue where you left off"
// }
const KEY = "webtypist-progress-v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export const progress = writable(load());

progress.subscribe((value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode etc.) — keep going without persistence
  }
});

export function markLessonComplete(file, label) {
  progress.update((p) => ({
    ...p,
    completed: {
      ...(p.completed || {}),
      [file]: { ...(p.completed?.[file] || {}), [label]: true },
    },
  }));
}

export function setLastPlayed(file, label, text) {
  progress.update((p) => ({ ...p, last: { file, label, text } }));
}

export function resetProgress() {
  progress.set({});
}
