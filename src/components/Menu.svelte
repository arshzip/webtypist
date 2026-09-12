<script>
  import { onMount } from "svelte";
    import { goto, hasPrevMenu, prevMenu } from "../parser/script";

  export let menuStr;
  export let onComplete;
  let showBack = false;
  let highlighted = 0;
  $: menuStr, showBack = hasPrevMenu()
  $: menuLines = parseMenu(menuStr);
  // first line is the title of the menu
  $: menuOptions = menuLines.slice(1);
  $: title = menuLines[0]?.content ?? "";


  function getLabelAndContent(str) {
    let arr = str.split('"');
    return {
      label: arr[0].trim(),
      content: str.slice(str.indexOf('"') + 1, str.lastIndexOf('"')),
    };
  }

  function parseMenu(menu) {
    let marr = menu.split("\n");
    // funny way to get non empty elements
    marr = marr.filter((item) => item);
    marr = marr.map((item) => getLabelAndContent(item));
    return marr;
  }

  function handleSelectOption(option) {
    if (!option) return;
    goto(option.label);
    onComplete();
  }

  function moveHighlight(delta) {
    const count = menuOptions.length;
    if (count === 0) return;
    highlighted = (highlighted + delta + count) % count;
  }

  onMount(() => {
    function handleNavKeys(e) {
      {
        if (e.key === "ArrowDown") {
          moveHighlight(1);
        } else if (e.key === "ArrowUp") {
          moveHighlight(-1);
        }
        else if (e.key === "Enter") {
          handleSelectOption(menuOptions[highlighted])
        }
      }
    }
    document.addEventListener("keydown", handleNavKeys);
    return () => {document.removeEventListener("keydown", handleNavKeys)};
  });

</script>
{#if showBack}
<button class="inlineBtn" on:click={() => {prevMenu(); onComplete()}}>← Back</button>
{/if}
<div>
  <h4>{title}</h4>
  {#each menuOptions as option, i}
    <!-- Enter is handled by the document-level handler above; swallow it here
         so a focused option doesn't get selected twice -->
    <a
      on:mouseover={() => (highlighted = i)}
      on:focus={() => (highlighted = i)}
      on:keydown={(e) => {
        if (e.key === "Enter") e.stopPropagation();
      }}
      id="menuOption"
      tabindex="0"
      role="button"
      class="inlineBtn"
      class:highlighted={highlighted === i}
      on:click|preventDefault={() => {
        handleSelectOption(option);
      }}><b>{option.content}</b></a
    >
  {/each}
</div>

<style>
  #menuOption {
    display: block;
    white-space: pre;
    font-family: monospace;
    font-size: 16px;
    cursor: pointer;
    outline: none;
  }
  .highlighted {
    color: #b0b4ff;
  }
</style>
