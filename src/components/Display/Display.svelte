<script lang="ts">
  export let displayValue = '';
  export let warning = null;
</script>

<style>
  .display-container {
    border-top-left-radius: 1rem;
    border-top-right-radius: 1rem;
    height: 6rem;
    max-width: 100%;
    border-bottom: 1px solid #222;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    overflow-y: auto;
  }

  .display-inner {
    padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  }

  .display {
    font-size: 1.6rem;
    color: #fff;
    text-align: right;
    width: 100%;
    word-break: break-word;
  }
</style>

<section class="display-container" role="region">
  <div class="display-inner">
    <div class="display">{warning || displayValue}</div>
  </div>
</section>
