import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Calculator, { config } from './Calculator.svelte';

describe('Calculator', () => {
  // list of all button config objects
  const buttonsData = config.flatMap(rowConfig => rowConfig);

  it('renders correctly', () => {
    render(Calculator);

    const display = screen.getByRole('region');
    expect(display).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(buttonsData.length);
    buttons.forEach((button, i) => {
      const { text, title, value } = buttonsData[i];
      expect(button).toHaveTextContent(text);
      expect(button).toHaveAttribute('title', title);
      expect(button).toHaveValue(String(value));
    });
  });

  describe('handles the stack correctly', () => {
    it('renders consecutive clicked numbers', async () => {
      render(Calculator);
      const display = screen.getByRole('region');

      const buttonOne = screen.getByText('1');
      // click button 2 times, i.e. produce display '11'
      userEvent.click(buttonOne);
      userEvent.click(buttonOne);

      await waitFor(() => expect(display).toHaveTextContent('11'));

      const buttonTwo = screen.getByText('2');
      // click button 2 times, i.e. produce display '22'
      userEvent.click(buttonTwo);
      userEvent.click(buttonTwo);

      await waitFor(() => expect(display).toHaveTextContent('1122'));
    });

    it('empties the display when the clear button is clicked', async () => {
      render(Calculator);
      const display = screen.getByRole('region');

      const buttonOne = screen.getByText('1');
      // click button 5 times, i.e. produce display '11111'
      new Array(5).fill(null).forEach(() => {
        userEvent.click(buttonOne);
      });

      await waitFor(() => expect(display).toHaveTextContent('11111'));

      const buttonClear = screen.getByText('AC');
      userEvent.click(buttonClear);

      await waitFor(() => expect(display).toHaveTextContent(''));
    });

    it('handles alternating inputs', async () => {
      render(Calculator);
      const display = screen.getByRole('region');

      const inputs = [
        '1',
        '+',
        '2',
        '*',
        '3',
        '-',
        '4',
        '/',
        '5'
      ];
      const output = '1 + 2 * 3 - 4 / 5';
      inputs.forEach(input => {
        userEvent.click(screen.getByText(input));
      });
      await waitFor(() => expect(display).toHaveTextContent(output));
    });
  });
});
