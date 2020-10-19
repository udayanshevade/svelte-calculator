import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { config } from './config';
import Calculator, { computeValue } from './Calculator.svelte';

// inputs should specify the text of the pressed button, not its value
// e.g. ['1', '2', 'AC'] not [1, 2, 'clear']
const applyInputs = (inputs) => {
  inputs.forEach((input) => {
    userEvent.click(screen.getByText(input, { selector: 'button' }));
  });
};

describe('Calculator', () => {
  // list of all button config objects
  const buttonsData = config.flatMap(({ config: rowConfig }) => rowConfig);

  it('renders correctly', () => {
    render(Calculator);

    const display = screen.getByRole('region');
    expect(display).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(buttonsData.flatMap((x) => x).length);
    buttons.forEach((button, i) => {
      const { text, title, value } = buttonsData[i];
      expect(button).toHaveTextContent(text);
      expect(button).toHaveAttribute('title', title);
      expect(button).toHaveValue(String(value));
    });
  });

  it('display renders an initial value', () => {
    render(Calculator);
    const display = screen.getByRole('region');
    expect(display).toHaveTextContent('0');
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

      await waitFor(() => expect(display).toHaveTextContent('0'));
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

    it('handles a negative value', async () => {
      render(Calculator);
      const display = screen.getByRole('region');
      const inputs = ['1', '+', '-', '2', '*', '3', '-', '4', '/', '5'];
      const output = '1 + -2 * 3 - 4 / 5';
      applyInputs(inputs);
      await waitFor(() => expect(display).toHaveTextContent(output));
    });

    it('ignores consecutive 0s at the start of a value but not otherwise', async () => {
      render(Calculator);
      const display = screen.getByRole('region');
      // note: formatting as list of lists for readability
      const inputs = [
        ['0', '0'],
        ['+'],
        ['2', '0', '0'],
        ['-'],
        ['0', '0', '.', '0', '0', '2'],
      ].flatMap((x) => x);
      const output = '0 + 200 - 0.002';
      applyInputs(inputs);
      await waitFor(() => expect(display).toHaveTextContent(output));
    });

    it('renders the result if the equals sign is clicked', async () => {
      render(Calculator);
      const display = screen.getByRole('region');
      // note: formatting as list of lists for readability
      const inputs = [
        ['1', '2', '3'],
        ['*'],
        ['-', '0', '.', '4'],
        ['+'],
        ['1', '9'],
        ['/'],
        ['4', '3'],
        ['+'],
        ['5', '6', '.'],
        ['='],
      ].flatMap((x) => x);
      const output = '123 * -0.4 + 19 / 43 + 56. = 55.2976744186';
      applyInputs(inputs);
      await waitFor(() => expect(display).toHaveTextContent(output));
    });

    describe('flushes the stack once a final value is computed', () => {
      it('with a new number', async () => {
        render(Calculator);
        const display = screen.getByRole('region');
        // note: formatting as list of lists for readability
        const inputs = [
          ['1', '2', '3'],
          ['*'],
          ['-', '0', '.', '4'],
          ['='],
          ['5'],
        ].flatMap((x) => x);
        const output = '5';
        applyInputs(inputs);
        await waitFor(() => expect(display).toHaveTextContent(output));
      });

      it('with an operator', async () => {
        render(Calculator);
        const display = screen.getByRole('region');
        // note: formatting as list of lists for readability
        const inputs = [
          ['1', '2', '3'],
          ['*'],
          ['-', '0', '.', '4'],
          ['='],
          ['/'],
        ].flatMap((x) => x);
        const output = '-49.2 /';
        applyInputs(inputs);
        await waitFor(() => expect(display).toHaveTextContent(output));
      });
    });
  });

  describe('handles keydown correctly', () => {
    it('for numbers', async () => {
      render(Calculator);
      const display = screen.getByRole('region');
      userEvent.type(display, '12345');
      await waitFor(() => expect(display).toHaveTextContent('12345'));
    });
    it('for operators', async () => {
      render(Calculator);
      const display = screen.getByRole('region');
      userEvent.type(display, '1*2-3+4/5=');
      await waitFor(() =>
        expect(display).toHaveTextContent('1 * 2 - 3 + 4 / 5 = 0.6')
      );
    });
    it('for extra keys', async () => {
      render(Calculator);
      const display = screen.getByRole('region');
      userEvent.type(display, '1*2-3+4/5{enter}');
      await waitFor(() =>
        expect(display).toHaveTextContent('1 * 2 - 3 + 4 / 5 = 0.6')
      );
      userEvent.type(display, '{escape}');
      await waitFor(() => expect(display).toHaveTextContent('0'));
    });
    it('animates pressed key', async () => {
      render(Calculator);
      const display = screen.getByRole('region');
      const button = screen.getByText('5', { selector: 'button' });
      userEvent.type(display, '5');
      await waitFor(() =>
        expect(button).not.toHaveStyle({ background: '#333' })
      );
    });
  });

  it('method evaluates a stack output correctly', () => {
    const stack = [123, '*', -0.4, '+', 19, '/', 43, '+', '56.'];
    expect(computeValue(stack)).toEqual(55.2976744186);
  });
});
