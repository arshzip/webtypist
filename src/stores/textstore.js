import { derived, writable } from "svelte/store";

export const text = writable("");
export const size = derived(text, ($text) => $text.length);
export const started = writable(false);
export const startTimestamp = writable(new Date());
export const ended = writable(false);
export const endTimestamp = writable(new Date());
export const speed = writable(0);
export const accuracy = writable(0);
export const typeFocus = writable(false);
export const prevTest = writable({
  text: "",
  startTimestamp: new Date(),
  endTimestamp: new Date(),
  wrongChars: new Set([]),
  speed: 0,
  accuracy: 0,
});
export const wrongCount = writable(0);

export const charcounter = writable(0);
export const increment = () => charcounter.update((v) => v + 1);
export const decrement = () => charcounter.update((v) => v - 1);

export const wrongChars = writable(new Set([]));

export const title = writable("");
export const instruction = writable("");
export const responseFlag = writable(false);

export const practice = writable(true);

export const defaultMaxError = 0.03;
export const maxError = writable(defaultMaxError);
export const persistError = writable(false);
