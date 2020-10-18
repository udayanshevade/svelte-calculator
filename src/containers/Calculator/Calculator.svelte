<script lang="ts">
  import Button from '../../components/Button/Button.svelte';

  const handleButtonClick = (buttonType: number | string) => {
    // TODO: handle button click
    console.log(buttonType);
  };
</script>

<section class="calculator">
  {#each config as rowConfig}
    <div class="row">
      {#each rowConfig as { id, value, title, className, text } (id)}
        <Button
          id={id}
          title={title}
          className={`button ${className}`}
          text={text}
          value={value}
          onClick={() => handleButtonClick(value)}
        />
      {/each}
    </div>
  {/each}
</section>

<script lang="ts" context="module">
  export const config: {
    id: string,
    title: string,
    text?: string,
    value: number | string,
    className?: string
  }[][] = [
    [
      {
        id: 'clear',
        title: 'Clear',
        value: 'clear'
      }
    ],
    [
      {
        id: 'seven',
        title: 'Seven',
        text: '7',
        value: 7
      },
      {
        id: 'eight',
        title: 'Eight',
        text: '8',
        value: 8
      },
      {
        id: 'nine',
        title: 'Nine',
        text: '9',
        value: 9
      },
      {
        id: 'divide',
        title: 'Divide',
        text: '/',
        value: '/'
      }
    ],
    [
      {
        id: 'four',
        title: 'Four',
        text: '4',
        value: 4
      },
      {
        id: 'five',
        title: 'Five',
        text: '5',
        value: 5
      },
      {
        id: 'six',
        title: 'Six',
        text: '6',
        value: 6
      },
      {
        id: 'multiply',
        title: 'Multiply',
        text: '*',
        value: '*'
      }
    ],
    [
      {
        id: 'one',
        title: 'One',
        text: '1',
        value: 1
      },
      {
        id: 'two',
        title: 'Two',
        text: '2',
        value: 2
      },
      {
        id: 'three',
        title: 'Three',
        text: '3',
        value: 3
      },
      {
        id: 'subtract',
        title: 'Subtract',
        text: '-',
        value: '-'
      }
    ],
    [
      {
        id: 'zero',
        title: 'Zero',
        text: '0',
        value: 0
      },
      {
        id: 'decimal',
        title: 'Decimal',
        text: '.',
        value: '.'
      },
      {
        id: 'equals',
        title: 'Equals',
        className: 'button--equals',
        text: '=',
        value: '='
      },
      {
        id: 'add',
        title: 'Add',
        text: '+',
        value: '+'
      }
    ]
  ];
</script>
