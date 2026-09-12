// Walks every lesson in /public through the parser, simulating user
// choices, to make sure the real .typ files parse and execute without
// throwing. Menu options are chosen round-robin per menu (lessons loop
// back to their menu via G:/N: commands); queries are answered "Y" so
// linear lessons run to completion.
// Run with: npm run test:lessons
import { readdirSync, readFileSync } from "node:fs";
import { goto, nextScriptAction, parse, setInputScript, skipLine } from "../src/parser/script.js";
import { EXIT, MENU, NGOTO, YGOTO } from "../src/constants/constants.js";

const STEP_BUDGET = 100000;
let failures = 0;

for (const file of readdirSync(new URL("../public/", import.meta.url))) {
  if (!file.endsWith(".typ")) continue;
  try {
    setInputScript(readFileSync(new URL(`../public/${file}`, import.meta.url), "utf8"));
    parse();
    let steps = 0;
    let done = false;
    const menuVisits = new Map();
    const counts = {};
    while (!done && steps++ < STEP_BUDGET) {
      const action = nextScriptAction();
      counts[action.type] = (counts[action.type] || 0) + 1;
      switch (action.type) {
        case EXIT:
          done = true;
          break;
        case MENU: {
          // first buffered line is the menu title, the rest are options
          const lines = action.payload.menuStr.split("\n").filter(Boolean);
          const options = lines.slice(1);
          const visits = menuVisits.get(action.payload.menuStr) ?? 0;
          menuVisits.set(action.payload.menuStr, visits + 1);
          if (visits < options.length) {
            goto(options[visits].split('"')[0].trim());
          } else {
            // every option of this menu has been exercised
            done = true;
          }
          break;
        }
        case YGOTO:
          goto(action.payload.goto_label);
          break;
        case NGOTO:
          skipLine(); // answered "Y": fall through to what follows
          break;
      }
    }
    if (steps >= STEP_BUDGET) throw new Error(`did not reach EXIT within ${STEP_BUDGET} steps (loop?)`);
    console.log(
      `PASS  ${file}  (${steps} steps: ${Object.entries(counts)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ")})`,
    );
  } catch (e) {
    failures++;
    console.log(`FAIL  ${file}\n      ${e.message}`);
  }
}

process.exit(failures ? 1 : 0);
