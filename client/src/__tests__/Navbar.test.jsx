import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../components/Navbar';
import * as authHook from '../hooks/useAuth';

describe('Navbar Component Unit Tests', () => {
  it('should render brand logo and public navigation links for unauthenticated guest', () => {
    vi.spyOn(authHook, 'default').mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Nestly')).toBeInTheDocument();
    expect(screen.getByText('Explore Hotels')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('should render Customer navigation links for logged-in customer', () => {
    vi.spyOn(authHook, 'default').mockReturnValue({
      user: { name: 'Alice Customer', role: 'customer', email: 'alice@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('My Bookings')).toBeInTheDocument();
    expect(screen.getByText('Alice Customer')).toBeInTheDocument();
  });

  it('should render Manager role label for logged-in manager', () => {
    vi.spyOn(authHook, 'default').mockReturnValue({
      user: { name: 'Alex Manager', role: 'manager', email: 'alex@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Alex Manager')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  it('should render Admin role label for logged-in admin', () => {
    vi.spyOn(authHook, 'default').mockReturnValue({
      user: { name: 'Charlie Admin', role: 'admin', email: 'admin@test.com' },
      isAuthenticated: true,
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByText('Charlie Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
