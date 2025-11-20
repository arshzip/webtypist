<!-- TODO: Clean this up and break it into smaller components -->
<script>
  import { onMount } from "svelte";
  import { nextScriptAction, parse, setInputScript, goto, skipLine } from "../parser/script";
  import { CLEAR, DRILL, ERROR_MAX_SET, EXIT, INSTRUCTION, MENU, NGOTO, QUERY, TUTORIAL, YGOTO } from "../constants/constants";
  import Menu from "./Menu.svelte";
  import BtiDisplay from "./BTIDisplay.svelte";
  import { title, instruction, responseFlag, text, practice } from "../stores/textstore";
  import Query from "./Query.svelte";
  import Writebox from "./Writebox.svelte";
  import { setMaxError } from "../util/Typeutils";

  let showWarning = false;
  let file;
  let action;
  let prevAction;
  let showBti = true;
  let showMainMenu = true;
  let qwertyTyps = [
    ["q2.typ", "Quick QWERTY (q) Series"],
    ["r2.typ", "Long QWERTY (r) Series"],
    ["s2.typ", "Speed Drills (s) Series"],
    ["p2.typ", "Programmer (p) Series"],
    ["u2.typ", "QWERTY review (u) Series"],
    ["t2.typ", "QWERTY (t) series"]
    // ["gtypist.typ", "All in 1"],
  ];
  let specialKbTyps = [
    ["n.typ", "Numpad (n) Series"],
    ["c.typ", "Colemak (c) Series"],
    ["d.typ", "Dvorak (d) Series"],
  ];

  async function loadScript(script, local = false) {
    if (!local) {
      let resp = await fetch(`${script}`);
      script = await resp.text();
    }
    setInputScript(script);
    showMainMenu = false;
    parse();
    runTilBlocking();
  }
  onMount(() => {
    showWarning = (window.innerHeight < 600 || window.innerWidth < 800)
    window.addEventListener("resize", () => {
      showWarning = (window.innerHeight < 600 || window.innerWidth < 800)
    })

    document.addEventListener("keydown", (e) => {
      if (showMainMenu && e.key === 'f') document.querySelector("body").requestFullscreen();
    })

    document.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === "n") {
        // if action is drill or query or menu, let their event handlers handle the event
        if (action && (action.type === QUERY || action.type === DRILL || action.type === MENU)) {
          // do nothing
          return;
        }
        runTilBlocking();
      }
    });
    file.addEventListener("change", function () {
      let fr = new FileReader();
      fr.onload = () => loadScript(fr.result, true);
      fr.readAsText(this.files[0]);
    });
  });
  // gets next action and sets prevAction
  function nextAction() {
    prevAction = action;
    action = nextScriptAction();
  }
  // returns true if command needs to "block" execution
  // and wait for user input (drills/menu/query/tutorial/exit)
  function isBlocking(action) {
    return action.type === DRILL || action.type === TUTORIAL || action.type === MENU || action.type === QUERY || action.type === EXIT;
  }
  // keeps fetching next action and applying ui effects
  // until a blocking command is encountered
  function runTilBlocking() {
    while (true) {
      nextAction();
      processAction();
      if (isBlocking(action)) {
        break;
      }
    }
  }

  // applies UI side effects of the action
  //
  function processAction() {
    switch (action.type) {
      case EXIT:
        setInputScript("");
        showMainMenu = true;
        showBti = false;
        break;

      case MENU:
        showBti = false;
        break;

      case CLEAR:
        showBti = true;
        title.set(action.payload.title);
        runTilBlocking();
        break;

      case INSTRUCTION:
        showBti = true;
        instruction.set(action.payload.instruction);
        runTilBlocking();
        break;

      case TUTORIAL:
        showBti = true;
        instruction.set(action.payload.instruction);
        break;

      case DRILL:
        // TUT text is cleared on drills for some reason
        // ref gtypist.c #540
        if (prevAction.type === TUTORIAL) {
          instruction.set("");
        }
        text.set(action.payload.drillScript);
        practice.set(action.payload.practice);
        break;

      case QUERY:
        break;

      case YGOTO:
        if ($responseFlag === true) {
          goto(action.payload.goto_label);
          runTilBlocking();
        } else {
          skipLine();
        }
        break;

      case NGOTO:
        if ($responseFlag === false) {
          goto(action.payload.goto_label);
          runTilBlocking();
        } else {
          skipLine();
        }
        break;

      case ERROR_MAX_SET:
        setMaxError(action.payload.errorStr);
        break;

      default:
        break;
    }
  }
</script>

<input style="display: none" id="type-file" bind:this={file} type="file" />
{#if showWarning}
Mobile devices aren't supported yet.
A screen bigger than 800x600 is recommended
{/if}
{#if showMainMenu}
  <h2>Welcome to webtypist!</h2>
  <h4>Select a series to continue (go with the first one if you're a beginner)</h4>
  <div class="select">
    {#each qwertyTyps as typ}
      <button
        class="scriptButton"
        on:click={() => {
          loadScript(typ[0]);
        }}>{typ[1]}</button
      >
    {/each}
  </div>
  <h2>Special keyboards' series</h2>
  <div class="select">
    {#each specialKbTyps as typ}
      <button
        class="scriptButton special"
        on:click={() => {
          loadScript(typ[0]);
        }}>{typ[1]}</button
      >
    {/each}
  </div>
  <h2>More...</h2>
  <div class="select">
    <button
      class="scriptButton more"
      style="background-color: #004b53; box-shadow: 0px 0px 15px -3px #004b53"
      on:click={() => {
        loadScript("demo.typ");
      }}
    >
      <img src="book-open.svg" alt="book open icon" />

      <span>Make your own lesson (how to)</span></button
    >
    <button
      class="scriptButton more"
      style="background-color: #004b53; box-shadow: 0px 0px 15px -3px #004b53"
      on:click={() => {
        file.click();
      }}
    >
      <!-- <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> -->
      <img src="plus.svg" alt="plus icon" />
      <span>Upload your own .typ</span>
    </button>
    <a href="https://github.com/arshzip/webtypist" target="_blank">
      <button class="scriptButton more" style="background-color: #004b53; box-shadow: 0px 0px 15px -3px #004b53">
        <!-- <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-plus"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> -->
        <img src="github.svg" alt="github icon" />
        <span>Github</span>
      </button>
    </a>
  </div>
{/if}
{#if action}
  {#if showBti}
    <BtiDisplay onComplete={runTilBlocking} {action} />
  {/if}
  {#if action.type === MENU}
    <Menu menuStr={action.payload.menuStr} onComplete={runTilBlocking} />
  {:else if action.type === DRILL}
    <Writebox onComplete={runTilBlocking} />
  {/if}
  {#if action.type === QUERY}
    <div class="modal">
      <Query query={action.payload} onComplete={runTilBlocking} />
    </div>
  {/if}
{/if}


<style>
  .modal {
    position: fixed;
    height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 0;
    top: 0;
    background-color: #151515a8;
  }
  .select {
    display: flex;
    flex-wrap: wrap;
  }
  .scriptButton {
    display: flex;
    flex: 1;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    width: 8rem;
    height: 8rem;
  }
  .special {
    height: 4rem;
  }
  .more {
    height: 5rem;
  }
  h2,
  h4 {
    margin-left: 0.5rem;
  }
  .select > * {
    margin: 0.5rem;
  }
</style>
