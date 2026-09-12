<script>
  import { onMount } from "svelte";
  import { accuracy, charcounter, decrement, defaultMaxError, endTimestamp, ended, increment, maxError, persistError, practice, prevTest, size, speed, startTimestamp, started, text, typeFocus, wrongChars } from "../stores/textstore";
  import { wrongCharUtils } from "../util/Typeutils";
  import Progressbox from "./Progressbox.svelte";

  let wc = wrongCharUtils();
  let failed = false;
  export let onComplete;
  // called every time a drill is finished without failing
  // (used for lesson completion tracking)
  export let onDrillPassed = () => {};
  $: $text, handleTextChange();
  onMount(() => {
    reset();
    startTest();
  });

  // used when 2 drills are in a row (because onMount is not called)
  // as parent component just changes $text without changing the action type
  function handleTextChange() {
    // we need to check if drill is mounted for the first time
    // if not, progbox will be null and we wont be able to set focus
    // in this case unmount will run soon
    if (!progbox) return;
    reset();
    startTest();
  }

  function reset() {
    wc.clear();
    charcounter.set(0);
    started.set(false);
  }

  function startTest() {
    failed = false;
    if ($text.length > 0) {
      ended.set(false);
      restart();
      started.set(true);
    }
  }

  function restart() {
    wc.clear();
    charcounter.set(0);
    progbox.focus();
    typeFocus.set(true);
  }

  function endTest() {
    let now = new Date();
    endTimestamp.set(now);
    // guard against a 0s elapsed time (Infinity wpm)
    let elapsed = Math.max((now.getTime() - $startTimestamp.getTime()) / 1000, 0.001);
    speed.set(Math.round(($size * 12) / elapsed));
    accuracy.set(1 - wc.count() / $size);
    prevTest.set({
      text: $text,
      startTimestamp: $startTimestamp,
      endTimestamp: now,
      wrongChars: $wrongChars,
      speed: $speed,
      accuracy: $accuracy,
    });
    failed = !$practice && wc.count() / $size > $maxError;
    if (!failed) onDrillPassed();
    // typist completed drill with nonpersistent error
    // set error as default for further drills
    if (!failed && !$persistError) {
      maxError.set(defaultMaxError);
    }
    reset();
    ended.set(true);
  }

  let progbox;
  // handles esc and backspace (only detected by keydown)
  // needs to be triggered only when
  // typeFocus is set
  const handleOther = (e) => {
    if (e.key === "Escape") restart();
    // backspace
    if (e.key === "Backspace") {
      if (e.ctrlKey || e.altKey) {
        let newCharCounter = $charcounter;

        // Skip over any initial whitespace
        while (newCharCounter > 0 && $text[newCharCounter - 1].trim() === '') {
            newCharCounter--;
        }

        // Then find the start of the word
        while (newCharCounter > 0 && $text[newCharCounter - 1].trim() !== '') {
            newCharCounter--;
        }

        charcounter.set(newCharCounter)
      }
      else if ($charcounter > 0) decrement();
      
    }

  };

  onMount(() => {
    const handlePromptKeypress = (e) => {
      if ($ended && !$started) {
        if (e.key === "r") {
          startTest();
        } else if (e.key === "n") {
          if (!failed) onComplete();
        }
      }
    };
    document.addEventListener("keypress", handlePromptKeypress);
    // document.addEventListener("keyup", handlePromptKeypress);
    return () => {
      document.removeEventListener("keypress", handlePromptKeypress);
      // document.removeEventListener("keyup", handlePromptKeypress);
    };
  });

  const handleKeyPress = (e) => {
    // test has ended and a new one hasn't started
    // put actions like Next, Repeat and Exit here

    // DIRTY HACK: sometimes while pressing Enter on the menu
    // it registers as a keystroke here. There has to be a better
    // way to handle this. doesn't happen always I can't figure out why
    if ($charcounter === 0 && e.key === "Enter" && $text[$charcounter] !== "\n") return;

    // safari detects escape as a keypress event for some
    // odd reason
    if (e.key === "Escape") return;
    if (!$started || !$typeFocus) return;
    if ($charcounter === 0) startTimestamp.set(new Date());

    if (e.key === $text[$charcounter] || ($text[$charcounter] === "\n" && e.key === "Enter")) {
      //TODO: typeahead and typebefore error recognition
      // if we are correcting a letter, we want
      // it to unhighlight but still count as
      // an error
      if (wc.has($charcounter)) {
        wc.remove($charcounter);
      }
    } else {
      if (!wc.has($charcounter)) {
        wc.add($charcounter);
        wc.inc();
      }
    }
    // move charcounter fwd
    increment();
    // end test if we've reached the end
    if ($size === $charcounter) {
      endTest();
    }
  };
</script>

<div>
  <input
    tabindex="-1"
    bind:this={progbox}
    on:keypress={handleKeyPress}
    on:keydown={handleOther}
    on:blur={() => {
      typeFocus.set(false);
    }}
    class="wordInput"
    style="height:0; width: 0; outline: none; border: none"
  />
  <Progressbox />
  {#if $started}
    <div id="drillNav">
      <button class="inlineBtn" on:click={startTest}>↺ Restart (Esc)</button>

      <!-- {#if $charcounter > $size/2} -->
      <!-- // allow skipping only if atleast 50% exercise is done -->
      <!-- // discourages a user from skipping through drills -->
      <!-- <a href="#" on:click={onComplete}>Skip ⏯</a> -->
      <!-- {/if} -->
    </div>
  {/if}
  {#if $ended && !$started}
    <div id="drillNav">
      <button class="inlineBtn" on:click={startTest}>↺ Restart (R)</button>
      {#if !failed}
        <button class="inlineBtn" on:click={onComplete}>Next (N) →</button>
      {:else}
        <div id="errorWarning">Error rate > {($maxError * 100).toFixed(1)}%, restart</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  #drillNav {
    display: flex;
    justify-content: space-between;
    font-size: 1.2rem;
    font-weight: 500;
    margin: 0.8rem 0;
    /* padding: 0.5rem 0; */
  }
  #errorWarning {
    opacity: 0.5;
  }
  input {
    height: 3rem;
  }
  div:focus-visible {
    outline: 0;
  }
</style>
