import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Button from './Button.svelte';

const mockProps = {
  id: 'submit-btn',
  className: 'btn',
  title: 'submit',
  value: 'foo',
  text: 'submit',
  onClick: jest.fn(),
};

describe('Button', () => {
  beforeEach(() => {
    mockProps.onClick.mockClear();
  });

  it('renders correctly', () => {
    const { id, title, className, text, value } = mockProps;
    render(Button, mockProps);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    expect(button).toHaveAttribute('id', id);
    expect(button).toHaveAttribute('title', title);
    expect(button).toHaveClass(className);
    expect(button).toHaveValue(value);
    expect(button).toHaveTextContent(text);
  });

  it('reacts to being clicked', () => {
    const { onClick } = mockProps;
    render(Button, mockProps);
    const button = screen.getByRole('button');
    userEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });
});
