import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewCard from '../components/ReviewCard';

// Mock useAuth hook
vi.mock('../hooks/useAuth', () => ({
  default: () => ({
    user: { _id: 'user456', name: 'Test User' },
  }),
}));

describe('ReviewCard Component Unit Tests', () => {
  const sampleReview = {
    _id: 'rev123',
    user: { _id: 'user123', name: 'John Customer', profileImage: '' },
    rating: 5,
    title: 'Immaculate Resort',
    comment: 'The ocean view from the balcony was unforgettable.',
    isVerifiedStay: true,
    createdAt: '2026-08-10T12:00:00Z',
    managerResponse: {
      comment: 'Thank you for your review!',
      respondedAt: '2026-08-11T10:00:00Z',
    },
  };

  it('should render review author, verified stay badge, comment, and manager response', () => {
    render(<ReviewCard review={sampleReview} onReportSuccess={vi.fn()} />);

    expect(screen.getByText('John Customer')).toBeInTheDocument();
    expect(screen.getByText('Verified Stay')).toBeInTheDocument();
    expect(screen.getByText('Immaculate Resort')).toBeInTheDocument();
    expect(screen.getByText('The ocean view from the balcony was unforgettable.')).toBeInTheDocument();
    expect(screen.getByText('Response from Property Management')).toBeInTheDocument();
    expect(screen.getByText('"Thank you for your review!"')).toBeInTheDocument();
  });
});
