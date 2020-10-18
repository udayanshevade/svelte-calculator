import { render, screen } from '@testing-library/svelte';
import Display from './Display.svelte';

describe('Display', () => {
  it('renders the latest value correctly', () => {
    const displayValue = 'foo';
    render(Display, { displayValue });
    expect(screen.getByRole('region')).toBeInTheDocument();
    expect(screen.getByText(displayValue)).toBeInTheDocument();
  });
});
