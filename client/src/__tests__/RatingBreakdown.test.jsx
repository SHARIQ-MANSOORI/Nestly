import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RatingBreakdown from '../components/RatingBreakdown';

describe('RatingBreakdown Component Unit Tests', () => {
  const sampleProps = {
    averageRating: 4.5,
    reviewCount: 20,
    breakdown: { 5: 12, 4: 5, 3: 2, 2: 1, 1: 0 },
    categoryRatings: { cleanliness: 4.8, location: 4.7, service: 4.2, value: 4.3 },
  };

  it('should render average rating, review count, and star distribution bars', () => {
    render(<RatingBreakdown {...sampleProps} />);

    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('20 Verified Reviews')).toBeInTheDocument();
    expect(screen.getByText('Cleanliness')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('★ 4.8')).toBeInTheDocument();
  });
});
