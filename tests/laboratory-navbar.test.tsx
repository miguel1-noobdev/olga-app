import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LaboratoryNavbar from '@/components/laboratorio/laboratory-navbar';

const { signOutMock, usePathnameMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  usePathnameMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signOut: signOutMock,
}));

vi.mock('next/navigation', () => ({
  usePathname: usePathnameMock,
}));

describe('LaboratoryNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue('/laboratorio/formulas');
  });

  it('marks the Fórmulas route as active', () => {
    render(<LaboratoryNavbar />);

    const formulasLink = screen.getByRole('link', { name: /fórmulas/i });
    expect(formulasLink).toHaveAttribute('aria-current', 'page');
    expect(formulasLink).toHaveClass('text-primary', 'border-primary', 'border-b-2');
  });

  it('does not mark a formula link active on the laboratory dashboard', () => {
    usePathnameMock.mockReturnValue('/laboratorio');
    render(<LaboratoryNavbar />);

    const formulasLink = screen.getByRole('link', { name: /fórmulas/i });
    expect(formulasLink).not.toHaveAttribute('aria-current');
    expect(formulasLink).toHaveClass('text-on-surface-variant');
    expect(formulasLink).not.toHaveClass('border-primary', 'border-b-2');
  });

  it('marks Mi jardín as the active desktop destination on the canonical garden route', () => {
    usePathnameMock.mockReturnValue('/laboratorio/plantas');

    render(<LaboratoryNavbar />);

    const gardenLink = screen.getAllByRole('link', { name: /mi jardín/i })[0];
    expect(gardenLink).toHaveAttribute('aria-current', 'page');
    expect(gardenLink).toHaveClass('text-primary', 'border-primary', 'border-b-2');
  });

  it('opens the mobile menu, exposes its links, and closes after navigation', async () => {
    const user = userEvent.setup();
    render(<LaboratoryNavbar />);

    const navigation = screen.getByRole('navigation');
    const menuButton = screen.getByRole('button', { name: /toggle navigation/i });

    expect(navigation).toHaveClass('relative');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'laboratory-mobile-navigation');
    expect(screen.queryByRole('navigation', { name: /navegación móvil del laboratorio/i })).not.toBeInTheDocument();

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    const mobileMenu = screen.getByRole('navigation', { name: /navegación móvil del laboratorio/i });
    expect(within(mobileMenu).getByRole('link', { name: /fórmulas/i })).toHaveAttribute(
      'href',
      '/laboratorio/formulas'
    );
    expect(within(mobileMenu).getByRole('link', { name: /lotes/i })).toHaveAttribute(
      'href',
      '/laboratorio/lotes'
    );
    expect(within(mobileMenu).getByRole('link', { name: /mi jardín/i })).toHaveAttribute(
      'href',
      '/laboratorio/plantas'
    );
    expect(within(mobileMenu).getByRole('link', { name: /mis aceites/i })).toHaveAttribute(
      'href',
      '/laboratorio/aceites'
    );

    await user.click(within(mobileMenu).getByRole('link', { name: /fórmulas/i }));

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: /navegación móvil del laboratorio/i })).not.toBeInTheDocument();
  });

  it('closes the mobile menu when the toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(<LaboratoryNavbar />);

    const menuButton = screen.getByRole('button', { name: /toggle navigation/i });

    await user.click(menuButton);
    expect(screen.getByRole('navigation', { name: /navegación móvil del laboratorio/i })).toBeInTheDocument();

    await user.click(menuButton);

    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: /navegación móvil del laboratorio/i })).not.toBeInTheDocument();
  });
});
