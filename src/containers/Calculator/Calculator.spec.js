import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Calculator, { config } from './Calculator.svelte';

const applyInputs = inputs => {
  inputs.forEach(input => {
    userEvent.click(screen.getByText(input));
  });
};

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

      // click button 2 times, i.e. produce display '11'
      applyInputs(['1', '1']);

      await waitFor(() => expect(display).toHaveTextContent('11'));

      // click button 2 times, i.e. produce display '22'
      applyInputs(['2', '2']);

      await waitFor(() => expect(display).toHaveTextContent('1122'));
    });

    it('empties the display when the clear button is clicked', async () => {
      render(Calculator);
      const display = screen.getByRole('region');

      const buttonOne = screen.getByText('1');
      // click button 5 times, i.e. produce display '11111'
      applyInputs(new Array(5).fill('1'));

      await waitFor(() => expect(display).toHaveTextContent('11111'));

      applyInputs(['AC']);

      await waitFor(() => expect(display).toHaveTextContent(''));
    });

    it('handles alternating inputs', async () => {
      render(Calculator);
      const display = screen.getByRole('region');

      const inputs = ['1', '+', '2', '*', '3', '-', '4', '/', '5'];
      const output = '1 + 2 * 3 - 4 / 5';
      applyInputs(inputs);
      await waitFor(() => expect(display).toHaveTextContent(output));
    });

    describe('when the user adds a decimal', () => {
      it('converts a number to a decimal', async () => {
        render(Calculator);
        const display = screen.getByRole('region');

        const inputs = ['1', '2', '.', '3', '4'];
        const output = '12.34';
        applyInputs(inputs);
        await waitFor(() => expect(display).toHaveTextContent(output));
      });

      describe('does nothing if the number is already a decimal', () => {
        it('with a trailing decimal point', async () => {
          render(Calculator);
          const display = screen.getByRole('region');

          const inputs = ['1', '2', '.', '.'];
          const output = '12.';
          applyInputs(inputs);
          await waitFor(() => expect(display).toHaveTextContent(output));
        });

        it('with a decimal point in the middle of the number', async () => {
          render(Calculator);
          const display = screen.getByRole('region');

          const inputs = ['1', '2', '.', '3', '4', '.'];
          const output = '12.34';
          applyInputs(inputs);
          await waitFor(() => expect(display).toHaveTextContent(output));
        });
      });
    });
  });
});
