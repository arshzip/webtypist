// Lightweight sanity checks for the .typ parser. Run with: npm test
import { setInputScript, parse, nextScriptAction } from "../src/parser/script.js";
import { setMaxError } from "../src/util/Typeutils.js";
import { get } from "svelte/store";
import { maxError, persistError } from "../src/stores/textstore.js";
import { MENU, CLEAR, TUTORIAL, EXIT } from "../src/constants/constants.js";

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (e) {
    failures++;
    console.log(`FAIL  ${name}\n      ${e.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg || "assertion failed");
}

// NOTE: the parser keeps module-level state, so checks share one stream.
check("script not ending in newline still yields first line's action", () => {
  setInputScript('*:MENU\nM: "menu"\n :L1 "lesson"\n\n*:L1\nB:banner\nT:hello');
  parse();
  const a = nextScriptAction();
  assert(a.type === MENU, `expected first action MENU, got "${a.type}"`);
});

check("explicit X: command exits", () => {
  setInputScript("B:banner\nX:\nT:never shown");
  parse();
  let a = nextScriptAction();
  assert(a.type === CLEAR, `expected CLEAR, got "${a.type}"`);
  a = nextScriptAction();
  assert(a.type === EXIT, `expected EXIT after X:, got "${a.type}"`);
});

check("T: command buffers its own text", () => {
  setInputScript("T:hello\nB:banner");
  parse();
  const a = nextScriptAction();
  assert(a.type === TUTORIAL, `expected TUTORIAL, got "${a.type}"`);
  assert(a.payload.instruction === "hello\n", `unexpected text: ${JSON.stringify(a.payload.instruction)}`);
});

check("setMaxError parses gtypist 'E: 2.5 *' (space-star) as persistent", () => {
  setMaxError("2.5 *");
  assert(get(maxError) === 0.025, `maxError=${get(maxError)}`);
  assert(get(persistError) === true, `persistError=${get(persistError)}`);
});

check("setMaxError parses '5.0%*' as persistent", () => {
  setMaxError("5.0%*");
  assert(get(maxError) === 0.05, `maxError=${get(maxError)}`);
  assert(get(persistError) === true, `persistError=${get(persistError)}`);
});

check("setMaxError parses '4%'", () => {
  setMaxError("4%");
  assert(get(maxError) === 0.04, `maxError=${get(maxError)}`);
  assert(get(persistError) === false, `persistError=${get(persistError)}`);
});

check("setMaxError('default') resets without throwing", () => {
  setMaxError("default");
  assert(get(persistError) === false, `persistError=${get(persistError)}`);
});

check("setMaxError ignores malformed input", () => {
  const before = get(maxError);
  setMaxError("not-a-number");
  assert(get(maxError) === before, `maxError changed to ${get(maxError)}`);
});

process.exit(failures ? 1 : 0);
