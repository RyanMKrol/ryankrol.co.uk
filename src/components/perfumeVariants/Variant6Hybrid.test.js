import { render, screen, fireEvent } from '@testing-library/react';
import Variant6Hybrid, { formatApplicationSpotLine } from './Variant6Hybrid';

describe('formatApplicationSpotLine', () => {
  it.each([
    ['Wrists', '1 spray each — Wrists'],
    ['Elbows', '1 spray each — Elbows'],
    ['Clavicles', '1 spray each — Clavicles'],
    ['Behind ears', '1 spray each — Behind ears'],
    ['Beard', '1 spray — Beard'],
    ['Back of neck', '1 spray — Back of neck'],
    ['Clothes', '1 spray — Clothes'],
  ])('at sprays === 1, %s renders "%s"', (spot, expected) => {
    expect(formatApplicationSpotLine({ spot, sprays: 1 })).toBe(expected);
  });

  it('renders plural sprays unchanged with no "each" appended', () => {
    expect(formatApplicationSpotLine({ spot: 'Wrists', sprays: 2 })).toBe(
      '2 sprays — Wrists',
    );
  });
});

describe('Variant6Hybrid', () => {
  const mockPerfume = {
    id: 'test-id',
    title: 'Test Perfume',
    designer: 'Test Designer',
    rating: 8,
    type: 'EDP',
    date: '01-01-2026',
  };

  it('renders designer as a button when onDesignerClick is provided', () => {
    const mockClick = jest.fn();
    render(
      <Variant6Hybrid item={mockPerfume} onDesignerClick={mockClick} />,
    );

    const button = screen.getByRole('button', { name: /Test Designer/ });
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('calls onDesignerClick with the designer name when clicked', () => {
    const mockClick = jest.fn();
    render(
      <Variant6Hybrid item={mockPerfume} onDesignerClick={mockClick} />,
    );

    const button = screen.getByRole('button', { name: /Test Designer/ });
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalledWith('Test Designer');
    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  it('renders designer as plain text when onDesignerClick is not provided', () => {
    render(<Variant6Hybrid item={mockPerfume} />);

    // Should not be a button when no callback
    const button = screen.queryByRole('button', { name: /Test Designer/ });
    expect(button).not.toBeInTheDocument();

    // Designer text should still be rendered
    expect(screen.getByText('Test Designer')).toBeInTheDocument();
  });

  it('renders designer as plain text when designer is missing', () => {
    const mockClick = jest.fn();
    const perfumeNoDesigner = { ...mockPerfume, designer: null };
    render(
      <Variant6Hybrid item={perfumeNoDesigner} onDesignerClick={mockClick} />,
    );

    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('renders markdown (bold, italic, link) in the description as real elements, not raw syntax', () => {
    const perfumeWithDescription = {
      ...mockPerfume,
      description:
        'Opens with **bergamot** and dries down to something *warmer*. See [Fragrantica](https://www.fragrantica.com).',
    };
    render(<Variant6Hybrid item={perfumeWithDescription} />);

    expect(screen.getByText('bergamot').tagName).toBe('STRONG');
    expect(screen.getByText('warmer').tagName).toBe('EM');
    const link = screen.getByText('Fragrantica');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://www.fragrantica.com');
    expect(screen.queryByText(/\*\*bergamot\*\*/)).toBeNull();
  });
});
