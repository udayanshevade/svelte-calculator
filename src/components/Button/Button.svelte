<script lang="ts">
  import classnames from 'classnames';
  export let text: string;
  export let id: string;
  export let className: string;
  export let title: string;
  export let value: string | number = null;
  export let onClick: (e: MouseEvent) => void | Promise<void>;

  export let highlighted = false;
</script>

<style>
  .button {
    height: 3.6rem;
    width: 3.6rem;
    margin: 0 0 0.5rem 0;
    background: #333;
    color: #fff;
    font-weight: lighter;
    border-radius: 0.2rem;
    border: 1px solid #2222;
    box-shadow: 3px 5px 8px rgba(0, 0, 0, 0.3);
    user-select: none;
    transition: background 0.12s ease-in-out;
  }
  .button:active,
  .button.highlighted {
    box-shadow: 1px 3px 6px rgba(0, 0, 0, 0.3);
    background: #555;
  }

  .button:hover {
    cursor: pointer;
    background: #3a3a3a;
    box-shadow: 2px 4px 5px rgba(0, 0, 0, 0.4);
  }
</style>

<button
  {id}
  class={classnames('button', className, highlighted && 'highlighted')}
  {title}
  {value}
  on:click={onClick}>
  {text}
</button>
