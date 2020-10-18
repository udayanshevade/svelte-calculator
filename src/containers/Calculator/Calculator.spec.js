import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Calculator from './Calculator.svelte';

describe('Calculator', () => {
  it('renders correctly', () => {
    render(Calculator);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
