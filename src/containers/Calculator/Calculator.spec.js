import { render, screen } from '@testing-library/svelte';
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
      if (text) {
        expect(button).toHaveTextContent(text);
      }
      expect(button).toHaveAttribute('title', title);
      expect(button).toHaveValue(String(value));
    });
  });
});
