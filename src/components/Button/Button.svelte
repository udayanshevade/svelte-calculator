<script lang="ts">
  export let text: string;
  export let id: string;
  export let className: string;
  export let title: string;
  export let value: string | number = null;
  export let onClick: (e: MouseEvent) => void | Promise<void>;
</script>

<button
  id={id}
  class={className}
  title={title}
  value={value}
  on:click={onClick}
>
  {text}
</button>
