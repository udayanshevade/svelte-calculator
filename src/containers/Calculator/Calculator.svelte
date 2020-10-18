<script lang="ts">
  import Button from '../../components/Button/Button.svelte';
  let onClick = () => {};
</script>

<section>
  <Button
    id="equals-button"
    title="equals"
    className="button button--equals"
    text="="
    onClick={onClick}
  />
</section>