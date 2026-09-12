<!-- Display area for B/T/I commands -->

<script>
  import { DRILL } from "../constants/constants";
  import { instruction, title } from "../stores/textstore";
  import { backToMenu, canBackToMenu } from "../parser/script";
  export let onComplete;
  // action passed as prop to hide Nav during drills
  export let action;

  $: showBack = action && canBackToMenu();
</script>

{#if showBack}
  <button
    class="inlineBtn"
    on:click={() => {
      backToMenu();
      onComplete();
    }}>← Back</button
  >
{/if}
<div>
  <h4 id="btiTitle">{$title}</h4>
  {#if $instruction}
    <div id="bti">
      {$instruction.trim()}
    </div>
  {/if}
</div>
{#if action && action.type !== DRILL}
  <div id="nav">
    <button class="inlineBtn" on:click={onComplete}>Next (N) → </button>
  </div>
{/if}

<style>
  #btiTitle {
    margin: 0.5rem 0;
  }
  #bti {
    white-space: pre;
    font-family: monospace;
    font-size: 14px;
  }
  #nav {
    display: flex;
    justify-content: right;
  }
</style>
