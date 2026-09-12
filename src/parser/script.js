// TODO: Rewrite this file using Douglas Crockford's classless architecture

import { ALT_COMMENT, CLEAR, COMMENT, CONT, DRILL, DRILL_PRACTICE_ONLY, EXIT, INSTRUCTION, LABEL, MENU, SPEEDTEST, SPEEDTEST_PRACTICE_ONLY, TUTORIAL, GOTO, QUERY, YGOTO, NGOTO, ERROR_MAX_SET } from "../constants/constants";

let global_index = 0;
let global_label_index = new Map();
let global_typeArr = [];
let global_line = "";
let prevLabel = "";
let global_menu_history = [];

function scrCommand(line) {
  if (line.length === 0) return "";
  return line[0];
}

function scrData(line) {
  if (line.length < 2) {
    throw Error("Line doesn't contain data");
  }
  return line.slice(2);
}

function eof() {
  return !(global_index < global_typeArr.length);
}

function isSkipped(command) {
  return command === "" || command === COMMENT || command === ALT_COMMENT;
}

// buffer up the complete data from a command
function bufferCommand() {
  let buffer = "";
  do {
    buffer += scrData(global_line);
    buffer += "\n";
    getNextLine();
  } while (scrCommand(global_line) === CONT && !eof());
  return buffer;
}

export function buildLabelIndex() {
  global_index = 0;
  while (!eof()) {
    getNextLine();
    if (scrCommand(global_line) === LABEL) {
      global_label_index.set(scrData(global_line).trim(), global_index);
    }
  }
  // reset to the start of the script; global_line must be cleared too,
  // otherwise the first action would be built from the *last* line
  // of the script (matters for scripts without a trailing newline)
  global_index = 0;
  global_line = "";
}

export function parse() {
  buildLabelIndex();
}

function getLabelIndex(label) {
  if (global_label_index.has(label)) {
    return global_label_index.get(label);
  } else throw Error("label not found: " + label);
}

// gets next non-empty noncomment line
function getNextLine() {
  if (eof()) {
    return "";
  }
  let command;
  do {
    global_line = global_typeArr[global_index].trimEnd();
    command = scrCommand(global_line);
    global_index++;
  } while (isSkipped(command) && !eof());

  if (global_index === global_typeArr.length && isSkipped(command)) {
    return "";
  }
  return global_line;
}

// if G: command then called without argument (with script action loop)
// then the label is read from the current line
// if called by user navigation, label argument is supplied
export function goto(label = undefined) {
  if (!label) label = scrData(global_line);
  let index = getLabelIndex(label);
  prevLabel = label;
  global_index = index;

  getNextLine();
}

// returns to the menu the current lesson was started from.
// no-op when there is no menu to go back to.
export function backToMenu() {
  if (!canBackToMenu()) return;
  let label = global_menu_history.pop();
  goto(label);
}

export function canBackToMenu() {
  return global_menu_history.length > 0;
}

export function hasPrevMenu() {
  return global_menu_history.length > 1;
}

export function prevMenu() {
  if (!hasPrevMenu()) return;
  global_menu_history.pop();
  let label = global_menu_history.pop();
  goto(label);
}

// gets and returns the next action to take
// only called externally
export function nextScriptAction() {
  while (!eof()) {
    let command = scrCommand(global_line);
    let buf;

    switch (command) {
      case MENU:
        buf = bufferCommand();
        global_menu_history.push(prevLabel);
        return { type: MENU, payload: { menuStr: buf } };

      case CLEAR:
        buf = bufferCommand();
        return { type: CLEAR, payload: { title: buf.trim() } };

      case INSTRUCTION:
        buf = bufferCommand();
        return { type: INSTRUCTION, payload: { instruction: buf } };

      case DRILL:
      case SPEEDTEST:
        buf = bufferCommand();
        return { type: DRILL, payload: { drillScript: buf, practice: false } };

      case SPEEDTEST_PRACTICE_ONLY:
      case DRILL_PRACTICE_ONLY:
        buf = bufferCommand();
        return { type: DRILL, payload: { drillScript: buf, practice: true } };

      case TUTORIAL:
        buf = bufferCommand();
        return { type: TUTORIAL, payload: { instruction: buf } };

      case GOTO:
        goto();
        break;

      case QUERY:
        buf = bufferCommand();
        return { type: QUERY, payload: { queryText: buf } };

      case YGOTO:
        return { type: YGOTO, payload: { goto_label: scrData(global_line) } };

      case NGOTO:
        return { type: NGOTO, payload: { goto_label: scrData(global_line) } };

      case ERROR_MAX_SET:
        buf = bufferCommand();
        return { type: ERROR_MAX_SET, payload: { errorStr: buf } };

      case EXIT:
        return { type: EXIT };

      case LABEL:
        prevLabel = scrData(global_line).trim();
        getNextLine();
        break;
      default:
        getNextLine();
        break;
    }
  }
  return { type: EXIT };
}

export function setInputScript(script) {
  global_index = 0;
  global_label_index = new Map();
  global_typeArr = [];
  global_line = "";
  prevLabel = "";
  global_menu_history = [];
  global_typeArr = script.split("\n");
}

export function skipLine() {
  getNextLine();
}

export function getCurrentMenuLabel() {
  return global_menu_history[global_menu_history.length - 1] ?? "";
}

export function getCurrentLabel() {
  return prevLabel;
}

export function isScriptLoaded() {
  // note: "".split("\n") yields [""], so check for actual content
  return global_typeArr.some((line) => line.trim().length > 0);
}

function saveParserState() {
  return { index: global_index, line: global_line, label: prevLabel, menuLen: global_menu_history.length };
}

function restoreParserState(s) {
  global_index = s.index;
  global_line = s.line;
  prevLabel = s.label;
  global_menu_history.length = s.menuLen;
}

// Statically walks a menu option's section (the code executed after
// jumping to optionLabel, up to the next sibling option of the same menu,
// a submenu, or the end of the script) WITHOUT disturbing the live parser
// state. Reports how many drills the section contains and which labels
// belong to it — used for lesson completion tracking.
export function analyzeSection(optionLabel, siblingLabels) {
  const saved = saveParserState();
  const siblings = new Set(siblingLabels);
  siblings.delete(optionLabel);
  try {
    goto(optionLabel);
    const labels = new Set();
    let drills = 0;
    for (let guard = 0; guard < 10000; guard++) {
      if (siblings.has(prevLabel)) break;
      const action = nextScriptAction();
      if (action.type === EXIT || action.type === MENU) break;
      if (siblings.has(prevLabel)) break; // execution entered the next section
      if (action.type === DRILL) drills++;
      labels.add(prevLabel);
      // follow the "continue" path on lesson-transition queries
      if (action.type === YGOTO) goto(action.payload.goto_label);
      else if (action.type === NGOTO) skipLine();
    }
    return { drills, labels };
  } catch {
    return { drills: 0, labels: new Set([optionLabel]) };
  } finally {
    restoreParserState(saved);
  }
}
