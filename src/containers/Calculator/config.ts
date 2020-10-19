type ButtonConfig = {
  id: string;
  title: string;
  text: string;
  value: number | string;
  className?: string;
};

type RowConfig = {
  config: ButtonConfig[];
  className?: string;
};

export const config: RowConfig[] = [
  {
    className: 'row--full',
    config: [{ id: 'clear', title: 'Clear', text: 'AC', value: 'clear' }],
  },
  {
    config: [
      { id: 'seven', title: 'Seven', text: '7', value: 7 },
      { id: 'eight', title: 'Eight', text: '8', value: 8 },
      { id: 'nine', title: 'Nine', text: '9', value: 9 },
      { id: 'divide', title: 'Divide', text: '/', value: '/' },
    ],
  },
  {
    config: [
      { id: 'four', title: 'Four', text: '4', value: 4 },
      { id: 'five', title: 'Five', text: '5', value: 5 },
      { id: 'six', title: 'Six', text: '6', value: 6 },
      { id: 'multiply', title: 'Multiply', text: '*', value: '*' },
    ],
  },
  {
    config: [
      { id: 'one', title: 'One', text: '1', value: 1 },
      { id: 'two', title: 'Two', text: '2', value: 2 },
      { id: 'three', title: 'Three', text: '3', value: 3 },
      { id: 'subtract', title: 'Subtract', text: '-', value: '-' },
    ],
  },
  {
    config: [
      { id: 'zero', title: 'Zero', text: '0', value: 0 },
      { id: 'decimal', title: 'Decimal', text: '.', value: '.' },
      {
        id: 'equals',
        title: 'Equals',
        text: '=',
        value: '=',
        className: 'button--equals',
      },
      { id: 'add', title: 'Add', text: '+', value: '+' },
    ],
  },
];
