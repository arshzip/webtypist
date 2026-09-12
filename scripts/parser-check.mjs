// Lightweight sanity checks for the .typ parser. Run with: npm test
import { setInputScript, parse, nextScriptAction, analyzeSection, getCurrentLabel, getCurrentMenuLabel, isScriptLoaded } from "../src/parser/script.js";
import { setMaxError } from "../src/util/Typeutils.js";
import { get } from "svelte/store";
import { maxError, persistError } from "../src/stores/textstore.js";
import { MENU, CLEAR, TUTORIAL, EXIT, DRILL } from "../src/constants/constants.js";

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

check("menu label access + section analysis (and no state leaks)", () => {
  const script = ["*:TOP", 'M: "menu"', ' :L1 "one"', ' :L2 "two"', "", "*:L1", "B:banner one", "D:drill1a", " :x", "I:instr", "D:drill1b", " :y", "Q: continue?", "N:TOP", "", "*:L2", "D:drill2a", " :z", "X:", ""].join("\n");
  setInputScript(script);
  parse();
  assert(isScriptLoaded(), "script should count as loaded");
  const first = nextScriptAction();
  assert(first.type === MENU, `expected MENU, got "${first.type}"`);
  assert(getCurrentMenuLabel() === "TOP", `menu label="${getCurrentMenuLabel()}"`);

  const s1 = analyzeSection("L1", ["L1", "L2"]);
  assert(s1.drills === 2, `L1 drills=${s1.drills}`);
  assert(s1.labels.has("L1"), "L1 labels should contain L1");
  const s2 = analyzeSection("L2", ["L1", "L2"]);
  assert(s2.drills === 1, `L2 drills=${s2.drills}`);
  assert(!s1.labels.has("L2") && !s2.labels.has("L1"), "sections should be disjoint");

  // analysis must not disturb the live parser stream
  assert(getCurrentMenuLabel() === "TOP", "menu history leaked during analysis");
  const next = nextScriptAction();
  assert(next.type === CLEAR, `stream disturbed: expected CLEAR, got "${next.type}"`);
  assert(getCurrentLabel() === "L1", `current label=${getCurrentLabel()}`);
});

check("empty script reports not loaded", () => {
  setInputScript("");
  parse();
  assert(!isScriptLoaded(), "empty script should not count as loaded");
});

process.exit(failures ? 1 : 0);
